import React from 'react';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { Compass, FileCheck, Calendar, Calculator, Building2, Navigation, Scale, Shield, CheckCircle, MapPin, DollarSign, Users, Star, ArrowRight, Zap, Crown, Sparkles, FileText, Globe, CheckCircle2 } from 'lucide-react';
import ToolCard from '@/components/ToolCardFixed';
import GlassCard from '@/components/GlassCard';
import ContactCTA from '@/components/ContactCTA';
import { useTranslation } from '@/components/TranslationProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

const ENGLISH_CONTENT = {
  hero: {
    badge: 'Trusted by Expats in Thailand',
    title: 'Get Your Thailand Visa Right',
    subtitle: 'The First Time',
    description: 'Stop guessing. Stop worrying. Use the same tools that helped thousands of expats successfully get their Thai visas without rejections or wasted money.',
    cta_primary: 'Find Your Visa Now',
    cta_secondary: 'See How It Works', // This will be replaced by a fixed string "Select Your Tool"
    stats: {
      tools: 'Free Tools',
      success: 'Success Rate',
      saved: 'Average Saved'
    }
  },
  problem: {
    title: 'Tired of Confusing Visa Information?',
    subtitle: "You're not alone. Most expats struggle with these exact problems:",
    issues: [
      'Reading 50 different forum posts with conflicting advice',
      'Worrying your visa application will be rejected',
      'Not knowing if you even qualify for a visa',
      'Confused by constantly changing requirements',
      'Wasting money on the wrong visa type',
      'Missing critical deadlines and facing overstay fines'
    ]
  },
  solution: {
    badge: 'Your Solution',
    title: 'Everything You Need in One Place',
    subtitle: 'We turned the complicated Thai visa process into simple, step-by-step tools that anyone can use.',
    cta: 'Start For Free'
  },
  tools: {
    title: 'Choose Your Tool',
    subtitle: 'Pick what you need help with right now' // This subtitle will be replaced by a fixed string
  },
  how_it_works: {
    title: 'How It Works',
    subtitle: 'Get your visa sorted in 3 simple steps',
    steps: [
      {
        number: '1',
        title: 'Tell Us Your Situation',
        description: 'Answer a few quick questions about your goals and circumstances'
      },
      {
        number: '2',
        title: 'Get Your Personalized Plan',
        description: 'Receive a clear, step-by-step roadmap tailored exactly to you'
      },
      {
        number: '3',
        title: 'Follow Your Roadmap',
        description: 'Complete each step with confidence. Get expert help if you need it'
      }
    ]
  },
  social_proof: {
    title: 'Join Thousands of Successful Expats',
    testimonials: [
      {
        text: 'I was so confused about retirement visas. This tool showed me exactly what I needed in 5 minutes. Got approved on first try.',
        author: 'John M.',
        location: 'USA → Chiang Mai',
        visa: 'Retirement Visa'
      },
      {
        text: 'Saved me $800 by showing me I could do it myself. The document checker caught 3 mistakes before I submitted.',
        author: 'Sarah L.',
        location: 'UK → Bangkok',
        visa: 'DTV Visa'
      },
      {
        text: 'Finally, someone explains Thai visas in plain English. No confusing legal jargon. Just what you need to know.',
        author: 'Michael R.',
        location: 'Australia → Phuket',
        visa: 'Marriage Visa'
      }
    ]
  },
  trust: {
    title: 'Why Choose Thai Nexus?',
    reasons: [
      {
        title: 'Built by Expats, for Expats',
        description: "We've been through this ourselves. Every tool is designed based on real visa experiences in Thailand - the confusion, the mistakes, the stress. We built what we wish existed when we started.",
        icon: Users
      },
      {
        title: 'Official Sources Only',
        description: 'Every piece of information comes directly from Thai Immigration and government websites. We check and update regularly to ensure accuracy.',
        icon: Shield
      },
      {
        title: 'Constantly Improving',
        description: "We're a new startup listening to every user. Your feedback directly shapes our tools. If something doesn't work for you, we fix it fast.",
        icon: Zap
      },
      {
        title: 'Expert Support When Needed',
        description: "DIY not your thing? We partner with verified visa specialists who can take over and handle everything professionally.",
        icon: CheckCircle
      }
    ]
  },
  premium_builder: {
    badge: 'Premium Tool',
    title: 'Complete Visa Application Builder',
    subtitle: 'The all-in-one solution for rejection-proof applications',
    price: '฿4,950 lifetime access',
    features: [
      {
        title: 'AI-Powered Form Filling',
        description: 'Auto-fill Thai Immigration forms with passport OCR and smart suggestions. No more mistakes.',
        icon: Sparkles
      },
      {
        title: 'Document Validation System',
        description: 'Upload your documents and photos. AI checks everything against official requirements before you submit.',
        icon: Shield
      },
      {
        title: 'Digital PDF Generation',
        description: 'Fill and digitally sign official Thai forms. Professional blue pen style text on all documents.',
        icon: FileText
      },
      {
        title: 'Live Document Translation',
        description: 'Upload Thai documents and get instant AI translations with explanations. Understand everything.',
        icon: Globe
      },
      {
        title: 'Pre-Flight Verification',
        description: 'Final comprehensive check before submission. Catch every missing document, wrong photo size, or error.',
        icon: CheckCircle2
      },
      {
        title: 'Priority Support',
        description: 'Direct access to Thai Nexus team for questions and guidance throughout your application.',
        icon: Users
      }
    ],
    benefits: [
      'Lifetime access to all standard visa types',
      '990 bonus AI credits included',
      'Unlimited applications forever',
      '30-day money-back guarantee',
      'Free future updates'
    ],
    cta: 'Get Premium Access'
  },
  final_cta: {
    title: 'Ready to Sort Out Your Thai Visa?',
    subtitle: "Stop wasting time on confusing information. Let's find your perfect visa solution right now.",
    cta: 'Get Started Free',
    note: 'No credit card required • Takes 3 minutes'
  }
};

