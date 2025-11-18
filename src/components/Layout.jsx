
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import {
  Home,
  Compass,
  FileCheck,
  Calendar,
  Calculator,
  Building2,
  Navigation,
  Scale,
  Menu,
  X,
  Grid3x3,
  Settings,
  DollarSign,
  MapPin,
  Globe,
  Check,
  Package, // Added Package icon
  User, // Added User icon
  Coins, // Added Coins icon
  LogOut, // Added LogOut icon
  Phone, // Added Phone icon for WhatsApp
  MessageCircle, // Added MessageCircle icon for Line
  Mail, // Added Mail icon for email
  TrendingUp, // Added TrendingUp icon for SEO Manager
  BookOpen, // Added BookOpen icon for Knowledge Hub/Moderation
  Users // Added Users icon for User Management
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import FeedbackButton from "./FeedbackButton";
import { TranslationProvider, useTranslation } from "./TranslationProvider";
import { ErrorProvider } from './ErrorNotification';
import { ConfirmProvider } from './ConfirmDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

import SEOHead from './SEOHead';
import AIAssistant from "./AIAssistant";
import AutoTranslationIndicator from "./AutoTranslationIndicator";

// ENGLISH CONTENT - Always available
const ENGLISH_CONTENT = {
  navigation: {
    brand: 'Thai Nexus',
    subtitle: 'Visa Hub', // Changed from 'Visa Tools' to 'Visa Hub'
    home: 'Home',
    knowledge_hub: 'Knowledge Hub', // Added new navigation item
    currency: 'Currency Converter',
    tools: 'Tools',
    visa_tools_label: 'Visa Tools',
    admin_panel: 'Admin Panel',
    select_language: 'Select Language',
    search_languages: 'Search languages...',
    translations_powered: 'Translations powered by AI'
  },
  tool_menu: {
    visa_navigator: 'Thailand Visa Navigator',
    visa_navigator_desc: 'Step-by-step visa guidance',
    document_checklist: 'Thailand Document Checklist',
    document_checklist_desc: 'Validate your documents',
    report_tracker: 'Thailand 90-Day Report Tracker',
    report_tracker_desc: 'Track TM.47 deadlines',
    eligibility_calculator: 'Thailand Visa Eligibility Calculator',
    eligibility_calculator_desc: 'Find your visa match',
    immigration_locator: 'Thailand Immigration Office Locator',
    immigration_locator_desc: 'Find nearest office with GPS',
    immigration_simulator: 'Thailand Immigration Visit Simulator',
    immigration_simulator_desc: 'Practice your visit',
    visa_planner: 'Thailand Long Stay Visa Planner',
    visa_planner_desc: 'Plan visa transitions',
    cost_comparison: 'Thailand Visa Cost Comparison',
    cost_comparison_desc: 'DIY vs Agent costs',
    currency_converter: 'Thailand Currency Converter',
    currency_converter_desc: 'Convert THB to USD and other currencies',
    application_builder: 'Thailand Visa Application Builder',
    application_builder_desc: 'Complete document wizard'
  },
  footer: {
    about_title: 'Thai Nexus',
    about_text: 'Comprehensive visa tools and professional services for expats in Thailand',
    links_title: 'Quick Links',
    partner_link: 'Partner With Us',
    contact_link: 'Contact Us', // Added new link
    // Removed privacy_link as per outline
    contact_title: 'Contact',
    copyright: '© 2025 Thai Nexus Visa Hub • Trusted Visa Information for Expats', // Changed from 'Visa Tools' to 'Visa Hub'
    disclaimer: 'All information sourced from official Thai Immigration and government websites. Always verify current requirements with official sources.'
  }
};

function LayoutContent({ children, currentPageName }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // logoKey removed - logo is now cached properly
  const { currentLanguage, changeLanguage, languageNames, availableLanguages, getTranslation } = useTranslation();
  const [languageSearch, setLanguageSearch] = useState('');

  // Centralized auth context so UI updates instantly when auth state changes
  const { user: currentUser, signOut } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [router.pathname]);

  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.includes(router.pathname);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Get translations
  const nav = getTranslation('layout', 'navigation', ENGLISH_CONTENT.navigation);
  const toolMenu = getTranslation('layout', 'tool_menu', ENGLISH_CONTENT.tool_menu);
  const footer = getTranslation('layout', 'footer', ENGLISH_CONTENT.footer);

  

  const queryClient = useQueryClient();

  const { data: credits } = useQuery({
    queryKey: ['user-credits', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const { data: results, error } = await supabase
        .from('UserCredits')
        .select('*')
        .eq('user_email', currentUser.email)
        .limit(1);
      if (error) throw error;
      if (results && results.length > 0) return results[0];

      // Create new credits record with correct initial balance
      const initialBalance = currentUser?.role === 'admin' ? 1000 : 5;
      const { data: created, error: createErr } = await supabase
        .from('UserCredits')
        .insert([{
          user_email: currentUser.email,
          credits_balance: initialBalance,
          credits_used: 0,
          credits_purchased: 0,
          transaction_history: []
        }])
        .select('*');
      if (createErr) throw createErr;
      return created?.[0] ?? null;
    },
    enabled: !!currentUser?.email,
    staleTime: 1000,
  });

  const isAdmin = currentUser?.role === 'admin';

  const navigationItems = [
    { title: nav.home, url: createPageUrl("Home"), icon: Home },
    { title: nav.knowledge_hub, url: createPageUrl("KnowledgeHub"), icon: BookOpen }
  ];

  const toolsMenuItems = [
    {
      title: toolMenu.visa_navigator,
      url: createPageUrl("VisaNavigator"),
      icon: Compass,
      description: toolMenu.visa_navigator_desc,
      color: 'from-[#272262] to-[#3d3680]'
    },
    {
      title: toolMenu.document_checklist,
      url: createPageUrl("DocumentValidator"),
      icon: FileCheck,
      description: toolMenu.document_checklist_desc,
      color: 'from-[#BF1E2E] to-[#d94656]'
    },
    {
      title: toolMenu.report_tracker,
      url: createPageUrl("AdminManager"),
      icon: Calendar,
      description: toolMenu.report_tracker_desc,
      color: 'from-[#272262] to-[#3d3680]'
    },
    {
      title: toolMenu.eligibility_calculator,
      url: createPageUrl("EligibilityCalculator"),
      icon: Calculator,
      description: toolMenu.eligibility_calculator_desc,
      color: 'from-[#BF1E2E] to-[#d94656]'
    },
    {
      title: toolMenu.immigration_locator,
      url: createPageUrl("ImmigrationMap"),
      icon: MapPin,
      description: toolMenu.immigration_locator_desc,
      color: 'from-[#272262] to-[#3d3680]'
    },
    {
      title: toolMenu.immigration_simulator,
      url: createPageUrl("ImmigrationSimulator"),
      icon: Building2,
      description: toolMenu.immigration_simulator_desc,
      color: 'from-[#BF1E2E] to-[#d94656]'
    },
    {
      title: toolMenu.visa_planner,
      url: createPageUrl("PathwayPlanner"),
      icon: Navigation,
      description: toolMenu.visa_planner_desc,
      color: 'from-[#272262] to-[#3d3680]'
    },
    {
      title: toolMenu.cost_comparison,
      url: createPageUrl("AgentComparison"),
      icon: Scale,
      description: toolMenu.cost_comparison_desc,
      color: 'from-[#BF1E2E] to-[#d94656]'
    },
    {
      title: toolMenu.currency_converter, // Updated title
      url: createPageUrl("CurrencyConverter"),
      icon: DollarSign,
      description: toolMenu.currency_converter_desc, // Updated description
      color: 'from-green-600 to-emerald-600'
    },
    // Show PacketBuilder ONLY to admin (hide from everyone else while admin works on it)
    ...(isAdmin ? [{
      title: toolMenu.application_builder,
      url: createPageUrl("PacketBuilder"),
      icon: Package,
      description: toolMenu.application_builder_desc,
      color: 'from-purple-600 to-indigo-600',
      isPremium: true
    }] : [])
  ];

  const adminMenuItems = [
    { title: "User Management", url: createPageUrl("AdminUsers"), icon: Users },
    { title: "Knowledge Moderation", url: createPageUrl("AdminKnowledge"), icon: BookOpen },
    { title: "SEO Manager", url: createPageUrl("AdminSEO"), icon: TrendingUp },
    { title: "Bulk Translator", url: createPageUrl("AdminContent"), icon: Globe },
    { title: "Translation Manager", url: createPageUrl("AdminTranslations"), icon: Settings },
    { title: "Partner Management", url: createPageUrl("AdminPartners"), icon: Building2 },
  ];

  // Determine if we're on any tools page so the Tools nav can be highlighted
  const toolsActive = router.pathname === '/tools' || router.pathname.startsWith('/tools');

  const filteredLanguages = availableLanguages.filter(code =>
    languageNames[code]?.toLowerCase().includes(languageSearch.toLowerCase())
  );

  // If this is the auth page, render a minimal layout without header/footer
  if (isAuthPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Meta Tags */}
      <SEOHead page={currentPageName} />
      
      <style>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid #E7E7E7;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .glass-hover {
          transition: all 0.3s ease;
        }

        .glass-hover:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .logo-container:hover .group-hover\\:scale-105 {
          animation: logo-pulse 0.6s ease-in-out;
        }
      `}</style>

      <AIAssistant />
      <FeedbackButton />
      <AutoTranslationIndicator />

      <nav className="sticky top-0 z-50 bg-white backdrop-blur-xl border-b border-[#E7E7E7] shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={createPageUrl("Home")} className="flex items-center gap-3 group logo-container">
              <div className="h-10">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/620559a1d_ThaiNexusMainLogo.png"
                  alt="Thai Nexus"
                  className="h-full w-auto object-contain group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    console.error('Logo failed to load');
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-base font-bold text-[#BF1E2E]">{nav.subtitle}</p>
                <p className="text-xs text-[#454545]">ver. Beta 1.1</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    router.pathname === item.url
                      ? 'bg-[#BF1E2E] text-white'
                      : 'text-[#454545] hover:bg-[#F1F1F1]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 transition-colors ${
                      toolsActive
                        ? 'bg-[#BF1E2E] text-white'
                        : 'text-[#454545] hover:bg-[#F1F1F1]'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span className="text-sm font-medium">{nav.tools}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[650px] bg-white" align="end">
                  <DropdownMenuLabel className="text-xl font-bold text-[#272262] px-4 py-3 border-b border-[#E7E7E7]">{nav.visa_tools_label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="grid grid-cols-2 gap-3 p-4 max-h-[500px] overflow-y-auto ">
                    {toolsMenuItems.map((item) => (
                      <DropdownMenuItem key={item.url} asChild>
                        <Link
                          href={item.url}
                          className="flex items-start gap-3 p-4 cursor-pointer rounded-xl hover:bg-[#F8F9FA] transition-all border-2 border-transparent hover:border-[#E7E7E7] hover:scale-105"
                        >
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-[#272262]">{item.title}</span>
                              {item.isPremium && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#454545] line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Credits Display - BACK IN NAVBAR */}
              {currentUser && (
                <Link
                  href={createPageUrl("Profile")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#F1F1F1] transition-colors"
                >
                  <Coins className="w-4 h-4 text-[#BF1E2E]" />
                  <span className="text-sm font-medium text-[#454545]">{credits?.credits_balance || 0}</span>
                </Link>
              )}

              {/* Language Dropdown - ADMIN ONLY */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase">{currentLanguage}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>{nav.select_language}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Input
                        placeholder={nav.search_languages}
                        value={languageSearch}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredLanguages.map((code) => (
                        <DropdownMenuItem
                          key={code}
                          onClick={() => changeLanguage(code)}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <span>{languageNames[code]}</span>
                          {currentLanguage === code && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2 text-xs text-gray-500 text-center">
                      {nav.translations_powered}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
                      <User className="w-5 h-5 text-black" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={createPageUrl("Profile")} className="cursor-pointer flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Profile & Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* Removed Credits display from the user dropdown menu */}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{nav.admin_panel}</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          {adminMenuItems.map((item) => (
                            <DropdownMenuItem key={item.url} asChild>
                              <Link href={item.url} className="flex items-center gap-2 cursor-pointer">
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      try {
                        await signOut();
                        // Clear cached user data and refetch
                        queryClient.invalidateQueries({ queryKey: ['current-user'] });
                        // Optionally navigate to home
                        router.push('/');
                      } catch (err) {
                        console.error('Sign out error:', err);
                      }
                    }} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => {
                    // Navigate to the dedicated login page which shows the email/password form
                    router.push('/login');
                  }}
                  size="sm"
                  className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white"
                >
                  Login
                </Button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50 touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                {/* Main Navigation */}
                <div className="pb-2 mb-2 border-b border-gray-100">
                  <div className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                    Navigation
                  </div>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg flex items-center gap-3 touch-manipulation ${
                        router.pathname === item.url
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  ))}
                </div>

                {/* Tools */}
                <div className="pb-2 mb-2 border-b border-gray-100">
                  <div className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                    {nav.tools}
                  </div>
                  {toolsMenuItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg flex items-center gap-3 text-gray-700 touch-manipulation"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium flex-1">{item.title}</span>
                      {item.isPremium && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex-shrink-0">
                          PRO
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Language selector - ADMIN ONLY */}
                {isAdmin && (
                  <div className="pb-2 mb-2 border-b border-gray-100">
                    <div className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                      Language
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4 py-2">
                      {availableLanguages.slice(0, 8).map((code) => (
                        <button
                          key={code}
                          onClick={() => {
                            changeLanguage(code);
                            setMobileMenuOpen(false);
                          }}
                          className={`p-2 rounded-lg text-sm flex items-center justify-between touch-manipulation ${
                            currentLanguage === code
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="truncate">{languageNames[code]}</span>
                          {currentLanguage === code && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Section */}
                {currentUser && (
                  <>
                    <div className="pb-2 mb-2 border-b border-gray-100">
                      <div className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                        Account
                      </div>
                      <Link
                        href={createPageUrl("Profile")}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 rounded-lg flex items-center gap-3 text-gray-700 touch-manipulation"
                      >
                        <User className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Profile & Settings</span>
                      </Link>
                      {/* Removed Credits display from the mobile menu's Account Section */}
                    </div>
                    
                    {isAdmin && (
                      <div className="pb-2 mb-2 border-b border-gray-100">
                        <div className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                          Admin
                        </div>
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.title}
                            href={item.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-4 py-3 rounded-lg flex items-center gap-3 text-gray-700 touch-manipulation"
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                          queryClient.invalidateQueries({ queryKey: ['current-user'] });
                          router.push('/');
                        } catch (err) {
                          console.error('Sign out error:', err);
                        } finally {
                          setMobileMenuOpen(false);
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-red-600 touch-manipulation"
                    >
                      <LogOut className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                )}
                
                {!currentUser && (
                  <button
                      onClick={() => {
                            // Navigate to the dedicated login page (mobile)
                            router.push('/login');
                            setMobileMenuOpen(false);
                          }}
                      className="w-full text-left px-4 py-3 rounded-lg flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors touch-manipulation"
                    >
                      <User className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">Login</span>
                    </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="mt-16 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F1F1F1] border-t border-[#E7E7E7]">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/620559a1d_ThaiNexusMainLogo.png"
                    alt="Thai Nexus"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
              <p className="text-[#454545] text-sm leading-relaxed">
                {footer.about_text}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#272262] mb-4 text-lg">{footer.links_title}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={createPageUrl("Home")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    {nav.home}
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("KnowledgeHub")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Knowledge Hub
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("BecomeContributor")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Become a Contributor
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("Contact")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    {footer.contact_link}
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("PartnerWithUs")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    {footer.partner_link}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#272262] mb-4 text-lg">Popular Tools</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={createPageUrl("VisaNavigator")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Visa Navigator
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("EligibilityCalculator")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Eligibility Calculator
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("DocumentValidator")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Document Checklist
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("CurrencyConverter")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Currency Converter
                  </Link>
                </li>
                <li>
                  <Link href={createPageUrl("ImmigrationMap")} className="text-[#454545] hover:text-[#BF1E2E] transition-colors">
                    Immigration Office Locator
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#272262] mb-4 text-lg">{footer.contact_title}</h3>
              <div className="space-y-3 text-sm">
                <a 
                  href="https://wa.me/66923277723" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#454545] hover:text-[#BF1E2E] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors border border-green-200">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <span>+66923277723</span>
                </a>
                <a 
                  href="https://line.me/ti/p/@thainexus" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#454545] hover:text-[#BF1E2E] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors border border-green-200">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span>@thainexus</span>
                </a>
                <a 
                  href="mailto:contact@thainexus.co.th"
                  className="flex items-center gap-2 text-[#454545] hover:text-[#BF1E2E] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors border border-red-200">
                    <Mail className="w-4 h-4 text-[#BF1E2E]" />
                  </div>
                  <span>contact@thainexus.co.th</span>
                </a>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-[#454545] leading-relaxed">
                  <strong className="text-[#272262]">Response Times:</strong> WhatsApp and LINE: 1-2 hours. Email: 24 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E7E7E7] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
              <div>
                <p className="text-[#272262] text-sm font-medium mb-2">
                  {footer.copyright}
                </p>
                <p className="text-[#454545] text-xs leading-relaxed max-w-3xl">
                  {footer.disclaimer}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#454545]">
                <Link href={createPageUrl("PrivacyPolicy")} className="hover:text-[#BF1E2E] transition-colors">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href={createPageUrl("TermsOfService")} className="hover:text-[#BF1E2E] transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ErrorProvider>
      <ConfirmProvider>
        <TranslationProvider>
          <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
        </TranslationProvider>
      </ConfirmProvider>
    </ErrorProvider>
  );
}