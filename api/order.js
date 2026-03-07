// api/order.js
// Proxies order submissions from your site to Make.com. The Make.com webhook URL
// is only stored in Vercel env (MAKE_ORDER_WEBHOOK_URL), not in the client.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const makeUrl = process.env.MAKE_ORDER_WEBHOOK_URL;
  if (!makeUrl) {
    console.error('MAKE_ORDER_WEBHOOK_URL is not set in Vercel env');
    return res.status(500).json({ error: 'Order service not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const response = await fetch(makeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error('Make.com order webhook error:', response.status, text);
      return res.status(response.status).json({ error: 'Order relay failed', details: text });
    }
    try {
      return res.status(200).json(text ? JSON.parse(text) : { ok: true });
    } catch {
      return res.status(200).send(text || 'OK');
    }
  } catch (err) {
    console.error('Order proxy error:', err);
    return res.status(500).json({ error: 'Order relay failed', details: err.message });
  }
}
