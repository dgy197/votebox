-- VoteBox - Teszt Szervezetek és Gyűlések
-- Különböző szervezeti típusok teszteléshez

-- ============================================
-- 1. MMK ELNÖKSÉG (kis létszám, gyakori szavazás)
-- ============================================

INSERT INTO organizations (id, name, slug, settings) VALUES (
  'mmk-elnok-0000-0000-000000000001',
  'MMK Elnökség',
  'mmk-elnokseg',
  '{
    "type": "professional_body",
    "parent": "Magyar Mérnöki Kamara",
    "description": "A kamara operatív vezetését ellátó testület",
    "voting_rules": {
      "default_quorum": 50,
      "default_majority": "simple"
    }
  }'::jsonb
);

-- Elnökségi tagok (7 fő)
INSERT INTO members (id, org_id, name, email, role, weight, weight_label) VALUES
  ('mmk-e-member-0000-000000000001', 'mmk-elnok-0000-0000-000000000001', 'Dr. Kiss András', 'kiss.andras@mmk.hu', 'admin', 1, 'Elnök'),
  ('mmk-e-member-0000-000000000002', 'mmk-elnok-0000-0000-000000000001', 'Dr. Nagy Béla', 'nagy.bela@mmk.hu', 'chair', 1, 'Alelnök'),
  ('mmk-e-member-0000-000000000003', 'mmk-elnok-0000-0000-000000000001', 'Szabó Katalin', 'szabo.katalin@mmk.hu', 'voter', 1, 'Főtitkár'),
  ('mmk-e-member-0000-000000000004', 'mmk-elnok-0000-0000-000000000001', 'Tóth Ferenc', 'toth.ferenc@mmk.hu', 'voter', 1, 'Tag'),
  ('mmk-e-member-0000-000000000005', 'mmk-elnok-0000-0000-000000000001', 'Kovács Mária', 'kovacs.maria@mmk.hu', 'voter', 1, 'Tag'),
  ('mmk-e-member-0000-000000000006', 'mmk-elnok-0000-0000-000000000001', 'Horváth Péter', 'horvath.peter@mmk.hu', 'voter', 1, 'Tag'),
  ('mmk-e-member-0000-000000000007', 'mmk-elnok-0000-0000-000000000001', 'Varga László', 'varga.laszlo@mmk.hu', 'voter', 1, 'Tag');

-- ============================================
-- 2. MMK VÁLASZTMÁNY (nagyobb testület)
-- ============================================

INSERT INTO organizations (id, name, slug, settings) VALUES (
  'mmk-valasztmany-0000-000000000001',
  'MMK Választmány',
  'mmk-valasztmany',
  '{
    "type": "professional_body",
    "parent": "Magyar Mérnöki Kamara",
    "description": "A kamara stratégiai döntéshozó testülete",
    "voting_rules": {
      "default_quorum": 50,
      "default_majority": "simple",
      "weighted": false
    }
  }'::jsonb
);

-- Választmányi tagok (15 fő - tagozati képviselők)
INSERT INTO members (id, org_id, name, email, role, weight, weight_label) VALUES
  ('mmk-v-member-0000-000000000001', 'mmk-valasztmany-0000-000000000001', 'Dr. Kiss András', 'kiss.andras@mmk.hu', 'chair', 1, 'Elnök'),
  ('mmk-v-member-0000-000000000002', 'mmk-valasztmany-0000-000000000001', 'Molnár István', 'molnar.istvan@mmk.hu', 'voter', 1, 'Építészeti tagozat'),
  ('mmk-v-member-0000-000000000003', 'mmk-valasztmany-0000-000000000001', 'Fehér Gábor', 'feher.gabor@mmk.hu', 'voter', 1, 'Gépészeti tagozat'),
  ('mmk-v-member-0000-000000000004', 'mmk-valasztmany-0000-000000000001', 'Decsi György', 'decsi.gyorgy@mmk.hu', 'voter', 1, 'Tűzvédelmi tagozat'),
  ('mmk-v-member-0000-000000000005', 'mmk-valasztmany-0000-000000000001', 'Balogh Eszter', 'balogh.eszter@mmk.hu', 'voter', 1, 'Villamos tagozat'),
  ('mmk-v-member-0000-000000000006', 'mmk-valasztmany-0000-000000000001', 'Németh Zoltán', 'nemeth.zoltan@mmk.hu', 'voter', 1, 'Közlekedési tagozat'),
  ('mmk-v-member-0000-000000000007', 'mmk-valasztmany-0000-000000000001', 'Takács Anna', 'takacs.anna@mmk.hu', 'voter', 1, 'Településtervezési tagozat'),
  ('mmk-v-member-0000-000000000008', 'mmk-valasztmany-0000-000000000001', 'Papp Róbert', 'papp.robert@mmk.hu', 'voter', 1, 'Geotechnikai tagozat'),
  ('mmk-v-member-0000-000000000009', 'mmk-valasztmany-0000-000000000001', 'Simon Judit', 'simon.judit@mmk.hu', 'voter', 1, 'Tartószerkezeti tagozat'),
  ('mmk-v-member-0000-000000000010', 'mmk-valasztmany-0000-000000000001', 'Oláh Tamás', 'olah.tamas@mmk.hu', 'voter', 1, 'Környezetvédelmi tagozat'),
  ('mmk-v-member-0000-000000000011', 'mmk-valasztmany-0000-000000000001', 'Farkas Dániel', 'farkas.daniel@mmk.hu', 'voter', 1, 'Energetikai tagozat'),
  ('mmk-v-member-0000-000000000012', 'mmk-valasztmany-0000-000000000001', 'Lukács Éva', 'lukacs.eva@mmk.hu', 'voter', 1, 'Informatikai tagozat'),
  ('mmk-v-member-0000-000000000013', 'mmk-valasztmany-0000-000000000001', 'Antal Márton', 'antal.marton@mmk.hu', 'voter', 1, 'Hidrotechnikai tagozat'),
  ('mmk-v-member-0000-000000000014', 'mmk-valasztmany-0000-000000000001', 'Vincze Krisztina', 'vincze.krisztina@mmk.hu', 'voter', 1, 'Mezőgazdasági tagozat'),
  ('mmk-v-member-0000-000000000015', 'mmk-valasztmany-0000-000000000001', 'Bodnár Ákos', 'bodnar.akos@mmk.hu', 'voter', 1, 'Vegyészmérnöki tagozat');

