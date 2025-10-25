"use client";

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Search, ArrowLeft, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FeatureFlags } from '@/lib/config/flags';
import type { ScriptureSearchResult } from '@/lib/scripture';
import { toast } from 'sonner';
import {
  createShareAction,
  getPassagePreviewAction,
  searchScriptureAction,
} from './actions';

type Step = 'search' | 'preview' | 'complete';

type ViewerSummary = {
  id: string;
  name?: string;
  email?: string;
};

type ShareClientProps = {
  viewer: ViewerSummary;
  featureFlags: FeatureFlags;
};

export function ShareClient({ viewer, featureFlags }: ShareClientProps) {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScriptureSearchResult[]>([]);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<Awaited<
    ReturnType<typeof getPassagePreviewAction>
  > | null>(null);
  const [reflection, setReflection] = useState('');
  const [includeReflection, setIncludeReflection] = useState(featureFlags.shareReflection);
  const [isSearching, startSearching] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const viewerLabel = viewer.name ?? viewer.email ?? 'Friend';

  const canSubmitReflection = useMemo(() => {
    if (!includeReflection) {
      return true;
    }
    return reflection.trim().length > 0 && reflection.trim().length <= 160;
  }, [includeReflection, reflection]);

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    startSearching(async () => {
      try {
        const results = await searchScriptureAction(query);
        setSearchResults(results);
        if (results.length === 0) {
          toast.info('No passages matched your search. Try another phrase or reference.');
        }
      } catch (error) {
        toast.error('We were not able to search the WEB translation right now.');
      }
    });
  }, [searchQuery]);

  const handleSelectPassage = useCallback((result: ScriptureSearchResult) => {
    setSelectedReference(result.reference);
    setStep('preview');
    startSearching(async () => {
      try {
        const passage = await getPassagePreviewAction(result.reference);
        setSelectedPassage(passage);
      } catch (error) {
        toast.error('Unable to load the passage preview.');
        setStep('search');
      }
    });
  }, []);

  const handleShare = useCallback(() => {
    if (!selectedReference) {
      toast.error('Please select a passage before sharing.');
      return;
    }

    startSubmitting(async () => {
      try {
        await createShareAction({
          userId: viewer.id,
          reference: selectedReference,
          reflection: reflection.trim(),
          includeReflection,
        });
        setStep('complete');
        setReflection('');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPassage(null);
        setSelectedReference(null);
        toast.success('Your Scripture has been shared to the community feed.');
      } catch (error) {
        toast.error('We were not able to share this at the moment. Please try again soon.');
      }
    });
  }, [includeReflection, reflection, selectedReference, viewer.id]);

  const resetWorkflow = useCallback(() => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedReference(null);
    setSelectedPassage(null);
    setReflection('');
  }, []);

  const showAudioPrompt = featureFlags.shareAudioPreview && step === 'preview';

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/feed">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-golden" />
            <span className="font-semibold">GO&apos;EL</span>
          </div>
          <span className="hidden text-sm text-white/60 sm:block">Sharing as {viewerLabel}</span>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Share Scripture</h1>
          <p className="mt-2 text-white/60">
            Let the Word encourage and edify the community.
          </p>
          <p className="mt-2 text-sm text-white/50">Signed in as {viewerLabel}</p>
        </div>

        <Card className="w-full rounded-2xl border-white/10 bg-white/5 p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="search">Search for a passage or enter a reference</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="e.g., John 3:16 or 'steadfast love'"
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button type="submit" className="w-full bg-golden text-black hover:bg-golden/90" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </Card>

        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer rounded-2xl border-white/10 bg-white/5 p-5 hover:bg-white/[0.08]"
                  onClick={() => handleSelectPassage(result)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-golden">{result.reference}</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/50">{result.translation}</span>
                  </div>
                  <p className="mt-3 font-serif text-white/80">“{result.highlight}”</p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 'preview' && selectedPassage && (
            <motion.section
              key="preview"
              className="mt-8 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="rounded-2xl border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-golden">
                    {selectedPassage.reference.book} {selectedPassage.reference.chapter}:
                    {selectedPassage.reference.startVerse}
                    {selectedPassage.reference.endVerse &&
                    selectedPassage.reference.endVerse !== selectedPassage.reference.startVerse
                      ? `-${selectedPassage.reference.endVerse}`
                      : ''}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep('search')}>
                    Choose another passage
                  </Button>
                </div>
                <p className="mt-4 font-serif text-lg leading-relaxed text-white/85">
                  “{selectedPassage.verses.map((verse) => verse.text).join(' ')}”
                </p>
              </Card>

              {featureFlags.shareReflection && (
                <Card className="rounded-2xl border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Label htmlFor="reflection-toggle" className="text-lg">
                      Add a reflection
                    </Label>
                    <Switch
                      id="reflection-toggle"
                      checked={includeReflection}
                      onCheckedChange={(checked) => setIncludeReflection(checked)}
                    />
                  </div>

                  {includeReflection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <Textarea
                        value={reflection}
                        onChange={(event) => setReflection(event.target.value)}
                        placeholder="Share a brief reflection (max 160 characters)"
                        maxLength={160}
                        className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      />
                      <div className="flex items-center justify-between text-sm text-white/50">
                        <span>Keep the focus on Christ and the passage itself.</span>
                        <span>{reflection.trim().length} / 160</span>
                      </div>
                    </motion.div>
                  )}
                </Card>
              )}

              {showAudioPrompt && (
                <Card className="rounded-2xl border-white/10 bg-black/40 p-5">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <Volume2 className="h-5 w-5 text-golden" />
                    <p>Audio narration is in private beta. We&apos;ll let you know once it is ready.</p>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep('search')} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  className="bg-golden text-black hover:bg-golden/90"
                  onClick={handleShare}
                  disabled={isSubmitting || !canSubmitReflection}
                >
                  {isSubmitting ? 'Sharing...' : 'Share to Feed'}
                </Button>
              </div>
            </motion.section>
          )}

          {step === 'complete' && (
            <motion.section
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-10"
            >
              <Card className="rounded-2xl border-white/10 bg-white/5 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-golden/40 bg-golden/10">
                  <Check className="h-8 w-8 text-golden" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-golden">Scripture Shared</h3>
                <p className="mt-3 text-white/70">
                  Thank you for stewarding the Word with reverence. Your passage is now blessing the community.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/feed">
                    <Button className="bg-golden text-black hover:bg-golden/90">Return to Feed</Button>
                  </Link>
                  <Button variant="ghost" onClick={resetWorkflow}>
                    Share another passage
                  </Button>
                </div>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
