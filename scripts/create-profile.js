/*
Script to test creating a profile using the Supabase service role key.
Usage (local dev):
  SUPABASE_URL=<your_url> SUPABASE_SERVICE_ROLE_KEY=<service_key> node scripts/create-profile.js

This will attempt to insert a profiles row for a test user id/email.
*/

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  try {
    const testUserId = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';
    const testEmail = process.env.TEST_EMAIL || 'test-profile@example.com';
    const username = process.env.TEST_USERNAME || 'testprofile';

    console.log('Attempting to create profile for', testUserId, testEmail);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: testUserId,
          user_id: testUserId,
          email: testEmail,
          username,
          role: 'user',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      process.exit(2);
    }

    console.log('Insert succeeded:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(3);
  }
}

run();
