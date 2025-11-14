import React, { useState } from 'react';
import { Scale, DollarSign, Clock, AlertTriangle, Shield, CheckCircle2, XCircle } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import VisaTypeSelect from '../../components/VisaTypeSelect';

import SEOHead from '../../components/SEOHead';export default function AgentComparison() {
  const [selectedVisa, setSelectedVisa] = useState('');
  const [comparison, setComparison] = useState(null);

  // COMPREHENSIVE comparisons - keys match VisaTypeSelect EXACTLY
  const comparisons = {
    // Visa Exemption
    'visa-exemption': {
      name: 'Visa Exemption (30/45/60/90 days on arrival)',
      diy: {
        cost: 0,
        costDetails: 'Free - stamp on arrival',
        time: '30-60 minutes',
        timeDetails: 'Immigration queue at airport',
        hassle: 'Very Low',
        hassleDetails: 'Automatic stamp, no application needed',
        risk: 'Very Low',
        riskDetails: 'Rarely denied if passport valid'
      },
      agent: {
        time: 'N/A',
        timeDetails: 'No agent needed for arrival',
        hassle: 'N/A',
        hassleDetails: 'Not applicable - automatic process',
        risk: 'N/A',
        riskDetails: 'Not applicable'
      }
    },

    '30-day-extension': {
      name: '30-Day Extension of Visa Exemption',
      diy: {
        cost: 1900,
        costDetails: 'Government extension fee',
        time: '1-3 hours',
        timeDetails: 'Queue at immigration office',
        hassle: 'Low-Medium',
        hassleDetails: 'Simple but crowded',
        risk: 'Very Low',
        riskDetails: 'Hard to mess up - straightforward'
      },
      agent: {
        time: '10 minutes',
        timeDetails: 'Hand over passport',
        hassle: 'None',
        hassleDetails: 'Completely hands-off',
        risk: 'None',
        riskDetails: 'Simple task'
      }
    },

    // Retirement Visas
    'retirement-o-first-time': {
      name: 'Non-O Retirement (First Time - 90 Days Inside Thailand)',
      diy: {
        cost: 2000,
        costDetails: 'Government visa change fee',
        time: '4-6 hours + 2-week processing',
        timeDetails: 'Application day + pickup day',
        hassle: 'High',
        hassleDetails: 'Must have 15+ days on visa, complex bank requirements',
        risk: 'Medium-High',
        riskDetails: 'Timing critical, bank requirements strict'
      },
      agent: {
        time: '30-60 minutes',
        timeDetails: 'Initial consultation only',
        hassle: 'Low',
        hassleDetails: 'Agent handles timing and requirements',
        risk: 'Low',
        riskDetails: 'Agent knows office-specific rules'
      }
    },

    'retirement-extension': {
      name: 'Retirement Extension (1-Year Annual)',
      diy: {
        cost: 1900,
        costDetails: 'Government extension fee only',
        time: '4-8 hours',
        timeDetails: 'Full day at immigration office',
        hassle: 'High',
        hassleDetails: 'Long queues, complex bank paperwork',
        risk: 'Medium',
        riskDetails: 'Missing documents or incorrect seasoning = wasted day'
      },
      agent: {
        time: '30 minutes',
        timeDetails: 'Drop off passport, pick up later',
        hassle: 'Very Low',
        hassleDetails: 'Agent handles everything',
        risk: 'Very Low',
        riskDetails: 'Professional ensures all requirements perfect'
      }
    },

    'retirement-oa': {
      name: 'Non-O-A Retirement Visa (Apply Abroad)',
      diy: {
        cost: 5000,
        costDetails: 'Embassy visa fee (varies by country)',
        time: '3-5 days + travel',
        timeDetails: 'Document prep + embassy visit + processing',
        hassle: 'High',
        hassleDetails: 'Police clearance, health insurance, bank statements',
        risk: 'Medium',
        riskDetails: 'Requirements vary by embassy'
      },
      agent: {
        time: '1-2 hours',
        timeDetails: 'Provide documents to agent',
        hassle: 'Low',
        hassleDetails: 'Agent handles embassy communication',
        risk: 'Low',
        riskDetails: 'Agent knows embassy requirements'
      }
    },

    'retirement-ox': {
      name: 'Non-O-X Long-Stay (5-10 Year)',
      diy: {
        cost: 10000,
        costDetails: '10,000 THB for 5-year visa',
        time: '4-6 hours',
        timeDetails: 'Embassy application + processing',
        hassle: 'High',
        hassleDetails: 'Strict financial requirements, extensive documentation',
        risk: 'High',
        riskDetails: 'Very strict income/pension requirements'
      },
      agent: {
        time: '1-2 hours',
        timeDetails: 'Document consultation',
        hassle: 'Medium',
        hassleDetails: 'Agent helps with complex requirements',
        risk: 'Medium',
        riskDetails: 'Still challenging even with agent'
      }
    },

    'ltr-wealthy': {
      name: 'LTR Visa (Wealthy Pensioner - 10 Year)',
      diy: {
        cost: 50000,
        costDetails: 'Government fee (10-year visa)',
        time: '6-10 hours',
        timeDetails: 'Complex application + documentation',
        hassle: 'Very High',
        hassleDetails: 'Strict financial requirements, extensive docs',
        risk: 'High',
        riskDetails: 'High income requirements (1M+ USD assets)'
      },
      agent: {
        time: '2-3 hours',
        timeDetails: 'Multiple consultations',
        hassle: 'Medium',
        hassleDetails: 'Agent guides through complexity',
        risk: 'Medium',
        riskDetails: 'Professional support valuable'
      }
    },

    // Work Visas
    'business': {
      name: 'Business Visa Non-B + Work Permit',
      diy: {
        cost: 4900,
        costDetails: '1,900 THB visa + 3,000 THB work permit',
        time: '8-12 hours',
        timeDetails: 'Multiple office visits over several days',
        hassle: 'Very High',
        hassleDetails: 'Multiple offices, employer coordination',
        risk: 'High',
        riskDetails: 'Easy to make mistakes, timing critical'
      },
      agent: {
        time: '1-2 hours',
        timeDetails: 'Consultation + handover',
        hassle: 'Very Low',
        hassleDetails: 'Agent coordinates everything',
        risk: 'Low',
        riskDetails: 'High success rate'
      }
    },

    'smart-visa': {
      name: 'SMART Visa',
      diy: {
        cost: 0,
        costDetails: 'Free for approved applicants',
        time: '8-12 hours',
        timeDetails: 'Complex application process',
        hassle: 'Very High',
        hassleDetails: 'Highly specialized, complex requirements',
        risk: 'High',
        riskDetails: 'Very specific qualifications needed'
      },
      agent: {
        time: '2-3 hours',
        timeDetails: 'Multiple consultations',
        hassle: 'Medium',
        hassleDetails: 'Still complex but guided',
        risk: 'Medium',
        riskDetails: 'Agent helps navigate requirements'
      }
    },

    'ltr-professional': {
      name: 'LTR Visa (Work-From-Thailand Professional)',
      diy: {
        cost: 50000,
        costDetails: 'Government fee (10-year visa)',
        time: '6-10 hours',
        timeDetails: 'Complex application',
        hassle: 'Very High',
        hassleDetails: 'Strict income requirements (80k+ USD/year)',
        risk: 'High',
        riskDetails: 'High salary requirements, extensive proof'
      },
      agent: {
        time: '2-3 hours',
        timeDetails: 'Multiple consultations',
        hassle: 'Medium',
        hassleDetails: 'Agent guides through complexity',
        risk: 'Medium',
        riskDetails: 'Professional support valuable'
      }
    },

    // Digital Nomad
    'dtv': {
      name: 'Destination Thailand Visa (DTV)',
      diy: {
        cost: 10000,
        costDetails: 'E-visa fee only',
        time: '2-4 hours',
        timeDetails: 'Online application + document prep',
        hassle: 'Medium',
        hassleDetails: 'Online system, document formatting',
        risk: 'Medium-High',
        riskDetails: 'Application errors = rejection & lost 10k THB'
      },
      agent: {
        time: '30 minutes',
        timeDetails: 'Provide docs to agent',
        hassle: 'Very Low',
        hassleDetails: 'Agent handles application',
        risk: 'Low',
        riskDetails: 'Agent reviews before submission'
      }
    },

    // Education
    'education': {
      name: 'Education Visa (Non-ED)',
      diy: {
        cost: 2000,
        costDetails: 'Visa application fee',
        time: '3-5 hours',
        timeDetails: 'School coordination + office visit',
        hassle: 'Medium',
        hassleDetails: 'School document coordination',
        risk: 'Medium',
        riskDetails: 'School paperwork must be perfect'
      },
      agent: {
        time: '30 minutes',
        timeDetails: 'Document handover',
        hassle: 'Low',
        hassleDetails: 'Agent coordinates with school',
        risk: 'Low',
        riskDetails: 'Professional handling'
      }
    },

    // Family Visas
    'marriage': {
      name: 'Marriage Visa (Non-O)',
      diy: {
        cost: 1900,
        costDetails: 'Government extension fee (after initial 90-day)',
        time: '4-8 hours',
        timeDetails: 'Full day + possible home visit',
        hassle: 'High',
        hassleDetails: 'Complex spouse docs, photos, home visit stress',
        risk: 'Medium',
        riskDetails: 'Missing spouse docs or failed home visit = rejection'
      },
      agent: {
        time: '30-60 minutes',
        timeDetails: 'Consultation + handover',
        hassle: 'Low',
        hassleDetails: 'Agent coordinates home visit',
        risk: 'Low',
        riskDetails: 'Agent knows procedures'
      }
    },

    'dependent': {
      name: 'Dependent Visa (Non-O)',
      diy: {
        cost: 1900,
        costDetails: 'Government fee',
        time: '3-5 hours',
        timeDetails: 'Half day at immigration',
        hassle: 'Medium',
        hassleDetails: 'Sponsor docs coordination',
        risk: 'Medium',
        riskDetails: 'Sponsor documentation errors'
      },
      agent: {
        time: '30 minutes',
        timeDetails: 'Brief consultation',
        hassle: 'Low',
        hassleDetails: 'Agent coordinates with sponsor',
        risk: 'Low',
        riskDetails: 'Professional handling'
      }
    },

    'thai-child': {
      name: 'Thai Child Visa (Non-O)',
      diy: {
        cost: 1900,
        costDetails: 'Government fee',
        time: '3-5 hours',
        timeDetails: 'Child document coordination',
        hassle: 'Medium-High',
        hassleDetails: 'Birth certificate, child docs, proof of parentage',
        risk: 'Medium',
        riskDetails: 'Complex child documentation'
      },
      agent: {
        time: '30-60 minutes',
        timeDetails: 'Consultation',
        hassle: 'Low',
        hassleDetails: 'Agent handles child documentation',
        risk: 'Low',
        riskDetails: 'Professional guidance'
      }
    },

    // Tourist
    'tourist': {
      name: 'Tourist Visa (TR)',
      diy: {
        cost: 1000,
        costDetails: 'Single entry visa fee (varies by embassy)',
        time: '2-4 hours + processing',
        timeDetails: 'Embassy application + 3-5 day wait',
        hassle: 'Low-Medium',
        hassleDetails: 'Embassy visit, simple requirements',
        risk: 'Low',
        riskDetails: 'Usually straightforward'
      },
      agent: {
        time: '30 minutes',
        timeDetails: 'Document handover',
        hassle: 'Very Low',
        hassleDetails: 'Agent handles embassy visit',
        risk: 'Very Low',
        riskDetails: 'Simple process'
      }
    },

    'medical': {
      name: 'Medical Treatment Visa (MT)',
      diy: {
        cost: 2000,
        costDetails: 'Visa application fee',
        time: '4-6 hours',
        timeDetails: 'Hospital coordination + application',
        hassle: 'Medium-High',
        hassleDetails: 'Medical certificates, hospital letters required',
        risk: 'Medium',
        riskDetails: 'Hospital documentation must be complete'
      },
      agent: {
        time: '1 hour',
        timeDetails: 'Consultation + document review',
        hassle: 'Low',
        hassleDetails: 'Agent coordinates with hospital',
        risk: 'Low',
        riskDetails: 'Professional hospital coordination'
      }
    },

    // Investment & Premium
    'investment': {
      name: 'Investment Visa (Non-IB/IM)',
      diy: {
        cost: 2000,
        costDetails: 'Visa fee (minimum 3M THB investment required)',
        time: '8-12 hours',
        timeDetails: 'Complex business documentation',
        hassle: 'Very High',
        hassleDetails: 'Company formation, BOI approval, investment proof',
        risk: 'High',
        riskDetails: 'Very complex business requirements'
      },
      agent: {
        time: '3-5 hours',
        timeDetails: 'Multiple consultations',
        hassle: 'Medium',
        hassleDetails: 'Still complex but professionally guided',
        risk: 'Medium',
        riskDetails: 'Agent navigates BOI and company setup'
      }
    },

    'elite': {
      name: 'Thailand Elite/Privilege Visa',
      diy: {
        cost: 600000,
        costDetails: 'Membership fee (5-year, varies by tier)',
        time: '2-4 hours',
        timeDetails: 'Application + payment process',
        hassle: 'Low',
        hassleDetails: 'Pay and apply - straightforward premium service',
        risk: 'Very Low',
        riskDetails: 'Direct program, clear process'
      },
      agent: {
        time: '1 hour',
        timeDetails: 'Application assistance',
        hassle: 'Very Low',
        hassleDetails: 'Agent assists with paperwork',
        risk: 'Very Low',
        riskDetails: 'Simple premium service'
      }
    },

    // Other
    'volunteer': {
      name: 'Volunteer Visa (Non-O)',
      diy: {
        cost: 2000,
        costDetails: 'Visa application fee',
        time: '4-6 hours',
        timeDetails: 'Organization + immigration coordination',
        hassle: 'High',
        hassleDetails: 'Complex organization documents, approval letters',
        risk: 'Medium-High',
        riskDetails: 'Organization docs must be perfect'
      },
      agent: {
        time: '1 hour',
        timeDetails: 'Consultation + document review',
        hassle: 'Low',
        hassleDetails: 'Agent handles coordination',
        risk: 'Low',
        riskDetails: 'Professional support'
      }
    },

    'transit': {
      name: 'Transit Visa (TS)',
      diy: {
        cost: 800,
        costDetails: 'Transit visa fee',
        time: '1-2 hours',
        timeDetails: 'Embassy application',
        hassle: 'Low',
        hassleDetails: 'Simple requirements, onward ticket needed',
        risk: 'Very Low',
        riskDetails: 'Straightforward process'
      },
      agent: {
        time: '15 minutes',
        timeDetails: 'Quick handover',
        hassle: 'Very Low',
        hassleDetails: 'Agent handles application',
        risk: 'Very Low',
        riskDetails: 'Simple task'
      }
    },

    // Permits & Reports
    're-entry': {
      name: 'Re-Entry Permit (Single or Multiple)',
      diy: {
        cost: 1000,
        costDetails: '1,000 THB single / 3,800 THB multiple',
        time: '30-60 minutes',
        timeDetails: 'Immigration office or airport',
        hassle: 'Low',
        hassleDetails: 'Simple but must remember before travel',
        risk: 'Critical',
        riskDetails: 'Forgetting = VOIDED 1-year extension!'
      },
      agent: {
        time: '5 minutes',
        timeDetails: 'Hand passport to agent',
        hassle: 'None',
        hassleDetails: 'Agent ensures you never forget',
        risk: 'None',
        riskDetails: 'Peace of mind'
      }
    },

    '90-day-report': {
      name: '90-Day Report (TM.47)',
      diy: {
        cost: 0,
        costDetails: 'Free - no government fee',
        time: '15-45 minutes',
        timeDetails: 'Quick in-person visit or online',
        hassle: 'Low',
        hassleDetails: 'Simple process, shorter queue',
        risk: 'Very Low',
        riskDetails: 'Hard to mess up'
      },
      agent: {
        time: '5 minutes',
        timeDetails: 'Hand passport to agent',
        hassle: 'None',
        hassleDetails: 'Completely hands-off',
        risk: 'None',
        riskDetails: 'Simple task'
      }
    }
  };

  const handleVisaSelect = (visa) => {
    setSelectedVisa(visa);
    setComparison(comparisons[visa] || null);
  };

  return (
    <>
      <SEOHead page="AgentComparison" />
    <div className="max-w-6xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262] text-white border-none" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
          <Scale className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Make an Informed Decision</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Agent vs DIY Analyzer</h1>
        <p className="text-white/90 text-lg">Complete cost-benefit analysis for all visa services</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-[#272262] mb-3 placeholder:text-gray-400">Select Your Visa Type</h3>
        <VisaTypeSelect
          value={selectedVisa}
          onValueChange={handleVisaSelect}
          placeholder="Choose a visa type..."
          className="h-12 text-lg"
          excludePermitsReports={false}
        />
      </GlassCard>

      {comparison && (
        <>
          <GlassCard className="p-4 text-center" hover={false}>
            <h2 className="text-xl font-bold text-[#272262]">{comparison.name}</h2>
          </GlassCard>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* DIY Column */}
            <GlassCard className="p-6">
              <div className="text-center mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-[#272262]">Do It Yourself</h3>
                <p className="text-[#454545] text-sm mt-1">Save money, invest time</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Cost</div>
                      <div className="text-[#454545] text-xs">{comparison.diy.costDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-[#272262]">฿{comparison.diy.cost.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Time Investment</div>
                      <div className="text-[#454545] text-xs">{comparison.diy.timeDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className="text-xl font-bold text-[#272262]">{comparison.diy.time}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Hassle Factor</div>
                      <div className="text-[#454545] text-xs">{comparison.diy.hassleDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className={`text-xl font-bold ${
                      comparison.diy.hassle === 'Low' || comparison.diy.hassle === 'None' || comparison.diy.hassle === 'N/A' ? 'text-[#272262]' :
                      comparison.diy.hassle.includes('Medium') ? 'text-[#454545]' :
                      'text-[#BF1E2E]'
                    }`}>
                      {comparison.diy.hassle}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Rejection Risk</div>
                      <div className="text-[#454545] text-xs">{comparison.diy.riskDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className={`text-xl font-bold ${
                      comparison.diy.risk.includes('Very Low') || comparison.diy.risk === 'None' || comparison.diy.risk === 'N/A' ? 'text-[#272262]' :
                      comparison.diy.risk === 'Low' ? 'text-[#272262]' :
                      comparison.diy.risk.includes('Medium') || comparison.diy.risk === 'Critical' ? 'text-[#454545]' :
                      'text-[#BF1E2E]'
                    }`}>
                      {comparison.diy.risk}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Agent Column */}
            <GlassCard className="p-6 border-2 border-[#BF1E2E]">
              <div className="text-center mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-[#272262]">Use an Agent</h3>
                <p className="text-[#454545] text-sm mt-1">Professional assistance</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Cost</div>
                      <div className="text-[#454545] text-xs">Contact for quote</div>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-[#BF1E2E] p-4 rounded-xl shadow-sm">
                    <div className="text-lg font-bold text-[#BF1E2E]">
                      Contact for pricing
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Time Investment</div>
                      <div className="text-[#454545] text-xs">{comparison.agent.timeDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className="text-xl font-bold text-[#272262]">{comparison.agent.time}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Hassle Factor</div>
                      <div className="text-[#454545] text-xs">{comparison.agent.hassleDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className="text-xl font-bold text-[#272262]">
                      {comparison.agent.hassle}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#272262]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#272262] font-semibold">Rejection Risk</div>
                      <div className="text-[#454545] text-xs">{comparison.agent.riskDetails}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                    <div className="text-xl font-bold text-[#272262]">
                      {comparison.agent.risk}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="text-base font-bold text-[#272262] mb-3">Choose DIY If:</h4>
                <ul className="space-y-2 text-[#454545] text-sm">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You're on a tight budget</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You have time to spend at immigration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You're comfortable with paperwork</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Simple service (extensions, tourist visa)</span>
                  </li>
                </ul>
              </div>

              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="text-base font-bold text-[#272262] mb-3">Choose Agent If:</h4>
                <ul className="space-y-2 text-[#454545] text-sm">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Your time is valuable (work/business)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You want guaranteed success</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Complex case (business, marriage, conversions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>First-time visa application</span>
                  </li>
                </ul>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-[#272262] mb-2">How to Choose a Good Agent</h4>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[#454545] text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Ask for recommendations from expat groups</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#454545] text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Check online reviews and testimonials</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#454545] text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verify they have a physical office you can visit</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#454545] text-sm">
                    <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Avoid agents promising "guaranteed shortcuts"</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#454545] text-sm">
                    <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Never pay full amount upfront - 50% deposit maximum</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <ContactCTA message="Thai Nexus offers transparent, professional visa services" />
        </>
      )}

      {!comparison && selectedVisa && (
        <GlassCard className="p-12 text-center bg-blue-50 border-blue-200">
          <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#272262] mb-3">No Comparison Data Available</h3>
          <p className="text-[#454545] mb-6">
            We don't have cost comparison data for this visa type yet. Contact Thai Nexus for personalized guidance.
          </p>
          <ContactCTA message="Get Expert Help for Your Visa Type" />
        </GlassCard>
      )}
    </div>
    </>
  );
}