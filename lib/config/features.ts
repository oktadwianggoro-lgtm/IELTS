/**
 * Monetization kill switch (Fase 16, Master Prompt §14-ish /
 * "Optional monetization"). Defaults OFF — no payment gateway credentials
 * are configured in this environment (Midtrans, per .env.example), so
 * there is nothing real to check out against. Flipping this to `true`
 * without also wiring a real gateway would mean showing a payment UI that
 * cannot actually charge anyone, which is worse than not having one — so
 * this phase builds the data model and the flag itself, not a checkout
 * flow. See docs/DECISIONS.md D-043.
 *
 * No `server-only` import: this is read by both server and client code
 * paths indirectly (e.g. surfaced into a Server Component's props), and the
 * value itself isn't a secret — it's a public on/off switch.
 */
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";
