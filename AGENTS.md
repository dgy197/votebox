# AGENTS.md - VoteBox AI Fejlesztési Szabályok

## Projekt Áttekintés
**VoteBox** - Komplett gyűléskezelő és szavazó platform társasházak, cégek számára.

## Tech Stack
- **Frontend:** React 19 + Vite + TailwindCSS + shadcn/ui
- **Backend:** Supabase (Auth, DB, Realtime, Storage, Edge Functions)
- **Nyelv:** TypeScript (strict mode)
- **Tesztelés:** Vitest (unit) + Playwright (E2E)
- **Deployment:** Vercel

## Kód Stílus
- Tömör, olvasható kód
- Felesleges kommentek kerülése
- TypeScript strict mode
- shadcn/ui komponensek használata ahol lehet
- Tailwind utility classes (no custom CSS unless necessary)

## Fejlesztési Szabályok

### 1. Feature Branch Workflow
```bash
git checkout -b feature/[feature-name]
# ... fejlesztés ...
git commit -m "feat: [description]"
git push origin feature/[feature-name]
```

### 2. Minden Feature-höz
- [ ] Unit tesztek (Vitest)
- [ ] E2E teszt ha UI-t érint (Playwright)
- [ ] TypeScript types
- [ ] Error handling
- [ ] Loading states

### 3. Supabase Szabályok
- RLS policy minden táblához
- Edge Function-ök TypeScript-ben
- Migration file minden schema változáshoz

### 4. Fájl Struktúra
```
src/
├── components/
│   ├── ui/           # shadcn komponensek
│   └── [feature]/    # feature-specifikus
├── hooks/            # custom hooks
├── lib/              # utilities, supabase client
├── pages/            # route components
├── types/            # TypeScript interfaces
└── stores/           # Zustand stores
```

## Prioritások
1. 🔴 Működő kód > szép kód
2. 🟡 Tesztek > dokumentáció
3. 🟢 User experience > features száma

## Jelenlegi Sprint
Lásd: IMPLEMENTATION_PLAN.md
