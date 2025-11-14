
import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from "next/router";

const PRIVATE_PAGES = [
  'adminseo', 'adminusers', 'adminknowledge', 'adminknowledgeedit',
  'adminpartners', 'admintranslations', 'admincontent', 'adminpricing', 'adminbugs',
  'profile', 'settings', 'partnerdashboard'
];

const URL_TO_PAGE_MAP = {
  '': 'Home',
  '/': 'Home',
  'visanavigator': 'VisaNavigator',
  'eligibilitycalculator': 'EligibilityCalculator',
  'eligibility-calculator': 'EligibilityCalculator',
  'documentvalidator': 'DocumentValidator',
  'document-validator': 'DocumentValidator',
  'currencyconverter': 'CurrencyConverter',
  'currency-converter': 'CurrencyConverter',
  'packetbuilder': 'PacketBuilder',
  'packet-builder': 'PacketBuilder',
  'pathwayplanner': 'PathwayPlanner',
  'pathway-planner': 'PathwayPlanner',
  'socialmediagenerator': 'SocialMediaGenerator',
  'social-media-generator': 'SocialMediaGenerator',
  'adminmanager': 'AdminManager',
  'immigrationmap': 'ImmigrationMap',
  'immigrationsimulator': 'ImmigrationSimulator',
  'agentcomparison': 'AgentComparison',
  'partnerwithus': 'PartnerWithUs',
  'contact': 'Contact',
  'knowledgehub': 'KnowledgeHub',
  'becomecontributor': 'BecomeContributor',
  'termsofservice': 'TermsOfService',
  'privacypolicy': 'PrivacyPolicy',
  'knowledgepost': 'KnowledgePost',
  'knowledgecontributor': 'KnowledgeContributor',
  'adminseo': 'AdminSEO',
  'adminusers': 'AdminUsers',
  'adminknowledge': 'AdminKnowledge',
  'adminknowledgeedit': 'AdminKnowledgeEdit',
  'adminpartners': 'AdminPartners',
  'admintranslations': 'AdminTranslations',
  'admincontent': 'AdminContent',
  'adminpricing': 'AdminPricing',
  'adminbugs': 'AdminBugs',
  'profile': 'Profile',
  'settings': 'Settings',
  'partnerdashboard': 'PartnerDashboard'
};

