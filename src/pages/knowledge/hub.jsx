// Knowledge Hub client-side page (rich interactive version below).
// NOTE: The older static getStaticProps version was removed to avoid duplicate exports.

import React, { useState } from 'react';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Search, TrendingUp, Users, BookOpen, MessageCircle, Plus, Filter, Loader2, ChevronLeft, ChevronRight, Layers, CheckCircle, ThumbsUp, Eye, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '../../components/GlassCard';
import { toast } from 'sonner';

// Note: removed getStaticProps that returned notFound so this page can be rendered
export default function KnowledgeHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, answered, unanswered, trending
  const [currentPage, setCurrentPage] = useState(1);
  const [aiSearchResults, setAiSearchResults] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [blogFormData, setBlogFormData] = useState({ title: '', excerpt: '', content: '', category_id: '', tags: '', difficulty_level: 'Beginner' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const postsPerPage = 10;

  const queryClient = useQueryClient();

  // Read category from URL on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const tagParam = urlParams.get('tag');
    const qParam = urlParams.get('q');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (tagParam) {
      setSelectedTags([decodeURIComponent(tagParam)]);
    }
    
    if (qParam) {
      setSearchQuery(decodeURIComponent(qParam));
    }
  }, []); // Run only on mount

  const { data: categories = [] } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('KnowledgeCategory').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data || [];
    }
  });

  const addCategory = async () => {
    const name = (newCategoryName || '').trim();
    if (!name) return toast.error('Please enter a category name');
    try {
      const res = await fetch('/api/admin/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add category');
      const data = json.data;
      setNewCategoryName('');
      // Invalidate and then refetch so the UI has the latest categories immediately
      await queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      await queryClient.refetchQueries({ queryKey: ['knowledge-categories'] });
      if (data?.id) setBlogFormData(prev => ({ ...prev, category_id: data.id }));
      toast.success('Category "' + name + '" created successfully!');
    } catch (e) {
      console.error('Failed to add category', e);
      toast.error('Failed to add category: ' + (e?.message || e));
    }
  };

  const { data: popularPosts = [] } = useQuery({
    queryKey: ['knowledge-popular'],
    queryFn: async () => {
      // Use the canonical `knowledge` table and published flag
      const { data, error } = await supabase.from('knowledge').select('*').eq('published', true).order('published_at', { ascending: false }).limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['knowledge-all-posts'],
    queryFn: async () => {
      // Use the canonical `knowledge` table and published flag
      const { data, error } = await supabase.from('knowledge').select('*').eq('published', true).order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: topContributors = [] } = useQuery({
    queryKey: ['top-contributors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contributorapplications').select('*').eq('profile_visible', true).eq('subscription_active', true).in('role', ['contributor', 'moderator', 'admin']).order('post_count', { ascending: false }).limit(6);
      if (error) throw error;
      return (data || []).filter(p => (p.post_count || 0) > 0);
    }
  });

  // Get trending questions - IMPROVED ALGORITHM with higher weight for comments
  const { data: trendingPosts = [] } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get all approved posts from Supabase
  const { data: posts, error } = await supabase.from('knowledge').select('*').eq('published', true).order('published_at', { ascending: false });
      if (error) throw error;
      
      // Calculate trending score with heavy weight on comments
      const scoredPosts = posts.map(post => {
        const postDate = new Date(post.last_activity_date || post.published_date || post.created_date);
        const isRecent = postDate >= sevenDaysAgo;
        
        if (!isRecent) {
          return { ...post, calculatedTrendingScore: 0 };
        }
        
        // Comments are worth MUCH more than views
        const commentScore = (post.comment_count || 0) * 50; // 50 points per comment
        const upvoteScore = (post.upvote_count || 0) * 10; // 10 points per upvote
        const viewScore = (post.view_count || 0) * 0.5; // 0.5 points per view
        const hasAnswerBonus = post.has_accepted_answer ? 20 : 0; // Bonus for having accepted answer
        
        const totalScore = commentScore + upvoteScore + viewScore + hasAnswerBonus;
        
        return { ...post, calculatedTrendingScore: totalScore };
      });
      
      // Sort by calculated score and return top 5
      return scoredPosts
        .filter(p => p.calculatedTrendingScore > 0)
        .sort((a, b) => b.calculatedTrendingScore - a.calculatedTrendingScore)
        .slice(0, 5);
    }
  });

  // Get REAL unanswered questions count (no comments AND no accepted answer)
  const unansweredCount = React.useMemo(() => {
    return allPosts.filter(p =>
      !p.has_accepted_answer && (p.comment_count || 0) === 0
    ).length;
  }, [allPosts]);

  // Extract all unique tags - SORTED BY USAGE COUNT
  const allTags = React.useMemo(() => {
    const tagCounts = {};
    allPosts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    // Sort by usage count (descending)
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [allPosts]);

  // Calculate real-time category post counts
  const categoriesWithCounts = React.useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      realPostCount: allPosts.filter(post => post.category_id === cat.id).length
    }));
  }, [categories, allPosts]);

  const { user: currentUser, profile: appProfile } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', currentUser?.email],
    queryFn: async () => {
      const { data, error } = await supabase.from('contributorapplications').select('*').eq('user_email', currentUser.email).limit(1);
      if (error) throw error;
      return (data && data[0]) || null;
    },
    enabled: !!currentUser?.email,
  });

  const aiSearchMutation = useMutation({
    mutationFn: async (query) => {
      // Fallback search: simple ilike on title and excerpt
      const q = query.trim();
      const { data, error } = await supabase.from('knowledge')
        .select('*')
        // Search title and summary/content fields; summary is the known column
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
        .limit(50);
      if (error) throw error;
      return { results: data };
    },
    onSuccess: (data) => {
      setAiSearchResults(data.results || []);
      setCurrentPage(1);
    }
  });

  // Create blog post mutation
  const createBlogMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email) throw new Error('Must be logged in');
      if (!blogFormData.title.trim() || !blogFormData.excerpt.trim() || !blogFormData.content.trim()) {
        throw new Error('Title, excerpt, and content are required');
      }
      if (!blogFormData.category_id) throw new Error('Category is required');

      const tagsArray = blogFormData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const slug = blogFormData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100) + '-' + Date.now();

      const { data, error } = await supabase.from('knowledge').insert([
        {
          title: blogFormData.title,
          excerpt: blogFormData.excerpt,
          summary: blogFormData.excerpt,
          content: blogFormData.content,
          slug: slug,
          category_id: blogFormData.category_id,
          tags: tagsArray,
          author_email: currentUser.email,
          author_name: userProfile?.full_name || currentUser.email.split('@')[0],
          difficulty_level: blogFormData.difficulty_level,
          published: true,
          published_at: new Date().toISOString(),
          view_count: 0,
          upvote_count: 0,
          comment_count: 0,
          has_accepted_answer: false,
          featured: false
        }
      ]).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-popular'] });
      queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
      setShowWriteModal(false);
      setBlogFormData({ title: '', excerpt: '', content: '', category_id: '', tags: '', difficulty_level: 'Beginner' });
      toast.success('Article published successfully! Your post is now live.');
    },
    onError: (error) => {
      toast.error('Error creating blog: ' + error.message);
    }
  });

  const handleSearch = () => {
    if (searchQuery.trim().length < 3) {
      setAiSearchResults(null); // Clear previous AI results if query is too short
      return;
    }
    aiSearchMutation.mutate(searchQuery.trim());
  };

  // Add schema.org structured data to head for homepage
  React.useEffect(() => {
    // Only proceed if we have data to populate the schema
    if (trendingPosts.length > 0 || popularPosts.length > 0) {
      // Combine and deduplicate posts for FAQ schema, limit to top N
      const uniquePosts = new Map();
      [...(trendingPosts || []).slice(0, 5), ...(popularPosts || []).slice(0, 5)].forEach(post => {
        if (post.id && !uniquePosts.has(post.id)) {
          uniquePosts.set(post.id, post);
        }
      });
      const questions = Array.from(uniquePosts.values());
      
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": questions.map(post => {
          const questionData = {
            "@type": "Question",
            "name": post.title,
            "answerCount": post.comment_count || 0,
            "upvoteCount": post.upvote_count || 0,
            "dateCreated": post.published_date || post.created_date,
            "author": {
              "@type": "Person",
              "name": post.author_name || "Community Contributor"
            },
            "acceptedAnswer": {
              "@type": "Answer",
              "text": post.excerpt,
              "dateCreated": post.last_activity_date || post.published_date,
              "upvoteCount": post.upvote_count || 0
            }
          };
          return questionData;
        })
      };

      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Thai Nexus Knowledge Hub",
        "url": "https://visa.thainexus.co.th/knowledgehub",
        "description": "Community-powered Thailand visa knowledge base with expert guides and Q&A",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://visa.thainexus.co.th/knowledgehub?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      };

      const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Thailand Visa Questions & Answers",
        "description": "Comprehensive collection of Thailand visa questions answered by community experts",
        "url": "https://visa.thainexus.co.th/knowledgehub",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Thai Nexus",
          "url": "https://visa.thainexus.co.th"
        }
      };

      const combinedSchema = {
        "@context": "https://schema.org",
        "@graph": [websiteSchema, collectionSchema, faqSchema]
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(combinedSchema);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [trendingPosts, popularPosts]);

  const canContribute = userProfile && ['contributor', 'moderator', 'admin'].includes(userProfile.role) && userProfile.subscription_active;
  const canModerate = userProfile && ['moderator', 'admin'].includes(userProfile.role);

  // Enhanced filtering and sorting
  const filteredAndSortedPosts = React.useMemo(() => {
    // Start with AI search results if available, otherwise all posts
    let currentPosts = aiSearchResults ? aiSearchResults : allPosts;

    // Filter by category
    if (selectedCategory !== 'all') {
      currentPosts = currentPosts.filter(post => post.category_id === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      currentPosts = currentPosts.filter(post =>
        post.tags && Array.isArray(post.tags) && post.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Sort
    const sorted = [...currentPosts].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.upvote_count || 0) - (a.upvote_count || 0);
        case 'answered':
          // Prioritize posts with accepted answers, then by comment count
          if (a.has_accepted_answer && !b.has_accepted_answer) return -1;
          if (!a.has_accepted_answer && b.has_accepted_answer) return 1;
          return (b.comment_count || 0) - (a.comment_count || 0);
        case 'unanswered':
          // Prioritize posts without an accepted answer AND no comments
          const aIsUnanswered = !a.has_accepted_answer && (a.comment_count || 0) === 0;
          const bIsUnanswered = !b.has_accepted_answer && (b.comment_count || 0) === 0;

          if (aIsUnanswered && !bIsUnanswered) return -1;
          if (!aIsUnanswered && bIsUnanswered) return 1;

          // If both are unanswered or both are answered, sort by recency (latest activity)
          const dateA_unanswered = new Date(a.last_activity_date || a.published_date || a.created_date).getTime();
          const dateB_unanswered = new Date(b.last_activity_date || b.published_date || b.created_date).getTime();
          return dateB_unanswered - dateA_unanswered;
        case 'trending':
          // For 'trending' sort, use the calculated trending score from the useQuery
          const trendingPostA = trendingPosts.find(p => p.id === a.id);
          const trendingPostB = trendingPosts.find(p => p.id === b.id);
          const scoreA = trendingPostA?.calculatedTrendingScore || 0;
          const scoreB = trendingPostB?.calculatedTrendingScore || 0;
          return scoreB - scoreA;
        case 'recent':
        default:
          const dateA_recent = new Date(a.last_activity_date || a.published_date || a.created_date).getTime();
          const dateB_recent = new Date(b.last_activity_date || b.published_date || b.created_date).getTime();
          return dateB_recent - dateA_recent;
      }
    });

    return sorted;
  }, [allPosts, aiSearchResults, selectedCategory, selectedTags, sortBy, trendingPosts]);

  const displayPosts = filteredAndSortedPosts;

  const totalPages = Math.ceil(displayPosts.length / postsPerPage);
  const paginatedPosts = displayPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Reset to page 1 when filters or search query change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTags, sortBy, searchQuery, aiSearchResults]); // Added aiSearchResults to dependencies

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Upvote post mutation with new anti-spam system
  const upvotePostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!currentUser) {
        console.warn("User must be logged in to upvote.");
        return;
      }

      // Check if already upvoted using Supabase PostUpvote table
      const { data: existing, error: existingErr } = await supabase.from('PostUpvote').select('*').eq('post_id', postId).eq('user_email', currentUser.email).limit(1);
      if (existingErr) throw existingErr;

      if (existing && existing.length > 0) {
        // remove vote
        const { error: delErr } = await supabase.from('PostUpvote').delete().match({ id: existing[0].id });
        if (delErr) throw delErr;
        // decrement upvote_count on post (best-effort)
        try {
          const { data: postRow, error: postErr } = await supabase.from('knowledge').select('upvote_count').eq('id', postId).single();
          if (!postErr) {
            const newCount = Math.max(0, (postRow?.upvote_count || 0) - 1);
            await supabase.from('knowledge').update({ upvote_count: newCount }).eq('id', postId);
          }
        } catch (e) {
          // ignore best-effort update errors
        }
        return { action: 'removed' };
      } else {
        // add vote
        const { data: inserted, error: insErr } = await supabase.from('PostUpvote').insert({ post_id: postId, user_email: currentUser.email, created_at: new Date().toISOString() }).select().limit(1);
        if (insErr) throw insErr;
        // increment upvote_count on post (best-effort)
        try {
          const { data: postRow2, error: postErr2 } = await supabase.from('knowledge').select('upvote_count').eq('id', postId).single();
          if (!postErr2) {
            const newCount2 = (postRow2?.upvote_count || 0) + 1;
            await supabase.from('knowledge').update({ upvote_count: newCount2 }).eq('id', postId);
          }
        } catch (e) {}
        return { action: 'added', record: inserted?.[0] };
      }
    },
    onSuccess: (data) => {
      // Silently handle - errors will show via toast
      queryClient.invalidateQueries({ queryKey: ['knowledge-all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-popular'] });
      queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
    },
    onError: (error) => {
      console.error("Error upvoting post:", error);
      // Error notification will be shown by the function response
    }
  });

  // Helper function to get contributor URL - prefers slug, then id, fallback to email
  const getContributorUrl = (contributor) => {
    if (contributor.profile_slug) {
      return createPageUrl("KnowledgeContributor") + `?slug=${contributor.profile_slug}`;
    } else if (contributor.id) {
      return createPageUrl("KnowledgeContributor") + `?id=${contributor.id}`;
    } else {
      return createPageUrl("KnowledgeContributor") + `?email=${contributor.user_email}`;
    }
  };

  // Reset all filters and go back to initial view
  const resetToInitialView = () => {
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('recent');
    setAiSearchResults(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Header with more visual interest */}
      <div className="relative overflow-hidden rounded-3xl mb-8 min-h-[400px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262]">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating animated elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-element" style={{ left: '10%', top: '20%', animationDelay: '0s' }}>
            <BookOpen className="w-12 h-12 text-white/20" />
          </div>
          <div className="floating-element" style={{ left: '85%', top: '30%', animationDelay: '2s' }}>
            <MessageCircle className="w-10 h-10 text-white/20" />
          </div>
          <div className="floating-element" style={{ left: '70%', top: '70%', animationDelay: '4s' }}>
            <Users className="w-8 h-8 text-white/20" />
          </div>
        </div>

        <style>{`
          @keyframes float-element {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
            50% { transform: translateY(-30px) rotate(5deg); opacity: 0.4; }
          }
          .floating-element {
            position: absolute;
            animation: float-element 6s ease-in-out infinite;
          }
        `}</style>

        <div className="relative z-10 w-full px-6 md:px-12 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 shadow-xl">
            <BookOpen className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Community Knowledge Base</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Thailand Visa Knowledge Hub
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Real expat experiences, detailed guides, and community-powered Q&A for all Thailand visa questions
          </p>

          {/* AI Search Bar - MOBILE OPTIMIZED */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-black w-4 h-4 md:w-5 md:h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ask any visa question..."
                  className="pl-10 md:pl-12 h-14 md:h-16 text-lg md:text-md border border-white/30 bg-white/95 backdrop-blur-sm placeholder:text-gray-400 "
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={aiSearchMutation.isPending || searchQuery.trim().length < 3}
                className="bg-[#BF1E2E] hover:bg-[#9d1825] h-14 md:h-16 px-6 md:px-10 text-base md:text-lg font-bold shadow-xl"
              >
                {aiSearchMutation.isPending ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
            {aiSearchResults && (
              <div className="mt-4 text-white/90 text-sm">
                Found {aiSearchResults.length} relevant article{aiSearchResults.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {canContribute && (
              <Link href={createPageUrl("KnowledgePost") + "?new=true"}>
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 font-bold">
                  <Plus className="w-5 h-5 mr-2" />
                  Write Article
                </Button>
              </Link>
            )}
            {canModerate && (
              <Link href={createPageUrl("AdminKnowledge")}>
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 font-bold">
                  <Filter className="w-5 h-5 mr-2" />
                  Moderate Content
                </Button>
              </Link>
            )}
            {!currentUser && (
              <Link href={createPageUrl("login")}>
                <Button className="bg-white hover:bg-white/90 text-[#272262] font-bold shadow-xl">
                  <Users className="w-5 h-5 mr-2" />
                  Sign In to Write
                </Button>
              </Link>
            )}
            {currentUser && !canContribute && (
              <Link href={createPageUrl("BecomeContributor")}>
                <Button className="bg-white hover:bg-white/90 text-[#272262] font-bold shadow-xl">
                  <Users className="w-5 h-5 mr-2" />
                  Become Contributor
                </Button>
              </Link>
            )}
          </div>

          {/* Write Blog Modal */}
          {showWriteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <GlassCard className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-[#E7E7E7] rounded-2xl">
                <div className="p-6 md:p-8 border-b border-[#E7E7E7]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-[#272262]">Write a Blog Post</h2>
                    <button
                      onClick={() => setShowWriteModal(false)}
                      className="text-[#454545] hover:text-[#272262] text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 md:p-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Title *</label>
                      <Input
                        value={blogFormData.title}
                        onChange={(e) => setBlogFormData({ ...blogFormData, title: e.target.value })}
                        placeholder="Your blog post title"
                        className="border-[#E7E7E7]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Excerpt *</label>
                      <Input
                        value={blogFormData.excerpt}
                        onChange={(e) => setBlogFormData({ ...blogFormData, excerpt: e.target.value })}
                        placeholder="Brief summary (50-100 words)"
                        className="border-[#E7E7E7]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Category *</label>
                      <Select value={blogFormData.category_id} onValueChange={(val) => setBlogFormData({ ...blogFormData, category_id: val })}>
                        <SelectTrigger className="border-[#E7E7E7]">
                          <SelectValue placeholder="Select a category">
                            {blogFormData.category_id ? categories.find(cat => cat.id === blogFormData.category_id)?.name : 'Select a category'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-51">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        {appProfile?.role === 'admin' && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Add new category"
                              className="flex-1"
                            />
                            <Button onClick={addCategory} disabled={!newCategoryName.trim()} className="bg-[#272262] text-white">
                              Add
                            </Button>
                          </div>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Difficulty Level</label>
                      <Select value={blogFormData.difficulty_level} onValueChange={(val) => setBlogFormData({ ...blogFormData, difficulty_level: val })}>
                        <SelectTrigger className="border-[#E7E7E7]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Content *</label>
                      <textarea
                        value={blogFormData.content}
                        onChange={(e) => setBlogFormData({ ...blogFormData, content: e.target.value })}
                        placeholder="Your detailed blog content..."
                        rows={8}
                        className="w-full p-3 border border-[#E7E7E7] text-black rounded-lg focus:outline-none focus:border-[#272262]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#272262] mb-2">Tags</label>
                      <Input
                        value={blogFormData.tags}
                        onChange={(e) => setBlogFormData({ ...blogFormData, tags: e.target.value })}
                        placeholder="Separate tags with commas (e.g., visa, retirement, visa-application)"
                        className="border-[#E7E7E7]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 md:p-8 border-t border-[#E7E7E7]">
                  <Button
                    onClick={() => createBlogMutation.mutate()}
                    disabled={createBlogMutation.isPending}
                    className="flex-1 bg-[#272262] hover:bg-[#3d3680] text-white font-bold py-3"
                  >
                    {createBlogMutation.isPending ? 'Publishing...' : 'Publish Blog'}
                  </Button>
                  <Button
                    onClick={() => setShowWriteModal(false)}
                    variant="outline"
                    className="flex-1 border-[#E7E7E7] text-[#272262] font-bold py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content - 9 columns */}
        <div className="lg:col-span-9 space-y-8">
          {/* Stats Bar - REMOVED "Needs Answer" CARD */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={resetToInitialView}
              className="text-left hover:scale-105 transition-transform"
            >
              <GlassCard className="p-6 text-center bg-white border border-[#E7E7E7] hover:border-[#272262]">
                <div className="text-4xl font-bold text-[#272262] mb-2">{allPosts.length}</div>
                <div className="text-sm text-[#454545] font-medium">Total Questions</div>
              </GlassCard>
            </button>
            <GlassCard className="p-6 text-center bg-white border border-[#E7E7E7] hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-[#272262] mb-2">{topContributors.length}</div>
              <div className="text-sm text-[#454545] font-medium">Active Experts</div>
            </GlassCard>
          </div>

          {/* Popular Tags */}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#BF1E2E]" />
                Popular Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 15).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                      selectedTags.includes(tag)
                        ? 'bg-[#272262] text-white shadow-lg'
                        : 'bg-white text-[#454545] hover:bg-[#F8F9FA] border border-[#E7E7E7]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  onClick={() => setSelectedTags([])}
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-[#BF1E2E] hover:text-[#9d1825]"
                >
                  Clear tags
                </Button>
              )}
            </div>
          )}

          {/* All Posts with Enhanced Filters */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-[#272262]">
                {aiSearchResults ? 'Search Results' :
                 sortBy === 'unanswered' ? 'Unanswered Questions' :
                 sortBy === 'trending' ? 'Trending Questions' :
                 'All Questions'}
              </h2>

              <div className="flex gap-2">
                {!aiSearchResults && (
                  <>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 border-[#E7E7E7]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="trending">Trending Now</SelectItem>
                        <SelectItem value="answered">Best Answered</SelectItem>
                        <SelectItem value="unanswered">Needs Answer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 border-[#E7E7E7]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categoriesWithCounts.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.realPostCount || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>

            {aiSearchResults && (
              <Button
                onClick={() => {
                  setAiSearchResults(null);
                  setSearchQuery('');
                }}
                variant="outline"
                size="sm"
                className="mb-4 border-[#272262] text-[#272262]"
              >
                Clear Search
              </Button>
            )}

            <div className="space-y-4">
              {paginatedPosts.map(post => {
                const category = categories.find(c => c.id === post.category_id);

                return (
                  <GlassCard key={post.id} className="p-6 bg-white border border-[#E7E7E7] hover:border-[#272262] transition-all">
                    <div className="flex items-start gap-4">
                      {/* Vote/Stats Column */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px] text-center">
                        {currentUser ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              upvotePostMutation.mutate(post.id);
                            }}
                            disabled={upvotePostMutation.isPending}
                            className="flex flex-col items-center p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                          >
                            <ThumbsUp className="w-5 h-5 text-[#454545] hover:text-[#BF1E2E]" />
                            <div className="text-2xl font-bold text-[#272262] mt-1">{post.upvote_count || 0}</div>
                            <div className="text-xs text-[#454545]">votes</div>
                          </button>
                        ) : (
                          <div className="text-center">
                            <ThumbsUp className="w-5 h-5 text-[#454545] mx-auto" />
                            <div className="text-2xl font-bold text-[#272262] mt-1">{post.upvote_count || 0}</div>
                            <div className="text-xs text-[#454545]">votes</div>
                          </div>
                        )}
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          post.has_accepted_answer ? 'bg-green-100 text-green-700' :
                          post.comment_count > 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-[#F8F9FA] text-[#454545]'
                        }`}>
                          {post.comment_count || 0} answer{post.comment_count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-[#454545] text-center">
                          {post.view_count || 0}<br/>views
                        </div>
                      </div>

                      {/* Content Column */}
                      <Link href={`/knowledge/${post.slug}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {category && (
                            <span className="px-2 py-1 rounded-md bg-[#272262] text-white text-xs font-medium">
                              {category.name}
                            </span>
                          )}
                          {post.has_accepted_answer && (
                            <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Solved
                            </span>
                          )}
                          {post.featured && (
                            <span className="px-2 py-1 rounded-md bg-[#BF1E2E] text-white text-xs font-bold">
                              Featured
                            </span>
                          )}
                          {post.difficulty_level && (
                            <span className="px-2 py-1 rounded-md bg-[#F8F9FA] text-[#454545] text-xs border border-[#E7E7E7]">
                              {post.difficulty_level}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-[#272262] mb-2 hover:text-[#BF1E2E] line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-[#454545] text-sm mb-3 line-clamp-2">{post.excerpt}</p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.tags.slice(0, 5).map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded bg-[#F8F9FA] text-[#454545] text-xs border border-[#E7E7E7]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-[#454545]">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author_name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(() => {
                              const date = new Date(post.last_activity_date || post.published_date || post.created_date);
                              const now = new Date();
                              const diffMs = now.getTime() - date.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMs / 3600000);
                              const diffDays = Math.floor(diffMs / 86400000);

                              if (diffMins < 60) return `${diffMins}m ago`;
                              if (diffHours < 24) return `${diffHours}h ago`;
                              if (diffDays < 7) return `${diffDays}d ago`;
                              return date.toLocaleDateString();
                            })()}
                          </span>
                        </div>
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Pagination - NAVY COLOR */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={currentPage === pageNum ? 'bg-[#272262] text-white hover:bg-[#3d3680]' : 'border-[#E7E7E7] hover:bg-[#F8F9FA]'}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {paginatedPosts.length === 0 && (
              <GlassCard className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {sortBy === 'unanswered' ? 'All questions have been answered!' : 'No questions found'}
                </p>
                {canContribute && (
                  <Link href={createPageUrl("knowledge") + "?new=true"}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Ask First Question
                    </Button>
                  </Link>
                )}
              </GlassCard>
            )}
          </div>

           {/* Popular Posts */}
          {!aiSearchResults && sortBy !== 'unanswered' && sortBy !== 'trending' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#272262] flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-[#BF1E2E]" />
                  Popular Questions
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {popularPosts.slice(0, 4).map(post => {
                  const category = categories.find(c => c.id === post.category_id);
                  return (
                    <Link key={post.id} href={`/knowledge/${post.slug}`}>
                      <GlassCard className="p-6 bg-white border border-[#E7E7E7] hover:border-[#272262] hover:scale-105 transition-all">
                        {category && (
                          <span className="inline-block px-3 py-1 rounded-full bg-[#272262] text-white text-xs font-bold mb-3">
                            {category.name}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-[#272262] mb-3 hover:text-[#BF1E2E] line-clamp-2">{post.title}</h3>
                        <p className="text-[#454545] text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-[#454545]">
                          <span className="font-medium">{post.view_count || 0} views</span>
                          <span>•</span>
                          <span className="font-medium">{post.comment_count || 0} comments</span>
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Categories */}
          {categoriesWithCounts.length > 0 && (
            <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
              <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#BF1E2E]" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#272262] text-white font-bold shadow-lg'
                      : 'hover:bg-[#F8F9FA] text-[#454545] border border-[#E7E7E7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Categories</span>
                    <span className="text-xs">{allPosts.length}</span>
                  </div>
                </button>
                {categoriesWithCounts.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#272262] text-white font-bold shadow-lg'
                        : 'hover:bg-[#F8F9FA] text-[#454545] border border-[#E7E7E7]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-xs">{cat.realPostCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Trending Questions */}
          <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
            <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#BF1E2E]" />
              Trending Questions
            </h3>
            <div className="space-y-3">
              {trendingPosts.length > 0 ? (
                trendingPosts.map(post => (
                  <Link key={post.id} href={`/knowledge/${post.slug}`}>
                    <div className="p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#E7E7E7]">
                      <h4 className="font-medium text-[#272262] text-sm mb-2 line-clamp-2">{post.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-[#454545]">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-[#BF1E2E]" />
                          <strong>{post.comment_count || 0}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.upvote_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.view_count || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[#454545] text-center py-4">No trending questions yet</p>
              )}
            </div>
          </GlassCard>

          {/* Top Contributors */}
          <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
            <h3 className="text-lg font-bold text-[#272262] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#BF1E2E]" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {topContributors.length > 0 ? (
                topContributors.map(contributor => {
                  const realPostCount = allPosts.filter(post => post.author_email === contributor.user_email).length;

                  return (
                    <Link
                      key={contributor.id}
                      href={getContributorUrl(contributor)}
                      className="block hover:bg-[#F8F9FA] p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#272262] to-[#BF1E2E] flex items-center justify-center shrink-0">
                          {contributor.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={contributor.avatar_url} alt={contributor.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-bold">{contributor.full_name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#272262] text-sm truncate">{contributor.full_name}</div>
                          <div className="text-xs text-[#454545]">{realPostCount} article{realPostCount !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-[#454545] text-center py-4">No contributors yet</p>
              )}
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6 bg-linear-to-br from-[#F8F9FA] via-white to-[#F1F1F1] border border-[#E7E7E7]">
            <h3 className="text-lg font-bold text-[#272262] mb-4">Community Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#454545]">Questions Today:</span>
                <span className="font-bold text-[#272262]">
                  {allPosts.filter(p => {
                    const today = new Date();
                    const postDate = new Date(p.published_date || p.created_date);
                    return today.toDateString() === postDate.toDateString();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454545]">Answer Rate:</span>
                <span className="font-bold text-green-600">
                  {allPosts.length > 0 ?
                    Math.round((allPosts.filter(p => p.has_accepted_answer).length / allPosts.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454545]">Avg Response Time:</span>
                <span className="font-bold text-[#BF1E2E]">&lt; 2 hours</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
