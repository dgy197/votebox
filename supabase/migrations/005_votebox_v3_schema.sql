-- VoteBox 3.0 - Komplett Gyűléskezelő Platform
-- Migration: 001_votebox_v3_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS - Szervezetek
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('condominium', 'company', 'association', 'cooperative', 'other')),
  -- condominium = társasház, company = cég, association = egyesület, cooperative = szövetkezet
  settings JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERS - Tagok
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  -- Súlyozás (társasház: tulajdoni hányad, cég: részvényarány)
  weight DECIMAL(10,4) DEFAULT 1.0,
  weight_label TEXT, -- pl. "A/1 lakás - 52m²" vagy "1000 db részvény"
  -- Szerepkör
  role TEXT NOT NULL DEFAULT 'voter' CHECK (role IN ('admin', 'chair', 'secretary', 'voter', 'observer')),
  -- admin = szervezet admin, chair = elnök, secretary = jegyzőkönyvvezető, voter = szavazó, observer = megfigyelő
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_org ON members(org_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_email ON members(email);

-- ============================================
-- PROXIES - Meghatalmazások
-- ============================================
CREATE TABLE IF NOT EXISTS proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  grantor_id UUID REFERENCES members(id) ON DELETE CASCADE, -- meghatalmazó
  grantee_id UUID REFERENCES members(id) ON DELETE CASCADE, -- meghatalmazott
  meeting_id UUID, -- ha NULL, akkor általános (később lesz FK)
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  document_url TEXT, -- feltöltött meghatalmazás
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEETINGS - Gyűlések
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'extraordinary', 'board')),
  -- regular = rendes, extraordinary = rendkívüli, board = igazgatósági
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduling', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  -- Időpont (ha már meg van határozva)
  scheduled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  -- Helyszín
  location TEXT,
  location_type TEXT DEFAULT 'hybrid' CHECK (location_type IN ('in_person', 'online', 'hybrid')),
  meeting_url TEXT, -- Teams/Meet/Zoom link
  -- Quorum
  quorum_type TEXT DEFAULT 'majority' CHECK (quorum_type IN ('majority', 'two_thirds', 'unanimous', 'custom')),
  quorum_percentage DECIMAL(5,2) DEFAULT 50.0,
  quorum_reached BOOLEAN DEFAULT false,
  -- Meeting bot
  recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  transcript TEXT,
  -- Meta
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_org ON meetings(org_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);

-- Add FK to proxies
ALTER TABLE proxies ADD CONSTRAINT fk_proxies_meeting 
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- ============================================
-- SCHEDULE_OPTIONS - Időpont opciók (Doodle)
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_options_meeting ON schedule_options(meeting_id);

-- ============================================
-- SCHEDULE_VOTES - Időpont szavazatok
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES schedule_options(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'maybe', 'no')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(option_id, member_id)
);

CREATE INDEX idx_schedule_votes_option ON schedule_votes(option_id);

-- ============================================
-- AGENDA_ITEMS - Napirendi pontok
-- ============================================
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  order_num INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Szavazás típusa
  vote_type TEXT DEFAULT 'yes_no' CHECK (vote_type IN ('yes_no', 'yes_no_abstain', 'multiple_choice', 'ranking', 'election', 'none')),
  vote_options JSONB, -- többes választáshoz: ["Opció A", "Opció B", "Opció C"]
  is_secret BOOLEAN DEFAULT false, -- titkos szavazás
  -- Szükséges többség
  required_majority TEXT DEFAULT 'simple' CHECK (required_majority IN ('simple', 'two_thirds', 'unanimous')),
  -- Státusz
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'voting', 'completed')),
  -- Eredmény
  result JSONB, -- {"yes": 45, "no": 12, "abstain": 3, "passed": true}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agenda_items_meeting ON agenda_items(meeting_id);

-- ============================================
-- VOTES - Szavazatok
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  -- Szavazat
  vote TEXT NOT NULL, -- 'yes', 'no', 'abstain' vagy opció neve
  vote_value INT, -- rangsorolásnál
  -- Súlyozás
  weight DECIMAL(10,4) DEFAULT 1.0,
  -- Meghatalmazás
  is_proxy BOOLEAN DEFAULT false,
  proxy_for_id UUID REFERENCES members(id), -- kinek a nevében
  -- Meta
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agenda_item_id, member_id)
);

CREATE INDEX idx_votes_agenda ON votes(agenda_item_id);
CREATE INDEX idx_votes_member ON votes(member_id);

