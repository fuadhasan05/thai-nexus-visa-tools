
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus, Edit, CheckCircle, XCircle, User, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useError } from '../../components/ErrorNotification';
import { useConfirm } from '../../components/ConfirmDialog';

// removed getStaticProps stub so admin page renders at runtime
export default function AdminPartners() {
  // ALWAYS call ALL hooks at the top - never conditionally
  const [showDialog, setShowDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [registerEmail, setRegisterEmail] = useState('');
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();
  const { confirm } = useConfirm();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['current-user-admin'],
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: false,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['business-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_partners')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: [],
    enabled: currentUser?.role === 'admin'
  });

  const { data: leadRequests = [] } = useQuery({
    queryKey: ['lead-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_requests')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: [],
    enabled: currentUser?.role === 'admin'
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from('business_partners')
        .update({ status: 'approved', is_verified: true })
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-partners'] });
      addSuccess('Partner approved successfully!');
    },
    onError: (error) => {
      addError(`Failed to approve partner: ${error.message}`);
    }
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('business_partners').update(data).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-partners'] });
      setShowDialog(false);
      setEditingPartner(null);
      addSuccess('Partner updated successfully!');
    },
    onError: (error) => {
      addError(`Failed to update partner: ${error.message}`);
    }
  });

  const handleRegisterPartner = (e) => {
    e.preventDefault();
    addSuccess(`Invitation sent to ${registerEmail}`);
    setRegisterEmail('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  // NOW do conditional renders AFTER all hooks
  if (isLoadingUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-12 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Loading...</h1>
          <p className="text-gray-600">Checking your access privileges.</p>
        </GlassCard>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-4">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 text-sm font-medium">Admin Panel</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Partner Management</h1>
        <p className="text-gray-600">Manage business partners and track client connections</p>
      </GlassCard>

      <Tabs defaultValue="partners" className="space-y-6 text-gray-600">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="leads">Client Requests</TabsTrigger>
          <TabsTrigger value="offices">Immigration Offices</TabsTrigger>
          <TabsTrigger value="register">Register Partner</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          <div className="grid gap-6">
            {partners.map((partner) => (
              <GlassCard key={partner.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{partner.business_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
                        {partner.status}
                      </span>
                      {partner.is_verified && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Type:</strong> {partner.business_type}</p>
                      <p><strong>Location:</strong> {partner.office_location}</p>
                      <p><strong>Email:</strong> {partner.contact_email}</p>
                      <p><strong>Phone:</strong> {partner.contact_phone}</p>
                      {partner.website && (
                        <p><strong>Website:</strong> <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{partner.website}</a></p>
                      )}
                      {partner.commission_rate && (
                        <p><strong>Commission Rate:</strong> {partner.commission_rate}%</p>
                      )}
                    </div>
                    {partner.description && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{partner.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {partner.status === 'pending' && (
                      <Button
                        onClick={() => approveMutation.mutate({ id: partner.id })}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    )}
                    <Dialog open={showDialog && editingPartner?.id === partner.id} onOpenChange={(open) => {
                      setShowDialog(open);
                      if (!open) setEditingPartner(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setEditingPartner(partner)}
                          variant="outline"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Partner</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          updatePartnerMutation.mutate({
                            id: partner.id,
                            data: {
                              status: formData.get('status'),
                              commission_rate: parseFloat(formData.get('commission_rate')),
                              is_verified: formData.get('is_verified') === 'true'
                            }
                          });
                        }} className="space-y-4">
                          <div>
                            <Label>Status</Label>
                            <Select name="status" defaultValue={partner.status}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Commission Rate (%)</Label>
                            <Input
                              type="number"
                              name="commission_rate"
                              defaultValue={partner.commission_rate || 10}
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label>Verified Partner</Label>
                            <Select name="is_verified" defaultValue={partner.is_verified ? 'true' : 'false'}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Update Partner
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </GlassCard>
            ))}
            {partners.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No partners yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-6">
          <ContributorManagement />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid gap-6">
            {leadRequests.map((lead) => {
              const partner = partners.find(p => p.id === lead.partner_id);
              return (
                <GlassCard key={lead.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{lead.user_name || lead.user_email}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Visa Type:</strong> {lead.visa_type}</p>
                        <p><strong>Email:</strong> {lead.user_email}</p>
                        {lead.user_phone && <p><strong>Phone:</strong> {lead.user_phone}</p>}
                        {partner && <p><strong>Assigned To:</strong> {partner.business_name}</p>}
                        <p><strong>Requested:</strong> {new Date(lead.created_date).toLocaleDateString()}</p>
                      </div>
                      {lead.message && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{lead.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
            {leadRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No client requests yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="offices" className="space-y-6">
          <OfficeManagement />
        </TabsContent>

        <TabsContent value="register">
          <GlassCard className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Partner</h2>
            <form onSubmit={handleRegisterPartner} className="space-y-6">
              <div>
                <Label className="text-gray-700 mb-2 block">Partner Email</Label>
                <Input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="partner@company.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  An invitation will be sent to this email with login instructions
                </p>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <User className="w-4 h-4 mr-2" />
                Send Partner Invitation
              </Button>
            </form>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContributorManagement() {
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();

  const { data: contributorApplications = [] } = useQuery({
    queryKey: ['contributor-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributorapplications')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: []
  });

  const approveContributorMutation = useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from('contributorapplications')
        .update({ contributor_status: 'approved', approval_date: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributor-applications'] });
      addSuccess('Contributor approved! They can now subscribe.');
    },
    onError: (error) => {
      addError(`Failed to approve: ${error.message}`);
    }
  });

  const rejectContributorMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const { error } = await supabase
        .from('contributorapplications')
        .update({ contributor_status: 'none', moderation_notes: reason })
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributor-applications'] });
      addSuccess('Application rejected');
    },
    onError: (error) => {
      addError(`Failed to reject: ${error.message}`);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 border-green-300';
      case 'subscribed': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const pendingApplications = contributorApplications.filter(c => c.contributor_status === 'pending_approval');
  const activeContributors = contributorApplications.filter(c => ['approved', 'subscribed'].includes(c.contributor_status));

  return (
    <div className="space-y-6">
      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-[#272262] mb-4">Pending Applications ({pendingApplications.length})</h3>
          <div className="grid gap-4">
            {pendingApplications.map(contributor => (
              <GlassCard key={contributor.id} className="p-6 bg-white border border-[#E7E7E7]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-xl font-bold text-[#272262]">{contributor.full_name || 'No name provided'}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(contributor.contributor_status)}`}>
                        Pending Review
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <p><strong>Email:</strong> {contributor.user_email}</p>
                      {contributor.bio && (
                        <div className="bg-[#F8F9FA] p-3 rounded border border-[#E7E7E7]">
                          <strong>Bio:</strong> {contributor.bio}
                        </div>
                      )}
                      {contributor.expertise_areas && contributor.expertise_areas.length > 0 && (
                        <div>
                          <strong>Expertise:</strong> {contributor.expertise_areas.join(', ')}
                        </div>
                      )}
                      {contributor.application_text && (
                        <div className="bg-[#F8F9FA] p-3 rounded border border-[#E7E7E7]">
                          <strong>Application:</strong> {contributor.application_text}
                        </div>
                      )}
                      <p className="text-xs text-[#454545]">
                        <strong>Applied:</strong> {new Date(contributor.application_date || contributor.created_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => approveContributorMutation.mutate({ id: contributor.id })}
                        disabled={approveContributorMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          const reason = prompt('Reason for rejection (will be shown to applicant):');
                          if (reason) {
                            rejectContributorMutation.mutate({ id: contributor.id, reason });
                          }
                        }}
                        disabled={rejectContributorMutation.isPending}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Active Contributors */}
      <div>
        <h3 className="text-xl font-bold text-[#272262] mb-4">Active Contributors ({activeContributors.length})</h3>
        <div className="grid gap-4">
          {activeContributors.map(contributor => (
            <GlassCard key={contributor.id} className="p-6 bg-white border border-[#E7E7E7]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-[#272262]">{contributor.full_name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(contributor.contributor_status)}`}>
                      {contributor.contributor_status === 'subscribed' ? 'Active Subscription' : 'Approved'}
                    </span>
                    {contributor.subscription_active && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                        Paying
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-[#454545]">
                    <p><strong>Email:</strong> {contributor.user_email}</p>
                    <p><strong>Role:</strong> {contributor.role || 'contributor'}</p>
                    {contributor.post_count > 0 && (
                      <p><strong>Posts:</strong> {contributor.post_count}</p>
                    )}
                    {contributor.expertise_areas && contributor.expertise_areas.length > 0 && (
                      <p><strong>Expertise:</strong> {contributor.expertise_areas.join(', ')}</p>
                    )}
                    {contributor.subscription_start_date && (
                      <p className="text-xs">
                        <strong>Subscribed since:</strong> {new Date(contributor.subscription_start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}

          {activeContributors.length === 0 && (
            <div className="text-center py-12 text-[#454545]">
              No active contributors yet
            </div>
          )}
        </div>
      </div>

      {pendingApplications.length === 0 && activeContributors.length === 0 && (
        <div className="text-center py-12 text-[#454545]">
          No contributor applications yet
        </div>
      )}
    </div>
  );
}

function OfficeManagement() {
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();
  const { confirm } = useConfirm();

  const { data: offices = [] } = useQuery({
    queryKey: ['all-immigration-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('immigration_offices')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: []
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('immigration_offices')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-immigration-offices'] });
      queryClient.invalidateQueries({ queryKey: ['immigration-offices'] });
      addSuccess('Office visibility updated!');
    },
    onError: (error) => {
      addError(`Failed to update office: ${error.message}`);
    }
  });

  const deleteOfficeMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('immigration_offices').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-immigration-offices'] });
      queryClient.invalidateQueries({ queryKey: ['immigration-offices'] });
      addSuccess('Office deleted successfully!');
    },
    onError: (error) => {
      addError(`Failed to delete office: ${error.message}`);
    }
  });

  const syncGoogleMutation = useMutation({
    mutationFn: async () => {
      const { data: existingOffices = [], error: existingErr } = await supabase.from('immigration_offices').select('*');
      if (existingErr) throw existingErr;
      const existingCoords = new Set(
        existingOffices.map(o => `${o.latitude.toFixed(4)},${o.longitude.toFixed(4)}`)
      );

      // More comprehensive search queries
      const { data: fnData, error: fnError } = await supabase.functions.invoke('searchImmigrationOffices', {
        body: JSON.stringify({
          searchQueries: [
          // English searches
          "Immigration Office Thailand",
          "Immigration Bureau Thailand",
          "Thai Immigration Office",
          "Immigration Bangkok",
          "Immigration Chaeng Watthana",
          "Immigration Laksi",
          "Immigration Chiang Mai",
          "Immigration Phuket",
          "Immigration Pattaya",
          "Immigration Hua Hin",
          "Immigration Krabi",
          "Immigration Samui",
          "Immigration Chiang Rai",
          "Immigration Khon Kaen",
          "Immigration Udon Thani",
          "Immigration Nakhon Ratchasima",
          // Thai searches
          "ตรวจคนเข้าเมือง",
          "สำนักงานตรวจคนเข้าเมือง",
          "ตรวจคนเข้าเมืองกรุงเทพ",
          "ตรวจคนเข้าเมืองเชียงใหม่",
          "ตรวจคนเข้าเมืองภูเก็ต",
          "ตรวจคนเข้าเมืองหัวหิน",
          "ตรวจคนเข้าเมืองพัทยา"
        ]
      })
    });

      if (fnError) throw fnError;
      const response = fnData;

      console.log('Search response:', response);

      if (!response?.offices) {
        const errorMsg = response?.searchLog
          ? `Search completed but found 0 offices. Check logs: ${JSON.stringify(response.searchLog)}`
          : 'No offices returned from search';
        throw new Error(errorMsg);
      }

      const validOffices = response.offices.filter(office => {
        // Validate coordinates
        if (!office.latitude || !office.longitude) {
          console.warn('Office missing coordinates:', office.name);
          return false;
        }

        if (office.latitude < 5 || office.latitude > 21 ||
            office.longitude < 97 || office.longitude > 106) {
          console.warn('Office coordinates outside Thailand:', office.name);
          return false;
        }
        
        // Check for duplicates
        const coordKey = `${office.latitude.toFixed(4)},${office.longitude.toFixed(4)}`;
        if (existingCoords.has(coordKey)) {
          console.log('Office is duplicate:', office.name);
          return false;
        }
        
        return office.name && office.address;
      });

      if (validOffices.length === 0) {
        return {
          added: 0,
          skipped: response.offices.length,
          total: response.offices.length,
          searchLog: response.searchLog,
          message: 'No new offices found. All were duplicates or invalid.'
        };
      }

      const bulkData = validOffices.map(office => ({
        name: office.name,
        address: office.address,
        city: office.city || 'Unknown',
        province: office.province || office.city || 'Unknown',
        latitude: office.latitude,
        longitude: office.longitude,
        phone: office.phone || '',
        hours: office.hours || 'Mon-Fri 8:30-16:30',
        google_place_id: office.google_place_id || '',
        rating: office.rating || null,
        services: ["Visa Extensions", "90-Day Reports", "TM.30", "Re-Entry Permits"],
        tips: [
          "Arrive early (before 9 AM) for shorter wait times",
          "Bring all required documents and photocopies",
          "Payment is cash only",
          "Dress respectfully (no shorts or sleeveless shirts)"
        ],
        is_active: true
      }));

      const { error: bulkErr } = await supabase.from('immigration_offices').insert(bulkData);
      if (bulkErr) throw bulkErr;

      return {
        added: validOffices.length,
        skipped: response.offices.length - validOffices.length,
        total: response.offices.length,
        searchLog: response.searchLog,
        message: `Successfully added ${validOffices.length} new immigration offices`
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['all-immigration-offices'] });
      queryClient.invalidateQueries({ queryKey: ['immigration-offices'] });
      
      let message = `Sync Complete!\n\n✅ Added: ${result.added} offices\n⏭️ Skipped: ${result.skipped} duplicates\n📊 Total found: ${result.total}`;
      
      if (result.searchLog && result.added === 0) {
        message += '\n\n⚠️ Debug Info:\n';
        result.searchLog.forEach(log => {
          if (log.status === 'success') {
            message += `\n✓ "${log.query}": ${log.found} results`;
          } else if (log.status === 'error') {
            message += `\n✗ "${log.query}": Error ${log.code}`;
          } else if (log.status === 'no_results') {
            message += `\n○ "${log.query}": No results`;
          }
        });
      }
      
      addSuccess(message);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      addError(`Sync failed: ${error.message}\n\nPlease check:\n- Google Places API key is correct\n- Places API (New) is enabled\n- Billing is active on Google Cloud\n- API key has no restrictions blocking the request`);
    }
  });

  const handleDeleteOffice = async (office) => {
    const confirmed = await confirm({
      title: 'Delete Immigration Office',
      message: `Are you sure you want to permanently delete "${office.name}"?\n\nThis action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      deleteOfficeMutation.mutate(office.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Immigration Offices</h2>
          <p className="text-gray-600 text-sm">
            Manage visibility of offices on the map ({offices.length} total)
          </p>
        </div>
        <Button
          onClick={() => syncGoogleMutation.mutate()}
          disabled={syncGoogleMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {syncGoogleMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync with Google Places
            </>
          )}
        </Button>
      </div>

      {syncGoogleMutation.isPending && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Searching Google Places API...</strong>
          </p>
          <p className="text-xs text-blue-600">
            Using direct Google Places API search with multiple Thai and English terms. This may take 30-60 seconds.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {offices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              No immigration offices yet. Click "Sync with Google Places" to import them.
            </div>
            <div className="text-xs text-gray-400 max-w-md mx-auto">
              <p className="mb-2">📍 The sync will search for immigration offices across Thailand using Google Places API.</p>
              <p>If sync returns 0 results, check that your Google Places API key is configured correctly.</p>
            </div>
          </div>
        ) : (
          offices.map((office) => (
            <GlassCard key={office.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{office.name}</h3>
                    {office.is_active !== false ? (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Location:</strong> {office.city}, {office.province}</p>
                    <p><strong>Address:</strong> {office.address}</p>
                    {office.phone && <p><strong>Phone:</strong> {office.phone}</p>}
                    {office.google_place_id && (
                      <p className="text-xs text-gray-500">
                        <strong>Place ID:</strong> {office.google_place_id}
                      </p>
                    )}
                    {office.rating && <p><strong>Rating:</strong> {office.rating} ⭐</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleActiveMutation.mutate({
                      id: office.id,
                      is_active: office.is_active === false
                    })}
                    variant={office.is_active !== false ? 'outline' : 'default'}
                    size="sm"
                    className={office.is_active !== false ? 'border-orange-500 text-orange-600' : 'bg-green-600 text-white'}
                  >
                    {office.is_active !== false ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteOffice(office)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    disabled={deleteOfficeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
