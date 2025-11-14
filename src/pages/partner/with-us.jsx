
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Shield, CheckCircle2, Mail, Target, Award } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SEOHead from '../../components/SEOHead';

export default function PartnerWithUs() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_email: '',
    contact_phone: '',
    business_type: 'visa_agency',
    office_location: '',
    website: '',
    description: '',
    languages_spoken: []
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessPartner.create(data),
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center bg-white border border-[#E7E7E7]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#272262] mb-4">Application Received</h1>
          <p className="text-[#454545] text-lg mb-8">
            Thank you for your interest in partnering with Thai Nexus. Our team will review your application and contact you within 24-48 hours.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                business_name: '',
                contact_email: '',
                contact_phone: '',
                business_type: 'visa_agency',
                office_location: '',
                website: '',
                description: '',
                languages_spoken: []
              });
            }}
            variant="outline"
            className="border-[#272262] text-[#272262] hover:bg-[#272262] hover:text-white"
          >
            Submit Another Application
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      <SEOHead page="PartnerWithUs" />    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section - REDESIGNED */}
      <div className="relative overflow-hidden rounded-3xl min-h-[400px] flex items-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262]" />
        
        {/* Floating elements for visual interest */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#BF1E2E]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 w-full px-6 md:px-12 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 shadow-xl">
            <Building2 className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Trusted Partner Network</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Join Our Referral Network
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
            Become a trusted Thai Nexus partner. Receive qualified client referrals in your district when we can't provide direct service.
          </p>
          
          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 text-white/90 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">2 Only</div>
              <div className="text-sm">Partners Per District</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">5,000+</div>
              <div className="text-sm">Monthly Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">24-48h</div>
              <div className="text-sm">Approval Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <h2 className="text-3xl font-bold text-[#272262] mb-6 text-center">How Our Partnership Works</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#272262] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#272262] mb-2">Client Requests Help</h3>
              <p className="text-[#454545]">When a client needs visa services in your district and Thai Nexus cannot provide direct assistance, we refer them to you.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#272262] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#272262] mb-2">You Receive Qualified Lead</h3>
              <p className="text-[#454545]">We send client details directly to you. They've already been screened and are ready to work with a professional.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#272262] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#272262] mb-2">You Serve the Client</h3>
              <p className="text-[#454545]">Provide your professional visa services. Build your business while helping expats successfully navigate Thai immigration.</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* What We're Looking For */}
      <GlassCard className="p-8 bg-gradient-to-br from-[#F8F9FA] to-white border border-[#E7E7E7]">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#BF1E2E] flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#272262] mb-3">Partner Requirements</h2>
            <p className="text-[#454545]">We maintain strict standards to ensure client satisfaction and protect our reputation.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Established Presence</h3>
              <p className="text-sm text-[#454545]">Physical office in Thailand with proven track record</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Professional Service</h3>
              <p className="text-sm text-[#454545]">High success rates and positive client feedback</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Responsive Communication</h3>
              <p className="text-sm text-[#454545]">Reply to client inquiries within 24 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Transparent Pricing</h3>
              <p className="text-sm text-[#454545]">Clear, honest pricing with no hidden fees</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Licensed Professionals</h3>
              <p className="text-sm text-[#454545]">Qualified lawyers or licensed visa agents</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#272262] mb-1">Client-Focused</h3>
              <p className="text-sm text-[#454545]">Commitment to helping clients succeed</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Exclusivity */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#272262] mb-4">Limited Partnership Slots</h2>
          <p className="text-[#454545] text-lg mb-6">
            We accept only <strong className="text-[#BF1E2E]">2 partners per district</strong> to ensure quality service and protect the exclusivity of our referral network.
          </p>
          <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-xl p-6 text-left">
            <p className="text-sm text-[#454545] mb-4">
              <strong className="text-[#272262]">Why limited partnerships?</strong>
            </p>
            <ul className="space-y-2 text-sm text-[#454545]">
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
                <span>Ensures you receive consistent, quality leads without oversaturation</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
                <span>Maintains high service standards across our partner network</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[#BF1E2E] flex-shrink-0 mt-0.5" />
                <span>Protects our reputation by working only with proven professionals</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Application Form */}
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
        <h2 className="text-3xl font-bold text-[#272262] mb-2">Partnership Application</h2>
        <p className="text-[#454545] mb-6">Apply to join our trusted network of visa professionals.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-[#454545] mb-2 block">Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Your Agency / Law Office Name"
                required
                className="border-[#E7E7E7]"
              />
            </div>

            <div>
              <Label className="text-[#454545] mb-2 block">Business Type *</Label>
              <Select
                value={formData.business_type}
                onValueChange={(val) => setFormData({ ...formData, business_type: val })}
              >
                <SelectTrigger className="border-[#E7E7E7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="law_office">Law Office</SelectItem>
                  <SelectItem value="visa_agency">Visa Agency</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#454545] mb-2 block">Contact Email *</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@yourcompany.com"
                required
                className="border-[#E7E7E7]"
              />
            </div>

            <div>
              <Label className="text-[#454545] mb-2 block">Contact Phone *</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+66 XX XXX XXXX"
                required
                className="border-[#E7E7E7]"
              />
            </div>

            <div>
              <Label className="text-[#454545] mb-2 block">Office Location (District) *</Label>
              <Input
                value={formData.office_location}
                onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                placeholder="e.g., Mueang Phuket, Bang Rak Bangkok"
                required
                className="border-[#E7E7E7]"
              />
              <p className="text-xs text-[#454545] mt-1">Specify district - only 2 partners accepted per district</p>
            </div>

            <div>
              <Label className="text-[#454545] mb-2 block">Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="border-[#E7E7E7]"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#454545] mb-2 block">About Your Business *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your experience, qualifications, success rate, years in business, services offered..."
              rows={6}
              required
              className="border-[#E7E7E7]"
            />
          </div>

          <div className="bg-[#F8F9FA] border border-[#E7E7E7] p-6 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[#272262] flex-shrink-0" />
              <div>
                <h3 className="font-bold text-[#272262] mb-2">Selection Process</h3>
                <p className="text-sm text-[#454545] mb-3">
                  Applications are carefully reviewed to ensure partners meet our quality standards. We verify credentials, check references, and assess your ability to serve clients professionally.
                </p>
                <p className="text-sm text-[#454545]">
                  If your district already has 2 partners, we'll place you on our waiting list.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-6 text-lg"
          >
            <Mail className="w-5 h-5 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Partnership Application'}
          </Button>
        </form>
      </GlassCard>

      {/* Contact CTA */}
      <GlassCard className="p-8 bg-gradient-to-br from-[#272262] to-[#3d3680] border-none text-white text-center" hover={false}>
        <h2 className="text-2xl font-bold mb-4">Questions About Partnerships?</h2>
        <p className="text-white/90 mb-6">
          Contact our partnerships team for more information about joining our network.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            className="bg-white hover:bg-gray-50 text-[#272262] font-semibold"
            onClick={() => window.open('mailto:contact@thainexus.co.th')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email: contact@thainexus.co.th
          </Button>
        </div>
      </GlassCard>
    </div>    </>

  );
}
