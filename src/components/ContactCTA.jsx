import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ContactCTA({ message = "Complicated Visa Situation?" }) {
  return (
    <GlassCard className="p-6 md:p-8 bg-gradient-to-br from-[#BF1E2E] to-[#d94656] border-none text-white shadow-lg mb-[10px]" hover={false}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold mb-2">{message}</h3>
          <p className="text-white/95 text-sm md:text-base">
            Complex cases • Document issues • Denied applications • Time-sensitive situations<br />
            <strong>We handle it all</strong> - Let our experts take over
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            className="bg-white hover:bg-gray-50 text-[#BF1E2E] font-semibold h-12 shadow-md"
            onClick={() => window.open('https://wa.me/66923277723', '_blank')}
          >
            <Phone className="w-4 h-4 mr-2" />
            WhatsApp: +66923277723
          </Button>
          
          <Button 
            className="bg-[#272262] hover:bg-[#1d1847] text-white font-semibold h-12 shadow-md"
            onClick={() => window.open('https://line.me/ti/p/@thainexus', '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Line: @thainexus
          </Button>
          
          <Button 
            variant="outline"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white text-white font-semibold h-12"
            onClick={() => window.open('mailto:contact@thainexus.co.th', '_blank')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Us
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}