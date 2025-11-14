// Server API: Create a knowledge post
// Testing & dev notes:
// - Run locally: npm run dev
// - Create a post (example):
//   curl -X POST "http://localhost:3000/api/knowledge/create" \
//     -H "Content-Type: application/json" \
//     -H "x-admin-token: $ADMIN_TOKEN" \
//     -d '{"title":"My post","slug":"my-post","content":"<p>Hello</p>","published":true}'
// Env required (on Vercel): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN
// SECURITY: keep SUPABASE_SERVICE_ROLE_KEY and ADMIN_TOKEN server-only; do not expose them client-side.

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-admin-token'] || req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { title, slug, summary, content, author, tags, published } = req.body || {};

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Missing required fields: title, slug, content' });
    }

    const payload = {
      title,
      slug,
      summary: summary || null,
      content,
      author: author || null,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.length ? tags.split(',').map(t => t.trim()) : null),
      published: !!published,
      published_at: published ? new Date().toISOString() : null
    };

    const { data, error } = await supabaseAdmin
      .from('knowledge')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('supabaseAdmin insert error:', error);
      return res.status(500).json({ error: error.message || 'Database insert failed' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('create knowledge error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
