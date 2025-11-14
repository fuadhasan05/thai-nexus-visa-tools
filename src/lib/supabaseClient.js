import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

// Check if credentials are valid (not placeholder values and proper format)
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co');
const hasValidKey = supabaseKey && supabaseKey.length > 20; // JWT keys are long

function makeNoopSupabase() {
  // Return a proxy that throws a helpful error when any method is accessed.
  const handler = {
    get(_, prop) {
      return () => {
        const urlStatus = supabaseUrl ? `URL provided but invalid (${supabaseUrl})` : 'URL not set';
        const keyStatus = supabaseKey ? `Key provided but invalid (${supabaseKey.substring(0, 20)}...)` : 'Key not set';
        throw new Error(
          `Supabase client not initialized. Check your .env.local file:\n` +
          `- NEXT_PUBLIC_SUPABASE_URL: ${urlStatus}\n` +
          `- NEXT_PUBLIC_SUPABASE_KEY: ${keyStatus}\n` +
          `See FIX_INVALID_SUPABASE_URL.md for instructions. Attempted to access: ${String(prop)}`
        );
      };
    }
  };
  return new Proxy({}, handler);
}

export const supabase = (isValidUrl && hasValidKey)
  ? createClient(supabaseUrl, supabaseKey)
  : makeNoopSupabase();