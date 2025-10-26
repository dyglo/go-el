"use client";

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  completeMagicLinkAction,
  oauthSignInAction,
  passwordSignInAction,
  passwordSignUpAction,
  requestMagicLinkAction,
} from './actions';

type AuthMode = 'signin' | 'signup';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function SignInClient() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isMagicPending, startMagicTransition] = useTransition();
  const [isCompleting, startCompleting] = useTransition();

  const handlePasswordSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startPasswordTransition(async () => {
      try {
        await passwordSignInAction({ email: signInEmail, password: signInPassword });
        toast.success('Signed in successfully.');
        window.location.href = '/feed';
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to sign in with email and password.'));
      }
    });
  };

  const handlePasswordSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startPasswordTransition(async () => {
      try {
        await passwordSignUpAction({ name: signUpName, email: signUpEmail, password: signUpPassword });
        toast.success("Account created. Welcome to GO'EL!");
        window.location.href = '/feed';
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to create your account. Please try again.'));
      }
    });
  };

  const handleMagicLinkRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startMagicTransition(async () => {
      try {
        const result = await requestMagicLinkAction({ email: magicEmail });
        setToken(result.token);
        toast.success('Magic link generated. Check your inbox.');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to send magic link. Please try again.'));
      }
    });
  };

  const handleMagicLinkComplete = () => {
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
        toast.error(getErrorMessage(error, 'Magic link expired or invalid. Request a new one.'));
      }
    });
  };

  const handleOAuth = (provider: 'google' | 'apple') => {
    startMagicTransition(async () => {
      try {
        await oauthSignInAction({ provider });
        toast.success(`Signed in with ${provider}.`);
        window.location.href = '/feed';
      } catch (error) {
        toast.error(getErrorMessage(error, 'OAuth sign-in failed. Please try again.'));
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-4 py-16 lg:flex-row">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-semibold">Welcome to GO&apos;EL</h1>
            <p className="mt-2 text-white/60">
              Sign in with your email and password, create a new account, or continue with a provider.
            </p>
          </div>

          <Card className="rounded-2xl border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex gap-2 rounded-xl bg-black/30 p-1">
              <Button
                type="button"
                variant={authMode === 'signin' ? 'default' : 'ghost'}
                className={`flex-1 ${authMode === 'signin' ? 'bg-golden text-black hover:bg-golden/90' : 'text-white hover:bg-white/10'}`}
                onClick={() => setAuthMode('signin')}
                disabled={isPasswordPending}
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant={authMode === 'signup' ? 'default' : 'ghost'}
                className={`flex-1 ${authMode === 'signup' ? 'bg-golden text-black hover:bg-golden/90' : 'text-white hover:bg-white/10'}`}
                onClick={() => setAuthMode('signup')}
                disabled={isPasswordPending}
              >
                Create account
              </Button>
            </div>

            {authMode === 'signin' ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sign-in-email">Email</Label>
                  <Input
                    id="sign-in-email"
                    type="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-in-password">Password</Label>
                  <Input
                    id="sign-in-password"
                    type="password"
                    value={signInPassword}
                    onChange={(event) => setSignInPassword(event.target.value)}
                    placeholder="••••••••"
                    className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-golden text-black hover:bg-golden/90" disabled={isPasswordPending}>
                  {isPasswordPending ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sign-up-name">Name</Label>
                  <Input
                    id="sign-up-name"
                    type="text"
                    value={signUpName}
                    onChange={(event) => setSignUpName(event.target.value)}
                    placeholder="Your full name"
                    className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-email">Email</Label>
                  <Input
                    id="sign-up-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-password">Password</Label>
                  <Input
                    id="sign-up-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(event) => setSignUpPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-golden text-black hover:bg-golden/90" disabled={isPasswordPending}>
                  {isPasswordPending ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}
          </Card>

          <div className="w-full space-y-3">
            <Button
              variant="outline"
              className="w-full border-white/15 text-white"
              onClick={() => handleOAuth('google')}
              disabled={isMagicPending}
            >
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/15 text-white"
              onClick={() => handleOAuth('apple')}
              disabled={isMagicPending}
            >
              Continue with Apple
            </Button>
          </div>
        </div>

        <Card className="w-full max-w-md rounded-2xl border-white/10 bg-white/5 p-6">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold">Prefer a magic link?</h2>
            <p className="text-sm text-white/60">
              We will email you a secure one-time link. Keep this handy for quick access.
            </p>
          </div>
          <form onSubmit={handleMagicLinkRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                value={magicEmail}
                onChange={(event) => setMagicEmail(event.target.value)}
                placeholder="you@example.com"
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-white/10 text-white hover:bg-white/20" disabled={isMagicPending}>
              {isMagicPending ? 'Sending...' : 'Send magic link'}
            </Button>
          </form>

          {token && (
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
              <p className="text-white/70">
                We&apos;ve sent a sign-in link to <span className="text-golden">{magicEmail}</span>. For local testing, use this token:
              </p>
              <code className="block rounded bg-black/60 px-3 py-2 text-center text-golden">{token}</code>
              <Button type="button" onClick={handleMagicLinkComplete} className="w-full" disabled={isCompleting}>
                {isCompleting ? 'Completing...' : 'Complete sign-in'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <p className="pb-12 text-center text-sm text-white/50">
        By continuing you agree to our community covenant. Read it on the{' '}
        <Link href="/" className="text-golden hover:text-golden/80">
          home page
        </Link>
        .
      </p>
    </div>
  );
}
