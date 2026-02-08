-- VoteBox Migration: Fix RLS Infinite Recursion
-- Problem: members table policy references itself causing infinite recursion
-- Solution: Use security definer function to bypass RLS during check

-- Step 1: Create helper function (runs as superuser, bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT org_id FROM members WHERE user_id = auth.uid();
$$;

-- Step 2: Drop problematic policies
DROP POLICY IF EXISTS "Members can read org members" ON members;
DROP POLICY IF EXISTS "Admins can manage members" ON members;
DROP POLICY IF EXISTS "Members can read own org" ON organizations;
DROP POLICY IF EXISTS "Members can read meetings" ON meetings;
DROP POLICY IF EXISTS "Members can read agenda" ON agenda_items;
DROP POLICY IF EXISTS "Members can read documents" ON documents;

-- Step 3: Recreate policies using the helper function

-- Organizations: members can read their own org
CREATE POLICY "Members can read own org" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

-- Members: can read other members in their org
CREATE POLICY "Members can read org members" ON members
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

-- Members: admins can manage
CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid() 
      AND m.org_id = members.org_id 
      AND m.role = 'admin'
    )
  );

-- Meetings: members can read
CREATE POLICY "Members can read meetings" ON meetings
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

-- Agenda items: members can read
CREATE POLICY "Members can read agenda" ON agenda_items
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- Documents: members can read
CREATE POLICY "Members can read documents" ON documents
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

-- Step 4: Enable RLS on proxies and other tables if not already
ALTER TABLE proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Proxies: members can read/create for their org
CREATE POLICY "Members can read proxies" ON proxies
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Members can create proxies" ON proxies
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

-- Schedule options: members can read
CREATE POLICY "Members can read schedule options" ON schedule_options
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- Schedule votes: members can vote
CREATE POLICY "Members can vote on schedule" ON schedule_votes
  FOR ALL USING (
    option_id IN (
      SELECT id FROM schedule_options WHERE meeting_id IN (
        SELECT id FROM meetings WHERE org_id IN (SELECT get_user_org_ids())
      )
    )
  );

-- Attendance: members can read
CREATE POLICY "Members can read attendance" ON attendance
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- Minutes: members can read
CREATE POLICY "Members can read minutes" ON minutes
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- Audit log: admins only
CREATE POLICY "Admins can read audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE user_id = auth.uid() 
      AND org_id = audit_log.org_id 
      AND role = 'admin'
    )
  );

COMMENT ON FUNCTION get_user_org_ids IS 'Returns org IDs for current user. SECURITY DEFINER to avoid RLS recursion.';
