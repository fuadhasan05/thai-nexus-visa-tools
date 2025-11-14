
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';

export const getStaticProps = async () => {
  // Do not statically generate this page at build time
  // It requires base44 which is only available at runtime
  return {
    notFound: true,
  };
};

export default function AdminContent() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0, currentPage: '' });
  const [translationLog, setTranslationLog] = useState([]);
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();

  // Check admin access
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-admin'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  // Redirect if not admin
  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-12 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: existingTranslations = [] } = useQuery({
    queryKey: ['all-page-translations'],
    queryFn: async () => {
      return base44.entities.Translation.list();
    },
    initialData: []
  });

  const languageNames = {
    'de': 'German', 'fr': 'French', 'ja': 'Japanese', 'de-ch': 'Swiss German',
    'it': 'Italian', 'nl': 'Dutch', 'sv': 'Swedish', 'zh': 'Chinese',
    'hi': 'Hindi', 'ru': 'Russian', 'ko': 'Korean', 'da': 'Danish',
    'no': 'Norwegian', 'fi': 'Finnish', 'ms': 'Malay', 'tl': 'Filipino',
    'es': 'Spanish', 'pt': 'Portuguese', 'he': 'Hebrew', 'cs': 'Czech',
    'pl': 'Polish', 'hu': 'Hungarian', 'el': 'Greek', 'ro': 'Romanian',
    'uk': 'Ukrainian', 'af': 'Afrikaans', 'my': 'Burmese', 'lo': 'Lao',
    'km': 'Khmer', 'vi': 'Vietnamese', 'th': 'Thai'
  };

  // Define all page sections to translate
  const pageSections = {
    home: {
      hero: {
        badge: 'Official Information Only',
        title_line1: 'Navigate Your Thailand',
        title_line2: 'Visa Journey',
        subtitle: 'Comprehensive toolkit for expats with accurate information sourced exclusively from Thai Immigration and official government websites.',
        stats: {
          tools: 'Professional Tools',
          visas: 'Visa Types Covered',
          free: 'Free to Use'
        }
      },
      tools_header: { title: 'Our Tools' },
      tools: {
        visa_navigator: {
          title: 'Thailand Visa Navigator',
          description: 'Interactive wizard that guides you from your initial goal to a complete, personalized visa application plan.',
          features: [
            'Step-by-step quiz to understand your situation',
            'Personalized visa roadmap with clear phases',
            'Timeline planning and deadline tracking'
          ]
        },
        document_checklist: {
          title: 'Thailand Document Checklist',
          description: 'Comprehensive document validation tool with AI-powered photo checker to prevent visa rejections.',
          features: [
            'Visa-specific document checklists',
            'AI photo specification validator',
            'Common error prevention'
          ]
        },
        report_tracker: {
          title: 'Thailand 90-Day Report Tracker',
          description: 'Never miss a deadline with automated reminders and TM.47 deadline tracking.',
          features: [
            'Automatic deadline calculations',
            'Email & notification reminders',
            'TM.30 landlord communication templates'
          ]
        },
        eligibility_calculator: {
          title: 'Thailand Visa Eligibility Calculator',
          description: 'Instantly discover which Thai visas you qualify for based on your unique situation.',
          features: [
            'Quick qualification assessment',
            'Comprehensive visa matching',
            'Clear requirement breakdowns'
          ]
        },
        immigration_locator: {
          title: 'Thailand Immigration Office Locator',
          description: 'Find immigration offices across Thailand with live GPS tracking and turn-by-turn directions.',
          features: [
            'Interactive map with all offices',
            'Real-time directions from your location',
            'Office hours and contact details'
          ]
        },
        immigration_simulator: {
          title: 'Thailand Immigration Visit Simulator',
          description: 'Pre-live your immigration office visit with step-by-step visual guidance.',
          features: [
            'Interactive office visit walkthrough',
            'Document folder preparation',
            'Office-specific guides'
          ]
        },
        visa_planner: {
          title: 'Thailand Long Stay Visa Planner',
          description: 'Plan your long-term visa strategy and navigate complex visa conversions.',
          features: [
            'Visual visa journey mapping',
            'In-country conversion options',
            'Long-term strategy planning'
          ]
        },
        cost_comparison: {
          title: 'Thailand Visa Cost Comparison',
          description: 'Make informed decisions with transparent DIY vs Agent cost-benefit analysis.',
          features: [
            'Side-by-side comparison',
            'Time and cost breakdown in THB',
            'Risk assessment'
          ]
        },
        application_builder: {
          title: 'Thailand Visa Application Builder',
          description: 'Complete document preparation wizard for rejection-proof visa applications.',
          features: [
            'Smart form filling assistance',
            'Digital document wallet',
            'Pre-flight validation checks'
          ]
        }
      },
      cta: {
        message: 'Ready to start your visa application?'
      },
      why_section: {
        title: 'Why Thai Nexus?',
        official: {
          title: 'Official Sources Only',
          description: 'All information verified against Thai Immigration and official government websites, not news articles or forums.'
        },
        comprehensive: {
          title: 'Comprehensive Coverage',
          description: 'Nine specialized tools covering every aspect of your visa journey, with expert support available.'
        },
        friendly: {
          title: 'User-Friendly',
          description: 'Intuitive interfaces with step-by-step guidance make complex visa processes simple and stress-free.'
        }
      }
    },
    layout: {
      navigation: {
        brand: 'Thai Nexus',
        subtitle: 'Visa Tools',
        home: 'Home',
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
        application_builder: 'Thailand Visa Application Builder',
        application_builder_desc: 'Complete document wizard'
      },
      footer: {
        about_title: 'Thai Nexus',
        about_text: 'Comprehensive visa tools and professional services for expats in Thailand',
        links_title: 'Quick Links',
        partner_link: 'Partner With Us',
        contact_title: 'Contact',
        copyright: '© 2025 Thai Nexus Visa Tools • Trusted Visa Information for Expats',
        disclaimer: 'All information sourced from official Thai Immigration and government websites. Always verify current requirements with official sources.'
      }
    },
    visa_navigator: {
      header: {
        badge: 'Interactive Visa Wizard',
        title: 'Thailand Visa Navigator',
        subtitle: 'Answer a few questions to get your personalized visa roadmap'
      },
      step1: {
        title: "Let's Start With Your Goals",
        goal_label: 'What is your goal in Thailand?',
        goal_placeholder: 'Select your goal',
        nationality_label: 'What is your nationality?',
        nationality_placeholder: 'e.g., American, British, Australian',
        next_button: 'Next'
      },
      step2: {
        title: 'Tell Us About Your Situation',
        age_label: 'What is your age?',
        age_placeholder: 'e.g., 35',
        location_label: 'Where are you applying from?',
        location_placeholder: 'Select location',
        back_button: 'Back',
        next_button: 'Next'
      },
      step3: {
        title: 'Financial Information',
        income_label: 'Monthly Income (USD)',
        income_placeholder: 'e.g., 3000',
        savings_label: 'Total Savings (USD)',
        savings_placeholder: 'e.g., 25000',
        tip: 'This helps us recommend visas you qualify for. Many Thai visas have minimum financial requirements.',
        back_button: 'Back',
        generate_button: 'Generate My Roadmap'
      },
      result: {
        badge: 'Roadmap Generated!',
        title: 'Your Personalized Visa Roadmap',
        recommended: 'Recommended Visa:',
        help_message: 'Need help following this roadmap?',
        saved_message: 'This roadmap has been saved to your account. Visit the 90-Day Report Tracker to track your progress.',
        start_new: 'Start New Journey'
      }
    },
    immigration_map: {
      header: {
        badge: 'All Thai Immigration Offices',
        title: 'Thailand Immigration Office Locator',
        subtitle: 'Interactive navigation with live GPS tracking and turn-by-turn directions'
      },
      controls: {
        search_placeholder: 'Search offices, cities, or addresses...',
        enable_tracking: 'Enable Live GPS Tracking',
        my_location: 'My Location',
        stop_tracking: 'Stop Tracking',
        all_provinces: 'All Provinces',
        all_services: 'All Services',
        sort_distance: 'Distance (Near → Far)',
        sort_rating: 'Rating (High → Low)',
        sort_name: 'Name (A → Z)',
        sync_google: 'Sync with Google'
      },
      status: {
        live_tracking: 'Live GPS Tracking Active',
        accuracy: 'Accuracy',
        updates: 'Updates continuously',
        drive: 'min drive'
      },
      map: {
        your_location: 'Your Live Location',
        real_time: 'Real-time tracking active',
        get_directions: 'Get Directions',
        view_details: 'View Details'
      },
      legend: {
        title: 'Map Legend',
        your_location: 'Your Live Location',
        immigration_office: 'Immigration Office',
        selected_office: 'Selected Office',
        route: 'Navigation Route',
        offices_shown: 'office',
        offices_shown_plural: 'offices shown'
      },
      sidebar: {
        sorted_distance: 'Sorted by distance from you',
        click_office: 'Click any office for details',
        away: 'km away',
        services: 'Services:',
        route: 'Route',
        google: 'Google',
        apple_maps: 'Apple Maps',
        loading: 'Loading offices...',
        no_results: 'No offices match your filters',
        clear_filters: 'Clear Filters'
      },
      office_details: {
        address: 'Address',
        phone: 'Phone',
        hours: 'Hours',
        services_available: 'Available Services',
        helpful_tips: 'Helpful Tips',
        show_route: 'Show Route'
      },
      cta: {
        message: 'Need help navigating to an immigration office?'
      }
    }
  };

  const addLog = (message, type = 'info') => {
    setTranslationLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const translateAllPages = async () => {
    setIsTranslating(true);
    setTranslationLog([]);
    
    const languages = Object.keys(languageNames);
    const languagesToTranslate = languages.filter(code => code !== 'en');
    const pages = Object.keys(pageSections);
    
    let totalOperations = 0;
    pages.forEach(pageName => {
      const sections = Object.keys(pageSections[pageName]);
      totalOperations += languagesToTranslate.length * sections.length;
    });

    setTranslationProgress({ current: 0, total: totalOperations, currentPage: '' });
    let completed = 0;

    addLog(`Starting translation of ${pages.length} pages into ${languagesToTranslate.length} languages`, 'info');

    for (const langCode of languagesToTranslate) {
      const targetLanguage = languageNames[langCode];
      addLog(`Translating to ${targetLanguage} (${langCode})`, 'info');

      for (const pageName of pages) {
        const sections = pageSections[pageName];
        
        for (const [sectionContext, contentBlock] of Object.entries(sections)) {
          setTranslationProgress({ 
            current: completed, 
            total: totalOperations, 
            currentPage: `${pageName} > ${sectionContext} (${targetLanguage})`
          });

          const translationKey = `${pageName}:${sectionContext}:${langCode}`;
          
          const existing = existingTranslations.find(t => t.translation_key === translationKey);
          if (existing) {
            addLog(`✓ Skipping ${pageName}:${sectionContext} - already translated`, 'success');
            completed++;
            continue;
          }

          try {
            const prompt = `You are a professional translator for a Thailand visa services website.

CONTEXT:
- Page: ${pageName}
- Section: ${sectionContext}
- Target Language: ${targetLanguage}
- Audience: Expats navigating Thai visa processes

IMPORTANT INSTRUCTIONS:
1. Translate the ENTIRE content block as a cohesive unit
2. Maintain the EXACT JSON structure with same keys
3. Consider the context of the page and section for accurate translations
4. Use professional, clear language appropriate for visa/immigration content
5. Keep any HTML tags, special characters, and formatting intact
6. For visa-specific terms, use standard terminology in the target language
7. Maintain tone: professional, helpful, and trustworthy
8. Think about the COMPLETE meaning and context, not word-by-word translation

Content to translate:
${JSON.stringify(contentBlock, null, 2)}

Return ONLY the translated JSON object with the same structure.`;

            const response = await base44.functions.invoke('translate', {
              prompt,
              response_json_schema: {
                type: "object",
                properties: {
                  translated_content: {
                    type: "object",
                    additionalProperties: true
                  }
                }
              }
            });

            const translatedContent = response.data.translated_content || contentBlock;

            await base44.entities.Translation.create({
              page_name: pageName,
              section_context: sectionContext,
              content_block: contentBlock,
              target_language: langCode,
              translated_content: translatedContent,
              translation_key: translationKey,
              usage_count: 0
            });

            addLog(`✓ Translated ${pageName}:${sectionContext}`, 'success');
          } catch (error) {
            addLog(`✗ Error translating ${pageName}:${sectionContext}: ${error.message}`, 'error');
            addError(`Translation failed: ${pageName}:${sectionContext} - ${error.message}`);
          }

          completed++;
          setTranslationProgress({ 
            current: completed, 
            total: totalOperations, 
            currentPage: `${pageName} > ${sectionContext} (${targetLanguage})`
          });

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['all-page-translations'] });
    setIsTranslating(false);
    setTranslationProgress({ current: 0, total: 0, currentPage: '' });
    addLog('🎉 Translation complete!', 'success');
    addSuccess(`Translation complete! Processed ${completed} translations.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-4">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 text-sm font-medium">Admin Panel</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Bulk Translator</h1>
        <p className="text-gray-600">Generate translations for all pages at once</p>
      </GlassCard>

      {/* System Overview */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Translation System</h2>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-6">
          <h3 className="font-bold text-gray-900 mb-3">How It Works:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Bulk Generation:</strong> Click the button below to translate all pages at once</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Smart Skipping:</strong> Already translated pages are skipped automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Review & Edit:</strong> After generation, review all translations in Translation Manager</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Delete & Retry:</strong> Delete bad translations and re-run to regenerate them</span>
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 rounded-xl">
            <div className="text-3xl font-bold text-gray-900">
              {Object.keys(pageSections).length}
            </div>
            <div className="text-sm text-gray-600">Pages to Translate</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl">
            <div className="text-3xl font-bold text-gray-900">
              {Object.keys(languageNames).length - 1}
            </div>
            <div className="text-sm text-gray-600">Target Languages</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-xl">
            <div className="text-3xl font-bold text-gray-900">
              {existingTranslations.length}
            </div>
            <div className="text-sm text-gray-600">Translations Cached</div>
          </div>
        </div>

        {isTranslating && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <div className="flex justify-between text-sm text-gray-700 mb-3">
              <span className="font-medium">
                {translationProgress.currentPage || 'Preparing...'}
              </span>
              <span className="font-bold text-blue-600">
                {translationProgress.current} / {translationProgress.total}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 transition-all duration-500"
                style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={translateAllPages}
          disabled={isTranslating}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Translating... ({translationProgress.current}/{translationProgress.total})
            </>
          ) : (
            <>
              <Globe className="w-5 h-5 mr-2" />
              Translate All Pages
            </>
          )}
        </Button>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Estimated cost:</strong> ~$15-25 USD for all languages (one-time)
          </p>
          <p className="text-xs text-gray-600">
            <strong>Why efficient?</strong> Translates entire page sections in single API calls with full context.
          </p>
        </div>
      </GlassCard>

      {/* Translation Log */}
      {translationLog.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Translation Log</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
            {translationLog.map((log, i) => (
              <div key={i} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
