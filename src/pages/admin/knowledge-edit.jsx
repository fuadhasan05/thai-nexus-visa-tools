
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

export const getStaticProps = async () => {
  return {
    notFound: true,
  };
};
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
        return await base44.auth.me();
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
      const profiles = await base44.entities.contributorapplications.filter({ user_email: currentUser.email });
      return profiles[0];
    },
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Check if user can moderate - FIXED: Also check User entity role
  const canModerate = currentUser?.role === 'admin' || (userProfile && ['moderator', 'admin'].includes(userProfile.role));

  // Redirect non-moderators
  React.useEffect(() => {
    // Only redirect if currentUser is loaded and userProfile has been fetched
    // and currentUser is not null (i.e., logged in) and they can't moderate.
    if (!isLoadingCurrentUser && !isLoadingUserProfile && currentUser && !canModerate) {
      addError('Access restricted: Only moderators and admins can edit knowledge posts.');
      window.location.href = createPageUrl('KnowledgeHub');
    }
  }, [currentUser, canModerate, userProfile, isLoadingCurrentUser, isLoadingUserProfile, addError]);

  // Fetch post
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['admin-edit-post', postId],
    queryFn: async () => {
      const posts = await base44.entities.KnowledgePost.filter({ id: postId });
      if (posts.length === 0) throw new Error('Post not found');
      return posts[0];
    },
    enabled: !!postId && canModerate // Only enable if user can moderate
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.KnowledgeCategory.filter({ is_active: true }, 'sort_order'),
    enabled: canModerate // Only enable if user can moderate
  });

  // Initialize form data when post loads
  React.useEffect(() => {
    if (post && !formData) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category_id: post.category_id,
        status: post.status,
        tags: post.tags || [], // Added tags
        difficulty_level: post.difficulty_level || '', // Added difficulty_level
        featured: post.featured || false, // Added featured
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || ''
      });
    }
  }, [post, formData]);

  // Generate with AI
  const handleAIGenerate = async (type) => {
    if (!formData.title) {
      addError('Please enter a title first');
      return;
    }

    setAiGenerating(true);
    try {
      if (type === 'content') {
        const response = await base44.functions.invoke('invokeOpenAI', {
          prompt: `You are a Thailand visa expert writing for Thai Nexus Knowledge Hub.

TASK: Create a COMPLETE, COMPREHENSIVE article for this question/title:
"${formData.title}"

CRITICAL: You MUST generate BOTH:
1. Full article content (800-1500 words minimum)
2. Short excerpt (150-160 characters)

FORMATTING REQUIREMENTS - USE THESE EXACT HTML TAGS:

STRUCTURE:
- Start with <p>brief 2-3 sentence introduction</p>
- Use <h2>Main Section Heading</h2> for primary sections (at least 3-5 sections)
- Use <h3>Subsection Heading</h3> for subsections under H2
- Keep paragraphs SHORT: <p>2-3 sentences maximum per paragraph</p>
- Use <ul><li>bullet item</li><li>bullet item</li></ul> for lists
- Use <ol><li>step 1</li><li>step 2</li></ol> for numbered steps

EMPHASIS:
- Use <strong>bold text</strong> for amounts, deadlines, requirements (e.g., <strong>800,000 THB</strong>)
- Use <em>italic</em> for emphasis
- Use <blockquote>WARNING or important note</blockquote> for critical info
- Use <code>TM.7</code> for form numbers and fees (e.g., <code>1,900 THB</code>)

CONTENT REQUIREMENTS:
- Write in second person ("you need", "your passport")
- Include SPECIFIC numbers: fees in THB, timeframes, ages
- Provide ACTIONABLE steps with <ol> numbered lists
- Add WARNINGS in <blockquote> about common mistakes
- End with note about Thai Nexus assistance

EXAMPLE ARTICLE STRUCTURE:

<p>Introduction paragraph explaining the visa/process and who needs it. Keep it brief and engaging.</p>

<h2>Who Qualifies for This Visa?</h2>
<p>To apply for this visa, you must meet these requirements:</p>
<ul>
<li><strong>Age:</strong> Must be 50 years or older</li>
<li><strong>Financial:</strong> <code>800,000 THB</code> in Thai bank OR <code>65,000 THB</code>/month pension</li>
<li><strong>Health Insurance:</strong> Coverage of <code>40,000 THB</code> outpatient and <code>400,000 THB</code> inpatient</li>
</ul>

<h2>Required Documents</h2>
<p>Gather these documents before visiting the immigration office:</p>
<ul>
<li>Valid passport (18+ months remaining validity)</li>
<li>Bank statements (last 6 months)</li>
<li>Health insurance certificate</li>
<li><strong>2 passport photos</strong> (4x6cm, white background - NOT regular passport size)</li>
</ul>

<blockquote>
<strong>IMPORTANT:</strong> Photo requirements are strict. Immigration offices reject applications for incorrect photo sizes. Use exactly 4x6cm with white background.
</blockquote>

<h2>Step-by-Step Application Process</h2>
<p>Follow these steps to apply successfully:</p>

<h3>Step 1: Prepare Your Documents</h3>
<ol>
<li>Visit your bank and request an updated bank book stamped SAME DAY as application</li>
<li>Get a bank letter dated within 7 days of application</li>
<li>Fill out form <code>TM.7</code> completely (download from immigration website or get at office)</li>
<li>Make photocopies of all passport pages (data page, visa, stamps) and SIGN each copy</li>
</ol>

<h3>Step 2: Visit Immigration Office</h3>
<ol>
<li>Arrive early (before 9 AM) to avoid 2-3 hour queues</li>
<li>Go to document check desk first</li>
<li>Officer reviews your folder - if complete, you receive queue number</li>
<li>Wait for your number to be called (usually 30-120 minutes)</li>
</ol>

<h3>Step 3: Interview and Payment</h3>
<ol>
<li>Approach desk when called</li>
<li>Officer asks simple questions: "Where do you live?" "What type of visa?"</li>
<li>Sign forms where indicated</li>
<li>Pay <code>1,900 THB</code> fee in CASH ONLY (most offices don't accept cards)</li>
<li>Take photo at desk</li>
</ol>

<h3>Step 4: Receive Stamp</h3>
<p>Officer stamps your passport with 1-year extension. Double-check the dates before leaving the office.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li><strong>Incorrect photo size:</strong> Must be 4x6cm, NOT standard passport size (3.5x4.5cm)</li>
<li><strong>Bank book not updated same day:</strong> Get stamp from bank on application day</li>
<li><strong>Expired bank letter:</strong> Must be dated within 7 days</li>
<li><strong>Unsigned photocopies:</strong> Sign ALL copies of passport pages</li>
<li><strong>Missing TM.30:</strong> Ensure landlord filed this within 24 hours of your arrival</li>
</ul>

<h2>Processing Time and Fees</h2>
<ul>
<li><strong>Processing:</strong> Same day (most offices) or 15-30 days (some offices)</li>
<li><strong>Extension fee:</strong> <code>1,900 THB</code> (cash only)</li>
<li><strong>Re-entry permit:</strong> <code>1,000 THB</code> (single) or <code>3,800 THB</code> (multiple) if traveling</li>
</ul>

<h2>What Happens Next?</h2>
<p>After approval, you receive a 1-year extension stamp in your passport. Remember these ongoing requirements:</p>
<ul>
<li><strong>90-Day Report:</strong> File <code>TM.47</code> every 90 days (online or in-person)</li>
<li><strong>Annual Extension:</strong> Apply for renewal 45 days before expiration</li>
<li><strong>Address Notification:</strong> TM.30 must be filed every time you change address or return from travel</li>
<li><strong>Bank Balance:</strong> Maintain <code>800,000 THB</code> for at least 3 months after extension, cannot drop below <code>400,000 THB</code> rest of year</li>
</ul>

<blockquote>
<strong>Need Professional Help?</strong> Thai Nexus can handle your entire visa application process, from document preparation to immigration office visit. Contact us: +66923277723 (WhatsApp) or contact@thainexus.co.th
</blockquote>

NOW WRITE THE ACTUAL ARTICLE FOLLOWING THIS EXACT FORMAT.

Return as JSON:
{
  "content": "FULL HTML article with ALL sections, at least 800 words",
  "excerpt": "150-160 character summary"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              content: { 
                type: "string", 
                description: "Complete HTML article with h2, h3, p, ul, ol, li, strong, em, blockquote, code tags. Minimum 800 words."
              },
              excerpt: { 
                type: "string", 
                description: "Short 150-160 character summary of the article"
              }
            },
            required: ["content", "excerpt"]
          }
        });

        console.log('AI Content Response:', response.data);

        if (response.data && response.data.content) {
          setFormData({
            ...formData,
            content: response.data.content,
            excerpt: response.data.excerpt || formData.excerpt
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
        const response = await base44.functions.invoke('invokeOpenAI', {
          prompt: `You are an SEO expert specializing in Thailand visa content.

TASK: Generate SEO metadata for this article.

Article Title: "${formData.title}"
Excerpt: "${formData.excerpt}"
Content Preview: "${contentText}"

Generate THREE specific items:

1. **meta_title** (50-60 characters, NOT LONGER):
   - Must include main keyword + "Thailand" or "Thai"
   - Format options:
     * "[Main Keyword] Thailand | Thai Nexus"
     * "How to [Action] in Thailand | Complete Guide"
     * "[Visa Type] Requirements Thailand 2025"
   - Examples:
     * "Retirement Visa Thailand Guide 2025 | Requirements"
     * "How to Apply for DTV Thailand | Complete Process"
     * "Thailand 90-Day Report Guide | TM.47 Instructions"

2. **meta_description** (150-160 characters, NOT SHORTER):
   - Must be EXACTLY 150-160 characters
   - Include: benefit + keyword + call-to-action
   - Use power words: "complete", "step-by-step", "expert", "detailed", "2025"
   - Examples:
     * "Complete guide to Thailand retirement visa 2025: requirements, costs, step-by-step application process. Expert assistance available. Get your visa approved fast."
     * "Learn how to file TM.47 90-day report in Thailand. Step-by-step instructions, deadlines, online filing guide. Avoid penalties. Expert help available 24/7."

3. **meta_keywords** (5-8 keywords, comma-separated):
   - Use long-tail keywords expats actually search
   - Include:
     * Main visa type/process
     * Location-specific terms (Thailand, Hua Hin, Bangkok, etc.)
     * Year (2025)
     * Common variations
     * Cost/requirement terms
   - Examples:
     * "thailand retirement visa 2025, non-o visa requirements, retire in thailand cost, hua hin immigration office, visa extension thailand process"
     * "thailand 90 day report, TM.47 form online, immigration reporting thailand, avoid overstay penalties thailand"

REQUIREMENTS:
- meta_title: EXACTLY 50-60 characters
- meta_description: EXACTLY 150-160 characters  
- meta_keywords: 5-8 relevant long-tail keywords

Return ONLY valid JSON:
{
  "meta_title": "exact title 50-60 chars",
  "meta_description": "exact description 150-160 chars",
  "meta_keywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              meta_title: { 
                type: "string",
                description: "SEO title 50-60 characters including primary keyword and Thailand"
              },
              meta_description: { 
                type: "string",
                description: "SEO description 150-160 characters with call-to-action"
              },
              meta_keywords: { 
                type: "string",
                description: "5-8 comma-separated long-tail keywords"
              }
            },
            required: ["meta_title", "meta_description", "meta_keywords"]
          }
        });

        console.log('AI SEO Response:', response.data);

        if (response.data && response.data.meta_title && response.data.meta_description && response.data.meta_keywords) {
          setFormData({
            ...formData,
            meta_title: response.data.meta_title,
            meta_description: response.data.meta_description,
            meta_keywords: response.data.meta_keywords
          });
          addSuccess('SEO metadata generated successfully!');
        } else {
          console.error('Incomplete SEO data:', response);
          addError('AI returned incomplete SEO data. Please try again.');
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      addError('AI generation failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
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
        const existing = await base44.entities.KnowledgePost.filter({ slug: newSlug });
        const slugExists = existing.some(p => p.id !== postId); // Ensure it's not the current post itself
        finalSlug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
      
      return await base44.entities.KnowledgePost.update(postId, {
        ...data,
        slug: finalSlug,
        last_edited_date: new Date().toISOString(),
        canonical_url: `https://visa.thainexus.co.th/knowledgepost?slug=${finalSlug}`
      });
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
    mutationFn: () => base44.entities.KnowledgePost.delete(postId),
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
      <GlassCard className="p-8">
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
