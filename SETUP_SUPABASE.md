# NEXUS · Supabase + Google Auth setup

> The red "Auth not configured" banner on `/register` is **expected**. It means
> `isAuthConfigured()` (in `/app/lib/auth-config.ts`) didn't find the Supabase env vars.
> Drop them in `app/.env.local` and the banner disappears, registration starts hitting Supabase,
> and the Google button starts the OAuth dance.

There are exactly **3 things** to do, in order:

---

## STEP 1 · Create a Supabase project and grab keys

1. Go to **https://supabase.com → New project**
   - Name: `nexus` (or anything)
   - DB password: pick something strong and **save it in your password manager**
   - Region: closest to you (EU/US/APAC)
   - Pricing tier: Free is fine to start

2. Wait ~2 minutes for it to provision.

3. In the new project, open **Project Settings → API** (left sidebar, gear icon).
   You need **three** strings from this page:

   | Label in Supabase UI | What to copy | Where it goes |
   |---|---|---|
   | **Project URL** | `https://xxxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
   | **Project API keys → anon / public** | long `eyJhbGciOi...` string | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **Project API keys → service_role** ⚠️ secret | long `eyJhbGciOi...` string | `SUPABASE_SERVICE_ROLE_KEY` |

4. Create the env file at **`/app/.env.local`** (NEVER edit `/app/.env`):

   ```bash
   # /app/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...

   # Optional but recommended (so OAuth callbacks land on the right host)
   NEXT_PUBLIC_APP_URL=https://nexus-ai-collab.preview.emergentagent.com
   ```

5. Restart the dev server so the new env vars are picked up:
   ```bash
   sudo supervisorctl restart nextjs
   ```

6. Refresh `/register` — the red banner **disappears**. ✅

---

## STEP 2 · Run the 13 migrations and seed data

The schema is already written, just not loaded yet. You have two options:

### Option A — Run via Supabase SQL Editor (easiest, manual)

1. In Supabase: **SQL Editor → New query**
2. Open each file under `/app/supabase/migrations/` in order:
   ```
   001_enums.sql
   002_profiles.sql
   003_organisations.sql
   004_org_members.sql
   005_projects.sql
   006_sprints.sql
   007_tasks.sql
   008_comments.sql
   009_velocity_snapshots.sql
   010_ai_interactions.sql
   011_csv_imports.sql
   012_notifications.sql
   013_audit_log.sql
   ```
3. Paste each into the SQL editor and click **Run**. Order matters — `001 → 013`.

### Option B — Use the Supabase CLI (one command, recommended)

1. Install the CLI: `brew install supabase/tap/supabase` (or see https://supabase.com/docs/guides/cli)
2. Link it: `cd /app && supabase link --project-ref xxxxx` (the `xxxxx` from your project URL)
3. Push migrations: `supabase db push`

### Verify

In Supabase **Table Editor**, you should now see: `profiles`, `organisations`, `org_members`,
`projects`, `sprints`, `tasks`, `comments`, `velocity_snapshots`, `ai_interactions`,
`csv_imports`, `notifications`, `audit_log`. All with RLS enabled (lock icon = green).

> **Seed data is NOT loaded yet.** A `dev_seed.sql` was planned but skipped. To bootstrap:
> register your first user via the app (after Step 2), then in SQL editor:
> ```sql
> -- Promote yourself to super_admin so the SA-01/SA-02 screens unlock
> UPDATE profiles SET role = 'super_admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com');
> ```

---

## STEP 3 · Enable Google OAuth

The button "Continue with Google" already calls `/api/auth/google`, which calls
`supabase.auth.signInWithOAuth({ provider: 'google' })`. You just need to **register Google
as a provider in your Supabase project**.

### 3A · Make a Google OAuth client

1. Go to **https://console.cloud.google.com → APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Nexus dev`
5. **Authorised JavaScript origins**:
   ```
   https://nexus-ai-collab.preview.emergentagent.com
   http://localhost:3000
   ```
