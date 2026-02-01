# 🎼 VoteBox v2 - MASTER PLAN

*Karmester: Brainy 🧠*
*Készült: 2026-01-31 20:45*

---

## 🎯 CÉL

Egy **teljes, tesztelt, production-ready** szavazó alkalmazás:
- ✅ Biztonságos (RLS, audit)
- ✅ Szép design (Mobile First!)
- ✅ Jó UX (responsive, i18n, dark mode)
- ✅ Tesztelt (unit + E2E)
- ✅ Dokumentált

---

## 👥 SUB-AGENTEK ÉS SZEREPÜK

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAINY (Karmester) 🎼                     │
│              Koordinál, delegál, riportol                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FÁZIS 1: DESIGN                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎨 UI/UX Designer Agent                             │   │
│  │  - Mobile First design system                        │   │
│  │  - Tailwind komponensek                              │   │
│  │  - Dark/Light mode                                   │   │
│  │  - Accessibility (WCAG)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  FÁZIS 2: FEJLESZTÉS                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💻 Frontend Engineer Agent                          │   │
│  │  - React komponensek                                 │   │
│  │  - Countdown timer                                   │   │
│  │  - QR kód generálás                                  │   │
│  │  - Export funkciók                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚙️ Backend Engineer Agent                           │   │
│  │  - Supabase service-ek                               │   │
│  │  - RLS policies                                      │   │
│  │  - Realtime subscriptions                            │   │
│  │  - Edge functions (ha kell)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  FÁZIS 3: TESZTELÉS                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🧪 QA Engineer Agent                                │   │
│  │  - Unit tesztek (Vitest)                             │   │
│  │  - E2E tesztek (Playwright)                          │   │
│  │  - Manuális tesztelés                                │   │
│  │  - Bug lista + javítás                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  FÁZIS 4: SECURITY                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔒 Security Auditor Agent                           │   │
│  │  - Semgrep scan                                      │   │
│  │  - RLS ellenőrzés                                    │   │
│  │  - Hardcoded secrets keresés                         │   │
│  │  - OWASP top 10 check                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  FÁZIS 5: FINALIZÁLÁS                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📝 Final Review                                     │   │
│  │  - Build ellenőrzés                                  │   │
│  │  - Performance check                                 │   │
│  │  - Dokumentáció                                      │   │
│  │  - Deployment prep                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 RÉSZLETES ÜTEMTERV

### 🎨 FÁZIS 1: UI/UX DESIGN (15-20 perc)
**Agent:** UI/UX Designer

| Task | Leírás | Idő |
|------|--------|-----|
| D-01 | Design system létrehozása (colors, spacing, typography) | 5 min |
| D-02 | Mobile First layout komponensek | 5 min |
| D-03 | Shared UI komponensek (Button, Card, Modal, Input) | 5 min |
| D-04 | Dark/Light theme finomhangolás | 3 min |
| D-05 | Loading states, empty states, error states | 2 min |

**Output:** `src/components/ui/` - újrahasználható komponensek

---

### 💻 FÁZIS 2: FRONTEND FEJLESZTÉS (30-40 perc)
**Agent:** Frontend Engineer

| Task | Leírás | Idő |
|------|--------|-----|
| F-01 | Super Admin dashboard újratervezése (mobile first) | 8 min |
| F-02 | Admin dashboard újratervezése | 8 min |
| F-03 | Voter felület újratervezése | 8 min |
| F-04 | Countdown Timer komponens | 5 min |
| F-05 | QR kód generálás (qrcode.react) | 5 min |
| F-06 | CSV Export funkció | 5 min |
| F-07 | PDF Export funkció (jegyzőkönyv) | 5 min |

**Output:** Működő UI minden szerepkörre

---

### ⚙️ FÁZIS 3: BACKEND FEJLESZTÉS (15-20 perc)
**Agent:** Backend Engineer

| Task | Leírás | Idő |
|------|--------|-----|
| B-01 | Supabase service-ek refaktorálása | 5 min |
| B-02 | Time limit logika (auto-close) | 5 min |
| B-03 | RLS policies ellenőrzése/javítása | 5 min |
| B-04 | Realtime subscription-ök | 5 min |

**Output:** Biztonságos, működő backend

---

