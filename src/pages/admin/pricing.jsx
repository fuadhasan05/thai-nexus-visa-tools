import React from 'react';
import GlassCard from '@/components/GlassCard';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/router";
import { createPageUrl } from '@/utils';

export const getStaticProps = async () => {
  return {
    notFound: true,
  };
};
export default function AdminPricing() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-12 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pricing Settings Deprecated</h1>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          This feature is no longer used. The <strong>Agent Comparison</strong> page uses hardcoded pricing data 
          and doesn't fetch from the database. This page and the <strong>PricingSetting</strong> entity can be safely deleted.
        </p>
        
        <div className="bg-white border border-yellow-300 rounded-xl p-6 max-w-xl mx-auto">
          <h3 className="font-bold text-gray-900 mb-3">To remove this feature:</h3>
          <ol className="text-left space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Delete the <code className="bg-gray-100 px-1 rounded">AdminPricing</code> page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Delete the <code className="bg-gray-100 px-1 rounded">PricingSetting</code> entity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Remove the reference from the admin menu in the layout</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Button
            onClick={() => router.push(createPageUrl('AgentComparison'))}
            variant="outline"
          >
            View Agent Comparison Page
          </Button>
          <Button
            onClick={() => router.push(createPageUrl('Home'))}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Home
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">This Feature Is Not Integrated</h3>
            <p className="text-sm text-gray-700">
              The Agent Comparison tool uses static data defined directly in the code. 
              Any pricing settings created here won't appear on the actual comparison page. 
              If you need dynamic pricing management, the feature would need to be rebuilt.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}