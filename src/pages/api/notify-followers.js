import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { post_id, answer_content, answerer_name } = req.body || {};
  if (!post_id) return res.status(400).json({ error: 'post_id required' });

  try {
    // Best-effort: try to insert into a NotificationQueue table if present
    const { error } = await supabase
      .from('NotificationQueue')
      .insert([{
        post_id,
        message: `New answer by ${answerer_name}: ${answer_content?.slice(0, 200)}`,
        created_at: new Date().toISOString(),
        processed: false
      }]);

    if (error) {
      // If NotificationQueue doesn't exist, just return success (no-op)
      console.warn('notify-followers: failed to write to NotificationQueue', error.message || error);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('notify-followers error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
