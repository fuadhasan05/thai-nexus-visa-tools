
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Bell, AlertTriangle, CheckCircle2, Copy, Plus, Trash2, Clock, FileText } from 'lucide-react';
import { format, addDays, addMonths, differenceInDays, parseISO } from 'date-fns';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import VisaTypeSelect from '../../components/VisaTypeSelect';


export default function AdminManager() {
  const [arrivalDate, setArrivalDate] = useState('');
  const [visaType, setVisaType] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionDuration, setExtensionDuration] = useState('1-year');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) return null;
      const user = userData?.user;
      if (!user) return null;
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileErr) {
        return { id: user.id, email: user.email };
      }
      return profile;
    },
    retry: false
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ninety-day-reports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase.from('ninety_day_reports').select('*').eq('user_email', user.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email
  });

  const createReportMutation = useMutation({
    mutationFn: async (date) => {
      const deadline = addDays(new Date(date), 90);
      const windowStart = addDays(deadline, -15);
      const { error } = await supabase.from('ninety_day_reports').insert([{
        user_email: user.email,
        last_arrival_date: date,
        report_deadline: deadline.toISOString().split('T')[0],
        window_start: windowStart.toISOString().split('T')[0],
        status: 'pending'
      }]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninety-day-reports'] });
      setArrivalDate('');
    }
  });

  const createVisaTrackerMutation = useMutation({
    mutationFn: async ({ visaType, extensionDate, duration }) => {
      let expiryDate;
      if (duration === '1-year') {
        expiryDate = addMonths(new Date(extensionDate), 12);
      } else if (duration === '3-month') {
        expiryDate = addMonths(new Date(extensionDate), 3);
      } else if (duration === '1-month') {
        expiryDate = addMonths(new Date(extensionDate), 1);
      }

      const alertDate = addDays(expiryDate, -30);

      const { error } = await supabase.from('ninety_day_reports').insert([{
        user_email: user.email,
        last_arrival_date: extensionDate,
        report_deadline: expiryDate.toISOString().split('T')[0],
        window_start: alertDate.toISOString().split('T')[0],
        status: 'pending',
        notes: `${visaType} - ${duration} extension expires`
      }]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninety-day-reports'] });
      setVisaType('');
      setExtensionDate('');
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('ninety_day_reports').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninety-day-reports'] });
    }
  });

  const completeReportMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('ninety_day_reports').update({
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0]
      }).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninety-day-reports'] });
    }
  });

  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    }
  };

  const tm30Message = {
    english: `Dear Landlord/Property Owner,

As a foreign resident in Thailand, I am required by Thai Immigration Law (Section 38 of the Immigration Act) to have my residence reported to immigration within 24 hours of my arrival.

This is called a TM.30 form. As the property owner/manager, you are responsible for filing this form.

The TM.30 can be filed:
• Online at: https://extranet.immigration.go.th/fn24online/
• In person at your local immigration office
• Via mobile app (some offices)

Information you'll need from me:
• Copy of my passport (photo and visa pages)
• Copy of my TM.6 departure card (if applicable)
• My arrival date: [Please fill in]

This is a legal requirement, and failure to file can result in fines for both of us. Please let me know once you have filed it, as I will need the receipt (TM.30 slip) for my visa extension.

Thank you for your cooperation!`,
    thai: `เรียน เจ้าของบ้าน/ผู้จัดการอสังหาริมทรัพย์

ในฐานะชาวต่างชาติที่พักอาศัยในประเทศไทย ฉันต้องแจ้งที่พักอาศัยต่อสำนักงานตรวจคนเข้าเมืองภายใน 24 ชั่วโมงหลังจากมาถึง ตามกฎหมายตรวจคนเข้าเมือง มาตรา 38

แบบฟอร์มนี้เรียกว่า ทม.30 ในฐานะเจ้าของ/ผู้จัดการอสังหาริมทรัพย์ ท่านมีหน้าที่ยื่นแบบฟอร์มนี้

สามารถยื่น ทม.30 ได้ที่:
• ออนไลน์: https://extranet.immigration.go.th/fn24online/
• สำนักงานตรวจคนเข้าเมืองในพื้นที่
• แอปพลิเคชันมือถือ (บางสำนักงาน)

เอกสารที่ต้องการจากฉัน:
• สำเนาหนังสือเดินทาง (หน้าภาพและหน้าวีซ่า)
• สำเนา ทม.6 (ถ้ามี)
• วันที่มาถึง: [กรุณากรอก]

ขอขอบคุณสำหรับความร่วมมือค่ะ/ครับ`
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const activeReports = reports.filter(r => r.status === 'pending');
  const nextDeadline = activeReports.sort((a, b) => 
    new Date(a.report_deadline) - new Date(b.report_deadline)
  )[0];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262] p-12 text-center">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <Calendar className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-bold">Visa Deadline Tracker</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Visa & Immigration Tracker</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">Never miss a visa deadline, 90-day report, or extension due date</p>
          </div>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-8 text-center">What You Can Track</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-white border border-[#E7E7E7] hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-4 shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#272262] mb-3">90-Day Reports</h3>
              <p className="text-[#454545] leading-relaxed">Automatic deadline calculations with 15-day reporting window alerts</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7E7E7] hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mb-4 shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#272262] mb-3">Visa Extensions</h3>
              <p className="text-[#454545] leading-relaxed">Track 1-year, 3-month, or 1-month extension expiry dates</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7E7E7] hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#272262] mb-3">Re-Entry Permits</h3>
              <p className="text-[#454545] leading-relaxed">Never forget to get your re-entry permit before traveling</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7E7E7] hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mb-4 shadow-lg">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#272262] mb-3">TM.30 Management</h3>
              <p className="text-[#454545] leading-relaxed">Landlord communication templates in English and Thai</p>
            </div>
          </div>

          <div className="text-center p-10 bg-[#F8F9FA] rounded-2xl border border-[#E7E7E7]">
            <h3 className="text-2xl font-bold text-[#272262] mb-3">Login to Start Tracking</h3>
            <p className="text-[#454545] mb-6 text-lg">Create your personalized visa deadline dashboard</p>
            <Button
              onClick={handleLogin}
              className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-10 py-6 text-lg font-bold shadow-xl"
            >
              Login to Access Tracker
            </Button>
          </div>
        </GlassCard>

        <ContactCTA message="Need help managing your visa deadlines?" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <Calendar className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Never Miss a Deadline</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Visa & Immigration Tracker</h1>
          <p className="text-white/90 text-lg">Your comprehensive deadline management system</p>
        </div>
      </div>

      {/* Next Deadline Alert */}
      {nextDeadline && (
        <GlassCard className="p-8 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-300">
          <div className="flex items-start gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${
              differenceInDays(new Date(nextDeadline.report_deadline), new Date()) < 7
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-orange-500 to-red-500'
            }`}>
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[#272262] mb-3">
                {nextDeadline.notes || 'Next Deadline'}
              </h3>
              <p className="text-[#454545] text-lg mb-4">
                Due: <span className="text-[#272262] font-bold">
                  {format(parseISO(nextDeadline.report_deadline), 'MMMM dd, yyyy')}
                </span>
                {' '}({differenceInDays(parseISO(nextDeadline.report_deadline), new Date())} days remaining)
              </p>
              {nextDeadline.window_start && (
                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 p-4 rounded-xl">
                  <p className="text-[#454545] font-medium">
                    Action window: {format(parseISO(nextDeadline.window_start), 'MMM dd')} - {format(parseISO(nextDeadline.report_deadline), 'MMM dd')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* 90-Day Report Tracker */}
      <GlassCard className="p-8">
        <h2 className="text-3xl font-bold text-[#272262] mb-6">90-Day Report Tracker</h2>
        <div className="space-y-6">
          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Last Arrival Date in Thailand</Label>
            <Input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className="h-14 text-lg border"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-5 rounded-xl">
            <div className="flex items-start gap-3 text-[#454545]">
              <AlertTriangle className="w-6 h-6 mt-0.5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="mb-3 font-medium">
                  Enter your last arrival/re-entry date. We'll calculate your 90-day deadline automatically.
                </p>
                <p className="text-sm">
                  The 90-day count resets every time you leave and re-enter Thailand
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => createReportMutation.mutate(arrivalDate)}
            disabled={!arrivalDate || createReportMutation.isPending}
            className="w-full bg-[#272262] hover:bg-[#1d1847] text-white py-7 text-lg font-bold shadow-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            {createReportMutation.isPending ? 'Creating...' : 'Create 90-Day Tracker'}
          </Button>
        </div>
      </GlassCard>

      {/* Visa Extension Tracker */}
      <GlassCard className="p-8">
        <h2 className="text-3xl font-bold text-[#272262] mb-6">Visa Extension Tracker</h2>
        <div className="space-y-6">
          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Visa Type</Label>
            <VisaTypeSelect
              value={visaType}
              onValueChange={setVisaType}
              placeholder="Select your visa type"
              className="h-14 text-lg border"
            />
          </div>

          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Extension Date</Label>
            <Input
              type="date"
              value={extensionDate}
              onChange={(e) => setExtensionDate(e.target.value)}
              className="h-14 text-lg border"
            />
          </div>

          <div>
            <Label className="text-[#272262] mb-3 block font-semibold text-lg">Extension Duration</Label>
            <Select value={extensionDuration} onValueChange={setExtensionDuration}>
              <SelectTrigger className="h-14 text-lg border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-year">1 Year</SelectItem>
                <SelectItem value="3-month">3 Months</SelectItem>
                <SelectItem value="1-month">1 Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => createVisaTrackerMutation.mutate({ visaType, extensionDate, duration: extensionDuration })}
            disabled={!visaType || !extensionDate || createVisaTrackerMutation.isPending}
            className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-7 text-lg font-bold shadow-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            {createVisaTrackerMutation.isPending ? 'Creating...' : 'Track Visa Extension'}
          </Button>
        </div>
      </GlassCard>

      {/* TM.30 Templates */}
      <GlassCard className="p-8">
        <h2 className="text-3xl font-bold text-[#272262] mb-4">TM.30 Landlord Communicator</h2>
        <p className="text-[#454545] mb-6 text-lg">
          Copy and send these pre-written messages to your landlord to request TM.30 filing
        </p>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[#272262] font-bold text-lg">English Version</Label>
              <Button
                onClick={() => copyToClipboard(tm30Message.english)}
                variant="outline"
                className="border border-[#272262] text-[#272262] hover:bg-[#F8F9FA]"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea
              value={tm30Message.english}
              readOnly
              className="min-h-[300px] font-mono text-sm bg-[#F8F9FA] border"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[#272262] font-bold text-lg">Thai Version (ภาษาไทย)</Label>
              <Button
                onClick={() => copyToClipboard(tm30Message.thai)}
                variant="outline"
                className="border border-[#272262] text-[#272262] hover:bg-[#F8F9FA]"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea
              value={tm30Message.thai}
              readOnly
              className="min-h-[250px] font-mono text-sm bg-[#F8F9FA] border"
            />
          </div>
        </div>
      </GlassCard>

      {/* All Tracked Items */}
      {reports.length > 0 && (
        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-6">Your Tracked Items</h2>
          <div className="space-y-4">
            {reports.sort((a, b) => parseISO(a.report_deadline) - parseISO(b.report_deadline)).map((report) => (
              <div key={report.id} className="border border-[#E7E7E7] bg-white p-6 rounded-2xl hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[#272262] font-bold text-lg mb-2">
                      {report.notes || '90-Day Report'}
                    </p>
                    <p className="text-[#454545] mb-1">
                      Started: <span className="font-semibold">{format(parseISO(report.last_arrival_date), 'MMM dd, yyyy')}</span>
                    </p>
                    <p className="text-[#454545]">
                      Due: <span className="font-semibold">{format(parseISO(report.report_deadline), 'MMM dd, yyyy')}</span>
                      {' '}({differenceInDays(parseISO(report.report_deadline), new Date())} days)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {report.status === 'pending' && (
                      <>
                        <Button
                          size="lg"
                          onClick={() => completeReportMutation.mutate(report.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Done
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => deleteReportMutation.mutate(report.id)}
                          className="border-2 border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                    {report.status === 'completed' && (
                      <span className="px-5 py-3 rounded-xl bg-green-100 text-green-700 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Completed {report.completed_date && `on ${format(parseISO(report.completed_date), 'MMM dd')}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Re-Entry Permit Warning */}
      <GlassCard className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border border-red-300">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#272262] mb-3">Re-Entry Permit Warning</h3>
            <p className="text-[#454545] mb-3 leading-relaxed">
              If you're on a 1-year extension and plan to leave Thailand, you MUST get a re-entry permit BEFORE leaving.
            </p>
            <p className="text-[#454545] mb-5 font-semibold">
              Without it, your 1-year extension becomes VOID the moment you exit Thailand.
            </p>
            <div className="bg-white/90 backdrop-blur-sm border border-red-200 p-5 rounded-xl">
              <p className="text-[#272262] font-bold mb-3">How to get Re-Entry Permit:</p>
              <ul className="text-[#454545] space-y-2 ml-4">
                <li>• At Immigration Office: 1,000 THB (single), 3,800 THB (multiple)</li>
                <li>• At Airport (Suvarnabhumi/Don Mueang): Available before departure</li>
                <li>• Bring: TM.8 form, passport, 4x6cm photo, cash</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>

      <ContactCTA message="Need help with your visa deadlines or immigration compliance?" />
    </div>
  );
}
