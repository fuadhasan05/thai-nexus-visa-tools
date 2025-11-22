import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Image as ImageIcon, Sparkles } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';
import SEOHead from '../../components/SEOHead';

export default function SocialMediaGenerator() {
  const { addError, addSuccess } = useError();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-social'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user ?? null;
    },
    retry: false,
  });

  const isAdmin = currentUser?.role === 'admin';

  const templates = {
    retirement: 'Professional advertisement for Thai retirement visa services. Modern design with sunset over Thai beach, text overlay "Retire in Paradise - Thailand Visa Made Easy", company name "Thai Nexus". Clean, trustworthy, professional aesthetic.',
    dtv: 'Eye-catching social media post for Thailand Digital Nomad Visa (DTV). Modern tropical office setup, laptop with Thai temple view, text "Work Remotely from Thailand - DTV Visa Experts". Vibrant, energetic colors.',
    business: 'Corporate professional image for Thai business visa services. Bangkok skyline, modern office aesthetic, text "Thailand Business Visa Solutions - Thai Nexus". Professional blue and white color scheme.',
    marriage: 'Warm, inviting image for Thai marriage visa services. Couple silhouette with Thai temple background, text "Start Your Life Together in Thailand - Marriage Visa Experts". Romantic, professional tone.',
    education: 'Educational advertisement for Thai student visa services. Modern university campus, young students, text "Study in Thailand - ED Visa Assistance". Bright, youthful colors.',
    general: 'General Thai visa services advertisement. Collage of Thailand landmarks (temples, beaches, modern Bangkok), text "All Your Thailand Visa Needs - Thai Nexus". Professional, comprehensive feel.'
  };

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, count = 1 }) => {
      const images = [];
      for (let i = 0; i < count; i++) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('generateImage', {
          body: JSON.stringify({ prompt })
        });
        if (fnError) throw fnError;
        // support single url or array of urls
        if (fnData?.url) images.push(fnData.url);
        else if (Array.isArray(fnData?.urls)) images.push(...fnData.urls);
      }
      return images;
    },
    onSuccess: (images) => {
      setGeneratedImages(prev => [...prev, ...images]);
      addSuccess(`Generated ${images.length} image(s) successfully!`);
    },
    onError: (error) => {
      addError('Failed to generate image: ' + error.message);
    }
  });

  const handleGenerate = (count = 1) => {
    const prompt = selectedTemplate ? templates[selectedTemplate] : customPrompt;
    if (!prompt.trim()) {
      addError('Please select a template or enter a custom prompt');
      return;
    }
    generateMutation.mutate({ prompt, count });
  };

  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `thai-nexus-social-${Date.now()}-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      addSuccess('Image downloaded!');
    } catch (error) {
      addError('Failed to download image');
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < generatedImages.length; i++) {
      await downloadImage(generatedImages[i], i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to administrators.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      <SEOHead page="SocialMediaGenerator" />
      <div className="max-w-6xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 mb-4">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-purple-700 text-sm font-medium">AI-Powered Design</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Social Media Image Generator</h1>
        <p className="text-gray-600">Create professional marketing images for Thai Nexus</p>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Images</h2>

          <div className="space-y-6">
            <div>
              <Label className="text-gray-700 mb-2 block">Quick Templates</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirement">Retirement Visa Ad</SelectItem>
                  <SelectItem value="dtv">DTV Digital Nomad Ad</SelectItem>
                  <SelectItem value="business">Business Visa Ad</SelectItem>
                  <SelectItem value="marriage">Marriage Visa Ad</SelectItem>
                  <SelectItem value="education">Education Visa Ad</SelectItem>
                  <SelectItem value="general">General Services Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <div>
              <Label className="text-gray-700 mb-2 block">Custom Prompt</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="h-32"
                disabled={!!selectedTemplate}
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about colors, text, style, and Thai elements
              </p>
            </div>

            <div className="border-t pt-6 space-y-3">
                <Button
                onClick={() => handleGenerate(1)}
                disabled={generateMutation.isPending}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white h-12"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate 1 Image
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleGenerate(3)}
                disabled={generateMutation.isPending}
                variant="outline"
                className="w-full h-12"
              >
                Generate 3 Variations
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Generated Images</h2>
            {generatedImages.length > 0 && (
              <Button
                onClick={downloadAll}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            )}
          </div>

          {generatedImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600">No images generated yet</p>
              <p className="text-gray-500 text-sm mt-2">Select a template or write a prompt to get started</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {generatedImages.map((url, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto"
                  />
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Image {index + 1}</span>
                    <Button
                      onClick={() => downloadImage(url, index)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="font-bold text-gray-900 mb-3">💡 Tips for Great Images</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Include &quot;Thai Nexus&quot; or company branding in the prompt</li>
          <li>• Specify image dimensions or aspect ratio (e.g., &quot;square for Instagram&quot;, &quot;wide for Facebook&quot;)</li>
          <li>• Mention specific Thai elements: temples, beaches, Bangkok skyline</li>
          <li>• Use professional, trustworthy tone descriptions</li>
          <li>• Specify text overlay content and placement</li>
          <li>• Generate multiple variations to choose the best one</li>
        </ul>
      </GlassCard>
      </div>
    </>
  );
}