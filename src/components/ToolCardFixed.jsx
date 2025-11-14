import React from 'react';
import Link from "next/link";
import { createPageUrl } from '@/utils';
import { ArrowRight, Crown } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ToolCardFixed({ title, description, icon: Icon, color, page, features, isPremium }) {
  if (!page) {
    console.error('ToolCard missing page prop:', { title, page });
    return null;
  }

  const displayTitle = title || 'Tool';
  const displayDescription = description || '';
  const displayFeatures = features || [];

  return (
    <Link href={createPageUrl(page)} className="block">
      <GlassCard className="p-6 h-full hover:scale-[1.02] transition-transform relative overflow-hidden">
        {isPremium && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#272262] text-white text-xs font-bold flex items-center gap-1 shadow-lg">
            <Crown className="w-3 h-3" />
            PRO
          </div>
        )}

        {Icon && (
          <div className={`w-14 h-14 rounded-2xl ${color || 'bg-gradient-to-br from-[#272262] to-[#3d3680]'} flex items-center justify-center mb-4 shadow-md`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        )}

        <h3 className="text-2xl font-bold text-[#272262] mb-2">{displayTitle}</h3>
        <p className="text-[#454545] text-sm mb-4 leading-relaxed">{displayDescription}</p>

        {displayFeatures.length > 0 && (
          <ul className="space-y-2 mb-4">
            {displayFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-[#454545] text-xs">
                <span className="text-[#BF1E2E] font-bold">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 text-[#BF1E2E] text-sm font-semibold mt-auto pt-4 hover:gap-3 transition-all">
          <span>Open Tool</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </GlassCard>
    </Link>
  );
}
