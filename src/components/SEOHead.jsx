
/*
  Lightweight SEOHead component
  - Props: title, description, keywords, url
  - Uses Next.js Head to inject common meta tags (OG/Twitter/Canonical)
*/

import Head from 'next/head';
import React from 'react';

export default function SEOHead({ title, description, keywords, url }) {
  const safeTitle = title || 'Thai Nexus • Thailand Visa & Immigration Tools';
  const safeDescription = description || 'Thai Nexus provides visa tools and immigration guidance for Thailand.';
  const canonical = url || 'https://thainexus.co.th';

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />

      <link rel="canonical" href={canonical} />
    </Head>
  );
}
