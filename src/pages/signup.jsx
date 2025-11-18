/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, error, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    try {
      const result = await signUp(email, password, { username });
      
      // FIX: If user was created but profile insert failed on client, call API endpoint to create profile via service role
      if (result?.user && result?.needsProfileCreation) {
        console.log('[Signup] Profile creation failed on client, attempting via API endpoint...');
        try {
          const apiResponse = await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: result.user.id,
              email: result.user.email || email,
              username: username,
            }),
          });
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log('[Signup] Profile created via API:', apiData);
          } else {
            const apiError = await apiResponse.json();
            console.warn('[Signup] API profile creation failed:', apiError);
            // Don't block signup redirect even if profile API fails
          }
        } catch (apiErr) {
          console.error('[Signup] Error calling profile API:', apiErr);
          // Continue with redirect even if API call fails
        }
      }
      
      // Redirect if user was created
      if (result?.user) {
        router.replace('/');
      } else {
        // No user returned (email confirmation may be required)
        setLocalError('Account created! Please check your email to confirm your account before signing in.');
      }
    } catch (err) {
      setLocalError(err.message || 'Sign up failed');
    }
  };

  // Note: Google OAuth option intentionally omitted on this screen per design

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </div>

          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img src="/thai-nexus-favicon.png" alt="Thai Nexus" className="w-16 h-16 object-cover rounded-full" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#272262] mb-1">Create your account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required className="pl-10 py-3" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Username</Label>
              <div className="relative">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Display name" required className="py-3" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Min. 8 characters" required className="pl-10 py-3" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Re-enter password" required className="pl-10 py-3" />
              </div>
            </div>

            {(localError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{localError || error?.message}</div>
            )}

            <div>
              <Button type="submit" className="w-full py-3 bg-[#0f1724] text-white">{loading ? 'Creating...' : 'Create account'}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
