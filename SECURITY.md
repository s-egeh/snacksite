# Security Notes – Eat With Etor

## Fixes applied in this project

- **Checkout price by category** – Adding an item now uses the price from the section you clicked (e.g. French Fries in Kickoff Fusion = 30 GHS, in Snacks = 28 GHS). This prevents wrong totals at checkout.
- **XSS hardening** – `escapeHtml()` is null-safe and the search “no results” message uses it so user input cannot inject HTML/script.
- **Reviews** – Ticker already used `escapeHtml(r.name)` and `escapeHtml(r.text)`; no change needed.

---

## Important: what you should do

### 1. Paystack secret key – **DONE**

- Secrets are now read from environment variables in `api/webhook.js`. Add them in Vercel (see **VERCEL_ENV_SETUP.md**).

### 2. Make.com order webhook – **DONE**

- The client no longer has the Make.com URL. Orders are sent to `/api/order`; the serverless function `api/order.js` forwards to Make.com using `MAKE_ORDER_WEBHOOK_URL` from Vercel env.

### 3. Payment amount (cart total)

- **Risk:** The total is computed in the browser. A user could change the cart (e.g. via devtools) and pay a lower amount.
- **Mitigation:** You already verify payment on the server (Paystack webhook). Rely on **Paystack’s amount** in the webhook (`data.amount`), not on any amount sent from the client. Fulfill orders based on the webhook and your own records (e.g. order id/reference), not on client-sent totals. That way tampering the cart doesn’t change what you consider “paid”.

### 4. Webhook URL consistency

- **Observation:** `index.html` uses a Make.com URL ending in `wryqce`; `api/webhook.js` uses one ending in `wryqc`. They may be two different Make scenarios (order intake vs. something else).
- **Action:** Confirm which URL is for “order submission” and which (if any) is used by the Paystack webhook. Align names and env vars (e.g. `MAKE_ORDER_WEBHOOK_URL` vs `MAKE_XXX_URL`) so it’s clear and you don’t mix them.

### 5. Hubtel credentials (api/webhook.js)

- **Risk:** If you add real Hubtel IDs and secrets, they must not be in the repo.
- **Action:** Use environment variables (e.g. `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`) and set them in your host (e.g. Vercel).

---

## Summary

| Item                         | Status / Action                                      |
|-----------------------------|------------------------------------------------------|
| Checkout price by category  | Fixed in code                                        |
| XSS (reviews, search)       | Hardened in code                                     |
| Paystack secret in repo     | Move to env vars                                     |
| Make.com URL from client    | Prefer server-side proxy; URL only in server env     |
| Trust payment amount        | Use Paystack webhook amount only; don’t trust client |
| Webhook URL consistency     | Confirm and document both Make URLs                  |
| Hubtel credentials          | Use env vars when you add them                       |

If you want, the next step can be: (1) moving Paystack/Hubtel/Make URLs into env and updating `api/webhook.js`, and (2) adding a small serverless “order proxy” that forwards to Make.com so the client never sees the Make URL.
