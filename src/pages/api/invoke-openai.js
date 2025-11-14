export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, conversation_history } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // If no OPENAI_API_KEY configured, return a helpful placeholder for local dev.
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ answer: "(OpenAI API key not configured) This is a placeholder AI answer. Configure OPENAI_API_KEY in your environment to enable real responses." });
    }

    // Build messages for Chat Completions
    const messages = [];
    if (Array.isArray(conversation_history)) {
      conversation_history.forEach(h => {
        if (h && h.role && h.content) messages.push({ role: h.role, content: h.content });
      });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text || 'OpenAI request failed' });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('invoke-openai error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
