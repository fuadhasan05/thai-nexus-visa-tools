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
      await signUp(email, password);
      // On sign up, Supabase often requires email confirmation. Redirect user to a welcome/verification page or home.
      router.replace('/');
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
