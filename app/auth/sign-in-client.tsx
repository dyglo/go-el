"use client";

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { requestMagicLinkAction, completeMagicLinkAction, oauthSignInAction } from './actions';

export function SignInClient() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCompleting, startCompleting] = useTransition();

  const handleRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await requestMagicLinkAction({ email });
        setToken(result.token);
        toast.success('Magic link generated. Check your inbox.');
      } catch (error) {
        toast.error('Unable to send magic link. Please try again.');
      }
    });
  };

  const handleComplete = () => {
    if (!token) {
      toast.error('Request a magic link first.');
      return;
    }
    startCompleting(async () => {
      try {
        await completeMagicLinkAction({ token });
        toast.success('Signed in successfully.');
        window.location.href = '/feed';
      } catch (error) {
        toast.error('Magic link expired or invalid. Request a new one.');
      }
    });
  };

  const handleOAuth = (provider: 'google' | 'apple') => {
    startTransition(async () => {
      try {
        await oauthSignInAction({ provider });
        toast.success(`Signed in with ${provider}.`);
        window.location.href = '/feed';
      } catch (error) {
        toast.error('OAuth sign-in failed. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">Welcome back to GO&apos;EL</h1>
          <p className="mt-2 text-white/60">
            Use a magic link or connect with a provider to continue sharing Scripture.
          </p>
        </div>

        <Card className="w-full rounded-2xl border-white/10 bg-white/5 p-6">
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-golden text-black hover:bg-golden/90" disabled={isPending}>
              {isPending ? 'Sending...' : 'Send magic link'}
            </Button>
          </form>

          {token && (
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
              <p className="text-white/70">
                We&apos;ve sent a sign-in link to <span className="text-golden">{email}</span>. For local testing, use this token:
              </p>
              <code className="block rounded bg-black/60 px-3 py-2 text-center text-golden">{token}</code>
              <Button
                type="button"
                onClick={handleComplete}
                className="w-full"
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete sign-in'}
              </Button>
            </div>
          )}
        </Card>

        <div className="mt-6 w-full space-y-3">
          <Button
            variant="outline"
            className="w-full border-white/15 text-white"
            onClick={() => handleOAuth('google')}
            disabled={isPending}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full border-white/15 text-white"
            onClick={() => handleOAuth('apple')}
            disabled={isPending}
          >
            Continue with Apple
          </Button>
        </div>

        <p className="mt-8 text-sm text-white/50">
          By continuing you agree to our community covenant. Read it on the{' '}
          <Link href="/" className="text-golden hover:text-golden/80">
            home page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
