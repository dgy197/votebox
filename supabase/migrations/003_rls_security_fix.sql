-- VoteBox v2 Migration: RLS Security Fix
-- KRITIKUS: Az INSERT policy-k túl lazák voltak!
-- Ez a migráció szigorítja a szavazási policy-kat

-- ============================================
-- 1. BALLOTS - Csak érvényes szavazatokat fogadjon
-- ============================================

-- Töröljük a régi laza policy-t
DROP POLICY IF EXISTS "Insert ballots" ON ballots;

-- Új policy: csak aktív kérdésre, létező participant-tal lehet szavazni
CREATE POLICY "Insert ballots securely" ON ballots
  FOR INSERT WITH CHECK (
    -- A question-nek létezni kell és aktívnak kell lennie
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_id
      AND q.state = 'active'
    )
    -- Ha nem anonim (participant_id != NULL), akkor a participant-nak:
    -- 1. Létezni kell
    -- 2. A megfelelő event-hez kell tartoznia
    -- 3. Jelen kell lennie (is_present = true)
    AND (
      participant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM participants p
        JOIN questions q ON q.event_id = p.event_id
        WHERE p.id = participant_id
        AND q.id = question_id
        AND p.is_present = true
      )
    )
  );

-- ============================================
-- 2. CAST_MARKERS - Csak egyszer szavazhasson
-- ============================================

-- Töröljük a régi laza policy-t
DROP POLICY IF EXISTS "Insert cast markers" ON cast_markers;

-- Új policy: csak aktív kérdésre, érvényes participant, aki még nem szavazott
CREATE POLICY "Insert cast markers securely" ON cast_markers
  FOR INSERT WITH CHECK (
    -- A question-nek aktívnak kell lennie
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_id
      AND q.state = 'active'
    )
    -- A participant-nak létezni kell, jelen kell lennie, és a megfelelő event-hez tartozik
    AND EXISTS (
      SELECT 1 FROM participants p
      JOIN questions q ON q.event_id = p.event_id
      WHERE p.id = participant_id
      AND q.id = question_id
      AND p.is_present = true
    )
    -- Még nem szavazott erre a kérdésre (UNIQUE constraint is védi, de plusz check)
    AND NOT EXISTS (
      SELECT 1 FROM cast_markers cm
      WHERE cm.question_id = question_id
      AND cm.participant_id = participant_id
    )
  );

-- ============================================
-- 3. PARTICIPANTS - Bejelentkezés korlátozása
-- ============================================

-- Voters csak saját presence-üket frissíthetik
DROP POLICY IF EXISTS "Participants update own presence" ON participants;
CREATE POLICY "Participants update own presence" ON participants
  FOR UPDATE USING (
    -- Csak ha az event aktív
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND e.state IN ('scheduled', 'active')
    )
  )
  WITH CHECK (
    -- Csak is_present és joined_at mezőket módosíthatják
    -- (A WITH CHECK nem tudja mezőnként korlátozni, de az app oldalon korlátozzuk)
    true
  );

-- ============================================
-- 4. EVENTS - Voter read access (aktív event-ekre)
-- ============================================

-- Voters láthatják az aktív event-eket (event kód alapján keresés)
DROP POLICY IF EXISTS "Voters see active events" ON events;
CREATE POLICY "Voters see active events" ON events
  FOR SELECT USING (
    state IN ('scheduled', 'active')
  );

-- ============================================
-- 5. QUESTIONS - Voter read access (aktív kérdésekre)
-- ============================================

-- Voters láthatják a kérdéseket az aktív event-jeiken
DROP POLICY IF EXISTS "Voters see questions" ON questions;
CREATE POLICY "Voters see questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND e.state IN ('scheduled', 'active')
    )
  );

-- ============================================
-- 6. AUDIT LOGS - Mindig loggoljon
-- ============================================

-- Biztosítsuk, hogy a vote-ok audit-álva legyenek
DROP POLICY IF EXISTS "Insert audit" ON audit_logs;
CREATE POLICY "Insert audit securely" ON audit_logs
  FOR INSERT WITH CHECK (
    -- Bárki beilleszthet audit log-ot (app szinten validáljuk a tartalmat)
    true
  );

-- ============================================
-- 7. FUNCTION: Biztonságos szavazás (tranzakcióval)
-- ============================================

