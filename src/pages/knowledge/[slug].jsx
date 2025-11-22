// Article detail page using dynamic slug route
// Renders post.jsx content with clean URLs like /knowledge/article-slug
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import post.jsx to avoid SSR issues
const KnowledgePost = dynamic(() => import('./post'), { ssr: false });

export default function KnowledgeSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#272262] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  // Render the post.jsx component which will read slug from router.query
  return <KnowledgePost />;
}