6. **Authorised redirect URIs** (CRITICAL — must be Supabase's callback, NOT yours):
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   Replace `xxxxx` with your Supabase project ref. **This URL is shown verbatim in the next step.**
7. Click **Create**. Copy:
   - **Client ID** (`xxx.apps.googleusercontent.com`)
   - **Client secret**

### 3B · Tell Supabase about the Google client

1. Supabase dashboard → **Authentication → Providers → Google**
2. Toggle **Enabled = ON**
3. Paste your **Client ID** and **Client secret**
4. Copy the **Callback URL** Supabase shows you (`https://xxxxx.supabase.co/auth/v1/callback`)
   and confirm it matches what you put in Google Console above. It must be **byte-identical**.
5. **Save**

### 3C · Configure redirect URLs Supabase will allow

Supabase blocks redirects to unknown hosts by default. Add yours:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://nexus-ai-collab.preview.emergentagent.com`
3. **Redirect URLs** (one per line):
   ```
   https://nexus-ai-collab.preview.emergentagent.com/**
   http://localhost:3000/**
   ```
4. **Save**

### 3D · Test

1. Hard refresh `/register` (cookie cache can confuse OAuth)
2. Click **Continue with Google**
3. You should be redirected to Google's consent screen → choose your account →
   back to `/api/auth/callback` → land on `/dashboard` (or `/profile-setup` if new)

If the popup says **"redirect_uri_mismatch"**: the URI in Google Console doesn't exactly match
the Supabase callback. Re-copy it from Supabase (no trailing slash, no extra path).

---

## What's missing right now (in plain English)

Look at `/register`. The red banner literally tells you:

> **"Auth not configured. Add Supabase keys to .env.local then restart the server."**

That message comes from `/app/lib/auth-config.ts`:

```ts
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

Every auth route (`/api/auth/login`, `/api/auth/register`, `/api/auth/google`, `/api/auth/logout`,
etc.) starts with `if (!isAuthConfigured()) return 503`. That guard is what's blocking real auth.

**The very second you put valid keys in `/app/.env.local` and restart, the same code starts
hitting Supabase for real.** Nothing else needs to change in the auth code.

---

## Quick troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Red "Auth not configured" banner still there after restart | Wrong filename — must be `app/.env.local` (NOT `app/.env`) | `mv app/.env app/.env.local` ❌ NO — instead create a new `.env.local` |
| Google button → "redirect_uri_mismatch" | Mismatch between Google Console and Supabase callback URL | Copy URL from Supabase verbatim, no trailing slash |
| Google login → blank `/auth/callback` page | Supabase `Redirect URLs` doesn't include your domain | Add `https://your-domain/**` in Supabase Auth → URL Configuration |
| Register works but `/dashboard` 500s | Migrations not loaded → no `profiles` row exists | Run all 13 SQL files from `/app/supabase/migrations/` |
| Email confirmation never arrives | Supabase email is rate-limited on free tier | Use **Authentication → Users** in Supabase to manually confirm, or wire Resend (Phase 4C) |
| Service routes (`/api/...`) returning 401 after login | Cookie not propagated to API routes | Ensure middleware (`/app/middleware.ts`) is running and `getUser()` is being called server-side |

---

## After auth is working

Once `/dashboard` loads with your real Supabase user, the next milestones are:

1. **Swap mocks → real Supabase queries** — every screen currently reads from
   `/app/lib/mock/gbm.ts`, `/app/lib/mock/notifications.ts`, `/app/lib/mock/admin.ts`.
   They should hit `supabase.from('tasks').select()` etc. instead.

2. **RLS verification** — Nina's 4-test checklist (see `/app/PENDING.md` section 3).

3. **Phase 4C** — Resend + Telegram + Anthropic key wiring.

4. **Backend testing** — Once auth is live, delegate to `deep_testing_backend_nextjs`.

---

## TL;DR

```bash
# 1. Create Supabase project, copy URL + anon key + service role key
# 2. Put them in app/.env.local (NOT app/.env)
# 3. sudo supervisorctl restart nextjs
# 4. Open Supabase SQL editor, run /app/supabase/migrations/*.sql in order
# 5. Supabase → Auth → Providers → enable Google, paste OAuth client ID/secret from Google Console
# 6. Add your dev URL to Supabase → Auth → URL Configuration → Redirect URLs
# 7. Refresh /register — banner is gone, Google button works
```

That's it. The app does the rest.
