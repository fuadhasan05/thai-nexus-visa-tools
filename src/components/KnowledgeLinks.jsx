import React from 'react';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, TrendingUp } from 'lucide-react';
import GlassCard from './GlassCard';

export default function KnowledgeLinks({ limit = 4, showTrending = false }) {
  const { data: posts = [] } = useQuery({
    queryKey: showTrending ? ['trending-knowledge'] : ['popular-knowledge'],
    queryFn: async () => {
      if (showTrending) {
        // Get trending posts
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const allPosts = await base44.entities.KnowledgePost.filter({ status: 'approved' });
        
        const scoredPosts = allPosts.map(post => {
          const postDate = new Date(post.last_activity_date || post.published_date || post.created_date);
          const isRecent = postDate >= sevenDaysAgo;
          
          if (!isRecent) return { ...post, score: 0 };
          
          const commentScore = (post.comment_count || 0) * 50;
          const upvoteScore = (post.upvote_count || 0) * 10;
          const viewScore = (post.view_count || 0) * 0.5;
          const hasAnswerBonus = post.has_accepted_answer ? 20 : 0;
          
          return { ...post, score: commentScore + upvoteScore + viewScore + hasAnswerBonus };
        });
        
        return scoredPosts
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      } else {
        // Get popular posts by views
        return await base44.entities.KnowledgePost.filter({ status: 'approved' }, '-view_count', limit);
      }
    }
  });

  if (!posts || posts.length === 0) return null;

  return (
    <GlassCard className="p-6 bg-white border border-[#E7E7E7]">
      <div className="flex items-center gap-2 mb-4">
        {showTrending ? (
          <>
            <TrendingUp className="w-5 h-5 text-[#BF1E2E]" />
            <h3 className="text-lg font-bold text-[#272262]">Trending Questions</h3>
          </>
        ) : (
          <>
            <BookOpen className="w-5 h-5 text-[#BF1E2E]" />
            <h3 className="text-lg font-bold text-[#272262]">Popular Questions</h3>
          </>
        )}
      </div>
      <div className="space-y-3">
        {posts.map(post => (
          <Link key={post.id} href={createPageUrl("KnowledgePost") + `?slug=${post.slug}`}>
            <div className="p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#E7E7E7]">
              <h4 className="font-medium text-[#272262] text-sm mb-1 line-clamp-2 hover:text-[#BF1E2E]">
                {post.title}
              </h4>
              <div className="text-xs text-[#454545]">
                {post.view_count || 0} views • {post.comment_count || 0} answers
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href={createPageUrl("KnowledgeHub")}>
        <button className="w-full mt-4 text-sm text-[#BF1E2E] hover:text-[#9d1825] font-medium text-center">
          View All Questions →
        </button>
      </Link>
    </GlassCard>
  );
}