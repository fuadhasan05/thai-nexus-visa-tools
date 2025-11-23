import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye, MessageCircle, Edit, History, User, Calendar,
  ThumbsUp, Share2, Flag, ArrowLeft, Clock, CheckCircle,
  BookOpen, ChevronRight, Link2, Facebook, Twitter, Mail,
  Bookmark, Star, TrendingUp, Award, Check, Bell, BellOff,
  ExternalLink, Shield, Copy
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import RichTextEditor from '../../components/RichTextEditor';
import SEOHead from '../../components/SEOHead';
import { useError } from '../../components/ErrorNotification';

// Helper function to generate URL-friendly slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
};

// Helper function to convert HTML to readable plain text with proper spacing
const htmlToPlainText = (html) => {
  if (!html) return '';
  
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Replace block-level elements with newlines
  const blockElements = tmp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, br');
  blockElements.forEach(el => {
    if (el.tagName === 'BR') {
      el.replaceWith('\n');
    } else {
      el.insertAdjacentText('afterend', '\n\n');
    }
  });
  
  // Get text content
  let text = tmp.textContent || tmp.innerText || '';
  
  // Clean up: remove excessive newlines (max 2 consecutive) and trim
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  return text;
};

export default function KnowledgePost() {
  const router = useRouter();
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  
  // Read slug from either URL params or Next.js router query
  const postSlug = urlParams.get('slug') || router.query.slug;
  const postId = urlParams.get('id'); // Backwards compatibility: fetch id
  const isNewPost = urlParams.get('new') === 'true'; // Renamed from isNew

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEditSuggestion, setShowEditSuggestion] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [tableOfContents, setTableOfContents] = useState([]);

  // New post form state - ALWAYS at top level
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    meta_title: '', // Added for new post form
    meta_description: '' // Added for new post form
  });

  const [editSuggestionData, setEditSuggestionData] = useState({
    suggested_title: '',
    suggested_content: '',
    suggested_excerpt: '',
    edit_summary: '',
    edit_type: 'content_edit'
  });

  const { addError, addSuccess } = useError();
  const queryClient = useQueryClient();

  // Helper function to get contributor URL
  const getContributorUrl = (authorEmail, authorName) => {
    // This will be enhanced by fetching the profile, but for now we use email
    // In a real app, we'd fetch the profile to get the slug/ID
    return createPageUrl('KnowledgeContributor') + `?email=${authorEmail}`;
  };

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) return null;
        return data?.user ?? null;
      } catch {
        return null;
      }
    }
  });

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const { data, error } = await supabase
        .from('contributorapplications')
        .select('*')
        .eq('user_email', currentUser.email)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!currentUser?.email
  });

  // Fetch categories for new post form
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
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

  // Fetch post by slug OR id (backwards compatibility)
  const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({ // Renamed isLoading
    queryKey: ['knowledge-post', postSlug || postId], // Use postSlug or postId for key
    queryFn: async () => {
      if (!postSlug && !postId) return null;
      if (postSlug) {
        const { data, error } = await supabase
          .from('KnowledgePost')
          .select('*')
          .eq('slug', postSlug)
          .single();
        if (error) {
          console.error('Error fetching post by slug:', error);
          return null;
        }
        return data;
      }

      if (postId) {
        const { data, error } = await supabase
          .from('KnowledgePost')
          .select('*')
          .eq('id', postId)
          .single();
        if (error) {
          console.error('Error fetching post by id:', error);
          return null;
        }
        return data;
      }
    },
    enabled: !isNewPost && (!!postSlug || !!postId), // Only enabled if not new and a slug/ID is present
    retry: false // Don't retry on failure
  });

  // Increment view count mutation
  const incrementViewMutation = useMutation({
    mutationFn: (postIdToUpdate) => 
      supabase
        .from('KnowledgePost')
        .update({ view_count: (post?.view_count || 0) + 1, last_activity_date: new Date().toISOString() })
        .eq('id', postIdToUpdate),
  });

  // Increment view count on mount
  useEffect(() => {
    if (post && !isNewPost) {
      // Only increment if a post is loaded and it's not a new post page
      incrementViewMutation.mutate(post.id);
    }
  }, [post?.id, isNewPost]);

  // Check if user is following this question
  const { data: isFollowing } = useQuery({
    queryKey: ['question-follow', post?.id, currentUser?.email], // Changed postId to post?.id
    queryFn: async () => {
        const { data: follows, error } = await supabase
          .from('QuestionFollow')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_email', currentUser.email)
          .limit(1);
        if (error) throw error;
        return follows?.[0] ?? null;
    },
    enabled: !!post?.id && !!currentUser?.email && !isNewPost // Enabled if post exists and not new
  });

  // Get user reputation
  const { data: authorReputation } = useQuery({
    queryKey: ['user-reputation', post?.author_email],
    queryFn: async () => {
      const { data: reps, error } = await supabase
        .from('UserReputation')
        .select('*')
        .eq('user_email', post.author_email)
        .limit(1);
      if (error) throw error;
      return reps?.[0] ?? null;
    },
    enabled: !!post?.author_email
  });

  // Check if current user has upvoted post
  const { data: userPostUpvote } = useQuery({
    queryKey: ['user-post-upvote', post?.id, currentUser?.email], // Changed postId to post?.id
    queryFn: async () => {
      const { data: votes, error } = await supabase
        .from('PostUpvote')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_email', currentUser.email)
        .limit(1);
      if (error) throw error;
      return votes?.[0] ?? null;
    },
    enabled: !!post?.id && !!currentUser?.email && !isNewPost // Enabled if post exists and not new
  });

  // Fetch category
  const { data: category } = useQuery({
    queryKey: ['category', post?.category_id],
    queryFn: async () => {
      if (!post?.category_id) return null;
      const { data, error } = await supabase
        .from('KnowledgeCategory')
        .select('*')
        .eq('id', post.category_id)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!post?.category_id
  });

  // Fetch related posts based on tags and category
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.id, post?.category_id, post?.tags],
    queryFn: async () => {
      if (!post) return [];

      const { data: allPosts = [], error } = await supabase
        .from('KnowledgePost')
        .select('*')
        .eq('status', 'approved')
        .order('view_count', { ascending: false })
        .limit(20);
      if (error) throw error;

      // Filter out current post
      const others = allPosts.filter(p => p.id !== post.id);

      // Score related posts
      const scored = others.map(p => {
        let score = 0;

        // Same category = 5 points
        if (p.category_id === post.category_id) score += 5;

        // Shared tags = 3 points per tag
        if (post.tags && p.tags) {
          const postTags = new Set(post.tags);
          const pTags = new Set(p.tags);
          const sharedTags = [...postTags].filter(tag => pTags.has(tag));
          score += sharedTags.length * 3;
        }

        // Boost popular posts slightly
        score += (p.view_count || 0) / 100;
        score += (p.upvote_count || 0) * 0.5;

        return { post: p, score };
      });

      // Sort by score and return top 5
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.post);
    },
    enabled: !!post && !isNewPost // Enabled if post exists and not new
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      const { data, error } = await supabase
        .from('KnowledgeComment')
        .select('*')
        .eq('post_id', post.id)
        .eq('status', 'approved')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.id && !isNewPost
  });

  // Fetch comment upvotes
  const { data: userCommentUpvotes = [] } = useQuery({
    queryKey: ['user-comment-upvotes', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const { data, error } = await supabase
        .from('CommentUpvote')
        .select('*')
        .eq('user_email', currentUser.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.email
  });

  // Fetch version history
  const { data: versions = [] } = useQuery({
    queryKey: ['post-versions', post?.id], // Changed postId to post?.id
    queryFn: async () => {
      if (!post?.id) return [];
      const { data, error } = await supabase
        .from('KnowledgePostVersion')
        .select('*')
        .eq('post_id', post.id)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.id && showVersionHistory && !isNewPost // Enabled if post exists, not new, and history is shown
  });

  // Upvote post mutation with new anti-spam system
  const upvotePostMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        addError('You must be logged in to upvote.');
        return;
      }
      if (!post?.id) {
        addError('Cannot upvote, post ID not found.');
        return;
      }

      const { data: existing, error: findErr } = await supabase
        .from('PostUpvote')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_email', currentUser.email)
        .limit(1);
      if (findErr) throw findErr;
      const hasVote = existing && existing.length > 0;

      if (hasVote) {
        const { error: delErr } = await supabase
          .from('PostUpvote')
          .delete()
          .eq('post_id', post.id)
          .eq('user_email', currentUser.email);
        if (delErr) throw delErr;
        await supabase
          .from('KnowledgePost')
          .update({ upvote_count: Math.max(0, (post.upvote_count || 0) - 1) })
          .eq('id', post.id);
        return { success: true, action: 'removed', vote_weight: 1 };
      } else {
        const { error: insErr } = await supabase
          .from('PostUpvote')
          .insert([{ post_id: post.id, user_email: currentUser.email, created_at: new Date().toISOString() }]);
        if (insErr) throw insErr;
        await supabase
          .from('KnowledgePost')
          .update({ upvote_count: (post.upvote_count || 0) + 1 })
          .eq('id', post.id);
        return { success: true, action: 'added', vote_weight: 1 };
      }
    },
    onSuccess: (data) => {
      if (data && data.success) {
        addSuccess(data.action === 'added' ? 'Vote added!' : 'Vote removed');
      }
      queryClient.invalidateQueries({ queryKey: ['knowledge-post', post?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-post-upvote', post?.id, currentUser?.email] });
    },
    onError: (error) => {
      addError('Failed to update vote: ' + (error.message || 'Unknown error'));
    }
  });

  // Upvote comment mutation with new anti-spam system
  const upvoteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      if (!currentUser) {
        addError('You must be logged in to upvote comments.');
        return;
      }
      const existingVote = userCommentUpvotes.find(v => v.comment_id === commentId);
      const hasVote = !!existingVote;

      if (hasVote) {
        const { error } = await supabase
          .from('CommentUpvote')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_email', currentUser.email);
        if (error) throw error;
        return { success: true, action: 'removed' };
      } else {
        const { error } = await supabase
          .from('CommentUpvote')
          .insert([{ comment_id: commentId, user_email: currentUser.email, created_at: new Date().toISOString() }]);
        if (error) throw error;
        return { success: true, action: 'added' };
      }
    },
    onSuccess: (data) => {
      if (data && data.success) {
        if (data.action === 'added') addSuccess('Comment upvoted');
      }
      queryClient.invalidateQueries({ queryKey: ['comments', post?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-comment-upvotes', currentUser?.email] });
    },
    onError: (error) => {
      addError('Failed to update comment vote: ' + (error.message || 'Unknown error'));
    }
  });

  // Mark comment as accepted answer
  const markAnswerMutation = useMutation({
    mutationFn: async (commentId) => {
      if (!currentUser || !isAuthor) {
        addError('Only the author can mark an accepted answer.');
        return;
      }
      if (!post?.id) { // Ensure post.id is available
        addError('Cannot mark answer, post ID not found.');
        return;
      }

      const isCurrentlyAccepted = post.accepted_answer_id === commentId;

      // Update post
      const { error: postErr } = await supabase
        .from('KnowledgePost')
        .update({
          accepted_answer_id: isCurrentlyAccepted ? null : commentId,
          last_activity_date: new Date().toISOString(),
          has_accepted_answer: !isCurrentlyAccepted
        })
        .eq('id', post.id);
      if (postErr) throw postErr;

      // Update the chosen comment
      const { error: setErr } = await supabase
        .from('KnowledgeComment')
        .update({ is_accepted_answer: !isCurrentlyAccepted })
        .eq('id', commentId);
      if (setErr) throw setErr;

      if (!isCurrentlyAccepted && post.accepted_answer_id) {
        // unset previous accepted comment
        await supabase
          .from('KnowledgeComment')
          .update({ is_accepted_answer: false })
          .eq('id', post.accepted_answer_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-post', post?.id] }); // Use post?.id
      queryClient.invalidateQueries({ queryKey: ['comments', post?.id] }); // Use post?.id
      addSuccess('Answer status updated!');
    },
    onError: (error) => {
      addError('Failed to mark answer: ' + error.message);
    }
  });

  // Create post mutation with slug
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const profile = userProfile || {};
      const generatedSlug = generateSlug(data.title);
      
      // Check if slug already exists
      const { data: existing = [], error: existErr } = await supabase
        .from('KnowledgePost')
        .select('id')
        .eq('slug', generatedSlug)
        .limit(1);
      if (existErr) throw existErr;
      const finalSlug = (existing && existing.length > 0) ? `${generatedSlug}-${Date.now()}` : generatedSlug;

      const { data: inserted = [], error: insErr } = await supabase
        .from('KnowledgePost')
        .insert([{
          ...data,
          slug: finalSlug,
          author_email: currentUser.email,
          author_name: profile.full_name || currentUser.full_name,
          author_avatar: profile.avatar_url,
          status: canModerate ? 'approved' : 'pending_moderation',
          published_date: canModerate ? new Date().toISOString() : null,
          last_activity_date: new Date().toISOString(),
          meta_title: data.meta_title || `${data.title} | Thai Nexus`,
          meta_description: data.meta_description || data.excerpt,
          canonical_url: `https://visa.thainexus.co.th/knowledgepost?slug=${finalSlug}`,
          followers_count: 0
        }])
        .select('*');
      if (insErr) throw insErr;
      const newPost = inserted[0];

      // Create initial version
      const { error: verErr } = await supabase
        .from('KnowledgePostVersion')
        .insert([{
          post_id: newPost.id,
          version_number: 1,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          editor_email: currentUser.email,
          editor_name: profile.full_name || currentUser.full_name,
          edit_summary: 'Initial creation',
          change_type: 'created'
        }]);
      if (verErr) throw verErr;

      return newPost;
    },
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-all-posts'] }); // Invalidate all posts list
      queryClient.invalidateQueries({ queryKey: ['user-profile'] }); // Invalidate user profile for contribution points etc.
      addSuccess(canModerate ? 'Post published successfully!' : 'Post submitted for moderation');
      // Redirect to the new post using slug
      window.location.href = createPageUrl('KnowledgePost') + `?slug=${newPost.slug}`;
    },
    onError: (error) => {
      addError('Failed to create post: ' + error.message);
    }
  });

  // Comment mutation with counter update and follower notification
  const commentMutation = useMutation({
    mutationFn: async (content) => {
      const profile = userProfile || {};
      const hasUrls = /https?:\/\//i.test(content);
      if (!post?.id) { // Ensure post.id is available
        addError('Cannot post comment, post ID not found.');
        return;
      }
      const { data: newCommentArr, error: cmErr } = await supabase
        .from('KnowledgeComment')
        .insert([{
          post_id: post.id,
          user_email: currentUser.email,
          user_display_name: profile.full_name || profile.nickname || currentUser.full_name || 'User',
          user_avatar: profile.avatar_url,
          content,
          status: hasUrls ? 'pending' : 'approved',
          has_urls: hasUrls,
          created_date: new Date().toISOString()
        }])
        .select('*');
      if (cmErr) throw cmErr;
      const newComment = newCommentArr[0];

      // Update post activity and comment count
      if (!hasUrls && post) {
        const { error: postErr } = await supabase
          .from('KnowledgePost')
          .update({ comment_count: (post.comment_count || 0) + 1, last_activity_date: new Date().toISOString() })
          .eq('id', post.id);
        if (postErr) throw postErr;

        // Notify followers via server endpoint (best-effort)
        try {
          await fetch('/api/notify-followers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: post.id,
              answer_content: content,
              answerer_name: profile.full_name || currentUser.full_name || 'Anonymous User'
            })
          });
        } catch (error) {
          console.error('Failed to notify followers:', error);
        }
      }

      return { ...newComment, has_urls: hasUrls };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', post?.id] }); // Use post?.id
      queryClient.invalidateQueries({ queryKey: ['knowledge-post', post?.id] }); // Use post?.id
      setCommentText('');
      setShowCommentForm(false);
      if (data.has_urls) {
        addSuccess('Comment submitted for moderation (contains URLs)');
      } else {
        addSuccess('Comment posted!');
      }
    },
    onError: (error) => {
      addError('Failed to post comment: ' + error.message);
    }
  });

  // Edit suggestion mutation
  const suggestEditMutation = useMutation({
    mutationFn: async (data) => {
      const profile = userProfile || {};
      if (!post?.id) {
        addError('Cannot submit suggestion, post ID not found.');
        return;
      }
      const { error } = await supabase
        .from('edit_suggestions')
        .insert([{
          post_id: post.id,
          suggester_email: currentUser.email,
          suggester_name: profile.full_name || currentUser.email?.split('@')[0],
          edit_type: data.edit_type,
          suggested_title: data.suggested_title || null,
          suggested_excerpt: data.suggested_excerpt || null,
          suggested_content: data.suggested_content,
          edit_summary: data.edit_summary,
          status: 'pending',
          created_date: new Date().toISOString()
        }]);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edit-suggestions'] });
      addSuccess('Edit suggestion submitted for review!');
      setShowEditSuggestion(false);
      setEditSuggestionData({
        suggested_title: '',
        suggested_content: '',
        suggested_excerpt: '',
        edit_summary: '',
        edit_type: 'content_edit'
      });
    },
    onError: (error) => {
      addError('Failed to submit suggestion: ' + error.message);
    }
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        addError('Please login to follow questions');
        return;
      }
      if (!post?.id) { // Ensure post.id is available
        addError('Cannot follow, post ID not found.');
        return;
      }
      if (isFollowing) {
        const { error: delErr } = await supabase
          .from('QuestionFollow')
          .delete()
          .eq('id', isFollowing.id);
        if (delErr) throw delErr;
        await supabase
          .from('KnowledgePost')
          .update({ followers_count: Math.max(0, (post.followers_count || 0) - 1) })
          .eq('id', post.id);
      } else {
        const { error: insErr } = await supabase
          .from('QuestionFollow')
          .insert([{
            post_id: post.id,
            user_email: currentUser.email,
            notification_enabled: true,
            created_date: new Date().toISOString()
          }]);
        if (insErr) throw insErr;
        await supabase
          .from('KnowledgePost')
          .update({ followers_count: (post.followers_count || 0) + 1 })
          .eq('id', post.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-follow', post?.id, currentUser?.email] }); // Use post?.id
      queryClient.invalidateQueries({ queryKey: ['knowledge-post', post?.id] }); // Use post?.id
      addSuccess(isFollowing ? 'Unfollowed question' : 'Following question - you\'ll get notified of new answers');
    },
    onError: (error) => {
      addError('Failed to update follow status: ' + error.message);
    }
  });

  // Track social shares
  const trackShare = async (platform) => {
    if (!post || !post.id) return; // Ensure post and post.id exist

    try {
      await supabase
        .from('SocialShare')
        .insert([{ post_id: post.id, platform, user_email: currentUser?.email, share_timestamp: new Date().toISOString() }]);

      queryClient.invalidateQueries({ queryKey: ['knowledge-post', post.id] });
    } catch (error) {
      console.error('Share tracking error:', error);
    }
  };

  const handleShare = (platform) => {
    const url = post.canonical_url || window.location.href;
    const title = post.title;
    const text = post.excerpt;

    trackShare(platform); // Track the share action

    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank', 'width=600,height=400');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      case 'copy_link':
        navigator.clipboard.writeText(url);
        addSuccess('Link copied to clipboard!');
        break;
      default:
        console.warn('Unknown share platform:', platform);
    }
  };


  // Add structured data to head (JSON-LD only)
  useEffect(() => {
    if (post && post.status === 'approved') {
      const plainTextContent = htmlToPlainText(post.content);

      // FAQ + Article combined schema
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "FAQPage",
            "mainEntity": {
              "@type": "Question",
              "name": post.title,
              "answerCount": comments.length,
              "upvoteCount": post.upvote_count || 0,
              "dateCreated": post.published_date || post.created_date,
              "author": {
                "@type": "Person",
                "name": post.author_name
              },
              "acceptedAnswer": {
                "@type": "Answer",
                "text": plainTextContent,
                "upvoteCount": post.upvote_count || 0,
                "author": {
                  "@type": "Person",
                  "name": post.author_name
                },
                "dateCreated": post.published_date || post.created_date
              },
              "suggestedAnswer": comments.length > 0 ? comments.slice(0, 3).map(comment => ({
                "@type": "Answer",
                "text": comment.content,
                "upvoteCount": comment.upvote_count || 0,
                "author": {
                  "@type": "Person",
                  "name": comment.user_display_name
                },
                "dateCreated": comment.created_date
              })) : undefined
            }
          },
          {
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "articleBody": plainTextContent,
            "author": {
              "@type": "Person",
              "name": post.author_name
            },
            "datePublished": post.published_date || post.created_date,
            "dateModified": post.last_edited_date || post.last_activity_date || post.created_date,
            "interactionStatistic": [
              {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/ViewAction",
                "userInteractionCount": post.view_count || 0
              },
              {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": post.upvote_count || 0
              },
              {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/CommentAction",
                "userInteractionCount": post.comment_count || 0
              }
            ],
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": post.canonical_url || window.location.href
            }
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://visa.thainexus.co.th"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Knowledge Hub",
                "item": "https://visa.thainexus.co.th/knowledgehub"
              },
              ...(category ? [{
                "@type": "ListItem",
                "position": 3,
                "name": category.name,
                "item": `https://visa.thainexus.co.th/knowledgehub?category=${category.id}`
              }] : []),
              {
                "@type": "ListItem",
                "position": (category ? 4 : 3),
                "name": post.title
              }
            ]
          }
        ].filter(Boolean)
      };

      // Clean up previous schema script if it exists
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }

      // Add schema script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) document.head.removeChild(script);
      };
    }
  }, [post, comments, category]);

  // Extract table of contents and inject IDs
  useEffect(() => {
    if (post?.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const headings = doc.querySelectorAll('h2, h3');

      const toc = [];
      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.setAttribute('id', id); // Inject ID into heading
        toc.push({
          id,
          text: heading.textContent,
          level: heading.tagName.toLowerCase()
        });
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTableOfContents(toc);
    }
  }, [post?.content]);

  // Scroll spy for active heading
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('article h2, article h3');
      let currentActiveHeading = '';

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i];
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentActiveHeading = heading.textContent;
          break;
        }
      }
      setActiveHeading(currentActiveHeading);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post?.content]);


  const canModerate = userProfile && ['moderator', 'admin'].includes(userProfile.role);
  const isAdmin = currentUser?.role === 'admin';
  const isAuthor = post && currentUser && post.author_email === currentUser.email;

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Inject IDs into content HTML for scroll-to functionality
  const getContentWithIds = () => {
    if (!post?.content) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');

    headings.forEach((heading, index) => {
      heading.setAttribute('id', `heading-${index}`);
    });

    return doc.body.innerHTML;
  };

  // Calculate answer quality for sorting
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      // Accepted answer always first
      if (a.id === post?.accepted_answer_id) return -1;
      if (b.id === post?.accepted_answer_id) return 1;

      // Then by helpfulness score (upvotes)
      const scoreA = (a.upvote_count || 0);
      const scoreB = (b.upvote_count || 0);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Then by date (newest first)
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [comments, post?.accepted_answer_id]);


  // New Post Form - Allow all logged-in users to create posts
  if (isNewPost && currentUser) { // Changed from canContribute to currentUser
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        <SEOHead page="KnowledgePost" /> {/* SEOHead is kept for new post form page */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href={createPageUrl('KnowledgeHub')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-[#272262] mb-6">Write New Article</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#454545] mb-2">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-2 border border-[#E7E7E7] rounded-lg"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#454545] mb-2">Title (Question) *</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., How do I apply for a retirement visa in Thailand?"
                className="text-lg"
                required
              />
              <p className="text-xs text-[#454545] mt-1">This will be the H1 heading of your article</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#454545] mb-2">Excerpt *</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary (150-160 characters for SEO)"
                rows={2}
                maxLength={160}
                required
              />
              <p className="text-xs text-[#454545] mt-1">{formData.excerpt.length}/160 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#454545] mb-2">Content *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(val) => setFormData({ ...formData, content: val })}
                placeholder="Write your detailed answer here. Use H2 for main sections, H3 for subsections..."
              />
            </div>

            {/* SEO Fields */}
            <div className="border-t border-[#E7E7E7] pt-6 mt-6">
              <h2 className="text-lg font-bold mb-4 text-[#272262]">SEO Details (Optional)</h2>
              <div>
                <label className="block text-sm font-medium text-[#454545] mb-2">Meta Title</label>
                <Input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Custom SEO Title (if different from article title)"
                  maxLength={70}
                />
                <p className="text-xs text-[#454545] mt-1">{formData.meta_title.length}/70 characters (recommended)</p>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#454545] mb-2">Meta Description</label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Custom SEO Description (if different from excerpt)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-[#454545] mt-1">{formData.meta_description.length}/160 characters</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!formData.title || !formData.content || !formData.category_id) {
                    addError('Please fill in all required fields');
                    return;
                  }
                  createPostMutation.mutate(formData);
                }}
                disabled={createPostMutation.isPending}
                className="bg-[#272262] hover:bg-[#3d3680] text-white"
              >
                {createPostMutation.isPending ? 'Submitting...' : 'Submit for Review'}
              </Button>
              <Link href={createPageUrl('KnowledgeHub')}>
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show login prompt for new post if not authenticated
  if (isNewPost && !currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <SEOHead page="KnowledgePost" />
        <GlassCard className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-[#272262] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#272262] mb-4">Sign In to Write</h1>
          <p className="text-[#454545] mb-6">You need to be logged in to create articles.</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => router.push(createPageUrl('login'))}
              className="bg-[#272262] hover:bg-[#3d3680] text-white"
            >
              Sign In
            </Button>
            <Link href={createPageUrl('KnowledgeHub')}>
              <Button variant="outline">Back to Hub</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (isLoadingPost) { // Changed isLoading to isLoadingPost
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#272262] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#454545]">Loading article...</p>
        </GlassCard>
      </div>
    );
  }

  // If not new, not loading, and post is null (meaning not found after attempted fetch)
  if (!post && !isNewPost && (postSlug || postId)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        <SEOHead page="KnowledgePost" /> {/* Added SEOHead here for 404 page */}
        <GlassCard className="p-12 text-center">
          <h1 className="text-2xl font-bold text-[#272262] mb-4">Article Not Found</h1>
          <p className="text-[#454545] mb-6">The article you are looking for does not exist or has been removed.</p>
          <Link href={createPageUrl('KnowledgeHub')}>
            <Button>Back to Knowledge Hub</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // This is the main return block for an existing post.
  // It only executes if !isNewPost and post is available.
  // (Assuming post object is populated at this point)
  if (!isNewPost && post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        {/* SEO Meta Tags are now dynamically set by the useEffect hook above for this post */}
        <SEOHead
          page="KnowledgePost"
          title={post.meta_title || `${post.title} | Thailand Visa Q&A | Thai Nexus`}
          description={post.meta_description || post.excerpt}
          keywords={post.meta_keywords || (post.tags ? post.tags.join(', ') : 'thailand visa, visa questions, expat help')}
          canonicalUrl={post.canonical_url || `https://visa.thainexus.co.th/knowledgepost?slug=${post.slug}`}
          og={{
            title: post.og_title || post.meta_title || `${post.title} | Thailand Visa Q&A | Thai Nexus`,
            description: post.og_description || post.meta_description || post.excerpt,
            url: post.canonical_url || `https://visa.thainexus.co.th/knowledgepost?slug=${post.slug}`,
            type: 'article',
          }}
          article={{
            publishedTime: post.published_date,
            modifiedTime: post.last_edited_date || post.published_date,
            author: post.author_name,
          }}
        />

        {/* Breadcrumbs - MOBILE RESPONSIVE */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#454545] mb-4 sm:mb-6 overflow-x-auto pb-2">
          <Link href={createPageUrl('KnowledgeHub')} className="hover:text-[#272262] whitespace-nowrap">Knowledge Hub</Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          {category && (
            <>
              <Link href={createPageUrl('KnowledgeHub') + `?category=${category.id}`} className="hover:text-[#272262] whitespace-nowrap truncate max-w-[150px] sm:max-w-none">
                {category.name}
              </Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            </>
          )}
          <span className="text-[#272262] truncate">{post.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {/* Article Card - MOBILE RESPONSIVE */}
            <GlassCard className="overflow-hidden bg-white border border-[#E7E7E7]">
              {/* Header - MOBILE RESPONSIVE */}
              <div className="p-4 sm:p-6 md:p-8 border-b border-[#E7E7E7]">
                {category && (
                  <span 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs sm:text-sm font-medium mb-3 sm:mb-4"
                    style={{ 
                      background: category.color || 'linear-gradient(135deg, #272262 0%, #3d3680 100%)'
                    }}
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    {category.name}
                  </span>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#272262] leading-tight flex-1">{post.title}</h1>

                  {/* Follow Button - MOBILE RESPONSIVE */}
                  {currentUser && (
                    <Button
                      onClick={() => followMutation.mutate()}
                      variant={isFollowing ? "default" : "outline"}
                      size="sm"
                      disabled={followMutation.isPending}
                      className={`w-full sm:w-auto ${isFollowing ? "bg-[#272262] text-white hover:bg-[#3d3680]" : "border-[#272262] text-[#272262] hover:bg-[#F8F9FA]"}`}
                    >
                      {isFollowing ? (
                        <><BellOff className="w-4 h-4 mr-2" />Following</>
                      ) : (
                        <><Bell className="w-4 h-4 mr-2" />Follow</>
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-base sm:text-lg text-[#454545] mb-4 sm:mb-6">{post.excerpt}</p>

                {/* Tags - MOBILE RESPONSIVE */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                    {post.tags.map(tag => (
                      <Link key={tag} href={createPageUrl('KnowledgeHub') + `?tag=${encodeURIComponent(tag)}`}>
                        <span className="px-2 sm:px-3 py-1 rounded-full bg-[#F8F9FA] text-[#454545] text-xs sm:text-sm hover:bg-[#E7E7E7] transition-colors border border-[#E7E7E7]">
                          #{tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Meta Info - MOBILE RESPONSIVE */}
                <div className="space-y-4 pb-6 border-b border-[#E7E7E7] text-black">
                  <Link href={getContributorUrl(post.author_email, post.author_name)}>
                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0 relative">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm sm:text-base">{post.author_name?.charAt(0) || 'U'}</span>
                        )}
                        {authorReputation && authorReputation.reputation_points > 100 && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                            <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-800" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#272262] flex items-center gap-2 text-sm sm:text-base">
                          <span className="truncate">{post.author_name}</span>
                          {authorReputation && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold border border-yellow-300 flex-shrink-0">
                              {authorReputation.reputation_points} rep
                            </span>
                          )}
                        </div>
                        <div className="text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Published {new Date(post.published_date || post.created_date).toLocaleDateString()}
                        </div>
                        {post.last_activity_date && new Date(post.last_activity_date).toDateString() !== new Date(post.created_date).toDateString() && (
                          <div className="text-xs flex items-center gap-1 text-[#454545]">
                            <Clock className="w-3 h-3" />
                            Active {new Date(post.last_activity_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mt-2">
                    {currentUser && (
                      <button
                        onClick={() => upvotePostMutation.mutate()}
                        disabled={upvotePostMutation.isPending}
                        className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                          userPostUpvote
                            ? 'bg-green-100 text-green-700 font-medium border border-green-300'
                            : 'hover:bg-[#F8F9FA] text-[#454545] border border-[#E7E7E7]'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${userPostUpvote ? 'fill-current' : ''}`} />
                        <span className="hidden xs:inline">{post.upvote_count || 0} Helpful</span>
                        <span className="xs:hidden">{post.upvote_count || 0}</span>
                      </button>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{post.view_count || 0} views</span>
                      <span className="xs:hidden">{post.view_count || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{comments.length} answers</span>
                      <span className="xs:hidden">{comments.length}</span>
                    </span>
                    {post.followers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">{post.followers_count} following</span>
                        <span className="xs:hidden">{post.followers_count}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Article Content - MOBILE RESPONSIVE */}
              <article className="p-4 sm:p-6 md:p-8 prose prose-sm sm:prose-base md:prose-lg max-w-none text-black">
                <style>{`
                  article h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #272262;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    line-height: 1.4;
                  }

                  @media (min-width: 640px) {
                    article h2 {
                      font-size: 1.5rem;
                      margin-top: 2.25rem;
                      margin-bottom: 1.125rem;
                    }
                  }

                  @media (min-width: 768px) {
                    article h2 {
                      font-size: 1.75rem;
                      margin-top: 2.5rem;
                      margin-bottom: 1.25rem;
                    }
                  }

                  article h3 {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #454545;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.4;
                  }

                  @media (min-width: 640px) {
                    article h3 {
                      font-size: 1.25rem;
                      margin-top: 1.75rem;
                      margin-bottom: 0.875rem;
                    }
                  }

                  @media (min-width: 768px) {
                    article h3 {
                      font-size: 1.375rem;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                    }
                  }

                  article p {
                    font-size: 0.875rem;
                    line-height: 1.75;
                    color: #454545;
                    margin-bottom: 1.25rem;
                  }

                  @media (min-width: 640px) {
                    article p {
                      font-size: 1rem;
                      line-height: 1.8;
                      margin-bottom: 1.375rem;
                    }
                  }

                  @media (min-width: 768px) {
                    article p {
                      font-size: 1.125rem;
                      line-height: 1.875;
                      margin-bottom: 1.5rem;
                    }
                  }

                  article ul, article ol {
                    margin-bottom: 1.25rem;
                    line-height: 1.75;
                    padding-left: 1.5rem;
                    list-style-position: outside;
                  }

                  @media (min-width: 768px) {
                    article ul, article ol {
                      margin-bottom: 1.5rem;
                      line-height: 1.875;
                      padding-left: 2rem;
                    }
                  }

                  article li {
                    margin-bottom: 0.5rem;
                    padding-left: 0.375rem;
                  }

                  @media (min-width: 768px) {
                    article li {
                      margin-bottom: 0.75rem;
                      padding-left: 0.5rem;
                    }
                  }

                  article strong {
                    font-weight: 600;
                    color: #272262;
                  }

                  article a {
                    color: #BF1E2E;
                    text-decoration: underline;
                    word-break: break-word;
                  }

                  article a:hover {
                    color: #9d1825;
                  }

                  article table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1em 0;
                    font-size: 0.75rem;
                    overflow-x: auto;
                    display: block;
                  }

                  @media (min-width: 640px) {
                    article table {
                      font-size: 0.875rem;
                      display: table;
                    }
                  }

                  article table td,
                  article table th {
                    border: 1px solid #E7E7E7;
                    padding: 0.5em;
                  }

                  @media (min-width: 640px) {
                    article table td,
                    article table th {
                      padding: 0.75em;
                    }
                  }

                  article table th {
                    background: #F8F9FA;
                    font-weight: bold;
                    color: #272262;
                  }
                `}</style>
                <div dangerouslySetInnerHTML={{ __html: getContentWithIds() }} />
              </article>

              {/* Actions Bar - MOBILE RESPONSIVE */}
              <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-[#F8F9FA] border-t border-[#E7E7E7]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Share Buttons */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleShare('facebook')}>
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('twitter')}>
                          <Twitter className="w-4 h-4 mr-2" />
                          Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                          <Link2 className="w-4 h-4 mr-2" />
                          LinkedIn
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('email')}>
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleShare('copy_link')}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {isAdmin && (
                      <Link href={createPageUrl('AdminKnowledgeEdit') + `?id=${post.id}`}>
                        <Button variant="outline" size="sm" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                          <Edit className="w-4 h-4 mr-2" />
                          Admin Edit
                        </Button>
                      </Link>
                    )}

                    {currentUser && (
                      <Button
                        onClick={() => {
                          setEditSuggestionData({
                            suggested_title: post.title,
                            suggested_content: post.content,
                            suggested_excerpt: post.excerpt,
                            edit_summary: '',
                            edit_type: 'content_edit'
                          });
                          setShowEditSuggestion(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Suggest Edit
                      </Button>
                    )}

                    {currentUser && (
                      <Link href={createPageUrl('KnowledgePost') + '?new=true'}>
                        <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Write New Article
                        </Button>
                      </Link>
                    )}

                    <Button onClick={() => setShowVersionHistory(!showVersionHistory)} variant="outline" size="sm">
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Version History */}
            {showVersionHistory && (
              <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
                <h3 className="text-xl font-bold text-[#272262] mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#BF1E2E]" />
                  Version History
                </h3>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="border border-[#E7E7E7] rounded-lg p-4 hover:bg-[#F8F9FA] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-[#272262]">Version {version.version_number}</span>
                          <span className="text-sm text-[#454545] ml-3">
                            by {version.editor_name}
                          </span>
                        </div>
                        <div className="text-xs text-[#454545]">
                          {new Date(version.created_date).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          version.change_type === 'created' ? 'bg-green-100 text-green-700 border border-green-300' :
                          version.change_type === 'major_edit' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                          {version.change_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-[#454545]">{version.edit_summary}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Edit Suggestion Form */}
            {showEditSuggestion && (
              <GlassCard className="p-6 bg-white border border-[#E7E7E7] text-black">
                <h3 className="text-xl font-bold text-[#272262] mb-4 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#BF1E2E]" />
                  Suggest an Edit
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#454545] mb-2">Edit Type</label>
                    <select
                      value={editSuggestionData.edit_type}
                      onChange={(e) => setEditSuggestionData({ ...editSuggestionData, edit_type: e.target.value })}
                      className="w-full p-2 border border-[#E7E7E7] text-black rounded-lg"
                    >
                      <option value="content_edit">Content Edit</option>
                      <option value="typo_fix">Typo Fix</option>
                      <option value="add_section">Add Section</option>
                      <option value="remove_section">Remove Section</option>
                      <option value="formatting">Formatting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#454545] mb-2">Suggested Title (optional)</label>
                    <Input
                      type="text"
                      value={editSuggestionData.suggested_title}
                      onChange={(e) => setEditSuggestionData({ ...editSuggestionData, suggested_title: e.target.value })}
                      className="w-full p-2 border border-[#E7E7E7] rounded-lg"
                      placeholder="Leave empty if not changing title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#454545] mb-2">Suggested Excerpt (optional)</label>
                    <Textarea
                      value={editSuggestionData.suggested_excerpt}
                      onChange={(e) => setEditSuggestionData({ ...editSuggestionData, suggested_excerpt: e.target.value })}
                      placeholder="Leave empty if not changing excerpt"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#454545] mb-2">Suggested Content *</label>
                    <RichTextEditor
                      value={editSuggestionData.suggested_content}
                      onChange={(val) => setEditSuggestionData({ ...editSuggestionData, suggested_content: val })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#454545] mb-2">Edit Summary * (explain your changes)</label>
                    <Textarea
                      value={editSuggestionData.edit_summary}
                      onChange={(e) => setEditSuggestionData({ ...editSuggestionData, edit_summary: e.target.value })}
                      placeholder="Describe what you changed and why... e.g., 'Fixed typos in paragraph 2, updated outdated visa fee information, added missing requirement about police clearance'"
                      rows={3}
                    />
                  </div>

                  <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg p-4">
                    <p className="text-sm text-[#454545]">
                      <strong>Tip:</strong> Be specific about your changes. This helps moderators review and approve your edits faster.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        if (!editSuggestionData.edit_summary || !editSuggestionData.suggested_content) {
                          addError('Please fill in all required fields');
                          return;
                        }
                        suggestEditMutation.mutate(editSuggestionData);
                      }}
                      disabled={suggestEditMutation.isPending}
                      className="bg-[#272262] hover:bg-[#3d3680] text-white"
                    >
                      {suggestEditMutation.isPending ? 'Submitting...' : 'Submit Suggestion'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditSuggestion(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Comments Section with Enhanced Display */}
            <GlassCard className="p-4 sm:p-6 bg-white border border-[#E7E7E7]">
              <h3 className="text-xl sm:text-2xl font-bold text-[#272262] mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#BF1E2E]" />
                <span>{comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}</span>
                {!!post.accepted_answer_id && (
                  <span className="text-xs sm:text-sm text-green-600 font-normal flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Best answer selected
                  </span>
                )}
              </h3>

              {/* Answer Quality Info */}
              {comments.length > 1 && (
                <div className="mb-6 p-4 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg">
                  <p className="text-sm text-[#454545]">
                    <strong>Answers sorted by:</strong> Accepted answer first, then by community votes, then by newest
                  </p>
                </div>
              )}

              {currentUser ? (
                <>
                  {!showCommentForm ? (
                    <Button onClick={() => setShowCommentForm(true)} className="mb-4 sm:mb-6 bg-[#272262] hover:bg-[#3d3680] text-white w-full sm:w-auto">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Add Answer
                    </Button>
                  ) : (
                    <div className="mb-4 sm:mb-6 space-y-3">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your thoughts or ask a question..."
                        rows={4}
                        className="text-sm sm:text-base"
                      />
                      <div className="flex flex-col xs:flex-row gap-2">
                        <Button
                          onClick={() => {
                            if (!commentText.trim()) return;
                            commentMutation.mutate(commentText);
                          }}
                          disabled={commentMutation.isPending}
                          className="bg-[#272262] hover:bg-[#3d3680] text-white w-full xs:w-auto"
                        >
                          {commentMutation.isPending ? 'Posting...' : 'Post Answer'}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowCommentForm(false);
                          setCommentText('');
                        }} className="w-full xs:w-auto">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#F8F9FA] rounded-lg border border-[#E7E7E7]">
                  <p className="text-[#454545] text-sm sm:text-base">
                    Please <button onClick={() => { if (typeof window !== 'undefined') supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } }); }} className="text-[#BF1E2E] underline font-medium">log in</button> to answer
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {sortedComments.map(comment => {
                  const hasUpvoted = userCommentUpvotes.some(v => v.comment_id === comment.id);
                  const isHighQuality = (comment.upvote_count || 0) >= 5;

                  return (
                    <div
                      key={comment.id}
                      className={`border rounded-lg p-3 sm:p-5 transition-all ${
                        comment.id === post.accepted_answer_id
                          ? 'border-2 border-green-300 bg-green-50 shadow-md'
                          : isHighQuality
                          ? 'border-[#E7E7E7] bg-[#F8F9FA]'
                          : 'border-[#E7E7E7] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {comment.id === post.accepted_answer_id && (
                        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-green-700 bg-green-100 p-2 sm:p-3 rounded-lg border border-green-300">
                          <Award className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                          <div>
                            <div className="font-bold text-sm sm:text-base">Best Answer</div>
                            <div className="text-xs">Accepted by question author</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Vote Column - MOBILE RESPONSIVE */}
                        <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
                          <button
                            onClick={() => upvoteCommentMutation.mutate(comment.id)}
                            disabled={upvoteCommentMutation.isPending || !currentUser}
                            className={`flex flex-col items-center p-1.5 sm:p-2 rounded-lg transition-colors ${
                              hasUpvoted
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'hover:bg-[#F8F9FA] text-[#454545] border border-[#E7E7E7]'
                            }`}
                            title={currentUser ? "Mark as helpful" : "Login to upvote"}
                          >
                            <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${hasUpvoted ? 'fill-current' : ''}`} />
                            <span className="text-base sm:text-lg font-bold mt-1">{comment.upvote_count || 0}</span>
                          </button>

                          {isAuthor && (
                            comment.id === post.accepted_answer_id ? (
                              <button
                                  onClick={() => markAnswerMutation.mutate(comment.id)}
                                  disabled={markAnswerMutation.isPending}
                                  className="p-2 rounded-lg text-[#454545] hover:bg-[#F8F9FA] transition-colors border border-[#E7E7E7]"
                                  title="Unmark as best answer"
                              >
                                  <Award className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                  onClick={() => markAnswerMutation.mutate(comment.id)}
                                  disabled={markAnswerMutation.isPending}
                                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors border border-green-300"
                                  title="Mark as best answer"
                              >
                                  <Check className="w-5 h-5" />
                              </button>
                            )
                          )}
                        </div>

                        {/* Content Column - MOBILE RESPONSIVE */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0">
                              {comment.user_avatar ? (
                                <img src={comment.user_avatar} alt={comment.user_display_name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-white font-bold text-xs sm:text-sm">{comment.user_display_name?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#272262] text-sm sm:text-base truncate">{comment.user_display_name}</div>
                              <div className="text-xs text-[#454545]">
                                {new Date(comment.created_date).toLocaleDateString()} at {new Date(comment.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            {isHighQuality && (
                              <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold border border-green-300 flex-shrink-0">
                                Highly Rated
                              </span>
                            )}
                          </div>

                          <div className="prose prose-sm max-w-none mb-3 sm:mb-4">
                            <p className="text-[#454545] whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{comment.content}</p>
                          </div>

                          {currentUser && (
                            <div className="flex items-center gap-4 text-sm text-[#454545]">
                              {!hasUpvoted ? (
                                <button
                                  onClick={() => upvoteCommentMutation.mutate(comment.id)}
                                  disabled={upvoteCommentMutation.isPending}
                                  className="hover:text-[#BF1E2E] transition-colors"
                                >
                                  Mark as helpful
                                </button>
                              ) : (
                                <span className="text-green-600">You found this helpful</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <div className="text-center py-12 bg-[#F8F9FA] rounded-lg border-2 border-dashed border-[#E7E7E7]">
                    <MessageCircle className="w-12 h-12 text-[#454545] mx-auto mb-3" />
                    <p className="text-[#454545] font-medium mb-2">No answers yet</p>
                    <p className="text-[#454545] text-sm mb-4">Be the first to help answer this question</p>
                    {currentUser && (
                      <Button onClick={() => setShowCommentForm(true)} className="bg-[#272262] hover:bg-[#3d3680] text-white">
                        Write an Answer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Enhanced Sidebar - MOBILE: Stack below on mobile */}
          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Question Stats */}
            <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
              <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#BF1E2E]" />
                Question Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#454545]">Published:</span>
                  <span className="font-medium text-[#272262]">
                    {new Date(post.published_date || post.created_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#454545]">Last Activity:</span>
                  <span className="font-medium text-[#272262]">
                    {new Date(post.last_activity_date || post.created_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#454545]">Viewed:</span>
                  <span className="font-bold text-[#272262]">{post.view_count || 0} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#454545]">Helpful votes:</span>
                  <span className="font-bold text-green-600">{post.upvote_count || 0}</span>
                </div>
                {post.followers_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#454545]">Followers:</span>
                    <span className="font-bold text-purple-600">{post.followers_count}</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
                <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#BF1E2E]" />
                  In This Article
                </h3>
                <nav className="space-y-1">
                  {tableOfContents.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToHeading(item.id)}
                      className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
                        item.level === 'h2' ? 'font-bold text-base' : 'font-semibold text-sm pl-6'
                      } ${
                        activeHeading === item.text
                          ? 'bg-[#F8F9FA] text-[#272262] border border-[#E7E7E7]'
                          : 'text-[#454545] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </GlassCard>
            )}

            {/* Author Card */}
            <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
              <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#BF1E2E]" />
                Written By
              </h3>
              <Link href={getContributorUrl(post.author_email, post.author_name)}>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0 relative">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{post.author_name?.charAt(0) || 'U'}</span>
                    )}
                    {authorReputation && authorReputation.reputation_points > 100 && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                        <Shield className="w-3 h-3 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-[#272262]">{post.author_name}</div>
                    <div className="text-xs text-[#454545] mt-1">View Profile <ChevronRight className="w-3 h-3 inline ml-1" /></div>
                  </div>
                </div>
              </Link>
            </GlassCard>

            {/* Related Questions */}
            {relatedPosts.length > 0 && (
              <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
                <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#BF1E2E]" />
                  Related Questions
                </h3>
                <div className="space-y-3">
                  {relatedPosts.map(related => (
                    <Link key={related.id} href={createPageUrl("KnowledgePost") + `?slug=${related.slug}`}> {/* Changed to use slug */}
                      <div className="p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#E7E7E7]">
                        <h4 className="font-medium text-[#272262] text-sm mb-2 line-clamp-2">{related.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-[#454545]">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {related.upvote_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {related.comment_count || 0}
                          </span>
                          {related.has_accepted_answer && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Solved
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Quick Links */}
            <GlassCard className="p-6 bg-white border border-[#E7E7E7] mb-[10px]">
              <h3 className="text-lg font-bold text-[#272262] mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Link href={createPageUrl('KnowledgeHub')}>
                  <Button variant="outline" className="w-full justify-start border-[#E7E7E7] hover:bg-[#F8F9FA]" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse All Articles
                  </Button>
                </Link>
                <Link href={createPageUrl('Contact')}>
                  <Button variant="outline" className="w-full justify-start border-[#E7E7E7] hover:bg-[#F8F9FA]" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
