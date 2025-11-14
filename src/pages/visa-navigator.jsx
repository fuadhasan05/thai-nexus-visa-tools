
import SEOHead from '@/components/SEOHead';import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, FileCheck, MapPin, Building2, Calendar } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import ToolCard from '@/components/ToolCardFixed';
import ContactCTA from '@/components/ContactCTA';
import VisaTypeSelect from '@/components/VisaTypeSelect';
import { useTranslation } from '@/components/TranslationProvider';

// ENGLISH CONTENT - Always available immediately
const ENGLISH_CONTENT = {
  header: {
    badge: 'Interactive Visa Wizard',
    title: 'Visa-Flow Navigator',
    subtitle: 'Answer a few questions to get your personalized visa roadmap'
  },
  step1: {
    title: "Let's Start With Your Goals",
    goal_label: 'What visa type are you applying for?',
    goal_placeholder: 'Select your visa type',
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
    next_button: 'Next',
    locations: {
      outside_thailand: 'Outside Thailand',
      inside_thailand: 'Inside Thailand (converting/extending)'
    }
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
    saved_message: 'This roadmap has been saved to your account. Visit the Admin Manager to track your progress.',
    start_new: 'Start New Journey'
  }
};

export default function VisaNavigator() {
  const { getTranslation } = useTranslation();
  const content = {
    header: getTranslation('visa_navigator', 'header', ENGLISH_CONTENT.header),
    step1: getTranslation('visa_navigator', 'step1', ENGLISH_CONTENT.step1),
    step2: getTranslation('visa_navigator', 'step2', ENGLISH_CONTENT.step2),
    step3: getTranslation('visa_navigator', 'step3', ENGLISH_CONTENT.step3),
    result: getTranslation('visa_navigator', 'result', ENGLISH_CONTENT.result)
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    nationality: '',
    age: '',
    location: '',
    monthly_income: '',
    total_savings: ''
  });
  const [roadmap, setRoadmap] = useState(null);
  const queryClient = useQueryClient();

  const generateRoadmap = (data) => {
    const { goal, age, monthly_income, total_savings, location } = data;
    const ageNum = parseInt(age) || 0;
    const savings = parseFloat(total_savings) || 0;
    const income = parseFloat(monthly_income) || 0;
    const thbSavings = savings * 35;
    const thbIncome = income * 35;
    const isInsideThailand = location === 'inside_thailand';

    // RETIREMENT VISAS (Age 50+ REQUIRED)
    if (goal === 'retire' || goal === 'retirement-o-first-time' || goal === 'retirement-extension' || goal === 'retirement-oa' || goal === 'retirement-ox') {
      if (ageNum < 50) {
        return {
          visa: 'Retirement Visa - Age Requirement Not Met',
          phases: [{
            phase: 'Not Eligible',
            title: 'Age Requirement',
            description: `You must be 50 years or older to apply for any retirement visa. You are currently ${ageNum} years old. Consider DTV, Tourist, or other visa types until you turn 50.`,
            completed: false
          }]
        };
      }

      // Non-O-A (Apply from abroad only)
      if (goal === 'retirement-oa' || (!isInsideThailand && (thbSavings >= 800000 || thbIncome >= 65000))) {
        return {
          visa: 'Non-Immigrant O-A (Long Stay Retirement)',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Apply from Your Home Country',
              description: 'MUST apply at Thai embassy in your home country (cannot apply inside Thailand). Provide 800,000 THB bank statement (or 65,000 THB/month pension proof). Health insurance required: 40,000 THB outpatient, 400,000 THB inpatient coverage.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Enter Thailand',
              description: 'Activate your O-A visa. You receive 1-year permission to stay with multiple re-entries allowed.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Open Thai Bank Account',
              description: 'Open Thai bank account and maintain 800,000 THB (or pension deposits). Keep health insurance active.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'TM.30 Registration',
              description: 'Landlord must file TM.30 within 24 hours of your arrival.',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: '90-Day Reports',
              description: 'File TM.47 form every 90 days - online, by mail, or in person.',
              completed: false
            },
            {
              phase: 'Phase 6',
              title: 'Annual Extension (Optional)',
              description: 'Before year 1 expires, you can extend for another year. Money must be in account 2 months before extension application.',
              completed: false
            }
          ]
        };
      }

      // Non-O Retirement (Inside Thailand)
      if (isInsideThailand && (thbSavings >= 800000 || thbIncome >= 65000)) {
        return {
          visa: 'Non-Immigrant O (Retirement) - Applied Inside Thailand',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Convert to Non-O (90 Days)',
              description: 'Visit immigration with 800,000 THB bank statement (or pension proof 65,000 THB/month). Get 90-day Non-O stamp. Costs 2,000 THB.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Season Your Money',
              description: 'Keep 800,000 THB in Thai bank for 2 months before applying for 1-year extension. Bank letter and updated book required.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Apply for 1-Year Extension',
              description: 'Before 90-day stamp expires, apply for 1-year extension at immigration (1,900 THB). Bring bank book, updated bank letter, passport photos, TM.30, TM.47.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Ongoing Compliance',
              description: '90-day reports every 90 days. Money must stay in account (can drop to 400,000 THB for 9 months, must be back to 800,000 THB for 2 months before next extension).',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: 'Annual Renewals',
              description: 'Repeat extension process annually with same requirements.',
              completed: false
            }
          ]
        };
      }

      // Non-O-X (Age 50+, higher financial requirements)
      if ((goal === 'retirement-ox' || thbSavings >= 3000000) && ageNum >= 50) {
        return {
          visa: 'Non-Immigrant O-X (Long-Stay 5-10 Year)',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Apply from Home Country',
              description: 'MUST apply at Thai embassy abroad. Need 3M THB in bank OR pension $100,000+/year. Health insurance $100,000+ coverage required. Only available to citizens of specific countries (check embassy).',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Enter Thailand',
              description: 'Receive 5-year visa (can extend to 10 years). Each stay up to 1 year at a time.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Annual Check-ins',
              description: 'Report annually to immigration, maintain financial requirements and health insurance.',
              completed: false
            }
          ]
        };
      }

      // Doesn't meet financial requirements
      return {
        visa: 'Retirement Visa - Financial Requirements Not Met',
        phases: [{
          phase: 'Action Required',
          title: 'Build Financial Reserves',
          description: `You need ${Math.max(0, 800000 - thbSavings).toLocaleString()} more THB in savings OR ${Math.max(0, 65000 - thbIncome).toLocaleString()} more THB monthly income. Minimum: 800,000 THB in bank OR 65,000 THB/month pension.`,
          completed: false
        }]
      };
    }

    // DTV - NO AGE REQUIREMENT
    if (goal === 'digital_nomad' || goal === 'dtv') {
      if (thbSavings >= 500000) {
        return {
          visa: 'Destination Thailand Visa (DTV)',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Prepare Documents',
              description: 'Gather: Bank statements showing 500,000 THB for last 6 months, remote work contract or freelance portfolio, passport copy, passport photo, hotel/accommodation booking.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Apply via e-Visa (From Abroad Only)',
              description: 'MUST apply from outside Thailand through Thai e-Visa system. Cannot apply inside Thailand. Processing takes 5-15 days.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Receive 5-Year Multiple Entry DTV',
              description: 'Once approved, receive 5-year visa. Each entry grants 180 days stay.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Enter Thailand',
              description: 'Use DTV to enter and get 180-day stamp.',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: 'Extensions & Re-entries',
              description: 'Can extend 180 days once for additional 180 days (1,900 THB) = 360 days total. Then must exit and re-enter. No 90-day reports required.',
              completed: false
            }
          ]
        };
      } else {
        return {
          visa: 'DTV - Financial Requirements Not Met',
          phases: [{
            phase: 'Action Required',
            title: 'Build Savings',
            description: `Need ${(500000 - thbSavings).toLocaleString()} more THB (currently have ${thbSavings.toLocaleString()} THB). Must maintain 500,000 THB in bank for 6 months before applying.`,
            completed: false
          }]
        };
      }
    }

    // WORK VISA (Non-B) - NO AGE REQUIREMENT
    if (goal === 'work' || goal === 'business') {
      if (isInsideThailand) {
        return {
          visa: 'Non-Immigrant B (Business/Work) - Applied Inside Thailand',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Employer Gets WP3 Approval',
              description: 'Thai employer applies to Ministry of Labour for WP3 approval. Company needs: 2M THB registered capital, 4 Thai employees per foreign worker, valid business registration.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Convert to Non-B (90 Days)',
              description: 'With WP3 approval, visit immigration to convert from tourist/exempt to 90-day Non-B visa. Costs 2,000 THB. Need 15+ days remaining on current stamp.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Get Medical Certificate',
              description: 'Visit Thai clinic for medical certificate (required for work permit). Costs 100-300 THB.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Apply for Work Permit',
              description: 'Employer submits your passport, medical cert, degree certificates to Ministry of Labour. Receive work permit book in 1-2 weeks.',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: 'Extend to 1 Year',
              description: 'With work permit in hand, apply for 1-year extension at immigration before 90 days expire (1,900 THB).',
              completed: false
            },
            {
              phase: 'Phase 6',
              title: 'Ongoing Compliance',
              description: '90-day reports, annual visa extensions, annual work permit renewals. Get re-entry permit before traveling abroad.',
              completed: false
            }
          ]
        };
      } else {
        return {
          visa: 'Non-Immigrant B (Business/Work) - Applied from Abroad',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Employer Gets WP3 Approval',
              description: 'Thai employer applies to Ministry of Labour. Company needs 2M THB capital, 4 Thai employees per foreigner.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Apply for Non-B at Embassy',
              description: 'Apply at Thai embassy in your home country with WP3 approval letter, employment contract, company documents, your degree/certificates.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Enter Thailand',
              description: 'Enter with Non-B visa (typically 90 days single entry). Get medical certificate from Thai clinic immediately.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Apply for Work Permit',
              description: 'Employer submits documents to Ministry of Labour. Receive work permit in 1-2 weeks.',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: 'Extend to 1 Year',
              description: 'With work permit, apply for 1-year extension at immigration (1,900 THB) before 90 days expire.',
              completed: false
            },
            {
              phase: 'Phase 6',
              title: 'Ongoing Compliance',
              description: '90-day reports, annual visa and work permit renewals, re-entry permits.',
              completed: false
            }
          ]
        };
      }
    }

    // DEPENDENT VISA (NO AGE REQUIREMENT)
    if (goal === 'dependent') {
      if (isInsideThailand) {
        return {
          visa: 'Non-Immigrant O (Dependent) - Applied Inside Thailand',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Gather Documents',
              description: 'Marriage certificate or birth certificate (must be legalized by embassy + Thai MFA). Sponsor needs: work permit, company documents, tax records, salary proof 40,000+ THB/month.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Convert to 90-Day Non-O',
              description: 'Visit immigration with sponsor. Convert current visa to 90-day Non-O dependent. Costs 2,000 THB. Need 15+ days on current stamp. Processing takes 15 days.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Apply for 1-Year Extension',
              description: 'Before 90 days expire, apply for 1-year extension (1,900 THB). Extension syncs with sponsor\'s visa.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Annual Renewals',
              description: '90-day reports, annual extensions. Must renew when sponsor renews. Cannot work on this visa.',
              completed: false
            }
          ]
        };
      } else {
        return {
          visa: 'Non-Immigrant O (Dependent) - Applied from Abroad',
          phases: [
            {
              phase: 'Phase 1',
              title: 'Prepare Relationship Documents',
              description: 'Legalize marriage certificate or birth certificate at embassy and Thai MFA. Get sponsor\'s work permit copies, company documents.',
              completed: false
            },
            {
              phase: 'Phase 2',
              title: 'Apply at Thai Embassy',
              description: 'Apply with legalized documents, sponsor\'s work papers, salary proof. Usually granted 90 days.',
              completed: false
            },
            {
              phase: 'Phase 3',
              title: 'Enter Thailand',
              description: 'Enter with Non-O dependent visa.',
              completed: false
            },
            {
              phase: 'Phase 4',
              title: 'Extend to 1 Year',
              description: 'Open Thai bank, deposit 400k THB, season 2 months, apply for 1-year extension (1,900 THB).',
              completed: false
            },
            {
              phase: 'Phase 5',
              title: 'Ongoing Requirements',
              description: '90-day reports, re-entry permits, annual renewals tied to sponsor.',
              completed: false
            }
          ]
        };
      }
    }

    // EDUCATION VISA (NO AGE REQUIREMENT - generally available to anyone enrolled)
    if (goal === 'study' || goal === 'education') {
      return {
        visa: 'Non-Immigrant ED (Education)',
        phases: [
          {
            phase: 'Phase 1',
            title: 'Enroll in Approved School',
            description: 'Enroll in Thai school, university, or language center with Ministry of Education license. Pay tuition and get enrollment confirmation.',
            completed: false
          },
          {
            phase: 'Phase 2',
            title: 'Gather School Documents',
            description: 'School provides: acceptance letter, enrollment certificate, course payment receipt, school license copy.',
            completed: false
          },
          {
            phase: 'Phase 3',
            title: isInsideThailand ? 'Convert to Non-ED Inside Thailand' : 'Apply at Thai Embassy',
            description: isInsideThailand 
              ? 'Visit immigration to convert current visa to 90-day Non-ED (2,000 THB). Need 15+ days remaining on current stamp.'
              : 'Apply at Thai embassy abroad with school documents. Receive 90-day Non-ED visa.',
            completed: false
          },
          {
            phase: 'Phase 4',
            title: 'Extend for Course Duration',
            description: 'Extend for length of course (max 1 year at a time, 1,900 THB). Must show 80%+ attendance and academic progress.',
            completed: false
          },
          {
            phase: 'Phase 5',
            title: 'Ongoing Compliance',
            description: '90-day reports, maintain attendance, no work allowed. Extensions require continued enrollment and attendance records.',
            completed: false
          }
        ]
      };
    }

    // MARRIAGE VISA (NO AGE REQUIREMENT)
    if (goal === 'family' || goal === 'marriage') {
      if (thbSavings >= 400000 || thbIncome >= 40000) {
        if (isInsideThailand) {
          return {
            visa: 'Non-Immigrant O (Marriage) - Applied Inside Thailand',
            phases: [
              {
                phase: 'Phase 1',
                title: 'Legal Marriage & Documents',
                description: 'Marriage registered at Thai Amphur. Get Thai marriage certificate, translate to Thai, legalize at embassy and MFA.',
                completed: false
              },
              {
                phase: 'Phase 2',
                title: 'Financial Preparation',
                description: 'Deposit 400,000 THB in Thai bank account. Must season for 2 months before extension application.',
                completed: false
              },
              {
                phase: 'Phase 3',
                title: 'Convert to 90-Day Non-O',
                description: 'Visit immigration to convert to Non-O marriage visa (2,000 THB). Bring marriage cert, spouse Thai ID, house registration.',
                completed: false
              },
              {
                phase: 'Phase 4',
                title: 'Apply for 1-Year Extension',
                description: 'After money seasons 2 months, apply for 1-year extension (1,900 THB). May require home visit by immigration officer.',
                completed: false
              },
              {
                phase: 'Phase 5',
                title: 'Annual Renewals',
                description: '90-day reports, keep money in account, annual photos of couple together, annual extensions.',
                completed: false
              }
            ]
          };
        } else {
          return {
            visa: 'Non-Immigrant O (Marriage) - Applied from Abroad',
            phases: [
              {
                phase: 'Phase 1',
                title: 'Legal Marriage',
                description: 'Register marriage at Thai Amphur. Translate and legalize marriage certificate.',
                completed: false
              },
              {
                phase: 'Phase 2',
                title: 'Apply at Embassy',
                description: 'Apply at Thai embassy with marriage cert, spouse documents, financial proof (400k THB OR 40k THB/month).',
                completed: false
              },
              {
                phase: 'Phase 3',
                title: 'Enter Thailand',
                description: 'Enter with 90-day Non-O marriage visa.',
                completed: false
              },
              {
                phase: 'Phase 4',
                title: 'Extend to 1 Year',
                description: 'Open Thai bank, deposit 400k THB, season 2 months, apply for 1-year extension (1,900 THB).',
                completed: false
              },
              {
                phase: 'Phase 5',
                title: 'Ongoing Compliance',
                description: '90-day reports, maintain money, annual renewals, possible home visits.',
                completed: false
              }
            ]
          };
        }
      } else {
        return {
          visa: 'Marriage Visa - Financial Requirements Not Met',
          phases: [{
            phase: 'Action Required',
            title: 'Build Financial Reserves',
            description: `Need ${Math.max(0, 400000 - thbSavings).toLocaleString()} more THB in savings OR ${Math.max(0, 40000 - thbIncome).toLocaleString()} more THB monthly income. Minimum: 400,000 THB in Thai bank OR 40,000 THB/month from abroad.`,
            completed: false
          }]
        };
      }
    }

    // MEDICAL VISA
    if (goal === 'medical') {
      return {
        visa: 'Medical Treatment Visa (MT)',
        phases: [
          {
            phase: 'Phase 1',
            title: 'Get Hospital Documentation',
            description: 'Obtain letter from Thai hospital confirming appointment and treatment plan. Include medical records from home country.',
            completed: false
          },
          {
            phase: 'Phase 2',
            title: 'Apply for MT Visa',
            description: isInsideThailand 
              ? 'Apply at immigration with hospital letter. Usually granted 60-90 days.'
              : 'Apply at Thai embassy with medical documents. Usually granted 60-90 days.',
            completed: false
          },
          {
            phase: 'Phase 3',
            title: 'Treatment & Extensions',
            description: 'Can extend inside Thailand with continued medical documentation from hospital. Extensions granted based on treatment needs.',
            completed: false
          }
        ]
      };
    }

    // INVESTMENT VISA
    if (goal === 'investment') {
      return {
        visa: 'Non-Immigrant IB/IM (Investment)',
        phases: [
          {
            phase: 'Phase 1',
            title: 'BOI Approval',
            description: 'Register investment project with Board of Investment. Meet minimum investment thresholds (typically 3M+ THB depending on industry).',
            completed: false
          },
          {
            phase: 'Phase 2',
            title: 'Apply for Investment Visa',
            description: 'Apply at Thai embassy (or inside Thailand if converting) with BOI promotion certificate and investment documents.',
            completed: false
          },
          {
            phase: 'Phase 3',
            title: 'Ongoing Requirements',
            description: 'Maintain investment, annual reporting to BOI, annual visa extensions at immigration.',
            completed: false
          }
        ]
      };
    }

    // VOLUNTEER VISA
    if (goal === 'volunteer') {
      return {
        visa: 'Non-Immigrant O (Volunteer)',
        phases: [
          {
            phase: 'Phase 1',
            title: 'Partner with Registered NGO',
            description: 'Connect with Thai non-profit or charity registered with government.',
            completed: false
          },
          {
            phase: 'Phase 2',
            title: 'Get NGO Documentation',
            description: 'NGO provides: registration documents, acceptance letter, work plan, foundation license.',
            completed: false
          },
          {
            phase: 'Phase 3',
            title: 'Apply for Non-O',
            description: isInsideThailand 
              ? 'Convert at immigration with NGO documents (2,000 THB).'
              : 'Apply at Thai embassy with NGO documents.',
            completed: false
          },
          {
            phase: 'Phase 4',
            title: 'Extensions',
            description: 'Initial 90 days, then 1-year extensions with continued NGO documentation.',
            completed: false
          }
        ]
      };
    }

    // TOURIST / DEFAULT
    return {
      visa: 'Tourist Options',
      phases: [
        {
          phase: 'Option 1',
          title: 'Visa Exemption (Free)',
          description: 'Most nationalities get 30-60 days visa-free on arrival. Can extend 30 days at immigration (1,900 THB). No application needed.',
          completed: false
        },
        {
          phase: 'Option 2',
          title: 'Tourist Visa (60 days)',
          description: isInsideThailand 
            ? 'Cannot apply inside Thailand - must apply from home country embassy. Get 60 days, extendable to 90 days total.'
            : 'Apply at Thai embassy. Receive 60 days (single or multiple entry available). Can extend 30 days inside Thailand.',
          completed: false
        },
        {
          phase: 'Phase 3',
          title: 'Consider Other Options',
          description: 'If staying longer, explore visa types matching your situation: retirement (50+), marriage, education, work, or DTV.',
          completed: false
        }
      ]
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const generatedRoadmap = generateRoadmap(data);

      return base44.entities.VisaJourney.create({
        user_email: user.email,
        ...data,
        recommended_visa: generatedRoadmap.visa,
        roadmap: generatedRoadmap.phases
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-journeys'] });
    }
  });

  const handleNext = () => {
    if (step === 3) {
      const result = generateRoadmap(formData);
      setRoadmap(result);
      saveMutation.mutate(formData);
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const isStepComplete = () => {
    if (step === 1) return formData.goal && formData.nationality;
    if (step === 2) return formData.age && formData.location;
    if (step === 3) return true; // Financial info is optional for some paths
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">{content.header.badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{content.header.title}</h1>
          <p className="text-white/90 text-lg">{content.header.subtitle}</p>
        </div>
      </div>

      {step <= 3 && (
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= num
                    ? 'bg-[#BF1E2E] text-white shadow-lg'
                    : 'bg-white text-[#454545] border border-[#E7E7E7]'
                }`}
              >
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 mx-2 rounded transition-all ${
                    step > num ? 'bg-[#BF1E2E]' : 'bg-[#E7E7E7]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-6">{content.step1.title}</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step1.goal_label}</Label>
              <VisaTypeSelect
                value={formData.goal}
                onValueChange={(val) => setFormData({ ...formData, goal: val })}
                placeholder={content.step1.goal_placeholder}
                className="h-14 text-lg"
                excludePermitsReports={true}
              />
            </div>

            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step1.nationality_label}</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder={content.step1.nationality_placeholder}
                className="h-14 text-lg border placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-10 py-6 text-lg font-bold shadow-lg"
            >
              {content.step1.next_button} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-6">{content.step2.title}</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step2.age_label}</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder={content.step2.age_placeholder}
                className="h-14 text-lg border placeholder:text-gray-400"
              />
            </div>

            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step2.location_label}</Label>
              <Select value={formData.location} onValueChange={(val) => setFormData({ ...formData, location: val })}>
                <SelectTrigger className="h-14 text-lg border placeholder:text-gray-400">
                  <SelectValue placeholder={content.step2.location_placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside_thailand">{content.step2.locations.outside_thailand}</SelectItem>
                  <SelectItem value="inside_thailand">{content.step2.locations.inside_thailand}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button onClick={handleBack} variant="outline" className="px-8 py-6 text-lg border border-[#E7E7E7]">
              <ArrowLeft className="w-5 h-5 mr-2" /> {content.step2.back_button}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-10 py-6 text-lg font-bold shadow-lg"
            >
              {content.step2.next_button} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {step === 3 && (
        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-6">{content.step3.title}</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step3.income_label}</Label>
              <Input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                placeholder={content.step3.income_placeholder}
                className="h-14 text-lg border placeholder:text-gray-400"
              />
            </div>

            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">{content.step3.savings_label}</Label>
              <Input
                type="number"
                value={formData.total_savings}
                onChange={(e) => setFormData({ ...formData, total_savings: e.target.value })}
                placeholder={content.step3.savings_placeholder}
                className="h-14 text-lg border placeholder:text-gray-400"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
              <p className="text-[#454545] font-medium">
                {content.step3.tip}
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button onClick={handleBack} variant="outline" className="px-8 py-6 text-lg border border-[#E7E7E7]">
              <ArrowLeft className="w-5 h-5 mr-2" /> {content.step3.back_button}
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-10 py-6 text-lg font-bold shadow-lg"
            >
              {content.step3.generate_button} <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {step === 4 && roadmap && (
        <div className="space-y-6">
          <GlassCard className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300" hover={false}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
              <span className="text-green-700 text-sm font-bold">{content.result.badge}</span>
            </div>
            <h2 className="text-3xl font-bold text-[#272262] mb-2">{content.result.title}</h2>
            <p className="text-[#454545] text-lg"><span className="font-bold">{content.result.recommended}</span> <span className="text-[#BF1E2E] font-bold">{roadmap.visa}</span></p>
          </GlassCard>

          {roadmap.phases.map((phase, index) => (
            <GlassCard key={index} className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#454545] font-medium mb-1">{phase.phase}</div>
                  <h3 className="text-xl font-bold text-[#272262] mb-3">{phase.title}</h3>
                  <p className="text-[#454545] leading-relaxed">{phase.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}

          <ContactCTA message={content.result.help_message} />

          {/* Try Our Other Tools Section */}
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#272262] mb-3">Continue Your Visa Journey</h2>
              <p className="text-[#454545] text-lg">Use these tools to prepare your application</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ToolCard
                title="Document Checker"
                description="Upload your documents and photos. Our AI checks everything against official requirements before you submit."
                features={['Photo validator', 'Requirement checker', 'Mistake prevention']}
                icon={FileCheck}
                color="bg-gradient-to-br from-[#BF1E2E] to-[#d94656]"
                page="DocumentValidator"
              />
              
              <ToolCard
                title="Immigration Office Finder"
                description="Find the nearest immigration office with live GPS directions. See hours, services, and get turn-by-turn navigation."
                features={['GPS directions', 'Office hours', 'Service information']}
                icon={MapPin}
                color="bg-gradient-to-br from-[#272262] to-[#3d3680]"
                page="ImmigrationMap"
              />

              <ToolCard
                title="Office Visit Simulator"
                description="Practice your immigration office visit before you go. Know exactly what to expect and what to bring."
                features={['Step-by-step guide', 'Visual walkthrough', 'Preparation checklist']}
                icon={Building2}
                color="bg-gradient-to-br from-[#BF1E2E] to-[#d94656]"
                page="ImmigrationSimulator"
              />

              <ToolCard
                title="90-Day Report Tracker"
                description="Never miss a deadline again. Automatic reminders ensure you file your 90-day report on time, every time."
                features={['Automatic calculations', 'Email reminders', 'Deadline tracking']}
                icon={Calendar}
                color="bg-gradient-to-br from-[#272262] to-[#3d3680]"
                page="AdminManager"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <p className="text-[#454545] mb-4">
              {content.result.saved_message}
            </p>
            <Button
              onClick={() => {
                setStep(1);
                setFormData({
                  goal: '',
                  nationality: '',
                  age: '',
                  location: '',
                  monthly_income: '',
                  total_savings: ''
                });
                setRoadmap(null);
              }}
              variant="outline"
              className="border border-[#272262] text-[#272262] hover:bg-[#F8F9FA]"
            >
              {content.result.start_new}
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
