import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { 
  User, Mail, Link as LinkIcon, Award, BookOpen, 
  Calendar, ExternalLink, ArrowLeft, CheckCircle, AlertCircle, Shield, TrendingUp 
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';

// Get reputation tier
function getReputationTier(points) {
  if (points <= 50) return { name: 'Novice', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  if (points <= 100) return { name: 'Contributor', color: 'text-[#272262]', bg: 'bg-blue-50', border: 'border-[#272262]' };
  if (points <= 500) return { name: 'Regular', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' };
  if (points <= 1000) return { name: 'Expert', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' };
  return { name: 'Master', color: 'text-[#BF1E2E]', bg: 'bg-red-50', border: 'border-[#BF1E2E]' };
}

// Get vote weight
function getVoteWeight(points) {
  if (points <= 50) return 0.5;
  if (points <= 100) return 0.75;
  if (points <= 500) return 1.0;
  if (points <= 1000) return 1.5;
  return 2.0;
}

// allow this page to render (removed notFound getStaticProps)
export default function KnowledgeContributor() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const profileSlug = urlParams.get('slug');
  const profileId = urlParams.get('id');
  const contributorEmail = urlParams.get('email');
  const subscriptionStatus = urlParams.get('subscription');
  
  const [showMessage, setShowMessage] = useState(!!subscriptionStatus);

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

  const isAdmin = currentUser?.role === 'admin';

  const { data: contributor, isLoading } = useQuery({
    queryKey: ['contributor-profile', profileSlug, profileId, contributorEmail],
    queryFn: async () => {
      let profiles = [];

      if (profileSlug) {
        const { data, error } = await supabase
          .from('ContributorProfile')
          .select('*')
          .eq('profile_slug', profileSlug)
          .eq('profile_visible', true)
          .limit(1);
        if (error) throw error;
        profiles = data || [];
      }

      if ((!profiles || profiles.length === 0) && profileId) {
        const { data, error } = await supabase
          .from('ContributorProfile')
          .select('*')
          .eq('id', profileId)
          .eq('profile_visible', true)
          .limit(1);
        if (error) throw error;
        profiles = data || [];
      }

      if ((!profiles || profiles.length === 0) && contributorEmail) {
        const { data, error } = await supabase
          .from('ContributorProfile')
          .select('*')
          .eq('user_email', contributorEmail)
          .eq('profile_visible', true)
          .limit(1);
        if (error) throw error;
        profiles = data || [];
      }

      return profiles[0] || null;
    },
    enabled: !!(profileSlug || profileId || contributorEmail)
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['contributor-posts', contributor?.user_email],
    queryFn: async () => {
      if (!contributor?.user_email) return [];
      const { data, error } = await supabase
        .from('KnowledgePost')
        .select('*')
        .eq('author_email', contributor.user_email)
        .eq('status', 'approved')
        .order('published_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contributor?.user_email
  });

  // Fetch reputation
  const { data: reputation } = useQuery({
    queryKey: ['contributor-reputation', contributor?.user_email],
    queryFn: async () => {
      if (!contributor?.user_email) return null;
      const { data, error } = await supabase
        .from('UserReputation')
        .select('*')
        .eq('user_email', contributor.user_email)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contributor?.user_email
  });

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const paginatedPosts = posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#272262] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#454545]">Loading profile...</p>
        </GlassCard>
      </div>
    );
  }

  if (!contributor) {
    return (
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-12 text-center bg-white border border-[#E7E7E7]">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#272262] mb-4">Contributor Not Found</h1>
          <p className="text-[#454545] mb-6">This profile is not available or has been hidden.</p>
          <Link href={createPageUrl('KnowledgeHub')}>
            <Button className="bg-[#272262] hover:bg-[#3d3680] text-white">
              Back to Knowledge Hub
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const displayName = contributor.full_name || contributor.nickname || 'Contributor';
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const reputationPoints = reputation?.reputation_points || 0;
  const tier = getReputationTier(reputationPoints);
  const voteWeight = getVoteWeight(reputationPoints);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showMessage && subscriptionStatus === 'success' && (
        <GlassCard className="p-6 bg-green-50 border-2 border-green-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#272262]">Subscription Activated</h3>
              <p className="text-[#454545] text-sm">You can now write and publish articles. Start by going to Knowledge Hub and clicking "Write Article".</p>
            </div>
            <button onClick={() => setShowMessage(false)} className="ml-auto text-[#454545] hover:text-[#272262]">
              ×
            </button>
          </div>
        </GlassCard>
      )}

      {showMessage && subscriptionStatus === 'cancelled' && (
        <GlassCard className="p-6 bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#272262]">Subscription Cancelled</h3>
              <p className="text-[#454545] text-sm">You can subscribe anytime from your Contributor page.</p>
            </div>
            <button onClick={() => setShowMessage(false)} className="ml-auto text-[#454545] hover:text-[#272262]">
              ×
            </button>
          </div>
        </GlassCard>
      )}
      
      <div className="flex items-center justify-between">
        <Link href={createPageUrl('KnowledgeHub')} className="inline-flex items-center text-[#454545] hover:text-[#272262] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Knowledge Hub
        </Link>
        
        {isAdmin && (
          <Link href={createPageUrl('AdminUsers')}>
            <Button variant="outline" className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white">
              <User className="w-4 h-4 mr-2" />
              Edit User (Admin)
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center shadow-lg">
              {contributor.avatar_url ? (
                <img 
                  src={contributor.avatar_url} 
                  alt={displayName} 
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-white text-4xl font-bold">{initials}</span>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#272262] mb-2">{displayName}</h1>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  {contributor.role && contributor.role !== 'user' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      contributor.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                      contributor.role === 'moderator' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                      'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                      {contributor.role === 'admin' ? 'Admin' : 
                       contributor.role === 'moderator' ? 'Moderator' : 
                       'Contributor'}
                    </span>
                  )}
                  
                  {reputation && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tier.bg} ${tier.color} ${tier.border}`}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {tier.name}
                    </span>
                  )}
                  
                  {contributor.profile_slug && (
                    <span className="text-xs text-[#454545] bg-[#F8F9FA] px-2 py-1 rounded border border-[#E7E7E7]">
                      /contributor/{contributor.profile_slug}
                    </span>
                  )}
                  
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `mailto:${contributor.user_email}`;
                      link.click();
                    }}
                    className="flex items-center gap-1 text-[#454545] hover:text-[#BF1E2E] transition-colors"
                    title="Send email"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Contact</span>
                  </button>
                </div>
              </div>
            </div>

            {contributor.bio && (
              <p className="text-[#454545] leading-relaxed mb-4">{contributor.bio}</p>
            )}

            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] flex items-center justify-center border border-[#E7E7E7]">
                  <BookOpen className="w-5 h-5 text-[#272262]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#272262]">{posts.length}</div>
                  <div className="text-xs text-[#454545]">Articles</div>
                </div>
              </div>
              
              {reputation && (
                <>
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${tier.bg} ${tier.border}`}>
                      <TrendingUp className={`w-5 h-5 ${tier.color}`} />
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${tier.color}`}>{reputationPoints}</div>
                      <div className="text-xs text-[#454545]">Reputation</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-200">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{voteWeight}x</div>
                      <div className="text-xs text-[#454545]">Vote Weight</div>
                    </div>
                  </div>
                </>
              )}
              
              {contributor.subscription_start_date && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-200">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#272262]">
                      {new Date(contributor.subscription_start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-[#454545]">Member Since</div>
                  </div>
                </div>
              )}
            </div>

            {contributor.expertise_areas && contributor.expertise_areas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-[#272262] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#BF1E2E]" />
                  Areas of Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contributor.expertise_areas.map((area, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 rounded-full bg-[#F8F9FA] text-[#272262] text-sm font-medium border border-[#E7E7E7]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {contributor.profile_links && contributor.profile_links.length > 0 && contributor.subscription_active && (
              <div>
                <h3 className="text-sm font-bold text-[#272262] mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#BF1E2E]" />
                  Connect
                </h3>
                <div className="flex flex-wrap gap-3">
                  {contributor.profile_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E7E7E7] hover:border-[#272262] hover:bg-[#F8F9FA] transition-all text-sm"
                    >
                      {link.icon && <span className="text-lg">{link.icon}</span>}
                      <span>{link.label}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Articles */}
      <div>
        <h2 className="text-2xl font-bold text-[#272262] mb-6">
          Articles by {displayName} ({posts.length})
        </h2>
        
        {posts.length === 0 ? (
          <GlassCard className="p-12 text-center bg-white border border-[#E7E7E7]">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#454545]">No published articles yet.</p>
          </GlassCard>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedPosts.map(post => (
                <Link key={post.id} href={createPageUrl('KnowledgePost') + `?slug=${post.slug}`}>
                  <GlassCard className="p-6 bg-white border border-[#E7E7E7] hover:border-[#272262] hover:shadow-md transition-all">
                    <h3 className="text-xl font-bold text-[#272262] mb-2 hover:text-[#BF1E2E] transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-[#454545] text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#454545]">
                      <span>{post.view_count || 0} views</span>
                      <span>•</span>
                      <span>{post.comment_count || 0} comments</span>
                      <span>•</span>
                      <span>{new Date(post.published_date || post.created_date).toLocaleDateString()}</span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className={currentPage === page ? 'bg-[#272262] text-white hover:bg-[#3d3680]' : 'border-[#E7E7E7] hover:bg-[#F8F9FA]'}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}