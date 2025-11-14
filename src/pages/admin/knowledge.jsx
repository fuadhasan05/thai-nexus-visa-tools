
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle, XCircle, Clock, Search, Eye, Edit,
  Users, FileText, MessageCircle, History, Trash2, GitMerge
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';

export const getStaticProps = async () => {
  return {
    notFound: true,
  };
};
export default function AdminKnowledge() {
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const { addError, addSuccess } = useError();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null; // Ensure email exists before querying
      const profiles = await base44.entities.ContributorProfile.filter({ user_email: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
    staleTime: Infinity, // Profile data for role check doesn't change often
    cacheTime: Infinity,
  });

  // STRICT CHECK: Only admin (User.role) and moderator (ContributorProfile.role) can moderate
  // Contributors (ContributorProfile.role = 'contributor') CANNOT access this page
  const canModerate = currentUser?.role === 'admin' || (userProfile && userProfile.role === 'moderator');

  // Redirect non-moderators (including contributors)
  React.useEffect(() => {
    if (currentUser && userProfile && !canModerate) {
      addError('Access restricted: Only admins and moderators can access the moderation panel.');
      window.location.href = createPageUrl('KnowledgeHub');
    }
  }, [currentUser, canModerate, userProfile, addError]);

  // Fetch pending posts
  const { data: pendingPosts = [] } = useQuery({
    queryKey: ['admin-pending-posts'],
    queryFn: () => base44.entities.KnowledgePost.filter({ status: 'pending_moderation' }, '-created_date'),
    enabled: canModerate,
  });

  // Fetch all posts
  const { data: allPosts = [] } = useQuery({
    queryKey: ['admin-all-posts'],
    queryFn: () => base44.entities.KnowledgePost.list('-created_date'),
    enabled: canModerate,
  });

  // Fetch pending comments
  const { data: pendingComments = [] } = useQuery({
    queryKey: ['admin-pending-comments'],
    queryFn: () => base44.entities.KnowledgeComment.filter({ status: 'pending' }, '-created_date'),
    enabled: canModerate,
  });

  // Fetch edit suggestions
  const { data: editSuggestions = [] } = useQuery({
    queryKey: ['admin-edit-suggestions'],
    queryFn: () => base44.entities.KnowledgeEditSuggestion.filter({ status: 'pending' }, '-created_date'),
    enabled: canModerate,
  });

  // Fetch contributor applications
  const { data: applications = [] } = useQuery({
    queryKey: ['admin-contributor-applications'],
    queryFn: () => base44.entities.ContributorProfile.filter({ contributor_status: 'pending_approval' }, '-application_date'),
    enabled: canModerate,
  });

  // Approve post mutation with category counter update
  const approvePostMutation = useMutation({
    mutationFn: async (postId) => {
      const posts = await base44.entities.KnowledgePost.filter({ id: postId });
      const post = posts[0];

      await base44.entities.KnowledgePost.update(postId, {
        status: 'approved',
        published_date: new Date().toISOString()
      });

      // Update category post_count
      if (post.category_id) {
        const categories = await base44.entities.KnowledgeCategory.filter({ id: post.category_id });
        if (categories.length > 0) {
          const category = categories[0];
          await base44.entities.KnowledgeCategory.update(post.category_id, {
            post_count: (category.post_count || 0) + 1
          });
        }
      }

      // Update contributor post_count
      if (post.author_email) { // Added check for author_email
        const profiles = await base44.entities.ContributorProfile.filter({ user_email: post.author_email });
        if (profiles.length > 0) {
          const profile = profiles[0];
          await base44.entities.ContributorProfile.update(profile.id, {
            post_count: (profile.post_count || 0) + 1
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      queryClient.invalidateQueries({ queryKey: ['top-contributors'] });
      addSuccess('Post approved!');
      setSelectedItem(null);
    }
  });

  // Reject post mutation
  const rejectPostMutation = useMutation({
    mutationFn: async ({ postId, notes }) => {
      await base44.entities.KnowledgePost.update(postId, {
        status: 'rejected',
        moderation_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-posts'] });
      addSuccess('Post rejected');
      setSelectedItem(null);
    }
  });

  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.KnowledgeComment.update(commentId, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-comments'] });
      addSuccess('Comment approved!');
    }
  });

  // Reject comment mutation
  const rejectCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.KnowledgeComment.update(commentId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-comments'] });
      addSuccess('Comment rejected');
    }
  });

  // Approve edit suggestion mutation
  const approveEditMutation = useMutation({
    mutationFn: async (suggestion) => {
      // Get current post
      const posts = await base44.entities.KnowledgePost.filter({ id: suggestion.post_id });
      const post = posts[0];

      // Get current version number
      const versions = await base44.entities.KnowledgePostVersion.filter({ post_id: suggestion.post_id }, '-version_number');
      const newVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Update post
      await base44.entities.KnowledgePost.update(suggestion.post_id, {
        title: suggestion.suggested_title || post.title,
        content: suggestion.suggested_content,
        excerpt: suggestion.suggested_excerpt || post.excerpt,
        last_edited_date: new Date().toISOString()
      });

      // Create new version
      await base44.entities.KnowledgePostVersion.create({
        post_id: suggestion.post_id,
        version_number: newVersionNumber,
        title: suggestion.suggested_title || post.title,
        content: suggestion.suggested_content,
        excerpt: suggestion.suggested_excerpt || post.excerpt,
        editor_email: suggestion.suggester_email,
        editor_name: suggestion.suggester_name,
        edit_summary: suggestion.edit_summary,
        change_type: suggestion.edit_type
      });

      // Update suggestion status
      await base44.entities.KnowledgeEditSuggestion.update(suggestion.id, {
        status: 'approved',
        merged_as_version: newVersionNumber,
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-edit-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-post'] });
      addSuccess('Edit suggestion approved and merged!');
    },
    onError: (error) => {
      addError('Failed to approve edit: ' + error.message);
    }
  });

  // Reject edit suggestion
  const rejectEditMutation = useMutation({
    mutationFn: async ({ suggestionId, notes }) => {
      await base44.entities.KnowledgeEditSuggestion.update(suggestionId, {
        status: 'rejected',
        reviewer_notes: notes,
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-edit-suggestions'] });
      addSuccess('Edit suggestion rejected');
    }
  });

  // Approve contributor application
  const approveApplicationMutation = useMutation({
    mutationFn: (profileId) => base44.entities.ContributorProfile.update(profileId, {
      contributor_status: 'approved',
      approval_date: new Date().toISOString(),
      role: 'contributor'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contributor-applications'] });
      addSuccess('Application approved! User can now subscribe to become a contributor.');
    }
  });

  const filteredPosts = allPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser || !canModerate) {
    // Show a loading state or access denied message while data is being fetched
    if (userProfile === undefined || !userProfile) { // userProfile is still loading or doesn't exist
      return (
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-12 text-center">
            <p className="text-gray-600">Loading user permissions...</p>
          </GlassCard>
        </div>
      );
    }

    // After userProfile is loaded, if not authorized, show restricted message
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard className="p-12 text-center">
          <p className="text-gray-600">Access restricted to moderators and admins only</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <GlassCard className="p-6" hover={false}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Hub Moderation</h1>
        <p className="text-gray-600">Manage posts, comments, and contributor applications</p>
      </GlassCard>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab('posts')}
          variant={activeTab === 'posts' ? 'default' : 'outline'}
          className={activeTab === 'posts' ? 'bg-blue-600' : ''}
        >
          <FileText className="w-4 h-4 mr-2" />
          Posts ({pendingPosts.length} pending)
        </Button>
        <Button
          onClick={() => setActiveTab('comments')}
          variant={activeTab === 'comments' ? 'default' : 'outline'}
          className={activeTab === 'comments' ? 'bg-blue-600' : ''}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments ({pendingComments.length} pending)
        </Button>
        <Button
          onClick={() => setActiveTab('edits')}
          variant={activeTab === 'edits' ? 'default' : 'outline'}
          className={activeTab === 'edits' ? 'bg-blue-600' : ''}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Suggestions ({editSuggestions.length} pending)
        </Button>
        <Button
          onClick={() => setActiveTab('contributors')}
          variant={activeTab === 'contributors' ? 'default' : 'outline'}
          className={activeTab === 'contributors' ? 'bg-blue-600' : ''}
        >
          <Users className="w-4 h-4 mr-2" />
          Applications ({applications.length} pending)
        </Button>
        <Button
          onClick={() => setActiveTab('all')}
          variant={activeTab === 'all' ? 'default' : 'outline'}
          className={activeTab === 'all' ? 'bg-blue-600' : ''}
        >
          All Posts ({allPosts.length})
        </Button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {pendingPosts.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending posts to review</p>
            </GlassCard>
          ) : (
            pendingPosts.map(post => (
              <GlassCard key={post.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>By {post.author_name}</span>
                      <span>•</span>
                      <span>{new Date(post.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={createPageUrl('KnowledgePost') + `?slug=${post.slug || post.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </Link>
                  <Button
                    onClick={() => approvePostMutation.mutate(post.id)}
                    disabled={approvePostMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setSelectedItem({ type: 'post', data: post })}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {pendingComments.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending comments</p>
            </GlassCard>
          ) : (
            pendingComments.map(comment => (
              <GlassCard key={comment.id} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{comment.user_display_name}</span>
                    <span className="text-xs text-gray-500">{new Date(comment.created_date).toLocaleString()}</span>
                    {comment.has_urls && (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                        Contains URLs
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveCommentMutation.mutate(comment.id)}
                    disabled={approveCommentMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectCommentMutation.mutate(comment.id)}
                    disabled={rejectCommentMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Edit Suggestions Tab */}
      {activeTab === 'edits' && (
        <div className="space-y-4">
          {editSuggestions.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <GitMerge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending edit suggestions</p>
            </GlassCard>
          ) : (
            editSuggestions.map(suggestion => (
              <GlassCard key={suggestion.id} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      suggestion.edit_type === 'content_edit' ? 'bg-blue-100 text-blue-700' :
                      suggestion.edit_type === 'typo_fix' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {suggestion.edit_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      by {suggestion.suggester_name} on {new Date(suggestion.created_date).toLocaleDateString()}
                    </span>
                  </div>

                  {suggestion.suggested_title && (
                    <div className="mb-3">
                      <span className="text-xs font-bold text-gray-600">New Title:</span>
                      <p className="text-gray-900 font-semibold">{suggestion.suggested_title}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-xs font-bold text-gray-600">Edit Summary:</span>
                    <p className="text-gray-700 text-sm">{suggestion.edit_summary}</p>
                  </div>

                  <details className="mb-3">
                    <summary className="text-sm font-bold text-gray-600 cursor-pointer">View Suggested Content</summary>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: suggestion.suggested_content }}
                      />
                    </div>
                  </details>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveEditMutation.mutate(suggestion)}
                    disabled={approveEditMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <GitMerge className="w-4 h-4 mr-2" />
                    Merge Changes
                  </Button>
                  <Button
                    onClick={() => setSelectedItem({ type: 'edit', data: suggestion })}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Contributor Applications Tab */}
      {activeTab === 'contributors' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending applications</p>
            </GlassCard>
          ) : (
            applications.map(app => (
              <GlassCard key={app.id} className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{app.full_name || app.user_email}</h3>
                  <p className="text-sm text-gray-600 mb-3">{app.user_email}</p>

                  {app.application_text && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <p className="text-gray-700 text-sm">{app.application_text}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Applied on {new Date(app.application_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveApplicationMutation.mutate(app.id)}
                    disabled={approveApplicationMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Application
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* All Posts Tab */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search posts by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredPosts.map(post => (
            <GlassCard key={post.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* View post link - use slug */}
                    <Link
                      href={createPageUrl('KnowledgePost') + `?slug=${post.slug}`}
                      target="_blank"
                      className="text-xl font-bold text-gray-900 hover:text-blue-600 line-clamp-2"
                    >
                      {post.title}
                    </Link>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      post.status === 'approved' ? 'bg-green-100 text-green-700' :
                      post.status === 'pending_moderation' ? 'bg-yellow-100 text-yellow-700' :
                      post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>By {post.author_name}</span>
                    <span>•</span>
                    <span>{post.view_count || 0} views</span>
                    <span>•</span>
                    <span>{new Date(post.created_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link href={createPageUrl('AdminKnowledgeEdit') + `?id=${post.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard className="max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reject {selectedItem.type === 'post' ? 'Post' : 'Edit Suggestion'}
            </h3>
            <Textarea
              placeholder="Reason for rejection (optional)"
              rows={4}
              className="mb-4"
              id="rejection-notes"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const notes = document.getElementById('rejection-notes').value;
                  if (selectedItem.type === 'post') {
                    rejectPostMutation.mutate({ postId: selectedItem.data.id, notes });
                  } else {
                    rejectEditMutation.mutate({ suggestionId: selectedItem.data.id, notes });
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Rejection
              </Button>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
