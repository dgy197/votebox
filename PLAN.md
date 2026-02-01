# VoteBox - Szervezeti Szavazó Alkalmazás

## Projekt Áttekintés
Biztonságos, valós idejű szavazó rendszer közgyűlésekhez, taggyűlésekhez és más szervezeti eseményekhez.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **i18n:** i18next (HU/EN)
- **Backend:** Supabase (Auth, Database, Realtime)
- **Icons:** Lucide React

## Főbb Funkciók

### ✅ Kész
- [x] Projekt alapstruktúra
- [x] Tailwind v4 konfiguráció
- [x] i18n (magyar/angol)
- [x] Dark mode támogatás
- [x] Supabase kliens
- [x] Auth store (admin + szavazó)
- [x] Admin bejelentkezés (+ demo mód)
- [x] Szavazó bejelentkezés (+ demo mód)
- [x] **Admin Dashboard** - teljes funkcionalitás
  - [x] Események listázása, létrehozása, szerkesztése
  - [x] Résztvevők kezelése (hozzáadás, tömeges import, kód generálás)
  - [x] Kérdések CRUD (bináris: Igen/Nem/Tartózkodom)
  - [x] Kérdés aktiválás/lezárás gombok
  - [x] Valós idejű státusz (résztvevők, szavazatok)
  - [x] Eredmények megtekintése modálban
- [x] **Voter felület** - teljes funkcionalitás
  - [x] Várakozó képernyő (ha nincs aktív kérdés)
  - [x] Szavazó képernyő (Igen/Nem/Tartózkodom gombok)
  - [x] Szavazat megerősítés modal
  - [x] Visszaigazolás ("Szavazat rögzítve")
  - [x] Eredmény megjelenítés (lezárás után)
  - [x] Automatikus frissítés (realtime + polling)
- [x] **Supabase integráció**
  - [x] CRUD műveletek (events, participants, questions, ballots)
  - [x] Realtime subscription (kérdések, szavazatok)
- [x] Demo gombok (fejlesztéshez)

### 📋 Következő lépések
- [ ] Szavazat időkorlát (countdown)
- [ ] Export funkciók (CSV, PDF)
- [ ] Email értesítések
- [ ] QR kód a belépéshez
- [ ] Kvórum ellenőrzés
- [ ] Audit log megtekintése

## Adatbázis Struktúra

```
organizations
  ├── users (admins)
  └── events
       ├── participants
       └── questions
            ├── ballots (anonymous)
            └── cast_markers (who voted)
```

## Használat

### Admin
1. Belépés: `/admin/login` (vagy Demo gomb)
2. Esemény létrehozása
3. Résztvevők hozzáadása (kódok generálódnak)
4. Kérdések létrehozása
5. Kérdés aktiválása → szavazás indul
6. Kérdés lezárása → eredmények megjelennek

### Szavazó
1. Belépés: `/vote/[EVENT_CODE]` vagy főoldal
2. Esemény kód + belépési kód megadása
3. Várakozás az aktív kérdésre
4. Szavazás (Igen/Nem/Tartózkodom)
5. Eredmények megtekintése

## Fejlesztés

```bash
# Telepítés
npm install

# Dev szerver
npm run dev

# Build
npm run build
```

## .env beállítások
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```
