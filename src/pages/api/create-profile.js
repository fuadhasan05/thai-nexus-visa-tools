/**
 * API endpoint to create a user profile in Supabase using service role
 * This ensures the profile is created even if the user hasn't confirmed their email
 * Called after signup from the client (uses service role token on server side)
 * 
 * FIX: This endpoint guarantees username is stored during signup, bypassing RLS constraints
 */

import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate that service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[API] SUPABASE_SERVICE_ROLE_KEY not configured');
    return res.status(500).json({ 
      error: 'Server misconfiguration: service role key missing',
      details: 'SUPABASE_SERVICE_ROLE_KEY environment variable not set'
    });
  }

  try {
    const { userId, email, username } = req.body;

    console.log(`[API] create-profile called: userId=${userId}, email=${email}, username=${username}`);

    // Validate required fields
    if (!userId || !email) {
      console.warn('[API] Missing required fields: userId or email');
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    // Check if profile already exists to avoid conflicts
    console.log(`[API] Checking if profile exists for userId=${userId}`);
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.warn(`[API] Error checking existing profile:`, checkError);
      // Continue anyway - maybe table doesn't exist yet
    }

    if (existingProfile) {
      console.log(`[API] Profile already exists for userId=${userId}`);
      return res.status(200).json({ 
        message: 'Profile already exists',
        profileCreated: false 
      });
    }

    // Create profile row with service role (bypasses RLS)
    console.log(`[API] Inserting profile: userId=${userId}, email=${email}, username=${username}`);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          user_id: userId,
          email: email,
          username: username || null,
          role: 'user',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .maybeSingle();

    if (profileError) {
      console.error(`[API] Profile insertion failed for userId=${userId}:`, profileError);
      return res.status(500).json({ 
        error: 'Failed to create profile',
        details: profileError.message,
        code: profileError.code
      });
    }

    console.log(`[API] Profile created successfully for userId=${userId}:`, profile);
    return res.status(201).json({ 
      message: 'Profile created successfully',
      profile,
      profileCreated: true 
    });
  } catch (error) {
    console.error('[API] Unexpected error in create-profile:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
