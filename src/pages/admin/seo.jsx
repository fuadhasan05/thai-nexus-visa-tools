
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Edit, Save, X, Plus, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';

const SITE_DOMAIN = 'https://visa.thainexus.co.th';

const DEFAULT_PAGES = [
  // Public Pages
  { name: 'Home', label: 'Homepage', url: '', category: 'public' },
  { name: 'VisaNavigator', label: 'Thailand Visa Navigator', url: 'visanavigator', category: 'public' },
  { name: 'EligibilityCalculator', label: 'Eligibility Calculator', url: 'eligibilitycalculator', category: 'public' },
  { name: 'DocumentValidator', label: 'Document Checklist', url: 'documentvalidator', category: 'public' },
  { name: 'AdminManager', label: '90-Day Report Tracker', url: 'adminmanager', category: 'public' },
  { name: 'ImmigrationMap', label: 'Immigration Office Locator', url: 'immigrationmap', category: 'public' },
  { name: 'ImmigrationSimulator', label: 'Immigration Visit Simulator', url: 'immigrationsimulator', category: 'public' },
  { name: 'PathwayPlanner', label: 'Long Stay Visa Planner', url: 'pathwayplanner', category: 'public' },
  { name: 'AgentComparison', label: 'Visa Cost Comparison', url: 'agentcomparison', category: 'public' },
  { name: 'PacketBuilder', label: 'Visa Application Builder', url: 'packetbuilder', category: 'public' },
  { name: 'CurrencyConverter', label: 'THB Currency Converter', url: 'currencyconverter', category: 'public' },
  { name: 'PartnerWithUs', label: 'Partner With Us', url: 'partnerwithus', category: 'public' },
  { name: 'Contact', label: 'Contact Us', url: 'contact', category: 'public' },
  { name: 'KnowledgeHub', label: 'Knowledge Hub', url: 'knowledgehub', category: 'public' },
  { name: 'BecomeContributor', label: 'Become Contributor', url: 'becomecontributor', category: 'public' },
  { name: 'TermsOfService', label: 'Terms of Service', url: 'termsofservice', category: 'public' },
  { name: 'PrivacyPolicy', label: 'Privacy Policy', url: 'privacypolicy', category: 'public' },
  
  // Admin Pages (always no-index)
  { name: 'AdminSEO', label: 'SEO Manager (Admin)', url: 'adminseo', category: 'admin' },
  { name: 'AdminUsers', label: 'User Management (Admin)', url: 'adminusers', category: 'admin' },
  { name: 'AdminKnowledge', label: 'Knowledge Moderation (Admin)', url: 'adminknowledge', category: 'admin' },
  { name: 'AdminKnowledgeEdit', label: 'Knowledge Editor (Admin)', url: 'adminknowledgeedit', category: 'admin' },
  { name: 'AdminPartners', label: 'Partner Management (Admin)', url: 'adminpartners', category: 'admin' },
  { name: 'AdminTranslations', label: 'Translation Manager (Admin)', url: 'admintranslations', category: 'admin' },
  { name: 'AdminContent', label: 'Bulk Translator (Admin)', url: 'admincontent', category: 'admin' },
  { name: 'AdminPricing', label: 'Pricing Manager (Admin)', url: 'adminpricing', category: 'admin' },
  { name: 'AdminBugs', label: 'Bug Tracker (Admin)', url: 'adminbugs', category: 'admin' },
  
  // Private Pages (user-specific, no-index)
  { name: 'Profile', label: 'User Profile', url: 'profile', category: 'private' },
  { name: 'Settings', label: 'User Settings', url: 'settings', category: 'private' },
  { name: 'PartnerDashboard', label: 'Partner Dashboard', url: 'partnerdashboard', category: 'private' }
];

