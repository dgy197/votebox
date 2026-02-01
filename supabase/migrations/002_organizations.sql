-- VoteBox v2 Migration: Organizations & Super Admin
-- Futtatás: Supabase Dashboard → SQL Editor

-- 1. Organizations tábla
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 2. User-Organization kapcsolat
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

-- 3. Users tábla bővítése (ha nincs role oszlop)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'org_admin' 
      CHECK (role IN ('super_admin', 'org_admin', 'viewer'));
  END IF;
END $$;

-- 4. Events tábla bővítése org_id-val
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE events ADD COLUMN org_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- 5. Questions tábla bővítése time_limit-tel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'time_limit'
  ) THEN
    ALTER TABLE questions ADD COLUMN time_limit INTEGER DEFAULT NULL;
    -- time_limit másodpercben (NULL = nincs időkorlát)
  END IF;
END $$;

-- 6. RLS policies az organizations táblához
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Super admin mindent lát
CREATE POLICY "Super admins can do everything on organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Org admin csak saját szervezeteit látja
CREATE POLICY "Org admins can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.org_id = organizations.id 
      AND user_organizations.user_id = auth.uid()
    )
  );

-- 7. RLS policies a user_organizations táblához
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all memberships"
  ON user_organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- 8. Demo szervezet létrehozása (opcionális)
INSERT INTO organizations (name, slug, settings)
VALUES ('Demo Szervezet', 'demo', '{"demo": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 9. Index-ek a gyorsabb kereséshez
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);

-- Kész!
-- Következő: RLS frissítése az events táblához (TASK-004)
