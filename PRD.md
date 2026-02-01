# 🗳️ VoteBox v2 - PRD (Project Requirements Document)

*Készült: 2026-01-31*
*Workflow: Ralph Loop + Claude Code Multi-Agent*

---

## 📋 Projekt Összefoglaló

**Cél:** Biztonságos, valós idejű szavazó rendszer közgyűlésekhez és szervezeti eseményekhez.

**Alapja:** VoteBox v1 (work/v1/) - már működő alkalmazás

**Újdonságok v2-ben:**
1. Super Admin szint (több szervezet kezelése)
2. Időkorlát (countdown)
3. Export funkciók (CSV, PDF)
4. QR kód belépés
5. Kvórum ellenőrzés
6. Improved UX

---

## 🏗️ Mappa Struktúra (KÖTELEZŐ)

```
projects/voting-app/
├── archive/           # Korábbi verziók (ne nyúlj hozzá!)
│   └── v1-backup/     # v1 mentés mielőtt módosítanánk
├── current/           # Stabil, éles verzió
│   └── (üres amíg nincs stabil v2)
└── work/              # Aktív fejlesztés
    ├── v1/            # Eredeti v1 (referencia)
    └── v2/            # ÚJ FEJLESZTÉS ITT!
```

**SZABÁLY:** 
- `archive/` = SOHA ne módosítsd
- `current/` = csak stabil kódot
- `work/v2/` = aktív fejlesztés

---

## 🎯 Sikerkritériumok

### Must Have (P0)
1. ✅ v1 összes funkciója működik
2. ✅ Super Admin tud szervezeteket kezelni
3. ✅ Super Admin be tud lépni bármely Org Admin fiókba
4. ✅ RLS működik (felhasználók csak saját adataikat látják)
5. ✅ Tesztek futnak (legalább 80% coverage)

### Should Have (P1)
6. ✅ Időkorlát szavazáshoz (countdown timer)
7. ✅ CSV export (résztvevők, eredmények)
8. ✅ QR kód a belépéshez

### Nice to Have (P2)
9. ⬜ PDF export (jegyzőkönyv formátum)
10. ⬜ Kvórum ellenőrzés
11. ⬜ Email értesítések
12. ⬜ Audit log UI

---

## 👥 Felhasználói Szerepek

```
┌─────────────────────────────────────────────┐
│              SUPER ADMIN                     │
│    (Rendszergazda - több szervezet)          │
├─────────────────────────────────────────────┤
│                    │                         │
│         ┌─────────┴─────────┐               │
│         ▼                   ▼               │
│    ORG ADMIN #1        ORG ADMIN #2         │
│    (Szervezet 1)       (Szervezet 2)         │
│         │                   │               │
│    ┌────┴────┐         ┌────┴────┐          │
│    ▼         ▼         ▼         ▼          │
│  VOTER    VOTER      VOTER    VOTER         │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Adatbázis Bővítés

### Új táblák
```sql
-- Super Admin szerephez
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin';
-- role: 'super_admin' | 'org_admin' | 'viewer'

-- Szervezetek (v1-ben implicit volt)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'
);

-- User-Organization kapcsolat
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'admin', -- 'owner' | 'admin' | 'viewer'
  PRIMARY KEY (user_id, org_id)
);
```

### Módosított táblák
```sql
-- Events kap org_id-t
ALTER TABLE events ADD COLUMN org_id UUID REFERENCES organizations(id);
```

---

## 📱 Új Oldalak

### Super Admin
- `/super` - Super Admin Dashboard
- `/super/organizations` - Szervezetek listája
- `/super/organizations/new` - Új szervezet
- `/super/organizations/[id]` - Szervezet részletek
- `/super/users` - Összes felhasználó

### Org Admin (bővítés)
- Countdown timer a kérdéseknél
- Export gombok

### Voter (bővítés)
- QR kód scanner opció
- Countdown megjelenítés

---

## 🛠️ Tech Stack (változatlan)

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **i18n:** i18next (HU/EN)
- **Backend:** Supabase (Auth, Database, Realtime)
- **Icons:** Lucide React
- **Export:** jsPDF + Papa Parse (CSV)
- **QR:** qrcode.react

---

## 📋 Atomi Feladatok (Ralph Loop Tasks)

### Fázis 1: Előkészítés
- [ ] TASK-001: v1 backup készítése archive/v1-backup-ba
- [ ] TASK-002: v2 mappa létrehozása, v1 kód másolása
- [ ] TASK-003: Supabase migráció fájl (organizations tábla)
- [ ] TASK-004: RLS policies frissítése organizations-höz

### Fázis 2: Super Admin
- [ ] TASK-010: Super Admin auth logika (role check)
- [ ] TASK-011: Super Admin layout + routing
- [ ] TASK-012: Organizations CRUD UI
- [ ] TASK-013: "Belépés szervezetbe" funkció
- [ ] TASK-014: User management UI

### Fázis 3: Időkorlát
- [ ] TASK-020: Question model bővítése (time_limit)
- [ ] TASK-021: Countdown komponens
- [ ] TASK-022: Auto-close logika (lejárt idő = lezárás)

### Fázis 4: Export
- [ ] TASK-030: CSV export (participants)
- [ ] TASK-031: CSV export (results)
- [ ] TASK-032: PDF export setup (jsPDF)
- [ ] TASK-033: Jegyzőkönyv PDF generálás

### Fázis 5: QR Kód
- [ ] TASK-040: QR generálás (belépési link)
- [ ] TASK-041: QR megjelenítés Admin UI-ban
- [ ] TASK-042: QR scanner a Voter oldalon (opcionális)

### Fázis 6: Finomhangolás
- [ ] TASK-050: Tesztek írása (Vitest)
- [ ] TASK-051: E2E tesztek (Playwright)
- [ ] TASK-052: Performance optimalizálás
- [ ] TASK-053: Dokumentáció frissítése

---

## 🔄 Progress Tracking

Minden TASK után frissítsd ezt a szekciót:

```
TASK-001: ⬜ PENDING
TASK-002: ⬜ PENDING
TASK-003: ⬜ PENDING
...
```

Státuszok:
- ⬜ PENDING
- 🔄 IN PROGRESS
- ✅ DONE
- ❌ BLOCKED (ok: ...)
- ⏭️ SKIPPED (ok: ...)

---

## 🚀 Indítás

```bash
# Claude Code indítása a projekt mappában
cd projects/voting-app/work/v2
claude

# Ralph Loop workflow
> "Olvasd be a PRD.md-t és kezdd a TASK-001-el"
```

---

*Koordinátor: Brainy 🧠*
*Fejlesztés: Claude Code + Sub-agentek*
