# How to Add Environment Variables in Vercel

Your app now reads all secrets from **Environment Variables** so they are never committed to git. Follow these steps to add them in Vercel.

---

## 1. Open your project in Vercel

- Go to [vercel.com](https://vercel.com) and sign in.
- Open the project that hosts **Eat With Etor** (this repo).

---

## 2. Go to Settings → Environment Variables

- Click your **project name**.
- Click the **Settings** tab.
- In the left sidebar, click **Environment Variables**.

---

## 3. Add each variable

Click **Add New** and enter **Name** and **Value**. Choose the environments (Production, Preview, Development) where it should be available (usually **Production** at least).

| Name | Value | Where to get it |
|------|--------|------------------|
| `PAYSTACK_SECRET_KEY` | `sk_live_...` or `sk_test_...` | [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys & Webhooks → **Secret Key** |
| `MAKE_ORDER_WEBHOOK_URL` | `https://hook.us2.make.com/...` | Make.com scenario that receives orders → HTTP module → **Webhook URL** (the one that was previously in `index.html`, e.g. ending in `wryqce`) |
| `HUBTEL_CLIENT_ID` | Your Hubtel client ID | [Hubtel](https://hubtel.com) – only if you use SMS |
| `HUBTEL_CLIENT_SECRET` | Your Hubtel client secret | Hubtel – only if you use SMS |
| `BUSINESS_PHONE` | e.g. `+233509929436` | Your phone number for order alerts (optional; default in code is +233509929436) |

- **PAYSTACK_SECRET_KEY** – **Required** for the Paystack webhook (`/api/webhook`) to verify payments. Without it, payment confirmation will fail.
- **MAKE_ORDER_WEBHOOK_URL** – **Required** for the order proxy (`/api/order`). Use the exact Make.com webhook URL that should receive order payloads (customer name, phone, items, total, etc.).
- **HUBTEL_*** – Optional. If not set, the Paystack webhook will still run but will skip sending SMS (and log a warning).
- **BUSINESS_PHONE** – Optional. Number that receives “new order” SMS; defaults to the number in the code if not set.

---

## 4. Save and redeploy

- After adding or changing variables, click **Save**.
- **Redeploy** the project so the new env vars are picked up:
  - Go to the **Deployments** tab.
  - Open the **⋯** menu on the latest deployment.
  - Click **Redeploy** (no need to clear cache unless you want a full rebuild).

---

## 5. Check that it works

- **Orders:** Place a test order (COD or Paystack). The order should reach Make.com via `/api/order`. If it doesn’t, check Vercel **Functions** logs for errors and that `MAKE_ORDER_WEBHOOK_URL` is set.
- **Payments:** After a test payment, check that Paystack sends the webhook to your `/api/webhook` URL and that you get the expected behavior (e.g. SMS if Hubtel is set). If you get “Invalid signature”, the **Secret Key** in Vercel must match the one in Paystack Dashboard.

---

## Quick reference – what each API uses

| API route | Env vars used |
|-----------|----------------|
| `/api/webhook` (Paystack) | `PAYSTACK_SECRET_KEY`, `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, `BUSINESS_PHONE` |
| `/api/order` (order proxy) | `MAKE_ORDER_WEBHOOK_URL` |

Do **not** commit real secret keys or webhook URLs to git. Keep them only in Vercel (and in your own secure notes if needed).
