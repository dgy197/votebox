# SPECS.md - VoteBox Feature Specifikációk

## 📋 MINUTES-001: Jegyzőkönyv Generátor

### Leírás
Automatikus közgyűlési jegyzőkönyv generálás magyar jogi követelményeknek megfelelően.

### Követelmények

#### Bemenet (a gyűlés adataiból)
- Szervezet adatai (név, cím, típus)
- Gyűlés adatai (dátum, időpont, helyszín, típus)
- Jelenléti ív (tagok, tulajdoni hányad, jelenlét típusa)
- Határozatképesség számítás
- Napirendi pontok és szavazási eredmények
- Hozott határozatok

#### Kimenet
- Markdown formátumú jegyzőkönyv (szerkeszthető)
- PDF export (végleges, archiválható)
- AI összefoglaló (opcionális)

### Magyar Jogi Sablon
```markdown
# JEGYZŐKÖNYV

Készült: [Szervezet neve] [dátum] napján, [időpont]-kor tartott 
[rendes/rendkívüli] közgyűléséről.

**Helyszín:** [cím]

## Jelen vannak:
| Név | Tulajdoni hányad | Jelenlét |
|-----|------------------|----------|
| ... | ...% | személyes/online |

**Összesen:** [X] fő, [Y]% tulajdoni hányad képviseletében

**Határozatképesség:** A közgyűlés határozatképes / nem határozatképes,
mivel a tulajdoni hányadok [X]%-a képviseltette magát 
(szükséges: [quorum]%).

**Levezető elnök:** [név]
**Jegyzőkönyvvezető:** [név]
**Jegyzőkönyv hitelesítők:** [név1], [név2]

---

## 1. NAPIRENDI PONT
### [Napirendi pont címe]

[Napirendi pont leírása/előterjesztés]

**Szavazás eredménye:**
- Igen: [X]% ([N] fő)
- Nem: [Y]% ([M] fő)  
- Tartózkodott: [Z]% ([K] fő)

### [X]/2026. számú HATÁROZAT
A közgyűlés [egyszerű többséggel / minősített többséggel / egyhangúlag]
**elfogadta / elutasította** az előterjesztést.

[Határozat szövege]

Határidő: [ha van]
Felelős: [ha van]

---

[További napirendi pontok...]

---

## Zárás

A levezető elnök a közgyűlést [időpont]-kor bezárta.

Kelt: [város], [dátum]

_____________________          _____________________
   Levezető elnök               Jegyzőkönyvvezető

_____________________          _____________________
 Jegyzőkönyv hitelesítő 1      Jegyzőkönyv hitelesítő 2
```

### UI/UX

#### Generálás Flow
1. Meeting részletek oldal → "Jegyzőkönyv generálása" gomb
2. Preview modal (Markdown editor)
3. Szerkesztés lehetőség
4. "PDF letöltés" / "Mentés" gombok

#### Szerkesztő
- Markdown editor (pl. @uiw/react-md-editor)
- Live preview
- Sablon placeholderek kiemelése
- Spell check (magyar)

### Technikai Megvalósítás

#### Frontend
```typescript
// src/components/minutes/MinutesGenerator.tsx
// src/components/minutes/MinutesEditor.tsx
// src/components/minutes/MinutesPdfExport.tsx
```

#### Backend
```typescript
// supabase/functions/generate-minutes/index.ts
// - Input: meeting_id
// - Output: { markdown: string, summary?: string }
```

#### PDF Generálás Opciók
1. **react-pdf** - React komponens → PDF
2. **puppeteer** - HTML → PDF (Supabase Edge Function)
3. **pdfmake** - JSON → PDF

#### Database
```sql
-- minutes tábla már létezik
-- Új mezők ha kellenek:
ALTER TABLE minutes ADD COLUMN template_version TEXT DEFAULT 'v1';
ALTER TABLE minutes ADD COLUMN generated_at TIMESTAMPTZ;
ALTER TABLE minutes ADD COLUMN generated_by UUID REFERENCES members(id);
```

### Acceptance Criteria
- [ ] Jegyzőkönyv generálható bármely befejezett gyűléshez
- [ ] Markdown editor működik, változások menthetők
- [ ] PDF export megfelelő formázással
- [ ] Magyar karakterek helyesen jelennek meg
- [ ] Aláírási helyek a PDF-ben
- [ ] AI összefoglaló opcionálisan generálható

---

## 🗳️ VOTING-001: Valós Idejű Szavazás

### Leírás
Élő szavazás napirendi pontokra Supabase Realtime-mal.

### Követelmények
- Szavazás indítása (chair/admin)
- Valós idejű szavazat beérkezés
- Eredmény animáció
- Szavazás lezárása
- Automatikus eredmény számítás (súlyozott)

### UI
- Szavazás kártya: Igen / Nem / Tartózkodom gombok
- Progress bar (hány % szavazott)
- Eredmény chart (pie/bar)

---

## 📅 SCHEDULE-001: Időpont Egyeztetés (Doodle)

### Leírás  
Doodle-szerű időpont szavazás gyűlés előtt.

### Követelmények
- Admin: időpont opciók hozzáadása
- Tagok: ✅ Igen / ⚠️ Talán / ❌ Nem szavazás
- Összesítés és nyertes kiválasztás
- Email értesítés (opcionális)

### Státusz
✅ Adatbázis séma kész
⏳ UI implementáció szükséges

---

## 📊 QUORUM-001: Határozatképesség

### Leírás
Automatikus quorum számítás és megjelenítés.

### Követelmények
- Jelenlévők súlyának összesítése
- Quorum típusok: egyszerű többség, 2/3, egyhangú
- Vizuális indikátor (zöld/piros)
- Figyelmeztetés ha nem határozatképes

---

## 🔐 AUTH-001: Hitelesítés

### Leírás
Supabase Auth magic link + meghívó kód.

### Követelmények
- Magic link email
- Szervezeti meghívó kód
- Role-based access (admin, chair, voter, observer)

---

## 📄 DOCS-001: Dokumentumtár

### Leírás
Gyűléshez kapcsolódó dokumentumok kezelése.

### Követelmények
- Upload (PDF, DOCX, images)
- Supabase Storage
- Verziókezelés
- Jogosultság kezelés

---

## Prioritás Sorrend
1. 🔴 MINUTES-001 - Jegyzőkönyv Generátor
2. 🔴 VOTING-001 - Valós Idejű Szavazás  
3. 🟡 SCHEDULE-001 - Időpont Egyeztetés UI
4. 🟡 QUORUM-001 - Határozatképesség
5. 🟢 AUTH-001 - Hitelesítés
6. 🟢 DOCS-001 - Dokumentumtár
