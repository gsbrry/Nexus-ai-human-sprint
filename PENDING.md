# NEXUS · Pending Items & Test Checklist

> Read this when you're back at the PC. Updated end of Sprint 5 wrap-up session.

---

## 🟢 What works RIGHT NOW

| Path | Mode | Notes |
|---|---|---|
| `/login` (demo mode) | ✅ Mock | Pick any of 8 teammates, instant in |
| `/dashboard` (demo) | ✅ Mock | Role-aware (Member/SM/Admin/SA) |
| `/dashboard` (real Supabase auth) | ✅ Real | Detects missing migrations + empty workspace gracefully |
| `/projects`, `/projects/[id]`, `/sprints`, `/sprints/[id]`, `/sprints/backlog`, `/tasks`, `/velocity` | ✅ Both | Auto-branches: demo cookie → mock, real session → Supabase |
| `/setup` wizard | ✅ Live | Detects which step you're on (env / auth / migrations / seed) and shows only that |
| `/api/setup/seed` | ✅ Live | Idempotent — creates org + 2 projects + 2 sprints + 14 tasks for current user |
| `/admin`, `/settings`, project/sprint **detail views** | ⏳ Mock only | Migration to real data deferred to next session |

---

## 🔑 External API keys still pending

| # | Integration | What you need | Status |
|---|---|---|---|
| 1 | **Supabase** | Already provided ✅ but **migrations not yet run** | Run `cat /app/supabase/_bundle_schema.sql` and paste into Supabase SQL editor |
| 2 | **Google OAuth** | OAuth client in Google Cloud Console + provider toggle in Supabase | See `/app/SETUP_SUPABASE.md` step 3 |
| 3 | **Anthropic Claude** | `ANTHROPIC_API_KEY` (or per-user) for AI agents + Sprint 3 prompt gen | Pending |
| 4 | **Resend** | `RESEND_API_KEY` + verified sender | Pending — Phase 4C |
| 5 | **Telegram Bot** | Bot token from @BotFather + chat_id capture flow | Pending — Phase 4C |

---

## 🎯 Your immediate next steps (when back at PC)

```bash
# 1. Sign in to Supabase SQL editor for your project:
#    https://supabase.com/dashboard/project/pvmtmpuilfhkunpzeffw/sql/new
# 2. Run this in your container terminal to dump the schema bundle:
cat /app/supabase/_bundle_schema.sql
# 3. Paste into the SQL editor → Run. (~2 sec)
# 4. Open /register, create a real Supabase account
# 5. Visit /setup — the wizard auto-detects you're at the "seed" step
# 6. Click "Seed demo data" — workspace is provisioned
# 7. Dashboard / Projects / Sprints / Tasks / Velocity all flip to real data
```

If you ever want to go back to mock mode without losing your Supabase data:
- Sign out → use Demo mode picker on /login → you're back on YALLO mocks instantly

---

## ⚠️ Screens still on mocks even when authenticated

These will keep rendering mock data until I migrate them — deferred to the next session for scope reasons:

- `/tasks/[id]` — task detail slide-in panel
- `/settings` — all 5 tabs (Profile, Org, Members, API keys, Notifications)
- `/admin` — SA-01/SA-02 (orgs list + platform metrics)
- `/import` — CSV import wizard (writes to mocks, not real DB)
- **Kanban drag-drop on real data** — `/sprints/[id]` Real view is read-only currently. Drag-drop status updates need a `/api/tasks/[id]/status` PATCH endpoint wired to Supabase.
- `/api/auth/google` callback handling — works to redirect, but profile sync needs Supabase provider config first

**The architecture is in place**: each of these can be migrated with the same `useRealData()` branching pattern used in Dashboard/Projects/Sprints/Tasks/Velocity. ~15 min per screen.

---

## 🧪 Testing matrix

### Backend (delegate to `deep_testing_backend_nextjs` once auth is fully live)
- [ ] `/api/auth/*` end-to-end (register → confirm → login → logout)
- [ ] `/api/setup/seed` idempotency + RLS scoping
- [ ] `/api/projects`, `/api/sprints`, `/api/tasks` CRUD respect RLS
- [ ] `/api/tasks/[id]/status` optimistic update
- [ ] `/api/import/json` CSV pipeline + Claude prompt gen
- [ ] `/api/integrations/resend/send` + `telegram/send` (Phase 4C)

### Frontend (delegate to `deep_testing_frontend_nextjs` only with your explicit OK each time)
- [ ] Demo login picker → all 8 users
- [ ] Real Supabase signup → setup wizard → seed → dashboard
- [ ] Each screen renders correctly in BOTH demo and real modes
- [ ] Role switcher (Member/SM/Admin/SA) hides/shows correct nav items
- [ ] Mobile responsiveness at 375px

### Manual sanity
- [ ] Primary brand color (`#1a73e8` blue) consistent everywhere
- [ ] Plus Jakarta Sans + DM Mono fonts intact
- [ ] No console errors on any page
- [ ] Notification bell badge math correct
- [ ] Demo cookie cleared on "Exit demo mode"

---

## 🧹 Refactor / cleanup backlog (do AFTER finishing Supabase swap)

- [ ] Rename leftover `text-gold` / `bg-gold` / `border-gold` → `text-primary` / `bg-primary` / `border-primary` (50+ occurrences, all aliased so no visual change, just semantic cleanup)
- [ ] Split 600-line `settings/page.tsx` into per-tab files under `/components/settings/tabs/`
- [ ] Extract `Mini`, `Stat`, `SectionHeader`, `Kpi` repeated tiles into `/components/ui/stat-tile.tsx`
- [ ] Audit unused `lib/validations/*` schemas after Supabase types regenerate
- [ ] Move `lib/mock/*` files to `lib/mock/` subdir (already there) and tag them deprecated in JSDoc
- [ ] Generate fresh `types/database.ts` from real schema with `npx supabase gen types typescript`

---

## 📂 Important files for the next session

| File | What it is |
|---|---|
| `/app/SETUP_SUPABASE.md` | Step-by-step setup guide (Supabase + Google OAuth) |
| `/app/DESIGN_TOKENS.md` | Brand color spec — **always read before adding new screens** |
| `/app/PENDING.md` | This file |
| `/app/supabase/_bundle_schema.sql` | All 13 migrations in one file — paste into SQL editor |
| `/app/CLAUDE.md` | Master prompt / persona instructions |
| `/app/lib/server/feature-flag.ts` | `useRealData()` helper — the pattern for any new screen migration |
| `/app/components/dashboard/RealDashboard.tsx` | Reference implementation of a real-Supabase server component |
| `/app/components/projects/RealProjectsList.tsx` | Another reference |
| `/app/components/sprints/RealSprintsList.tsx` | Another reference |
| `/app/components/tasks/RealMyTasks.tsx` | Another reference |
| `/app/components/velocity/RealVelocity.tsx` | Another reference |

---

## 🔐 Security reminder

You shared `sb_secret_*` in chat. Once everything works end-to-end:
**Supabase → Settings → API → Rotate service_role** (30 seconds, zero downtime) and update `/app/.env.local` with the new value.