### 🧪 FÁZIS 4: TESZTELÉS (20-25 perc)
**Agent:** QA Engineer

| Task | Leírás | Idő |
|------|--------|-----|
| T-01 | Unit tesztek - stores | 5 min |
| T-02 | Unit tesztek - komponensek | 5 min |
| T-03 | E2E teszt - Admin flow | 5 min |
| T-04 | E2E teszt - Voter flow | 5 min |
| T-05 | Manuális teszt minden funkcióra | 5 min |

**Output:** Teszt riport, bug lista

---

### 🔒 FÁZIS 5: SECURITY AUDIT (10-15 perc)
**Agent:** Security Auditor

| Task | Leírás | Idő |
|------|--------|-----|
| S-01 | Semgrep scan | 3 min |
| S-02 | RLS policy audit | 3 min |
| S-03 | Secrets/keys ellenőrzés | 2 min |
| S-04 | XSS/Injection ellenőrzés | 3 min |
| S-05 | Audit riport készítése | 2 min |

**Output:** Security riport, javítások

---

### 📦 FÁZIS 6: FINALIZÁLÁS (10 perc)
**Agent:** Brainy (karmester)

| Task | Leírás | Idő |
|------|--------|-----|
| X-01 | npm run build - sikeres | 2 min |
| X-02 | Lighthouse performance check | 3 min |
| X-03 | README.md frissítése | 3 min |
| X-04 | PROGRESS.md 100%-ra | 2 min |

**Output:** Production-ready app

---

## ⏱️ TELJES BECSÜLT IDŐ

| Fázis | Idő |
|-------|-----|
| 1. Design | 15-20 min |
| 2. Frontend | 30-40 min |
| 3. Backend | 15-20 min |
| 4. Tesztelés | 20-25 min |
| 5. Security | 10-15 min |
| 6. Finalizálás | 10 min |
| **ÖSSZESEN** | **~100-130 min** |

---

## 📱 MOBILE FIRST DESIGN ELVEK

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablet */
md: 768px   /* Small laptop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Prioritások
1. **Touch-friendly:** min 44px tap targets
2. **Readable:** min 16px font size
3. **Fast:** Lazy loading, optimized images
4. **Offline-tolerant:** Loading states, error handling

### Komponens struktúra
```
Mobile: Egymás alatt (flex-col)
Tablet: 2 oszlop ahol érdemes
Desktop: 3+ oszlop, sidebar
```

---

## 🔄 FOLYAMATOS TESZTELÉS SZABÁLY

**Minden fejlesztési task után:**
1. ✅ Dev szerver fut (`npm run dev`)
2. ✅ Böngészőben ellenőrzés (desktop + mobile view)
3. ✅ Console errors = 0
4. ✅ TypeScript errors = 0
5. ✅ Funkció működik az elvártnak megfelelően

**Ha bármelyik FAIL:**
→ Javítás, újra ellenőrzés, csak utána tovább

---

## 📊 STÁTUSZ RIPORT FORMÁTUM (15 percenként)

```
🎼 VoteBox v2 - Státusz [HH:MM]

📍 Jelenlegi fázis: X/6
📍 Aktív agent: [Agent neve]
📍 Aktuális task: [Task ID]

✅ Kész: X task
🔄 Folyamatban: X task
⬜ Hátra: X task

📝 Utolsó változások:
- [változás 1]
- [változás 2]

⚠️ Problémák: [ha van]

📱 Mobile teszt: ✅/❌
🖥️ Desktop teszt: ✅/❌
```

---

## ✅ SIKERKRITÉRIUMOK (VÉGSŐ)

A projekt akkor KÉSZ, ha:

1. ✅ Minden PRD.md task DONE
2. ✅ `npm run build` hiba nélkül
3. ✅ Semgrep: 0 critical/high finding
4. ✅ Mobile responsive minden oldalon
5. ✅ Dark mode működik
6. ✅ i18n működik (HU/EN)
7. ✅ Super Admin tud: org CRUD, belépés org-ba
8. ✅ Admin tud: event/question/participant CRUD
9. ✅ Voter tud: szavazni, eredményt látni
10. ✅ Countdown timer működik
11. ✅ QR kód generálás működik
12. ✅ CSV export működik

---

*Terv verzió: 1.0*
*Jóváhagyásra vár*
