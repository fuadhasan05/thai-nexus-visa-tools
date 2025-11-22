import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bug, Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  AlertTriangle, Clock, Filter
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// removed getStaticProps stub so admin page renders at runtime
export default function AdminBugs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  
  const { addError, addSuccess } = useError();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Fetch all bugs
  const { data: bugs = [] } = useQuery({
    queryKey: ['all-bugs'],
    queryFn: () => base44.entities.Bug.list('-created_date')
  });

  // Filter bugs
  const filteredBugs = bugs.filter(bug => {
    const matchesSearch = 
      bug.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.affected_page?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bug.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || bug.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Create bug mutation
  const createBugMutation = useMutation({
    mutationFn: (data) => base44.entities.Bug.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-bugs'] });
      addSuccess('Bug created successfully');
      setShowDialog(false);
      setEditingBug(null);
    },
    onError: (error) => {
      addError('Failed to create bug: ' + error.message);
    }
  });

  // Update bug mutation
  const updateBugMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bug.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-bugs'] });
      addSuccess('Bug updated successfully');
      setShowDialog(false);
      setEditingBug(null);
    },
    onError: (error) => {
      addError('Failed to update bug: ' + error.message);
    }
  });

  // Delete bug mutation
  const deleteBugMutation = useMutation({
    mutationFn: (id) => base44.entities.Bug.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-bugs'] });
      addSuccess('Bug deleted successfully');
    },
    onError: (error) => {
      addError('Failed to delete bug: ' + error.message);
    }
  });

  const handleEdit = (bug) => {
    setEditingBug(bug);
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingBug(null);
    setShowDialog(true);
  };

  const handleDelete = async (bug) => {
    const confirmed = await confirm({
      title: 'Delete Bug',
      message: `Are you sure you want to delete "${bug.title}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      deleteBugMutation.mutate(bug.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      steps_to_reproduce: formData.get('steps_to_reproduce'),
      expected_behavior: formData.get('expected_behavior'),
      actual_behavior: formData.get('actual_behavior'),
      severity: formData.get('severity'),
      status: formData.get('status'),
      affected_page: formData.get('affected_page'),
      error_message: formData.get('error_message'),
      suggested_fix: formData.get('suggested_fix'),
      browser: formData.get('browser'),
      device: formData.get('device')
    };

    if (editingBug) {
      updateBugMutation.mutate({ id: editingBug.id, data });
    } else {
      createBugMutation.mutate(data);
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[severity]}`}>{severity}</span>;
  };

  const getStatusBadge = (status) => {
    const colors = {
      new: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      fixed: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      wont_fix: 'bg-red-100 text-red-700'
    };
    const icons = {
      new: Clock,
      confirmed: AlertTriangle,
      in_progress: Clock,
      fixed: CheckCircle,
      closed: CheckCircle,
      wont_fix: XCircle
    };
    const Icon = icons[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${colors[status]}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const stats = {
    total: bugs.length,
    new: bugs.filter(b => b.status === 'new').length,
    confirmed: bugs.filter(b => b.status === 'confirmed').length,
    in_progress: bugs.filter(b => b.status === 'in_progress').length,
    fixed: bugs.filter(b => b.status === 'fixed').length,
    critical: bugs.filter(b => b.severity === 'critical').length,
    high: bugs.filter(b => b.severity === 'high').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bug Tracker</h1>
            <p className="text-gray-600">Track and manage all bugs and issues</p>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Report Bug
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">{stats.new}</div>
            <div className="text-xs text-purple-600">New</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{stats.confirmed}</div>
            <div className="text-xs text-blue-600">Confirmed</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-900">{stats.in_progress}</div>
            <div className="text-xs text-yellow-600">In Progress</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-900">{stats.fixed}</div>
            <div className="text-xs text-green-600">Fixed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-900">{stats.high}</div>
            <div className="text-xs text-orange-600">High</div>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search bugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="wont_fix">Won't Fix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Bugs List */}
      <div className="space-y-3">
        {filteredBugs.map(bug => (
          <GlassCard key={bug.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{bug.title}</h3>
                  {getSeverityBadge(bug.severity)}
                  {getStatusBadge(bug.status)}
                </div>

                <p className="text-gray-700 mb-3">{bug.description}</p>

                <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                  {bug.affected_page && (
                    <div>
                      <span className="text-gray-500">Affected Page:</span>
                      <span className="ml-2 text-gray-900 font-medium">{bug.affected_page}</span>
                    </div>
                  )}
                  {bug.browser && (
                    <div>
                      <span className="text-gray-500">Browser:</span>
                      <span className="ml-2 text-gray-900">{bug.browser}</span>
                    </div>
                  )}
                  {bug.device && (
                    <div>
                      <span className="text-gray-500">Device:</span>
                      <span className="ml-2 text-gray-900">{bug.device}</span>
                    </div>
                  )}
                  {bug.reported_by && (
                    <div>
                      <span className="text-gray-500">Reported by:</span>
                      <span className="ml-2 text-gray-900">{bug.reported_by}</span>
                    </div>
                  )}
                </div>

                {bug.error_message && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-mono text-red-700">{bug.error_message}</p>
                  </div>
                )}

                {bug.suggested_fix && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-gray-700 font-semibold mb-1">Suggested Fix:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{bug.suggested_fix}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created {new Date(bug.created_date).toLocaleDateString()} at {new Date(bug.created_date).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button onClick={() => handleEdit(bug)} variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleDelete(bug)} variant="outline" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredBugs.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bugs found matching your filters</p>
          </GlassCard>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBug ? 'Edit Bug' : 'Report New Bug'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Bug Title</Label>
              <Input
                name="title"
                defaultValue={editingBug?.title || ''}
                required
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                rows={3}
                defaultValue={editingBug?.description || ''}
                required
                placeholder="Detailed description of the bug"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Severity</Label>
                <Select name="severity" defaultValue={editingBug?.severity || 'medium'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingBug?.status || 'new'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="wont_fix">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Affected Page</Label>
              <Input
                name="affected_page"
                defaultValue={editingBug?.affected_page || ''}
                placeholder="e.g., /admin/bugs, Home page"
              />
            </div>

            <div>
              <Label>Steps to Reproduce</Label>
              <Textarea
                name="steps_to_reproduce"
                rows={3}
                defaultValue={editingBug?.steps_to_reproduce || ''}
                placeholder="1. Go to...\n2. Click on...\n3. See error..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Expected Behavior</Label>
                <Textarea
                  name="expected_behavior"
                  rows={2}
                  defaultValue={editingBug?.expected_behavior || ''}
                  placeholder="What should happen"
                />
              </div>

              <div>
                <Label>Actual Behavior</Label>
                <Textarea
                  name="actual_behavior"
                  rows={2}
                  defaultValue={editingBug?.actual_behavior || ''}
                  placeholder="What actually happens"
                />
              </div>
            </div>

            <div>
              <Label>Error Message (if any)</Label>
              <Textarea
                name="error_message"
                rows={2}
                defaultValue={editingBug?.error_message || ''}
                placeholder="Copy and paste any error messages"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <Label>Suggested Fix</Label>
              <Textarea
                name="suggested_fix"
                rows={3}
                defaultValue={editingBug?.suggested_fix || ''}
                placeholder="How to fix this issue (optional)"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Browser</Label>
                <Input
                  name="browser"
                  defaultValue={editingBug?.browser || ''}
                  placeholder="e.g., Chrome 120, Firefox 121"
                />
              </div>

              <div>
                <Label>Device</Label>
                <Input
                  name="device"
                  defaultValue={editingBug?.device || ''}
                  placeholder="e.g., Desktop, iPhone 15, Samsung Galaxy"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createBugMutation.isPending || updateBugMutation.isPending} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {(createBugMutation.isPending || updateBugMutation.isPending) ? 'Saving...' : (editingBug ? 'Update Bug' : 'Create Bug')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}