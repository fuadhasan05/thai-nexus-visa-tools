
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Navigation, ArrowRight, Calendar, AlertTriangle, CheckCircle2, HelpCircle, Phone } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import VisaTypeSelect, { VISA_OPTIONS_FLAT_PLANNING } from '../../components/VisaTypeSelect'; // Changed import
import SEOHead from '../../components/SEOHead';

export default function PathwayPlanner() {
  const [currentVisa, setCurrentVisa] = useState('');
  const [targetVisa, setTargetVisa] = useState('');
  const [pathway, setPathway] = useState(null);

  const generatePathway = () => {
    if (!currentVisa || !targetVisa) {
      alert('Please select both current and target visa types');
      return;
    }

    if (currentVisa === targetVisa) {
      alert('Current and target visa cannot be the same');
      return;
    }

    // Get visa labels
    const currentLabel = VISA_OPTIONS_FLAT_PLANNING.find(v => v.value === currentVisa)?.label || currentVisa;
    const targetLabel = VISA_OPTIONS_FLAT_PLANNING.find(v => v.value === targetVisa)?.label || targetVisa;

    // Define comprehensive transitions covering ALL visa types
    const commonTransitions = {
      // Visa Exemption transitions
      'visa-exemption-30-day-extension': {
        possible: true,
        difficulty: 'Very Easy',
        timeline: '1 day',
        steps: [
          'Visit local immigration office before your visa exemption expires',
          'Bring passport, TM.7 form, 4x6cm photo, copies of passport pages',
          'Pay 1,900 THB fee in cash',
          'Receive 30-day extension stamp immediately'
        ],
        requirements: ['Valid visa exemption stamp', '1,900 THB cash', 'TM.30 receipt'],
        cost: '1,900 THB',
        notes: 'Can only be done ONCE per entry. Cannot extend again after this.'
      },
      'visa-exemption-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 months',
        steps: [
          'Must be 50+ years old',
          'Open Thai bank account and deposit 800,000 THB',
          'Wait 2 months for seasoning',
          'Apply for 90-day Non-O at immigration (15+ days before exemption expires)',
          'After receiving 90-day Non-O, apply for 1-year extension'
        ],
        requirements: ['Age 50+', '800,000 THB in bank', '15+ days remaining on current stamp'],
        cost: '2,000 THB (90-day) + 1,900 THB (1-year extension)',
        notes: 'Common path for retirees. Can be done inside Thailand.'
      },
      'visa-exemption-tourist': {
        possible: false,
        difficulty: 'Impossible',
        reason: 'Cannot convert visa exemption to tourist visa inside Thailand',
        alternative: 'Exit Thailand and apply for 60-day tourist visa at Thai embassy/consulate in neighboring country',
        notes: 'Tourist visa must be applied for from outside Thailand'
      },
      'visa-exemption-dtv': {
        possible: false,
        difficulty: 'Impossible',
        reason: 'DTV must be applied for outside Thailand',
        alternative: 'Exit Thailand and apply for DTV at Thai embassy in home country or approved location',
        cost: '10,000 THB e-visa fee',
        notes: '5-year validity, requires 500,000 THB in bank and proof of remote work'
      },
      'visa-exemption-marriage': {
        possible: true,
        difficulty: 'High',
        timeline: '1-2 months',
        steps: [
          'Must be married to Thai citizen',
          'Open bank account with 400,000 THB OR prove 40,000 THB/month income',
          'Apply for 90-day Non-O Marriage at immigration',
          'After 90 days, extend to 1 year'
        ],
        requirements: ['Married to Thai', '400k THB OR 40k/month', 'Marriage certificate'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Must have 15+ days remaining. Home visit likely.'
      },
      'visa-exemption-education': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-4 weeks',
        steps: [
          'Enroll in approved Thai school/university',
          'School provides acceptance letter and documents',
          'Apply for 90-day Non-ED at immigration',
          'Cannot work on ED visa'
        ],
        requirements: ['School enrollment', 'Tuition payment', '15+ days remaining'],
        cost: '2,000 THB + school fees',
        notes: 'Popular for learning Thai language'
      },
      'visa-exemption-business': {
        possible: true,
        difficulty: 'Very High',
        timeline: '2-3 months',
        steps: [
          'Secure job offer and company sponsorship',
          'Company prepares WP3 documents',
          'Convert to 90-day Non-B inside Thailand OR exit and apply at embassy',
          'Obtain work permit after visa approved'
        ],
        requirements: ['Bachelor degree', 'Company sponsorship', 'Work permit approval'],
        cost: '2,000 THB visa + 3,000 THB work permit',
        notes: 'Very difficult without existing sponsorship'
      },

      // 30-Day Extension transitions
      '30-day-extension-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 months',
        steps: [
          'While on 30-day extension, open bank account',
          'Deposit 800,000 THB and wait 2 months',
          'Before extension expires, apply for 90-day Non-O Retirement',
          'Then extend to 1 year'
        ],
        requirements: ['Age 50+', '800,000 THB', 'Extension not yet expired'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Timing is tight - plan ahead'
      },

      // Tourist to other visas
      'tourist-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 weeks',
        steps: [
          'Must have 15+ days remaining on tourist visa',
          'Open Thai bank account and deposit 800,000 THB',
          'Wait 2 months for bank seasoning',
          'Apply for 90-day Non-O Retirement at local immigration',
          'After 90 days, apply for 1-year extension'
        ],
        requirements: ['Age 50+', '800,000 THB in Thai bank', 'Health insurance recommended'],
        cost: '2,000 THB (90-day) + 1,900 THB (1-year extension)',
        notes: 'Most common path. Can be done inside Thailand without leaving.'
      },
      'tourist-marriage': {
        possible: true,
        difficulty: 'High',
        timeline: '1-2 months',
        steps: [
          'Must be legally married to Thai citizen',
          'Open bank account with 400,000 THB OR show 40,000 THB/month income',
          'Apply for 90-day Non-O Marriage visa',
          'After 90 days, extend to 1-year'
        ],
        requirements: ['Married to Thai national', '400k THB OR 40k/month income', 'Marriage certificate'],
        cost: '2,000 THB + 1,900 THB annual extension',
        notes: 'Home visits by immigration are common. Marriage must be genuine.'
      },
      'tourist-education': {
        possible: true,
        difficulty: 'Low',
        timeline: '2-4 weeks',
        steps: [
          'Enroll in approved Thai language school or university',
          'School provides acceptance letter',
          'Convert tourist visa to Non-ED at immigration',
          'Attend classes with 80%+ attendance'
        ],
        requirements: ['School enrollment', 'Tuition payment proof', 'Cannot work on ED visa'],
        cost: '2,000 THB + school fees (10,000-40,000 THB/year)',
        notes: 'Cannot work legally. Popular for learning Thai language.'
      },
      'tourist-business': {
        possible: true,
        difficulty: 'Very High',
        timeline: '1-3 months',
        steps: [
          'Secure job offer from Thai company',
          'Company must sponsor work permit',
          'Company prepares WP3 form and documents',
          'Convert to Non-B visa inside Thailand OR leave and apply at embassy',
          'Obtain work permit after visa approved'
        ],
        requirements: ['Bachelor degree', 'Thai company sponsorship', 'Work permit approved'],
        cost: '2,000 THB visa + 3,000 THB work permit',
        notes: 'Difficult without existing company sponsorship. Company must meet requirements.'
      },
      'tourist-dtv': {
        possible: false,
        difficulty: 'Impossible',
        reason: 'DTV must be applied for outside Thailand at Thai embassy/consulate',
        alternative: 'Exit Thailand and apply for DTV at embassy in your home country or nearby country',
        cost: '10,000 THB e-visa fee',
        notes: 'Popular for digital nomads. 5-year validity, 180-day stays.'
      },

      // Retirement transitions
      'retirement-o-first-time-retirement-extension': {
        possible: true,
        difficulty: 'Easy',
        timeline: '1 day',
        steps: [
          'Before 90-day Non-O expires, go to immigration',
          'Bring all required documents (bank letter, bank book, etc)',
          'Money must be seasoned 2 months',
          'Receive 1-year extension stamp'
        ],
        requirements: ['800,000 THB seasoned 2 months', 'TM.30', 'Bank documents'],
        cost: '1,900 THB',
        notes: 'Natural progression from 90-day Non-O'
      },
      'retirement-extension-ltr-wealthy': {
        possible: true,
        difficulty: 'Low',
        timeline: '1-2 months',
        steps: [
          'Meet LTR Wealthy Pensioner requirements',
          'Apply online via LTR website',
          'Submit documents (passport, pension proof, health insurance)',
          'Wait for approval (2-4 weeks)',
          'Receive 10-year LTR visa'
        ],
        requirements: ['Age 50+', '$80,000/year pension OR $250k investment', '$100k health insurance'],
        cost: '50,000 THB for 10 years',
        notes: 'Best upgrade from retirement visa. No 90-day reports, minimal renewals.'
      },
      'retirement-o-first-time-ltr-wealthy': {
        possible: true,
        difficulty: 'Low',
        timeline: '1-2 months',
        steps: [
          'Apply for LTR online while on Non-O',
          'Submit financial proof and documents',
          'Receive 10-year LTR approval',
          'Convert from Non-O to LTR'
        ],
        requirements: ['$80,000/year OR $250k assets', '$100k health insurance'],
        cost: '50,000 THB',
        notes: 'Skip the 1-year extension route and go straight to LTR'
      },

      // Education to work
      'education-business': {
        possible: true,
        difficulty: 'High',
        timeline: '2-3 months',
        steps: [
          'Find Thai company willing to sponsor',
          'Graduate or cancel ED visa',
          'Company applies for work permit',
          'Convert to Non-B visa at immigration',
          'Receive work permit'
        ],
        requirements: ['Bachelor degree', 'Company sponsorship', 'Job offer'],
        cost: '2,000 THB visa + 3,000 THB work permit',
        notes: 'Finding sponsorship is hardest part. Not automatic after graduation.'
      },

      // DTV transitions
      'dtv-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 months',
        steps: [
          'Wait until 50+ years old',
          'Open Thai bank account with 800,000 THB',
          'Season money for 2 months',
          'Apply for Non-O Retirement at immigration',
          'Extend to 1-year after 90 days'
        ],
        requirements: ['Age 50+', '800,000 THB', 'DTV must still be valid'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Common transition when reaching retirement age.'
      },
      'dtv-ltr-professional': {
        possible: true,
        difficulty: 'Low',
        timeline: '1-2 months',
        steps: [
          'Ensure income meets $80,000/year requirement',
          'Apply for LTR online',
          'Submit remote work contract and income proof',
          'Wait for approval',
          'Receive 10-year LTR'
        ],
        requirements: ['$80,000+ annual income', 'Remote employment', '$100k health insurance'],
        cost: '50,000 THB for 10 years',
        notes: 'Perfect upgrade for high-earning remote workers.'
      },
      'dtv-marriage': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Married to Thai citizen',
          'Meet financial requirements (400k THB)',
          'Apply for Non-O Marriage at immigration',
          'Extend to 1 year'
        ],
        requirements: ['Marriage certificate', '400k THB', 'DTV still valid'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Can switch if DTV doesn\'t suit lifestyle'
      },

      // Marriage transitions
      'marriage-ltr-wealthy': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Meet LTR Wealthy Pensioner requirements',
          'Apply online with marriage visa documentation',
          'Submit pension/investment proof',
          'Wait for approval'
        ],
        requirements: ['$80k pension OR $250k investment', '$100k health insurance'],
        cost: '50,000 THB',
        notes: 'Good option if you meet financial requirements.'
      },
      'marriage-business': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Secure job offer and sponsorship',
          'Company prepares documents',
          'Convert from Marriage Non-O to Non-B',
          'Obtain work permit'
        ],
        requirements: ['Company sponsorship', 'Work permit approval'],
        cost: '2,000 THB + 3,000 THB',
        notes: 'Switching from marriage to work visa is possible'
      },

      // Business to other types
      'business-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 months',
        steps: [
          'Must be 50+ years old',
          'Cancel work permit',
          'Meet financial requirements (800k THB)',
          'Convert to Non-O Retirement',
          'Extend to 1 year'
        ],
        requirements: ['Age 50+', '800k THB', 'Cancel work permit first'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Common when retiring from work'
      },
      'business-ltr-professional': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Meet $80,000 income requirement',
          'Apply for LTR online',
          'Submit employment documents',
          'Receive 10-year LTR',
          'Can continue working with digital work permit'
        ],
        requirements: ['$80k annual income', '$100k health insurance'],
        cost: '50,000 THB',
        notes: 'LTR includes work authorization'
      },

      // Elite to other types
      'elite-retirement-extension': {
        possible: false,
        difficulty: 'Not Recommended',
        reason: 'Elite visa already provides long-term stay (5-20 years). Converting to retirement would lose Elite benefits.',
        alternative: 'Keep Elite visa as it provides better benefits than retirement visa (no 90-day reports, VIP services, etc)',
        notes: 'Elite visa is superior to retirement visa in most ways'
      },
      'elite-business': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Secure company sponsorship',
          'Company prepares work permit documents',
          'Convert Elite to Non-B (or maintain Elite and get separate work permit)',
          'Obtain work permit'
        ],
        requirements: ['Company sponsorship', 'Work permit approval'],
        cost: '3,000 THB work permit',
        notes: 'Can maintain Elite visa while working'
      },

      // Investment to others
      'investment-business': {
        possible: true,
        difficulty: 'Low',
        timeline: '1 month',
        steps: [
          'Already have BOI approval',
          'Convert investment visa to Non-B',
          'Obtain work permit through same company',
          'Manage your investment'
        ],
        requirements: ['BOI approval maintained', 'Company registration'],
        cost: '3,000 THB work permit',
        notes: 'Natural progression for business investors'
      },

      // Volunteer to others
      'volunteer-business': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Cancel volunteer visa',
          'Secure company sponsorship',
          'Apply for Non-B',
          'Get work permit'
        ],
        requirements: ['Company sponsorship', 'Bachelor degree'],
        cost: '2,000 THB + 3,000 THB',
        notes: 'Transition from volunteer work to paid employment'
      },

      // LTR Wealthy to LTR Professional (and vice versa)
      'ltr-wealthy-ltr-professional': {
        possible: false,
        difficulty: 'Not Applicable',
        reason: 'Both are LTR visas. No need to convert - both provide 10-year stay.',
        alternative: 'Keep whichever LTR you have. Both provide same benefits.',
        notes: 'LTR visas cannot be "upgraded" or changed between categories'
      },

      // Thai Child visa transitions
      'thai-child-business': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Secure company sponsorship',
          'Convert from Thai Child Non-O to Non-B',
          'Obtain work permit'
        ],
        requirements: ['Company sponsorship', 'Bachelor degree'],
        cost: '2,000 THB + 3,000 THB',
        notes: 'Can maintain relationship with Thai child while working'
      },
      'thai-child-marriage': {
        possible: true,
        difficulty: 'Low',
        timeline: '1 month',
        steps: [
          'If married to Thai parent, convert to marriage visa',
          'Show marriage certificate',
          'Meet financial requirements',
          'Convert at immigration'
        ],
        requirements: ['Marriage certificate', '400k THB'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Natural transition if married to Thai parent'
      },

      // Dependent to others
      'dependent-business': {
        possible: true,
        difficulty: 'Medium',
        timeline: '1-2 months',
        steps: [
          'Secure own company sponsorship',
          'Convert dependent visa to Non-B',
          'Obtain work permit',
          'No longer dependent on sponsor\'s visa'
        ],
        requirements: ['Company sponsorship', 'Bachelor degree'],
        cost: '2,000 THB + 3,000 THB',
        notes: 'Gain independence from sponsor\'s visa'
      },
      'dependent-education': {
        possible: true,
        difficulty: 'Low',
        timeline: '2-3 weeks',
        steps: [
          'Enroll in approved educational institution',
          'Convert from dependent to ED visa',
          'Attend classes regularly'
        ],
        requirements: ['School enrollment', 'Tuition payment'],
        cost: '2,000 THB',
        notes: 'Common for spouse or children who want to study'
      },

      // SMART Visa transitions
      'smart-visa-ltr-professional': {
        possible: true,
        difficulty: 'Easy',
        timeline: '1-2 months',
        steps: [
          'Already meet income requirements',
          'Apply for LTR online',
          'Submit documents',
          'Upgrade to 10-year LTR'
        ],
        requirements: ['$80k income', '$100k insurance'],
        cost: '50,000 THB',
        notes: 'LTR provides even more benefits than SMART'
      },

      // Medical to others
      'medical-retirement-o-first-time': {
        possible: true,
        difficulty: 'Medium',
        timeline: '2-3 months',
        steps: [
          'Complete medical treatment',
          'Meet retirement requirements (age 50+, 800k THB)',
          'Apply for Non-O Retirement',
          'Extend to 1 year'
        ],
        requirements: ['Age 50+', '800k THB'],
        cost: '2,000 THB + 1,900 THB',
        notes: 'Common after long-term medical treatment'
      },

      // Transit visa (cannot convert)
      'transit-tourist': {
        possible: false,
        difficulty: 'Not Applicable',
        reason: 'Transit visa is only for passing through Thailand (max 30 days)',
        alternative: 'Exit Thailand and apply for tourist visa at Thai embassy',
        notes: 'Transit visas cannot be converted'
      }
    };

    // Check for direct transition
    const transitionKey = `${currentVisa}-${targetVisa}`;
    const reverseKey = `${targetVisa}-${currentVisa}`;

    if (commonTransitions[transitionKey]) {
      setPathway({
        ...commonTransitions[transitionKey],
        currentLabel,
        targetLabel
      });
    } else if (commonTransitions[reverseKey]) {
      // Reverse transition exists but is impossible
      setPathway({
        possible: false,
        difficulty: 'Not Possible',
        currentLabel,
        targetLabel,
        reason: `Cannot directly transition from ${currentLabel} to ${targetLabel}. The reverse transition exists, but this direction is not possible.`,
        alternative: `Consider alternative routes: 
        1. Exit Thailand and apply for ${targetLabel} at Thai embassy abroad
        2. Convert to an intermediate visa type first
        3. Contact Thai Nexus for assessment of your specific situation`,
        notes: 'Some visa transitions must be done from outside Thailand or require intermediate steps.'
      });
    } else {
      // Complex/uncommon transition - provide general guidance
      setPathway({
        possible: 'complex',
        difficulty: 'Complex',
        currentLabel,
        targetLabel,
        reason: `The transition from ${currentLabel} to ${targetLabel} is not a standard pathway. This transition may be possible but requires careful planning and assessment of your specific situation.`,
        alternative: `Possible approaches:
        1. Consult with immigration office for official guidance
        2. Exit Thailand and apply for ${targetLabel} at Thai embassy (cleanest option)
        3. Find an intermediate visa type that bridges these two
        4. Work with a professional visa agent who can assess your specific case`,
        notes: `Thai Nexus can help you navigate complex transitions. We'll assess:
        - Your current visa status and remaining validity
        - Eligibility for target visa type
        - Required documentation and timeline
        - Whether to convert inside Thailand or apply from abroad
        - Any potential complications or risks`,
        requiresConsultation: true,
        steps: [
          'Schedule consultation with Thai Nexus visa specialists',
          'Provide complete details of current visa and target visa',
          'Receive personalized transition plan and timeline',
          'Get assistance with document preparation',
          'Receive support throughout the application process'
        ]
      });
    }
  };

  return (
    <>
      <SEOHead page="PathwayPlanner" />
      <div className="max-w-4xl mx-auto space-y-8">
  <GlassCard className="p-8 text-center bg-linear-to-br from-[#272262] via-[#3d3680] to-[#272262] text-white border-none" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
          <Navigation className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Visa Transition Planner</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Long-Term Visa Strategy</h1>
        <p className="text-white/90 text-lg">Plan your visa transitions and find the best path forward</p>
      </GlassCard>

      {/* Visa Selection */}
      <GlassCard className="p-8 text-black">
        <h2 className="text-3xl font-bold text-[#272262] mb-6">Plan Your Visa Transition</h2>
        <div className="space-y-6">
          <div>
            <Label className="text-[#272262] mb-3 block font-medium text-xl">Current Visa Status</Label>
            <VisaTypeSelect
              value={currentVisa}
              onValueChange={setCurrentVisa}
              placeholder="Select your current visa"
              className="h-14 text-lg border border-[#d5d5d5]"
              excludePermitsReports={true}
            />
          </div>

          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Target Visa</Label>
            <VisaTypeSelect
              value={targetVisa}
              onValueChange={setTargetVisa}
              placeholder="Select your target visa"
              className="h-14 text-lg border border-[#d5d5d5]"
              excludePermitsReports={true}
            />
          </div>

          <Button
            onClick={generatePathway}
            disabled={!currentVisa || !targetVisa}
            className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-7 text-lg font-bold shadow-lg"
          >
            <Navigation className="w-6 h-6 mr-2" />
            Generate Transition Plan
          </Button>
        </div>
      </GlassCard>

      {/* Analysis Results */}
      {pathway && (
        <>
          {/* Status Banner */}
          <GlassCard className={`p-6 border-2 ${
            pathway.possible === true ? 'bg-green-50 border-green-300' :
            pathway.possible === false ? 'bg-red-50 border-red-300' :
            'bg-yellow-50 border-yellow-300'
          }`} hover={false}>
            <div className="flex items-center gap-4">
              {pathway.possible === true ? (
                <CheckCircle2 className="w-12 h-12 text-green-600 shrink-0" />
              ) : pathway.possible === false ? (
                <AlertTriangle className="w-12 h-12 text-red-600 shrink-0" />
              ) : (
                <HelpCircle className="w-12 h-12 text-yellow-600 shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#272262] mb-2">
                  {pathway.currentLabel} → {pathway.targetLabel}
                </h3>
                <p className={`text-lg font-semibold ${
                  pathway.possible === true ? 'text-green-700' :
                  pathway.possible === false ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {pathway.possible === true ? 'Transition Possible' :
                   pathway.possible === false ? 'Direct Transition Not Possible' :
                   'Complex Transition - Consultation Recommended'}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Transition Details */}
          {pathway.possible === true && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <GlassCard className="p-6 bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
                  <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Timeline</div>
                  <div className="text-2xl font-bold text-[#272262]">{pathway.timeline}</div>
                </GlassCard>
                <GlassCard className="p-6 bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
                  <AlertTriangle className="w-8 h-8 text-purple-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                  <div className="text-2xl font-bold text-[#272262]">{pathway.difficulty}</div>
                </GlassCard>
                <GlassCard className="p-6 bg-linear-to-br from-green-50 to-green-100 border-green-200">
                  <div className="text-4xl mb-3">฿</div>
                  <div className="text-sm text-gray-600 mb-1">Total Cost</div>
                  <div className="text-lg font-bold text-[#272262]">{pathway.cost}</div>
                </GlassCard>
              </div>

              <GlassCard className="p-8">
                <h3 className="text-2xl font-bold text-[#272262] mb-6">Transition Steps</h3>
                <div className="space-y-4">
                  {pathway.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#BF1E2E] text-white flex items-center justify-center font-bold shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-[#454545] flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-8">
                <h3 className="text-2xl font-bold text-[#272262] mb-4">Requirements</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {pathway.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="text-[#454545]">{req}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {pathway.notes && (
                <GlassCard className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#272262] mb-2">Important Notes</h4>
                      <p className="text-[#454545]">{pathway.notes}</p>
                    </div>
                  </div>
                </GlassCard>
              )}
            </>
          )}

          {/* Not Possible */}
          {pathway.possible === false && (
            <>
              <GlassCard className="p-8">
                <h3 className="text-2xl font-bold text-[#272262] mb-4">Why This Transition Is Not Possible</h3>
                <div className="p-6 bg-red-50 rounded-xl border border-red-200 mb-6">
                  <p className="text-[#454545] text-lg">{pathway.reason}</p>
                </div>

                {pathway.alternative && (
                  <>
                    <h4 className="text-xl font-bold text-[#272262] mb-4">Alternative Options</h4>
                    <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-[#454545]">{pathway.alternative}</p>
                    </div>
                  </>
                )}

                {pathway.notes && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-[#454545]">{pathway.notes}</p>
                  </div>
                )}
              </GlassCard>
            </>
          )}

          {/* Complex Cases */}
          {pathway.possible === 'complex' && pathway.requiresConsultation && (
            <GlassCard className="p-8 bg-linear-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start gap-4 mb-6">
                <Phone className="w-12 h-12 text-purple-600 shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-[#272262] mb-2">Expert Consultation Recommended</h3>
                  <p className="text-[#454545] text-lg mb-4">{pathway.reason}</p>
                  <p className="text-[#454545]">{pathway.alternative}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white rounded-xl border border-purple-200">
                  <h4 className="font-bold text-[#272262] mb-2">Why Consult Thai Nexus?</h4>
                  <ul className="space-y-2 text-sm text-[#454545]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Experience with complex visa transitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Personalized pathway planning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Handle rejected applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Navigate immigration office requirements</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-white rounded-xl border border-purple-200">
                  <h4 className="font-bold text-[#272262] mb-2">What We Can Help With</h4>
                  <ul className="space-y-2 text-sm text-[#454545]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>Multi-step transitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>Visa conversions inside Thailand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>Embassy applications abroad</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>Time-sensitive situations</span>
                    </li>
                  </ul>
                </div>
              </div>

              {pathway.notes && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-[#454545]">{pathway.notes}</p>
                </div>
              )}
            </GlassCard>
          )}
        </>
      )}

      <ContactCTA message="Need expert help planning your visa transition?" />
      </div>
    </>
  );
}