// Removed getStaticProps to allow normal rendering
export default function Home() {
  const { getTranslation } = useTranslation();
  const content = {
    hero: getTranslation('home', 'hero', ENGLISH_CONTENT.hero),
    problem: getTranslation('home', 'problem', ENGLISH_CONTENT.problem),
    solution: getTranslation('home', 'solution', ENGLISH_CONTENT.solution),
    tools: getTranslation('home', 'tools', ENGLISH_CONTENT.tools),
    howItWorks: getTranslation('home', 'how_it_works', ENGLISH_CONTENT.how_it_works),
    socialProof: getTranslation('home', 'social_proof', ENGLISH_CONTENT.social_proof),
    trust: getTranslation('home', 'trust', ENGLISH_CONTENT.trust),
    premiumBuilder: getTranslation('home', 'premium_builder', ENGLISH_CONTENT.premium_builder),
    finalCta: getTranslation('home', 'final_cta', ENGLISH_CONTENT.final_cta)
  };

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-home'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data?.user || null;
    },
    retry: false
  });

  const isAdmin = currentUser?.role === 'admin';

  const toolsArray = [
    {
      title: 'Visa Finder',
      description: "Not sure which visa you need? Answer 5 quick questions and we'll tell you exactly which visa you qualify for.",
      features: ['Takes 3 minutes', 'Personalized results', 'No signup required'],
      icon: Compass,
      color: 'bg-gradient-to-br from-[#272262] to-[#3d3680]',
      page: 'VisaNavigator'
    },
    {
      title: 'Document Checker',
      description: 'Upload your documents and photos. Our AI checks everything against official requirements before you submit.',
      features: ['Photo validator', 'Requirement checker', 'Mistake prevention'],
      icon: FileCheck,
      color: 'bg-gradient-to-br from-[#BF1E2E] to-[#d94656]',
      page: 'DocumentValidator'
    },
    {
      title: '90-Day Report Tracker',
      description: 'Never miss a deadline again. Automatic reminders ensure you file your 90-day report on time, every time.',
      features: ['Automatic calculations', 'Email reminders', 'Deadline tracking'],
      icon: Calendar,
      color: 'bg-gradient-to-br from-[#272262] to-[#3d3680]',
      page: 'AdminManager'
    },
    {
      title: 'Qualification Check',
      description: 'Find out instantly which Thai visas you qualify for based on your age, income, savings, and goals.',
      features: ['Instant results', 'All visa types', 'Clear requirements'],
      icon: Calculator,
      color: 'bg-gradient-to-br from-[#BF1E2E] to-[#d94656]',
      page: 'EligibilityCalculator'
    },
    {
      title: 'Immigration Office Finder',
      description: 'Find the nearest immigration office with live GPS directions. See hours, services, and get turn-by-turn navigation.',
      features: ['GPS directions', 'Office hours', 'Service information'],
      icon: MapPin,
      color: 'bg-gradient-to-br from-[#272262] to-[#3d3680]',
      page: 'ImmigrationMap'
    },
    {
      title: 'Office Visit Simulator',
      description: 'Practice your immigration office visit before you go. Know exactly what to expect and what to bring.',
      features: ['Step-by-step guide', 'Visual walkthrough', 'Preparation checklist'],
      icon: Building2,
      color: 'bg-gradient-to-br from-[#BF1E2E] to-[#d94656]',
      page: 'ImmigrationSimulator'
    },
    {
      title: 'Long-Term Planner',
      description: 'Plan your visa strategy for years ahead. See which visa transitions make sense for your long-term goals.',
      features: ['Multi-year planning', 'Visa transitions', 'Strategic roadmap'],
      icon: Navigation,
      color: 'bg-gradient-to-br from-[#272262] to-[#3d3680]',
      page: 'PathwayPlanner'
    },
    {
      title: 'Cost Calculator',
      description: 'Compare DIY vs agent costs. See exactly how much money you can save by doing it yourself.',
      features: ['DIY comparison', 'Time estimates', 'Money savings'],
      icon: Scale,
      color: 'bg-gradient-to-br from-[#BF1E2E] to-[#d94656]',
      page: 'AgentComparison'
    },
    {
      title: 'Currency Converter',
      description: 'Quickly convert visa costs between Thai Baht and your home currency. Always see the real price.',
      features: ['Live rates', 'Multiple currencies', 'Quick reference'],
      icon: DollarSign,
      color: 'bg-gradient-to-br from-[#272262] to-[#3d3680]',
      page: 'CurrencyConverter'
    }
  ];

  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools-section');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F1F1F1] to-white">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'url("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/7815cade9_90322836-ec4b-47ae-8a8c-e87b3952a4bb.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/90" />
        </div>

        {/* Floating animated dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-dot" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
          <div className="floating-dot" style={{ left: '80%', top: '30%', animationDelay: '2s' }} />
          <div className="floating-dot" style={{ left: '60%', top: '70%', animationDelay: '4s' }} />
          <div className="floating-dot" style={{ left: '20%', top: '80%', animationDelay: '1s' }} />
          <div className="floating-dot" style={{ left: '90%', top: '15%', animationDelay: '3s' }} />
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) scale(1.1); opacity: 0.6; }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .floating-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, #272262, #BF1E2E);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
          }
          .hero-content > * {
            animation: slide-up 0.8s ease-out backwards;
          }
          .hero-content > *:nth-child(1) { animation-delay: 0.1s; }
          .hero-content > *:nth-child(2) { animation-delay: 0.2s; }
          .hero-content > *:nth-child(3) { animation-delay: 0.3s; }
          .hero-content > *:nth-child(4) { animation-delay: 0.4s; }
          .hero-content > *:nth-child(5) { animation-delay: 0.5s; }
        `}</style>

        <div className="relative z-10 w-full px-6 md:px-12 py-16 md:py-20 hero-content">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-[#E7E7E7] mb-6 shadow-lg">
              <Star className="w-4 h-4 text-[#BF1E2E]" />
              <span className="text-[#272262] text-sm font-medium">{content.hero.badge}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-[#272262] mb-4 leading-tight">
              {content.hero.title}
              <br />
              <span className="text-[#BF1E2E]">{content.hero.subtitle}</span>
            </h1>

            <p className="text-xl md:text-2xl text-[#454545] max-w-3xl mx-auto mb-8 leading-relaxed">
              {content.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={createPageUrl('VisaNavigator')}>
                <button className="px-8 py-4 bg-[#BF1E2E] hover:bg-[#9d1825] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  {content.hero.cta_primary} <ArrowRight className="inline w-5 h-5 ml-2" />
                </button>
              </Link>
              <button 
                onClick={scrollToTools}
                className="px-8 py-4 bg-white hover:bg-gray-50 text-[#272262] rounded-xl font-semibold text-lg border-2 border-[#E7E7E7] transition-all hover:scale-105"
              >
                Select Your Tool
              </button>
            </div>

            <div className="flex flex-wrap gap-6 justify-center">
              <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-[#E7E7E7] hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-[#272262]">9+</div>
                <div className="text-xs text-[#454545]">{content.hero.stats.tools}</div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-[#E7E7E7] hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-[#BF1E2E]">98%</div>
                <div className="text-xs text-[#454545]">{content.hero.stats.success}</div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-[#E7E7E7] hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-[#272262]">$600+</div>
                <div className="text-xs text-[#454545]">{content.hero.stats.saved}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <GlassCard className="p-8 md:p-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-[#272262] mb-4">{content.problem.title}</h2>
          <p className="text-xl text-[#454545]">{content.problem.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {content.problem.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E7E7E7]">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#BF1E2E] font-bold text-sm">✗</span>
              </div>
              <p className="text-[#454545]">{issue}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Solution Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
          <CheckCircle className="w-4 h-4 text-green-700" />
          <span className="text-green-700 text-sm font-medium">{content.solution.badge}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#272262] mb-4">{content.solution.title}</h2>
        <p className="text-xl text-[#454545] max-w-3xl mx-auto mb-8">{content.solution.subtitle}</p>
        <Link href={createPageUrl('VisaNavigator')}>
          <button className="px-8 py-4 bg-[#BF1E2E] hover:bg-[#9d1825] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
            {content.solution.cta} <ArrowRight className="inline w-5 h-5 ml-2" />
          </button>
        </Link>
      </div>

      {/* Tools Grid */}
      <div id="tools-section">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-4">
            <CheckCircle className="w-4 h-4 text-green-700" />
            <span className="text-green-700 text-sm font-medium">100% Free Forever</span>
          </div>
          <h2 className="text-4xl font-bold text-[#272262] mb-4">{content.tools.title}</h2>
          <p className="text-xl text-[#454545] max-w-2xl mx-auto">
            All 9 tools are completely free to use - no hidden costs, no credit card required
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsArray.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </div>
      </div>

      {/* Premium Application Builder - Enhanced */}
      {isAdmin && (
        <div className="relative overflow-hidden rounded-3xl border-4 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-8 md:p-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold flex items-center gap-2 shadow-xl">
                <Crown className="w-5 h-5" />
                {content.premiumBuilder.badge}
              </div>
              <div className="px-6 py-3 rounded-full bg-green-100 border-2 border-green-300 text-green-700 text-sm font-bold shadow-lg">
                {content.premiumBuilder.price}
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-[#272262] mb-4">{content.premiumBuilder.title}</h2>
              <p className="text-xl text-[#454545] max-w-3xl mx-auto leading-relaxed">{content.premiumBuilder.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {content.premiumBuilder.features.map((feature, i) => (
                <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200 hover:scale-105 transition-transform">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#272262] mb-3">{feature.title}</h3>
                  <p className="text-sm text-[#454545] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-200 shadow-xl mb-8">
              <h3 className="text-2xl font-bold text-[#272262] mb-6 text-center">What You Get:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {content.premiumBuilder.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-[#454545] font-medium text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link href={createPageUrl('PacketBuilder')}>
                <button className="px-12 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                  <Crown className="inline w-7 h-7 mr-3" />
                  {content.premiumBuilder.cta}
                </button>
              </Link>
              <p className="text-sm text-gray-600 mt-5 font-medium">Start building rejection-proof applications today</p>
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-100 border border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 text-xs font-medium">30-Day Money-Back Guarantee • Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <GlassCard className="p-8 md:p-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#272262] mb-4">{content.howItWorks.title}</h2>
          <p className="text-xl text-[#454545] max-w-2xl mx-auto">{content.howItWorks.subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
          {/* Connection lines - desktop only */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#E7E7E7] to-transparent" style={{ width: '80%', left: '10%' }} />
          
          {content.howItWorks.steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="text-center relative z-10">
                <div className={`w-20 h-20 ${
                  i === 0 ? 'bg-[#272262]' : 
                  i === 1 ? 'bg-[#BF1E2E]' : 
                  'bg-[#272262]'
                } text-white rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl font-bold shadow-xl hover:scale-110 transition-transform duration-300`}>
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-[#272262] mb-4">{step.title}</h3>
                <p className="text-[#454545] leading-relaxed text-lg">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Social Proof */}
      <div>
        <h2 className="text-4xl font-bold text-[#272262] text-center mb-12">{content.socialProof.title}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {content.socialProof.testimonials.map((testimonial, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-[#BF1E2E] text-[#BF1E2E]" />
                ))}
              </div>
              <p className="text-[#454545] mb-6 leading-relaxed">{testimonial.text}</p>
              <div className="border-t border-[#E7E7E7] pt-4">
                <p className="font-bold text-[#272262]">{testimonial.author}</p>
                <p className="text-sm text-[#454545]">{testimonial.location}</p>
                <p className="text-xs text-[#BF1E2E] font-medium mt-1">{testimonial.visa}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <GlassCard className="p-8 md:p-12">
        <h2 className="text-4xl font-bold text-[#272262] text-center mb-12">{content.trust.title}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {content.trust.reasons.map((reason, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0 shadow-md">
                <reason.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#272262] mb-2">{reason.title}</h3>
                <p className="text-[#454545] leading-relaxed">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <ContactCTA message="Have Questions? We're Here to Help" />

      {/* Final CTA */}
      <GlassCard className="p-12 text-center bg-gradient-to-br from-[#272262] to-[#3d3680]">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{content.finalCta.title}</h2>
        <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">{content.finalCta.subtitle}</p>
        <Link href={createPageUrl('VisaNavigator')}>
          <button className="px-10 py-5 bg-[#BF1E2E] hover:bg-[#9d1825] text-white rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 mb-4">
            {content.finalCta.cta} <ArrowRight className="inline w-6 h-6 ml-2" />
          </button>
        </Link>
        <p className="text-white/75 text-sm">{content.finalCta.note}</p>
      </GlassCard>
    </div>
  );
}
