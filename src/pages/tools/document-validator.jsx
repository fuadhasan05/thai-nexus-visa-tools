
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileCheck, CheckCircle2, AlertCircle, ImageIcon, Shield } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import VisaTypeSelect from '../../components/VisaTypeSelect';
import { useError } from '../../components/ErrorNotification';
import SEOHead from '../../components/SEOHead';

export default function DocumentValidator() {
  const [selectedVisa, setSelectedVisa] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoValidation, setPhotoValidation] = useState(null);
  const [aiValidating, setAiValidating] = useState(false);
  const { addError, addSuccess } = useError();

  const visaChecklists = {
    // Visa Exemption & Extensions
    'visa-exemption': {
      name: 'Visa Exemption (30/45/60/90 days on arrival)',
      items: [
        { id: 1, item: 'Passport (valid 6+ months)', checked: false },
        { id: 2, item: 'Proof of onward travel within exemption period', checked: false },
        { id: 3, item: 'Proof of accommodation (hotel booking or invitation)', checked: false },
        { id: 4, item: 'Proof of 20,000 THB funds (cash, bank statement, or card)', checked: false },
        { id: 5, item: 'No visa required - free on arrival at airport/border', checked: false }
      ]
    },
    '30-day-extension': {
      name: '30-Day Extension of Visa Exemption',
      items: [
        { id: 1, item: 'Passport (original + copies of photo page, visa exempt stamp)', checked: false },
        { id: 2, item: 'TM.7 Extension Form (filled out)', checked: false },
        { id: 3, item: '4x6cm Photo (white background)', checked: false },
        { id: 4, item: 'TM.30 Receipt (from hotel/landlord)', checked: false },
        { id: 5, item: 'Copy of TM.6 Departure Card', checked: false },
        { id: 6, item: '1,900 THB Extension Fee (CASH ONLY)', checked: false },
        { id: 7, item: 'Apply before current stamp expires', checked: false }
      ]
    },
    // Retirement Visas
    'retirement-o-first-time': {
      name: 'Non-O Retirement (First Time - 90 Days Inside Thailand)',
      items: [
        { id: 1, item: 'Passport (original + copies of photo page, visa stamps)', checked: false },
        { id: 2, item: 'TM.7 Application Form (filled out)', checked: false },
        { id: 3, item: '4x6cm Photo (NOT passport size, white background)', checked: false },
        { id: 4, item: 'Current visa with minimum 15 days remaining', checked: false },
        { id: 5, item: 'Bank Letter (dated within 7 days showing 800,000 THB)', checked: false },
        { id: 6, item: 'Updated Bank Book (stamped SAME DAY as application)', checked: false },
        { id: 7, item: 'Copy of Bank Book (all pages, signed)', checked: false },
        { id: 8, item: 'Proof of 800,000 THB OR 65,000 THB/month income', checked: false },
        { id: 9, item: 'TM.30 Receipt (from landlord)', checked: false },
        { id: 10, item: 'House Registration Copy (tabien baan)', checked: false },
        { id: 11, item: '2,000 THB Application Fee (CASH ONLY)', checked: false },
        { id: 12, item: 'Proof of Thai address (rental contract or letter)', checked: false }
      ]
    },
    'retirement-extension': {
      name: 'Retirement Extension (1-Year Annual Extension)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo (NOT passport size)', checked: false },
        { id: 4, item: 'Current Non-O Retirement Visa', checked: false },
        { id: 5, item: 'Bank Letter (dated within 7 days)', checked: false },
        { id: 6, item: 'Updated Bank Book (stamped SAME DAY)', checked: false },
        { id: 7, item: 'Copy of Bank Book (all pages, signed)', checked: false },
        { id: 8, item: '800,000 THB seasoned 2 months (or 65k/month pension)', checked: false },
        { id: 9, item: 'TM.30 Receipt', checked: false },
        { id: 10, item: 'House Registration Copy (tabien baan)', checked: false },
        { id: 11, item: '1,900 THB Extension Fee (CASH ONLY)', checked: false },
        { id: 12, item: 'Bank statement showing funds maintained 3 months after', checked: false }
      ]
    },
    'retirement-oa': {
      name: 'Retirement Visa (Non-O-A) - Apply Abroad',
      items: [
        { id: 1, item: 'Passport (valid 18+ months)', checked: false },
        { id: 2, item: 'Visa application form (embassy specific)', checked: false },
        { id: 3, item: '4x6cm Photo (white background, recent)', checked: false },
        { id: 4, item: 'Bank Statement showing 800,000 THB or 65,000 THB/month pension', checked: false },
        { id: 5, item: 'Health Insurance Certificate (40k outpatient, 400k inpatient)', checked: false },
        { id: 6, item: 'Police Clearance Certificate', checked: false },
        { id: 7, item: 'Medical Certificate', checked: false },
        { id: 8, item: 'Visa fee (varies by embassy)', checked: false }
      ]
    },
    'retirement-ox': {
      name: 'Non-O-X (Long-Stay 5-10 Year)',
      items: [
        { id: 1, item: 'Passport (valid 18+ months)', checked: false },
        { id: 2, item: 'Application form', checked: false },
        { id: 3, item: 'Passport photos (4x6cm)', checked: false },
        { id: 4, item: 'Bank statement (3M THB or proof of $100k annual income)', checked: false },
        { id: 5, item: 'Health insurance ($100k+ coverage)', checked: false },
        { id: 6, item: 'Police clearance certificate', checked: false },
        { id: 7, item: 'Medical certificate', checked: false },
        { id: 8, item: 'Visa fee', checked: false }
      ]
    },
    'ltr-wealthy': {
      name: 'LTR Visa (Wealthy Global Citizen/Pensioner)',
      items: [
        { id: 1, item: 'Passport (valid 18+ months)', checked: false },
        { id: 2, item: 'Online application confirmation from BOI', checked: false },
        { id: 3, item: 'Passport photos (4x6cm)', checked: false },
        { id: 4, item: 'Proof of $80,000+ annual income (last 2 years)', checked: false },
        { id: 5, item: 'Proof of $250,000+ assets (bonds, property, investments)', checked: false },
        { id: 6, item: 'Health insurance ($100k+ coverage)', checked: false },
        { id: 7, item: 'Police clearance certificate (home country)', checked: false },
        { id: 8, item: 'LTR visa fee (50,000 THB for 10 years)', checked: false },
        { id: 9, item: 'Proof of investment in Thailand (government bonds or property)', checked: false }
      ]
    },
    // Work Visas
    'business': {
      name: 'Business Visa Extension (Non-B)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Employment Contract', checked: false },
        { id: 5, item: 'Work Permit (or WP.3 receipt)', checked: false },
        { id: 6, item: 'Company Registration (DBD)', checked: false },
        { id: 7, item: 'Company Tax Documents (Por Ngor Dor 1, 50, 91)', checked: false },
        { id: 8, item: 'Company Balance Sheet & P/L Statement', checked: false },
        { id: 9, item: 'List of Thai Employees + Social Security Proof', checked: false },
        { id: 10, item: 'TM.30 Receipt', checked: false },
        { id: 11, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    'smart-visa': {
      name: 'SMART Visa',
      items: [
        { id: 1, item: 'Passport (valid 6+ months)', checked: false },
        { id: 2, item: 'Application form', checked: false },
        { id: 3, item: 'Passport photos', checked: false },
        { id: 4, item: 'Bachelor\'s degree + 5 years experience proof', checked: false },
        { id: 5, item: 'Employment contract (100k+ THB/month)', checked: false },
        { id: 6, item: 'Company registration in S-Curve industry', checked: false },
        { id: 7, item: 'Endorsement letter from relevant ministry', checked: false },
        { id: 8, item: 'Health insurance', checked: false }
      ]
    },
    'ltr-professional': {
      name: 'LTR Visa (Work-From-Thailand Professional)',
      items: [
        { id: 1, item: 'Passport (valid 18+ months)', checked: false },
        { id: 2, item: 'Online application confirmation', checked: false },
        { id: 3, item: 'Passport photos', checked: false },
        { id: 4, item: 'Proof of $80,000+ annual income', checked: false },
        { id: 5, item: 'Employment contract/proof of remote work', checked: false },
        { id: 6, item: 'Health insurance ($100k+ coverage)', checked: false },
        { id: 7, item: 'Police clearance certificate', checked: false },
        { id: 8, item: 'LTR visa fee (50,000 THB)', checked: false }
      ]
    },
    // Digital Nomad
    'dtv': {
      name: 'Destination Thailand Visa (DTV)',
      items: [
        { id: 1, item: 'Valid Passport (6+ months validity)', checked: false },
        { id: 2, item: 'Online e-Visa Application Form', checked: false },
        { id: 3, item: 'Digital Photo (4x6cm, white background)', checked: false },
        { id: 4, item: 'Bank Statement (500,000 THB, last 6 months)', checked: false },
        { id: 5, item: 'Proof of Remote Work (employment letter/contracts)', checked: false },
        { id: 6, item: 'Health Insurance Certificate (min $50k)', checked: false },
        { id: 7, item: 'Portfolio or work samples', checked: false },
        { id: 8, item: 'e-Visa Fee Payment (10,000 THB, non-refundable)', checked: false }
      ]
    },
    // Education
    'education': {
      name: 'Education Visa (Non-ED)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Acceptance Letter from Educational Institution', checked: false },
        { id: 5, item: 'School Registration Documents', checked: false },
        { id: 6, item: 'School License from Ministry of Education', checked: false },
        { id: 7, item: 'Proof of Course Payment', checked: false },
        { id: 8, item: 'TM.30 Receipt', checked: false },
        { id: 9, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    // Family Visas
    'marriage': {
      name: 'Marriage Visa (Non-O)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Marriage Certificate (original + translation)', checked: false },
        { id: 5, item: 'Spouse Thai ID Card + House Registration', checked: false },
        { id: 6, item: 'Bank Letter & Book (400,000 THB seasoned 2 months)', checked: false },
        { id: 7, item: 'Photos of couple together (home, landmarks)', checked: false },
        { id: 8, item: 'TM.30 Receipt', checked: false },
        { id: 9, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    'dependent': {
      name: 'Dependent Visa (Non-O)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Marriage certificate or birth certificate (legalized)', checked: false },
        { id: 5, item: 'Sponsor\'s work permit + copies', checked: false },
        { id: 6, item: 'Sponsor\'s employer letter (40k+ THB salary)', checked: false },
        { id: 7, item: 'Sponsor\'s company documents', checked: false },
        { id: 8, item: 'TM.30 Receipt', checked: false },
        { id: 9, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    'thai-child': {
      name: 'Thai Child Visa (Non-O)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Thai child\'s birth certificate', checked: false },
        { id: 5, item: 'Child\'s Thai ID card + house registration', checked: false },
        { id: 6, item: 'Custody documents (if applicable)', checked: false },
        { id: 7, item: 'Financial proof', checked: false },
        { id: 8, item: 'TM.30 Receipt', checked: false },
        { id: 9, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    // Tourist
    'tourist': {
      name: 'Tourist Visa (TR)',
      items: [
        { id: 1, item: 'Passport (valid 6+ months)', checked: false },
        { id: 2, item: 'Visa Application Form', checked: false },
        { id: 3, item: 'Passport Photo (4x6cm)', checked: false },
        { id: 4, item: 'Flight Booking (onward travel)', checked: false },
        { id: 5, item: 'Hotel Booking or Invitation Letter', checked: false },
        { id: 6, item: 'Bank Statement (20,000 THB proof)', checked: false },
        { id: 7, item: 'Visa Fee (varies by embassy)', checked: false }
      ]
    },
    'medical': {
      name: 'Medical Treatment Visa (MT)',
      items: [
        { id: 1, item: 'Passport (valid 6+ months)', checked: false },
        { id: 2, item: 'Application form', checked: false },
        { id: 3, item: 'Passport photos', checked: false },
        { id: 4, item: 'Letter from Thai hospital confirming appointment', checked: false },
        { id: 5, item: 'Medical treatment plan', checked: false },
        { id: 6, item: 'Medical records from home country', checked: false },
        { id: 7, item: 'Proof of funds for treatment', checked: false },
        { id: 8, item: 'Visa fee', checked: false }
      ]
    },
    // Investment & Premium
    'investment': {
      name: 'Investment Visa (Non-IB/IM)',
      items: [
        { id: 1, item: 'Passport (valid)', checked: false },
        { id: 2, item: 'Application form', checked: false },
        { id: 3, item: 'Passport photos', checked: false },
        { id: 4, item: 'BOI promotion certificate', checked: false },
        { id: 5, item: 'Business plan', checked: false },
        { id: 6, item: 'Company registration documents', checked: false },
        { id: 7, item: 'Proof of investment (3M+ THB)', checked: false },
        { id: 8, item: 'Financial statements', checked: false }
      ]
    },
    'elite': {
      name: 'Thailand Privilege (Elite) Visa',
      items: [
        { id: 1, item: 'Passport (valid)', checked: false },
        { id: 2, item: 'Application Form', checked: false },
        { id: 3, item: 'Passport Photos', checked: false },
        { id: 4, item: 'Police Clearance Certificate', checked: false },
        { id: 5, item: 'Payment proof (900,000 - 2,000,000 THB depending on package)', checked: false }
      ]
    },
    // Other
    'volunteer': {
      name: 'Volunteer Visa (Non-O)',
      items: [
        { id: 1, item: 'Passport (original + copies)', checked: false },
        { id: 2, item: 'TM.7 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'NGO registration documents', checked: false },
        { id: 5, item: 'Letter of acceptance from NGO', checked: false },
        { id: 6, item: 'Work plan description', checked: false },
        { id: 7, item: 'NGO\'s Ministry of Interior approval', checked: false },
        { id: 8, item: 'TM.30 Receipt', checked: false },
        { id: 9, item: '1,900 THB Extension Fee (CASH)', checked: false }
      ]
    },
    'transit': {
      name: 'Transit Visa (TS)',
      items: [
        { id: 1, item: 'Passport (valid 6+ months)', checked: false },
        { id: 2, item: 'Application form', checked: false },
        { id: 3, item: 'Passport photo', checked: false },
        { id: 4, item: 'Confirmed onward flight ticket', checked: false },
        { id: 5, item: 'Visa for destination country (if required)', checked: false },
        { id: 6, item: 'Visa fee', checked: false }
      ]
    },
    're-entry': {
      name: 'Re-Entry Permit',
      items: [
        { id: 1, item: 'Passport (original)', checked: false },
        { id: 2, item: 'TM.8 Application Form', checked: false },
        { id: 3, item: '4x6cm Photo', checked: false },
        { id: 4, item: 'Current visa extension stamp', checked: false },
        { id: 5, item: 'Fee: 1,000 THB (single) or 3,800 THB (multiple)', checked: false }
      ]
    },
    '90-day-report': {
      name: '90-Day Report (TM.47)',
      items: [
        { id: 1, item: 'Passport (original + copy of photo page)', checked: false },
        { id: 2, item: 'TM.47 Form (filled out)', checked: false },
        { id: 3, item: 'Copy of current visa stamp', checked: false },
        { id: 4, item: 'Copy of most recent entry stamp', checked: false },
        { id: 5, item: 'TM.30 receipt copy', checked: false },
        { id: 6, item: 'Previous 90-day report receipt (if not first time)', checked: false }
      ]
    }
  };

  const handleVisaSelect = (visa) => {
    setSelectedVisa(visa);
    if (visa && visaChecklists[visa]) {
      setChecklist(visaChecklists[visa].items);
    } else {
      setChecklist([]);
    }
  };

  const toggleCheck = (id) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const validatePhotoWithAI = async (file) => {
    if (!file) return;

    setAiValidating(true);
    setPhotoValidation(null); // Clear previous validation results
    try {
      // Upload photo first
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });

      // Analyze with AI
      const response = await base44.functions.invoke('invokeOpenAI', {
        prompt: `You are a strict Thai visa photo validator. Analyze this photo against official Thai Immigration requirements.

Check EVERY requirement carefully:
1. Head Size: 70-80% of photo height (chin to top of head)
2. Background: Pure white, no shadows or patterns
3. Shoulders: Visible and properly covered
4. Face: Centered, looking straight ahead
5. Expression: Neutral, mouth closed
6. Eyes: Both visible, open, no glare
7. Lighting: Even on face and background
8. Quality: Sharp, in focus, high resolution
9. Attire: Appropriate, not white/uniform
10. Recency: Appears recent (within 6 months)

For each requirement provide: requirement name, status (PASS/WARNING/FAIL), details of what you observe, and fix_suggestion if not PASS.

Overall verdict must be: ACCEPTABLE (all pass), POSSIBLY_ACCEPTABLE (warnings only), or REJECTED (any fails).`,
        file_urls: [uploadResponse.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            overall_verdict: {
              type: "string",
              enum: ["ACCEPTABLE", "POSSIBLY_ACCEPTABLE", "REJECTED"]
            },
            checks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirement: { type: "string" },
                  status: { type: "string", enum: ["PASS", "WARNING", "FAIL"] },
                  details: { type: "string" },
                  fix_suggestion: { type: "string"}
                },
                required: ["requirement", "status", "details"]
              }
            },
            summary: { type: "string" }
          },
          required: ["overall_verdict", "checks", "summary"]
        }
      });

      setPhotoValidation({
        aiAnalysis: response.data,
        valid: response.data.overall_verdict === "ACCEPTABLE",
      });
    } catch (error) {
      console.error('AI validation error:', error);
      setPhotoValidation({
        error: true,
        message: error.response?.data?.error || error.message || 'Failed to analyze photo. Please try again with a JPG or PNG file.'
      });
      addError('Photo validation failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setAiValidating(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Max 10MB
        addError('File too large. Maximum 10MB.');
        e.target.value = ''; // Reset input to allow re-selection of the same file after error
        return;
      }
      setPhotoFile(file);
      validatePhotoWithAI(file);
    }
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoValidation(null);
    // Reset file input element
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const progress = checklist.length > 0
    ? Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100)
    : 0;

  return (
    <>
      <SEOHead page="DocumentValidator" />
      <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
  <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <FileCheck className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">AI Document Pre-Validator</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Thailand Visa Document Validator</h1>
          <p className="text-white/90 text-lg">Validate your documents before submission to prevent visa rejections</p>
        </div>
      </div>

      {/* Visa Selection */}
      <GlassCard className="p-8 text-[#454545]">
        <h2 className="text-3xl font-bold text-[#272262] mb-6">Select Your Visa Type</h2>
        <VisaTypeSelect value={selectedVisa} onValueChange={handleVisaSelect} className="h-14 text-lg border font-bold border-[#d5d5d5]" />
      </GlassCard>

      {selectedVisa && (
        <>
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#272262]">
                {visaChecklists[selectedVisa]?.name || 'Selected Visa Checklist'}
              </h2>
              <div className="text-right">
                <div className="text-4xl font-bold text-[#272262]">{progress}%</div>
                <div className="text-sm text-[#454545] font-medium">Complete</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="h-4 bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E7E7E7]">
                <div
                  className="h-full bg-linear-to-r from-[#272262] to-[#3d3680] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-5 flex items-start gap-4 transition-all hover:scale-[1.01] ${
                    item.checked ? 'bg-green-50 border-green-300' : 'bg-white border-[#E7E7E7]'
                  }`}
                >
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={() => toggleCheck(item.id)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={`check-${item.id}`}
                    className={`text-[#272262] cursor-pointer flex-1 font-medium ${
                      item.checked ? 'line-through text-[#454545]' : ''
                    }`}
                  >
                    {item.item}
                  </Label>
                  {item.checked && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Enhanced AI Photo Validator */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#272262]">AI Photo Validator</h2>
              {(photoFile || photoValidation) && (
                <Button
                  onClick={handleClearPhoto}
                  variant="outline"
                  className="border border-[#272262] text-[#272262] hover:bg-[#F8F9FA]"
                >
                  Upload New Photo
                </Button>
              )}
            </div>

            <div className="bg-green-50 border border-green-300 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xl font-bold text-[#272262] mb-2">Privacy Protected</h3>
                  <p className="text-[#454545] leading-relaxed">
                    Your photo is <strong>NOT stored on our servers</strong>. It is temporarily uploaded for AI analysis only,
                    then <strong>immediately deleted</strong>. We never save or share your photos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!photoFile && !photoValidation && (
                <div>
                  <Label className="text-[#272262] mb-4 block font-semibold text-lg">Upload Your Photo</Label>
                  <div className="border border-dashed border-[#E7E7E7] rounded-xl p-12 text-center hover:border-[#272262] transition-colors bg-[#F8F9FA] cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-4 shadow-lg">
                          <ImageIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-[#272262] font-bold text-lg mb-2">Click to Upload Photo</div>
                        <div className="text-[#454545] mb-2">JPG, PNG, or HEIC • Under 10MB</div>
                        <div className="text-sm text-green-600 font-medium">Photo deleted after analysis</div>
                      </div>
                    </Label>
                  </div>
                </div>
              )}

              {photoFile && !photoValidation && !aiValidating && (
                <div className="border border-blue-300 bg-blue-50 p-8 rounded-xl text-center">
                  <ImageIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-[#272262] font-bold text-lg mb-2">Photo Selected: {photoFile.name}</p>
                  <p className="text-[#454545]">Ready for analysis. Click &quot;Upload New Photo&quot; above to change.</p>
                </div>
              )}

              {aiValidating && (
                <div className="border border-blue-300 bg-blue-50 p-8 rounded-xl text-center">
                  <div className="w-16 h-16 border-4 border-[#272262] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#272262] font-bold text-lg mb-2">AI Analyzing Photo...</p>
                  <p className="text-[#454545]">Checking Thai visa requirements</p>
                </div>
              )}

              {photoValidation && !aiValidating && photoValidation.error && (
                <div className="border border-red-300 bg-red-50 p-8 rounded-xl text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <p className="text-[#454545] mb-4">{photoValidation.message}</p>
                  <Button
                    onClick={handleClearPhoto}
                    className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-8 py-6 font-bold"
                  >
                    Try Another Photo
                  </Button>
                </div>
              )}

              {photoValidation && !aiValidating && photoValidation.aiAnalysis && (
                <div className={`border rounded-xl p-8 ${
                  photoValidation.valid
                    ? 'border-green-300 bg-green-50'
                    : photoValidation.aiAnalysis.overall_verdict === 'POSSIBLY_ACCEPTABLE'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-center gap-4 mb-8">
                    {photoValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-green-600 shrink-0" />
                        <div>
                          <h3 className="text-3xl font-bold text-[#272262] mb-1">Photo Accepted!</h3>
                          <p className="text-[#454545]">Your photo meets Thai visa requirements</p>
                        </div>
                      </>
                    ) : photoValidation.aiAnalysis.overall_verdict === 'POSSIBLY_ACCEPTABLE' ? (
                      <>
                        <AlertCircle className="w-12 h-12 text-yellow-600 shrink-0" />
                        <div>
                          <h3 className="text-3xl font-bold text-[#272262] mb-1">Photo May Work</h3>
                          <p className="text-[#454545]">Some requirements need attention</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-12 h-12 text-red-600 shrink-0" />
                        <div>
                          <h3 className="text-3xl font-bold text-[#272262] mb-1">Photo Rejected</h3>
                          <p className="text-[#454545]">Photo does not meet requirements</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    {photoValidation.aiAnalysis.checks.map((check, i) => (
                      <div key={i} className={`border rounded-xl p-5 ${
                        check.status === 'PASS'
                          ? 'border-green-200 bg-white'
                          : check.status === 'WARNING'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">
                            {check.status === 'PASS' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                            {check.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-600" />}
                            {check.status === 'FAIL' && <AlertCircle className="w-6 h-6 text-red-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#272262] mb-2 text-lg">
                              {check.requirement}
                              <span className={`ml-3 text-xs px-3 py-1 rounded-full ${
                                check.status === 'PASS' ? 'bg-green-100 text-green-700' :
                                check.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {check.status}
                              </span>
                            </p>
                            <p className="text-[#454545] mb-3">{check.details}</p>
                            {check.fix_suggestion && check.status !== 'PASS' && (
                              <p className="text-[#272262] font-medium">
                                <strong>Fix:</strong> {check.fix_suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-[#E7E7E7] p-5 rounded-xl mb-6">
                    <p className="font-bold text-[#272262] text-lg mb-2">Summary</p>
                    <p className="text-[#454545] leading-relaxed">{photoValidation.aiAnalysis.summary}</p>
                  </div>

                  {!photoValidation.valid && (
                    <Button
                      onClick={handleClearPhoto}
                      className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-7 text-lg font-bold"
                    >
                      Upload New Photo
                    </Button>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                <p className="text-[#272262] font-bold text-lg mb-4">Thai Visa Photo Requirements:</p>
                <ul className="text-[#454545] space-y-2">
                  <li>• Size: 4x6 cm (472x709 pixels at 300 DPI)</li>
                  <li>• Background: Pure white, no shadows</li>
                  <li>• Head size: 70-80% of photo height</li>
                  <li>• Face: Centered, looking straight</li>
                  <li>• Expression: Neutral, mouth closed</li>
                  <li>• Shoulders: Visible, covered appropriately</li>
                  <li>• No glasses glare, no hats</li>
                  <li>• Recent photo (within 6 months)</li>
                </ul>
              </div>
            </div>
          </GlassCard>

          <ContactCTA message="Need document review help?" />
        </>
      )}
      </div>
    </>
  );
}
