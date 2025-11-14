/**
 * Supabase Utilities
 * Common functions for interacting with Supabase
 */

import { supabase } from './supabaseClient';

// ==================== Authentication ====================

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session, error}>}
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session, error}>}
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}

/**
 * Get the current user session
 * @returns {Promise<{user, session, error}>}
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { user: data.session?.user, session: data.session, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Listen to authentication state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} - Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user, session);
  });
  return data.subscription.unsubscribe;
}

// ==================== Database Operations ====================

/**
 * Fetch data from a table
 * @param {string} table - Table name
 * @param {object} options - Query options (select, filters, etc.)
 * @returns {Promise<{data, error}>}
 */
export async function fetchData(table, options = {}) {
  try {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options.order) {
      const { column, ascending = true } = options.order;
      query = query.order(column, { ascending });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Fetch from ${table} error:`, error);
    return { data: null, error };
  }
}

/**
 * Insert data into a table
 * @param {string} table - Table name
 * @param {object|array} records - Data to insert
 * @returns {Promise<{data, error}>}
 */
export async function insertData(table, records) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(Array.isArray(records) ? records : [records])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Insert into ${table} error:`, error);
    return { data: null, error };
  }
}

/**
 * Update data in a table
 * @param {string} table - Table name
 * @param {object} updates - Data to update
 * @param {object} filters - Where conditions
 * @returns {Promise<{data, error}>}
 */
export async function updateData(table, updates, filters) {
  try {
    let query = supabase.from(table).update(updates);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Update ${table} error:`, error);
    return { data: null, error };
  }
}

/**
 * Delete data from a table
 * @param {string} table - Table name
 * @param {object} filters - Where conditions
 * @returns {Promise<{data, error}>}
 */
export async function deleteData(table, filters) {
  try {
    let query = supabase.from(table).delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Delete from ${table} error:`, error);
    return { data: null, error };
  }
}

// ==================== File Storage ====================

/**
 * Upload a file to Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {File|Blob} file - File to upload
 * @returns {Promise<{data, error}>}
 */
export async function uploadFile(bucket, path, file) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Upload to ${bucket} error:`, error);
    return { data: null, error };
  }
}

/**
 * Download a file from Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {Promise<{data, error}>}
 */
export async function downloadFile(bucket, path) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Download from ${bucket} error:`, error);
    return { data: null, error };
  }
}

/**
 * Get a public URL for a file in Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {string} - Public URL
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Delete a file from Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {Promise<{data, error}>}
 */
export async function deleteFile(bucket, path) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Delete from ${bucket} error:`, error);
    return { data: null, error };
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * Subscribe to real-time changes in a table
 * @param {string} table - Table name
 * @param {string} event - Event type ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {function} callback - Callback function for changes
 * @returns {function} - Unsubscribe function
 */
export function subscribeToTable(table, event = '*', callback) {
  const subscription = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// ==================== Error Handling ====================

/**
 * Format Supabase error for display
 * @param {Error} error - Supabase error object
 * @returns {string} - Formatted error message
 */
export function formatSupabaseError(error) {
  if (!error) return null;

  if (typeof error === 'string') return error;
  if (error.message) return error.message;

  return 'An unexpected error occurred';
}
