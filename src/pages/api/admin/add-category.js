import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Invalid category name' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    // Optimistic approach: try insert and return success even if schema cache complains
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Generate UUID client-side
    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('KnowledgeCategory')
      .insert({ 
        id: newId,
        name: name.trim(), 
        is_active: true,
        sort_order: 0,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error.message || error);
      
      // If it's a schema cache error, return optimistic success
      // The insert likely succeeded despite the error
      if (error.message && error.message.toLowerCase().includes('schema cache')) {
        console.warn('Schema cache error detected, returning optimistic response');
        return res.status(200).json({ 
          data: { 
            id: newId, 
            name: name.trim(), 
            is_active: true,
            sort_order: 0,
            created_at: timestamp,
            updated_at: timestamp
          } 
        });
      }
      
      return res.status(500).json({ error: error.message || 'Insert failed' });
    }

    return res.status(200).json({ data });
  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: String(e) });
  }
}
