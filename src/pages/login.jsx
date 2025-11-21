/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const result = await signIn(email, password);
      if (result?.user) {
        router.replace('/');
      } else {
        // No immediate session (maybe OAuth or email confirmation flow), let effect handle redirect
        // But provide feedback
        setLocalError('Login successful — finishing authentication. If you are not redirected, refresh the page.');
      }
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  const handleGoogle = async () => {
    if (typeof window === 'undefined') return;

    if (!supabase || !supabase.auth || typeof supabase.auth.signInWithOAuth !== 'function') {
      setLocalError('Authentication is not configured on this deployment. Contact site admin.');
      return;
    }

    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });

      // Supabase v2 returns { data, error } — show friendly error if provider disabled
      if (result?.error) {
        setLocalError(result.error.message || 'OAuth sign-in failed');
      }
    } catch (err) {
      setLocalError(err?.message || 'OAuth sign-in failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img 
                src="/thai-nexus-favicon.png" 
                alt="Thai Nexus Logo"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Thai Nexus Visa Hub
            </h1>
            <p className="text-gray-600">
              Sign in to continue
            </p>
          </div>

          {/* Google Sign In */}
          <Button 
            onClick={handleGoogle} 
            type="button"
            className="w-full py-3 flex items-center justify-center gap-3 border bg-white border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FcGoogle className="w-5 h-5" />
            <span className="font-medium text-black">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@example.com" 
                  required 
                  className="pl-10 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="pl-10 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {(localError || error) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {localError || error?.message}
              </div>
            )}

            {/* Sign In Button */}
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-[#0f1724] hover:bg-[#0f1724] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-between text-sm pt-2">
            <a 
              href="/forgot-password" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </a>
            <div className="text-gray-600">
              Need an account?{' '}
              <a 
                href="/signup" 
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}