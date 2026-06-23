# Gimnasio MMA — Design System

Source of truth: Pencil file `pencil-welcome.pen` (frames "Design System" / "Components" / screens). Implemented on branch `design/pencil-system`.

## Intent

- **Who:** gym admin staff checking who's due/overdue and processing payments between classes — fast scanning, not leisurely browsing.
- **Feel:** a fight-gym ops console — bold brand red, near-black ink, warm paper background (not cold gray SaaS gray). Monospace for anything numeric (dates, money, countdowns) gives it a "scoreboard" texture; Archivo (heavy weight, tight tracking) carries the athletic-brand headlines; Geist carries body/UI text.
- **Signature:** JetBrains Mono on dates/amounts/eyebrows + the dark "Reminders" card on member detail (countdown-clock feel) + the dark split brand panel on login.

## Depth strategy

**Borders-only.** No box-shadows anywhere in the source design. Two border weights:
- `border` / `--border` `#E5E5E5` — standard separation (cards, inputs, table header).
- `border-subtle` / `--border-subtle` `#F2F2F2` — softer separation (dialog footers, payment-history rows).

## Color tokens (`src/app/globals.css`)

| Token | Light | Use |
|---|---|---|
| `--background` | `#F7F6F3` | app canvas (warm off-white, not pure gray) |
| `--foreground` | `#0F0F0F` | ink — body text, headings, also reused as literal dark-card bg |
| `--card` / `--popover` | `#FFFFFF` | cards, dialogs |
| `--primary` | `#DC2626` (Tailwind red-600) | brand/CTA — buttons, kickers, active table icons |
| `--destructive` | `#991B1B` (Tailwind red-800) | solid destructive buttons — same red as "vencido" status |
| `--border` / `--input` | `#E5E5E5` | |
| `--border-subtle` | `#F2F2F2` | |
| `--muted` | `#FAFAFA` | table header bg, subtle fills |
| `--muted-foreground` | `#6B6B6B` | secondary text, labels |
| `--muted-subtle` | `#9A9A9A` | placeholders, micro-labels (lighter than muted-foreground — a 3rd text tier) |

Status colors are literal Tailwind palette (exact matches, no custom tokens needed):
- Activo → `bg-green-100 text-green-800` (icon `Check`)
- Por vencer → `bg-amber-100 text-amber-800` (icon `Clock3`)
- Vencido → `bg-red-100 text-red-800` (icon `TriangleAlert`)

Two literal one-off dark surfaces (not theme-driven, used regardless of light/dark mode — these are intentionally-always-dark decorative panels): login brand panel `#0F0F0F` text `#B8B8B8`/`#9A9A9A`; member-detail reminders card `bg-foreground` with inner rows `#1A1A1A`.

## Typography

- `--font-heading` → Archivo (800/700, tight negative letter-spacing) — page titles, card titles, dialog titles, big numbers on the login hero.
- `--font-sans` → Geist — body text, labels, buttons.
- `--font-mono` → JetBrains Mono — eyebrow/kicker text (11px, +letter-spacing, uppercase), dates, money amounts, countdown labels.
- Kicker pattern: `font-mono text-[11px] font-semibold tracking-[0.15em] text-primary uppercase`.

## Radius scale

Hardcoded (not a calc-from-base scale — the design uses fixed integers, not a ratio):
`sm:6 / md:8 / lg:8 / xl:12 / 2xl:16 / 3xl:20 / 4xl:999(pill)`.
Buttons & inputs = `rounded-lg` (8). Cards = `rounded-xl` (12). Dialogs = `rounded-2xl` (16). Badges/avatars = `rounded-4xl`/`rounded-full`.

## Key component patterns

- **Button `destructive`** is solid (`bg-destructive text-destructive-foreground`), not the tinted/outline style — matches the mockup's filled "Eliminar" button.
- **Status badge**: pill, `px-2.5 py-1 gap-1.5 text-xs font-semibold`, icon forced to `size-3`. Width pinned (`w-[140px] justify-center`) only inside the dashboard table for column alignment — not a base Badge default.
- **Stat card** (`status-counters.tsx`): label + colored icon-chip top row, `text-5xl font-mono font-bold` value, trend caption row. `--card-spacing` overridden to `24px` for this card only (`[--card-spacing:24px]`).
- **Data card field list** (member detail "Datos"): single-column stack of label/value pairs (NOT a 2-col grid) — label `text-[11px] uppercase text-muted-subtle`, value `text-[15px]`. This was a deliberate read of the source `.pen` (Pencil can't do CSS grid, but here a single column genuinely reads better at 520px width than a cramped 2-col would).
- **Table action icons**: ghost icon buttons, gray (`text-muted-foreground`) for neutral actions (pago, editar), but the delete/trash icon is `text-primary` (brand red) even though the button itself stays ghost/transparent — color signals destructiveness without a filled red button in every row.
- **Dialogs**: header padding `px-7 pt-7 pb-5`, footer `border-t border-border-subtle px-7 py-5` (no gray footer background — stays white), backdrop `bg-black/50` (darker than shadcn's stock `/10`). Delete-style confirm dialogs get a centered circular warning icon overlapping the header (`absolute`/centered, `bg-red-100` chip, `text-primary` icon) and two fixed-width (`w-40`) centered buttons instead of the default end-aligned footer.
- **Payment dialog "Nuevo vencimiento" preview** is live-computed from the date field via `calcDueDate()` (`src/lib/membership.ts`), not static — re-renders on every date change.
- **Reminders card** (member detail) is wired to real data: 3 checkpoints (`T-7/T-3/T-1`) computed via `subDays(vencimiento, n)`, cross-checked against `recordatoriosEnviados` for sent status; the earliest still-pending one is highlighted white/bold, the rest dim to `#B8B8B8`.

## Spacing

No single base unit — the source design freely mixes 4/6/8/10/12/14/16/18/20/24/28/32/48/64, all real values seen in the `.pen` file. Tailwind's default scale already covers this; don't invent a stricter grid than the source uses.
