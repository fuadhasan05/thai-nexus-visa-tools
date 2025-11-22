// Testing & dev notes:
// - Run locally: npm run dev and open a post page e.g. /knowledge/my-post
// - Pages are statically generated with ISR (revalidate: 60s).
// - Env required (on Vercel): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN

import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default function KnowledgePost({ post }) {
  if (!post) return <div>Post not found</div>;

  return (
    <>
      <Head>
        <title>{post.title} • Thai Nexus</title>
        <meta name="description" content={post.summary || ''} />
      </Head>

      <main className="max-w-3xl mx-auto p-6">
        <article>
          <h1 className="text-2xl font-semibold mb-2">{post.title}</h1>
          <p className="text-sm text-gray-600 mb-4">By {post.author || 'Unknown'} • {post.published_at ? new Date(post.published_at).toLocaleString() : (post.created_at ? new Date(post.created_at).toLocaleString() : '')}</p>
          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </article>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  // Pre-build paths for published posts. Use blocking fallback for SEO on new posts.
  // Use server-side admin client for static generation to avoid anon role/schema issues
  const { data, error } = await supabaseAdmin
    .from('knowledge')
    .select('slug')
    .eq('published', true);

  if (error) {
    console.error('supabaseAdmin error fetching slugs:', error);
  }

  const paths = (data || []).map((r) => ({ params: { slug: r.slug } }));

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const slug = params?.slug;
  if (!slug) return { notFound: true };

  const { data, error } = await supabaseAdmin
    .from('knowledge')
    .select('id, title, slug, summary, content, author, tags, published, published_at, created_at, updated_at')
    .eq('slug', slug)
    .limit(1)
    .single();

  if (error || !data) {
    // If not found, let Next.js return 404
    return { notFound: true, revalidate: 60 };
  }

  return {
    props: { post: data },
    revalidate: 60
  };
}
