
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, X, Send, Loader2, AlertCircle, Phone, Mail } from 'lucide-react';

// Lightweight markdown renderer to avoid heavy/TS-typed dependencies in node_modules.
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/\'/g, "&#039;");
}

function renderMarkdown(md) {
  if (!md) return '';
  let out = escapeHtml(md);
  // simple bold **text**
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // simple italics *text*
  out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // links [text](url)
  out = out.replace(/\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // line breaks -> paragraphs
  out = out.split(/\n\n+/).map(p => '<p>' + p.replace(/\n/g, '<br/>') + '</p>').join('');
  return out;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [anonymousCredits, setAnonymousCredits] = useState(5);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user-ai'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) return null;
        return data?.user ?? null;
      } catch (error) {
        return null;
      }
    },
    retry: false
  });

  const { data: credits } = useQuery({
    queryKey: ['user-credits-ai', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('UserCredits')
        .select('*')
        .eq('user_email', user.email)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        const defaultRecord = {
          user_email: user.email,
          credits: user?.role === 'admin' ? 1000 : 5,
          credits_used: 0,
          credits_purchased: 0,
          transaction_history: []
        };
        const { data: inserted, error: insertError } = await supabase
          .from('UserCredits')
          .insert(defaultRecord)
          .select()
          .single();
        if (insertError) throw insertError;
        return inserted;
      }
      return data[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (!user) {
      const stored = sessionStorage.getItem('anonymous_credits');
      if (stored) {
        setAnonymousCredits(parseInt(stored));
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('anonymous_credits', anonymousCredits.toString());
    }
  }, [anonymousCredits, user]);

  const askAIMutation = useMutation({
    mutationFn: async (question) => {
      if (user) {
        if (!credits || credits.credits < 1) {
          throw new Error('Insufficient credits. Top up in your Profile to continue.');
        }
      } else {
        if (anonymousCredits < 1) {
          throw new Error('Out of free credits. Please login to continue using AI Assistant.');
        }
      }

      // Invoke server-side AI endpoint. Implement `/api/invoke-openai` to call OpenAI securely.
      const payload = {
        prompt: question,
        conversation_history: messages.filter(m => m.role !== 'error').map(m => ({ role: m.role, content: m.content })),
        response_json_schema: {
          type: 'object',
          properties: { answer: { type: 'string' } },
          required: ['answer']
        }
      };

      const res = await fetch('/api/invoke-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'AI invocation failed');
      }

      const response = await res.json();

      if (user && credits) {
        const updated = {
          credits: (credits.credits || 0) - 1,
          credits_used: (credits.credits_used || 0) + 1,
          transaction_history: [
            ...(credits.transaction_history || []),
            {
              amount: 1,
              type: 'used',
              description: 'AI Assistant question',
              date: new Date().toISOString()
            }
          ]
        };

        const { error } = await supabase
          .from('UserCredits')
          .update(updated)
          .eq('id', credits.id);
        if (error) throw error;
      } else {
        setAnonymousCredits(prev => prev - 1);
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-credits-ai'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error) => {
      console.error('AI Assistant error:', error);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || askAIMutation.isPending) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await askAIMutation.mutateAsync(inputMessage);
      
      console.log('AI Response received:', response);
      
      // Check if response is valid
      if (!response) {
        throw new Error('Empty response from AI');
      }

      // Check for error in response
      if (response.error || response.data?.error) {
        const error = response.error || response.data?.error;
        console.error('OpenAI error:', error);
        setMessages(prev => [...prev, { 
          role: 'error', 
          content: `Sorry, I couldn't generate a response. ${error}. Please try rephrasing your question.`
        }]);
        return;
      }

      // Extract answer from response - CHECK response.data FIRST (Axios response structure)
      let answerText;
      
      if (response.data?.answer) {
        // Most common case: base44.functions.invoke returns {data: {answer: "..."}}
        answerText = response.data.answer;
      } else if (response.answer) {
        // Direct answer property
        answerText = response.answer;
      } else if (typeof response.data === 'string') {
        // If response.data is a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(response.data);
          answerText = parsed.answer;
        } catch {
          answerText = response.data;
        }
      } else if (typeof response === 'string') {
        // If response itself is a string, try to parse it
        try {
          const parsed = JSON.parse(response);
          answerText = parsed.answer;
        } catch {
          answerText = response;
        }
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response format from AI');
      }

      // Validate we have actual content
      if (!answerText || answerText.trim().length === 0) {
        console.error('Empty answer in response:', response);
        throw new Error('Received empty response from AI');
      }

      // Clean up any escaped newlines
      answerText = answerText.replace(/\\n/g, '\n').trim();

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: answerText
      }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Sorry, I had trouble understanding the response. Please try asking your question again.' 
      }]);
    }
  };

  const currentCredits = user ? (credits?.credits || 0) : anonymousCredits;
  const isOutOfCredits = currentCredits < 1;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        <Sparkles className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 p-4 sm:p-0 flex items-center justify-center sm:block">
      <div className="w-full h-full sm:w-[420px] sm:h-[600px] max-w-[500px] max-h-[700px] bg-white rounded-3xl shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg">Thai Immigration Assistant</div>
              <div className="text-xs opacity-90 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {user ? `${currentCredits} credits` : `${currentCredits} free questions left`}
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Expert Visa Guidance</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4">Professional immigration assistance powered by Thai Nexus</p>
              <div className="space-y-2 text-left">
                {[
                  'Retirement visa requirements & procedures',
                  'Work permits & business setup',
                  'DTV for digital nomads',
                  'Marriage & family visas',
                  'Complex cases & rejections'
                ].map((item, i) => (
                  <p key={i} className="text-xs text-gray-600">• {item}</p>
                ))}
              </div>
              {!user && (
                <p className="text-xs text-purple-600 mt-4 font-medium">
                  {anonymousCredits} free questions - No login required
                </p>
              )}
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'error' ? (
                <div className="max-w-[85%] bg-red-50 border border-red-200 rounded-2xl p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{msg.content}</p>
                  </div>
                </div>
              ) : msg.role === 'user' ? (
                <div className="max-w-[85%] bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-md">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[85%]">
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow-sm prose prose-sm max-w-none">
                    <div className="prose prose-sm max-w-none text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {askAIMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t-2 border-gray-100 bg-white">
          {isOutOfCredits ? (
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-700 font-medium mb-1">
                  {user ? 'Out of Credits' : 'Free Trial Complete'}
                </p>
                <p className="text-xs text-red-600">
                  {user ? 'Top up to continue' : 'Login to get 5 more free credits + purchase options'}
                </p>
              </div>
              {user ? (
                <Button 
                  onClick={() => window.location.href = '/Profile'}
                  size="sm" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm"
                >
                  Top Up Credits (2 THB each)
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
                    }
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm"
                >
                  Login for 5 More Free Credits
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about visas, documents, procedures..."
                  className="flex-1 rounded-xl border-2 border-gray-200 focus:border-purple-400 text-sm"
                  disabled={askAIMutation.isPending}
                />
                <Button 
                  onClick={handleSend}
                  disabled={askAIMutation.isPending || !inputMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-3 sm:px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>1 credit per question</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <a href="https://wa.me/66923277723" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="hidden sm:inline">Thai Nexus</span>
                  </a>
                  <a href="mailto:contact@thainexus.co.th" className="text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span className="hidden sm:inline">Email</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
