
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, CreditCard, LogOut, Coins, Plus, Check, Settings, Award, TrendingUp, Shield } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { format } from 'date-fns';

export default function Profile() {
  const [topupAmount, setTopupAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Utility function for creating page URLs
  const createPageUrl = (pageName) => {
    // This is a simple example. In a real app, this might use a router's link generation.
    return `/${pageName.toLowerCase()}`;
  };

  // Use centralized auth hook for user state
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const { data: credits } = useQuery({
    queryKey: ['user-credits-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('UserCredits')
        .select('*')
        .eq('user_email', user.email)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        const defaultRecord = {
          user_email: user.email,
          credits: user?.role === 'admin' ? 1000 : 5,
          source: 'initial'
        };
        const { data: inserted, error: insertError } = await supabase
          .from('UserCredits')
          .insert(defaultRecord)
          .select()
          .single();
        if (insertError) throw insertError;
        return inserted;
      }
      return data[0];
    },
    enabled: !!user?.email
  });

  // Fetch contributor profile
  const { data: contributorProfile } = useQuery({
    queryKey: ['contributor-profile-detail', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('contributorapplications')
        .select('*')
        .eq('user_email', user.email)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!user?.email
  });

  // Fetch user reputation
  const { data: reputation } = useQuery({
    queryKey: ['user-reputation', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('UserReputation')
        .select('*')
        .eq('user_email', user.email)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        // Determine starting reputation based on role
        let startingPoints = 0;
        if (contributorProfile?.role === 'contributor' || contributorProfile?.role === 'moderator') {
          startingPoints = 101; // Contributors start with 101
        } else if (user?.role === 'admin' || contributorProfile?.role === 'admin') {
          startingPoints = 101; // Admins start with 101
        }

        const { data: inserted, error: insertError } = await supabase
          .from('UserReputation')
          .insert({
            user_email: user.email,
            reputation_points: startingPoints,
            badges: [],
            helpful_answers_count: 0,
            accepted_answers_count: 0,
            questions_asked: 0,
            answers_given: 0
          })
          .select()
          .single();
        if (insertError) throw insertError;
        return inserted;
      }
      return data[0];
    },
    enabled: !!user?.email
  });

  const adminTopupMutation = useMutation({
    mutationFn: async () => {
      if (user?.role !== 'admin') throw new Error('Admin only');
      const newBalance = Math.min((credits?.credits_balance || 0) + 1000, 2000);
      const { error } = await supabase
        .from('UserCredits')
        .update({ credits_balance: newBalance })
        .eq('id', credits.id);
      if (error) throw error;
      return { credits_balance: newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  });

  const handlePurchaseCredits = async () => {
    setIsProcessing(true);
    try {
      // Call server-side endpoint to create a checkout session (implement server integration)
      const res = await fetch('/api/create-credit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits_amount: topupAmount })
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert('Failed to create checkout session: ' + (json.error || 'No URL received'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Invalidate relevant queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-reputation'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-profile-detail'] });
      router.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    }
  };

  // Calculate vote weight based on reputation points (accepts points param)
  const getVoteWeight = (points = 0) => {
    if (points <= 50) return 0.5;
    if (points <= 100) return 0.75;
    if (points <= 500) return 1.0;
    if (points <= 1000) return 1.5;
    return 2.0;
  };

  const getReputationTier = (points = 0) => {
    if (points <= 50) return { name: 'Novice', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    if (points <= 100) return { name: 'Contributor', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
    if (points <= 500) return { name: 'Regular', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    if (points <= 1000) return { name: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
    return { name: 'Master', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
  };

  // NOW do conditional renders AFTER all hooks
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Login Required</h1>
          <p className="text-gray-600 mb-6">Sign in to access your profile and credits</p>
          <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
            Login / Sign Up
          </Button>
        </GlassCard>
      </div>
    );
  }

  // friendly display name from Supabase user metadata
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'User');

  // Safe reputation object to allow showing the card even while server data is empty
  const rep = reputation ?? {
    reputation_points: 0,
    accepted_answers_count: 0,
    helpful_answers_count: 0,
    questions_asked: 0,
    answers_given: 0,
  };

  const tier = getReputationTier(rep.reputation_points);
  const voteWeight = getVoteWeight(rep.reputation_points);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center bg-linear-to-br from-[#F8F9FA] to-white border border-[#E7E7E7]" hover={false}>
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#272262] mb-2">{displayName}</h1>
        <p className="text-[#454545]">{user.email}</p>
        {user.role === 'admin' && (
          <span className="inline-block mt-3 px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold border border-purple-300">
            Administrator
          </span>
        )}
        {contributorProfile && (
          <div className="mt-3">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold border ${
              contributorProfile.role === 'moderator' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              contributorProfile.role === 'contributor' ? 'bg-green-100 text-green-700 border-green-300' :
              'bg-gray-100 text-gray-700 border-gray-300'
            }`}>
              {contributorProfile.role === 'moderator' ? 'Moderator' :
               contributorProfile.role === 'contributor' ? 'Contributor' : 'User'}
            </span>
          </div>
        )}
        <div className="mt-4">
          <Button
            onClick={() => window.location.href = createPageUrl("Settings")}
            className="border-[#272262] text-[#272262] bg-white hover:bg-[#272262] hover:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
        </div>
      </GlassCard>

      {/* Reputation & Voting Power */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#272262]">Reputation & Voting Power</h2>
                <p className="text-[#454545] text-sm">Earn reputation to increase your vote weight</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${tier.bg} border ${tier.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${tier.color}`} />
                <span className="text-xs text-[#454545]">Tier</span>
              </div>
              <p className={`text-2xl font-bold ${tier.color}`}>{tier.name}</p>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E7E7E7]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#272262]" />
                <span className="text-xs text-[#454545]">Reputation</span>
              </div>
              <p className="text-2xl font-bold text-[#272262]">{rep.reputation_points}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-[#454545]">Vote Weight</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{voteWeight}x</p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-[#454545]">Best Answers</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{rep.accepted_answers_count || 0}</p>
            </div>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E7E7E7] p-6 rounded-xl">
            <h3 className="font-bold text-[#272262] mb-4">How Reputation Works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#272262] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium text-[#272262]">Earn reputation by:</p>
                  <ul className="text-[#454545] ml-4 mt-1 space-y-1">
                    <li>• +10 points per upvote on your answers</li>
                    <li>• +25 points when your answer is marked as &quot;Best Answer&quot;</li>
                    <li>• +5 points for helpful question upvotes</li>
                    <li>• +1 point for each vote you cast (encourages participation)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium text-[#272262]">Higher reputation = stronger votes:</p>
                  <ul className="text-[#454545] ml-4 mt-1 space-y-1">
                    <li>• 0-50 points: <strong>0.5x</strong> vote weight (new users)</li>
                    <li>• 51-100 points: <strong>0.75x</strong> vote weight</li>
                    <li>• 101-500 points: <strong>1.0x</strong> vote weight (standard)</li>
                    <li>• 501-1000 points: <strong>1.5x</strong> vote weight (expert)</li>
                    <li>• 1000+ points: <strong>2.0x</strong> vote weight (master)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#BF1E2E] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium text-[#272262]">Anti-spam protection:</p>
                  <p className="text-[#454545] ml-4 mt-1">Vote limits prevent abuse: 5/minute, 50/hour, 200/day. New users have less voting power to prevent manipulation.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#454545]">
                <strong className="text-[#272262]">Your current status:</strong> With {rep.reputation_points} points, your votes count as <strong>{voteWeight}x</strong> weight. 
                {voteWeight < 1 && " Keep contributing quality answers to increase your influence!"}
                {voteWeight === 1 && " You're at standard voting power. Keep earning reputation to become an expert!"}
                {voteWeight > 1 && " You're a trusted community member with enhanced voting power!"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-white border border-[#E7E7E7] rounded-lg">
              <p className="text-2xl font-bold text-[#272262]">{rep.questions_asked || 0}</p>
              <p className="text-xs text-[#454545]">Questions Asked</p>
            </div>
            <div className="text-center p-4 bg-white border border-[#E7E7E7] rounded-lg">
              <p className="text-2xl font-bold text-[#272262]">{rep.answers_given || 0}</p>
              <p className="text-xs text-[#454545]">Answers Given</p>
            </div>
            <div className="text-center p-4 bg-white border border-[#E7E7E7] rounded-lg">
              <p className="text-2xl font-bold text-[#272262]">{rep.helpful_answers_count || 0}</p>
              <p className="text-xs text-[#454545]">Helpful Votes Received</p>
            </div>
          </div>
        </GlassCard>

      {/* AI Credits section */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#272262]">AI Credits</h2>
              <p className="text-[#454545] text-sm">For AI Assistant, document translation & analysis</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#F8F9FA] p-6 rounded-xl border border-[#E7E7E7]">
            <p className="text-[#454545] text-sm mb-1">Available Credits</p>
            <p className="text-4xl font-bold text-[#272262]">{credits?.credits || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <p className="text-[#454545] text-sm mb-1">Total Used</p>
            <p className="text-4xl font-bold text-green-600">{credits?.credits_used || 0}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
            <p className="text-[#454545] text-sm mb-1">Total Purchased</p>
            <p className="text-4xl font-bold text-purple-600">{credits?.credits_purchased || 0}</p>
          </div>
        </div>

        <div className="bg-[#F8F9FA] border border-[#E7E7E7] p-6 rounded-xl">
          <h3 className="font-bold text-[#272262] mb-4">How Credits Work</h3>
          <ul className="space-y-2 text-sm text-[#454545] mb-6">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>1 credit = 1 AI assistant question</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>1 credit = 1 document translation or explanation</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>1 credit = 1 AI document validation</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>New users get 5 free credits</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Pro plan users get 20% bonus credits automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Top up: 2 THB per credit</span>
            </li>
          </ul>

          {user.role === 'admin' ? (
            <Button
              onClick={() => adminTopupMutation.mutate()}
              disabled={adminTopupMutation.isPending || (credits?.credits >= 2000)}
              className="w-full bg-[#272262] hover:bg-[#3d3680] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              {adminTopupMutation.isPending ? 'Adding...' : 'Add 1,000 Credits (Admin)'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-[#454545] mb-2 block">Credits to Purchase</Label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[25, 50, 100, 250].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopupAmount(amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        topupAmount === amount
                          ? 'border-[#272262] bg-[#F8F9FA]'
                          : 'border-[#E7E7E7] hover:border-[#272262]'
                      }`}
                    >
                      <div className="text-lg font-bold text-[#272262]">{amount}</div>
                      <div className="text-xs text-[#454545]">{amount * 2} THB</div>
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  placeholder="Custom amount"
                  min="1"
                  className="mb-3 border-[#E7E7E7]"
                />
              </div>
              <Button
                onClick={handlePurchaseCredits}
                disabled={isProcessing}
                className="w-full bg-[#272262] hover:bg-[#3d3680] text-white py-6 text-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isProcessing ? 'Processing...' : `Buy ${topupAmount} Credits for ${topupAmount * 2} THB`}
              </Button>
            </div>
          )}
        </div>
      </GlassCard>

      {credits?.transaction_history && credits.transaction_history.length > 0 && (
        <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
          <h2 className="text-2xl font-bold text-[#272262] mb-6">Transaction History</h2>
          <div className="space-y-3">
            {credits.transaction_history.slice(0, 10).map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg border border-[#E7E7E7]">
                <div>
                  <p className="font-medium text-[#272262]">{tx.description}</p>
                  <p className="text-xs text-[#454545]">{tx.date && format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div className={`font-bold ${
                  tx.type === 'used' ? 'text-[#BF1E2E]' : 'text-green-600'
                }`}>
                  {tx.type === 'used' ? '-' : '+'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
          {credits.transaction_history.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-[#454545]">Showing 10 of {credits.transaction_history.length} transactions</p>
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <h2 className="text-2xl font-bold text-[#272262] mb-6">Session Management</h2>
        <div className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-[#BF1E2E] text-[#BF1E2E] bg-red-100 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