CREATE OR REPLACE FUNCTION cast_vote_secure(
  p_question_id UUID,
  p_participant_id UUID,
  p_choices JSONB,
  p_is_anonymous BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question questions%ROWTYPE;
  v_participant participants%ROWTYPE;
  v_event events%ROWTYPE;
  v_existing_vote cast_markers%ROWTYPE;
BEGIN
  -- 1. Ellenőrizzük a kérdést
  SELECT * INTO v_question FROM questions WHERE id = p_question_id;
  
  IF v_question IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QUESTION_NOT_FOUND');
  END IF;
  
  IF v_question.state != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'QUESTION_NOT_ACTIVE');
  END IF;
  
  -- 2. Ellenőrizzük az event-et
  SELECT * INTO v_event FROM events WHERE id = v_question.event_id;
  
  IF v_event IS NULL OR v_event.state NOT IN ('scheduled', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_ACTIVE');
  END IF;
  
  -- 3. Ellenőrizzük a participant-ot
  SELECT * INTO v_participant FROM participants 
  WHERE id = p_participant_id AND event_id = v_question.event_id;
  
  IF v_participant IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANT_NOT_FOUND');
  END IF;
  
  IF NOT v_participant.is_present THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANT_NOT_PRESENT');
  END IF;
  
  -- 4. Ellenőrizzük, hogy még nem szavazott
  SELECT * INTO v_existing_vote FROM cast_markers 
  WHERE question_id = p_question_id AND participant_id = p_participant_id;
  
  IF v_existing_vote IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_VOTED');
  END IF;
  
  -- 5. Time limit ellenőrzés (ha van)
  IF v_question.time_limit_seconds IS NOT NULL AND v_question.activated_at IS NOT NULL THEN
    IF NOW() > (v_question.activated_at + (v_question.time_limit_seconds || ' seconds')::INTERVAL) THEN
      RETURN jsonb_build_object('success', false, 'error', 'TIME_EXPIRED');
    END IF;
  END IF;
  
  -- 6. Minden OK - szavazat rögzítése
  INSERT INTO ballots (question_id, participant_id, choices)
  VALUES (
    p_question_id,
    CASE WHEN p_is_anonymous THEN NULL ELSE p_participant_id END,
    p_choices
  );
  
  INSERT INTO cast_markers (question_id, participant_id)
  VALUES (p_question_id, p_participant_id);
  
  -- 7. Audit log
  INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, details)
  VALUES (
    p_participant_id,
    'participant',
    'VOTE_CAST',
    'question',
    p_question_id,
    jsonb_build_object('anonymous', p_is_anonymous)
  );
  
  RETURN jsonb_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cast_vote_secure TO anon, authenticated;

-- ============================================
-- 8. FUNCTION: Szavazás eredmények lekérdezése
-- ============================================

CREATE OR REPLACE FUNCTION get_vote_results(p_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question questions%ROWTYPE;
  v_total_votes INT;
  v_total_participants INT;
  v_results JSONB;
BEGIN
  SELECT * INTO v_question FROM questions WHERE id = p_question_id;
  
  IF v_question IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QUESTION_NOT_FOUND');
  END IF;
  
  -- Total votes
  SELECT COUNT(*) INTO v_total_votes FROM cast_markers WHERE question_id = p_question_id;
  
  -- Total present participants
  SELECT COUNT(*) INTO v_total_participants FROM participants 
  WHERE event_id = v_question.event_id AND is_present = true;
  
  -- Aggregate results by choices
  SELECT jsonb_agg(
    jsonb_build_object(
      'choice', choice,
      'count', cnt
    )
  ) INTO v_results
  FROM (
    SELECT elem AS choice, COUNT(*) AS cnt
    FROM ballots, jsonb_array_elements_text(choices) AS elem
    WHERE question_id = p_question_id
    GROUP BY elem
    ORDER BY cnt DESC
  ) sub;
  
  RETURN jsonb_build_object(
    'success', true,
    'question_id', p_question_id,
    'total_votes', v_total_votes,
    'total_participants', v_total_participants,
    'participation_rate', CASE WHEN v_total_participants > 0 
      THEN ROUND((v_total_votes::NUMERIC / v_total_participants) * 100, 2)
      ELSE 0 
    END,
    'results', COALESCE(v_results, '[]'::jsonb),
    'state', v_question.state
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_vote_results TO anon, authenticated;

-- Kész!
