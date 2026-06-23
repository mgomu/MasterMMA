# Plan: Switch email provider from Resend to Gmail SMTP via Nodemailer

**Date:** 2026-06-23
**Reason:** User does not want to buy/verify a custom domain. Gmail SMTP sends from an existing `@gmail.com` address with no domain verification required.
**Scope:** Replace the Resend transport in `src/lib/email.ts` with a Nodemailer SMTP transport configured for Gmail. Update env vars and docs. No changes to the cron endpoint, reminder logic, or DB schema.

## Trade-offs (acknowledged upfront)

- **From address:** shows a personal `@gmail.com`, not a branded domain.
- **Daily cap:** Gmail limits ~500 sends/day (sufficient for a single gym's reminders).
- **Deliverability:** Gmail is more likely to land in recipients' Promotions/Spam than a verified Resend domain. Acceptable for this use case.
- **App Password required:** the Gmail account must have 2FA enabled and an App Password generated (standard Google account password will NOT work with SMTP).

## Files touched

| File | Change |
|---|---|
| `package.json` | Add `nodemailer` + `@types/nodemailer` (dev) |
| `src/lib/email.ts` | Replace Resend transport with Nodemailer SMTP |
| `.env.example` | Replace `RESEND_API_KEY` / `EMAIL_FROM` with `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` |
| `.env.local` | Same env var swap (user does this manually) |
| `docs/plans/2026-06-17-gimnasio-mma.md` | Note the provider switch in the cron section (optional, low priority) |

**NOT touched:** `src/app/api/cron/reminders/route.ts`, `src/lib/reminders.ts`, `src/lib/membership.ts`, `src/proxy.ts`, `vercel.json`, DB schema. The public interface of `sendReminderEmail()` stays identical (`{ to, nombre, tipo, fechaVencimiento } → Promise<SendResult>`), so the cron route needs zero changes.

## Prerequisites (user does these before running the plan)

1. **Enable 2FA on the sending Gmail account** → https://myaccount.google.com/security
2. **Generate an App Password** → https://myaccount.google.com/apppasswords (select "Mail", any name). Save the 16-char password — it's shown once.
3. **Decide the From address** — typically `Gimnasio MMA <you@gmail.com>` or just `you@gmail.com`.

## Step 1 — Install dependencies

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

Optionally remove Resend (keeps the bundle clean):

```bash
npm uninstall resend
```

**Verify:** `package.json` lists `nodemailer` under `dependencies` and `@types/nodemailer` under `devDependencies`. `resend` is gone (if removed).

**Commit:** `chore: swap resend for nodemailer`

## Step 2 — Update env vars

### `.env.example` — replace the Resend block

Replace:

```
# Fase 5 — Resend
RESEND_API_KEY=re_...
EMAIL_FROM="Gimnasio MMA <recordatorios@tudominio.com>"
```

With:

```
# Fase 5 — Gmail SMTP (App Password, no custom domain needed)
# SMTP_USER = la dirección de Gmail que envía
# SMTP_PASS = App Password de 16 caracteres (NO la contraseña normal)
# SMTP_FROM = texto del "From"; puede incluir nombre: "Gimnasio MMA <tu@gmail.com>"
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### `.env.local` — fill in real values (user does manually)

```
SMTP_USER=tu@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="Gimnasio MMA <tu@gmail.com>"
```

**Note on App Password formatting:** Google shows it as `abcd efgh ijkl mnop` with spaces. Include the spaces OR strip them — Nodemailer accepts either. Just be consistent.

**Commit:** `chore: env vars for gmail smtp`

## Step 3 — Rewrite `src/lib/email.ts`

Replace the entire file with a Nodemailer-based implementation. Keep the exported `sendReminderEmail` signature **identical** so `route.ts` is unchanged.

Key points for the rewrite:
- Import `nodemailer` instead of `Resend`.
- Create a single transporter via `nodemailer.createTransport` with Gmail SMTP:
  - `host: "smtp.gmail.com"`
  - `port: 465`
  - `secure: true`
  - `auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }`
- Validate `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` are present (return `{ ok:false, error }` if missing — mirrors the existing Resend guard).
- Keep the `DIAS` map, `formatDate`, subject/body strings **byte-for-byte identical** (don't touch the copy — the user has reviewed it).
- Wrap `transporter.sendMail` in try/catch and return `{ ok:false, error }` on failure, `{ ok:true }` on success — same behavior as Resend path so the cron's retry-on-next-run logic still works (PRD §6.5).
- **Create the transporter lazily** (inside the function OR module-level but only when env vars exist) so a missing config doesn't crash module import. Module-level with a guard is fine; lazy is safer.

Reference implementation skeleton:

```ts
import nodemailer from "nodemailer";
import type { ReminderType } from "./membership";

