# NEXUS · Pending Items & Test Checklist

> Read this when you're back at the PC. Everything below is **deferred but unblocked** — the app
> runs perfectly on YALLO mocks until you flip these on.

Last updated: end of Sprint 4 · Phase 4B (jumping straight to Sprint 5 next).

---

## 1. External API keys (block real integrations only)

| # | Integration | Where it's used | What you need | Status |
|---|---|---|---|---|
| 1 | **Supabase** | DB, Auth, RLS for the entire app | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `app/.env.local` | ⏳ Pending |
| 2 | **Anthropic Claude** | AI prompt generation (Sprint 3 import wizard), AI agents | `ANTHROPIC_API_KEY` (or per-user in `profiles.anthropic_api_key`) | ⏳ Pending |
| 3 | **Resend** | N-04 invite emails, daily digest emails | `RESEND_API_KEY` + verified sender domain (or use `onboarding@resend.dev` for testing) | ⏳ Pending (Phase 4C skipped) |
| 4 | **Telegram Bot** | Notification mirroring, invite pings | Bot token from @BotFather + per-user/org `chat_id` capture flow | ⏳ Pending (Phase 4C skipped) |

> When you have a key, drop it into `app/.env.local` (NEVER `app/.env`), restart with
> `sudo supervisorctl restart nextjs`, and the corresponding feature will swap from mock → live
> automatically thanks to the `isAuthConfigured()` guard pattern.

---

## 2. Phase 4C work (skipped, to resume later)

These files **do not exist yet** — they will be created once you have the keys:

- `app/api/integrations/resend/send/route.ts` — POST endpoint for transactional email
- `app/api/integrations/telegram/send/route.ts` — POST endpoint for bot messages
- `app/api/integrations/telegram/webhook/route.ts` — incoming webhook handler (for `/start`, chat_id capture)
- Wire `Save` buttons in **Settings → API keys** so they POST to a real persistence layer (Supabase `profiles.anthropic_api_key` + `orgs.resend_key` + `orgs.telegram_bot_token`)
- Replace mock `setTimeout(800)` in `InviteDialog.tsx` (`sendAll`) with real Resend + Telegram calls
- Add per-user `notification_preferences` table writes from **Settings → Notifications** tab

Resume by saying: **"Continue Phase 4C with [keys]"**.

---

## 3. Supabase data integration (the big swap)

Right now every screen reads from `lib/mock/yallo.ts` and `lib/mock/notifications.ts`. When you
drop Supabase env vars, the next agent should:

1. **Run the 13 migrations** in `supabase/migrations/001_*.sql` through `013_*.sql`
2. **Seed dev data** from `supabase/seeds/dev_seed.sql` (or generate from mocks)
3. **Replace mocks file-by-file**:
   - `app/(app)/dashboard/page.tsx` → server component reading from Supabase
   - `app/(app)/projects/**`
   - `app/(app)/sprints/**`
   - `app/(app)/tasks/**`
   - `app/(app)/velocity/**`
   - `app/(app)/settings/**` (Members tab → `org_members`, Invites → new `invites` table)
   - `components/notifications/NotificationBell.tsx` → real-time channel
4. **Auth flip**: `lib/auth-config.ts` already gates this — remove the `isAuthConfigured()` short-circuits in the API routes once env is live.
5. **RLS manual tests** (Nina's checklist — 4 scenarios):
   - Member of org A cannot read tasks from org B
   - Member can read all tasks in their own org
   - Only `org_admin` can mutate org settings
   - Service role bypasses RLS (sanity check for cron jobs)

---

## 4. Testing matrix (do these BEFORE shipping to real users)

### 4A. Backend testing (delegate to `deep_testing_backend_nextjs`)
- [ ] All `/api/auth/*` routes (login, register, logout, forgot, reset) — once Supabase is on
- [ ] All `/api/projects`, `/api/sprints`, `/api/tasks` CRUD + RLS
- [ ] `/api/tasks/[id]/status` (Kanban drag-drop optimistic update)
- [ ] `/api/import/json` (CSV → JSON pipeline + Claude prompt gen)
- [ ] `/api/integrations/resend/send` + `telegram/send` (when 4C lands)
- [ ] Pagination + filter edge cases on `/api/velocity` snapshots

### 4B. Frontend testing (delegate to `deep_testing_frontend_nextjs` — needs your explicit OK each time)
- [ ] Auth flow end-to-end (register → email confirm → profile setup → dashboard)
- [ ] Project create → Sprint create → Tasks → Kanban drag → Done → Velocity rollup
- [ ] CSV Import Wizard happy path + error states (malformed CSV, duplicate keys, AI prompt timeout)
- [ ] Notification bell: filter pills, mark-all-read, click-through, unread badge math
- [ ] Settings: every tab, every save button, Invite flow including the success state
- [ ] Mobile responsiveness for all screens at 375px width

### 4C. Manual sanity checks (you, eyeball)
- [ ] YALLO dark theme (`#111`) is consistent across every page
- [ ] Primary brand color (`#1a73e8` blue, was `#D4A843` gold) and Plus Jakarta Sans + DM Mono fonts intact
- [ ] Role switcher (Member · SM · Admin in topbar preview mode) shows/hides correct nav items
- [ ] Admin item only shows for `super_admin`

---

## 5. Refactor / cleanup backlog (do AFTER Sprint 5)

- [ ] Move mock data files out of `/lib/mock` and into a single `seedFromMock()` Supabase seed script
- [ ] Split `/app/(app)/settings/page.tsx` (~600 lines) into per-tab files under `/components/settings/tabs/`
- [ ] Extract `Mini`, `Stat`, `SectionHeader` repeated tile components into `/components/ui/stat-tile.tsx`
- [ ] Audit unused `lib/validations/*` schemas after Supabase types are generated
- [ ] Add real route handlers for the auth APIs (right now they 503 by design)

---

## 6. Sprint 5 scope (current target)

- **SA-01** Super admin · orgs list + drilldown (search, filter by plan, member count, MRR)
- **SA-02** Super admin · platform metrics (orgs/day, MAU, AI spend, sprint completion rate)
- **QA load testing** — k6 or artillery scripts hitting the public API routes

---

## Quick resume commands when you're back

```bash
# Check what's running
sudo supervisorctl status

# Pull the latest mock-only build
curl -sI http://localhost:3000/dashboard

# Read this file
cat /app/PENDING.md
```
