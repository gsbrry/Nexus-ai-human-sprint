# NEXUS · Design tokens

> **Last updated:** Sprint 5 — primary brand color pivoted from YALLO gold (`#D4A843`)
> to tech blue (`#1a73e8`) to match the platform's developer/SaaS positioning.

---

## ⚠️ For future development

**Always use `primary` (or its semantic shadcn variants) for the brand color in new
components. Never reference `gold` directly in new code.**

```tsx
// ✅ DO (new code)
<Button className="bg-primary text-primary-foreground">Save</Button>
<div className="text-primary border-primary/30">Active</div>

// ⚠️ Legacy — works but deprecated. Resolves to the same blue via Tailwind alias.
<div className="text-gold border-gold/30">Active</div>

// ❌ DON'T — never hardcode the hex
<div style={{ color: '#1a73e8' }}>Active</div>
```

The `gold` Tailwind class is kept as a back-compat alias so existing components
keep compiling, but new code must use `primary` semantically. A future refactor
pass will rename every remaining `text-gold` / `bg-gold` / `border-gold` →
`text-primary` etc.

---

## Color palette

| Token | Hex | HSL | Used for |
|---|---|---|---|
| `primary.DEFAULT` | `#1a73e8` | `217 89% 51%` | All brand accents, primary buttons, active states, charts |
| `primary.light` | `#4a90e8` | `213 77% 60%` | Hover states, gradients, secondary highlights |
| `primary.dark` | `#1557b0` | `213 80% 38%` | Pressed states, depth |
| `primary.foreground` | `#FFFFFF` | `0 0% 100%` | Text on primary surfaces |
| `background` | `#111111` | `0 0% 6.7%` | Page background |
| `card` | `#1F1F1F` | `0 0% 12.2%` | Cards, popovers, sheets |
| `border` | `#2A2A2A` | `0 0% 16.5%` | All dividers and outlines |
| `muted.foreground` | `#AAAAAA` | `0 0% 67%` | Secondary text |
| `destructive` | `#E24B4A` | `0 72% 51%` | Errors, blockers, danger |

### Supporting colors (charts, badges, kinds)

| Hex | Name | Used for |
|---|---|---|
| `#7DC8B8` | Teal | Completion, success, AI agents |
| `#9C7DD6` | Purple | AI / RAG indicators |
| `#7AA7E0` | Sky | Sprint kind, secondary info |
| `#4a90e8` | Light blue | Hover/accent |
| `#F0C866` | Amber | Trial state, warnings |
| `#F09595` | Red soft | Blockers, past due |

---

## Typography

| Family | Variable | Use |
|---|---|---|
| Plus Jakarta Sans | `var(--font-jakarta)` | Body, headings, UI text |
| DM Mono | `var(--font-dm-mono)` | Metadata, IDs (e.g. `YALLO-143`), code, timestamps, badge labels |

---

## Component conventions

- Section headers always start with a uppercase mono code (e.g. `T-04 · New task`)
- Use `border border-border bg-card` for default surfaces
- Use `border-primary/30 bg-primary/10 text-primary` for the "active / selected" state
- Buttons: `<Button>` from `@/components/ui/button` — primary variant ships with the blue
- Always use semantic shadcn tokens (`bg-background`, `text-foreground`, `border-border`) over raw hex

---

## Component checklist when adding new screens

1. ✅ Section header with mono code
2. ✅ Primary CTA uses `<Button>` (auto-blue)
3. ✅ Cards use `<Card><CardContent>` from `@/components/ui/card`
4. ✅ Badges use the variants in `@/components/ui/badge` — never custom hex
5. ✅ Charts use `--chart-1`...`--chart-5` CSS vars (or `#1a73e8` for primary lines)
6. ✅ Avatars use `<OwnerAvatar>` from `@/components/tasks/OwnerBadge`
7. ✅ Empty / error states use `border-dashed border-border` with `muted-foreground` text

---

## Migration from YALLO theme

The pivot from gold (`#D4A843`) to blue (`#1a73e8`) was a **single-file change**
plus a global find-replace:

```bash
# globals.css — flipped CSS variables
# tailwind.config.ts — flipped `gold.DEFAULT` and `gold.light` to blue
# All hardcoded #D4A843 → #1a73e8, #F0C866 → #4a90e8 across components
```

No component refactors were needed because every component used either:
- Tailwind classes (`text-gold`, `bg-gold/10`) that automatically picked up the new color, OR
- The shadcn semantic tokens (`bg-primary`, `text-primary-foreground`) that read from CSS vars.

Future palette changes follow the same path:
1. Update `--primary` and `--ring` in `app/globals.css`
2. Update `primary.DEFAULT` in `tailwind.config.ts` (and `gold` alias if still in use)
3. Find-replace any leftover hex literals
4. Run `sudo supervisorctl restart nextjs`