-- ============================================
-- 3. TŰZVÉDELMI TAGOZAT
-- ============================================

INSERT INTO organizations (id, name, slug, settings) VALUES (
  'tuzvedelmi-tagozat-000000000001',
  'MMK Tűzvédelmi Tagozat',
  'mmk-tuzvedelmi-tagozat',
  '{
    "type": "professional_section",
    "parent": "Magyar Mérnöki Kamara",
    "description": "Tűzvédelmi tervező mérnökök szakmai szervezete",
    "president": "Decsi György",
    "voting_rules": {
      "default_quorum": 33,
      "default_majority": "simple"
    }
  }'::jsonb
);

-- Tagozati tagok (12 fő)
INSERT INTO members (id, org_id, name, email, role, weight, weight_label) VALUES
  ('tuz-member-0000-000000000001', 'tuzvedelmi-tagozat-000000000001', 'Decsi György', 'decsi.gyorgy@fireeng.hu', 'admin', 1, 'Tagozat elnök'),
  ('tuz-member-0000-000000000002', 'tuzvedelmi-tagozat-000000000001', 'Vörös Attila', 'voros.attila@tuzvedo.hu', 'chair', 1, 'Alelnök'),
  ('tuz-member-0000-000000000003', 'tuzvedelmi-tagozat-000000000001', 'Mészáros Katalin', 'meszaros.katalin@fireplan.hu', 'voter', 1, 'Titkár'),
  ('tuz-member-0000-000000000004', 'tuzvedelmi-tagozat-000000000001', 'Szűcs Péter', 'szucs.peter@tuztech.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000005', 'tuzvedelmi-tagozat-000000000001', 'Kocsis Réka', 'kocsis.reka@safetyfirst.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000006', 'tuzvedelmi-tagozat-000000000001', 'Barta Gergely', 'barta.gergely@firepro.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000007', 'tuzvedelmi-tagozat-000000000001', 'Jakab Zsuzsanna', 'jakab.zsuzsa@tuzbiztonsag.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000008', 'tuzvedelmi-tagozat-000000000001', 'Orosz Tibor', 'orosz.tibor@firedesign.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000009', 'tuzvedelmi-tagozat-000000000001', 'Hegedűs Márta', 'hegedus.marta@tuzved.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000010', 'tuzvedelmi-tagozat-000000000001', 'Csete András', 'csete.andras@fireeng.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000011', 'tuzvedelmi-tagozat-000000000001', 'Lengyel Viktória', 'lengyel.viktoria@tuzterv.hu', 'voter', 1, 'Tag'),
  ('tuz-member-0000-000000000012', 'tuzvedelmi-tagozat-000000000001', 'Fekete Balázs', 'fekete.balazs@safezone.hu', 'voter', 1, 'Tag');

-- ============================================
-- TESZT GYŰLÉSEK
-- ============================================

-- MMK Elnökség - Rendkívüli ülés
INSERT INTO meetings (id, org_id, title, description, type, status, location, location_type, quorum_type, quorum_percentage, created_by) VALUES (
  'mmk-e-meeting-0000-000000000001',
  'mmk-elnok-0000-0000-000000000001',
  'Rendkívüli elnökségi ülés - Etikai ügy',
  'Sürgős etikai kérdés tárgyalása',
  'extraordinary',
  'scheduling',
  'MMK Székház, Tanácsterem',
  'hybrid',
  'majority',
  50.0,
  'mmk-e-member-0000-000000000001'
);

