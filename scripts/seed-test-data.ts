/**
 * VoteBox Test Data Seeder
 * Létrehoz egy komplett teszt szervezetet a teljes flow teszteléséhez
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqqsnyuiksarzdllcoqz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY környezeti változó szükséges!');
  console.log('Megtalálod: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================
// TESZT ADATOK
// ============================================

const TEST_ORG = {
  name: 'Napfény Társasház',
  type: 'condominium',
  settings: {
    address: '1111 Budapest, Teszt utca 42.',
    units: 20,
    total_area: 1500
  }
};

const TEST_MEMBERS = [
  { 
    name: 'Kovács Péter', 
    email: 'kovacs.peter@teszt.hu', 
    role: 'admin',
    weight: 15.5, // 15.5% tulajdoni hányad
    weight_label: 'A/1 lakás - 85m²'
  },
  { 
    name: 'Nagy Éva', 
    email: 'nagy.eva@teszt.hu', 
    role: 'voter',
    weight: 8.2,
    weight_label: 'A/2 lakás - 45m²'
  },
  { 
    name: 'Szabó János', 
    email: 'szabo.janos@teszt.hu', 
    role: 'voter',
    weight: 12.0,
    weight_label: 'A/3 lakás - 66m²'
  },
  { 
    name: 'Tóth Mária', 
    email: 'toth.maria@teszt.hu', 
    role: 'voter',
    weight: 5.5,
    weight_label: 'B/1 lakás - 30m²'
  },
  { 
    name: 'Horváth László', 
    email: 'horvath.laszlo@teszt.hu', 
    role: 'chair', // levezető elnök
    weight: 10.0,
    weight_label: 'B/2 lakás - 55m²'
  }
];

const TEST_MEETING = {
  title: '2026. évi rendes közgyűlés',
  description: 'Éves beszámoló és költségvetés elfogadása',
  type: 'regular',
  status: 'scheduling', // időpont egyeztetés fázisban
  location: 'Társasházi közös helyiség (földszint)',
  location_type: 'hybrid',
  quorum_type: 'majority',
  quorum_percentage: 50.0
};

// Doodle-szerű időpont opciók
const SCHEDULE_OPTIONS = [
  { datetime: '2026-02-20T18:00:00+01:00', duration_minutes: 90 },
  { datetime: '2026-02-22T10:00:00+01:00', duration_minutes: 90 },
  { datetime: '2026-02-25T17:30:00+01:00', duration_minutes: 90 }
];

const AGENDA_ITEMS = [
  {
    order_num: 1,
    title: 'Levezető elnök és jegyzőkönyvvezető megválasztása',
    description: 'A közgyűlés tisztségviselőinek megválasztása',
    vote_type: 'yes_no',
    required_majority: 'simple'
  },
  {
    order_num: 2,
    title: '2025. évi pénzügyi beszámoló elfogadása',
    description: 'A közös költség és felújítási alap 2025. évi felhasználásának ismertetése és elfogadása',
    vote_type: 'yes_no_abstain',
    required_majority: 'simple'
  },
  {
    order_num: 3,
    title: '2026. évi költségvetés elfogadása',
    description: 'A közös költség mértékének meghatározása 2026-ra',
    vote_type: 'yes_no_abstain',
    required_majority: 'simple'
  },
  {
    order_num: 4,
    title: 'Tetőfelújítás - kivitelező kiválasztása',
    description: 'Három árajánlat közül választás',
    vote_type: 'multiple_choice',
    vote_options: ['ABC Építő Kft. - 12M Ft', 'XYZ Tető Bt. - 10.5M Ft', 'Megbízható Tetős - 14M Ft'],
    required_majority: 'simple'
  },
  {
    order_num: 5,
    title: 'Közös képviselő díjazásának emelése',
    description: 'Javaslat: havi 50.000 Ft → 60.000 Ft',
    vote_type: 'yes_no_abstain',
    required_majority: 'two_thirds', // 2/3-os többség kell
    is_secret: true // titkos szavazás
  }
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function clearTestData() {
  console.log('🧹 Korábbi teszt adatok törlése...');
  
  // Find and delete test org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', TEST_ORG.name);
  
  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      await supabase.from('organizations').delete().eq('id', org.id);
    }
    console.log(`  ✅ ${orgs.length} teszt szervezet törölve`);
  }
}

async function createOrganization() {
  console.log('🏢 Szervezet létrehozása...');
  
  const { data: org, error } = await supabase
    .from('organizations')
    .insert(TEST_ORG)
    .select()
    .single();
  
  if (error) throw new Error(`Org hiba: ${error.message}`);
  console.log(`  ✅ ${org.name} (${org.id})`);
  return org;
}

async function createMembers(orgId: string) {
  console.log('👥 Tagok létrehozása...');
  
  const members = TEST_MEMBERS.map(m => ({ ...m, org_id: orgId }));
  
  const { data, error } = await supabase
    .from('members')
    .insert(members)
    .select();
  
  if (error) throw new Error(`Members hiba: ${error.message}`);
  
  for (const m of data!) {
    console.log(`  ✅ ${m.name} (${m.role}) - ${m.weight}%`);
  }
  
  return data;
}

async function createMeeting(orgId: string, createdById: string) {
  console.log('📅 Gyűlés létrehozása...');
  
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({ ...TEST_MEETING, org_id: orgId, created_by: createdById })
    .select()
    .single();
  
  if (error) throw new Error(`Meeting hiba: ${error.message}`);
  console.log(`  ✅ ${meeting.title} (${meeting.status})`);
  return meeting;
}

async function createScheduleOptions(meetingId: string) {
  console.log('🗓️ Időpont opciók létrehozása (Doodle)...');
  
  const options = SCHEDULE_OPTIONS.map(o => ({ ...o, meeting_id: meetingId }));
  
  const { data, error } = await supabase
    .from('schedule_options')
    .insert(options)
    .select();
  
  if (error) throw new Error(`Schedule options hiba: ${error.message}`);
  
  for (const o of data!) {
    console.log(`  ✅ ${new Date(o.datetime).toLocaleString('hu-HU')}`);
  }
  
  return data;
}

async function createScheduleVotes(options: any[], members: any[]) {
  console.log('🗳️ Időpont szavazatok...');
  
  const votes = [];
  const voteChoices = ['yes', 'maybe', 'no'];
  
  for (const member of members) {
    for (const option of options) {
      // Véletlenszerű szavazat, de az első opcióra többen szavaznak igen-t
      const isFirstOption = option.id === options[0].id;
      const vote = isFirstOption 
        ? (Math.random() > 0.3 ? 'yes' : 'maybe')
        : voteChoices[Math.floor(Math.random() * 3)];
      
      votes.push({
        option_id: option.id,
        member_id: member.id,
        vote
      });
    }
  }
  
  const { error } = await supabase.from('schedule_votes').insert(votes);
  if (error) throw new Error(`Schedule votes hiba: ${error.message}`);
  
  console.log(`  ✅ ${votes.length} időpont szavazat rögzítve`);
  
  // Összesítés
  for (const option of options) {
    const optionVotes = votes.filter(v => v.option_id === option.id);
    const yes = optionVotes.filter(v => v.vote === 'yes').length;
    const maybe = optionVotes.filter(v => v.vote === 'maybe').length;
    const no = optionVotes.filter(v => v.vote === 'no').length;
    console.log(`     ${new Date(option.datetime).toLocaleDateString('hu-HU')}: ✅${yes} ⚠️${maybe} ❌${no}`);
  }
}

async function selectWinningDate(options: any[], meetingId: string) {
  console.log('🏆 Nyertes időpont kiválasztása...');
  
  // Az első opciót választjuk (ami a legtöbb "igen"-t kapta)
  const winnerId = options[0].id;
  const winnerDate = options[0].datetime;
  
  await supabase
    .from('schedule_options')
    .update({ is_winner: true })
    .eq('id', winnerId);
  
  await supabase
    .from('meetings')
    .update({ 
      status: 'scheduled',
      scheduled_at: winnerDate 
    })
    .eq('id', meetingId);
  
  console.log(`  ✅ ${new Date(winnerDate).toLocaleString('hu-HU')}`);
}

async function createAgendaItems(meetingId: string) {
  console.log('📋 Napirendi pontok létrehozása...');
  
  const items = AGENDA_ITEMS.map(item => ({ ...item, meeting_id: meetingId }));
  
  const { data, error } = await supabase
    .from('agenda_items')
    .insert(items)
    .select();
  
  if (error) throw new Error(`Agenda items hiba: ${error.message}`);
  
  for (const item of data!) {
    console.log(`  ✅ ${item.order_num}. ${item.title.substring(0, 40)}...`);
  }
  
  return data;
}

async function simulateVoting(agendaItems: any[], members: any[]) {
  console.log('🗳️ Szavazás szimuláció...');
  
  for (const item of agendaItems) {
    console.log(`\n  📌 ${item.order_num}. ${item.title.substring(0, 30)}...`);
    
    const votes = [];
    
    for (const member of members) {
      if (member.role === 'observer') continue; // megfigyelők nem szavaznak
      
      let vote: string;
      
      if (item.vote_type === 'multiple_choice' && item.vote_options) {
        // Többes választás - véletlenszerű opció
        vote = item.vote_options[Math.floor(Math.random() * item.vote_options.length)];
      } else {
        // Igen/Nem szavazás - 70% igen, 20% nem, 10% tartózkodik
        const rand = Math.random();
        if (rand < 0.7) vote = 'yes';
        else if (rand < 0.9) vote = 'no';
        else vote = 'abstain';
      }
      
      votes.push({
        agenda_item_id: item.id,
        member_id: member.id,
        vote,
        weight: member.weight,
        is_proxy: false
      });
    }
    
    const { error } = await supabase.from('votes').insert(votes);
    if (error) throw new Error(`Votes hiba: ${error.message}`);
    
    // Eredmény számítás
    if (item.vote_type === 'multiple_choice') {
      const results: Record<string, number> = {};
      for (const v of votes) {
        results[v.vote] = (results[v.vote] || 0) + v.weight;
      }
      console.log('     Eredmény:', results);
    } else {
      const yes = votes.filter(v => v.vote === 'yes').reduce((s, v) => s + v.weight, 0);
      const no = votes.filter(v => v.vote === 'no').reduce((s, v) => s + v.weight, 0);
      const abstain = votes.filter(v => v.vote === 'abstain').reduce((s, v) => s + v.weight, 0);
      const passed = yes > no;
      console.log(`     ✅ Igen: ${yes.toFixed(1)}% | ❌ Nem: ${no.toFixed(1)}% | ⚪ Tart: ${abstain.toFixed(1)}%`);
      console.log(`     ${passed ? '✅ ELFOGADVA' : '❌ ELUTASÍTVA'}`);
      
      // Eredmény mentése
      await supabase
        .from('agenda_items')
        .update({ 
          status: 'completed',
          result: { yes, no, abstain, passed }
        })
        .eq('id', item.id);
    }
  }
}

async function printSummary(orgId: string) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TESZT ADATOK ÖSSZESÍTÉS');
  console.log('='.repeat(50));
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('org_id', orgId);
  
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('org_id', orgId);
  
  console.log(`\n🏢 Szervezet: ${org?.name}`);
  console.log(`👥 Tagok: ${members?.length || 0} fő`);
  console.log(`📅 Gyűlések: ${meetings?.length || 0} db`);
  
  if (meetings && meetings.length > 0) {
    const m = meetings[0];
    console.log(`\n📋 Aktív gyűlés: ${m.title}`);
    console.log(`   Időpont: ${m.scheduled_at ? new Date(m.scheduled_at).toLocaleString('hu-HU') : 'nincs'}`);
    console.log(`   Státusz: ${m.status}`);
  }
  
  console.log('\n✅ Teszt adatok sikeresen létrehozva!');
  console.log('\n🔗 Teszteléshez nyisd meg: http://localhost:5173');
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 VoteBox Teszt Adat Generálás\n');
  
  try {
    await clearTestData();
    
    const org = await createOrganization();
    const members = await createMembers(org.id);
    const admin = members!.find(m => m.role === 'admin')!;
    
    const meeting = await createMeeting(org.id, admin.id);
    const scheduleOptions = await createScheduleOptions(meeting.id);
    
    await createScheduleVotes(scheduleOptions, members!);
    await selectWinningDate(scheduleOptions, meeting.id);
    
    const agendaItems = await createAgendaItems(meeting.id);
    await simulateVoting(agendaItems, members!);
    
    await printSummary(org.id);
    
  } catch (error) {
    console.error('❌ Hiba:', error);
    process.exit(1);
  }
}

main();
