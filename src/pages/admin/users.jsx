
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Search, Edit, Trash2, Plus, Mail, Shield,
  Award, CheckCircle, XCircle, Filter, Download
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link"; // Added import for Link

// Placeholder for createPageUrl - In a real application, this would be imported from a routing utility or defined globally.
// This function constructs a URL for a given pageName and optional parameters.
const createPageUrl = (pageName, params = {}) => {
  switch (pageName) {
    case "KnowledgeContributor":
      if (params.slug) return `/contributor/${params.slug}`;
      if (params.id) return `/contributor/id/${params.id}`; // Example: /contributor/id/123
      if (params.email) return `/contributor/email/${params.email}`; // Example: /contributor/email/test@example.com
      return "/contributors"; // Default or list page
    default:
      return `/${pageName.toLowerCase()}`; // Generic fallback
  }
};


export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProfile, setEditingProfile] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  // NEW: State for linking profiles
  const [linkingProfile, setLinkingProfile] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');

  const { addError, addSuccess } = useError();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Fetch all account profiles (used as user list)
  const { data: accounts = [] } = useQuery({
    queryKey: ['all-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all contributor profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contributorapplications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Basic vote statistics derived from PostUpvote and UserReputation tables
  const { data: voteStats } = useQuery({
    queryKey: ['vote-statistics'],
    queryFn: async () => {
      const { data: upvotes = [], error: upErr } = await supabase.from('PostUpvote').select('*');
      if (upErr) throw upErr;
      const { data: reps = [], error: repErr } = await supabase.from('UserReputation').select('*');
      if (repErr) throw repErr;

      return {
        total_votes: upvotes.length,
        flagged_votes: 0,
        banned_users: reps.filter(r => (r.reputation_points || 0) < 0).length,
        users_on_cooldown: 0,
        recent_suspicious: []
      };
    }
  });

  // Combine accounts with their contributor profiles
  const combinedUsers = accounts.map(user => {
    const profile = profiles.find(p => p.user_email === user.email);
    return {
      ...user,
      profile: profile || null
    };
  });

  // Filter users
  const filteredUsers = combinedUsers.filter(user => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' ||
      user.role === roleFilter ||
      user.profile?.role === roleFilter;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.profile?.subscription_active) ||
      (statusFilter === 'inactive' && !user.profile?.subscription_active) ||
      (statusFilter === 'pending' && user.profile?.contributor_status === 'pending_approval');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, data }) => {
      if (profileId) {
        const { data: updated, error } = await supabase.from('contributorapplications').update(data).eq('id', profileId).select();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase.from('contributorapplications').insert(data).select();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-accounts'] });
      addSuccess('Profile updated successfully');
      setShowDialog(false);
      setEditingProfile(null);
    },
    onError: (error) => {
      addError('Failed to update profile: ' + error.message);
    }
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId) => {
      const { data: deleted, error } = await supabase.from('contributorapplications').delete().eq('id', profileId).select();
      if (error) throw error;
      return deleted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-accounts'] });
      addSuccess('Profile deleted successfully');
    },
    onError: (error) => {
      addError('Failed to delete profile: ' + error.message);
    }
  });

  // Update mutation to reset all voting data - now uses backend function
  const resetVotingMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('adminOperations', { body: JSON.stringify({ operation: 'reset_votes' }) });
      if (res?.error) throw res.error;
      return res?.data ?? res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      addSuccess(`All voting data reset! Deleted ${data.stats.vote_activities_deleted} votes`);
    },
    onError: (error) => {
      addError('Failed to reset voting data: ' + error.message);
    }
  });

  // Update mutation to fix user/profile mismatches - now uses backend function
  const syncProfilesMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('adminOperations', { body: JSON.stringify({ operation: 'sync_profiles' }) });
      if (res?.error) throw res.error;
      return res?.data ?? res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      addSuccess(`Fixed ${data.total_fixed} posts! (${data.supansa_posts_fixed} for Supansa)`);
    },
    onError: (error) => {
      addError('Failed to sync profiles: ' + error.message);
    }
  });

  // Mutation to update profile email for linking
  const updateProfileEmailMutation = useMutation({
    mutationFn: async ({ profile_id, new_email }) => {
      const response = await base44.functions.invoke('adminOperations', {
        operation: 'update_profile_email',
        profile_id,
        new_email
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      addSuccess('Profile linked successfully!');
      setShowLinkDialog(false);
      setLinkingProfile(null);
      setTargetEmail('');
    },
    onError: (error) => {
      addError('Failed to link profile: ' + error.message);
    }
  });

  const handleEdit = (item) => { // 'item' can be a combined user object or a raw profile object
    if (item.profile) { // It's a combined user object
      setEditingProfile(item);
    } else { // It's a raw profile object (orphaned)
      // Create a temporary 'user-like' object for the dialog to consume
      setEditingProfile({
        id: item.id, // Use profile ID
        email: item.user_email, // Use profile's user_email
        full_name: item.full_name,
        profile: item // The actual profile data
      });
    }
    setShowDialog(true);
  };

  const handleDelete = async (item) => { // 'item' can be a combined user object or a raw profile object
    const profileToDelete = item.profile || item; // Get the actual profile object
    if (!profileToDelete || !profileToDelete.id) {
      addError('No profile to delete or missing ID');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete User Profile',
      message: `Are you sure you want to delete the profile for ${profileToDelete.user_email || profileToDelete.full_name || 'this user'}? This will remove their contributor status but not their user account.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      deleteProfileMutation.mutate(profileToDelete.id);
    }
  };

  const handleLinkProfile = async (profile) => {
    setLinkingProfile(profile);
    setTargetEmail(''); // Reset the email field
    setShowLinkDialog(true);
  };

  const exportUsers = () => {
    const csv = [
      ['Email', 'Full Name', 'Role', 'Account Role', 'Status', 'Posts', 'Created Date'].join(','),
      ...filteredUsers.map(u => [
        u.email,
        u.profile?.full_name || u.full_name || '',
        u.profile?.role || 'user',
        u.role || 'user',
        u.profile?.contributor_status || 'none',
        u.profile?.post_count || 0,
        new Date(u.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addSuccess('Users exported successfully');
  };

  const getRoleBadge = (user) => {
    const role = user.profile?.role || user.role || 'user';
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      moderator: 'bg-blue-100 text-blue-700',
      contributor: 'bg-green-100 text-green-700',
      user: 'bg-gray-100 text-gray-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[role]}`}>{role}</span>;
  };

  const getStatusBadge = (user) => {
    if (!user.profile) return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">No Profile</span>;

    const status = user.profile.contributor_status;
    const colors = {
      none: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      subscribed: 'bg-blue-100 text-blue-700',
      suspended: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || colors.none}`}>{status || 'none'}</span>;
  };

  // Helper function to get contributor URL
  const getContributorUrl = (profile) => {
    if (profile.profile_slug) {
      return createPageUrl("KnowledgeContributor", { slug: profile.profile_slug });
    } else if (profile.id) {
      return createPageUrl("KnowledgeContributor", { id: profile.id });
    } else {
      return createPageUrl("KnowledgeContributor", { email: profile.user_email });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage all users, contributors, and moderators</p>
          </div>
          <Button onClick={exportUsers} variant="outline" className="text-black">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </GlassCard>

      {/* Admin Tools */}
      <GlassCard className="p-6 bg-orange-50 border-2 border-orange-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Tools</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-orange-300">
            <h3 className="font-bold text-gray-900 mb-2">Reset All Voting Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Deletes all upvotes, downvotes, vote activity, and rate limits. Resets all upvote counts to 0.
              <strong className="text-red-600"> This cannot be undone!</strong>
            </p>
            <Button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Reset All Voting Data',
                  message: 'This will delete ALL votes and reset all counts to 0. This action cannot be undone. Are you absolutely sure?',
                  confirmText: 'Yes, Reset Everything',
                  variant: 'danger'
                });
                if (confirmed) {
                  resetVotingMutation.mutate();
                }
              }}
              disabled={resetVotingMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetVotingMutation.isPending ? 'Resetting...' : 'Reset All Votes'}
            </Button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-300">
            <h3 className="font-bold text-gray-900 mb-2">Fix Author/Profile Mismatches</h3>
            <p className="text-sm text-gray-600 mb-3">
              Scans all posts and updates author_email to match their ContributorProfile based on name.
              Use this when posts are under wrong email.
            </p>
            <Button
              onClick={() => syncProfilesMutation.mutate()}
              disabled={syncProfilesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {syncProfilesMutation.isPending ? 'Syncing...' : 'Sync Author Profiles'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Vote System Statistics */}
      {voteStats && (
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vote System Health</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{voteStats.total_votes}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{voteStats.flagged_votes}</div>
              <div className="text-sm text-gray-600">Flagged Suspicious</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{voteStats.users_on_cooldown}</div>
              <div className="text-sm text-gray-600">Users on Cooldown</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{voteStats.banned_users}</div>
              <div className="text-sm text-gray-600">Banned from Voting</div>
            </div>
          </div>

          {voteStats.recent_suspicious.length > 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Recent Suspicious Activity (24h)</h3>
              <div className="space-y-2">
                {voteStats.recent_suspicious.slice(0, 5).map(activity => (
                  <div key={activity.id} className="text-sm">
                    <span className="font-medium">{activity.user_email}</span>
                    {' '}• Spam Score: {activity.spam_score}
                    {' '}• {activity.target_type} vote
                    {' '}• {new Date(activity.created_date).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Subscription</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span>Total: <strong>{filteredUsers.length}</strong></span>
          <span>Admins: <strong>{filteredUsers.filter(u => (u.profile?.role || u.role) === 'admin').length}</strong></span>
          <span>Moderators: <strong>{filteredUsers.filter(u => u.profile?.role === 'moderator').length}</strong></span>
          <span>Contributors: <strong>{filteredUsers.filter(u => u.profile?.role === 'contributor').length}</strong></span>
          <span>Active Subs: <strong>{filteredUsers.filter(u => u.profile?.subscription_active).length}</strong></span>
        </div>
      </GlassCard>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(user => (
          <GlassCard key={user.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* Make avatar clickable to view profile */}
                  {user.profile ? (
                    <Link href={getContributorUrl(user.profile)}>
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                        {user.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.profile.avatar_url} alt={user.profile.full_name || user.full_name || user.email} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{(user.profile?.full_name || user.full_name || user.email)?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <span className="text-white font-bold">{(user.full_name || user.email)?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.profile?.full_name || user.full_name || user.email}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.profile?.profile_slug && (
                      <p className="text-xs text-blue-600 mt-1">
                        /contributor/{user.profile.profile_slug}
                      </p>
                    )}
                  </div>
                  {getRoleBadge(user)}
                  {getStatusBadge(user)}
                  {user.profile?.subscription_active && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Account Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(user.created_date).toLocaleDateString()}</span>
                  </div>

                  {user.profile && (
                    <>
                      <div>
                        <span className="text-gray-500">Posts:</span>
                        <span className="ml-2 text-gray-900 font-bold">{user.profile.post_count || 0}</span>
                      </div>

                      {user.profile.subscription_start_date && (
                        <div>
                          <span className="text-gray-500">Subscribed Since:</span>
                          <span className="ml-2 text-gray-900">{new Date(user.profile.subscription_start_date).toLocaleDateString()}</span>
                        </div>
                      )}

                      {user.profile.expertise_areas && user.profile.expertise_areas.length > 0 && (
                        <div className="md:col-span-3">
                          <span className="text-gray-500">Expertise:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.profile.expertise_areas.map((area, i) => (
                              <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {user.profile?.bio && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{user.profile.bio}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button onClick={() => handleEdit(user)} variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                {user.profile && (
                  <Button onClick={() => handleDelete(user)} variant="outline" size="sm" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredUsers.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your filters</p>
          </GlassCard>
        )}
      </div>

      {/* Orphaned Profiles Section */}
      {profiles.some(p => !users.find(u => u.email === p.user_email)) && (
        <div className="space-y-4 mt-8">
          <h2 className="text-2xl font-bold text-gray-900">Orphaned Profiles</h2>
          <p className="text-gray-600 text-sm">These contributor profiles exist but don't have matching user accounts in our system. They might belong to deleted users or accounts with changed emails.</p>

          {profiles.filter(p => !users.find(u => u.email === p.user_email)).map(profile => (
            <GlassCard key={profile.id} className="p-6 bg-orange-50 border-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{(profile.full_name || profile.user_email)?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{profile.full_name || 'N/A'}</h3>
                      <p className="text-sm text-orange-600">Current Email: {profile.user_email}</p>
                      {profile.profile_slug && (
                        <p className="text-xs text-blue-600 mt-1">
                          Custom URL: /contributor/{profile.profile_slug}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Role: {profile.role} • Posts: {profile.post_count || 0}</p>
                      <p className="text-xs text-red-500 font-semibold mt-1">Status: Orphaned</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleLinkProfile(profile)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    disabled={updateProfileEmailMutation.isPending}
                  >
                    Link to Account
                  </Button>
                  <Button
                    onClick={() => handleEdit(profile)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(profile)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    disabled={deleteProfileMutation.isPending && deleteProfileMutation.variables === profile.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-black">
          <DialogHeader>
            <DialogTitle>Edit User Profile - {editingProfile?.email}</DialogTitle>
          </DialogHeader>

          {editingProfile && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);

              const data = {
                user_email: editingProfile.email,
                full_name: formData.get('full_name'),
                nickname: formData.get('nickname'),
                bio: formData.get('bio'),
                avatar_url: formData.get('avatar_url'),
                role: formData.get('role'),
                contributor_status: formData.get('contributor_status'),
                subscription_active: formData.get('subscription_active') === 'true',
                profile_visible: formData.get('profile_visible') === 'true',
                expertise_areas: formData.get('expertise_areas')?.split(',').map(s => s.trim()).filter(Boolean) || []
              };

              updateProfileMutation.mutate({
                profileId: editingProfile.profile?.id,
                data
              });
            }} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    name="full_name"
                    defaultValue={editingProfile.profile?.full_name || editingProfile.full_name || ''}
                  />
                </div>

                <div>
                  <Label>Nickname (Optional)</Label>
                  <Input
                    name="nickname"
                    defaultValue={editingProfile.profile?.nickname || ''}
                  />
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  name="bio"
                  rows={3}
                  defaultValue={editingProfile.profile?.bio || ''}
                />
              </div>

              <div>
                <Label>Avatar URL</Label>
                <Input
                  name="avatar_url"
                  defaultValue={editingProfile.profile?.avatar_url || ''}
                  placeholder="https://..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select name="role" defaultValue={editingProfile.profile?.role || 'user'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Contributor Status</Label>
                  <Select name="contributor_status" defaultValue={editingProfile.profile?.contributor_status || 'none'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="subscribed">Subscribed</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Subscription Active</Label>
                  <Select name="subscription_active" defaultValue={editingProfile.profile?.subscription_active ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Profile Visible</Label>
                  <Select name="profile_visible" defaultValue={editingProfile.profile?.profile_visible !== false ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Expertise Areas (comma-separated)</Label>
                <Input
                  name="expertise_areas"
                  defaultValue={editingProfile.profile?.expertise_areas?.join(', ') || ''}
                  placeholder="Retirement Visa, DTV, 90-Day Report"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updateProfileMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Profile Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Profile to Account</DialogTitle>
          </DialogHeader>

          {linkingProfile && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  Link the profile <strong>{linkingProfile.full_name || linkingProfile.user_email}</strong> to:
                </p>
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">Target Email Address</Label>
                <Input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="Enter email address (e.g., point@thainexus.co.th)"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be any user's email address. The profile will be linked to that account.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Warning:</strong> This will:
                </p>
                <ul className="text-sm text-gray-700 list-disc ml-5 mt-2">
                  <li>Change the profile's email from <code>{linkingProfile.user_email}</code> to <code>{targetEmail || '[specified email]'}</code></li>
                  <li>Update all {linkingProfile.post_count || 0} posts to show under the new account</li>
                  <li>This action cannot be easily undone</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
                      addError('Please enter a valid email address');
                      return;
                    }
                    updateProfileEmailMutation.mutate({
                      profile_id: linkingProfile.id,
                      new_email: targetEmail.trim()
                    });
                  }}
                  disabled={updateProfileEmailMutation.isPending || !targetEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updateProfileEmailMutation.isPending ? 'Linking...' : 'Confirm Link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setTargetEmail('');
                  }}
                  disabled={updateProfileEmailMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