-- MMK Választmány - Éves ülés
INSERT INTO meetings (id, org_id, title, description, type, status, location, location_type, quorum_type, quorum_percentage, created_by) VALUES (
  'mmk-v-meeting-0000-000000000001',
  'mmk-valasztmany-0000-000000000001',
  '2026. évi rendes választmányi ülés',
  'Éves beszámoló, költségvetés, tisztújítás',
  'regular',
  'scheduling',
  'MMK Székház, Nagyterem',
  'hybrid',
  'majority',
  50.0,
  'mmk-v-member-0000-000000000001'
);

-- Tűzvédelmi tagozat - Taggyűlés
INSERT INTO meetings (id, org_id, title, description, type, status, location, location_type, quorum_type, quorum_percentage, created_by) VALUES (
  'tuz-meeting-0000-000000000001',
  'tuzvedelmi-tagozat-000000000001',
  'Tűzvédelmi Tagozat 2026. I. félévi taggyűlése',
  'Szakmai beszámoló, EV tűzvédelem szabályozás véleményezése, új tagok felvétele',
  'regular',
  'scheduling',
  'Online (Teams)',
  'online',
  'majority',
  33.0,
  'tuz-member-0000-000000000001'
);

-- Időpont opciók a gyűlésekhez
-- MMK Elnökség
INSERT INTO schedule_options (id, meeting_id, datetime, duration_minutes) VALUES
  ('mmk-e-opt-0000-000000000001', 'mmk-e-meeting-0000-000000000001', '2026-02-15 10:00:00+01', 60),
  ('mmk-e-opt-0000-000000000002', 'mmk-e-meeting-0000-000000000001', '2026-02-17 14:00:00+01', 60),
  ('mmk-e-opt-0000-000000000003', 'mmk-e-meeting-0000-000000000001', '2026-02-18 09:00:00+01', 60);

-- Tűzvédelmi tagozat
INSERT INTO schedule_options (id, meeting_id, datetime, duration_minutes) VALUES
  ('tuz-opt-0000-000000000001', 'tuz-meeting-0000-000000000001', '2026-03-05 16:00:00+01', 120),
  ('tuz-opt-0000-000000000002', 'tuz-meeting-0000-000000000001', '2026-03-07 10:00:00+01', 120),
  ('tuz-opt-0000-000000000003', 'tuz-meeting-0000-000000000001', '2026-03-10 17:00:00+01', 120);

-- Napirendi pontok - Tűzvédelmi tagozat
INSERT INTO agenda_items (id, meeting_id, order_num, title, description, vote_type, required_majority, status) VALUES
  ('tuz-agenda-0000-000000000001', 'tuz-meeting-0000-000000000001', 1, 'Levezető elnök és jegyzőkönyvvezető megválasztása', 'Tisztségviselők megválasztása', 'yes_no', 'simple', 'pending'),
  ('tuz-agenda-0000-000000000002', 'tuz-meeting-0000-000000000001', 2, 'Elnöki beszámoló a 2025. II. félévi tevékenységről', 'Decsi György elnök beszámolója', 'yes_no_abstain', 'simple', 'pending'),
  ('tuz-agenda-0000-000000000003', 'tuz-meeting-0000-000000000001', 3, 'EV tűzvédelem szabályozás - OTSZ módosítási javaslat', 'Az elektromos járművek tűzvédelmi követelményeinek szabályozása', 'yes_no_abstain', 'simple', 'pending'),
  ('tuz-agenda-0000-000000000004', 'tuz-meeting-0000-000000000001', 4, 'Új tagok felvétele', '3 új tag felvételi kérelme', 'yes_no', 'simple', 'pending'),
  ('tuz-agenda-0000-000000000005', 'tuz-meeting-0000-000000000001', 5, 'Egyebek', 'Bejelentések, javaslatok', 'none', 'simple', 'pending');

-- Összesítés
SELECT 
  '✅ Teszt szervezetek létrehozva' as status,
  (SELECT COUNT(*) FROM organizations WHERE slug LIKE 'mmk%' OR slug LIKE '%tuzvedelmi%') as szervezetek,
  (SELECT COUNT(*) FROM members WHERE org_id IN (SELECT id FROM organizations WHERE slug LIKE 'mmk%' OR slug LIKE '%tuzvedelmi%')) as tagok,
  (SELECT COUNT(*) FROM meetings WHERE org_id IN (SELECT id FROM organizations WHERE slug LIKE 'mmk%' OR slug LIKE '%tuzvedelmi%')) as gyulesek;
