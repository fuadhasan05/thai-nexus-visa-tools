
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadFile, getPublicUrl } from '@/lib/supabaseUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Lock, CheckCircle2, Upload, FileText, Download,
  AlertCircle, Shield, Sparkles, Eye, Trash2, FolderOpen, FileCheck, Crown, Loader2, ExternalLink,
  MapPin, Clock, Phone, Mail, HelpCircle, CreditCard, ArrowRight, Languages, MessageSquare, Star, Zap
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SEOHead from '../../components/SEOHead';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PDFFormBuilder from '../../components/PDFFormBuilder';
import { useError } from '../../components/ErrorNotification';
import ContactCTA from '../../components/ContactCTA';

export default function PacketBuilder() {
  const [selectedVisa, setSelectedVisa] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchaseEmail, setPurchaseEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const { addError, addSuccess } = useError();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-packet'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user ?? null;
    },
    retry: false
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: access } = useQuery({
    queryKey: ['packet-access', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const { data, error } = await supabase
        .from('PacketBuilderAccess')
        .select('*')
        .eq('user_email', currentUser.email)
        .eq('access_granted', true)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!currentUser?.email
  });

  const hasAccess = isAdmin || !!access;

  // Standard visas included in lifetime access
  const standardVisas = [
    { value: 'retirement-extension', label: 'Retirement Extension (Non-O)', price: 2990 },
    { value: 'retirement-oa', label: 'Retirement O-A (Outside Thailand)', price: 2990 },
    { value: 'business-extension', label: 'Business Extension (Non-B)', price: 3990 },
    { value: 'marriage-extension', label: 'Marriage Extension (Non-O)', price: 2990 },
    { value: 'education-extension', label: 'Education Extension (Non-ED)', price: 2490 },
    { value: 'dependent-extension', label: 'Dependent Extension (Non-O)', price: 2490 },
    { value: 'dtv-application', label: 'DTV Application', price: 3490 },
    { value: 'non-o-inside', label: 'Non-O Visa (Inside Thailand)', price: 2990 },
    { value: 'tourist-extension', label: 'Tourist Extension (30 days)', price: 990 },
    { value: 'ninety-day-report', label: '90-Day Report (TM.47)', price: 490 },
    { value: 're-entry-permit', label: 'Re-Entry Permit', price: 490 },
    { value: 'thai-child-visa', label: 'Thai Child Visa (Non-O)', price: 2990 },
    { value: 'volunteer-visa', label: 'Volunteer Visa (Non-O)', price: 3490 }
  ];

  // Premium visas sold separately
  const premiumVisas = [
    { value: 'ltr-visa', label: 'LTR Visa (Long-Term Resident)', price: 7990, isPremium: true },
    { value: 'smart-visa', label: 'SMART Visa', price: 8990, isPremium: true },
    { value: 'elite-visa', label: 'Thailand Elite Visa', price: 9990, isPremium: true },
    { value: 'investment-visa', label: 'Investment Visa (Non-IB/IM)', price: 9990, isPremium: true }
  ];

  const handlePurchase = async (visaType) => {
    setCheckoutError('');
    const email = currentUser?.email || purchaseEmail;

    if (!email) {
      setCheckoutError('Please enter your email address to continue');
      addError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCheckoutError('Please enter a valid email address');
      addError('Invalid email format');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('createPacketCheckout', {
        body: JSON.stringify({
          visa_type: visaType,
          user_email: email,
          success_url: window.location.origin + '/tools/packet-builder?success=true',
          cancel_url: window.location.origin + '/tools/packet-builder?cancelled=true'
        })
      });

      if (fnError) throw fnError;

      if (fnData?.url) {
        window.location.href = fnData.url;
      } else if (fnData?.error) {
        setCheckoutError(fnData.error);
        addError(fnData.error);
      } else {
        setCheckoutError('Failed to create checkout session. Please try again.');
        addError('Checkout failed - no URL received');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';
      setCheckoutError(errorMessage);
      addError('Checkout failed: ' + errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero */}
  <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-purple-600 via-indigo-600 to-blue-600 p-1">
          <div className="bg-linear-to-br from-white via-purple-50 to-blue-50 rounded-[22px] p-12 md:p-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 text-white mb-6 shadow-xl">
                <Crown className="w-5 h-5" />
                <span className="font-bold">Premium Visa Application Suite</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#272262] mb-6 leading-tight">
                Build Perfect Visa Applications
                <br />
                <span className="bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Every Single Time</span>
              </h1>
                <p className="text-xl text-[#454545] max-w-3xl mx-auto leading-relaxed">
                The only tool you will ever need for Thai visa applications. AI-powered validation, professional PDF generation, and expert guidance - all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-purple-200 hover:scale-105 transition-transform">
                <div className="text-4xl font-bold text-purple-600 mb-1">4,950฿</div>
                <div className="text-sm text-[#454545]">Lifetime Access</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-blue-200 hover:scale-105 transition-transform">
                <div className="text-4xl font-bold text-blue-600 mb-1">990</div>
                <div className="text-sm text-[#454545]">Bonus AI Credits</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-green-200 hover:scale-105 transition-transform">
                <div className="text-4xl font-bold text-green-600 mb-1">13+</div>
                <div className="text-sm text-[#454545]">Visa Types</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#272262] mb-4">Everything You Need, Nothing You Don&apos;t</h2>
            <p className="text-xl text-[#454545]">Professional-grade tools that actually work</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">AI Form Filling</h3>
              <p className="text-[#454545] leading-relaxed">
                Upload your passport and watch as AI auto-fills every Thai Immigration form perfectly. No more manual data entry mistakes.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Document Validation</h3>
              <p className="text-[#454545] leading-relaxed">
                AI checks your documents against official requirements. Catches photo size errors, missing signatures, and invalid formats before you submit.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">PDF Generation</h3>
              <p className="text-[#454545] leading-relaxed">
                Fill Thai forms digitally with professional blue pen style. Print and sign - no more handwriting forms or making mistakes.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mb-6 shadow-lg">
                <Languages className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Document Translation</h3>
                <p className="text-[#454545] leading-relaxed">
                Upload Thai documents and get instant AI translations with explanations. Finally understand what you are signing.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Pre-Flight Checks</h3>
              <p className="text-[#454545] leading-relaxed">
                Final validation before submission. Catches every missing document, wrong photo size, or error that could get you rejected.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mb-6 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Priority Support</h3>
              <p className="text-[#454545] leading-relaxed">
                Direct access to Thai Nexus team. Get answers in hours, not days. We are here to help you succeed.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Email Input for Non-Logged Users */}
        {!currentUser && (
          <GlassCard className="p-8 bg-linear-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="max-w-xl mx-auto text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#272262] mb-3">Enter Your Email to Continue</h3>
              <p className="text-[#454545] mb-6">We will send your purchase receipt and access link to this email</p>
              <Input
                type="email"
                value={purchaseEmail}
                onChange={(e) => {
                  setPurchaseEmail(e.target.value);
                  setCheckoutError('');
                }}
                placeholder="your@email.com"
                className="h-14 text-lg mb-3"
              />
              <p className="text-xs text-[#454545]">
                Create an account anytime to access your purchase
              </p>
            </div>
          </GlassCard>
        )}

        {/* Error Display */}
        {checkoutError && (
          <GlassCard className="p-6 bg-red-50 border-2 border-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Checkout Error</h3>
                <p className="text-red-700 text-sm">{checkoutError}</p>
                <Button
                  onClick={() => setCheckoutError('')}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-600 text-red-600 hover:bg-red-50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Pricing Options */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Lifetime Access */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="px-6 py-2 rounded-full bg-linear-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-xl flex items-center gap-2">
                <Star className="w-4 h-4" />
                BEST VALUE
              </div>
            </div>
            <GlassCard className="p-8 border-4 border-purple-400 bg-linear-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <Crown className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-[#272262] mb-3">Lifetime Access</h3>
                  <p className="text-[#454545] mb-6">All standard visa types • Forever</p>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-bold text-[#272262]">฿4,950</span>
                  </div>
                  <p className="text-[#454545] text-sm mb-1">One-time payment • No subscriptions</p>
                  <p className="text-purple-600 font-bold text-sm">+ 990 bonus AI credits (20% free)</p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    'Unlimited applications for 13 standard visa types',
                    'All future standard visa updates included',
                    'AI document validation & translation',
                    'Digital PDF form generation',
                    'Priority support from Thai Nexus team',
                    '30-day money-back guarantee'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/80 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-[#454545] font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase('lifetime-access')}
                  disabled={checkoutLoading || (!currentUser && !purchaseEmail)}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-7 text-xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  {checkoutLoading ? (
                    <><Loader2 className="w-6 h-6 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Crown className="w-6 h-6 mr-2" />Get Lifetime Access</>
                  )}
                </Button>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-[#454545] font-medium text-center">
                    Includes: Retirement, Business, Marriage, Education, DTV, Dependent, Tourist, 90-Day Reports, Re-Entry Permits, and more
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Individual Packages */}
          <GlassCard className="p-8 h-full flex flex-col">
            <div className="text-center mb-6">
              <Package className="w-12 h-12 text-[#272262] mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-[#272262] mb-3">Individual Packages</h3>
              <p className="text-[#454545]">Purchase for a specific visa type</p>
            </div>

            <div className="flex-1 space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
              {standardVisas.map((visa) => (
                <div key={visa.value} className="border-2 border-[#E7E7E7] rounded-xl p-4 hover:border-[#272262] transition-all bg-white">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-[#272262] mb-1">{visa.label}</p>
                      <p className="text-xs text-[#454545]">+ {Math.floor((visa.price / 100) * 20)} AI credits</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#272262] mb-2">฿{visa.price.toLocaleString()}</div>
                      <Button
                        onClick={() => handlePurchase(visa.value)}
                        disabled={checkoutLoading || (!currentUser && !purchaseEmail)}
                        size="sm"
                        className="bg-[#272262] hover:bg-[#1d1847] text-white"
                      >
                        {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-linear-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-[#454545] font-medium">
                  Need 2+ visa types? <span className="text-blue-600 font-bold">Lifetime Access saves you money!</span>
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Premium Visas */}
  <GlassCard className="p-12 bg-linear-to-br from-yellow-50 via-white to-orange-50 border-4 border-yellow-400">
          <div className="flex items-start gap-6 mb-8">
            <Crown className="w-16 h-16 text-yellow-600 shrink-0" />
            <div>
              <h2 className="text-4xl font-bold text-[#272262] mb-3">Premium Visa Packages</h2>
              <p className="text-xl text-[#454545]">For specialized, high-value visas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {premiumVisas.map((visa) => (
              <GlassCard key={visa.value} className="p-6 border-2 border-yellow-300 bg-white hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <h4 className="text-xl font-bold text-[#272262]">{visa.label}</h4>
                </div>
                <div className="text-4xl font-bold text-[#272262] mb-2">฿{visa.price.toLocaleString()}</div>
                <p className="text-sm text-[#454545] mb-4">+ {Math.floor((visa.price / 100) * 20)} bonus AI credits</p>
                <Button
                  onClick={() => handlePurchase(visa.value)}
                  disabled={checkoutLoading || (!currentUser && !purchaseEmail)}
                  className="w-full bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                >
                  {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Purchase Premium'}
                </Button>
              </GlassCard>
            ))}
          </div>
        </GlassCard>

        {/* Guarantees */}
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-8 bg-green-50 border-2 border-green-300">
            <div className="flex items-start gap-4">
              <Shield className="w-12 h-12 text-green-600 shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-[#272262] mb-3">30-Day Money Back Guarantee</h3>
                  <p className="text-[#454545] leading-relaxed">
                  Not satisfied? Full refund within 30 days, no questions asked. We are confident this tool will save you time, money, and stress.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 bg-blue-50 border-2 border-blue-300">
            <div className="flex items-start gap-4">
              <Lock className="w-12 h-12 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-[#272262] mb-3">Secure & Private</h3>
                <p className="text-[#454545] leading-relaxed">
                  Stripe payment processing • Documents encrypted • Purchase by email, create account anytime • Instant document deletion on request
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <ContactCTA message="Questions about Premium Access?" />
      </div>
    );
  }

  return <PacketBuilderTool selectedVisa={selectedVisa} setSelectedVisa={setSelectedVisa} currentUser={currentUser} />;
}

function PacketBuilderTool({ selectedVisa, setSelectedVisa, currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [passportData, setPassportData] = useState(null);
  const [translatingDoc, setTranslatingDoc] = useState(null);
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();

  const { data: credits } = useQuery({
    queryKey: ['user-credits-packet', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const { data, error } = await supabase.from('UserCredits').select('*').eq('user_email', currentUser.email).limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!currentUser?.email
  });

  const allVisas = [
    'retirement-extension', 'retirement-oa', 'business-extension', 'marriage-extension',
    'education-extension', 'dependent-extension', 'dtv-application', 'non-o-inside',
    'tourist-extension', 'ninety-day-report', 're-entry-permit', 'thai-child-visa',
    'volunteer-visa', 'ltr-visa', 'smart-visa', 'elite-visa', 'investment-visa'
  ];

  // Visa metadata with official vs agent ways
  const visaMeta = {
    'retirement-extension': {
      name: 'Retirement Extension (Non-O)',
      icon: '🏖️',
      waysToApply: {
        official: {
          title: 'DIY at Immigration Office',
          description: 'Apply directly at your local Thai Immigration office. This is the standard government route.',
          steps: [
            'Gather all required documents (passport, bank statements, TM.30, photos)',
            'Visit immigration office early morning (7-8 AM recommended to avoid crowds)',
            'Submit TM.7 application form with 1,900 THB fee',
            'Wait for processing (usually same day or next day)',
            'Receive 1-year extension stamp in passport'
          ],
          cost: '1,900 THB government fee',
          time: '1-2 days (including preparation)',
          difficulty: 'Medium - requires document preparation and understanding Thai Immigration procedures'
        },
        agent: {
          title: 'Through Thai Nexus or Agent',
          description: 'Professional assistance ensures everything is correct and handled smoothly.',
          benefits: [
            'Complete document review before submission',
            'Agent accompanies you to immigration',
            'Professional advice on any issues',
            'Faster processing with experienced handling',
            'Reduces stress and ensures compliance'
          ],
          contactInfo: {
            whatsapp: '+66923277723',
            email: 'contact@thainexus.co.th',
            line: '@thainexus'
          },
          estimatedCost: '5,000-8,000 THB (including government fee)',
          note: 'For personalized pricing and detailed assistance, contact Thai Nexus directly'
        }
      }
    },
    'retirement-oa': {
      name: 'Retirement O-A (Outside Thailand)',
      icon: '✈️',
      waysToApply: {
        official: {
          title: 'Apply at Thai Embassy/Consulate',
          description: 'Must be applied from OUTSIDE Thailand at your home country Thai embassy.',
          steps: [
            'Must be 50+ years old',
            'Gather financial proof: 800,000 THB in bank OR 65,000 THB/month pension (last 6+ months)',
            'Obtain health insurance: 40,000 THB outpatient / 400,000 THB inpatient coverage',
            'Get police clearance certificate from home country',
            'Medical certificate within 3 months',
            'Apply at Thai embassy with all documents',
            'Wait 3-5 business days for processing',
            'Receive 1-year O-A visa (multiple entry)',
            'Enter Thailand and activate visa'
          ],
          cost: 'Embassy fee varies by country (approx. 2,000-5,000 THB)',
          time: '1-2 weeks including document preparation',
          difficulty: 'Medium - requires specific financial and health requirements'
        },
        agent: {
          title: 'Thai Nexus Assistance',
          description: 'We guide you through the entire embassy application process from abroad.',
          benefits: [
            'Document checklist and review',
            'Health insurance recommendations',
            'Embassy appointment scheduling help',
            'Application form assistance',
            'Follow-up with embassy if needed'
          ],
          contactInfo: {
            whatsapp: '+66923277723',
            email: 'contact@thainexus.co.th'
          },
          note: 'Contact Thai Nexus for remote assistance with your O-A application'
        }
      }
    }
  };

  const selectedMeta = visaMeta[selectedVisa];

  const HelpTooltip = ({ text }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex">
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 text-white">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const handleUploadDocument = async (file) => {
    setUploadingDoc(true);
    try {
      const path = `uploads/${Date.now()}_${file.name}`;
      const { data: upData, error: upErr } = await uploadFile('base44-prod', path, file);
      if (upErr) throw upErr;
      const fileUrl = getPublicUrl('base44-prod', path);

      setDocuments(prev => [...prev, {
        name: file.name,
        type: file.type,
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      }]);

      addSuccess('Document uploaded successfully!');
    } catch (error) {
      addError('Upload failed: ' + (error?.message || String(error)));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleTranslate = async (doc) => {
    if (!credits || credits.credits_balance < 1) {
      addError('Insufficient credits. Top up in your Profile to use document translation.');
      return;
    }

    setTranslatingDoc(doc.name);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('invokeOpenAI', {
        body: JSON.stringify({
          prompt: `Translate and explain this Thai document in simple English. Provide:\n1. Document type (what it is)\n2. Full translation\n3. Important details highlighted\n4. What this document is typically used for\n\nBe detailed and clear for someone who doesn't read Thai.`,
          file_urls: [doc.url],
          response_json_schema: {
            type: "object",
            properties: {
              document_type: { type: "string" },
              translation: { type: "string" },
              important_points: { type: "array", items: { type: "string" } },
              purpose: { type: "string" }
            }
          },
          model: "gpt-4o-mini"
        })
      });

      if (fnError) throw fnError;

      // Deduct credit and append transaction record
      const newTransaction = {
        description: 'Document translation',
        date: new Date().toISOString()
      };

      const { data: updatedCredits, error: creditErr } = await supabase
        .from('UserCredits')
        .update({
          credits_balance: credits.credits_balance - 1,
          credits_used: (credits.credits_used || 0) + 1,
          transaction_history: [
            ...(credits.transaction_history || []),
            newTransaction
          ],
        })
        .eq('id', credits.id)
        .select()
        .single();
      if (creditErr) throw creditErr;

      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits-packet'] });

      // Determine translation result (support multiple response shapes)
      const translationResult = fnData?.translation || fnData?.translated_content || fnData || null;

      // Update document with translation
      setDocuments(prev => prev.map(d =>
        d.name === doc.name ? { ...d, translation: translationResult } : d
      ));
      addSuccess('Document translated successfully!');
    } catch (error) {
      addError('Translation failed: ' + error.message);
    } finally {
      setTranslatingDoc(null);
    }
  };

  return (
    <>
      <SEOHead page="PacketBuilder" />
      <div className="max-w-7xl mx-auto space-y-8">
  <GlassCard className="p-8 text-center bg-linear-to-br from-purple-50 to-blue-50" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 mb-4">
          <Crown className="w-4 h-4 text-purple-600" />
          <span className="text-purple-700 text-sm font-medium">Premium Access Active • {credits?.credits_balance || 0} AI Credits</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Visa Application Assistant</h1>
        <p className="text-gray-600">Everything you need from start to finish</p>
      </GlassCard>

      <GlassCard className="p-8">
        <Label className="text-gray-700 mb-3 block font-medium text-lg">Select Your Visa Type</Label>
        <Select value={selectedVisa} onValueChange={setSelectedVisa}>
          <SelectTrigger className="h-14 text-lg">
            <SelectValue placeholder="Choose the visa you're applying for" />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            {allVisas.map(key => (
              <SelectItem key={key} value={key}>
                {visaMeta[key]?.icon} {visaMeta[key]?.name || key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlassCard>

      {selectedVisa && selectedMeta && (
        <>
          <GlassCard className="p-8 bg-linear-to-br from-blue-50 to-cyan-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ways to Apply for {selectedMeta.name}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-blue-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMeta.waysToApply.official.title}</h3>
                </div>

                <p className="text-gray-700 text-sm mb-4">{selectedMeta.waysToApply.official.description}</p>

                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-2">Steps:</p>
                    <ol className="space-y-2">
                      {selectedMeta.waysToApply.official.steps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="font-bold text-blue-600">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm"><strong>Cost:</strong> {selectedMeta.waysToApply.official.cost}</p>
                    <p className="text-sm"><strong>Time:</strong> {selectedMeta.waysToApply.official.time}</p>
                    <p className="text-sm"><strong>Difficulty:</strong> {selectedMeta.waysToApply.official.difficulty}</p>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMeta.waysToApply.agent.title}</h3>
                </div>

                <p className="text-gray-700 text-sm mb-4">{selectedMeta.waysToApply.agent.description}</p>

                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-2">Benefits:</p>
                    <ul className="space-y-2">
                      {selectedMeta.waysToApply.agent.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedMeta.waysToApply.agent.estimatedCost && (
                    <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-gray-900 mb-1">Estimated Cost:</p>
                      <p className="text-sm text-gray-700">{selectedMeta.waysToApply.agent.estimatedCost}</p>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-3">Contact Thai Nexus:</p>
                    <div className="space-y-2">
                      <a
                        href="https://wa.me/66923277723"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        WhatsApp: +66923277723
                      </a>
                      <a
                        href="https://line.me/ti/p/@thainexus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Line: @thainexus
                      </a>
                      <a
                        href="mailto:contact@thainexus.co.th"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Mail className="w-4 h-4" />
                        Email: contact@thainexus.co.th
                      </a>
                    </div>
                  </div>

                  {selectedMeta.waysToApply.agent.note && (
                    <p className="text-xs text-gray-600 italic">{selectedMeta.waysToApply.agent.note}</p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          <PDFFormBuilder visaType={selectedVisa} />

          <GlassCard className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-gray-900 mb-2">Digital Form Filling Active</p>
                <p className="text-gray-700 text-sm">
                  Fill out official Thai Immigration forms digitally with our PDF form builder. Text appears in professional blue pen style.
                  <strong className="text-red-600"> Remember: Sign with a physical pen after printing - never sign digitally!</strong>
                </p>
              </div>
            </div>
          </GlassCard>
        </>
      )}
      </div>
    </>
  );
}