-- ============================================
-- DOCUMENTS - Dokumentumok
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('agenda', 'proposal', 'minutes', 'proxy', 'attachment', 'recording', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_documents_meeting ON documents(meeting_id);

-- ============================================
-- MINUTES - Jegyzőkönyvek
-- ============================================
CREATE TABLE IF NOT EXISTS minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT, -- markdown formátumban
  ai_summary TEXT, -- AI által generált összefoglaló
  -- Aláírások
  signed_by JSONB, -- [{"member_id": "...", "role": "chair", "signed_at": "..."}]
  -- Export
  pdf_url TEXT,
  -- Státusz
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final', 'signed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE - Jelenléti ív
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  attendance_type TEXT DEFAULT 'in_person' CHECK (attendance_type IN ('in_person', 'online', 'proxy')),
  weight_at_checkin DECIMAL(10,4), -- súly pillanatképe
  UNIQUE(meeting_id, member_id)
);

CREATE INDEX idx_attendance_meeting ON attendance(meeting_id);

-- ============================================
-- AUDIT_LOG - Audit napló
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  member_id UUID REFERENCES members(id),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'meeting', 'vote', 'member', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Org members can read their org
CREATE POLICY "Members can read own org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- Members can read other members in their org
CREATE POLICY "Members can read org members" ON members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- Admins can manage members
CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Members can read meetings in their org
CREATE POLICY "Members can read meetings" ON meetings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- Members can read agenda items
CREATE POLICY "Members can read agenda" ON agenda_items
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE org_id IN (
        SELECT org_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- Members can vote
CREATE POLICY "Members can vote" ON votes
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- Members can read documents
CREATE POLICY "Members can read documents" ON documents
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- ============================================
-- Functions
-- ============================================

-- Calculate quorum for a meeting
CREATE OR REPLACE FUNCTION calculate_quorum(p_meeting_id UUID)
RETURNS TABLE (
  total_weight DECIMAL,
  present_weight DECIMAL,
  quorum_percentage DECIMAL,
  quorum_reached BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT 
      COALESCE(SUM(m.weight), 0) as total_w
    FROM members m
    JOIN meetings mt ON m.org_id = mt.org_id
    WHERE mt.id = p_meeting_id AND m.is_active = true AND m.role != 'observer'
  ),
  present AS (
    SELECT 
      COALESCE(SUM(m.weight), 0) as present_w
    FROM attendance a
    JOIN members m ON a.member_id = m.id
    WHERE a.meeting_id = p_meeting_id
  )
  SELECT 
    t.total_w,
    p.present_w,
    CASE WHEN t.total_w > 0 THEN (p.present_w / t.total_w * 100) ELSE 0 END,
    CASE WHEN t.total_w > 0 THEN (p.present_w / t.total_w * 100) >= 
      (SELECT quorum_percentage FROM meetings WHERE id = p_meeting_id)
    ELSE false END
  FROM totals t, present p;
END;
$$ LANGUAGE plpgsql;

-- Calculate vote result for an agenda item
CREATE OR REPLACE FUNCTION calculate_vote_result(p_agenda_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  item_record RECORD;
BEGIN
  SELECT * INTO item_record FROM agenda_items WHERE id = p_agenda_item_id;
  
  IF item_record.vote_type IN ('yes_no', 'yes_no_abstain') THEN
    SELECT jsonb_build_object(
      'yes', COALESCE(SUM(CASE WHEN vote = 'yes' THEN weight ELSE 0 END), 0),
      'no', COALESCE(SUM(CASE WHEN vote = 'no' THEN weight ELSE 0 END), 0),
      'abstain', COALESCE(SUM(CASE WHEN vote = 'abstain' THEN weight ELSE 0 END), 0),
      'total_votes', COUNT(*),
      'total_weight', COALESCE(SUM(weight), 0)
    ) INTO result
    FROM votes
    WHERE agenda_item_id = p_agenda_item_id;
    
    -- Determine if passed
    result := result || jsonb_build_object(
      'passed', 
      CASE item_record.required_majority
        WHEN 'simple' THEN (result->>'yes')::decimal > (result->>'no')::decimal
        WHEN 'two_thirds' THEN (result->>'yes')::decimal >= ((result->>'total_weight')::decimal * 2/3)
        WHEN 'unanimous' THEN (result->>'no')::decimal = 0
        ELSE false
      END
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_members_updated
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_meetings_updated
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_minutes_updated
  BEFORE UPDATE ON minutes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
