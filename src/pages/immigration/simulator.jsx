import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, CheckCircle2, ArrowRight, FileText, Clock, Users, AlertCircle } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import VisaTypeSelect from '../../components/VisaTypeSelect';
import SEOHead from '../../components/SEOHead';

const simulationSteps = {
  // ============= VISA EXEMPTION & EXTENSIONS =============
  'visa-exemption': [
    {
      step: 1,
      title: 'Arrival at Airport/Border',
      icon: Building2,
      tasks: [
        'No advance preparation needed - automatic on arrival',
        'Passport must be valid 6+ months',
        'Have proof of onward travel ready (flight ticket out of Thailand)',
        'Carry proof of 20,000 THB funds (cash, bank statement, or credit card)',
        'Have accommodation details ready (hotel booking or address)',
        'Duration: 30, 45, 60, or 90 days depending on your nationality'
      ],
      timeEstimate: 'Instant at border',
      tips: 'Most nationalities get 60 days automatically. Check your passport stamp immediately - mistakes happen. You can extend once at immigration for 30 more days (1,900 THB).'
    },
    {
      step: 2,
      title: 'During Your Stay',
      icon: Clock,
      tasks: [
        'No 90-day reports required for visa exempt stays',
        'Monitor your "admitted until" date on passport stamp',
        'If staying longer than exemption, visit immigration BEFORE expiry',
        'Can extend once for 30 days at any immigration office'
      ],
      timeEstimate: 'Full duration of stay',
      tips: 'Overstaying by even 1 day results in 500 THB/day fine plus potential ban. Set phone reminders 1 week before expiry.'
    }
  ],
  '30-day-extension': [
    {
      step: 1,
      title: 'Before Immigration Visit',
      icon: FileText,
      tasks: [
        'Fill out TM.7 Extension Form (get from immigration or download online)',
        'Take 4x6cm photo (white background, NOT passport size)',
        'Photocopy passport: photo page, latest entry stamp, TM.6 departure card',
        'Get TM.30 receipt from your hotel/landlord (they file this within 24h of arrival)',
        'Prepare 1,900 THB cash exact (some offices have change, but not all)',
        'Apply BEFORE current stamp expires (ideally 1 week before)'
      ],
      timeEstimate: '30 minutes prep',
      tips: 'TM.30 is the most common missing document. If your hotel didn\'t file it, go to reception and ask them to file immediately. Some offices are strict about this.'
    },
    {
      step: 2,
      title: 'At Immigration Office',
      icon: Building2,
      tasks: [
        'Arrive EARLY (7:30 AM recommended) - very crowded',
        'Take queue number from machine (usually near entrance)',
        'Wait for your number on screen',
        'Submit all documents at extension counter',
        'Officer checks completeness and asks basic questions',
        'If approved, pay 1,900 THB cash at payment counter'
      ],
      timeEstimate: '2-4 hours total',
      tips: 'Bangkok immigration offices (Chaengwattana, Muang Thong Thani) are VERY crowded. Arrive by 7:30 AM or go on Wednesday/Thursday (less crowded). Bring water and snacks.'
    },
    {
      step: 3,
      title: 'Receive Extension',
      icon: CheckCircle2,
      tasks: [
        'Wait for passport processing (30 min - 2 hours)',
        'Collect passport with new stamp',
        'CHECK the "admitted until" date immediately',
        'Keep receipt and TM.6 departure card safe',
        'Extension adds 30 days from your CURRENT stamp (not application date)'
      ],
      timeEstimate: '30 min - 2 hours',
      tips: 'If date is wrong, tell officer IMMEDIATELY before leaving. Fixing mistakes later is very difficult.'
    }
  ],

  // ============= RETIREMENT VISAS =============
  'retirement-o-first-time': [
    {
      step: 1,
      title: 'Financial Preparation (2 Months Before)',
      icon: FileText,
      tasks: [
        'Open Thai bank account (some banks require Non-O visa first - catch-22 situation)',
        'Transfer 800,000 THB into account OR show 65,000 THB/month income',
        'Money must season 2 months BEFORE extension (not initial 90-day application)',
        'Get bank letter dated within 7 days of application',
        'Update bank book SAME DAY as immigration visit'
      ],
      timeEstimate: '2 months seasoning period',
      tips: 'Bangkok Bank and Kasikorn Bank are retirement-visa friendly. Bring your embassy letter and passport. Some offices allow 800k THB for initial Non-O without seasoning, but check YOUR specific office first.'
    },
    {
      step: 2,
      title: 'Document Gathering',
      icon: FileText,
      tasks: [
        'Fill TM.7 application form (black ink, no mistakes)',
        '4x6cm photo (NOT passport size, white background)',
        'Passport copies: photo page, visa stamps, entry stamp',
        'TM.30 receipt from landlord (must be filed within 24h of address change)',
        'House registration copy (tabien baan - from landlord)',
        'Rental contract OR house ownership documents',
        'Current visa with 15+ days remaining'
      ],
      timeEstimate: '1-2 hours',
      tips: 'Some offices accept pension statements as alternative to 800k THB. Check specific office requirements BEFORE going.'
    },
    {
      step: 3,
      title: 'Immigration Office Visit',
      icon: Building2,
      tasks: [
        'Arrive early (7:00-7:30 AM recommended)',
        'Take queue number for "retirement visa / Non-O"',
        'Submit documents at counter',
        'Officer interviews you briefly: where do you live, income source, etc.',
        'Passport photos taken, finger scanning',
        'Pay 2,000 THB application fee (CASH ONLY)',
        'Receive 90-day Non-O Retirement stamp'
      ],
      timeEstimate: '3-5 hours',
      tips: 'This gives you 90 days. You CANNOT work on this visa. Come back 45 days before expiry (after money seasons 2 months) to apply for 1-year extension.'
    },
    {
      step: 4,
      title: 'Extension to 1 Year (After 2 Months)',
      icon: Clock,
      tasks: [
        'Wait until money has been in bank 2 full months',
        'Get NEW bank letter (dated within 7 days)',
        'Update bank book SAME DAY',
        'Same documents as before + bank book copies',
        'Apply 45-21 days before 90-day stamp expires',
        'Pay 1,900 THB extension fee',
        'Receive "under consideration" stamp (usually 30 days)',
        'Return on specified date for 1-year extension stamp'
      ],
      timeEstimate: '3-4 hours + return visit',
      tips: 'The "under consideration" period allows immigration to verify your bank account. During this time, do NOT remove money from account or travel abroad without re-entry permit.'
    }
  ],

  'retirement-extension': [
    {
      step: 1,
      title: 'Before You Go (1-2 Days)',
      icon: FileText,
      tasks: [
        'Get bank letter (valid 7 days) - Go EARLY, long queues at banks',
        'Update bank book SAME DAY as appointment',
        'Print bank book copies (all pages, sign each)',
        'Print passport copies (photo page, visa, stamps)',
        'Fill out TM.7 form (black ink, no mistakes)',
        'Take 4x6cm photo (NOT passport size, white background)',
        'Get TM.30 receipt from landlord',
        'Bring 1,900 THB cash (exact change helps)',
        'Apply 45 days before current extension expires (not earlier, not later)'
      ],
      timeEstimate: '1-2 hours prep',
      tips: 'Money must be in account: 800,000 THB for 2 months before application, can drop to 400,000 THB for 9 months, back to 800,000 THB for 2 months before next extension. Never let it drop below 400k during the year.'
    },
    {
      step: 2,
      title: 'Arriving at Immigration',
      icon: Building2,
      tasks: [
        'Arrive EARLY (7:30 AM recommended) - queues start at 8 AM',
        'Look for "Extension" or "Visa" counter sign',
        'Take a queue number from machine',
        'Find waiting area with your number displayed on screen',
        'Keep ALL documents ready in folder'
      ],
      timeEstimate: '30 min - 1 hour wait',
      tips: 'Some offices run out of queue numbers by 10 AM on busy days. Arrive early or go mid-week. Mondays and Fridays are busiest.'
    },
    {
      step: 3,
      title: 'Document Check (First Counter)',
      icon: FileText,
      tasks: [
        'Hand over ALL documents when called',
        'Officer checks: passport, bank letter, bank book, TM.7, photo, TM.30',
        'Officer may ask: "Where do you live?", "How long in Thailand?"',
        'Brief interview about your retirement in Thailand',
        'If missing documents, they\'ll tell you what to get',
        'If approved, get new queue number for payment'
      ],
      timeEstimate: '5-10 minutes',
      tips: 'Common mistakes: Bank book not updated same day, wrong photo size, TM.30 missing, money not seasoned 2 months. Double-check before going.'
    },
    {
      step: 4,
      title: 'Payment',
      icon: Clock,
      tasks: [
        'Go to payment counter with new queue number',
        'Pay 1,900 THB CASH (no cards accepted)',
        'Get receipt (KEEP IT)',
        'Wait for final processing (may take 1-2 hours)',
        'Your passport will be kept during processing',
        'Some offices give "under consideration" stamp - return in 30 days'
      ],
      timeEstimate: '1-2 hours total wait',
      tips: 'Bring a book or phone charger. Some offices have cafes nearby where you can wait. They\'ll call your name when ready.'
    },
    {
      step: 5,
      title: 'Passport Collection',
      icon: CheckCircle2,
      tasks: [
        'Listen for your name or watch screen',
        'Collect passport with new extension stamp',
        'CHECK the dates immediately - mistakes happen',
        'If date is wrong, tell officer BEFORE leaving',
        'Extension is for 1 year from current stamp expiry',
        'Done! See you next year for renewal'
      ],
      timeEstimate: 'Ready to go home',
      tips: 'Always verify the "admitted until" date matches what you paid for. Mistakes are fixable on the spot but impossible later. Take photo of stamp for your records.'
    }
  ],

  'retirement-oa': [
    {
      step: 1,
      title: 'Prepare Documents in Home Country',
      icon: FileText,
      tasks: [
        'Bank statement showing 800,000 THB (or equivalent) for 3+ months',
        'OR pension statement showing 65,000 THB/month',
        'Police clearance certificate (from your country)',
        'Medical certificate (from licensed doctor)',
        'Health insurance certificate: 40,000 THB outpatient, 400,000 THB inpatient coverage',
        'Passport valid 18+ months',
        '2x recent passport photos',
        'Completed visa application form (from Thai embassy website)'
      ],
      timeEstimate: '2-4 weeks',
      tips: 'O-A MUST be applied from your home country - cannot apply inside Thailand. Health insurance is mandatory for O-A (not required for regular Non-O). Check your embassy\'s specific requirements as they vary.'
    },
    {
      step: 2,
      title: 'Thai Embassy Appointment',
      icon: Building2,
      tasks: [
        'Book appointment at Thai embassy/consulate',
        'Submit all documents',
        'Pay visa fee (varies by country, usually $200-250 USD)',
        'Interview if required',
        'Processing takes 3-5 business days (varies by embassy)'
      ],
      timeEstimate: '1 hour + 3-5 days processing',
      tips: 'Some embassies now use e-Visa system (online application). Check your local Thai embassy website. Los Angeles and New York consulates are known to be efficient.'
    },
    {
      step: 3,
      title: 'Enter Thailand',
      icon: CheckCircle2,
      tasks: [
        'Upon arrival, receive 1-year permission to stay',
        'Multiple entries allowed during validity',
        'Each entry can be up to 1 year at a time',
        'No 90-day reports required if you exit/re-enter regularly',
        'Health insurance must remain valid entire time'
      ],
      timeEstimate: 'Arrival day',
      tips: 'O-A is valid for 1 year from issue date, but each ENTRY gives you 1 year stay. So you can get almost 2 years from one visa if you time your entry right (enter just before visa expires).'
    }
  ],

  'retirement-ox': [
    {
      step: 1,
      title: 'Eligibility Check & Financial Prep',
      icon: FileText,
      tasks: [
        'Must be 50+ years old',
        'Must be citizen of eligible country (14 countries only: Australia, Canada, Denmark, Finland, France, Germany, Italy, Japan, Netherlands, Norway, Sweden, Switzerland, UK, USA)',
        'Financial requirement: 3 million THB in Thai bank OR 1.8M THB + $100k annual pension',
        'Health insurance with $100,000+ coverage',
        'Police clearance from home country',
        'No criminal record'
      ],
      timeEstimate: 'Verify eligibility',
      tips: 'O-X is a premium visa for wealthy retirees. It\'s NOT widely used because of high financial requirements and limited countries. Regular O-A or Elite visa may be easier.'
    },
    {
      step: 2,
      title: 'Apply at Thai Embassy Abroad',
      icon: Building2,
      tasks: [
        'Can ONLY apply from Thai embassy in your home country',
        'Submit: passport, financial proof, health insurance, police clearance, medical certificate',
        'Visa fee (varies by embassy)',
        'Processing time: 2-4 weeks',
        'Receive 5-year visa with 1-year entries'
      ],
      timeEstimate: '2-4 weeks',
      tips: 'O-X gives 5 years validity (renewable to 10 years). Each entry allows 1 year stay. Ideal for wealthy retirees who want hassle-free long-term stay without annual bank seasoning requirements.'
    },
    {
      step: 3,
      title: 'Annual Reporting in Thailand',
      icon: Clock,
      tasks: [
        'Must report to immigration annually',
        'Show continued financial qualification',
        'Health insurance must remain valid',
        'No 90-day reports if exiting/re-entering regularly',
        'Can renew for another 5 years after first 5 years expire'
      ],
      timeEstimate: 'Annual check-in',
      tips: 'Much less hassle than regular retirement visa - no 2-month money seasoning, no annual extensions. Just annual check-in. Perfect for wealthy retirees who qualify.'
    }
  ],

  'ltr-wealthy': [
    {
      step: 1,
      title: 'Online Application & Eligibility',
      icon: FileText,
      tasks: [
        'Age 50+ required',
        'Annual income $80,000+ (last 2 years)',
        'Assets $250,000+ (government bonds, property, investments)',
        'Health insurance $100,000+ coverage',
        'Apply online through Thailand BOI LTR portal',
        'Upload: passport, financial documents, health insurance, investment proof'
      ],
      timeEstimate: '2-3 weeks online process',
      tips: 'LTR Wealthy Pensioner is Thailand\'s new premium 10-year visa launched 2022. It\'s faster than Elite visa and includes tax benefits. Only $80k income (vs Elite\'s 900k-2M THB upfront payment).'
    },
    {
      step: 2,
      title: 'BOI Review & Approval',
      icon: Building2,
      tasks: [
        'Board of Investment reviews application',
        'Verification of income and assets',
        'Background check',
        'Processing: 30-60 days',
        'Approval email with visa approval letter'
      ],
      timeEstimate: '30-60 days',
      tips: 'BOI is quite strict on documentation. Make sure all financial documents are certified/notarized. Using an agent who specializes in LTR visas can help with complex cases.'
    },
    {
      step: 3,
      title: 'Visa Issuance & Immigration',
      icon: CheckCircle2,
      tasks: [
        'Present approval letter at Thai embassy or on arrival',
        'Pay 50,000 THB visa fee (one-time for 10 years)',
        'Receive 10-year visa validity',
        'Each entry allows up to 1 year stay',
        'No 90-day reports required',
        'Can work as freelancer/consultant without work permit',
        'Only need to report annually to BOI (not immigration)'
      ],
      timeEstimate: 'Issue same day',
      tips: 'LTR is the best long-term visa for wealthy retirees and remote workers. Major benefits: no 90-day reports, can work remotely, fast track at airport, 17% income tax cap (vs 35% for normal residents).'
    }
  ],

  // ============= WORK VISAS =============
  'business': [
    {
      step: 1,
      title: 'Employer Preparation',
      icon: Users,
      tasks: [
        'Company prepares WP3 application to Ministry of Labour',
        'Documents needed: company registration, financial statements, 4 Thai employees per foreigner',
        'Company shows 2M THB capital minimum',
        'Your diplomas/degrees translated and certified',
        'Processing: 1-2 weeks for WP3 approval'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'This is YOUR EMPLOYER\'S job, not yours. They handle all MOL paperwork. You just provide passport copies and your degree certificates.'
    },
    {
      step: 2,
      title: 'Convert Visa Inside Thailand (If Already Here)',
      icon: FileText,
      tasks: [
        'Must have 15+ days on current visa stamp',
        'Go to immigration with WP3 approval letter',
        'Fill TM.7 form, bring photo, passport copies',
        'Submit employer documents: company registration, WP3, tax papers',
        'Pay 2,000 THB for visa conversion',
        'Receive 90-day Non-B stamp',
        'Processing: same day OR 15 days (varies by office)'
      ],
      timeEstimate: '3-5 hours or 15 days',
      tips: 'Some offices (Bangkok Chaengwattana) give same-day Non-B conversion. Others make you wait 15 days. Check YOUR office policy before going.'
    },
    {
      step: 3,
      title: 'Medical Certificate',
      icon: FileText,
      tasks: [
        'Get medical exam at Thai clinic/hospital',
        'Basic checkup: blood pressure, simple tests',
        'Certificate usually ready same day',
        'Cost: 100-300 THB',
        'Valid for 3 months'
      ],
      timeEstimate: '1-2 hours',
      tips: 'Many clinics near immigration offices offer this service. Go early morning for fast service. Some clinics even offer "express" service for work permit medicals.'
    },
    {
      step: 4,
      title: 'Ministry of Labour Visit',
      icon: Building2,
      tasks: [
        'You + employer rep go together',
        'Bring: passport, photos, medical cert, WP3 approval, degrees',
        'Submit application at Work Permit section',
        'Interview: Simple questions about your job',
        'Fingerprints and photo taken',
        'Blue work permit book issued (usually same day)',
        'Work permit valid 1 year (matches your visa extension)'
      ],
      timeEstimate: '2-4 hours',
      tips: 'Dress professionally. Interview is simple: what you do, where you work, qualifications. Some MOL offices are very busy - arrive at 8:00 AM opening.'
    },
    {
      step: 5,
      title: 'Immigration for 1-Year Extension',
      icon: Building2,
      tasks: [
        'NOW you can extend visa (within 90-day stamp)',
        'Bring: work permit, employer letter, company docs, tax papers',
        'Employer documents must show company compliance',
        'Passport photos, TM.7 form, bank book/statement',
        'Pay 1,900 THB extension fee',
        'Get 1-year extension tied to work permit',
        'Some offices give "under consideration" stamp - return in 30 days'
      ],
      timeEstimate: '3-4 hours + possible return',
      tips: 'Work permit MUST be obtained before extending visa. No work permit = no visa extension. Your employer should help with this process.'
    },
    {
      step: 6,
      title: 'Annual Renewals',
      icon: Clock,
      tasks: [
        'Renew work permit annually at MOL (before expiry)',
        'Then renew visa extension at immigration (before expiry)',
        'Must renew BOTH every year',
        '90-day reports required (TM.47 form)',
        'Get re-entry permit before any international travel',
        'If you leave job, visa becomes invalid - must leave Thailand or change visa type within 7 days'
      ],
      timeEstimate: 'Annual process',
      tips: 'Coordinate work permit and visa renewals carefully. If work permit expires, visa becomes invalid immediately. Set reminders 1 month before expiry.'
    }
  ],

  'smart-visa': [
    {
      step: 1,
      title: 'Eligibility Check',
      icon: FileText,
      tasks: [
        'Must work in one of 13 S-Curve industries (automation, aviation, digital, etc.)',
        'Bachelor\'s degree + 5 years experience OR Master\'s + 2 years',
        'Employment contract showing 100,000+ THB/month salary',
        'Company must be registered in targeted industry with BOI or relevant ministry',
        'Get endorsement letter from sponsoring agency'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'SMART visa is for high-skilled tech workers, executives, investors, and startups. Categories: T (Talent), I (Investor), E (Executive), S (Startup). Check BOI website for full industry list.'
    },
    {
      step: 2,
      title: 'Online Application',
      icon: Building2,
      tasks: [
        'Apply through BOI Smart Visa online portal',
        'Upload: passport, degree certificates, employment contract, company docs',
        'Pay application fee (varies by category)',
        'BOI reviews application',
        'Processing: 30 days'
      ],
      timeEstimate: '30 days',
      tips: 'SMART visa includes digital work permit - no need for separate MOL application. This saves huge amount of time vs regular Non-B process.'
    },
    {
      step: 3,
      title: 'Approval & Visa Issuance',
      icon: CheckCircle2,
      tasks: [
        'Receive approval letter from BOI',
        'Present at Thai embassy or apply on arrival',
        'Receive 4-year visa validity',
        'Automatic work permit included',
        'No 90-day reports required',
        'Family members get automatic dependent visas',
        'Fast-track immigration lanes at airport'
      ],
      timeEstimate: 'Same day issuance',
      tips: 'SMART visa is Thailand\'s premium work visa with major benefits: no 90-day reports, automatic work permit, fast immigration, family visas included. Perfect for tech workers and executives.'
    }
  ],

  'ltr-professional': [
    {
      step: 1,
      title: 'Eligibility & Application',
      icon: FileText,
      tasks: [
        'Annual income $80,000+ USD',
        'Current employment from employer abroad (remote work)',
        'Can be employee or freelancer/consultant',
        'Health insurance $50,000+ coverage',
        'Apply online through BOI LTR portal',
        'Upload employment contract or client contracts (for freelancers)'
      ],
      timeEstimate: '2-3 weeks',
      tips: 'LTR Work-From-Thailand Professional is for remote workers earning $80k+. It\'s like a super-charged DTV visa with 10 years validity and work authorization included.'
    },
    {
      step: 2,
      title: 'BOI Review Process',
      icon: Building2,
      tasks: [
        'BOI verifies income and employment',
        'Background check',
        'Review employment documentation',
        'Processing: 30-60 days',
        'Approval email with LTR certificate'
      ],
      timeEstimate: '30-60 days',
      tips: 'BOI is flexible with income proof - can include salary, freelance income, investment income, etc. Total must be $80k+ annually.'
    },
    {
      step: 3,
      title: 'Visa Benefits & Usage',
      icon: CheckCircle2,
      tasks: [
        'Pay 50,000 THB one-time fee (valid 10 years)',
        '10-year visa validity',
        'Up to 1 year per entry',
        'No 90-day reports',
        'Can work remotely legally',
        'Digital work permit included',
        '17% income tax cap (major tax benefit)',
        'Fast track at airports',
        'Annual report to BOI only (not immigration)'
      ],
      timeEstimate: '10 years',
      tips: 'This is the absolute BEST visa for digital nomads and remote workers earning $80k+. Combines benefits of DTV, work authorization, and tax advantages. Worth the $80k income requirement.'
    }
  ],

  // ============= DTV =============
  'dtv': [
    {
      step: 1,
      title: 'Document Preparation',
      icon: FileText,
      tasks: [
        'Bank statements showing 500,000 THB for last 6 months',
        'Remote work contract OR freelance client contracts',
        'Portfolio of work or employment letter',
        'Passport copy (valid 6+ months)',
        'Recent passport photo (digital)',
        'Hotel booking or accommodation proof for first few days',
        'Health insurance certificate (optional but recommended)'
      ],
      timeEstimate: '1 week',
      tips: 'DTV requires 500k THB maintained for 6 months - not just balance at time of application. Bank will need to provide statement showing transaction history. Some embassies are strict about this.'
    },
    {
      step: 2,
      title: 'Online e-Visa Application',
      icon: Building2,
      tasks: [
        'MUST apply from OUTSIDE Thailand (cannot apply inside)',
        'Go to Thai e-Visa website for your country',
        'Fill online application form',
        'Upload all documents as PDFs/images',
        'Pay 10,000 THB application fee online (non-refundable)',
        'Submit application',
        'Processing: 5-15 business days'
      ],
      timeEstimate: '5-15 days',
      tips: 'Application MUST be made from outside Thailand. Popular locations: Penang (Malaysia), Vientiane (Laos), Taipei (Taiwan). Each embassy has slightly different requirements - check specific embassy website.'
    },
    {
      step: 3,
      title: 'Visa Approval & Entry',
      icon: CheckCircle2,
      tasks: [
        'Receive approval email with e-Visa PDF',
        'Print e-Visa for immigration',
        'Enter Thailand - receive 180-day stamp',
        'Can extend each 180 days once for another 180 days (1,900 THB)',
        'Total possible stay: 360 days continuous',
        'Then must exit and re-enter',
        'Valid 5 years - can use multiple times',
        'No 90-day reports required'
      ],
      timeEstimate: '5 years validity',
      tips: 'DTV is amazing for digital nomads: 5 years validity, 180 days per entry (extendable to 360), no 90-day reports. Much better than tourist visa for long-term nomads. Can\'t officially work for Thai companies though.'
    }
  ],

  // ============= EDUCATION =============
  'education': [
    {
      step: 1,
      title: 'School Enrollment',
      icon: FileText,
      tasks: [
        'Enroll in Thai university, language school, or training program',
        'School MUST have Ministry of Education license',
        'Pay tuition fees (get receipt)',
        'Obtain enrollment confirmation letter from school',
        'Get course registration documents',
        'School provides ED visa document package'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'Not all schools can sponsor ED visas - must be MOE-licensed. Language schools are easiest. University degrees require high school transcripts. Some "visa mills" exist - immigration is cracking down on fake ED visas.'
    },
    {
      step: 2,
      title: 'Apply for Non-ED (Inside or Outside Thailand)',
      icon: Building2,
      tasks: [
        'Outside Thailand: Apply at Thai embassy with school documents',
        'Inside Thailand: Convert tourist visa at immigration',
        'Submit: school letter, enrollment cert, payment receipt, school license copy',
        'Fill TM.7 form, passport photos, passport copies',
        'Pay 2,000 THB (inside Thailand conversion)',
        'Receive 90-day Non-ED stamp initially'
      ],
      timeEstimate: '1 day or 15 days (varies by office)',
      tips: 'Bangkok immigration allows same-day conversion. Other offices require 15 days processing. Must have 15+ days remaining on current stamp to convert inside Thailand.'
    },
    {
      step: 3,
      title: 'Extension for Course Duration',
      icon: Clock,
      tasks: [
        'Before 90 days expire, apply for extension at immigration',
        'Bring: school letter, attendance records showing 80%+ attendance, updated enrollment docs',
        'School representative may need to accompany you',
        'Pay 1,900 THB extension fee',
        'Extensions usually granted 3-12 months at a time',
        'Total ED visa possible: duration of course (commonly 1-2 years for language schools, 4+ years for degrees)'
      ],
      timeEstimate: '3-4 hours',
      tips: 'MUST maintain 80%+ attendance or immigration will reject extension. No work allowed on ED visa (officially - enforcement varies). Language school ED visas are being scrutinized more - immigration is cracking down on fake students.'
    },
    {
      step: 4,
      title: 'Ongoing Compliance',
      icon: CheckCircle2,
      tasks: [
        '90-day reports required (every 90 days)',
        'Annual extensions (or per semester for universities)',
        'School must provide updated documents for each extension',
        'If you stop attending, visa becomes invalid immediately',
        'Cannot work or volunteer on ED visa',
        'Must leave Thailand when course ends or change to different visa type'
      ],
      timeEstimate: 'Duration of studies',
      tips: 'ED visa is NOT a path to permanent stay. After course ends, must leave or change visa type. Some people abuse ED visas to stay long-term without actually studying - immigration is aware and cracking down.'
    }
  ],

  // ============= FAMILY VISAS =============
  'marriage': [
    {
      step: 1,
      title: 'Legal Marriage & Documents',
      icon: FileText,
      tasks: [
        'Marriage registered at Thai Amphur (district office)',
        'Get Thai marriage certificate (original + copies)',
        'Translate certificate to Thai (if not already)',
        'Legalize at your embassy in Thailand',
        'Legalize at Thai Ministry of Foreign Affairs',
        'Spouse provides: Thai ID card copies, house registration (tabien baan)',
        'Photos of you both together (home, landmarks, family events)'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'Marriage certificate legalization is crucial - must be done at BOTH your embassy and Thai MFA. Process takes 1-2 weeks. Keep multiple certified copies.'
    },
    {
      step: 2,
      title: 'Financial Preparation',
      icon: FileText,
      tasks: [
        'Option 1: 400,000 THB in Thai bank account (must season 2 months before extension)',
        'Option 2: 40,000 THB/month income from abroad (pension, salary, etc.)',
        'Open Thai joint account with spouse (recommended)',
        'Get bank letter dated within 7 days of application',
        'Update bank book same day as immigration visit'
      ],
      timeEstimate: '2 months seasoning',
      tips: 'Money seasoning for marriage visa: 400k THB for 2 months BEFORE extension. For initial 90-day Non-O, some offices don\'t require seasoning. Check YOUR office policy.'
    },
    {
      step: 3,
      title: 'Immigration Visit (Both Spouses)',
      icon: Building2,
      tasks: [
        'BOTH spouses must attend together',
        'Submit all documents at marriage visa counter',
        'Fill TM.7 form, provide photos, passport copies',
        'Officer interviews you separately and together:',
        '- How did you meet?',
        '- Where do you live together?',
        '- Daily routine questions',
        '- Family questions',
        'Pay 2,000 THB for 90-day Non-O (first time)',
        'OR 1,900 THB for 1-year extension (if you have 90-day stamp already)'
      ],
      timeEstimate: '3-5 hours',
      tips: 'Interview is to verify genuine marriage - not interrogation. Answer honestly and consistently with your spouse. Some offices schedule home visit after application (not all).'
    },
    {
      step: 4,
      title: 'Home Visit (Maybe)',
      icon: Users,
      tasks: [
        'Some immigration offices schedule home visit (not all offices do this)',
        'Immigration officer visits your registered address',
        'Checks you live together: shared belongings, photos on walls, both names on mailbox',
        'Takes photos of you both at home',
        'Simple questions about daily life',
        'Usually announced 1-2 days in advance (sometimes unannounced)'
      ],
      timeEstimate: '15-20 minutes',
      tips: 'Make sure home looks lived-in by both: photos together on walls, both names on door/mailbox, shared bathroom items, etc. Officer is checking you genuinely live together.'
    },
    {
      step: 5,
      title: 'Approval & Annual Renewals',
      icon: CheckCircle2,
      tasks: [
        'If approved: receive 1-year extension stamp',
        'Money must stay in account: 400k for 2 months before/after extension',
        'Can drop to 0 THB during remaining 8 months (though keeping balance recommended)',
        '90-day reports required (every 90 days)',
        'Annual renewal: same process, updated documents',
        'Fresh photos of couple together each year',
        'Re-entry permit required if traveling abroad'
      ],
      timeEstimate: 'Annual',
      tips: 'Marriage visa is stable long-term option. After 3+ years of consecutive extensions, you become eligible for permanent residence application. Keep marriage strong - divorce invalidates visa immediately.'
    }
  ],

  'dependent': [
    {
      step: 1,
      title: 'Sponsor Preparation',
      icon: FileText,
      tasks: [
        'Sponsor must have valid Non-B visa + work permit',
        'Sponsor salary must be 40,000+ THB/month (50k for spouse + each child)',
        'Employer provides letter confirming employment and salary',
        'Gather sponsor\'s documents: work permit copies, company registration, tax filings',
        'Marriage certificate (for spouse) or birth certificate (for children under 20)',
        'Certificates must be legalized by embassy + Thai MFA'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'Dependent visa is synchronized with sponsor\'s visa - if sponsor leaves job or visa expires, dependent visa becomes invalid too. Plan accordingly.'
    },
    {
      step: 2,
      title: 'Apply Inside Thailand or at Embassy',
      icon: Building2,
      tasks: [
        'Inside Thailand: Convert current visa at immigration (2,000 THB, 15 days processing)',
        'At Embassy: Apply with all documents at Thai embassy abroad',
        'Submit: relationship docs, sponsor\'s work documents, company papers',
        'Fill TM.7 form, photos, passport copies, TM.30',
        'Receive 90-day Non-O dependent stamp initially',
        'Sponsor may need to attend with you'
      ],
      timeEstimate: '3-5 hours or 15 days',
      tips: 'Some offices (Bangkok) allow same-day conversion. Others require 15-day processing. Must have 15+ days remaining on current stamp for in-country conversion.'
    },
    {
      step: 3,
      title: 'Extension to 1 Year',
      icon: Clock,
      tasks: [
        'Before 90 days expire, apply for 1-year extension',
        'Bring updated sponsor documents: work permit, employer letter, company docs',
        'Prove sponsor still employed with sufficient salary',
        'Pay 1,900 THB extension fee',
        'Extension synchronized with sponsor\'s visa expiry',
        'Receive 1-year extension stamp'
      ],
      timeEstimate: '3-4 hours',
      tips: 'Your extension cannot exceed sponsor\'s visa expiry date. If sponsor has 6 months left, you get 6 months. Coordinate renewals with sponsor.'
    },
    {
      step: 4,
      title: 'Ongoing Requirements',
      icon: CheckCircle2,
      tasks: [
        '90-day reports required',
        'Annual renewal tied to sponsor\'s visa',
        'Cannot work on dependent visa (officially)',
        'If sponsor loses job/visa, you must leave or change visa type within 7 days',
        'Re-entry permits needed before traveling abroad',
        'Kids can attend international schools on dependent visa'
      ],
      timeEstimate: 'Annual',
      tips: 'Dependent visa is convenient for families but risky - tied to sponsor\'s employment. If sponsor loses job, whole family must leave quickly. Consider backup plans.'
    }
  ],

  'thai-child': [
    {
      step: 1,
      title: 'Child Documentation',
      icon: FileText,
      tasks: [
        'Thai birth certificate showing your name as parent',
        'Child must be under 20 years old',
        'Child\'s Thai ID card + house registration',
        'Birth certificate translation (if not Thai)',
        'Custody documents if applicable',
        'Child\'s school enrollment (if school-age)'
      ],
      timeEstimate: '1 week',
      tips: 'This visa is for parents supporting Thai children. If child turns 20 during your visa period, you must change to different visa type. Plan ahead.'
    },
    {
      step: 2,
      title: 'Immigration Application',
      icon: Building2,
      tasks: [
        'Both parent and child should attend immigration',
        'Submit all documents + TM.7 form',
        'Photos, passport copies, TM.30',
        'Officer may interview child (if old enough)',
        'Financial proof may be required (varies by office)',
        'Pay 2,000 THB for initial 90-day Non-O',
        'Extend to 1 year after 90 days (1,900 THB)'
      ],
      timeEstimate: '3-5 hours',
      tips: 'This visa category is less common and requirements vary significantly by immigration office. Call ahead to ask specific requirements for YOUR office.'
    },
    {
      step: 3,
      title: 'Extensions & Compliance',
      icon: CheckCircle2,
      tasks: [
        'Annual extensions with updated child documents',
        'Child must remain in Thailand primarily',
        '90-day reports required',
        'If child leaves Thailand long-term, visa may be questioned',
        'Regular home visits possible by immigration',
        'Valid until child turns 20 years old'
      ],
      timeEstimate: 'Annual',
      tips: 'Immigration wants to see you actively supporting the child. Having child live elsewhere while you\'re in Thailand on this visa is not allowed. Keep receipts of child expenses.'
    }
  ],

  // ============= TOURIST =============
  'tourist': [
    {
      step: 1,
      title: 'Apply at Thai Embassy',
      icon: FileText,
      tasks: [
        'Cannot apply inside Thailand - must apply from abroad',
        'Book appointment at Thai embassy/consulate',
        'Required documents:',
        '- Valid passport (6+ months)',
        '- Recent passport photo',
        '- Flight booking (doesn\'t have to be paid)',
        '- Hotel booking for first few days',
        '- Bank statement showing 20,000 THB+ (or equivalent)',
        '- Visa application form (from embassy website)',
        'Single-entry or multiple-entry options available'
      ],
      timeEstimate: '3-5 business days',
      tips: 'Tourist visa gives 60 days on arrival (vs 30-60 days visa exempt). Worth getting if you want flexibility. Multiple-entry tourist visa is good for 6 months with 60 days per entry.'
    },
    {
      step: 2,
      title: 'Pay Fee & Collect Visa',
      icon: Building2,
      tasks: [
        'Visa fee varies by country (usually $30-40 USD single entry, $150-200 multiple)',
        'Processing time: 3-5 business days (some embassies same day)',
        'Collect passport with visa sticker',
        'Check visa validity dates and entry type',
        'Must use visa before expiry date printed on sticker'
      ],
      timeEstimate: '3-5 days',
      tips: 'Some embassies now use e-Visa system (online application). Check your local embassy. Popular locations for tourist visa runs: Penang, Vientiane, Hanoi, Phnom Penh.'
    },
    {
      step: 3,
      title: 'Entry & Extension',
      icon: CheckCircle2,
      tasks: [
        'Enter Thailand - receive 60-day stamp',
        'Can extend once for 30 more days at immigration (1,900 THB)',
        'Total possible stay: 90 days',
        'Multiple-entry: can exit and re-enter multiple times within 6 months',
        'Each entry gives new 60 days',
        'No 90-day reports required for tourist visa'
      ],
      timeEstimate: '60-90 days',
      tips: 'Tourist visa is NOT for long-term stay. Immigration may question you if you have many consecutive tourist visas ("visa running"). After 2-3 tourist visas, consider proper long-term visa.'
    }
  ],

  'medical': [
    {
      step: 1,
      title: 'Hospital Documentation',
      icon: FileText,
      tasks: [
        'Book appointment at Thai hospital',
        'Get letter from hospital confirming:',
        '- Treatment plan and dates',
        '- Medical condition (brief description)',
        '- Estimated cost',
        'Include medical records from home country',
        'Doctor\'s letter explaining need for treatment in Thailand'
      ],
      timeEstimate: '1 week',
      tips: 'Thailand is major medical tourism destination. Many hospitals have international patient departments that help with visa documentation. Bangkok, Phuket, and Chiang Mai have excellent medical facilities.'
    },
    {
      step: 2,
      title: 'Visa Application',
      icon: Building2,
      tasks: [
        'Apply at Thai embassy (if abroad) OR immigration (if inside Thailand)',
        'Submit: hospital letter, medical records, financial proof for treatment',
        'Fill visa application / TM.7 form',
        'Passport photos, copies',
        'Visa fee (varies)',
        'Usually granted 60-90 days initially'
      ],
      timeEstimate: '3-5 days',
      tips: 'Medical visa is relatively easy to get with proper hospital documentation. Immigration is sympathetic to genuine medical needs.'
    },
    {
      step: 3,
      title: 'Extensions for Continued Treatment',
      icon: CheckCircle2,
      tasks: [
        'Can extend inside Thailand with continued medical proof',
        'Hospital provides updated treatment letters',
        'Extensions granted based on medical necessity',
        'Usually 30-90 days per extension',
        'Total duration: as long as treatment requires',
        'Caretaker/family member can get MT visa too'
      ],
      timeEstimate: 'As needed',
      tips: 'Keep all medical receipts and hospital documentation. Immigration may verify with hospital. Genuine medical cases get sympathetic treatment from immigration officers.'
    }
  ],

  // ============= INVESTMENT & PREMIUM =============
  'investment': [
    {
      step: 1,
      title: 'BOI Approval & Business Registration',
      icon: FileText,
      tasks: [
        'Register business with Thai BOI (Board of Investment)',
        'Minimum investment varies by sector: 3M-10M+ THB',
        'Prepare business plan showing job creation and economic benefit',
        'Company registration documents',
        'Proof of investment funds transferred to Thailand',
        'BOI issues promotion certificate if approved'
      ],
      timeEstimate: '2-3 months',
      tips: 'Investment visa is complex and requires genuine business operations. Not a "buy your way in" visa - must show real economic benefit to Thailand. Using a BOI specialist lawyer is highly recommended.'
    },
    {
      step: 2,
      title: 'Apply for Investment Visa',
      icon: Building2,
      tasks: [
        'With BOI certificate, apply at immigration or Thai embassy',
        'Submit: BOI certificate, business registration, investment proof, business plan',
        'Fill application forms, photos, passport copies',
        'Initial visa usually 90 days',
        'Extend annually based on continued business operation',
        'Pay visa fees'
      ],
      timeEstimate: '1-2 weeks',
      tips: 'Investment visa is tied to business operations. If business closes or fails, visa becomes invalid. Must maintain minimum capital and employee requirements throughout.'
    },
    {
      step: 3,
      title: 'Ongoing Compliance',
      icon: CheckCircle2,
      tasks: [
        'Annual extensions require:',
        '- Updated BOI reporting',
        '- Company financial statements',
        '- Proof of continued operations',
        '- Tax filings',
        '- Employee documentation',
        '90-day reports required',
        'Must maintain investment levels',
        'Annual BOI compliance check'
      ],
      timeEstimate: 'Annual',
      tips: 'Investment visa is suitable for genuine business owners/investors, not tourists wanting long stay. Consider LTR visa instead if you\'re passive investor.'
    }
  ],

  'elite': [
    {
      step: 1,
      title: 'Choose Package & Apply',
      icon: FileText,
      tasks: [
        'Select Thailand Elite package:',
        '- 5 years: 900,000 THB',
        '- 10 years: 1,000,000 THB',
        '- 20 years: 2,000,000 THB',
        '- Family packages available',
        'Apply online through Thailand Privilege Card website',
        'Submit: passport copy, photo, address proof',
        'Pay membership fee (bank transfer or credit card)',
        'Background check conducted'
      ],
      timeEstimate: '2-4 weeks',
      tips: 'Elite visa is "pay-to-stay" with no other requirements. No financial proof, no work permit, no business needed. Pure tourism/residence visa. Includes VIP airport services, golf, spa.'
    },
    {
      step: 2,
      title: 'Approval & Card Issuance',
      icon: Building2,
      tasks: [
        'Background check (1-2 weeks)',
        'Approval notification',
        'Thailand Privilege Card issued',
        'VIP airport meet-and-greet arranged',
        'Card includes benefits: airport lounge, fast-track immigration, concierge, etc.',
        'Receive visa approval letter'
      ],
      timeEstimate: '2-4 weeks',
      tips: 'Elite visa rarely denies applicants unless serious criminal background. It\'s revenue program for Thailand - they want your money. Very smooth process compared to other visas.'
    },
    {
      step: 3,
      title: 'Enter Thailand & Stamp',
      icon: CheckCircle2,
      tasks: [
        'Present Elite card at immigration on arrival',
        'Receive 1-year stamp (for 5-10 year packages) or longer (20-year)',
        'No 90-day reports required',
        'Simply exit and re-enter for new 1-year stamp',
        'Or apply for extension at immigration (free)',
        'Card includes concierge services for appointments',
        'Can travel in/out unlimited times'
      ],
      timeEstimate: '5-20 years',
      tips: 'Elite visa is hassle-free but expensive. Best for wealthy retirees/digital nomads who value convenience over cost. No work allowed, but perfect for living in Thailand stress-free.'
    }
  ],

  // ============= OTHER =============
  'volunteer': [
    {
      step: 1,
      title: 'Find Registered NGO',
      icon: FileText,
      tasks: [
        'Partner with Thai government-registered NGO/charity',
        'NGO must have proper registration with Ministry of Interior',
        'Agree on volunteer work plan and duration',
        'NGO prepares documentation package:',
        '- Foundation/NGO registration certificate',
        '- Letter of acceptance',
        '- Volunteer work plan',
        '- Project description'
      ],
      timeEstimate: '2-4 weeks',
      tips: 'Only registered NGOs can sponsor volunteer visas. Make sure organization is properly registered. Immigration is cracking down on fake volunteer visas used for long-stay.'
    },
    {
      step: 2,
      title: 'Apply at Immigration',
      icon: Building2,
      tasks: [
        'Submit NGO documents + personal documents',
        'Fill TM.7 form, photos, passport copies',
        'NGO representative may need to attend',
        'Pay 2,000 THB for 90-day Non-O',
        'Officer reviews volunteer work plan',
        'Questions about volunteer activities'
      ],
      timeEstimate: '3-5 hours',
      tips: 'Immigration may verify with NGO. Make sure your volunteer role is genuine. Teaching English at temples is common volunteer visa route.'
    },
    {
      step: 3,
      title: 'Extensions & Work',
      icon: CheckCircle2,
      tasks: [
        'Extend for 1 year with continued NGO support',
        'Annual extensions require updated NGO letters',
        'Must actually volunteer (immigration may check)',
        '90-day reports required',
        'Cannot receive salary (small stipend sometimes ok)',
        'NGO must continue supporting your visa'
      ],
      timeEstimate: 'Annual',
      tips: 'Volunteer visa is for genuine charitable work, not a way to stay long-term doing nothing. If NGO stops sponsoring you, visa becomes invalid.'
    }
  ],

  'transit': [
    {
      step: 1,
      title: 'Transit Visa Application',
      icon: FileText,
      tasks: [
        'Needed only if you have NO visa exempt agreement with Thailand',
        'Most nationalities don\'t need transit visa',
        'Apply at Thai embassy if required',
        'Show onward flight ticket within 12-24 hours',
        'Visa for destination country (if required)',
        'Transit visa valid 30 days usually'
      ],
      timeEstimate: '2-3 days',
      tips: 'Most travelers don\'t need transit visa. Thailand allows transit without visa for most nationalities if you have onward flight same/next day. Check your specific nationality requirements.'
    }
  ],

  // ============= PERMITS & REPORTS =============
  're-entry': [
    {
      step: 1,
      title: 'At Immigration Office or Airport',
      icon: Building2,
      tasks: [
        'CRITICAL: Get re-entry permit BEFORE leaving Thailand',
        'If you leave without it, your visa extension is CANCELLED',
        'Apply at immigration office OR airport before departure',
        'Fill TM.8 form',
        'Provide: passport, 4x6cm photo, photocopy of passport',
        'Choose: Single re-entry (1,000 THB) or Multiple (3,800 THB)',
        'Pay fee, receive re-entry permit stamp/paper',
        'Processing: 15-30 minutes'
      ],
      timeEstimate: '15-30 minutes',
      tips: 'Get MULTIPLE re-entry if you travel often (valid until your visa extension expires). At airport, go to immigration office on 2nd floor BEFORE checking in for flight. Some airports have re-entry desk at departure gates too.'
    },
    {
      step: 2,
      title: 'When Leaving Thailand',
      icon: CheckCircle2,
      tasks: [
        'Show re-entry permit at departure immigration',
        'Officer stamps re-entry permission',
        'Your visa extension remains valid',
        'TM.6 departure card will be stamped and kept'
      ],
      timeEstimate: '2 minutes',
      tips: 'Without re-entry permit, your visa is cancelled when you leave. You\'d have to start visa process from scratch when returning. Don\'t forget it!'
    },
    {
      step: 3,
      title: 'When Returning to Thailand',
      icon: CheckCircle2,
      tasks: [
        'Show re-entry permit at arrival immigration',
        'Officer re-stamps you in with same extension expiry date',
        'You\'re back on same visa status',
        'Single re-entry permit is now used (get new one for next trip)',
        'Multiple re-entry remains valid until visa expires'
      ],
      timeEstimate: '5 minutes',
      tips: 'Each re-entry resets your 90-day report counter. After returning, next 90-day report is due 90 days from re-entry date.'
    }
  ],

  '90-day-report': [
    {
      step: 1,
      title: 'Prepare Documents',
      icon: FileText,
      tasks: [
        'Fill TM.47 form (download from immigration website)',
        'Passport copies: photo page, current visa, latest entry stamp',
        'Previous 90-day report receipt (if not first time)',
        'TM.30 receipt copy',
        'Note your current address',
        'Due date: 90 days from last entry OR last 90-day report',
        'Can report 15 days before to 7 days after due date (23-day window)'
      ],
      timeEstimate: '15 minutes prep',
      tips: 'Set phone reminder 85 days from entry date. If you travel abroad, 90-day counter resets on re-entry. Online reporting available but only if you\'ve reported in-person at least once at that office.'
    },
    {
      step: 2,
      title: 'Report (3 Options)',
      icon: Building2,
      tasks: [
        'Option 1: In person at immigration (2-3 hours, but guaranteed)',
        'Option 2: Online at https://extranet.immigration.go.th (15 minutes, but often system errors)',
        'Option 3: By mail with self-addressed stamped envelope (2 weeks)',
        'Most people do in-person first time, then online for renewals',
        'Online requires: passport number, visa number, TM.6 number',
        'In-person: submit TM.47 + copies, get receipt (FREE - no fee)'
      ],
      timeEstimate: 'Varies by method',
      tips: 'Online system works 50% of the time. If it fails, do in-person. Set reminder 85 days after entry so you have 5-day buffer if online fails. Overstaying 90-day report = 2,000 THB fine.'
    },
    {
      step: 3,
      title: 'Keep Receipt',
      icon: CheckCircle2,
      tasks: [
        'In-person: receive paper receipt (keep it!)',
        'Online: print confirmation page',
        'By mail: they mail receipt back',
        'Next 90-day report is due 90 days from THIS report date',
        'If you travel abroad, counter resets - start from re-entry date',
        'Receipt needed for next visa extension/90-day report'
      ],
      timeEstimate: 'Done!',
      tips: 'Take photo of 90-day receipt and email it to yourself. People lose them all the time. If you lose it, immigration can look it up (sometimes with difficulty). Keep all receipts in passport.'
    }
  ]
};
export default function ImmigrationSimulator() {
  const [selectedVisa, setSelectedVisa] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const simulation = selectedVisa ? simulationSteps[selectedVisa] : null;
  const totalSteps = simulation?.length || 0;

  return (
    <>
      <SEOHead page="ImmigrationSimulator" />
      <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#272262]/5 border border-[#272262]/20 mb-4">
          <Building2 className="w-4 h-4 text-[#272262]" />
          <span className="text-[#272262] text-sm font-medium">Interactive Walkthrough</span>
        </div>
        <h1 className="text-4xl font-bold text-[#272262] mb-3">Immigration Office Simulator</h1>
        <p className="text-[#454545] text-lg">Practice your visit before you go - know exactly what to expect and what to bring</p>
      </GlassCard>

      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-[#272262] mb-6 placeholder:text-gray-400">Choose Your Visa Type</h2>
        <VisaTypeSelect
          value={selectedVisa}
          onValueChange={(val) => { setSelectedVisa(val); setCurrentStep(0); }}
          placeholder="Select visa type to simulate"
          className="h-12 text-lg"
        />
      </GlassCard>

      {simulation && (
        <>
          {/* Progress Bar */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Step {currentStep + 1} of {totalSteps}</span>
              <span className="text-sm font-medium text-[#272262]">{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#272262] to-[#BF1E2E] transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </GlassCard>

          {/* Current Step */}
          <GlassCard className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0 shadow-lg">
                {React.createElement(simulation[currentStep].icon, { className: "w-8 h-8 text-white" })}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Step {simulation[currentStep].step}</div>
                <h2 className="text-3xl font-bold text-[#272262] mb-2">{simulation[currentStep].title}</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-[#BF1E2E] font-medium">
                    <Clock className="w-4 h-4" />
                    {simulation[currentStep].timeEstimate}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {simulation[currentStep].tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[#E7E7E7]">
                  <CheckCircle2 className="w-5 h-5 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 flex-1">{task}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Pro Tip</h3>
                  <p className="text-gray-700 text-sm">{simulation[currentStep].tips}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                variant="outline"
                className="border-[#272262] text-[#272262]"
              >
                Previous Step
              </Button>
              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white"
                >
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => { setCurrentStep(0); setSelectedVisa(''); }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Simulation Complete
                </Button>
              )}
            </div>
          </GlassCard>

          {/* All Steps Overview */}
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-[#272262] mb-6">Complete Process Overview</h3>
            <div className="space-y-4">
              {simulation.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    currentStep === i
                      ? 'border-[#BF1E2E] bg-red-50'
                      : 'border-[#E7E7E7] hover:border-[#272262] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      currentStep === i ? 'bg-[#BF1E2E] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.timeEstimate}</p>
                    </div>
                    {currentStep === i && <ArrowRight className="w-5 h-5 text-[#BF1E2E]" />}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        </>
      )}

      <ContactCTA message="Still nervous about your immigration visit?" />
      </div>
    </>
  );
}