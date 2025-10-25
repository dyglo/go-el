import { formatReference, parseReference } from './reference';
import { WEB_TRANSLATION_DATA } from './web-data';
import type {
  Passage,
  PassageReference,
  ScriptureSearchResult,
  TranslationAdapter,
  TranslationCode,
  Verse,
} from './types';

type WebCache = {
  passages: Map<string, Passage>;
  normalizedQuery: Map<string, ScriptureSearchResult[]>;
};

const globalWithCache = globalThis as typeof globalThis & {
  __goelWebCache?: WebCache;
};

const cache: WebCache =
  globalWithCache.__goelWebCache ??
  {
    passages: new Map(),
    normalizedQuery: new Map(),
  };

if (!globalWithCache.__goelWebCache) {
  globalWithCache.__goelWebCache = cache;
}

const TRANSLATION_CODE: TranslationCode = 'WEB';

function normalizeId(reference: PassageReference): string {
  const { book, chapter, startVerse, endVerse } = reference;
  const segment = endVerse && endVerse !== startVerse ? `${startVerse}-${endVerse}` : `${startVerse}`;
  return `${book.toLowerCase().replace(/\s+/g, '-')}-${chapter}-${segment}`;
}

function collectVerses(reference: PassageReference): Verse[] {
  const bookData = WEB_TRANSLATION_DATA[reference.book];
  if (!bookData) {
    return [];
  }

  const chapterData = bookData[reference.chapter];
  if (!chapterData) {
    return [];
  }

  const start = reference.startVerse ?? 1;
  const end =
    reference.endVerse ??
    Math.max(...Object.keys(chapterData).map((verse) => Number.parseInt(verse, 10)));

  const verses: Verse[] = [];
  for (let current = start; current <= end; current += 1) {
    const text = chapterData[current];
    if (text) {
      verses.push({
        verse: current,
        text,
      });
    }
  }
  return verses;
}

async function getPassage(reference: PassageReference): Promise<Passage | null> {
  const cacheKey = normalizeId(reference);
  if (cache.passages.has(cacheKey)) {
    return cache.passages.get(cacheKey)!;
  }

  const verses = collectVerses(reference);
  if (!verses.length) {
    return null;
  }

  const passage: Passage = {
    id: cacheKey,
    reference,
    verses,
    translation: TRANSLATION_CODE,
    plainText: verses.map((verse) => verse.text).join(' '),
  };

  cache.passages.set(cacheKey, passage);
  return passage;
}

function buildSearchResults(): ScriptureSearchResult[] {
  const results: ScriptureSearchResult[] = [];

  Object.entries(WEB_TRANSLATION_DATA).forEach(([book, chapters]) => {
    Object.entries(chapters).forEach(([chapterNumber, verses]) => {
      Object.entries(verses).forEach(([verseNumber, text]) => {
        const reference: PassageReference = {
          book: book as PassageReference['book'],
          chapter: Number.parseInt(chapterNumber, 10),
          startVerse: Number.parseInt(verseNumber, 10),
        };
        const formattedReference = formatReference(reference);
        const id = normalizeId(reference);
        results.push({
          id,
          reference: formattedReference,
          translation: TRANSLATION_CODE,
          highlight: text,
          plainText: text,
        });
      });
    });
  });

  return results;
}

const SEARCH_RESULTS = buildSearchResults();

async function search(query: string, options?: { limit?: number }): Promise<ScriptureSearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return SEARCH_RESULTS.slice(0, options?.limit ?? 10);
  }

  if (cache.normalizedQuery.has(normalizedQuery)) {
    const cached = cache.normalizedQuery.get(normalizedQuery)!;
    return cached.slice(0, options?.limit ?? cached.length);
  }

  const matches = SEARCH_RESULTS.filter((result) => {
    return (
      result.reference.toLowerCase().includes(normalizedQuery) ||
      result.plainText.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, options?.limit ?? 20);

  cache.normalizedQuery.set(normalizedQuery, matches);
  return matches;
}

export const webTranslationAdapter: TranslationAdapter = {
  id: TRANSLATION_CODE,
  getPassage,
  search,
};

export async function getWebPassageByReference(referenceString: string) {
  const reference = parseReference(referenceString);
  return getPassage(reference);
}

export async function searchWebTranslation(query: string, options?: { limit?: number }) {
  return search(query, options);
}
