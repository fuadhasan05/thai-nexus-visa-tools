import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/GlassCard';
import { createPageUrl } from '@/utils';
import Link from 'next/link';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-[#272262] mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-[#272262] mb-4">Processing Your Subscription...</h1>
          <p className="text-[#454545]">Please wait while we activate your contributor account.</p>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <GlassCard className="p-12 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Subscription Error</h1>
          <p className="text-[#454545] mb-6">{error}</p>
          <Link href={createPageUrl('Contact')}>
            <Button>Contact Support</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <GlassCard className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#272262] mb-4">Subscription Activated!</h1>
        
        <p className="text-lg text-[#454545] mb-6">
          Welcome to the Thai Nexus Contributor Program! Your subscription is now active.
        </p>

        <div className="bg-[#F8F9FA] rounded-lg p-6 mb-8 text-left">
          <h3 className="font-bold text-[#272262] mb-3">What's Next?</h3>
          <ul className="space-y-2 text-[#454545]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Start writing and publishing articles</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Your content will reach 5,000+ monthly visitors</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Build your reputation as a Thailand visa expert</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Manage your subscription anytime from your profile</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={createPageUrl('KnowledgePost') + '?new=true'}>
            <Button className="bg-[#272262] hover:bg-[#3d3680] text-white px-8 py-6 text-lg">
              Write Your First Article
            </Button>
          </Link>
          <Link href={createPageUrl('KnowledgeHub')}>
            <Button variant="outline" className="px-8 py-6 text-lg">
              Browse Knowledge Hub
            </Button>
          </Link>
        </div>

        <p className="text-sm text-[#454545] mt-8">
          Session ID: {session_id || 'N/A'}
        </p>
      </GlassCard>
    </div>
  );
}
