
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, Eye, Sparkles, Loader2 } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import RichTextEditor from '../../components/RichTextEditor';
import { useError } from '../../components/ErrorNotification';
import { useConfirm } from '../../components/ConfirmDialog';

// Helper function to generate URL-friendly slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
}

// removed getStaticProps stub so admin page renders at runtime
export default function AdminKnowledgeEdit() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const postId = urlParams.get('id');
  
  const { addError, addSuccess } = useError();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [tagInput, setTagInput] = useState(''); // For adding new tags

  // Fetch current user
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) return null;
        const user = userData?.user;
        if (!user) return null;
        return { id: user.id, email: user.email, role: user.user_metadata?.role };
      } catch {
        return null;
      }
    },
    staleTime: Infinity, // User info doesn't change often
    cacheTime: Infinity
  });

  // Fetch user profile based on current user email
  const { data: userProfile, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ['user-profile', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const { data, error } = await supabase.from('contributorapplications').select('*').eq('user_email', currentUser.email).limit(1);
      if (error) throw error;
      return (data && data[0]) || null;
    },
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch post data
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['admin-edit-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from('knowledge')
        .select('*')
        .eq('id', postId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
    onSuccess: (data) => {
      if (data && !formData) {
        setFormData({
          title: data.title || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          category_id: data.category_id || '',
          tags: data.tags || [],
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          meta_keywords: data.meta_keywords || '',
          difficulty_level: data.difficulty_level || 'beginner',
          status: data.status || 'draft'
        });
      }
    }
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('KnowledgeCategory')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Generate with AI (content & SEO) using Supabase Edge Function
  const handleAIGenerate = async (type) => {
    if (!formData?.title && type === 'content') {
      addError('Please enter a title first');
      return;
    }

    setAiGenerating(true);
    try {
      if (type === 'content') {
        const response = await supabase.functions.invoke('invokeOpenAI', {
          body: JSON.stringify({
            prompt: `You are a Thailand visa expert writing for Thai Nexus Knowledge Hub.\n\nTASK: Create a COMPLETE, COMPREHENSIVE article for this question/title:\n\"${formData.title}\"\n\nCRITICAL: You MUST generate BOTH: (content and excerpt)\n`,
            response_json_schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                excerpt: { type: 'string' }
              },
              required: ['content', 'excerpt']
            }
          })
        });

        const data = response?.data || response;
        if (data && data.content) {
          setFormData({
            ...formData,
            content: data.content,
            excerpt: data.excerpt || formData.excerpt
          });
          addSuccess('Content generated successfully!');
        } else {
          console.error('No content in response:', response);
          addError('AI returned empty content. Please try again.');
        }
      } else if (type === 'seo') {
        if (!formData.content || formData.content.length < 100) {
          addError('Please generate content first before creating SEO metadata');
          return;
        }

        const contentText = formData.content.replace(/<[^>]*>/g, ' ').substring(0, 2000);
        const response = await supabase.functions.invoke('invokeOpenAI', {
          body: JSON.stringify({
            prompt: `You are an SEO expert specializing in Thailand visa content.\n\nTASK: Generate SEO metadata for this article.\nArticle Title: \"${formData.title}\"\nExcerpt: \"${formData.excerpt}\"\nContent Preview: \"${contentText}\"`,
            response_json_schema: {
              type: 'object',
              properties: {
                meta_title: { type: 'string' },
                meta_description: { type: 'string' },
                meta_keywords: { type: 'string' }
              },
              required: ['meta_title', 'meta_description', 'meta_keywords']
            }
          })
        });

        const data = response?.data || response;
        if (data && data.meta_title && data.meta_description && data.meta_keywords) {
          setFormData({
            ...formData,
            meta_title: data.meta_title,
            meta_description: data.meta_description,
            meta_keywords: data.meta_keywords
          });
          addSuccess('SEO metadata generated successfully!');
        } else {
          console.error('Incomplete SEO data:', response);
          addError('AI returned incomplete SEO data. Please try again.');
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      addError('AI generation failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setAiGenerating(false);
    }
  };

  // Update mutation
  const updatePostMutation = useMutation({
    mutationFn: async (data) => {
      // Regenerate slug if title changed
      const newSlug = generateSlug(data.title);
      const needsNewSlug = newSlug !== post.slug;
      
      let finalSlug = post.slug;
      if (needsNewSlug) {
        // Check if new slug already exists for another post
        const { data: existing, error: existErr } = await supabase.from('knowledge').select('id').eq('slug', newSlug).limit(1);
        if (existErr) throw existErr;
        const slugExists = (existing && existing.length > 0 && existing[0].id !== postId);
        finalSlug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
      
      // Only include fields that exist in the knowledge table schema
      const updateData = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        summary: data.summary,
        category_id: data.category_id,
        tags: data.tags,
        difficulty_level: data.difficulty_level,
        status: data.status,
        slug: finalSlug,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('knowledge').update(updateData).eq('id', postId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['admin-edit-post', postId] });
      addSuccess('Post updated successfully');
    },
    onError: (error) => {
      addError('Failed to update post: ' + error.message);
    }
  });

  // Delete mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('knowledge').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      addSuccess('Post deleted successfully');
      window.location.href = createPageUrl('AdminKnowledge');
    },
    onError: (error) => {
      addError('Failed to delete post: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!formData.title || !formData.content || !formData.category_id) {
      addError('Please fill in all required fields');
      return;
    }
    updatePostMutation.mutate(formData);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      deletePostMutation.mutate();
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Check user permissions
  const canModerate = userProfile && ['moderator', 'admin'].includes(userProfile.role);
  const isAdmin = userProfile?.role === 'admin';

  if (isLoadingCurrentUser || isLoadingUserProfile || isLoadingPost || isLoadingCategories) {
    return (
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </GlassCard>
      </div>
    );
  }

  // Display restricted message if user is not authorized
  // This needs to be after loading, but before checking for post existence,
  // as post query is disabled for unauthorized users.
  if (!currentUser || !canModerate) {
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard className="p-12 text-center">
          <p className="text-xl text-gray-700">Access restricted to moderators and admins only.</p>
          <p className="text-gray-500 mt-2">You do not have the necessary permissions to view this page.</p>
          <Link href={createPageUrl('KnowledgeHub')}>
            <Button className="mt-6">Go to Knowledge Hub</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (!post || !formData) { // If post not found or formData not yet initialized for an authorized user
    return (
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link href={createPageUrl('AdminKnowledge')}>
            <Button>Back to Moderation</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={createPageUrl('AdminKnowledge')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Edit</h1>
              <p className="text-sm text-gray-600">Full editing with AI assistance</p>
            </div>
          </div>
          <Link href={createPageUrl('KnowledgePost') + `?id=${postId}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* Edit Form */}
      <GlassCard className="p-8 text-black">
        <div className="space-y-6">
          {/* Status, Category, Difficulty, Featured */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 font-medium mb-2">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_moderation">Pending</SelectItem>
                  <SelectItem value="approved">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-900 font-medium mb-2">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-900 font-medium mb-2">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(val) => setFormData({ ...formData, difficulty_level: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem> {/* Changed from null to empty string to match initial state */}
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="featured" className="text-gray-900 font-medium cursor-pointer">
                Featured Post
              </Label>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-gray-900 font-medium mb-2">Title (Question) *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., How do I apply for a retirement visa in Thailand?"
              className="text-lg"
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="text-gray-900 font-medium mb-2">Tags (Topics)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag (e.g., retirement visa, non-o, 800000 thb)"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-[#272262] text-white text-sm flex items-center gap-2"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tags help users find related content. Use lowercase, no spaces (use hyphens instead).
            </p>
          </div>

          {/* Excerpt with AI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-gray-900 font-medium">Excerpt *</Label>
              <Button
                type="button"
                onClick={() => handleAIGenerate('content')}
                disabled={aiGenerating}
                size="sm"
                variant="outline"
                className="border-purple-600 text-purple-600"
              >
                {aiGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Generate Content + Excerpt
              </Button>
            </div>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short summary (150-160 characters)"
              rows={2}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/160 characters</p>
          </div>

          {/* Content Editor */}
          <div>
            <Label className="text-gray-900 font-medium mb-2">Content *</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
              placeholder="Write detailed answer. Use H2 for main sections, H3 for subsections..."
            />
          </div>

          {/* SEO Section with AI */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">SEO Metadata</h3>
              <Button
                type="button"
                onClick={() => handleAIGenerate('seo')}
                disabled={aiGenerating || !formData.content}
                size="sm"
                variant="outline"
                className="border-purple-600 text-purple-600"
              >
                {aiGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Generate SEO
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-900 font-medium mb-2">Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Leave empty to auto-generate from title"
                  maxLength={70}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/70 chars</p>
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2">Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Leave empty to use excerpt"
                  rows={2}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160 chars</p>
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2">Meta Keywords</Label>
                <Input
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  placeholder="retirement visa, thailand, non-o visa"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <div className="flex gap-3">
              <Link href={createPageUrl('AdminKnowledge')}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={updatePostMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Info */}
      <GlassCard className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Post Info</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Author:</span>
            <span className="ml-2 font-medium">{post.author_name}</span>
          </div>
          <div>
            <span className="text-gray-600">Views:</span>
            <span className="ml-2 font-medium">{post.view_count || 0}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
