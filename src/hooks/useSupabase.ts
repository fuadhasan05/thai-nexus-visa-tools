import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SupabaseError, FetchOptions } from '@/types/supabase';

/**
 * Hook for querying data from Supabase
 * @param {string} table - Table name
 * @param {FetchOptions} options - Query options
 * @returns {object} - { data, loading, error, refetch }
 */
export function useSupabaseQuery<T>(table: string, options?: FetchOptions) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupabaseError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(options?.select || '*');

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (options?.limit) {
        const offset = options?.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData(result as T[]);
    } catch (err) {
      const catchErr = err as { code?: string; status?: number; message?: string };
      const error: SupabaseError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: catchErr.code,
        status: catchErr.status,
      };
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [table, options]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for mutating data in Supabase
 * @returns {object} - { insert, update, delete, loading, error }
 */
export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);

  const insert = useCallback(async (table: string, data: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert([data])
        .select();

      if (insertError) throw insertError;

      return result;
    } catch (err) {
      const catchErr = err as { code?: string; status?: number; message?: string };
      const error: SupabaseError = {
        message: err instanceof Error ? err.message : 'Insert failed',
        code: catchErr.code,
        status: catchErr.status,
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (
      table: string,
      data: Record<string, unknown>,
      filters: Record<string, unknown>
    ) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from(table).update(data);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data: result, error: updateError } = await query.select();

        if (updateError) throw updateError;

        return result;
      } catch (err) {
        const catchErr = err as { code?: string; status?: number; message?: string };
        const error: SupabaseError = {
          message: err instanceof Error ? err.message : 'Update failed',
          code: catchErr.code,
          status: catchErr.status,
        };
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteRecord = useCallback(async (table: string, filters: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error: deleteError } = await query;

      if (deleteError) throw deleteError;

      return result;
    } catch (err) {
      const catchErr = err as { code?: string; status?: number; message?: string };
      const error: SupabaseError = {
        message: err instanceof Error ? err.message : 'Delete failed',
        code: catchErr.code,
        status: catchErr.status,
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    insert,
    update,
    delete: deleteRecord,
    loading,
    error,
  };
}