const DIAS: Record<ReminderType, number> = { "7d": 7, "3d": 3, "1d": 1 };

export type SendReminderArgs = {
  to: string;
  nombre: string;
  tipo: ReminderType;
  fechaVencimiento: string;
};

export type SendResult = { ok: boolean; error?: string };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export async function sendReminderEmail({
  to, nombre, tipo, fechaVencimiento,
}: SendReminderArgs): Promise<SendResult> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!user || !pass || !from) {
    return { ok: false, error: "Faltan SMTP_USER, SMTP_PASS o SMTP_FROM." };
  }

  const dias = DIAS[tipo];
  const fecha = formatDate(fechaVencimiento);
  const subject = dias === 1 ? "Tu membresía vence mañana" : `Tu membresía vence en ${dias} días`;
  const cuando = dias === 1 ? "mañana" : `en ${dias} días`;
  const text = `Hola ${nombre},

Te recordamos que tu membresía del gimnasio vence el ${fecha} (${cuando}).

Acércate a renovarla para no perder el acceso a las clases.

¡Nos vemos en el tatami!`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, text });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al enviar el correo." };
  }
}
```

**Verify:**
- `npm run build` succeeds.
- `npm run lint` clean.
- `npm run typecheck` clean (if configured — check `package.json` scripts; this repo has `lint` + `test` but no explicit `typecheck` script, so `tsc --noEmit` or rely on `next build`).
- Existing tests still pass: `npm test` (the email module has no test file, so nothing breaks here, but `reminders.test.ts` and `membership.test.ts` should still be green).

**Commit:** `feat: send reminders via gmail smtp`

## Step 4 — Verify locally

1. Fill `.env.local` with real `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (from the App Password generated in Prerequisites).
2. Also set `CRON_SECRET` in `.env.local` (currently empty — the cron route needs it to authorize the request).
3. Start dev server: `npm run dev`
4. Trigger the endpoint:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
   ```
5. Expected: `{"enviados":N,"fallidos":M}` and a real email in the recipient's inbox (use a member whose `fecha_vencimiento` is 7/3/1 days from today; seed one if needed via `npm run seed` or a manual DB insert).
6. If `fallidos > 0`, check the error — common culprits:
   - `EAUTH` → wrong App Password or 2FA not enabled
   - `EENVELOPE` → `SMTP_FROM` address doesn't match `SMTP_USER` (Gmail rewrites From to the authenticated account anyway, but the header must parse)

## Step 5 — Update Vercel env vars

In the Vercel dashboard (or `vercel env add`), for **Production**:
1. **Add** `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` with the real Gmail values.
2. **Remove** `RESEND_API_KEY` and `EMAIL_FROM` (no longer used).
3. **Redeploy** — env vars only apply to deployments made after they're set.

## Step 6 — Verify in production

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://master-mma.vercel.app/api/cron/reminders
```

Expect `{"enviados":N,"fallidos":0}`. Confirm the email arrives.

## Step 7 — Confirm the daily cron is armed

- Vercel dashboard → **master-mma** → **Cron Jobs**: `/api/cron/reminders` shows schedule `0 13 * * *` (8:00 AM Colombia).
- No code change needed — `vercel.json` already declares it.

## Verification checklist (run before declaring done)

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (existing tests untouched)
- [ ] `sendReminderEmail` signature unchanged — `route.ts` imports still resolve
- [ ] Local `curl` returns `{"enviados":N,"fallidos":0}` and email arrives
- [ ] Production `curl` returns same
- [ ] Vercel cron job visible in dashboard with correct schedule
- [ ] Old `RESEND_API_KEY` / `EMAIL_FROM` removed from Vercel
- [ ] `.env.example` updated so future contributors see the new vars

## Notes / gotchas

- **Gmail rewrites the From header** to the authenticated account regardless of what `SMTP_FROM` says. Setting `SMTP_FROM="Gimnasio MMA <tu@gmail.com>"` gives a friendly display name; setting it to a different address won't actually send from that address.
- **App Passwords can be revoked** — if email stops working, regenerate at https://myaccount.google.com/apppasswords and update `SMTP_PASS` on Vercel + `.env.local`.
- **500/day limit** is per Gmail account, not per IP. If the gym grows past that, revisit Resend with a verified domain.
- **Cold start:** Nodemailer opens a fresh SMTP connection per call in the implementation above. For a gym with a handful of reminders/day this is fine. If volume grows, pool the transporter at module level — but module-level pooling in serverless is finicky (connections don't persist across invocations), so the lazy-per-call approach is safer for now.
- **Resend package removal is optional.** Leaving `resend` in `package.json` won't break anything; removing it keeps the bundle smaller. The plan removes it.
