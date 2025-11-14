
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [pageUrl, setPageUrl] = useState('');
  const [formData, setFormData] = useState({
    report_type: 'incorrect_information',
    message: '',
    user_email: ''
  });

  // Initialize on client only
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set initial window size and page URL
    const initialWidth = window.innerWidth < 768;
    if (initialWidth !== isMobile) setIsMobile(initialWidth);
    if (pageUrl !== window.location.href) setPageUrl(window.location.href);

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, page_url: pageUrl };
      const { data: inserted, error } = await supabase.from('FeedbackReport').insert(payload).select().single();
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({
          report_type: 'incorrect_information',
          message: '',
          user_email: ''
        });
      }, 2000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const exampleMessages = {
    incorrect_information: "The information about retirement visa requirements on this page appears outdated. According to Thai Immigration, the current process is...",
    broken_link: "The link to the official Thai Immigration website is not working properly.",
    general_feedback: "I found this tool very helpful! It would be great if you could add...",
    contact_request: "I would like to speak with a visa specialist about my specific situation regarding...",
    technical_issue: "The page is not loading correctly on my mobile device. I see..."
  };

  return (
    <>
      <div 
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transform: isHovered 
            ? 'translateX(0) translateY(-50%)' 
            : !isMobile 
              ? 'translateX(calc(100% - 80px)) translateY(-50%)' 
              : 'translateX(calc(100% - 32px)) translateY(-50%)' 
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-6 py-3 md:py-4 rounded-l-xl shadow-lg flex items-center gap-2 md:gap-3 transition-all"
        >
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          </div>
          <div className="text-left hidden md:block">
            <div className="font-bold text-sm">Report Issue</div>
            <div className="text-xs opacity-90">Help us improve</div>
          </div>
          <div className="text-left md:hidden">
            <div className="font-bold text-xs">Report</div>
          </div>
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="feedback-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Report an Issue or Send Feedback
            </DialogTitle>
          </DialogHeader>

          <div id="feedback-description" className="sr-only">
            Submit feedback or report issues with the Thai Nexus Visa Hub. Choose a category and describe the problem or suggestion.
          </div>

          {submitted ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted. We will review it shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Current Page:</strong> {pageUrl}
                </p>
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">What type of feedback is this?</Label>
                <Select 
                  value={formData.report_type} 
                  onValueChange={(val) => setFormData({ ...formData, report_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incorrect_information">Incorrect Information</SelectItem>
                    <SelectItem value="broken_link">Broken Link</SelectItem>
                    <SelectItem value="general_feedback">General Feedback</SelectItem>
                    <SelectItem value="contact_request">Contact Request</SelectItem>
                    <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">Your Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={exampleMessages[formData.report_type]}
                  rows={6}
                  required
                  className="resize-none"
                />
              </div>

              <div>
                <Label className="text-gray-700 mb-2 block">Your Email (optional - for follow-up)</Label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
