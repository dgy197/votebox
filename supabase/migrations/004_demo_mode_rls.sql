-- VoteBox v2 Migration: Demo Mode RLS Fix
-- Ez a migráció lehetővé teszi demo módban a szervezet/esemény létrehozását
-- FONTOS: Élesben érdemes ezeket a policy-kat szigorítani!

-- ============================================
-- 1. ORGANIZATIONS - Demo mód támogatás
-- ============================================

-- Anon users (demo mode) létrehozhatnak szervezetet
DROP POLICY IF EXISTS "Anon users can create organizations in demo mode" ON organizations;
CREATE POLICY "Anon users can create organizations in demo mode"
  ON organizations FOR INSERT
  WITH CHECK (
    -- Demo mód esetén engedélyezett (nincs auth)
    auth.uid() IS NULL
    OR
    -- Bejelentkezett user-ek is létrehozhatnak
    auth.uid() IS NOT NULL
  );

-- Anon users olvashatják a szervezeteket demo módban
DROP POLICY IF EXISTS "Anon users can view organizations in demo mode" ON organizations;
CREATE POLICY "Anon users can view organizations in demo mode"
  ON organizations FOR SELECT
  USING (
    -- Demo szervezetet mindenki láthatja
    settings->>'demo' = 'true'
    OR
    -- Saját szervezet (ha be van jelentkezve)
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = organizations.id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    -- Super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
    OR
    -- Demo mód - nincs auth
    auth.uid() IS NULL
  );

-- Anon users frissíthetik a demo szervezeteket
DROP POLICY IF EXISTS "Anon users can update demo organizations" ON organizations;
CREATE POLICY "Anon users can update demo organizations"
  ON organizations FOR UPDATE
  USING (
    settings->>'demo' = 'true'
    OR auth.uid() IS NULL
  )
  WITH CHECK (
    settings->>'demo' = 'true'
    OR auth.uid() IS NULL
  );

-- ============================================
-- 2. EVENTS - Demo mód támogatás
-- ============================================

-- Anon users létrehozhatnak eseményt demo módban
DROP POLICY IF EXISTS "Anon users can create events in demo mode" ON events;
CREATE POLICY "Anon users can create events in demo mode"
  ON events FOR INSERT
  WITH CHECK (
    -- Demo mód (nincs auth)
    auth.uid() IS NULL
    OR
    -- Bejelentkezett user saját szervezetének
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = events.organization_id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    -- Super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Anon users olvashatják az eseményeket demo módban
DROP POLICY IF EXISTS "Anon users can view events in demo mode" ON events;
CREATE POLICY "Anon users can view events in demo mode"
  ON events FOR SELECT
  USING (
    -- Publikus események (aktív/scheduled)
    state IN ('scheduled', 'active')
    OR
    -- Demo mód
    auth.uid() IS NULL
    OR
    -- Saját szervezet
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = events.organization_id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    -- Super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Anon users frissíthetik az eseményeket demo módban
DROP POLICY IF EXISTS "Anon users can update events in demo mode" ON events;
CREATE POLICY "Anon users can update events in demo mode"
  ON events FOR UPDATE
  USING (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = events.organization_id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = events.organization_id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Anon users törölhetik az eseményeket demo módban
DROP POLICY IF EXISTS "Anon users can delete events in demo mode" ON events;
CREATE POLICY "Anon users can delete events in demo mode"
  ON events FOR DELETE
  USING (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.org_id = events.organization_id
      AND user_organizations.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 3. QUESTIONS - Demo mód támogatás
-- ============================================

DROP POLICY IF EXISTS "Anon users can manage questions in demo mode" ON questions;
CREATE POLICY "Anon users can manage questions in demo mode"
  ON questions FOR ALL
  USING (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_organizations uo ON uo.org_id = e.organization_id
      WHERE e.id = questions.event_id
      AND uo.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_organizations uo ON uo.org_id = e.organization_id
      WHERE e.id = questions.event_id
      AND uo.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 4. PARTICIPANTS - Demo mód támogatás
-- ============================================

DROP POLICY IF EXISTS "Anon users can manage participants in demo mode" ON participants;
CREATE POLICY "Anon users can manage participants in demo mode"
  ON participants FOR ALL
  USING (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_organizations uo ON uo.org_id = e.organization_id
      WHERE e.id = participants.event_id
      AND uo.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_organizations uo ON uo.org_id = e.organization_id
      WHERE e.id = participants.event_id
      AND uo.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 5. USERS - Demo mód támogatás
-- ============================================

DROP POLICY IF EXISTS "Anon users can view users in demo mode" ON users;
CREATE POLICY "Anon users can view users in demo mode"
  ON users FOR SELECT
  USING (
    auth.uid() IS NULL
    OR id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- ============================================
-- KÉSZ!
-- ============================================
