"use client";

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FeatureFlags } from '@/lib/config/flags';
import { createShareAction } from './actions';

type ViewerSummary = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type ShareClientProps = {
  viewer: ViewerSummary;
  featureFlags: FeatureFlags;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

export function ShareClient({ viewer }: ShareClientProps) {
  const [reference, setReference] = useState('');
  const [passageText, setPassageText] = useState('');
  const [testimony, setTestimony] = useState('');
  const [isSubmitting, startSubmitting] = useTransition();

  const viewerLabel = viewer.name ?? viewer.email ?? 'Friend';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSubmitting(async () => {
      try {
        await createShareAction({
          userId: viewer.id,
          reference,
          passageText,
          testimony: testimony.trim() ? testimony.trim() : undefined,
        });

        toast.success('Your Scripture has been shared with the community.');
        setReference('');
        setPassageText('');
        setTestimony('');
      } catch (error) {
        toast.error(
          getErrorMessage(error, 'We were not able to share this Scripture right now. Please try again.')
        );
      }
    });
  };

  const passageCharCount = passageText.trim().length;
  const testimonyCharCount = testimony.trim().length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16">
        <header className="space-y-3 text-center lg:text-left">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">Share the Word</p>
          <h1 className="text-3xl font-semibold text-golden">Lift Jesus through Scripture and testimony</h1>
          <p className="text-white/70">
            {viewerLabel}, bring a verse that is shaping you this week and let the community hear how it
            is bearing fruit. Include the verse text itself, and add a short testimony if you wish.
          </p>
        </header>

        <Card className="rounded-3xl border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reference" className="text-lg">
                Scripture reference
              </Label>
              <Input
                id="reference"
                placeholder="e.g. John 15:4-5"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={80}
                required
                className="border-white/15 bg-black/40 text-white placeholder:text-white/40"
              />
              <p className="text-sm text-white/50">Provide the book, chapter, and verse range you are sharing.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passageText" className="text-lg">
                Verse text
              </Label>
              <Textarea
                id="passageText"
                value={passageText}
                onChange={(event) => setPassageText(event.target.value)}
                placeholder="Write the verse exactly as you will share it."
                minLength={12}
                maxLength={1200}
                rows={5}
                required
                className="border-white/15 bg-black/40 text-white placeholder:text-white/40"
              />
              <div className="flex items-center justify-between text-sm text-white/50">
                <span>Include the words of the verse so others can meditate on them.</span>
                <span>{passageCharCount} / 1200</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testimony" className="text-lg">
                Testimony (optional)
              </Label>
              <Textarea
                id="testimony"
                value={testimony}
                onChange={(event) => setTestimony(event.target.value)}
                placeholder="Share how this verse is speaking to you right now."
                maxLength={600}
                rows={4}
                className="border-white/15 bg-black/40 text-white placeholder:text-white/40"
              />
              <div className="flex items-center justify-between text-sm text-white/50">
                <span>Keep Christ at the center. Point back to the Scripture.</span>
                <span>{testimonyCharCount} / 600</span>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <Link href="/feed" className="sm:w-auto">
                <Button type="button" variant="ghost" className="w-full sm:w-auto">
                  Return to feed
                </Button>
              </Link>
              <Button
                type="submit"
                className="w-full bg-golden text-black hover:bg-golden/90 sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sharing...' : 'Post to community feed'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
