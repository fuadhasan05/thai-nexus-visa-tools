/**
 * Supabase Type Definitions for Auto-completion
 * This file helps with IDE auto-completion and type safety
 * 
 * To use these types in your components:
 * import type { User, VisaApplication } from '@/types/supabase';
 */

declare module '@/types/supabase' {
  /**
   * User table type
   * @example
   * const user: User = { id: '123', email: 'test@example.com', ... }
   */
  export interface User {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    role: 'user' | 'admin' | 'moderator';
    credits: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
  }

  /**
   * Visa Application table type
   */
  export interface VisaApplication {
    id: string;
    user_id: string;
    visa_type: string;
    destination_country: string;
    status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
    application_date?: string;
    estimated_completion?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }

  /**
   * Knowledge Base article type
   */
  export interface KnowledgeBase {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary?: string;
    category?: string;
    tags: string[];
    author_id?: string;
    is_published: boolean;
    view_count: number;
    created_at: string;
    updated_at: string;
  }

  /**
   * Feedback type
   */
  export interface Feedback {
    id: string;
    user_id?: string;
    email?: string;
    category?: string;
    message: string;
    rating?: number;
    status: 'new' | 'acknowledged' | 'resolved';
    created_at: string;
  }

  /**
   * Document type
   */
  export interface Document {
    id: string;
    user_id: string;
    visa_application_id?: string;
    file_name: string;
    file_size?: number;
    file_type?: string;
    file_path: string;
    document_type?: string;
    is_verified: boolean;
    created_at: string;
  }

  /**
   * Partner Program type
   */
  export interface PartnerProgram {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    category?: string;
    commission_rate?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
}

export {};
