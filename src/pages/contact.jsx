
import SEOHead from '@/components/SEOHead';import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock, Building2, Compass, CheckCircle, Navigation, ExternalLink } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
const ClientOnlyMap = dynamic(() => import('@/components/ClientOnlyMap'), { ssr: false });

// We'll only load Leaflet on the client to avoid SSR errors (window/document not defined)

export default function Contact() {
  const [mapReady, setMapReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // createThaiNexusIcon will be created client-side when Leaflet is available
  const createThaiNexusIcon = () => {
    if (typeof window === 'undefined') return null;
    // require here to avoid importing Leaflet during SSR
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #BF1E2E; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><div style="width: 12px; height: 12px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Thai Nexus Point Co., Ltd. location - CORRECT COORDINATES
  const officeLocation = {
    lat: 12.54244310,
    lng: 99.95069480,
    name: 'Thai Nexus Point Co., Ltd.',
    address: '39/743 Soi Mooban Hua Na, Nong Kae, Hua Hin, Prachuap Khiri Khan 77110, Thailand',
    googleMapsUrl: 'https://maps.app.goo.gl/JtH7ZpX8aso3xgBA8',
    appleMapsUrl: 'https://maps.apple.com/place/Thai+Nexus+Point/@12.5424431,99.9506948,15z/data=!4m6!3m5!1s0x30182462e7834a7d:0x875d9e5a1b3c9b74!8m2!3d12.5424431!4d99.9506948!16s%2Fg%2F11vjn6s8n4?hl=en&entry=s' // Updated Apple Maps URL
  };

  const openGoogleMaps = () => {
    window.open(officeLocation.googleMapsUrl, '_blank');
  };

  const openAppleMaps = () => {
    window.open(officeLocation.appleMapsUrl, '_blank');
  };

  // FAQ Schema for Google
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What are the financial requirements for Thailand retirement visa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For Thailand retirement visa (Non-O), you need either 800,000 THB in a Thai bank account for 2 months before application, OR 650,000 THB monthly pension income, OR a combination totaling 800,000 THB annually. The money must remain in the account for 3 months after approval and cannot drop below 400,000 THB for the rest of the year."
        }
      },
      {
        "@type": "Question",
        "name": "How long can I stay in Thailand on a tourist visa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tourist visa (TR) allows 60 days stay, extendable once for 30 days at immigration (total 90 days). Visa exemption stamps vary by nationality - most get 30-60 days. You can extend tourist exemption once for 30 days. For longer stays, consider DTV (digital nomad) visa which gives 180 days per entry with 5-year validity."
        }
      },
      {
        "@type": "Question",
        "name": "Can I work in Thailand on a retirement visa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, retirement visa (Non-O) does not permit work in Thailand. If you want to work, you need a Non-B business visa and work permit. However, you CAN do remote work for foreign companies on DTV (Digital Nomad) visa, which is perfect for remote workers, freelancers, and digital entrepreneurs."
        }
      },
      {
        "@type": "Question",
        "name": "What is the 90-day report and how do I file it?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "90-day report (TM.47) is required for everyone staying in Thailand over 90 consecutive days. You must report your address within 15 days before or 7 days after the deadline. You can file in-person at immigration, online via the immigration website, or by mail. Failure to report results in 2,000 THB fine. Use our 90-Day Report Tracker tool to never miss a deadline."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need a visa to stay in Thailand for 6 months?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Tourist visa exemption only gives 30-60 days. For 6 months, best options are: DTV visa (180 days per entry, perfect for digital nomads), Multiple Entry Tourist Visa (METV) with border runs, or Non-O visa if you qualify for retirement/marriage. DTV is easiest - requires 500,000 THB in bank and remote work proof."
        }
      }
    ]
  };

  // LocalBusiness schema for Thai Nexus
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Thai Nexus Point Co., Ltd.",
    "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690831b53c6512a80a926b0d/620559a1d_ThaiNexusMainLogo.png",
    "description": "Professional Thailand visa services and immigration assistance in Hua Hin. Expert help with retirement visas, DTV, work permits, and visa extensions.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "39/743 Soi Mooban Hua Na",
      "addressLocality": "Nong Kae, Hua Hin",
      "addressRegion": "Prachuap Khiri Khan",
      "postalCode": "77110",
      "addressCountry": "TH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": officeLocation.lat,
      "longitude": officeLocation.lng
    },
    "url": "https://visa.thainexus.co.th",
    "telephone": "+66923277723",
    "email": "contact@thainexus.co.th",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "13:00"
      }
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "City",
      "name": "Hua Hin"
    }
  };
  // Inject schemas into page head
  React.useEffect(() => {
    // Inject JSON-LD for FAQ and Business schema on client only
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);

    const businessScript = document.createElement('script');
    businessScript.type = 'application/ld+json';
    businessScript.text = JSON.stringify(businessSchema);
    document.head.appendChild(businessScript);

    return () => {
      try { document.head.removeChild(faqScript); } catch (e) {}
      try { document.head.removeChild(businessScript); } catch (e) {}
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        /* Fix map container z-index to prevent overlapping navbar */
        .leaflet-container {
          z-index: 1 !important;
        }
        
        .leaflet-pane {
          z-index: 1 !important;
        }
        
        .leaflet-top,
        .leaflet-bottom {
          z-index: 2 !important;
        }
      `}</style>

      {/* Hero Header - MOBILE RESPONSIVE */}
      <div className="relative overflow-hidden rounded-3xl min-h-[250px] md:min-h-[300px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262]">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 py-8 md:py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3 md:mb-4">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="text-white text-xs sm:text-sm font-bold">Visit Our Office</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4">Get in Touch</h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4">
            Have questions about Thailand visas? Need professional assistance? Our team is here to help.
          </p>
        </div>
      </div>

      {/* Interactive Map - MOBILE RESPONSIVE */}
      <GlassCard className="overflow-hidden">
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl md:rounded-3xl overflow-hidden" style={{ zIndex: 1 }}>
          <ClientOnlyMap officeLocation={officeLocation} setMapReady={setMapReady} />

          {/* Direction Buttons Overlay - MOBILE RESPONSIVE */}
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-[400] flex flex-col sm:flex-row gap-2">
            <Button
              onClick={openGoogleMaps}
              className="bg-[#BF1E2E] hover:bg-[#9d1825] shadow-lg text-xs sm:text-sm"
              size="sm"
            >
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Google Maps</span>
              <span className="xs:hidden">Google</span>
            </Button>
            <Button
              onClick={openAppleMaps}
              className="bg-[#272262] hover:bg-[#1d1847] shadow-lg text-xs sm:text-sm"
              size="sm"
            >
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Apple Maps</span>
              <span className="xs:hidden">Apple</span>
            </Button>
          </div>

          {/* Custom attribution overlay */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            zIndex: 400,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '3px 8px',
            borderRadius: '0 4px 0 0',
            fontSize: '11px',
            fontWeight: 600,
            color: '#272262'
          }}>
            Thai Nexus Map 1.1
          </div>
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Contact Methods - MOBILE RESPONSIVE */}
        <GlassCard className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#272262] mb-4 sm:mb-6">Contact Methods</h2>
          <div className="space-y-4 sm:space-y-6">
            <a
              href="https://wa.me/66923277723"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 border-[#E7E7E7] hover:border-[#BF1E2E] hover:bg-red-50 transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">WhatsApp</h3>
                <p className="text-[#BF1E2E] font-medium text-sm sm:text-base">+66 92 327 7723</p>
                <p className="text-xs sm:text-sm text-[#454545] mt-1">Fastest response - Available 9 AM - 6 PM Bangkok Time</p>
              </div>
            </a>

            <a
              href="https://line.me/ti/p/@thainexus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 border-[#E7E7E7] hover:border-[#BF1E2E] hover:bg-red-50 transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">LINE</h3>
                <p className="text-[#BF1E2E] font-medium text-sm sm:text-base">@thainexus</p>
                <p className="text-xs sm:text-sm text-[#454545] mt-1">Popular in Thailand - Quick replies</p>
              </div>
            </a>

            <a
              href="mailto:contact@thainexus.co.th"
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 border-[#E7E7E7] hover:border-[#272262] hover:bg-[#F8F9FA] transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F8F9FA] flex items-center justify-center group-hover:bg-[#E7E7E7] transition-colors flex-shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#272262]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">Email</h3>
                <p className="text-[#BF1E2E] font-medium text-sm sm:text-base break-all">contact@thainexus.co.th</p>
                <p className="text-xs sm:text-sm text-[#454545] mt-1">Detailed inquiries - Response within 24 hours</p>
              </div>
            </a>
          </div>
        </GlassCard>

        {/* Company Info - MOBILE RESPONSIVE */}
        <GlassCard className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#272262] mb-4 sm:mb-6">Company Information</h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">Legal Entity</h3>
                <p className="text-[#454545] text-sm sm:text-base">Thai Nexus Point Co., Ltd.</p>
                <p className="text-xs sm:text-sm text-[#454545] mt-1">Registered in Thailand</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">Office Address</h3>
                <p className="text-[#454545] text-xs sm:text-sm mb-2">39/743 Soi Mooban Hua Na<br />Nong Kae, Hua Hin<br />Prachuap Khiri Khan 77110<br />Thailand</p>
                <p className="text-[#454545] text-xs mb-3">39/743 ซอยหมู่บ้านหัวนา ตำบลหนองแก<br />อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110</p>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button onClick={openGoogleMaps} size="sm" variant="outline" className="text-xs border-[#E7E7E7] hover:bg-[#F8F9FA] w-full xs:w-auto justify-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Google Maps
                  </Button>
                  <Button onClick={openAppleMaps} size="sm" variant="outline" className="text-xs border-[#E7E7E7] hover:bg-[#F8F9FA] w-full xs:w-auto justify-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Apple Maps
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#272262] mb-1 text-sm sm:text-base">Business Hours</h3>
                <p className="text-[#454545] text-xs sm:text-sm">Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p className="text-[#454545] text-xs sm:text-sm">Saturday: 9:00 AM - 1:00 PM</p>
                <p className="text-xs text-[#454545] mt-1">Bangkok Time (GMT+7)</p>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg">
            <p className="text-xs sm:text-sm text-[#454545]">
              <strong className="text-[#272262]">Response Times:</strong> WhatsApp and LINE messages are typically answered within 1-2 hours during business hours. Email inquiries receive responses within 24 hours.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Services Overview - MOBILE RESPONSIVE */}
      <GlassCard className="p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-[#272262] mb-4 sm:mb-6">How We Can Help</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-[#F8F9FA] to-white rounded-xl border border-[#E7E7E7]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-[#272262] mb-2 text-sm sm:text-base">Document Review</h3>
            <p className="text-xs sm:text-sm text-[#454545]">Expert review of your visa application documents before submission</p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-[#F8F9FA] to-white rounded-xl border border-[#E7E7E7]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#BF1E2E] to-[#d94656] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-[#272262] mb-2 text-sm sm:text-base">Visa Strategy</h3>
            <p className="text-xs sm:text-sm text-[#454545]">Personalized advice on the best visa path for your situation</p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-[#F8F9FA] to-white rounded-xl border border-[#E7E7E7] sm:col-span-2 md:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-[#272262] mb-2 text-sm sm:text-base">Full Service</h3>
            <p className="text-xs sm:text-sm text-[#454545]">Complete application assistance from start to finish</p>
          </div>
        </div>
      </GlassCard>

      {/* Enhanced FAQ - MOBILE RESPONSIVE */}
      <GlassCard className="p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-[#272262] mb-4 sm:mb-6">Frequently Asked Questions About Thailand Visas</h2>
        <div className="space-y-3 sm:space-y-4">
          {faqSchema.mainEntity.map((faq, index) => (
            <div key={index} className="p-3 sm:p-4 bg-[#F8F9FA] rounded-lg border border-[#E7E7E7]">
              <h3 className="font-bold text-[#272262] mb-2 text-sm sm:text-base">{faq.name}</h3>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed">{faq.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-red-50 to-pink-50 border border-[#BF1E2E]/30 rounded-lg">
          <p className="text-xs sm:text-sm text-[#454545] leading-relaxed">
            <strong className="text-[#272262]">Still have questions?</strong> Contact us directly via WhatsApp (+66923277723), LINE (@thainexus), or email (contact@thainexus.co.th) for personalized visa guidance.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
