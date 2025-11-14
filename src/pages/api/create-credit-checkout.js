export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This endpoint should create a payment/checkout session with your payment provider (Stripe, etc.)
  // For now return a not-configured error so the client can fall back.
  return res.status(501).json({ error: 'create-credit-checkout not configured. Implement server-side payment integration.' });
}
