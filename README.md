# NEXUS

AI-era project management. Human teams and AI agents working side by side in sprints.

## Repo

`git@github.com:gsbrry/Nexus-ai-human-sprint.git`

## Stack

Next.js 14 App Router · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres + Auth + Realtime + RLS) · Resend · Telegram Bot API · Recharts · dnd-kit · Vercel.

See [`CLAUDE.md`](./CLAUDE.md) for the full war-room briefing, team, sprint plan, and design tokens.

## Quick start

```bash
yarn install
cp .env.example .env.local   # fill in keys
yarn dev
```

## Database

Migrations live in `supabase/migrations/`. Apply with:

```bash
supabase link --project-ref <ref>
supabase db push
```

Then seed:

```bash
supabase db execute --file supabase/seeds/dev_seed.sql
```

## Status

Sprint 1 — Foundation. DB + Auth scaffold complete. No UI yet (per spec).
