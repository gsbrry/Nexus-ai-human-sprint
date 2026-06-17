# NEXUS · AI-Era Project Management · War Room

> Raphy Varghese is the founder and product owner. Every decision goes through Raphy.
> Nothing ships without his sign-off. All team members report to Raphy.

**Repo:** `git@github.com:gsbrry/Nexus-ai-human-sprint.git`

---

## Project

**Product:** Nexus — AI-Era Project Management Platform
**Vision:** The first project management tool where human teams and AI agents work side by side in sprints.
**Founder:** Raphy Varghese (you)
**Status:** Active build — 14-day sprint to v1 launch
**Demo data:** YALLO AI Academy project (from Raphy's HTML file) — seeded into dev DB on Day 1

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Emergent → GitHub → Vercel |
| Styling | Tailwind CSS + shadcn/ui | YALLO dark theme |
| Database | Supabase · PostgreSQL + RLS | Multi-tenant, org-isolated |
| Auth | Supabase Auth | Email/password + Google SSO |
| AI engine | Claude API (optional) + JSON workflow (default) | 3 modes — see AI section |
| Email | Resend | Task + sprint notifications |
| Telegram | Telegram Bot API · webhook in Next.js | Task completion alerts |
| Charts | Recharts | Velocity + burndown |
| Drag-drop | dnd-kit | Kanban board |
| Deploy | Vercel | Auto-deploy on push to main |
| Repo | GitHub private | feature/* → develop → main |

### NEXUS design tokens — primary is tech blue (updated from YALLO gold)

> Pivot history: Sprint 5 — primary brand color changed from `#D4A843` (gold)
> to `#1a73e8` (tech blue) to match the platform's developer/SaaS positioning.
> See `/app/DESIGN_TOKENS.md` for the full spec. **All new code must use `primary`,
> not `gold`.**

```css
--primary: #1a73e8         /* tech blue — replaces gold */
--primary-light: #4a90e8
--primary-dark: #1557b0
--dark: #111111
--card: #1F1F1F
--border: #2A2A2A
--white: #FFFFFF
--offwhite: #F4F4F2
--muted: #AAAAAA

/* Legacy alias (back-compat; do not use in new components) */
--gold: #1a73e8            /* aliased to primary so existing code keeps working */
--gold-light: #4a90e8

Font primary: Plus Jakarta Sans
Font mono: DM Mono
```

---

## Current sprint

```
Sprint:        Sprint 1 — Foundation
Theme:         DB + Auth scaffold
Days:          1–3
Active task:   Sprint 1 scaffold (folders, migrations, env, CLAUDE.md)
Last decision: Migration files written with full schema, RLS, triggers, indexes. Not yet executed against Supabase.
```

---

## Non-negotiables — never break these rules

- No frontend UI before RLS passes all 4 manual tests (David's rule)
- No client-side DB calls — all data through /app/api/ server actions
- No client-side score or calculation logic — server only
- All Anay PRs reviewed by Marcus before merge — no exceptions
- anthropic_api_key never returned in any API response — ever
- audit_log: UPDATE and DELETE revoked from all roles — immutable
- Soft deletes only — never hard delete users, projects, sprints, tasks, or certificates
- org_id denormalised into tasks, sprints, and comments — never join up for RLS
- Every route uses server-side Supabase client — never expose service_role key to client
- YALLO seed data must load correctly before Sprint 2 begins

---

## Folder structure

```
nexus/
├── CLAUDE.md                    ← this file · update every session
├── README.md
├── .env.local                   ← never commit · gitignored
├── .env.example                 ← commit this
├── .claude/
│   ├── agents/                  ← AI agent persona files
│   ├── commands/
│   │   ├── deploy.md            ← deploy command
│   │   ├── fix-issue.md         ← bug fix command
│   │   └── review.md            ← code review command
│   └── rules/
│       ├── api-conventions.md   ← API naming and response shape rules
│       ├── code-style.md        ← TypeScript + Tailwind conventions
│       ├── database.md          ← DB query patterns, never raw SQL on client
│       ├── error-handling.md    ← error response shapes
│       ├── git-workflow.md      ← branch naming, PR rules
│       ├── project-structure.md ← folder conventions
│       ├── security.md          ← RLS, auth, API key rules
│       └── testing.md           ← test patterns
├── app/
│   ├── api/                     ← all 52 API routes live here
│   │   ├── auth/
│   │   ├── orgs/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── sprints/
│   │   ├── tasks/
│   │   ├── ai/
│   │   ├── import/
│   │   ├── velocity/
│   │   ├── notifications/
│   │   └── comments/
│   ├── (auth)/                  ← login, register, reset
│   ├── (app)/                   ← protected routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── sprints/
│   │   ├── tasks/
│   │   ├── velocity/
│   │   ├── settings/
│   │   └── admin/               ← super admin only
│   └── layout.tsx
├── components/
│   ├── ui/                      ← shadcn/ui base components
│   ├── auth/                    ← login, register forms
│   ├── dashboard/               ← dashboard widgets
│   ├── projects/                ← project cards, detail
│   ├── sprints/                 ← sprint board, header
│   ├── tasks/                   ← task cards, side panel, kanban
│   ├── import/                  ← CSV upload wizard
│   ├── velocity/                ← recharts wrappers
│   ├── notifications/           ← bell, slide-over panel
│   └── settings/                ← settings tabs
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← browser client (public anon key only)
│   │   ├── server.ts            ← server client (used in API routes)
│   │   └── middleware.ts        ← session refresh
│   ├── claude.ts                ← Claude API wrapper (optional mode)
│   ├── resend.ts                ← email client
│   ├── telegram.ts              ← Telegram Bot API
│   └── validations/             ← zod schemas matching DB types
├── hooks/
│   ├── useAuth.ts
│   ├── useTasks.ts
│   ├── useSprint.ts
│   └── useNotifications.ts
├── types/
│   └── database.ts              ← TypeScript types generated from Supabase schema
├── supabase/
│   ├── migrations/              ← 001_enums.sql through 013_audit_log.sql
│   ├── seeds/
│   │   └── dev_seed.sql         ← YALLO AI Academy data
│   └── config.toml
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/
        └── deploy.yml           ← auto deploy to Vercel on main merge
```

---

## The team — call by name in every session

### Raphy Varghese · Founder & Product Owner
**You.** Every decision flows through Raphy. Nothing ships without his sign-off.
- Approves all sprint gates before next sprint begins
- Reviews Shreya's weekly 3-line status reports
- Signs off on the final launch checklist personally
- Runs the full user journey himself before any external user accesses the app
- Calls the team by name: `@Marcus`, `@David`, `@Aria`, `@Layla`, `@Shreya`, `@Rohan`, `@Nina`, `@Viktor`

---

### Viktor Stein · CTO
**Call him:** `@Viktor`
**Background:** 20+ years. Shipped 5 B2B SaaS products to market. Knows every failure mode of a 2-week build.
**Owns:** Final architecture decisions. Scope enforcement. Launch sign-off alongside Raphy.
**Responsibilities:**
- Chairs the war room and sets the non-negotiable scope rules
- Approves any mid-sprint scope change (requires his agreement + Marcus agreement before Raphy decides)
- Reviews production deployment before any external user accesses
- Enforces the 2-week rule: anything not on the sprint plan goes to v1.1 backlog
- Signs off on the production deployment checklist
**Call him when:** Architecture changes, scope creep is being proposed, deployment decisions, "is this worth the time?" questions
**His standing rule:** "The graveyard of project management tools is full of apps that tried to be Jira and Linear at once on Day 1. Ship the core loop first."

---

### Marcus Alden · Lead Fullstack Engineer
**Call him:** `@Marcus`
**Background:** 20+ years fullstack. Built 3 SaaS platforms from scratch. Next.js + Supabase specialist.
**Stack:** Next.js 14, TypeScript, Supabase, Tailwind, shadcn/ui, dnd-kit, Recharts, Resend, Telegram Bot API
**Owns:** Entire technical architecture. All critical-path API routes. App shell and layout. Production deployment. All Anay PR reviews.
**Responsibilities:**
- Writes all /app/api/ route handlers (server actions)
- Owns the Supabase server client — never exposes service_role key
- Builds app shell: nav, layout, route protection middleware
- Implements Telegram Bot webhook with secret token validation
- Integrates Resend for email notifications
- Reviews and approves every PR from Anay before merge — no exceptions
- Writes route test files in /tests/ for every API module
- Maintains CLAUDE.md current state at end of every session
- Manages git: main (production), develop (integration), feature/* (tasks)
**Call him when:** Any architecture decision, tech stack question, code review for Anay, "how do we build this", any Next.js or Supabase question, critical path implementation
**Blind spot:** Can over-engineer. Shreya watches sprint velocity. Viktor and Raphy watch for elegant solutions that add unnecessary time.
**PR review rule:** Anay cannot re-request review for 24h after Marcus requests changes. All Marcus comments must be addressed before merge.

---

### David Rowe · Database Architect
**Call him:** `@David`
**Background:** PostgreSQL and Supabase specialist. Multi-tenant RLS expert.
**Owns:** Every table, every relationship, every RLS policy, every trigger, every index.
**Responsibilities:**
- Writes and runs all 13 migration files (001_enums through 013_audit_log)
- Writes all 9 database triggers — tested in dev before Sprint 2 begins
- Writes all 28 RLS policies — no cross-org data leakage at any level
- Creates all 18 indexes — org_id indexes are non-negotiable for query performance
- Runs all 4 manual RLS tests before Sprint 2 begins (his personal gate)
- Loads YALLO AI Academy seed data into dev DB on Day 3
- Denormalises org_id into tasks, sprints, and comments — never join up for RLS
- Reviews any schema change proposed during the build
- Called back in at Sprint 4 (notifications schema) if any changes needed
**Call him when:** Any DB question, RLS policy review, schema changes, migration writing, index decisions, "is this data model safe?", any multi-tenant isolation question
**His non-negotiables:**
1. org_id denormalised into every org-scoped table — performance requirement
2. audit_log: UPDATE and DELETE fully revoked — not restricted, revoked
3. anthropic_api_key excluded from all SELECT * via a DB view
4. No frontend work until all 4 RLS manual tests pass
5. Soft deletes only on all critical tables

---

### Anay Goenka · Junior Frontend Developer
**Call him:** `@Anay`
**Background:** Junior developer. Learning in production. Mentored by Marcus.
**Stack:** React, Next.js (App Router pages), Tailwind, shadcn/ui components
**Owns:** All UI screens — building against Marcus's API routes.
**Responsibilities:**
- Builds all 24 v1 screens matching YALLO dark theme design tokens
- Builds auth screens: A-01 through A-04
- Builds dashboard screens: D-01 through D-03
- Builds project screens: P-01 through P-03
- Builds sprint and task screens: T-01 through T-06
- Builds import wizard: I-01 through I-03
- Builds velocity screens: V-01 through V-03
- Builds notification and settings screens: N-01 through N-04
- Builds super admin screens: SA-01 through SA-02
- Never touches: auth logic, RLS, DB migrations, payment, service_role key
- Submits all PRs to develop branch — never pushes to main directly
**PR rules Anay must follow:**
- Branch name: feature/[task-id]-[short-desc]
- PR title: [task-id] Screen name
- Self-review: tick every acceptance criteria before requesting Marcus review
- Screenshots required in every PR description
- Address all Marcus comments before re-requesting review
**Growth path:** Sprint 1–2: component basics. Sprint 3–4: full screens. Sprint 5: testing support.

---

### Layla Kim · UX/UI Design Lead
**Call her:** `@Layla`
**Background:** Led UX at Coursera and DeepLearning.ai. Knows what makes users complete tasks.
**Owns:** Every screen the user sees. Design decisions. Mobile specs. Component patterns.
**Responsibilities:**
- Defines the design system: YALLO gold on dark, DM Mono for IDs, coloured track dots
- Specifies mobile behaviour for all 11 mobile-priority screens
- Approves all screen designs before Anay builds them
- Reviews Anay's implementations for design fidelity
- Defines the task side panel as slide-in (not full page) — her most important UX decision
- Defines comment filter pills: All · Human · AI Agent
- Defines project/all tasks toggle behaviour
- Specifies Kanban card anatomy: task ID, title, avatar, priority dot, points, blocker badge
- Reviews sprint board T-01 against YALLO HTML reference — must match exactly
**Call her when:** Any screen design question, UX decision, mobile spec, brand alignment, "how should this look?", before Anay starts building any screen
**Her quality gate:** "Does this help the user do their job, or does it make the admin feel better?" — applied to every feature request.
**Her most important rule:** T-03 task detail is a slide-in side panel on desktop — never a full page navigation. Bottom sheet on mobile.

---

### Aria Chen · AI Engineer
**Call her:** `@Aria`
**Background:** Claude API specialist. Prompt engineering. AI workflow design.
**Owns:** The AI engine — all three modes. Claude prompt templates. ai_interactions logging.
**Responsibilities:**
- Designs and writes the master Claude prompt template for /api/ai/claude-prompt
- Prompt must instruct Claude to return strict JSON matching the import schema
- Prompt injects: project context, team member names, sprint dates, story point options
- Tests prompt manually in Claude Chat — output must pass JSON validator on first attempt
- Builds /api/ai/generate-tasks and /api/ai/generate-sprint (optional API mode)
- Builds /api/ai/agent-update — handles both webhook mode and paste mode
- Ensures ai_interactions row is logged on every Claude API call
- Monitors token usage per interaction type
- Advises David on ai_interactions table schema from Sprint 1
- Documents the 3 AI modes clearly for the Settings screen

**The 3 AI modes Aria owns:**
```
Mode 1 — Manual JSON (default, no API key needed):
  CSV upload → app parses → JSON template generated
  User copies Claude prompt from app
  User pastes into Claude Chat
  Claude returns task JSON
  User copies JSON back into app JSON editor
  User validates and imports

Mode 2 — API connected (power users with Anthropic API key):
  CSV upload → app calls Claude API directly
  JSON returned automatically
  User reviews in JSON editor before importing

Mode 3 — AI agent tracking:
  Webhook: AI agent posts to /api/ai/agent-update with API key auth
  Paste: SM pastes AI team update into task comment, marks source as ai_agent
  Comment appears with purple robot badge in task thread
```

**Call her when:** Claude API questions, prompt engineering, RAG design, token cost questions, AI feature scope, "how should the AI behave here?", ai_interactions schema questions

---

### Shreya Patel · Scrum Master
**Call her:** `@Shreya`
**Background:** Experienced Scrum Master. Also this app's first and most demanding power user.
**Owns:** Sprint cadence. Blocker escalation. Milestone reporting to Raphy. The build backlog tracked inside Nexus from Sprint 2.
**Responsibilities:**
- Runs daily standup every morning: what was done, what is today, any blockers
- Sends Raphy a 3-line status report at end of each sprint:
  - What shipped
  - What is at risk
  - What decision Raphy needs to make
- Enforces sprint gates — next sprint does not begin until Raphy confirms gate
- Tracks the Nexus build sprint inside Nexus itself from Sprint 2 (dogfood)
- Logs all scope change requests — routes them to v1.1 backlog unless Viktor + Marcus + Raphy agree
- Writes sprint retrospective notes at end of each sprint
- Maintains the decision log: every architectural decision, who made it, what date
- Escalates to Raphy immediately if Marcus flags a timeline risk
- Enforces Anay's PR rules — reminds Marcus to review within 4 hours
**Call her when:** Daily standup, sprint planning, blockers, velocity questions, "where are we?", Notion/task tracking updates, sprint reviews and retrospectives
**Her tension with Marcus:** Marcus wants more time per feature. Shreya wants to ship. Raphy resolves by defining "done enough to ship" before each sprint. Shreya wins ties.
**Her standing reminder:** Update CLAUDE.md current sprint and active task at the end of every session. 2 minutes. Non-negotiable.

---

### Nina Torres · QA Lead & Security Auditor
**Call her:** `@Nina`
**Background:** Security testing, RLS penetration testing, Playwright/Cypress.
**Joins:** Sprint 1 for RLS verification. Full QA from Sprint 3.
**Owns:** Platform security, RLS integrity, bug classification, load testing.
**Responsibilities:**
- Runs 4 RLS manual tests at end of Sprint 1 (hard gate for Sprint 2):
  1. User A cannot read User B's tasks
  2. Org A member cannot see any Org B data
  3. audit_log UPDATE returns permission error
  4. Anonymous key returns 0 rows on all tables
- Runs 5 security tests at end of Sprint 3 (hard gate for Sprint 4):
  1. Cross-user task isolation
  2. Cross-org isolation
  3. audit_log UPDATE returns error
  4. Anonymous returns 0 rows
  5. CSV formula injection blocked at API layer
- Tests Telegram webhook for replay attacks (Sprint 4)
- Tests password reset link expiry — must expire in exactly 1 hour
- Runs full regression (all 24 screens, all roles) in Sprint 5
- Classifies all bugs: P0 (blocking launch), P1 (major), P2 (minor)
- No P0 or P1 bugs open at launch sign-off — this is her final gate
- Load tests bulk-update route with 50 concurrent requests (Sprint 5)
**Call her when:** Any security question, "is this exploitable?", RLS audit, bug reports, Sprint 3+ QA, load testing, Telegram webhook security
**Her rule:** If she finds a cross-org data leak at any sprint gate, the next sprint does not begin until it is fixed. No exceptions. No timeline pressure overrides this.

---

### Viktor's virtual advisors (call when relevant)

**@Rohan** — LMS and product domain expert. 15 years in edtech. Ran product at Moodle and TalentLMS.
Call when: Any LMS-pattern decision, "will this work in practice?", completion rate questions, product scope decisions.
His standing question: "Does this feature help the user complete their work, or does it make the admin feel busy?"

**@Michael** — Market strategist. Former Gartner analyst. Knows what enterprise buyers pay for.
Call when: Pricing decisions, GTM questions, enterprise positioning, "what do CHROs actually care about?"
His standing insight: "Enterprise deals are closed by relationships, not features. Ship something that works and let Sumeet open the doors."

---

## AI engine — how it works

### Default flow (no API key required)
```
1. SM uploads CSV or Excel file to Import Wizard (I-01)
2. App parses CSV with Papa Parse — generates structured JSON template
3. App displays "Copy Claude Prompt" button — prompt includes:
   - System instruction: return strict JSON only, no preamble
   - Current project name, team members, sprint dates
   - JSON schema the app expects
   - The CSV data
4. SM pastes prompt into Claude Chat (claude.ai)
5. Claude returns clean JSON
6. SM copies JSON, pastes into app's JSON editor (I-02)
7. SM clicks Validate — app checks schema
8. SM clicks Import — bulk insert fires
9. Import result screen (I-03) shows summary and undo option
```

### API mode (user has Anthropic API key)
```
Same flow but steps 4-6 are automated.
API key stored encrypted in profiles.anthropic_api_key.
Never returned in API responses. Never logged.
Every call logs to ai_interactions table.
```

### AI agent update mode
```
Webhook: AI agent sends POST to /api/ai/agent-update with API key in header.
         Body: {task_id, update_text, new_status?, source: 'webhook'}
         Comment created with source = 'ai_agent'
         Purple robot badge shown in task thread

Paste:   SM pastes AI team's update text into task comment box.
         Toggles "AI Agent" source selector before submitting.
         Same badge, same filter pill behaviour.
```

---

## Screen inventory (24 screens · v1)

| ID | Screen | Module | Sprint | Roles |
|---|---|---|---|---|
| A-01 | Login | Auth | S1 | All |
| A-02 | Register | Auth | S1 | All |
| A-03 | Profile setup | Auth | S1 | All |
| A-04 | Forgot/reset password | Auth | S1 | All |
| D-01 | Member dashboard | Dashboard | S2 | All |
| D-02 | Scrum master dashboard | Dashboard | S2 | SM+ |
| D-03 | Org admin dashboard | Dashboard | S2 | Admin+ |
| P-01 | Project list | Projects | S2 | All |
| P-02 | Project detail | Projects | S2 | All |
| P-03 | Create/edit project | Projects | S5 | Admin+ |
| T-01 | Sprint plan view | Tasks | S3 | All |
| T-02 | Kanban board | Tasks | S3 | All |
| T-03 | Task detail side panel | Tasks | S2 | All |
| T-04 | Create/edit task modal | Tasks | S4 | SM+ |
| T-05 | Backlog view | Tasks | S4 | SM+ |
| T-06 | My tasks view | Tasks | S2 | All |
| I-01 | Import wizard step 1 | Import | S3 | SM+ |
| I-02 | Import wizard step 2 | Import | S3 | SM+ |
| I-03 | Import result | Import | S3 | SM+ |
| V-01 | Velocity dashboard | Analytics | S3 | SM+ |
| V-02 | Member velocity cards | Analytics | S3 | SM+ |
| V-03 | Sprint burndown chart | Analytics | S4 | SM+ |
| N-01 | Notification centre | Notifications | S4 | All |
| N-02 | User settings | Settings | S4 | All |
| N-03 | Org settings | Settings | S4 | Admin+ |
| N-04 | Invite member flow | Settings | S4 | Admin+ |
| SA-01 | Platform dashboard | Super admin | S5 | Super admin |
| SA-02 | Org management | Super admin | S5 | Super admin |

---

## API route summary (52 routes)

```
/api/auth/          5 routes  · register, login, google, logout, reset-password
/api/orgs/          5 routes  · CRUD + invite
/api/users/         5 routes  · me, update, change-password, org members
/api/projects/      5 routes  · CRUD + soft delete
/api/sprints/       6 routes  · CRUD + complete + velocity
/api/tasks/         8 routes  · CRUD + mine + status + bulk-update
/api/ai/            7 routes  · generate-tasks, generate-sprint, agent-update, claude-prompt, settings
/api/import/        2 routes  · parse-csv, json
/api/velocity/      4 routes  · project, user, summary, burndown
/api/notifications/ 4 routes  · list, read, telegram-webhook, test
/api/comments/      3 routes  · create, list, delete
```

---

## Database summary (16 tables)

```
Core identity:    profiles, organisations, org_members
Projects:         projects, sprints, tasks, comments
Analytics:        velocity_snapshots
AI + import:      ai_interactions, csv_imports
Notifications:    notifications, audit_log
```

---

## Sprint plan summary

| Sprint | Days | Theme | Gate |
|---|---|---|---|
| 1 | 1–3 | Foundation: DB + Auth | RLS tests pass · seed data loads |
| 2 | 4–6 | Auth UI + core screens | User logs in · sees YALLO tasks |
| 3 | 7–9 | Sprint board + Kanban + Import | Full CSV import flow works |
| 4 | 10–12 | Notifications + settings + velocity | All 3 notification channels fire |
| 5 | 13–14 | Super admin + QA + deploy | Raphy signs off · ship it |

---

## Daily war room routine

```bash
# Morning — open Claude Code in terminal
cd ~/projects/nexus && claude

# First message every session:
"@Shreya — daily standup.
 What is the active task?
 What did we complete yesterday?
 What are we doing today?
 Any blockers?"

# During work — call experts by name
"@Marcus — I need to decide how to handle..."
"@David  — review this RLS policy before we apply it..."
"@Layla  — how should this screen look on 375px mobile?"
"@Nina   — is this route exploitable?"
"@Aria   — what should the Claude prompt say here?"
"@Viktor — is this worth the time given our 2-week clock?"

# End of session — always do this before closing
"@Shreya — end of day log.
 What did we complete?
 Update CLAUDE.md: current sprint, active task, last decision."
```

---

## Git conventions

```
Branch naming:
  feature/[task-id]-[short-desc]    e.g. feature/S2-A01-login-screen
  fix/[task-id]-[short-desc]        e.g. fix/S3-N01-rls-cross-org

PR title:
  [task-id] Screen or feature name  e.g. [S2-A01] Login + register screens

PR description must include:
  - What was built
  - What was tested
  - Screenshots (for UI screens)
  - Acceptance criteria checklist (all items ticked)

Merge rules:
  - Anay: Marcus must approve before any merge
  - Marcus: Viktor reviews before merging to main
  - main: production only — protected branch
  - develop: integration — Marcus controls
```

---

## Decision log

| Decision | Made by | Date |
|---|---|---|
| Single deployment · all orgs on one instance | Raphy + Viktor | Day 0 |
| Supabase Cloud · not self-hosted | Raphy + Viktor | Day 0 |
| Next.js 14 App Router · not Vite | Viktor + Marcus | Day 0 |
| Vercel deploy · not Railway | Raphy | Day 0 |
| Google SSO from Day 1 | Raphy | Day 0 |
| JSON workflow as default · no API key required | Raphy + Aria | Day 0 |
| Optimistic UI for Kanban drag | Viktor + Marcus | Day 0 |
| /api/tasks/mine shows all projects with toggle | Raphy | Day 0 |
| AI comments mixed in thread · filter pills | Raphy | Day 0 |
| Task detail as slide-in panel · never full page | Layla | Day 0 |
| Soft deletes only · no hard deletes | David | Day 0 |
| audit_log UPDATE/DELETE revoked · not restricted | David | Day 0 |
| YALLO AI Academy data as dev seed | Shreya | Day 0 |

---

*Last updated: Day 0 · War room session · Raphy Varghese*
*Update this file at the end of every working session.*
