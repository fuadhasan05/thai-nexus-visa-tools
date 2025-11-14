/**
 * Supabase TypeScript Types
 * Type definitions for common Supabase operations
 */

// ==================== Database Tables ====================

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user: User;
}

export interface VisaApplication {
  id: string;
  user_id: string;
  visa_type: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  message: string;
  rating?: number;
  created_at: string;
}

// ==================== API Responses ====================

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: SupabaseError | null;
}

// ==================== Query Options ====================

export interface FetchOptions {
  select?: string;
  filters?: Record<string, string | number | boolean | string[] | number[]>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface FileUploadOptions {
  upsert?: boolean;
  contentType?: string;
}

// ==================== Real-time Events ====================

export interface RealtimePayload {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  errors: string[] | null;
}

export interface SupabaseChannel {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}
