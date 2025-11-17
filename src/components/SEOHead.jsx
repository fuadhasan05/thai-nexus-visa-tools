import Head from 'next/head';

export default function SEOHead({ 
  title = 'Thai Nexus Visa Tools',
  description = 'Visa tools and resources for Thailand',
  keywords = 'visa, thailand, tools, travel'
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    {/* Favicon files - place your favicon files in the `public/` folder.
      Recommended filenames (already referenced here):
      - /favicon.ico          (classic ICO file)
      - /favicon-32x32.png    (32x32 PNG)
      - /favicon-16x16.png    (16x16 PNG)
      - /apple-touch-icon.png (iOS)
    */}
    <link rel="icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/public/thai-nexus-favicon.png" />
    </Head>
  );
}