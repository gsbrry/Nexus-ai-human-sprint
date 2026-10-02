# NEXUS · Pending Items & Test Checklist

> Updated after the real-data migration session. Everything below reflects the
> code on `feature/S5-kanban-comments-real-data`, verified by `tsc --noEmit`,
> `next build`, and a mock-mode route smoke test.

---

## 🟢 Now working on real Supabase data

| Area | State |
|---|---|
| Auth: login, register, reset, profile setup, Google SSO | ✅ |
| `/setup` wizard + `/api/setup/seed` | ✅ |
| Dashboard, Projects, Project detail, Sprints, Sprint detail, Backlog, My tasks, Velocity | ✅ |
| **Kanban drag-drop** (`/sprints/[id]`) | ✅ optimistic, rolls back on failure |
| **Task detail panel** with live comment thread + composer | ✅ human / AI agent source |
| **Settings** — all 5 tabs | ✅ |
| **Notification bell** + mark read | ✅ |
| **Import wizard** targeting real projects and sprints | ✅ |
| **Super admin** SA-01 / SA-02 | ✅ |
| **Project create/edit** (P-03) | ✅ |
| Per-project backlog `/projects/[id]/backlog` | ✅ |

Demo mode is unchanged: the demo cookie still renders the GBM mocks everywhere.

---

## 🔑 Keys — users bring their own, nothing goes in the environment

| Integration | Where it is set | Without it |
|---|---|---|
| Anthropic | Settings → API keys, per user | Mode 1 manual JSON import works normally |
| Telegram bot | Settings → API keys, per workspace, org admin | In-app and email notifications still fire |
| AI agent webhook key | Settings → API keys, issued by the app, shown once | Scrum masters can still paste AI updates as comments |
| Resend | `RESEND_API_KEY` env | In-app notifications still fire |

None of the three is ever returned to the browser. The Anthropic column is
revoked from every client role at database level (migration 014); the Telegram
and agent keys live in `org_integrations`, which has RLS on and no policies, so
only `service_role` reaches them (migration 015).

---

## ⚠️ Before any of this runs: migrations must be executed

```bash
# 1. Open the Supabase SQL editor for your project
# 2. Dump the full bundle:
cat supabase/_bundle_schema.sql
# 3. Paste into the SQL editor → Run
```

The bundle now includes three new migrations beyond the original 13:

- `014_profile_visibility.sql` — org members can read each other's profile
  basics (without this, every assignee avatar is blank), and
  `profiles.anthropic_api_key` is revoked at column level
- `015_org_integrations.sql` — per-workspace Telegram bot token and AI agent key
- `016_telegram_updates.sql` — webhook replay guard

---

## 🧪 Still to verify — nothing below has been run

Everything above is verified by type-check, production build and a mock-mode
route smoke test only. **No code in this session has been exercised against a
live Supabase instance**, because there is no `.env.local` in the working copy.

### Hard gates (@Nina)
- [ ] RLS test 1 — User A cannot read User B's tasks
- [ ] RLS test 2 — Org A member cannot see any Org B data
- [ ] RLS test 3 — `audit_log` UPDATE returns a permission error
- [ ] RLS test 4 — anonymous key returns 0 rows on all tables
- [ ] RLS test 5 — `select anthropic_api_key from profiles` is denied as `authenticated`
- [ ] CSV formula injection blocked at the API layer
- [ ] Telegram webhook replay — same `update_id` twice returns `duplicate: true`
- [ ] Telegram webhook with a wrong secret token returns 401
- [ ] Password reset link expires in exactly 1 hour

### Functional
- [ ] Drag a card between columns, confirm the DB row and the header totals move
- [ ] Post a comment, confirm the assignee gets in-app + email
- [ ] Save an Anthropic key, confirm the import wizard offers "Generate with Claude"
- [ ] Connect a Telegram bot, `/start` the bot, confirm it replies with the chat ID
- [ ] Issue an agent key, POST to `/api/ai/agent-update`, confirm the purple badge
- [ ] Complete a sprint, confirm the velocity snapshot and the backlog return
- [ ] Load test bulk-update with 50 concurrent requests

---

## 🧹 Remaining backlog

- [ ] Rename leftover `text-gold` / `bg-gold` / `border-gold` → `primary`
      (the mock components still carry them; all new code uses `primary`)
- [ ] Generate `types/database.ts` from the real schema with
      `npx supabase gen types typescript` and drop the `any` casts in
      `lib/server/api.ts`
- [ ] Encrypt the stored Anthropic key at rest (pgsodium or an app-side secret).
      It is currently plaintext in a column no client role can read.
- [ ] Prune `telegram_updates` rows older than Telegram's retry window
- [ ] `@mention` autocomplete in the comment composer; matching is currently by
      first name or email handle
- [ ] Sprint create/edit UI — the API exists (`/api/sprints`), the screen does not
- [ ] Velocity snapshots are written on sprint completion only; no daily job yet
