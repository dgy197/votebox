# Changelog

Minden lényeges változás dokumentálva van ebben a fájlban.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült.

## [2.0.1] - 2025-01-31

### 🔒 Biztonság - RLS Policies Javítás

- **KRITIKUS FIX:** Ballot INSERT policy szigorítása
  - Csak aktív kérdésre lehet szavazni
  - Participant validáció (is_present = true)
  - Event státusz ellenőrzés

- **Cast Markers Policy Fix**
  - Dupla szavazás megelőzése RLS szinten
  - Participant érvényesség ellenőrzés

- **Új secure voting function** (`cast_vote_secure`)
  - Tranzakció-biztos szavazás
  - Time limit ellenőrzés
  - Részletes hibaüzenetek

- **Vote results function** (`get_vote_results`)
  - Server-side eredmény számítás
  - Részvételi arány kalkuláció

### ✨ Backend Fejlesztések

- **Demo Mode Backend**
  - Teljes offline működés Supabase nélkül
  - Mock adatok automatikus generálás
  - Real-time subscription szimuláció
  - Automatikus váltás Supabase és Demo mód között

- **Realtime Subscriptions**
  - Question state változás figyelés
  - Ballot/vote count real-time frissítés
  - Participant presence tracking (Supabase Presence API)

- **Új React Hooks**
  - `useQuestionSubscription` - aktív kérdés figyelés
  - `useVoteCount` - szavazatszám real-time
  - `useVoteResults` - eredmények polling + realtime
  - `useParticipantPresence` - jelenlét tracking
  - `useEventStats` - esemény statisztikák
  - `useVoting` - szavazás állapot kezelés
  - `useConnectionStatus` - kapcsolat és demo mód

- **Error Handling**
  - Egyedi `SupabaseError` osztály
  - Részletes hibaüzenetek
  - Graceful fallback demo módra

### 📝 Új Fájlok

- `supabase/migrations/003_rls_security_fix.sql`
- `src/services/demoService.ts`
- `src/services/index.ts` (service wrapper)
- `src/hooks/useRealtime.ts`
- `src/services/demoService.test.ts`

### 🧪 Tesztek

- 23 új demo service teszt
- Összesen 133 teszt (mind zöld ✓)

---

## [2.0.0] - 2025-01-31

### ✨ Hozzáadva

- **Új UI komponens könyvtár**
  - Button komponens (5 variáns, 3 méret, loading és disabled állapot)
  - Card komponens (hover effekt, kattintható verzió)
  - Modal komponens (animáció, ESC billentyű támogatás)
  - Input komponens (hibakezelés, ikon támogatás)
  - Badge komponens (színvariánsok)
  - Spinner, EmptyState, ErrorState komponensek

- **Többnyelvű támogatás (i18n)**
  - Magyar és angol nyelv
  - Automatikus nyelv felismerés
  - Nyelvi váltó a fejlécben

- **Téma rendszer**
  - Dark/Light mód váltás
  - System preference követés
  - Perzisztens beállítás (localStorage)

- **Demo mód**
  - Működés Supabase backend nélkül
  - Mock adatok teszteléshez
  - Automatikus aktiválás `.env` nélkül

- **QR kód generálás**
  - Esemény belépési QR kód
  - Letölthető PNG formátum

- **Export funkciók**
  - PDF export eredményekhez (jsPDF)
  - CSV export résztvevőlistához

- **Tesztek**
  - 110 unit teszt
  - Vitest + React Testing Library
  - Coverage report támogatás

### 🔄 Változtatva

- React 19-re frissítve
- Tailwind CSS 4-re frissítve
- Vite 7-re frissítve
- Zustand 5-re frissítve
- Teljes TypeScript strict mód

### 🎨 UI/UX fejlesztések

- Reszponzív, mobil-first design
- Consistent spacing és tipográfia
- Animált átmenetek
- Accessibility fejlesztések (ARIA attribútumok)
- Touch-friendly gombok (min 44px)

### 🔒 Biztonság

- `.env` fájl eltávolítva a verziókövetésből
- Sensitive adatok gitignore-ban

### 📝 Dokumentáció

- Új README.md
- Teszt dokumentáció (TEST_REPORT.md)
- Inline kód dokumentáció

## [1.0.0] - 2025-01-30

### Hozzáadva
- Kezdeti verzió
- Alap szavazási funkciók
- Supabase integráció
- Admin és Voter felületek

---

[2.0.0]: https://github.com/user/votebox/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/user/votebox/releases/tag/v1.0.0
