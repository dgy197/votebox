-- VoteBox Teszt Adatok
-- Futtatás: supabase db push --include-seed

-- 1. Töröljük a korábbi teszt adatokat
DELETE FROM organizations WHERE name = 'Napfény Társasház';

-- 2. Szervezet létrehozása (aktuális séma: id, name, slug, settings, created_at)
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Napfény Társasház',
  'napfeny-tarsashaz',
  '{"type": "condominium", "address": "1111 Budapest, Teszt utca 42.", "units": 20, "total_area": 1500}'::jsonb
);

-- 3. Tagok létrehozása
INSERT INTO members (id, org_id, name, email, role, weight, weight_label) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kovács Péter', 'kovacs.peter@teszt.hu', 'admin', 15.5, 'A/1 lakás - 85m²'),
  ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nagy Éva', 'nagy.eva@teszt.hu', 'voter', 8.2, 'A/2 lakás - 45m²'),
  ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Szabó János', 'szabo.janos@teszt.hu', 'voter', 12.0, 'A/3 lakás - 66m²'),
  ('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tóth Mária', 'toth.maria@teszt.hu', 'voter', 5.5, 'B/1 lakás - 30m²'),
  ('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Horváth László', 'horvath.laszlo@teszt.hu', 'chair', 10.0, 'B/2 lakás - 55m²');

-- 4. Gyűlés létrehozása
INSERT INTO meetings (id, org_id, title, description, type, status, location, location_type, quorum_type, quorum_percentage, created_by)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '2026. évi rendes közgyűlés',
  'Éves beszámoló és költségvetés elfogadása',
  'regular',
  'scheduling',
  'Társasházi közös helyiség (földszint)',
  'hybrid',
  'majority',
  50.0,
  '11111111-1111-1111-1111-111111111111'
);

-- 5. Doodle-szerű időpont opciók
INSERT INTO schedule_options (id, meeting_id, datetime, duration_minutes) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-02-20 18:00:00+01', 90),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-02-22 10:00:00+01', 90),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-02-25 17:30:00+01', 90);

-- 6. Időpont szavazatok (Doodle stílus)
INSERT INTO schedule_votes (option_id, member_id, vote) VALUES
  -- Feb 20 - 4 igen, 1 talán → NYERTES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '11111111-1111-1111-1111-111111111111', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '22222222-2222-2222-2222-222222222222', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '33333333-3333-3333-3333-333333333333', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '44444444-4444-4444-4444-444444444444', 'maybe'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '55555555-5555-5555-5555-555555555555', 'yes'),
  -- Feb 22 - vegyes
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '11111111-1111-1111-1111-111111111111', 'no'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '22222222-2222-2222-2222-222222222222', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '33333333-3333-3333-3333-333333333333', 'maybe'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '44444444-4444-4444-4444-444444444444', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '55555555-5555-5555-5555-555555555555', 'no'),
  -- Feb 25 - többen nem érnek rá
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '11111111-1111-1111-1111-111111111111', 'maybe'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '22222222-2222-2222-2222-222222222222', 'no'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '33333333-3333-3333-3333-333333333333', 'yes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '44444444-4444-4444-4444-444444444444', 'no'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '55555555-5555-5555-5555-555555555555', 'maybe');

-- 7. Nyertes időpont kiválasztása
UPDATE schedule_options SET is_winner = true WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01';
UPDATE meetings SET status = 'scheduled', scheduled_at = '2026-02-20 18:00:00+01' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 8. Napirendi pontok
INSERT INTO agenda_items (id, meeting_id, order_num, title, description, vote_type, required_majority, is_secret, status) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Levezető elnök és jegyzőkönyvvezető megválasztása', 'A közgyűlés tisztségviselőinek megválasztása', 'yes_no', 'simple', false, 'completed'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2025. évi pénzügyi beszámoló elfogadása', 'A közös költség és felújítási alap 2025. évi felhasználásának ismertetése', 'yes_no_abstain', 'simple', false, 'completed'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2026. évi költségvetés elfogadása', 'A közös költség mértékének meghatározása 2026-ra', 'yes_no_abstain', 'simple', false, 'voting'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Tetőfelújítás - kivitelező kiválasztása', 'Három árajánlat közül választás', 'multiple_choice', 'simple', false, 'pending'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Közös képviselő díjazásának emelése', 'Javaslat: havi 50.000 Ft → 60.000 Ft', 'yes_no_abstain', 'two_thirds', true, 'pending');

-- Vote options for multiple choice
UPDATE agenda_items 
SET vote_options = '["ABC Építő Kft. - 12M Ft", "XYZ Tető Bt. - 10.5M Ft", "Megbízható Tetős - 14M Ft"]'::jsonb
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc04';

-- 9. Szavazatok
-- 1. napirend - tisztségviselők (egyhangú)
INSERT INTO votes (agenda_item_id, member_id, vote, weight) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '11111111-1111-1111-1111-111111111111', 'yes', 15.5),
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '22222222-2222-2222-2222-222222222222', 'yes', 8.2),
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '33333333-3333-3333-3333-333333333333', 'yes', 12.0),
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '44444444-4444-4444-4444-444444444444', 'yes', 5.5),
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '55555555-5555-5555-5555-555555555555', 'yes', 10.0);

-- 2. napirend - beszámoló (1 tartózkodás)
INSERT INTO votes (agenda_item_id, member_id, vote, weight) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '11111111-1111-1111-1111-111111111111', 'yes', 15.5),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '22222222-2222-2222-2222-222222222222', 'yes', 8.2),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '33333333-3333-3333-3333-333333333333', 'yes', 12.0),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '44444444-4444-4444-4444-444444444444', 'abstain', 5.5),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '55555555-5555-5555-5555-555555555555', 'yes', 10.0);

-- 3. napirend - költségvetés (folyamatban)
INSERT INTO votes (agenda_item_id, member_id, vote, weight) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '11111111-1111-1111-1111-111111111111', 'yes', 15.5),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '22222222-2222-2222-2222-222222222222', 'yes', 8.2),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '55555555-5555-5555-5555-555555555555', 'no', 10.0);

-- Eredmények
UPDATE agenda_items SET result = '{"yes": 51.2, "no": 0, "abstain": 0, "passed": true}'::jsonb WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc01';
UPDATE agenda_items SET result = '{"yes": 45.7, "no": 0, "abstain": 5.5, "passed": true}'::jsonb WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';

-- 10. Jelenléti ív
INSERT INTO attendance (meeting_id, member_id, attendance_type, weight_at_checkin) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'in_person', 15.5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'online', 8.2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'in_person', 12.0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'online', 5.5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'in_person', 10.0);

-- Összesítés
SELECT '✅ Teszt adatok létrehozva!' as status;
SELECT 
  (SELECT COUNT(*) FROM organizations WHERE name = 'Napfény Társasház') as szervezetek,
  (SELECT COUNT(*) FROM members WHERE org_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as tagok,
  (SELECT COUNT(*) FROM meetings WHERE org_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as gyulesek,
  (SELECT COUNT(*) FROM agenda_items WHERE meeting_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as napirendi_pontok,
  (SELECT COUNT(*) FROM schedule_votes) as idopont_szavazatok,
  (SELECT COUNT(*) FROM votes) as szavazatok;
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
