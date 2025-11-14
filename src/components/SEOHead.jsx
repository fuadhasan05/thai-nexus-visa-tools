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
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}