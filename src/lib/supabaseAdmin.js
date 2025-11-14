// src/lib/supabaseAdmin.js
// Server-only Supabase client using service role key
// SECURITY: This file must NEVER be imported client-side.
// Use only in API routes and server-side functions.

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client (service role)
// SECURITY: This file must only be imported in server-side code (API routes, getServerSideProps, etc.).
// Do NOT expose SUPABASE_SERVICE_ROLE_KEY to the client or commit it into source control.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Intentionally log a warning during build/deploy to help troubleshoot missing envs.
  // Do not throw here because some CI steps might load this file during static analysis.
  console.warn('WARNING: SUPABASE URL or SERVICE_ROLE_KEY not set. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present in the server environment.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  // Ensure the admin client does not persist sessions or auto-refresh tokens in server contexts
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