export const getStaticProps = async () => {
  return {
    notFound: true,
  };
};
export default function AdminSEO() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPage, setEditingPage] = useState(null); // Stores page_name if editing an existing default page
  const [formData, setFormData] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showForm, setShowForm] = useState(false); // Controls visibility of the SEO editing/adding form
  const { addError, addSuccess } = useError();
  const queryClient = useQueryClient();

  const { data: seoConfigs = [], isLoading } = useQuery({
    queryKey: ['seo-metadata'],
    queryFn: () => base44.entities.SEOMetadata.list(),
  });

  // Fetch actual approved knowledge posts for accurate counts.
  // Assuming these posts also contribute to the sitemap and can be indexed.
  const { data: knowledgePosts = [] } = useQuery({
    queryKey: ['seo-knowledge-posts-count'],
    queryFn: () => base44.entities.KnowledgePost.filter({ status: 'approved' }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.SEOMetadata.update(data.id, data);
      } else {
        return base44.entities.SEOMetadata.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
      addSuccess('SEO metadata saved successfully');
      setEditingPage(null);
      setFormData(null);
      setShowForm(false); // Close form after saving
    },
    onError: (error) => {
      addError('Failed to save SEO metadata: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.SEOMetadata.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
      addSuccess('SEO record deleted successfully');
    },
    onError: (error) => {
      addError('Failed to delete: ' + error.message);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      return base44.entities.SEOMetadata.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
      addSuccess('SEO record updated successfully');
    },
    onError: (error) => {
      addError('Failed to update: ' + error.message);
    }
  });

  const handleEdit = (pageName) => {
    const existing = seoConfigs.find(s => s.page_name === pageName);
    const pageInfo = DEFAULT_PAGES.find(p => p.name === pageName);
    
    // Check if this is an admin or private page
    const isAdminPage = pageInfo?.category === 'admin';
    const isPrivatePage = pageInfo?.category === 'private';
    const shouldBeNoIndex = isAdminPage || isPrivatePage;
    
    if (existing) {
      setFormData(existing);
    } else {
      // Create new with defaults
      setFormData({
        page_name: pageName,
        seo_url: pageInfo?.url || '',
        meta_title: pageInfo?.label || pageName,
        meta_description: '',
        meta_keywords: '',
        og_image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png',
        canonical_url: `${SITE_DOMAIN}/${pageInfo?.url || ''}`,
        no_index: shouldBeNoIndex,
        no_follow: shouldBeNoIndex,
        schema_type: 'WebPage',
        priority: shouldBeNoIndex ? 0.0 : 0.8,
        changefreq: 'weekly',
        is_active: true,
        breadcrumbs: []
      });
    }
    setEditingPage(pageName);
    setShowForm(true);
  };

  const handleAIGenerate = async () => {
    if (!formData?.page_name && !editingPage && !formData?.meta_title) {
      addError('Please provide a "Page Name" or "Meta Title" first for AI generation.');
      return;
    }

    setGeneratingAI(true);
    try {
      let pageContextName = '';
      let pageLabel = '';

      if (editingPage) {
        const pageInfo = DEFAULT_PAGES.find(p => p.name === editingPage);
        pageLabel = pageInfo?.label || editingPage;
        pageContextName = pageInfo?.label || editingPage;
      } else {
        pageContextName = formData.page_name || formData.meta_title || 'a new webpage';
        pageLabel = formData.meta_title || formData.page_name || 'a new webpage';
      }

      const prompt = `Generate SEO metadata for a webpage about "${pageLabel}".

Page Context: This is a tool on Thai Nexus (visa.thainexus.co.th), a Thailand visa information and tools website for expats. The page helps users with ${pageContextName.toLowerCase()}.

Requirements:
1. Meta Title: 50-60 characters, include "Thailand" and main keywords, format: "Primary Keyword | Secondary Keyword | Thai Nexus"
2. Meta Description: 150-160 characters, compelling, action-oriented, include call-to-action
3. Meta Keywords: comma-separated, 8-10 relevant keywords focused on Thailand visa topics

Generate professional, SEO-optimized content that ranks well on Google for Thailand visa-related searches.`;

      const response = await base44.functions.invoke('invokeOpenAI', {
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            meta_keywords: { type: "string" }
          },
          required: ["meta_title", "meta_description", "meta_keywords"]
        }
      });

      if (response.data) {
        setFormData({
          ...formData,
          meta_title: response.data.meta_title || '',
          meta_description: response.data.meta_description || '',
          meta_keywords: response.data.meta_keywords || ''
        });
        addSuccess('AI-generated SEO metadata successfully!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      addError('AI generation failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = () => {
    if (!formData.page_name && !editingPage) { // if adding a new page, page_name is mandatory
      addError('Page Name is required for new SEO entries.');
      return;
    }
    if (!formData.meta_title || !formData.meta_description) {
      addError('Title and description are required');
      return;
    }
    
    if (formData.meta_title.length > 70) {
      addError('Title should be under 70 characters for optimal SEO');
      return;
    }
    
    if (formData.meta_description.length > 160) {
      addError('Description should be under 160 characters for optimal SEO');
      return;
    }

    saveMutation.mutate({
      ...formData,
      last_modified: new Date().toISOString()
    });
  };

  const handleDelete = async (config) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the SEO config for "${config.page_name}"?\n\nThis will make the page use hardcoded defaults instead.`
    );

    if (confirmed) {
      deleteMutation.mutate(config.id);
    }
  };

  const handleToggleActive = async (config) => {
    toggleActiveMutation.mutate({
      id: config.id,
      is_active: !config.is_active
    });
  };

  const filteredPages = DEFAULT_PAGES.filter(page =>
    page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSEOScore = (config) => {
    let score = 0;
    let issues = [];

    if (config?.meta_title) {
      if (config.meta_title.length >= 50 && config.meta_title.length <= 60) score += 25;
      else issues.push('Title length not optimal (50-60 chars)');
    } else {
      issues.push('Missing title');
    }

    if (config?.meta_description) {
      if (config.meta_description.length >= 150 && config.meta_description.length <= 160) score += 25;
      else issues.push('Description length not optimal (150-160 chars)');
    } else {
      issues.push('Missing description');
    }

    if (config?.meta_keywords) score += 15;
    else issues.push('Missing keywords');

    if (config?.og_image) score += 15;
    else issues.push('Missing OG image');

    if (config?.canonical_url) score += 10;
    else issues.push('Missing canonical URL');

    if (config?.breadcrumbs && config.breadcrumbs.length > 0) score += 10;
    else issues.push('Missing breadcrumbs');

    return { score, issues };
  };

  // Calculate accurate SEO performance metrics
  const seoMetrics = React.useMemo(() => {
    // 1. Identify all public/uncategorized pages from DEFAULT_PAGES
    const publicDefaultPages = DEFAULT_PAGES.filter(p =>
      p.category === 'public' || !p.category // Assuming uncategorized pages are public
    );

    let totalInSitemap = publicDefaultPages.length + knowledgePosts.length;
    let totalIndexed = knowledgePosts.length; // Start with knowledge posts, assuming they are indexed by default
    let highPriorityCount = knowledgePosts.length; // Start with knowledge posts, assuming priority 0.8 by default

    let optimizedConfigCount = 0; // Only applies to actual SEO configurations

    publicDefaultPages.forEach(page => {
      const config = seoConfigs.find(s => s.page_name === page.name);

      if (config && config.is_active) {
        // Page has an active SEO configuration
        if (!config.no_index) {
          totalIndexed++;
        }
        if (config.priority >= 0.8) {
          highPriorityCount++;
        }
        const { score } = getSEOScore(config);
        if (score >= 80) {
          optimizedConfigCount++;
        }
      } else if (!config) {
        // Page does NOT have a specific SEO configuration, use implied defaults for public pages
        totalIndexed++; // Assumed indexed if no explicit config blocks it
        highPriorityCount++; // Assumed 0.8 priority for unconfigured public pages
      }
      // If config exists but is_active is false, or it's no_index, it won't be counted towards indexed/high priority
    });

    const highPriorityPercent = Math.round((highPriorityCount / Math.max(totalInSitemap, 1)) * 100);

    return {
      totalInSitemap,
      totalIndexed,
      highPriorityPercent,
      optimizedCount: optimizedConfigCount // Fix: Use the correctly named variable optimizedConfigCount
    };
  }, [seoConfigs, knowledgePosts]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <GlassCard className="p-8" hover={false}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Manager</h1>
        <p className="text-gray-600">Manage meta titles, descriptions, and structured data for all pages</p>
        
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 mb-2">CRITICAL: How Base44 URLs Work</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>❌ <strong>SEO Manager CANNOT change actual page URLs</strong></li>
                <li>✅ URLs are <strong>auto-generated from page file names</strong></li>
                <li>📁 <code className="bg-gray-100 px-2 py-1 rounded">pages/TermsOfService.js</code> → <code className="bg-gray-100 px-2 py-1 rounded">/termsofservice</code></li>
                <li>📁 <code className="bg-gray-100 px-2 py-1 rounded">pages/VisaNavigator.js</code> → <code className="bg-gray-100 px-2 py-1 rounded">/visanavigator</code></li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                <strong>What SEO Manager DOES control:</strong> Meta titles, descriptions, canonical URLs (for SEO), Open Graph tags, structured data
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* SEO Performance Dashboard */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Performance</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {seoMetrics.totalInSitemap}
            </div>
            <div className="text-sm text-gray-600">Total Pages in Sitemap</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {seoMetrics.totalIndexed}
            </div>
            <div className="text-sm text-gray-600">Indexed Pages</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {seoMetrics.highPriorityPercent}%
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">
              {seoMetrics.optimizedCount}
            </div>
            <div className="text-sm text-gray-600">Optimized (80%+)</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <a href={`${SITE_DOMAIN}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                View Sitemap
              </Button>
            </a>
            <a href={`${SITE_DOMAIN}/robots.txt`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                View Robots.txt
              </Button>
            </a>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Google Search Console
              </Button>
            </a>
            <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Bing Webmaster Tools
              </Button>
            </a>
          </div>
        </div>
      </GlassCard>

      {!editingPage && !showForm ? ( // Display search and list of pages when not editing/adding
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Pages</h2>
            <Button
              onClick={() => {
                setEditingPage(null); // Ensure no existing page is selected
                setFormData({
                  page_name: '', // Empty for new page, user will fill
                  seo_url: '', // Empty for new page, user will fill or derive from page_name
                  meta_title: '',
                  meta_description: '',
                  meta_keywords: '',
                  og_image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png', // Default OG image
                  canonical_url: `${SITE_DOMAIN}/`, // Base URL, user can modify
                  no_index: false,
                  no_follow: false,
                  schema_type: 'WebPage',
                  priority: 0.8,
                  changefreq: 'weekly',
                  is_active: true,
                  breadcrumbs: []
                });
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Page SEO
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Group pages by category */}
          <div className="space-y-6">
            {/* Public Pages */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Public Pages (Indexed by Search Engines)
              </h3>
              <div className="space-y-3">
                {filteredPages.filter(p => p.category === 'public' || !p.category).map((page) => {
                  const config = seoConfigs.find(s => s.page_name === page.name);
                  const { score, issues } = getSEOScore(config);
                  
                  return (
                    <div key={page.name} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{page.label}</h3>
                            <span className="text-xs text-gray-500">({page.name})</span>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              score >= 80 ? 'bg-green-100 text-green-700' :
                              score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              SEO Score: {score}%
                            </div>
                            {config && !config.is_active && (
                              <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                                DISABLED
                              </span>
                            )}
                          </div>
                          
                          {config ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-600 font-medium min-w-[100px]">Title:</span>
                                <span className="text-gray-900">{config.meta_title}</span>
                                <span className={`text-xs ${config.meta_title.length >= 50 && config.meta_title.length <= 60 ? 'text-green-600' : 'text-orange-600'}`}>
                                  ({config.meta_title.length} chars)
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-gray-600 font-medium min-w-[100px]">Description:</span>
                                <span className="text-gray-700 line-clamp-2">{config.meta_description}</span>
                                <span className={`text-xs ${config.meta_description.length >= 150 && config.meta_description.length <= 160 ? 'text-green-600' : 'text-orange-600'}`}>
                                  ({config.meta_description.length} chars)
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-gray-600 font-medium min-w-[100px]">URL:</span>
                                <span className="text-blue-600">{SITE_DOMAIN}/{config.seo_url}</span>
                              </div>
                              {issues.length > 0 && (
                                <div className="flex items-start gap-2 mt-2">
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                  <span className="text-xs text-orange-600">{issues.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>No SEO configuration - Using defaults</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {config && (
                            <>
                              <Button
                                onClick={() => handleToggleActive(config)}
                                variant="outline"
                                size="sm"
                                className={config.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                              >
                                {config.is_active ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                onClick={() => handleDelete(config)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </>
                          )}
                          <Button
                            onClick={() => handleEdit(page.name)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {config ? 'Edit' : 'Configure'} SEO
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Pages */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Admin Pages (Never Indexed - Blocked from Search Engines)
              </h3>
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                These pages are automatically excluded from sitemap and robots.txt, with no_index meta tags.
              </div>
              <div className="space-y-3">
                {filteredPages.filter(p => p.category === 'admin').map((page) => {
                  const config = seoConfigs.find(s => s.page_name === page.name);
                  
                  return (
                    <div key={page.name} className="border border-red-200 bg-red-50 rounded-xl p-4 hover:bg-red-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{page.label}</h3>
                            <span className="px-2 py-1 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                              ADMIN ONLY
                            </span>
                          </div>
                          
                          {config ? (
                            <div className="text-sm text-gray-700">
                              Configured • no_index: {config.no_index ? 'YES' : 'NO'} • no_follow: {config.no_follow ? 'YES' : 'NO'}
                            </div>
                          ) : (
                            <div className="text-sm text-red-700">
                              Not configured (using secure defaults)
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleEdit(page.name)}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Private Pages */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Private Pages (User-Specific - Not Indexed)
              </h3>
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                User profile and settings pages are private and automatically excluded from indexing.
              </div>
              <div className="space-y-3">
                {filteredPages.filter(p => p.category === 'private').map((page) => {
                  const config = seoConfigs.find(s => s.page_name === page.name);
                  
                  return (
                    <div key={page.name} className="border border-orange-200 bg-orange-50 rounded-xl p-4 hover:bg-orange-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{page.label}</h3>
                            <span className="px-2 py-1 rounded-full bg-orange-200 text-orange-800 text-xs font-bold">
                              PRIVATE
                            </span>
                          </div>
                          
                          {config ? (
                            <div className="text-sm text-gray-700">
                              Configured • no_index: {config.no_index ? 'YES' : 'NO'}
                            </div>
                          ) : (
                            <div className="text-sm text-orange-700">
                              Not configured (using secure defaults)
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleEdit(page.name)}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingPage ? `Edit SEO: ${DEFAULT_PAGES.find(p => p.name === editingPage)?.label || editingPage}` : 'Add New Page SEO'}
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAIGenerate} 
                disabled={generatingAI}
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                {generatingAI ? (
                  <><AlertCircle className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" />AI Generate</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => { setEditingPage(null); setFormData(null); setShowForm(false); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Page Name (only for new entries) */}
            {editingPage === null && (
              <div>
                <Label className="text-gray-900 font-medium mb-2">Page Name (unique identifier) *</Label>
                <Input
                  value={formData?.page_name || ''}
                  onChange={(e) => {
                    const newPageName = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      page_name: newPageName,
                      // Automatically generate seo_url if it's empty and page_name is provided
                      seo_url: prev.seo_url || newPageName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-/, '').replace(/-$/, '')
                    }));
                  }}
                  placeholder="e.g., BlogArticle1, AboutUs"
                />
                <p className="text-xs text-gray-500 mt-1">This internal name identifies the page for SEO. Must be unique across all SEO entries.</p>
              </div>
            )}

            {/* Page Title */}
            <div>
              <Label className="text-gray-900 font-medium mb-2 flex items-center justify-between">
                <span>Meta Title *</span>
                <span className={`text-sm ${formData?.meta_title?.length >= 50 && formData?.meta_title?.length <= 60 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formData?.meta_title?.length || 0}/60
                </span>
              </Label>
              <Input
                value={formData?.meta_title || ''}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Thailand Visa Tools - Free Navigator & Calculator"
                maxLength={70}
              />
              <p className="text-xs text-gray-500 mt-1">Optimal: 50-60 characters. This appears in Google search results.</p>
            </div>

            {/* Meta Description */}
            <div>
              <Label className="text-gray-900 font-medium mb-2 flex items-center justify-between">
                <span>Meta Description *</span>
                <span className={`text-sm ${formData?.meta_description?.length >= 150 && formData?.meta_description?.length <= 160 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formData?.meta_description?.length || 0}/160
                </span>
              </Label>
              <Textarea
                value={formData?.meta_description || ''}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Complete Thailand visa toolkit: free eligibility calculator, document validator, 90-day tracker. Professional assistance available."
                rows={3}
                maxLength={170}
              />
              <p className="text-xs text-gray-500 mt-1">Optimal: 150-160 characters. Summarize the page content compellingly.</p>
            </div>

            {/* Keywords */}
            <div>
              <Label className="text-gray-900 font-medium mb-2">Meta Keywords</Label>
              <Input
                value={formData?.meta_keywords || ''}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="Thailand visa, retirement visa Thailand, DTV visa, visa calculator"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated keywords. Focus on long-tail keywords.</p>
            </div>

            {/* SEO URL */}
            <div>
              <Label className="text-gray-900 font-medium mb-2">SEO-Friendly URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{SITE_DOMAIN}/</span>
                <Input
                  value={formData?.seo_url || ''}
                  onChange={(e) => setFormData({ ...formData, seo_url: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-/, '').replace(/-$/, '') })}
                  placeholder="thailand-visa-navigator"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Use hyphens, lowercase only. E.g., "thailand-visa-calculator"</p>
            </div>

            {/* Canonical URL */}
            <div>
              <Label className="text-gray-900 font-medium mb-2">Canonical URL</Label>
              <Input
                value={formData?.canonical_url || ''}
                onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                placeholder={`${SITE_DOMAIN}/thailand-visa-navigator`}
              />
              <p className="text-xs text-gray-500 mt-1">Full URL for avoiding duplicate content issues.</p>
            </div>

            {/* Open Graph */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">Open Graph (Social Media)</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900 font-medium mb-2">OG Title (optional)</Label>
                  <Input
                    value={formData?.og_title || ''}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                    placeholder="Leave empty to use Meta Title"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 font-medium mb-2">OG Description (optional)</Label>
                  <Textarea
                    value={formData?.og_description || ''}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    placeholder="Leave empty to use Meta Description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-gray-900 font-medium mb-2">OG Image URL</Label>
                  <Input
                    value={formData?.og_image || ''}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">1200x630px recommended. Shows when shared on social media.</p>
                </div>
              </div>
            </div>

            {/* Sitemap Settings */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">Sitemap & Indexing</h3>
              
              {(DEFAULT_PAGES.find(p => p.name === editingPage)?.category === 'admin' || (editingPage === null && formData?.page_name && DEFAULT_PAGES.find(p => p.name === formData.page_name)?.category === 'admin')) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900">Admin Page Detected</p>
                      <p className="text-sm text-red-700 mt-1">
                        This appears to be an admin page. It's automatically configured to:
                      </p>
                      <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                        <li>Not be indexed by search engines (no_index = true)</li>
                        <li>Not pass link juice (no_follow = true)</li>
                        <li>Excluded from sitemap.xml</li>
                        <li>Blocked in robots.txt</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {(DEFAULT_PAGES.find(p => p.name === editingPage)?.category === 'private' || (editingPage === null && formData?.page_name && DEFAULT_PAGES.find(p => p.name === formData.page_name)?.category === 'private')) && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-orange-900">Private Page Detected</p>
                      <p className="text-sm text-orange-700 mt-1">
                        This appears to be a private user-specific page. It's automatically configured to:
                      </p>
                      <ul className="text-sm text-orange-700 mt-2 list-disc list-inside">
                        <li>Not be indexed by search engines (no_index = true)</li>
                        <li>Not pass link juice (no_follow = true)</li>
                        <li>Excluded from sitemap.xml</li>
                        <li>Blocked in robots.txt</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 font-medium mb-2">Priority</Label>
                  <Select
                    value={formData?.priority?.toString() || '0.8'}
                    onValueChange={(val) => setFormData({ ...formData, priority: parseFloat(val) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">1.0 (Highest - Homepage)</SelectItem>
                      <SelectItem value="0.9">0.9 (Very High)</SelectItem>
                      <SelectItem value="0.8">0.8 (High)</SelectItem>
                      <SelectItem value="0.7">0.7 (Medium-High)</SelectItem>
                      <SelectItem value="0.5">0.5 (Medium)</SelectItem>
                      <SelectItem value="0.3">0.3 (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium mb-2">Change Frequency</Label>
                  <Select
                    value={formData?.changefreq || 'weekly'}
                    onValueChange={(val) => setFormData({ ...formData, changefreq: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-index"
                    checked={formData?.no_index || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, no_index: checked })}
                  />
                  <Label htmlFor="no-index" className="cursor-pointer">No Index (Hide from search engines)</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-follow"
                    checked={formData?.no_follow || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, no_follow: checked })}
                  />
                  <Label htmlFor="no-follow" className="cursor-pointer">No Follow</Label>
                </div>
              </div>
            </div>

            {/* Schema Type */}
            <div>
              <Label className="text-gray-900 font-medium mb-2">Schema Type</Label>
              <Select
                value={formData?.schema_type || 'WebPage'}
                onValueChange={(val) => setFormData({ ...formData, schema_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WebPage">WebPage (Default)</SelectItem>
                  <SelectItem value="FAQPage">FAQPage</SelectItem>
                  <SelectItem value="SoftwareApplication">SoftwareApplication</SelectItem>
                  <SelectItem value="Article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => { setEditingPage(null); setFormData(null); setShowForm(false); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saveMutation.isPending ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save SEO Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
