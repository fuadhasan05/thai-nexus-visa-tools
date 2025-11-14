// src/lib/supabaseAdmin.js
// Server-only Supabase client using service role key
// SECURITY: This file must NEVER be imported client-side.
// Use only in API routes and server-side functions.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    'WARNING: supabaseAdmin not initialized. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server environment.'
  );
}

// Create admin client with service role key (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});
