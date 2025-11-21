import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, BookOpen, Users, Shield, Crown, Loader2, TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';

// NOTE: removed getStaticProps returning notFound to allow this page to render.
export default function BecomeContributor() {
  const [applicationData, setApplicationData] = useState({
    full_name: '',
    bio: '',
    expertise_areas: '',
    application_text: ''
  });
  const { addError, addSuccess } = useError();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-contributor'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) return null;
        return data?.user ?? null;
      } catch (error) {
        return null;
      }
    },
    retry: false
  });

  const { data: existingProfile } = useQuery({
    queryKey: ['contributor-profile', currentUser?.email],
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

  const applyMutation = useMutation({
    mutationFn: async (data) => {
      const profileData = {
        ...data,
        contributor_status: 'pending_approval',
        application_date: new Date().toISOString()
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('contributorapplications')
          .update(profileData)
          .eq('id', existingProfile.id);
        if (error) throw error;
        return { ...existingProfile, ...profileData };
      } else {
        const insertData = {
          user_email: currentUser.email,
          role: 'user',
          profile_visible: true,
          ...profileData
        };
        const { data: inserted, error } = await supabase
          .from('contributorapplications')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return inserted;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributor-profile'] });
      addSuccess('Application submitted! Admin will review within 24-48 hours.');
    },
    onError: (error) => {
      addError('Failed to submit application: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!applicationData.full_name || !applicationData.bio || !applicationData.application_text) {
      addError('Please fill in all required fields');
      return;
    }

    const expertiseArray = applicationData.expertise_areas
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    applyMutation.mutate({
      full_name: applicationData.full_name,
      bio: applicationData.bio,
      expertise_areas: expertiseArray,
      application_text: applicationData.application_text
    });
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center bg-white border border-[#E7E7E7]">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#272262] mb-3">Login Required</h1>
          <p className="text-[#454545] mb-6">You must be logged in to apply as a contributor</p>
          <Button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } })}
            className="bg-[#272262] hover:bg-[#3d3680] text-white"
          >
            Login / Sign Up
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (existingProfile?.contributor_status === 'pending_approval') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center bg-yellow-50 border-2 border-yellow-300">
          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-[#272262] mb-3">Application Under Review</h1>
          <p className="text-[#454545] mb-2">Your contributor application is being reviewed by our team.</p>
          <p className="text-[#454545] mb-6">You'll receive an email notification once approved (typically within 24-48 hours).</p>
          <div className="bg-white border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm text-[#454545] mb-2"><strong>Submitted:</strong> {new Date(existingProfile.application_date).toLocaleDateString()}</p>
            <p className="text-sm text-[#454545]"><strong>Status:</strong> Pending Admin Approval</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (existingProfile?.contributor_status === 'approved') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center bg-green-50 border-2 border-green-300">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#272262] mb-3">You're Approved!</h1>
          <p className="text-[#454545] mb-6">Subscribe now to start sharing your Thailand visa expertise with thousands of expats.</p>
          
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto mb-6 border border-[#E7E7E7]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-[#454545] mb-1">Monthly Investment</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#272262]">฿900</p>
                  <p className="text-[#454545]">/month</p>
                </div>
              </div>
              <Crown className="w-12 h-12 text-[#BF1E2E]" />
            </div>
            
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[#454545]">Publish unlimited visa knowledge posts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[#454545]">Profile page with bio and website link</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[#454545]">Build authority and reach thousands</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[#454545]">SEO-optimized content with FAQPage schema</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[#454545]">Cancel anytime - no contracts</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={async () => {
              // Subscription flow previously used a backend function (base44.functions).
              // Replace this with your server-side subscription endpoint (e.g. /api/create-subscription)
              // For now show a helpful error and a contact fallback.
              addError('Subscription flow is not configured. Please contact contact@thainexus.co.th to arrange subscription.');
            }}
            className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-8 py-6 text-lg"
          >
            Subscribe & Start Contributing
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <GlassCard className="p-12 text-center bg-gradient-to-br from-[#272262] to-[#3d3680] border-none text-white" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
          <Crown className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Contributor Program</span>
        </div>
        <h1 className="text-5xl font-bold mb-6">Share Your Thailand Visa Expertise</h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
          Help thousands of expats while building your reputation as a trusted Thailand visa expert. Write, publish, and get discovered.
        </p>
        <div className="flex items-center justify-center gap-8 text-white/90">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">5,000+</div>
            <div className="text-sm">Monthly Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">24-48h</div>
            <div className="text-sm">Approval Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">฿900</div>
            <div className="text-sm">Per Month</div>
          </div>
        </div>
      </GlassCard>

      {/* What You Get */}
      <div>
        <h2 className="text-3xl font-bold text-[#272262] mb-6 text-center">What You Get as a Contributor</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard className="p-6 text-center bg-white border border-[#E7E7E7]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#272262] mb-2">Reach Thousands</h3>
            <p className="text-[#454545] text-sm">Your posts reach 5,000+ monthly visitors actively searching for Thailand visa information.</p>
          </GlassCard>

          <GlassCard className="p-6 text-center bg-white border border-[#E7E7E7]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#272262] mb-2">Build Authority</h3>
            <p className="text-[#454545] text-sm">Establish yourself as a go-to visa expert. Your profile showcases your expertise and website.</p>
          </GlassCard>

          <GlassCard className="p-6 text-center bg-white border border-[#E7E7E7]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#272262] mb-2">Generate Leads</h3>
            <p className="text-[#454545] text-sm">Profile link to your website visible to thousands. Turn expertise into business opportunities.</p>
          </GlassCard>
        </div>
      </div>

      {/* Why It's Paid */}
      <GlassCard className="p-8 bg-gradient-to-br from-[#F8F9FA] to-white border border-[#E7E7E7]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#272262] flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Why We Charge ฿900/Month</h3>
              <p className="text-[#454545] mb-4">We're building Thailand's most trusted visa knowledge platform. Here's why we charge:</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#272262] mb-1">Quality Control</h4>
                <p className="text-sm text-[#454545]">Only serious, committed experts who invest in providing accurate information.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#272262] mb-1">Prevent Spam</h4>
                <p className="text-sm text-[#454545]">Stops one-time spammers and low-quality content that hurts our community.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#272262] mb-1">Active Contributors</h4>
                <p className="text-sm text-[#454545]">Ensures contributors stay engaged and keep content updated and relevant.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#272262] mb-1">Platform Value</h4>
                <p className="text-sm text-[#454545]">Less than ฿30/day to reach thousands of qualified leads searching for visa help.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white border border-[#E7E7E7] rounded-lg">
            <p className="text-sm text-[#454545]">
              <strong className="text-[#272262]">Think of it this way:</strong> ฿900/month is less than the cost of ONE business lunch, but gives you access to thousands of potential clients actively seeking visa expertise. Your profile stays visible as long as you're subscribed.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Simple Pricing */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#272262] mb-3">Simple, Transparent Pricing</h2>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-5xl font-bold text-[#272262]">฿900</span>
            <span className="text-[#454545]">/month</span>
          </div>
          <p className="text-[#454545] mb-6">Cancel anytime. No long-term contracts. No hidden fees.</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="text-left p-4 bg-[#F8F9FA] rounded-lg border border-[#E7E7E7]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-bold text-[#272262]">Included</span>
              </div>
              <ul className="space-y-2 text-sm text-[#454545]">
                <li>• Unlimited post publishing</li>
                <li>• Public profile with bio</li>
                <li>• Website link in profile</li>
                <li>• Author credit on all posts</li>
                <li>• SEO-optimized content</li>
              </ul>
            </div>

            <div className="text-left p-4 bg-[#F8F9FA] rounded-lg border border-[#E7E7E7]">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#272262]" />
                <span className="font-bold text-[#272262]">Requirements</span>
              </div>
              <ul className="space-y-2 text-sm text-[#454545]">
                <li>• Real full name required</li>
                <li>• Accurate information only</li>
                <li>• Posts moderated before publish</li>
                <li>• Professional, helpful tone</li>
                <li>• Active subscription = visible profile</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Application Form */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <h2 className="text-3xl font-bold text-[#272262] mb-6">Apply to Become a Contributor</h2>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <Label className="text-[#454545] mb-2 block">Full Name *</Label>
            <Input
              value={applicationData.full_name}
              onChange={(e) => setApplicationData({ ...applicationData, full_name: e.target.value })}
              placeholder="Your full name (will be displayed publicly)"
              required
              className="border-[#E7E7E7]"
            />
            <p className="text-xs text-[#454545] mt-1">Real names only - builds trust with readers</p>
          </div>

          <div>
            <Label className="text-[#454545] mb-2 block">Short Bio *</Label>
            <Textarea
              value={applicationData.bio}
              onChange={(e) => setApplicationData({ ...applicationData, bio: e.target.value })}
              placeholder="Tell us about your Thailand visa experience (100-300 characters)..."
              rows={4}
              required
              className="border-[#E7E7E7]"
            />
            <p className="text-xs text-[#454545] mt-1">This appears on your public profile</p>
          </div>

          <div>
            <Label className="text-[#454545] mb-2 block">Areas of Expertise *</Label>
            <Input
              value={applicationData.expertise_areas}
              onChange={(e) => setApplicationData({ ...applicationData, expertise_areas: e.target.value })}
              placeholder="Retirement Visa, DTV, Business Visa, etc. (comma-separated)"
              required
              className="border-[#E7E7E7]"
            />
          </div>

          <div>
            <Label className="text-[#454545] mb-2 block">Why do you want to become a contributor? *</Label>
            <Textarea
              value={applicationData.application_text}
              onChange={(e) => setApplicationData({ ...applicationData, application_text: e.target.value })}
              placeholder="Share your qualifications, experience, and what value you'll provide to our community..."
              rows={6}
              required
              className="border-[#E7E7E7]"
            />
            <p className="text-xs text-[#454545] mt-1">Help us understand why you're a good fit (200+ characters)</p>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-xl p-6">
            <h3 className="font-bold text-[#272262] mb-3">We're Looking For:</h3>
            <ul className="space-y-2 text-sm text-[#454545]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Visa professionals (agents, lawyers, consultants)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Experienced expats with deep visa knowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Commitment to accuracy and helping others</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Clear, helpful communication style</span>
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={applyMutation.isPending}
            className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-6 text-lg"
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Submit Application
              </>
            )}
          </Button>

          <p className="text-xs text-[#454545] text-center">
            After approval, you'll be invited to subscribe and start contributing immediately. Response within 24-48 hours.
          </p>
        </form>
      </GlassCard>

      {/* Final CTA */}
      <GlassCard className="p-8 bg-gradient-to-br from-[#BF1E2E] to-[#d94656] border-none text-white text-center" hover={false}>
        <h3 className="text-2xl font-bold mb-3">Questions About Becoming a Contributor?</h3>
        <p className="mb-6 text-white/90">Get in touch with our team - we're here to help.</p>
        <Button 
          onClick={() => window.location.href = 'mailto:contact@thainexus.co.th'}
          className="bg-white hover:bg-gray-50 text-[#BF1E2E] font-semibold"
        >
          Email Us: contact@thainexus.co.th
        </Button>
      </GlassCard>
    </div>
  );
}