function getPageNameFromPath(pathname) {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const pageName = URL_TO_PAGE_MAP[cleanPath];
  
  if (pageName) {
    return pageName;
  }
  
  // Extract the last segment for nested routes (e.g., /tools/eligibility-calculator -> eligibility-calculator)
  const segments = cleanPath.split('/');
  const lastSegment = segments[segments.length - 1];
  
  if (lastSegment && lastSegment !== 'tools') {
    const lastSegmentPageName = URL_TO_PAGE_MAP[lastSegment];
    if (lastSegmentPageName) {
      return lastSegmentPageName;
    }
    
    // Convert kebab-case to CamelCase
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  if (cleanPath) {
    return cleanPath
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  return 'Home';
}

export default function SEOHead({ page }) {
  const router = useRouter();
  const urlParams = new URLSearchParams(router.asPath?.split("?")?.[1] || "");
  
  const detectedPageName = React.useMemo(() => {
    return getPageNameFromPath(router.pathname);
  }, [router.pathname]);
  
  const actualPageName = page && page !== 'Home' ? page : detectedPageName;

  // For KnowledgePost - fetch post data
  const postSlug = urlParams.get('slug');
  const postId = urlParams.get('id');
  
  const { data: knowledgePost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['seo-knowledge-post', postSlug, postId],
    queryFn: async () => {
      let { data: posts, error } = postSlug
        ? await supabase.from('KnowledgePost').select('*').eq('slug', postSlug).eq('status', 'approved')
        : await supabase.from('KnowledgePost').select('*').eq('id', postId).eq('status', 'approved');
      if (error) throw error;
      return posts?.[0] || null;
    },
    enabled: actualPageName === 'KnowledgePost' && !!(postSlug || postId),
    staleTime: 5 * 60 * 1000
  });

  // For KnowledgeContributor - fetch profile data
  const profileSlug = urlParams.get('slug');
  const profileId = urlParams.get('id');
  const contributorEmail = urlParams.get('email');
  
  const { data: contributorProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['seo-contributor-profile', profileSlug, profileId, contributorEmail],
    queryFn: async () => {
      let { data: profiles, error } = profileSlug
        ? await supabase.from('ContributorProfile').select('*').eq('profile_slug', profileSlug).eq('profile_visible', true)
        : profileId
        ? await supabase.from('ContributorProfile').select('*').eq('id', profileId).eq('profile_visible', true)
        : await supabase.from('ContributorProfile').select('*').eq('user_email', contributorEmail).eq('profile_visible', true);
      if (error) throw error;
      return profiles?.[0] || null;
    },
    enabled: actualPageName === 'KnowledgeContributor' && !!(profileSlug || profileId || contributorEmail),
    staleTime: 5 * 60 * 1000
  });

  // Regular SEO config from database (for static pages)
  const { data: seoConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['seo-metadata', actualPageName],
    queryFn: async () => {
      if (!actualPageName) return null;
      try {
        const { data: configs, error } = await supabase.from('SEOMetadata').select('*').eq('page_name', actualPageName).eq('is_active', true);
        if (error) {
          console.warn(`SEO metadata fetch error for ${actualPageName}:`, error.message);
          return null;
        }
        return configs && configs.length > 0 ? configs[0] : null;
      } catch (err) {
        console.warn(`Failed to fetch SEO metadata for ${actualPageName}:`, err);
        return null;
      }
    },
    enabled: !!actualPageName && actualPageName !== 'KnowledgePost' && actualPageName !== 'KnowledgeContributor',
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  useEffect(() => {
    if (!actualPageName) {
      console.error('SEOHead: page prop is undefined!');
      return;
    }
    
    // Wait for data to load before applying SEO
    if (actualPageName === 'KnowledgePost' && isLoadingPost) return;
    if (actualPageName === 'KnowledgeContributor' && isLoadingProfile) return;
    if (actualPageName !== 'KnowledgePost' && actualPageName !== 'KnowledgeContributor' && isLoadingConfig) return;
    
    const pageLower = actualPageName?.toLowerCase() || '';
    const isPrivatePage = PRIVATE_PAGES.includes(pageLower);
    const isAdminPage = pageLower.startsWith('admin') && pageLower !== 'adminmanager';

    let title, description, keywords, canonical, ogImage;

    // Handle KnowledgePost dynamically
    if (actualPageName === 'KnowledgePost' && knowledgePost) {
      title = knowledgePost.meta_title || `${knowledgePost.title} | Thailand Visa Q&A | Thai Nexus`;
      
      let metaDesc = knowledgePost.meta_description || knowledgePost.excerpt;
      if (!metaDesc && knowledgePost.content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = knowledgePost.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        metaDesc = textContent.substring(0, 155).trim() + '...';
      }
      description = metaDesc || `Community answers about ${knowledgePost.title}`;
      keywords = knowledgePost.meta_keywords || (knowledgePost.tags ? knowledgePost.tags.join(', ') : 'thailand visa, visa questions, expat help');
      canonical = knowledgePost.canonical_url || `https://visa.thainexus.co.th/knowledgepost?slug=${knowledgePost.slug}`;
      ogImage = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png';
    }
    // Handle KnowledgeContributor dynamically
    else if (actualPageName === 'KnowledgeContributor' && contributorProfile) {
      const displayName = contributorProfile.full_name || contributorProfile.nickname || 'Contributor';
      title = `${displayName} - Thailand Visa Expert | Thai Nexus`;
      description = contributorProfile.bio || `View ${displayName}'s profile and articles about Thailand visa and immigration on Thai Nexus.`;
      keywords = `${displayName}, thailand visa expert, visa contributor, ${contributorProfile.expertise_areas?.join(', ') || 'immigration help'}`;
      canonical = `https://visa.thainexus.co.th/knowledgecontributor?slug=${contributorProfile.profile_slug || 'profile'}`;
      ogImage = contributorProfile.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png';
    }
    // Handle regular pages
    else {
      const fallbackTitle = `${actualPageName.replace(/([A-Z])/g, ' $1').trim()} | Thai Nexus`;
      const fallbackDescription = `${actualPageName.replace(/([A-Z])/g, ' $1').trim()} - Professional Thailand visa information and tools`;
      
      title = seoConfig?.meta_title || fallbackTitle;
      description = seoConfig?.meta_description || fallbackDescription;
      keywords = seoConfig?.meta_keywords || 'thailand visa, visa tools, immigration';
      canonical = seoConfig?.canonical_url || `https://visa.thainexus.co.th/${actualPageName.toLowerCase()}`;
      ogImage = seoConfig?.og_image || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png';
    }

    console.log(`SEO Applied for "${actualPageName}":`, {
      title: title?.substring(0, 60) + '...',
      description: description?.substring(0, 50) + '...',
      source: knowledgePost ? 'post' : contributorProfile ? 'profile' : seoConfig ? 'database' : 'fallback'
    });

    // Update all meta tags
    document.title = title;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = keywords;

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = seoConfig?.og_title || title;

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = seoConfig?.og_description || description;

    let ogImageTag = document.querySelector('meta[property="og:image"]');
    if (!ogImageTag) {
      ogImageTag = document.createElement('meta');
      ogImageTag.setAttribute('property', 'og:image');
      document.head.appendChild(ogImageTag);
    }
    ogImageTag.content = ogImage;

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonical;

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }

    if (isAdminPage || isPrivatePage || seoConfig?.no_index) {
      const directives = ['noindex'];
      if (isAdminPage || isPrivatePage || seoConfig?.no_follow) {
        directives.push('nofollow');
      }
      robotsMeta.content = directives.join(', ');
    } else if (seoConfig?.no_follow) {
      robotsMeta.content = 'index, nofollow';
    } else {
      robotsMeta.content = 'index, follow';
    }

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical;

  }, [actualPageName, seoConfig, knowledgePost, contributorProfile, router.pathname, isLoadingPost, isLoadingProfile, isLoadingConfig]);

  return null;
}
