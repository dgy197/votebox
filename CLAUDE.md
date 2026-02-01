# CLAUDE.md - VoteBox v2 Projekt Instrukciók

## 🎯 Projekt Kontextus

Ez egy **szavazó alkalmazás** közgyűlésekhez és szervezeti eseményekhez.
- **Verzió:** 2.0.0
- **Alapja:** v1 (működő app, lásd: ../v1/)
- **Workflow:** Ralph Loop (iteratív fejlesztés)

## 📋 Kötelező Dokumentumok

Minden munkamenet elején olvasd be:
1. `PRD.md` - Project Requirements (feladatok, sikerkritériumok)
2. `PROGRESS.md` - Haladás követése (melyik task-nál tartunk)

## 🏗️ Mappa Struktúra Szabályok

```
projects/voting-app/
├── archive/       ❌ NE NYÚLJ HOZZÁ!
├── current/       ❌ NE NYÚLJ HOZZÁ! (majd stabil v2)
└── work/
    ├── v1/        👁️ CSAK OLVASÁS (referencia)
    └── v2/        ✅ ITT DOLGOZZ
```

**TILOS:**
- Archive mappába írni
- Current mappába írni (amíg nem stabil)
- v1 kódot módosítani

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **i18n:** i18next (HU/EN)
- **Backend:** Supabase (Auth, DB, Realtime)
- **Icons:** Lucide React

## 📁 Kód Struktúra

```
src/
├── components/
│   ├── admin/      # Admin komponensek
│   ├── super/      # Super Admin komponensek (ÚJ!)
│   ├── voter/      # Szavazó komponensek
│   ├── layout/     # Layout elemek
│   └── shared/     # Közös komponensek
├── pages/
│   ├── admin/      # Admin oldalak
│   ├── super/      # Super Admin oldalak (ÚJ!)
│   ├── voter/      # Szavazó oldalak
│   └── auth/       # Bejelentkezés
├── stores/         # Zustand store-ok
├── services/       # Supabase service-ek
├── types/          # TypeScript típusok
├── hooks/          # Custom hooks
├── lib/            # Utility-k (i18n, supabase client)
└── locales/        # Fordítások (hu.json, en.json)
```

## ✅ Kódolási Szabályok

1. **TypeScript strict mód** - minden típus explicit
2. **Komponensek:** Funkcionális + hooks
3. **Naming:** PascalCase komponensek, camelCase funkciók
4. **i18n:** Minden szöveg fordítható (`t('key')`)
5. **Tailwind:** Utility-first, no custom CSS
6. **Commit:** Minden sikeres task után

## 🔄 Ralph Loop Workflow

1. Olvasd be: `PRD.md` + `PROGRESS.md`
2. Keresd meg a következő `⬜ PENDING` taskot
3. Hajtsd végre
4. Ellenőrizd a sikerkritériumot
5. Ha OK → frissítsd `PROGRESS.md`-t ✅
6. Ha FAIL → javítsd, újra
7. Commit: `git add . && git commit -m "✅ TASK-XXX: leírás"`

## 🔐 Biztonsági Szabályok

- **NE commitolj:** `.env`, API kulcsokat, jelszavakat
- **RLS:** Minden Supabase művelet RLS-en keresztül
- **Auth:** Ellenőrizd a role-t minden védett route-on

## 🧪 Tesztelés

```bash
# Unit tesztek
npm run test

# E2E (Playwright)
npm run test:e2e

# Lint
npm run lint
```

## 🚀 Futtatás

```bash
# Függőségek telepítése
npm install

# Dev szerver
npm run dev

# Build
npm run build
```

## 📞 Ha Elakadsz

1. Nézd meg a v1 referenciát: `../v1/`
2. Olvasd el a `PRD.md` releváns részét
3. Kérdezz a koordinátortól (Brainy)

---

*Koordinátor: Brainy 🧠 (OpenClaw/Telegram)*
*Projekt: VoteBox v2*
