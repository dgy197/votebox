# VoteBox v2 🗳️

Modern, reszponzív szavazó alkalmazás React + TypeScript + Supabase technológiákkal.

## ✨ Funkciók

- **Eseménykezelés** - Szavazási események létrehozása és kezelése
- **Valós idejű szavazás** - Résztvevők valós időben adhatják le szavazatukat
- **QR kód belépés** - Egyszerű belépés QR kód beolvasásával
- **Demo mód** - Kipróbálás backend nélkül
- **Multi-nyelv** - Magyar és angol támogatás
- **Dark/Light téma** - Automatikus és manuális témaváltás
- **Reszponzív design** - Mobil-first megközelítés
- **Export funkciók** - PDF és CSV export eredményekhez

## 🛠️ Technológiák

- **Frontend:** React 19, TypeScript 5.9
- **State Management:** Zustand
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (opcionális)
- **Build:** Vite 7
- **Testing:** Vitest + React Testing Library
- **i18n:** i18next

## 🚀 Telepítés

```bash
# Repo klónozása
git clone <repo-url>
cd votebox

# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
npm run dev
```

## ⚙️ Környezeti változók

Hozz létre egy `.env` fájlt a projekt gyökerében:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Megjegyzés:** A `.env` fájl nélkül az app automatikusan Demo módban működik.

## 🎭 Demo Mód

Az alkalmazás teljes funkcionalitással működik Supabase backend nélkül is:

- **Automatikus aktiválás:** Ha nincs `.env` vagy a Supabase nem elérhető
- **Mock adatok:** Demo szervezet, esemény, résztvevők és kérdések
- **Real-time szimuláció:** Szavazások és állapotváltozások követése
- **Teljes funkcionalitás:** Admin és szavazó felület tesztelése

```typescript
// Manuális Demo mód kezelés
import { enableDemoMode, disableDemoMode, isDemoMode } from './services'

enableDemoMode()   // Demo mód bekapcsolás
disableDemoMode()  // Supabase mód
isDemoMode()       // Aktuális állapot
```

## 🔒 Backend Biztonság (RLS)

A Supabase Row Level Security policy-k szigorúan korlátozzák a műveleteket:

- **Szavazás:** Csak aktív kérdésre, jelenlévő résztvevőkkel
- **Dupla szavazás:** Adatbázis szinten megelőzve
- **Time limit:** Server-side ellenőrzés
- **Audit log:** Minden művelet naplózva

## 📦 Scripts

| Parancs | Leírás |
|---------|--------|
| `npm run dev` | Fejlesztői szerver indítása |
| `npm run build` | Production build készítése |
| `npm run preview` | Build előnézete |
| `npm run test` | Tesztek futtatása (watch) |
| `npm run test:run` | Tesztek egyszeri futtatása |
| `npm run test:coverage` | Coverage report generálása |
| `npm run lint` | ESLint ellenőrzés |

## 📁 Projekt struktúra

```
src/
├── components/
│   ├── admin/        # Admin komponensek
│   ├── layout/       # Layout komponensek (Header, Layout)
│   ├── shared/       # Újrafelhasználható komponensek
│   └── ui/           # UI primitívek (Button, Card, Modal, stb.)
├── lib/              # Külső library konfigok (i18n, supabase)
├── locales/          # Nyelvi fájlok (hu.json, en.json)
├── pages/            # Oldal komponensek
│   ├── admin/        # Admin dashboard
│   ├── auth/         # Login oldalak
│   ├── super/        # Super Admin dashboard
│   └── voter/        # Szavazó dashboard
├── hooks/            # Custom React hooks (useRealtime, stb.)
├── services/         # API szolgáltatások (Supabase + Demo)
├── stores/           # Zustand store-ok
├── types/            # TypeScript típusok
└── utils/            # Utility függvények
```

## 🧪 Tesztelés

```bash
# Unit tesztek futtatása
npm run test:run

# Coverage report
npm run test:coverage
```

**Teszt lefedettség:** 133 teszt, 11 teszt fájl

## 🎨 Design rendszer

### Színek
- **Primary:** Blue (kék árnyalatok)
- **Semantic:** Success (zöld), Warning (sárga), Error (piros)
- **Neutrals:** Slate árnyalatok

### Komponensek
- Minden UI komponens támogatja a dark/light témát
- Reszponzív breakpoint-ok: `sm` (640px), `md` (768px), `lg` (1024px)

## 📄 Licenc

MIT

---

**VoteBox v2.0.1** - Készült ❤️-vel
