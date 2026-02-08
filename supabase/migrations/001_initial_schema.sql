-- VoteBox Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (admins)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'org_admin')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_code TEXT UNIQUE NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Budapest',
  quorum_percent INT,
  state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'scheduled', 'active', 'closed', 'archived')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  access_code TEXT NOT NULL,
  is_present BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, access_code)
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  text_hu TEXT NOT NULL,
  text_en TEXT,
  type TEXT DEFAULT 'binary' CHECK (type IN ('binary', 'single', 'multi')),
  options JSONB,
  min_select INT DEFAULT 1,
  max_select INT DEFAULT 1,
  threshold_type TEXT DEFAULT 'simple_majority' CHECK (threshold_type IN ('simple_majority', 'two_thirds', 'absolute')),
  abstain_counts BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT true,
  randomize_options BOOLEAN DEFAULT false,
  time_limit_seconds INT,
  state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'active', 'closed')),
  order_index INT DEFAULT 0,
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ballots (anonymous by default)
CREATE TABLE ballots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id), -- NULL = anonymous
  choices JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cast markers (tracks WHO voted, not WHAT)
CREATE TABLE cast_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  cast_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, participant_id)
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type TEXT CHECK (actor_type IN ('user', 'participant', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  format TEXT CHECK (format IN ('json', 'csv', 'pdf')),
  file_url TEXT,
  integrity_hash TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_code ON events(event_code);
CREATE INDEX idx_events_state ON events(state);
CREATE INDEX idx_participants_event ON participants(event_id);
CREATE INDEX idx_questions_event ON questions(event_id);
CREATE INDEX idx_questions_state ON questions(state);
CREATE INDEX idx_ballots_question ON ballots(question_id);
CREATE INDEX idx_cast_markers_question ON cast_markers(question_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cast_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admins can see all organizations
CREATE POLICY "Super admins see all orgs" ON organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Org admins see their own org
CREATE POLICY "Org admins see own org" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can see themselves
CREATE POLICY "Users see themselves" ON users
  FOR SELECT USING (id = auth.uid());

-- Org admins see events in their org
CREATE POLICY "Org admins see own events" ON events
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Participants are managed by event admins
CREATE POLICY "Admins manage participants" ON participants
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Questions are managed by event admins
CREATE POLICY "Admins manage questions" ON questions
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Anyone can insert ballots (voting is open)
CREATE POLICY "Insert ballots" ON ballots
  FOR INSERT WITH CHECK (true);

-- Admins can read ballots for their events
CREATE POLICY "Admins read ballots" ON ballots
  FOR SELECT USING (
    question_id IN (
      SELECT id FROM questions WHERE event_id IN (
        SELECT id FROM events WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

-- Cast markers - insert and select
CREATE POLICY "Insert cast markers" ON cast_markers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Read cast markers" ON cast_markers
  FOR SELECT USING (true);

-- Audit logs readable by admins
CREATE POLICY "Admins read audit" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

-- Insert audit logs
CREATE POLICY "Insert audit" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Exports managed by admins
CREATE POLICY "Admins manage exports" ON exports
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Enable realtime for questions (for live voting updates)
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE ballots;
ALTER PUBLICATION supabase_realtime ADD TABLE cast_markers;
