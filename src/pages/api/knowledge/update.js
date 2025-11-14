// Server API: Update a knowledge post by id or slug
// Testing & dev notes:
// - Run locally: npm run dev
// - Update a post (example):
//   curl -X POST "http://localhost:3000/api/knowledge/update" \
//     -H "Content-Type: application/json" \
//     -H "x-admin-token: $ADMIN_TOKEN" \
//     -d '{"slug":"my-post","title":"Updated title","published":true}'
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
    const { id, slug, title, summary, content, author, tags, published } = req.body || {};

    if (!id && !slug) {
      return res.status(400).json({ error: 'Provide id or slug to identify the post to update' });
    }

    // Fetch existing row to determine published state
    const lookup = id
      ? supabaseAdmin.from('knowledge').select('id, published').eq('id', id).limit(1).single()
      : supabaseAdmin.from('knowledge').select('id, published').eq('slug', slug).limit(1).single();

    const { data: existing, error: lookupErr } = await lookup;
    if (lookupErr || !existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (slug !== undefined) updatePayload.slug = slug;
    if (summary !== undefined) updatePayload.summary = summary;
    if (content !== undefined) updatePayload.content = content;
    if (author !== undefined) updatePayload.author = author;
    if (tags !== undefined) updatePayload.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.length ? tags.split(',').map(t => t.trim()) : null);
    if (published !== undefined) updatePayload.published = !!published;

    // If changing from unpublished -> published, set published_at
    if (published !== undefined && !existing.published && published) {
      updatePayload.published_at = new Date().toISOString();
    }

    updatePayload.updated_at = new Date().toISOString();

    let query = supabaseAdmin.from('knowledge').update(updatePayload).select();
    if (id) query = query.eq('id', id);
    else query = query.eq('slug', slug);

    const { data, error } = await query.limit(1).single();

    if (error) {
      console.error('supabaseAdmin update error:', error);
      return res.status(500).json({ error: error.message || 'Database update failed' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('update knowledge error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
