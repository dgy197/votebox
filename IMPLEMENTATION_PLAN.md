# IMPLEMENTATION_PLAN.md - VoteBox Sprint 1

## 🎯 Sprint Goal
Jegyzőkönyv generátor modul + alapvető szavazási UI

## Időtartam
2026-02-08 → 2026-02-15 (1 hét)

---

## Phase 1: Setup (Day 1)
- [x] Projekt struktúra (AGENTS.md, SPECS.md)
- [x] Teszt adatok létrehozása (seed.sql)
- [ ] Dev environment check (npm run dev)
- [ ] Playwright + Vitest setup ellenőrzés

## Phase 2: Minutes Generator Backend (Day 1-2)

### Task 2.1: Minutes Service
**File:** `src/lib/minutes-generator.ts`
```typescript
interface MinutesInput {
  meetingId: string;
}

interface MinutesOutput {
  markdown: string;
  summary?: string;
  metadata: {
    generatedAt: string;
    templateVersion: string;
  };
}

export async function generateMinutes(input: MinutesInput): Promise<MinutesOutput>
```

**Lépések:**
1. Meeting lekérdezése (org, résztvevők, napirendi pontok, szavazatok)
2. Határozatképesség számítás
3. Markdown template kitöltése
4. Határozatok sorszámozása

### Task 2.2: Database Updates
**File:** `supabase/migrations/006_minutes_updates.sql`
```sql
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT 'v1';
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS markdown_content TEXT;
```

## Phase 3: Minutes Generator UI (Day 2-3)

### Task 3.1: MinutesGenerator Component
**File:** `src/components/minutes/MinutesGenerator.tsx`
- "Jegyzőkönyv generálása" gomb
- Loading state
- Error handling

### Task 3.2: MinutesEditor Component  
**File:** `src/components/minutes/MinutesEditor.tsx`
- Markdown editor (@uiw/react-md-editor)
- Live preview
- Save funkció

### Task 3.3: MinutesPdfExport Component
**File:** `src/components/minutes/MinutesPdfExport.tsx`
- PDF generálás (react-pdf vagy html2pdf)
- Magyar karakterek kezelése
- Aláírási helyek

## Phase 4: Voting UI (Day 3-4)

### Task 4.1: VotingCard Component
**File:** `src/components/voting/VotingCard.tsx`
- Igen / Nem / Tartózkodom gombok
- Animated states
- Disabled when already voted

### Task 4.2: VotingResults Component
**File:** `src/components/voting/VotingResults.tsx`
- Pie chart vagy bar chart
- Súlyozott eredmények
- Passed/Failed indikátor

### Task 4.3: Realtime Integration
**File:** `src/hooks/useRealtimeVotes.ts`
- Supabase Realtime subscription
- Optimistic updates

## Phase 5: Meeting Dashboard (Day 4-5)

### Task 5.1: MeetingDetail Page
**File:** `src/pages/MeetingDetail.tsx`
- Meeting info header
- Attendance list
- Quorum indicator
- Agenda items list
- Actions (generate minutes, export)

### Task 5.2: AgendaItemCard Component
**File:** `src/components/agenda/AgendaItemCard.tsx`
- Status badges (pending, voting, completed)
- Vote button
- Results display

## Phase 6: Testing (Day 5-6)

### Unit Tests
- [ ] `minutes-generator.test.ts` - Template generation
- [ ] `quorum.test.ts` - Határozatképesség számítás
- [ ] `voting.test.ts` - Szavazat számítás

### E2E Tests
- [ ] `minutes-flow.spec.ts` - Generate → Edit → Export
- [ ] `voting-flow.spec.ts` - Start vote → Cast → Results

## Phase 7: Polish & Deploy (Day 6-7)

- [ ] Code review
- [ ] Bug fixes
- [ ] Vercel deployment
- [ ] Smoke test on production

---

## Definition of Done
- [ ] Minden feature működik
- [ ] Unit tesztek zöldek (>80% coverage)
- [ ] E2E tesztek zöldek
- [ ] Nincs TypeScript error
- [ ] Mobile responsive
- [ ] Magyar nyelvű UI

---

## Blockers / Dependencies
- Supabase service role key (RLS bypass seed-hez)
- PDF generálás lib választás
- Markdown editor lib választás

---

## Notes
- Claude Code 4.6 használata fejlesztéshez
- Sub-agent-ek parallel fejlesztéshez
- Folyamatos tesztelés minden commit után
