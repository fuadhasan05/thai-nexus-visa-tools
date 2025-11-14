import React from 'react';
import { Helmet } from 'react-helmet';

// Static SEO tags that will be rendered immediately (before JavaScript)
// These serve as fallbacks for crawlers and will be overridden by dynamic SEOHead tags
export default function StaticSEOTags() {
  return (
    <Helmet>
      {/* Default meta tags for all pages */}
      <title>Thailand Visa Tools & Immigration Guide | Thai Nexus</title>
      <meta 
        name="description" 
        content="Master your Thailand visa journey with free tools: navigator, eligibility calculator, 90-day tracker, document validator. Expert guidance for retirement, DTV, work visas." 
      />
      <meta 
        name="keywords" 
        content="thailand visa, visa calculator thailand, retirement visa thailand, dtv visa, visa extension thailand, 90 day report, immigration thailand, expat thailand tools" 
      />
      <link rel="canonical" href="https://visa.thainexus.co.th" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Thailand Visa Tools & Immigration Guide | Thai Nexus" />
      <meta property="og:description" content="Master your Thailand visa journey with free tools: navigator, eligibility calculator, 90-day tracker, document validator." />
      <meta property="og:url" content="https://visa.thainexus.co.th" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Thailand Visa Tools & Immigration Guide | Thai Nexus" />
      <meta name="twitter:description" content="Master your Thailand visa journey with free tools for expats." />
      <meta name="twitter:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/0208cfc5c_ThaiNexusIconFull4x.png" />
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
      
      {/* Site verification and other global tags */}
      <meta name="application-name" content="Thai Nexus" />
      <meta name="theme-color" content="#272262" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://qtrypzzcjebvfcihiynt.supabase.co" />
    </Helmet>
  );
}