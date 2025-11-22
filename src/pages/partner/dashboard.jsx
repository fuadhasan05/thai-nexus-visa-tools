import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus, DollarSign, Users, CheckCircle2, Clock, Edit } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
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

export default function PartnerDashboard() {
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) return null;
      const user = userData?.user;
      if (!user) return null;
      return { id: user.id, email: user.email, role: user.user_metadata?.role };
    }
  });

  const { data: partner } = useQuery({
    queryKey: ['my-partner-profile'],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data: partners, error } = await supabase.from('business_partners').select('*').eq('contact_email', user.email).limit(1);
      if (error) throw error;
      return (partners && partners[0]) || null;
    },
    enabled: !!user
  });

  const { data: services = [] } = useQuery({
    queryKey: ['my-services'],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase.from('partner_services').select('*').eq('partner_id', partner.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partner
  });

  const { data: myLeads = [] } = useQuery({
    queryKey: ['my-leads'],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase.from('lead_requests').select('*').eq('partner_id', partner.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partner
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('partner_services').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setShowServiceDialog(false);
      setEditingService(null);
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('partner_services').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setShowServiceDialog(false);
      setEditingService(null);
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('lead_requests').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
    }
  });

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      partner_id: partner.id,
      visa_type: formData.get('visa_type'),
      service_name: formData.get('service_name'),
      price_min_thb: parseFloat(formData.get('price_min_thb')),
      price_max_thb: parseFloat(formData.get('price_max_thb')),
      processing_time: formData.get('processing_time'),
      success_rate: parseFloat(formData.get('success_rate')),
      description: formData.get('description'),
      is_active: true
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  if (!partner) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Partner Access Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be registered as a partner to access this dashboard.
          </p>
          <Button onClick={() => window.location.href = createPageUrl('PartnerWithUs')}>
            Apply to Become a Partner
          </Button>
        </GlassCard>
      </div>
    );
  }

  const stats = {
    totalLeads: myLeads.length,
    activeLeads: myLeads.filter(l => l.status === 'in_progress').length,
    completedLeads: myLeads.filter(l => l.status === 'completed').length,
    totalServices: services.length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <GlassCard className="p-8" hover={false}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{partner.business_name}</h1>
            <p className="text-gray-600">Partner Dashboard</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${
            partner.status === 'active' ? 'bg-green-100 text-green-700' :
            partner.status === 'approved' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            <span className="font-medium text-sm">{partner.status}</span>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLeads}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeLeads}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedLeads}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalServices}</div>
              <div className="text-sm text-gray-600">Services Listed</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">My Services</TabsTrigger>
          <TabsTrigger value="leads">Client Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingService(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Visa Type</Label>
                      <Input name="visa_type" defaultValue={editingService?.visa_type} required />
                    </div>
                    <div>
                      <Label>Service Name</Label>
                      <Input name="service_name" defaultValue={editingService?.service_name} required />
                    </div>
                    <div>
                      <Label>Min Price (THB)</Label>
                      <Input type="number" name="price_min_thb" defaultValue={editingService?.price_min_thb} required />
                    </div>
                    <div>
                      <Label>Max Price (THB)</Label>
                      <Input type="number" name="price_max_thb" defaultValue={editingService?.price_max_thb} required />
                    </div>
                    <div>
                      <Label>Processing Time</Label>
                      <Input name="processing_time" defaultValue={editingService?.processing_time} placeholder="e.g., 3-5 days" />
                    </div>
                    <div>
                      <Label>Success Rate (%)</Label>
                      <Input type="number" name="success_rate" defaultValue={editingService?.success_rate} placeholder="e.g., 98" />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea name="description" defaultValue={editingService?.description} rows={4} />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {services.map((service) => (
              <GlassCard key={service.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.service_name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Visa Type:</strong> {service.visa_type}</p>
                      <p><strong>Price Range:</strong> ฿{service.price_min_thb?.toLocaleString()} - ฿{service.price_max_thb?.toLocaleString()}</p>
                      {service.processing_time && <p><strong>Processing Time:</strong> {service.processing_time}</p>}
                      {service.success_rate && <p><strong>Success Rate:</strong> {service.success_rate}%</p>}
                    </div>
                    {service.description && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{service.description}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setEditingService(service);
                      setShowServiceDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            ))}
            {services.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No services listed yet. Click "Add Service" to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid gap-6">
            {myLeads.map((lead) => (
              <GlassCard key={lead.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{lead.user_name || 'New Request'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        lead.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Visa Type:</strong> {lead.visa_type}</p>
                      <p><strong>Email:</strong> {lead.user_email}</p>
                      {lead.user_phone && <p><strong>Phone:</strong> {lead.user_phone}</p>}
                      <p><strong>Received:</strong> {new Date(lead.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status !== 'completed' && (
                      <Button
                        onClick={() => updateLeadMutation.mutate({
                          id: lead.id,
                          data: { status: 'completed', completed_date: new Date().toISOString() }
                        })}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>

                {lead.message && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-2"><strong>Client Message:</strong></p>
                    <p className="text-sm text-gray-700">{lead.message}</p>
                  </div>
                )}

                {lead.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600"><strong>Internal Notes:</strong> {lead.notes}</p>
                  </div>
                )}
              </GlassCard>
            ))}
            {myLeads.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No client requests yet. When clients request your services, they'll appear here.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}