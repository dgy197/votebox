/**
 * Test script to generate minutes for our test meeting
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eqqsnyuiksarzdllcoqz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcXNueXVpa3NhcnpkbGxjb3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDc0MTMsImV4cCI6MjA4NTM4MzQxM30.ia9oWmPfmUj0TwP4JDuXXVo3y4v00_pZvpzsDh5nLMg'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const TEST_MEETING_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// Helper functions
function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function generateMinutes() {
  console.log('📋 Jegyzőkönyv generálása...\n')

  // Fetch data directly (bypassing RLS issues by using hardcoded test data)
  const organization = {
    id: TEST_ORG_ID,
    name: 'Napfény Társasház',
    slug: 'napfeny-tarsashaz',
    settings: { address: '1111 Budapest, Teszt utca 42.' }
  }

  const meeting = {
    id: TEST_MEETING_ID,
    title: '2026. évi rendes közgyűlés',
    description: 'Éves beszámoló és költségvetés elfogadása',
    type: 'regular',
    status: 'scheduled',
    scheduled_at: '2026-02-20T18:00:00+01:00',
    location: 'Társasházi közös helyiség (földszint)',
    location_type: 'hybrid',
    quorum_percentage: 50.0
  }

  const members = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Kovács Péter', role: 'admin', weight: 15.5, weight_label: 'A/1 lakás - 85m²' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Nagy Éva', role: 'voter', weight: 8.2, weight_label: 'A/2 lakás - 45m²' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Szabó János', role: 'voter', weight: 12.0, weight_label: 'A/3 lakás - 66m²' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Tóth Mária', role: 'voter', weight: 5.5, weight_label: 'B/1 lakás - 30m²' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Horváth László', role: 'chair', weight: 10.0, weight_label: 'B/2 lakás - 55m²' }
  ]

  const attendance = [
    { member_id: '11111111-1111-1111-1111-111111111111', attendance_type: 'in_person', weight_at_checkin: 15.5 },
    { member_id: '22222222-2222-2222-2222-222222222222', attendance_type: 'online', weight_at_checkin: 8.2 },
    { member_id: '33333333-3333-3333-3333-333333333333', attendance_type: 'in_person', weight_at_checkin: 12.0 },
    { member_id: '44444444-4444-4444-4444-444444444444', attendance_type: 'online', weight_at_checkin: 5.5 },
    { member_id: '55555555-5555-5555-5555-555555555555', attendance_type: 'in_person', weight_at_checkin: 10.0 }
  ]

  const agendaItems = [
    { 
      order_num: 1, 
      title: 'Levezető elnök és jegyzőkönyvvezető megválasztása',
      description: 'A közgyűlés tisztségviselőinek megválasztása',
      vote_type: 'yes_no',
      status: 'completed',
      result: { yes: 51.2, no: 0, abstain: 0, passed: true }
    },
    { 
      order_num: 2, 
      title: '2025. évi pénzügyi beszámoló elfogadása',
      description: 'A közös költség és felújítási alap 2025. évi felhasználásának ismertetése',
      vote_type: 'yes_no_abstain',
      status: 'completed',
      result: { yes: 45.7, no: 0, abstain: 5.5, passed: true }
    },
    { 
      order_num: 3, 
      title: '2026. évi költségvetés elfogadása',
      description: 'A közös költség mértékének meghatározása 2026-ra',
      vote_type: 'yes_no_abstain',
      status: 'voting',
      result: null
    },
    { 
      order_num: 4, 
      title: 'Tetőfelújítás - kivitelező kiválasztása',
      description: 'Három árajánlat közül választás',
      vote_type: 'multiple_choice',
      vote_options: ['ABC Építő Kft. - 12M Ft', 'XYZ Tető Bt. - 10.5M Ft', 'Megbízható Tetős - 14M Ft'],
      status: 'pending',
      result: null
    },
    { 
      order_num: 5, 
      title: 'Közös képviselő díjazásának emelése',
      description: 'Javaslat: havi 50.000 Ft → 60.000 Ft',
      vote_type: 'yes_no_abstain',
      is_secret: true,
      required_majority: 'two_thirds',
      status: 'pending',
      result: null
    }
  ]

  // Calculate quorum
  const totalWeight = members.reduce((sum, m) => sum + m.weight, 0)
  const presentWeight = attendance.reduce((sum, a) => sum + a.weight_at_checkin, 0)
  const quorumPercent = (presentWeight / totalWeight) * 100
  const quorumReached = quorumPercent >= meeting.quorum_percentage

  // Get chair and secretary
  const chair = members.find(m => m.role === 'chair')
  const secretary = members.find(m => m.role === 'admin')

  // Generate markdown
  let markdown = `# JEGYZŐKÖNYV

Készült: **${organization.name}** ${formatDate(meeting.scheduled_at)} napján, ${formatTime(meeting.scheduled_at)}-kor tartott **${meeting.type === 'regular' ? 'rendes' : 'rendkívüli'}** közgyűléséről.

**Helyszín:** ${meeting.location}
${meeting.location_type === 'hybrid' ? '*(Hibrid: személyes + online részvétel)*' : ''}

---

## Jelen vannak

| Név | Tulajdoni hányad | Jelenlét |
|-----|------------------|----------|
`

  for (const att of attendance) {
    const member = members.find(m => m.id === att.member_id)!
    const attendanceLabel = att.attendance_type === 'in_person' ? '👤 személyes' : '💻 online'
    markdown += `| ${member.name} | ${member.weight}% (${member.weight_label}) | ${attendanceLabel} |\n`
  }

  markdown += `
**Összesen:** ${attendance.length} fő, **${presentWeight.toFixed(1)}%** tulajdoni hányad képviseletében

---

## Határozatképesség

A közgyűlés **${quorumReached ? '✅ HATÁROZATKÉPES' : '❌ NEM HATÁROZATKÉPES'}**, 
mivel a tulajdoni hányadok **${quorumPercent.toFixed(1)}%**-a képviseltette magát.
*(Szükséges: ${meeting.quorum_percentage}%)*

---

## Tisztségviselők

- **Levezető elnök:** ${chair?.name || 'N/A'}
- **Jegyzőkönyvvezető:** ${secretary?.name || 'N/A'}
- **Jegyzőkönyv hitelesítők:** ${members[1]?.name}, ${members[2]?.name}

---

## Napirendi pontok

`

  let resolutionCounter = 1

  for (const item of agendaItems) {
    markdown += `### ${item.order_num}. ${item.title}

${item.description}

`

    if (item.result && item.status === 'completed') {
      const result = item.result as any
      markdown += `**Szavazás eredménye:**
- ✅ Igen: ${result.yes.toFixed(1)}%
- ❌ Nem: ${result.no.toFixed(1)}%
- ⚪ Tartózkodott: ${result.abstain.toFixed(1)}%

`

      if (result.passed) {
        markdown += `> **${resolutionCounter}/2026. számú HATÁROZAT**
> 
> A közgyűlés egyszerű többséggel **ELFOGADTA** az előterjesztést.

`
        resolutionCounter++
      } else {
        markdown += `> A közgyűlés az előterjesztést **ELUTASÍTOTTA**.

`
      }
    } else if (item.status === 'voting') {
      markdown += `*🔄 Szavazás folyamatban...*

`
    } else if (item.status === 'pending') {
      markdown += `*⏳ Még nem tárgyalt napirendi pont*

`
    }

    markdown += `---

`
  }

  markdown += `## Zárás

A levezető elnök a közgyűlést [időpont]-kor bezárta.

**Kelt:** Budapest, ${formatDate(new Date())}

---

|  |  |
|--|--|
| _________________________ | _________________________ |
| Levezető elnök | Jegyzőkönyvvezető |
| ${chair?.name || ''} | ${secretary?.name || ''} |

|  |  |
|--|--|
| _________________________ | _________________________ |
| Jegyzőkönyv hitelesítő | Jegyzőkönyv hitelesítő |
| ${members[1]?.name || ''} | ${members[2]?.name || ''} |
`

  return markdown
}

// Run
generateMinutes().then(markdown => {
  console.log(markdown)
}).catch(console.error)
