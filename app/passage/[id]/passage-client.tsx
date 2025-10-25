"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  Copy,
  Download,
  Palette,
  Share2,
  Type,
  Volume2,
} from 'lucide-react';
import type { FeatureFlags } from '@/lib/config/flags';
import type { Passage } from '@/lib/scripture';

const themes = [
  {
    id: 'pure-black',
    name: 'Pure Black',
    container: 'bg-black text-white',
    card: 'bg-black',
  },
  {
    id: 'midnight',
    name: 'Midnight Focus',
    container: 'bg-[#050505] text-[#f5f5f5]',
    card: 'bg-[#0f0f0f]',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    container: 'bg-[#f4ecd8] text-[#4b3d2b]',
    card: 'bg-[#f0e4c8]',
  },
] as const;

type ThemeOption = (typeof themes)[number];

type PassageClientProps = {
  passage: Passage;
  featureFlags: FeatureFlags;
};

export function PassageClient({ passage, featureFlags }: PassageClientProps) {
  const [theme, setTheme] = useState<ThemeOption>(themes[0]);
  const [fontSize, setFontSize] = useState([20]);
  const [copied, setCopied] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = {
      id: passage.id,
      reference: passage.reference,
      plainText: passage.plainText,
      cachedAt: new Date().toISOString(),
    };

    try {
      const registryKey = 'goel:passage:index';
      const cacheKey = `goel:passage:${passage.id}`;
      const existingRaw = window.localStorage.getItem(registryKey);
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      const existingIds = Array.isArray(parsed) ? (parsed as string[]) : [];
      const filtered = existingIds.filter((id) => id !== passage.id);
      const nextIds = [passage.id, ...filtered];
      const trimmed = nextIds.slice(0, 50);
      const overflow = nextIds.slice(50);

      window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      window.localStorage.setItem(registryKey, JSON.stringify(trimmed));

      overflow.forEach((staleId) => {
        window.localStorage.removeItem(`goel:passage:${staleId}`);
      });
    } catch {
      // Ignore write failures (e.g., private browsing mode)
    }
  }, [passage]);

  useEffect(() => {
    if (!speechReady) {
      return;
    }

    const handleEnd = () => setIsSpeaking(false);
    window.speechSynthesis.addEventListener('voiceschanged', handleEnd);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleEnd);
    };
  }, [speechReady]);

  const referenceLabel = useMemo(() => {
    const { book, chapter, startVerse, endVerse } = passage.reference;
    if (endVerse && endVerse !== startVerse) {
      return `${book} ${chapter}:${startVerse}-${endVerse}`;
    }
    return `${book} ${chapter}:${startVerse}`;
  }, [passage.reference]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${passage.plainText}"\n\n${referenceLabel} (${passage.translation})`);
      setCopied(true);
      toast.success('Passage copied to your clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Unable to copy right now. Please try again.');
    }
  };

  const handleSpeak = () => {
    if (!speechReady) {
      toast.info('Audio narration is coming soon for this passage.');
      return;
    }

    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${passage.plainText}. ${referenceLabel}`);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('There was a problem narrating this passage.');
    };

    synth.cancel();
    synth.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.container}`}>
      <header className="border-b border-current/10">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/feed">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-5 w-5 text-golden" />
            <span className="font-semibold">GO&apos;EL Passage Viewer</span>
          </div>
          <Badge variant="outline" className="border-current/20 text-xs uppercase tracking-[0.3em]">
            {passage.translation}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold">{referenceLabel}</h1>
            <p className="mt-2 text-sm opacity-70">{passage.translation}</p>
          </div>

          <Card className={`rounded-3xl border-current/15 p-6 md:p-10 ${theme.card}`}>
            <div
              className="font-serif whitespace-pre-line leading-relaxed"
              style={{ fontSize: `${fontSize[0]}px`, lineHeight: 1.8 }}
            >
              {passage.verses.map((verse) => `${verse.text} `)}
            </div>
          </Card>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className={`rounded-2xl border-current/15 p-5 ${theme.card}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4 text-golden" />
                  <span>Font Size</span>
                </div>
                <span className="text-xs opacity-60">{fontSize[0]}px</span>
              </div>
              <Slider value={fontSize} onValueChange={setFontSize} min={16} max={30} step={2} className="mt-4" />
            </Card>

            <Card className={`rounded-2xl border-current/15 p-5 ${theme.card}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="h-4 w-4 text-golden" />
                  <span>Reading Theme</span>
                </div>
                <Button variant="ghost" size="sm">
                  {theme.name}
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {themes.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      theme.id === option.id ? 'border-golden' : 'border-transparent opacity-70'
                    }`}
                  >
                    <div className="text-sm font-medium">{option.name}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleCopy} className="flex-1 bg-golden text-black hover:bg-golden/90">
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied' : 'Copy Passage'}
            </Button>
            <Button variant="outline" className="flex-1 border-current/15" disabled>
              <Share2 className="mr-2 h-4 w-4" />
              Share (Coming Soon)
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-current/15"
              onClick={handleSpeak}
              disabled={!speechReady && !featureFlags.audioNarration}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              {isSpeaking ? 'Stop' : 'Listen'}
            </Button>
          </div>

          <div className="mt-8 rounded-2xl border-current/15 bg-black/20 p-5 text-sm opacity-80">
            Scripture from the World English Bible (Public Domain)
          </div>
        </motion.section>
      </main>
    </div>
  );
}
