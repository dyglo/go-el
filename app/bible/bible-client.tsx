"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrimaryHeader } from '@/components/layout/primary-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BIBLE_BOOKS, type BibleBookMeta } from './book-data';
import { shareVerseFromBibleAction } from './actions';

const DEFAULT_VERSION_ID = 'en-web';
const BIBLE_API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api';
const BIBLE_VERSIONS_URL = `${BIBLE_API_BASE}/bibles/bibles.json`;
const CHAPTER_REQUEST_DEBOUNCE_MS = 300;
const MAX_SEQUENTIAL_VERSES = 200;
const SUPPORTED_LANGUAGE_CODES = new Set(['eng']); // We surface English translations today without renaming canonical IDs.
const VERSION_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

type BibleVersionMeta = {
  id: string;
  version?: string;
  description?: string;
  language?: {
    name?: string;
    code?: string | null;
  } | null;
  scope?: string;
};

function isValidVersionId(value: unknown): value is string {
  return typeof value === 'string' && VERSION_ID_PATTERN.test(value);
}

type Verse = {
  verse: number;
  text: string;
};

class HttpError extends Error {
  status: number;
  url: string;

  constructor(url: string, status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

class NetworkError extends Error {
  url: string;

  constructor(url: string, message?: string) {
    super(message ?? 'Network request failed.');
    this.name = 'NetworkError';
    this.url = url;
  }
}

class ParseError extends Error {
  url: string;

  constructor(url: string, message?: string) {
    super(message ?? 'Unable to parse response payload.');
    this.name = 'ParseError';
    this.url = url;
  }
}

class ChapterUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChapterUnavailableError';
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function extractVersionList(payload: unknown): BibleVersionMeta[] {
  const rawList: unknown[] | undefined = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' &&
        payload !== null &&
        Array.isArray((payload as { value?: unknown[] }).value)
      ? ((payload as { value?: unknown[] }).value as unknown[])
      : undefined;

  if (!rawList) {
    return [];
  }

  return rawList
    .filter((item): item is BibleVersionMeta => {
      return Boolean(
        item &&
          typeof item === 'object' &&
          typeof (item as { id?: unknown }).id === 'string'
      );
    })
    .map((item) => item);
}

type BibleClientProps = {
  viewer: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

function buildChapterUrl(version: string, book: BibleBookMeta, chapter: number) {
  // The slug stored on each book already matches the API folder naming, so we just interpolate it.
  return `${BIBLE_API_BASE}/bibles/${version}/books/${book.slug}/chapters/${chapter}.json`;
}

function buildVerseUrl(version: string, book: BibleBookMeta, chapter: number, verse: number) {
  return `${BIBLE_API_BASE}/bibles/${version}/books/${book.slug}/chapters/${chapter}/verses/${verse}.json`;
}

function getChapterCacheKey(version: string, book: BibleBookMeta, chapter: number) {
  return `${version}|${book.slug}|${chapter}`;
}

function cleanVerseText(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw.replace(/\s+/g, ' ').trim();
  }
  if (raw && typeof raw === 'object' && typeof (raw as { text?: unknown }).text === 'string') {
    return cleanVerseText((raw as { text?: unknown }).text);
  }
  return '';
}

function parseVerseNumber(value: unknown, fallback: number): number | null {
  const numeric = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function parseVerseCandidate(input: unknown, fallbackVerse: number): Verse | null {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    const text = cleanVerseText(input);
    if (!text) {
      return null;
    }
    return { verse: fallbackVerse, text };
  }

  if (typeof input !== 'object') {
    return null;
  }

  const candidate = input as { verse?: unknown; text?: unknown; value?: unknown };
  const verseNumber = parseVerseNumber(candidate.verse, fallbackVerse);
  const directText = cleanVerseText(candidate.text);
  const fromValueText = !directText && 'value' in candidate ? cleanVerseText(candidate.value) : '';
  const text = directText || fromValueText;

  if (!verseNumber || !text) {
    return null;
  }

  return { verse: verseNumber, text };
}

function normaliseVerses(input: unknown): Verse[] {
  const sources: unknown[] = [];

  if (Array.isArray(input)) {
    sources.push(...input);
  } else if (typeof input === 'object' && input !== null) {
    const container = input as {
      data?: unknown;
      verses?: unknown;
    };

    if (Array.isArray(container.data)) {
      sources.push(...container.data);
    }

    if (Array.isArray(container.verses)) {
      sources.push(...container.verses);
    } else if (container.verses && typeof container.verses === 'object') {
      sources.push(
        ...Object.entries(container.verses as Record<string, unknown>).map(([key, value]) => ({
          verse: key,
          value,
        }))
      );
    }

    if (sources.length === 0 && !('verses' in container) && !('data' in container)) {
      sources.push(
        ...Object.entries(container as Record<string, unknown>).map(([key, value]) => ({
          verse: key,
          value,
        }))
      );
    }

    if (sources.length === 0) {
      sources.push(container);
    }
  } else if (input != null) {
    sources.push(input);
  }

  if (sources.length === 0) {
    return [];
  }

  const parsed = sources
    .map((item, index) => parseVerseCandidate(item, index + 1))
    .filter((entry): entry is Verse => Boolean(entry && entry.text));

  if (parsed.length === 0) {
    return [];
  }

  const deduped = new Map<number, Verse>();
  parsed.forEach((entry) => {
    if (!deduped.has(entry.verse)) {
      deduped.set(entry.verse, entry);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => a.verse - b.verse);
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal, cache: 'no-store' });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new NetworkError(url);
  }

  if (!response.ok) {
    throw new HttpError(url, response.status);
  }

  try {
    return await response.json();
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ParseError(url);
  }
}

async function fetchVersesSequentially(
  version: string,
  book: BibleBookMeta,
  chapter: number,
  signal: AbortSignal
): Promise<Verse[]> {
  const verses: Verse[] = [];

  for (let index = 1; index <= MAX_SEQUENTIAL_VERSES; index += 1) {
    const verseUrl = buildVerseUrl(version, book, chapter, index);
    let response: Response;
    try {
      response = await fetch(verseUrl, { signal, cache: 'no-store' });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new NetworkError(verseUrl);
    }

    if (response.status === 404) {
      break;
    }

    if (!response.ok) {
      throw new HttpError(verseUrl, response.status);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new ParseError(verseUrl);
    }

    const parsed = normaliseVerses([payload]);

    if (parsed.length === 0) {
      break;
    }

    const verse = parsed[0];
    if (verse && verse.text) {
      verses.push(verse);
    }
  }

  return verses;
}

async function loadChapterWithFallback(params: {
  version: string;
  book: BibleBookMeta;
  chapter: number;
  signal: AbortSignal;
}): Promise<Verse[]> {
  const { version, book, chapter, signal } = params;
  const chapterUrl = buildChapterUrl(version, book, chapter);
  let payload: unknown | null = null;

  try {
    payload = await fetchJson(chapterUrl, signal);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    if (error instanceof HttpError) {
      if (error.status !== 404) {
        throw error;
      }
    } else if (error instanceof NetworkError) {
      throw error;
    } else if (error instanceof ParseError) {
      // fall back to per-verse lookups below
    } else {
      throw error;
    }
  }

  if (payload) {
    const verses = normaliseVerses(payload);
    if (verses.length > 0) {
      return verses;
    }
  }

  const sequentialVerses = await fetchVersesSequentially(version, book, chapter, signal);

  if (sequentialVerses.length > 0) {
    return sequentialVerses;
  }

  throw new ChapterUnavailableError('This chapter is not available yet for the selected translation.');
}

export function BibleClient({ viewer }: BibleClientProps) {
  const [version, setVersion] = useState<string>(DEFAULT_VERSION_ID);
  const [bookSlug, setBookSlug] = useState<string>(BIBLE_BOOKS[0]?.slug ?? 'genesis');
  const [chapter, setChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isSharing, startSharing] = useTransition();
  const [versions, setVersions] = useState<BibleVersionMeta[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const chapterCacheRef = useRef<Map<string, Verse[] | null>>(new Map());
  const pendingRequestRef = useRef(0);

  const book = useMemo(
    () => BIBLE_BOOKS.find((item) => item.slug === bookSlug) ?? BIBLE_BOOKS[0],
    [bookSlug]
  );

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadVersions() {
      try {
        setIsLoadingVersions(true);
        setVersionsError(null);

        let response: Response;
        try {
          response = await fetch(BIBLE_VERSIONS_URL, { signal: controller.signal, cache: 'force-cache' });
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
          throw new NetworkError(BIBLE_VERSIONS_URL);
        }

        if (!response.ok) {
          throw new HttpError(BIBLE_VERSIONS_URL, response.status);
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
          throw new ParseError(BIBLE_VERSIONS_URL);
        }

        if (!isActive) {
          return;
        }

        const parsed = extractVersionList(payload)
          // Rely on the canonical registry so we never re-label translation IDs locally.
          .filter((item) => {
            if (!isValidVersionId(item.id)) {
              return false;
            }
            if (SUPPORTED_LANGUAGE_CODES.size === 0) {
              return true;
            }
            const languageCode = (item.language?.code ?? '').toLowerCase();
            return SUPPORTED_LANGUAGE_CODES.has(languageCode);
          })
          .sort((a, b) => {
            const aLabel = (a.version ?? a.id).toLowerCase();
            const bLabel = (b.version ?? b.id).toLowerCase();
            return aLabel.localeCompare(bLabel);
          });

        setVersions(parsed);

        if (parsed.length > 0) {
          setVersion((current) => {
            if (isValidVersionId(current) && parsed.some((item) => item.id === current)) {
              return current;
            }
            const fallback = parsed.find((item) => item.id === DEFAULT_VERSION_ID) ?? parsed[0];
            return fallback.id;
          });
        }
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return;
        }
        if (!isActive) {
          return;
        }

        if (loadError instanceof NetworkError) {
          setVersionsError('We could not reach the translation registry. Please check your connection and try again.');
        } else if (loadError instanceof ParseError) {
          setVersionsError('We encountered a formatting issue in the translation registry response.');
        } else if (loadError instanceof HttpError) {
          setVersionsError(`The translation registry responded with ${loadError.status}.`);
        } else {
          setVersionsError('We were not able to load the translation list.');
        }
        console.error(loadError);
      } finally {
        if (isActive) {
          setIsLoadingVersions(false);
        }
      }
    }

    loadVersions();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setChapter(1);
  }, [bookSlug]);

  const versionLabel = useMemo(() => {
    const match = versions.find((item) => item.id === version);
    if (match) {
      return match.version ?? match.id;
    }
    return version;
  }, [versions, version]);

  const versionOptions = useMemo(
    () =>
      versions
        .filter((item) => isValidVersionId(item.id))
        .map((item) => {
          const baseLabel = item.version ?? item.id;
          const languageName = item.language?.name ?? '';
          const label =
            languageName && !baseLabel.toLowerCase().includes(languageName.toLowerCase())
              ? `${baseLabel} (${languageName})`
              : baseLabel;
          return { value: item.id, label };
        }),
    [versions]
  );

  useEffect(() => {
    if (!book) {
      return;
    }
    setChapter((previous) => Math.min(previous, book.chapters));
  }, [book]);

  useEffect(() => {
    if (!book) {
      return;
    }

    setSelectedVerse(null);

    if (!isValidVersionId(version)) {
      setIsLoading(false);
      setVerses([]);
      setError('Please choose a translation to load this chapter.');
      return;
    }

    const cacheKey = getChapterCacheKey(version, book, chapter);
    const cachedEntry = chapterCacheRef.current.get(cacheKey);

    if (cachedEntry) {
      setVerses(cachedEntry);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (cachedEntry === null) {
      setVerses([]);
      setError(`${book.id} ${chapter} is not available in this translation yet.`);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const requestId = pendingRequestRef.current + 1;
    pendingRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);
    setVerses([]);

    const timeoutId = window.setTimeout(async () => {
      try {
        const fetchedVerses = await loadChapterWithFallback({
          version,
          book,
          chapter,
          signal: controller.signal,
        });

        if (!isActive || pendingRequestRef.current !== requestId) {
          return;
        }

        chapterCacheRef.current.set(cacheKey, fetchedVerses);
        setVerses(fetchedVerses);
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return;
        }

        if (!isActive || pendingRequestRef.current !== requestId) {
          return;
        }

        if (loadError instanceof ChapterUnavailableError) {
          chapterCacheRef.current.set(cacheKey, null);
          setError(`${book.id} ${chapter} is not available in this translation yet.`);
        } else if (loadError instanceof NetworkError) {
          setError(`We could not reach the Bible service while loading ${book.id} ${chapter}. Please check your connection and try again.`);
        } else if (loadError instanceof ParseError) {
          setError(`We ran into a formatting issue while reading ${book.id} ${chapter}. Please try another translation or chapter.`);
        } else if (loadError instanceof HttpError) {
          setError(`The Bible service responded with ${loadError.status} while loading ${book.id} ${chapter}.`);
        } else {
          setError('We were not able to load this chapter just now.');
        }

        console.error(loadError);
      } finally {
        if (isActive && pendingRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, CHAPTER_REQUEST_DEBOUNCE_MS);

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [book, chapter, version]);

  const chapterOptions = useMemo(() => {
    if (!book) {
      return [1];
    }
    return Array.from({ length: book.chapters }, (_value, index) => index + 1);
  }, [book]);

  const selectedReference = useMemo(() => {
    if (!selectedVerse || !book) {
      return '';
    }
    return `${book.id} ${chapter}:${selectedVerse.verse}`;
  }, [book, chapter, selectedVerse]);

  const viewerLabel = useMemo(() => viewer.name ?? viewer.email ?? 'Friend', [viewer]);

  const handleShare = useCallback(() => {
    if (!book || !selectedVerse) {
      return;
    }

    const referenceWithVersion = `${book.id} ${chapter}:${selectedVerse.verse} (${versionLabel})`;
    const passageText = `${selectedVerse.verse}. ${selectedVerse.text} (${versionLabel})`;
    const benediction = 'Shared from GO\'EL Bible reader to keep Jesus at the centre.';

    startSharing(async () => {
      try {
        const result = await shareVerseFromBibleAction({
          userId: viewer.id,
          reference: referenceWithVersion,
          passageText,
          version,
          benediction,
        });

        if (result.status === 'duplicate') {
          toast.info('You already shared this verse - thank you for keeping it in view!');
          return;
        }

        toast.success('This verse is now lifting up Christ in the community feed.');
        setSelectedVerse(null);
      } catch (actionError) {
        toast.error(
          (actionError instanceof Error && actionError.message) ||
            'We were not able to share this verse just now.'
        );
      }
    });
  }, [book, chapter, selectedVerse, startSharing, version, versionLabel, viewer.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <PrimaryHeader active="bible" subtitle="Abide in the Word" />
      <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
        <section className="flex flex-col gap-4 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">Daily Abiding</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Immerse yourself in Scripture</h1>
          <p className="text-white/70 md:max-w-3xl">
            {viewerLabel}, open the Word, meditate on a chapter, and share the verses that are stirring your heart so
            the whole body is encouraged toward Jesus.
          </p>
        </section>

        <Card className="rounded-3xl border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
          <form
            className="grid gap-4 md:grid-cols-3"
            aria-label="Bible controls"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="version-select" className="text-sm font-semibold text-white/80">
                  Translation
                </Label>
                {isLoadingVersions ? (
                  <span className="inline-flex items-center gap-1 text-xs text-white/50" aria-live="polite">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Loading
                  </span>
                ) : null}
              </div>
              <Select
                value={versionOptions.length > 0 ? version : undefined}
                onValueChange={(value) => {
                  if (isValidVersionId(value)) {
                    setVersion(value);
                  }
                }}
                disabled={versionOptions.length === 0}
              >
                <SelectTrigger
                  id="version-select"
                  className="h-11 rounded-2xl border-white/15 bg-black/40 text-left text-sm text-white focus-visible:ring-golden"
                  aria-label="Select translation"
                >
                  <SelectValue placeholder={isLoadingVersions ? 'Loading translations...' : 'Choose a translation'} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black text-white">
                  {versionOptions.length > 0 ? (
                    versionOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="data-[state=checked]:bg-golden/20 data-[state=checked]:text-golden"
                      >
                        {option.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-translation" disabled>
                      {versionsError ? 'Translations unavailable' : 'No translations available yet'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {versionsError ? (
                <p role="alert" className="text-xs text-red-300">
                  {versionsError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="book-select" className="text-sm font-semibold text-white/80">
                Book
              </Label>
              <Select value={book.slug} onValueChange={(value) => setBookSlug(value)}>
                <SelectTrigger
                  id="book-select"
                  className="h-11 rounded-2xl border-white/15 bg-black/40 text-left text-sm text-white focus-visible:ring-golden"
                  aria-label="Select book"
                >
                  <SelectValue placeholder="Choose a book" />
                </SelectTrigger>
                <SelectContent className="max-h-[320px] border-white/10 bg-black text-white">
                  {BIBLE_BOOKS.map((item) => (
                    <SelectItem
                      key={item.slug}
                      value={item.slug}
                      className="data-[state=checked]:bg-golden/20 data-[state=checked]:text-golden"
                    >
                      {item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chapter-select" className="text-sm font-semibold text-white/80">
                Chapter
              </Label>
              <Select value={String(chapter)} onValueChange={(value) => setChapter(Number.parseInt(value, 10))}>
                <SelectTrigger
                  id="chapter-select"
                  className="h-11 rounded-2xl border-white/15 bg-black/40 text-left text-sm text-white focus-visible:ring-golden"
                  aria-label="Select chapter"
                >
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] border-white/10 bg-black text-white">
                  {chapterOptions.map((chapterNumber) => (
                    <SelectItem
                      key={chapterNumber}
                      value={String(chapterNumber)}
                      className="data-[state=checked]:bg-golden/20 data-[state=checked]:text-golden"
                    >
                      {chapterNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </Card>

        <section
          aria-live="polite"
          aria-busy={isLoading}
          className="grid gap-8 lg:grid-cols-[2fr_1fr]"
        >
          <div className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-golden">
                {book.id} {chapter} | {versionLabel}
              </h2>
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading
                </span>
              ) : null}
            </header>

            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200"
              >
                {error}
              </div>
            ) : null}

            <ol className="grid gap-2" aria-label={`Verses in ${book.id} ${chapter}`}>
              {verses.map((verse) => {
                const isSelected = selectedVerse?.verse === verse.verse;
                return (
                  <li key={verse.verse}>
                    <button
                      type="button"
                      onClick={() => setSelectedVerse(isSelected ? null : verse)}
                      className={cn(
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden',
                        isSelected
                          ? 'border-golden bg-golden/20 text-golden shadow-inner shadow-golden/40'
                          : 'border-white/10 bg-white/5 hover:border-golden/40 hover:bg-golden/5'
                      )}
                      aria-pressed={isSelected}
                      aria-label={`Verse ${verse.verse}`}
                    >
                      <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-golden/60 bg-golden/10 text-sm font-semibold text-golden">
                        {verse.verse}
                      </span>
                      <span className="align-middle text-sm text-white/90">{verse.text}</span>
                    </button>
                  </li>
                );
              })}

              {!isLoading && !error && verses.length === 0 ? (
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  This chapter is not yet available in the selected translation.
                </li>
              ) : null}
            </ol>
          </div>

          <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <header className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Share the Word</p>
              <h3 className="text-xl font-semibold text-golden">Highlight &amp; Send</h3>
            </header>

            {selectedVerse && selectedReference ? (
              <div className="space-y-3 rounded-2xl border border-golden/40 bg-golden/15 p-4 text-sm text-white/90">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-golden/80">
                  {selectedReference} | {versionLabel}
                </p>
                <p>{selectedVerse.text}</p>
                <Button
                  type="button"
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-full gap-2 rounded-full bg-golden text-black hover:bg-golden/90"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Share Verse
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                Tap any verse to highlight it. Your highlight will appear here with the option to share it to the community feed.
              </p>
            )}

            <p className="text-xs text-white/50">
              Every share attributes the verse, translation, and community member so the gospel message remains clear and Christ-centred.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
