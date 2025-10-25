import type { BibleBookId, PassageReference } from './types';

const BOOK_ALIASES: Record<string, BibleBookId> = {
  genesis: 'Genesis',
  exodus: 'Exodus',
  leviticus: 'Leviticus',
  numbers: 'Numbers',
  deuteronomy: 'Deuteronomy',
  joshua: 'Joshua',
  judges: 'Judges',
  ruth: 'Ruth',
  '1 samuel': '1 Samuel',
  '2 samuel': '2 Samuel',
  '1 kings': '1 Kings',
  '2 kings': '2 Kings',
  '1 chronicles': '1 Chronicles',
  '2 chronicles': '2 Chronicles',
  ezra: 'Ezra',
  nehemiah: 'Nehemiah',
  esther: 'Esther',
  job: 'Job',
  psalm: 'Psalms',
  psalms: 'Psalms',
  ps: 'Psalms',
  prov: 'Proverbs',
  proverbs: 'Proverbs',
  ecclesiastes: 'Ecclesiastes',
  eccles: 'Ecclesiastes',
  song: 'Song of Solomon',
  'song of solomon': 'Song of Solomon',
  isaiah: 'Isaiah',
  isa: 'Isaiah',
  jeremiah: 'Jeremiah',
  jer: 'Jeremiah',
  lamentations: 'Lamentations',
  lam: 'Lamentations',
  ezekiel: 'Ezekiel',
  ezek: 'Ezekiel',
  daniel: 'Daniel',
  dan: 'Daniel',
  hosea: 'Hosea',
  joel: 'Joel',
  amos: 'Amos',
  obadiah: 'Obadiah',
  jonah: 'Jonah',
  micah: 'Micah',
  nahum: 'Nahum',
  habakkuk: 'Habakkuk',
  zephaniah: 'Zephaniah',
  haggai: 'Haggai',
  zechariah: 'Zechariah',
  malachi: 'Malachi',
  matthew: 'Matthew',
  matt: 'Matthew',
  mark: 'Mark',
  luke: 'Luke',
  john: 'John',
  acts: 'Acts',
  romans: 'Romans',
  rom: 'Romans',
  '1 corinthians': '1 Corinthians',
  '1 cor': '1 Corinthians',
  '2 corinthians': '2 Corinthians',
  '2 cor': '2 Corinthians',
  galatians: 'Galatians',
  gal: 'Galatians',
  ephesians: 'Ephesians',
  eph: 'Ephesians',
  philippians: 'Philippians',
  phil: 'Philippians',
  colossians: 'Colossians',
  col: 'Colossians',
  '1 thessalonians': '1 Thessalonians',
  '1 thess': '1 Thessalonians',
  '2 thessalonians': '2 Thessalonians',
  '2 thess': '2 Thessalonians',
  '1 timothy': '1 Timothy',
  '1 tim': '1 Timothy',
  '2 timothy': '2 Timothy',
  '2 tim': '2 Timothy',
  titus: 'Titus',
  philemon: 'Philemon',
  hebrews: 'Hebrews',
  heb: 'Hebrews',
  james: 'James',
  '1 peter': '1 Peter',
  '2 peter': '2 Peter',
  '1 john': '1 John',
  '2 john': '2 John',
  '3 john': '3 John',
  jude: 'Jude',
  revelation: 'Revelation',
  rev: 'Revelation',
};

const REFERENCE_REGEX =
  /^\s*([1-3]?\s?[A-Za-z]+(?:\s(?:of|the))?(?:\s[A-Za-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$/;

export class InvalidReferenceError extends Error {
  constructor(input: string) {
    super(`Unable to parse passage reference "${input}".`);
  }
}

export function parseReference(input: string): PassageReference {
  const normalized = input.trim().toLowerCase();
  const regexMatch = normalized.match(REFERENCE_REGEX);

  if (!regexMatch) {
    throw new InvalidReferenceError(input);
  }

  const [, rawBook, chapterString, startVerseString, endVerseString] = regexMatch;
  const book = BOOK_ALIASES[rawBook.replace(/\s+/g, ' ').trim()];

  if (!book) {
    throw new InvalidReferenceError(input);
  }

  const chapter = Number.parseInt(chapterString, 10);
  const startVerse = startVerseString ? Number.parseInt(startVerseString, 10) : 1;
  const endVerse = endVerseString ? Number.parseInt(endVerseString, 10) : undefined;

  return {
    book,
    chapter,
    startVerse,
    endVerse,
  };
}

export function formatReference(reference: PassageReference): string {
  const { book, chapter, startVerse, endVerse } = reference;
  if (!startVerse) {
    return `${book} ${chapter}`;
  }
  if (endVerse && endVerse !== startVerse) {
    return `${book} ${chapter}:${startVerse}-${endVerse}`;
  }
  return `${book} ${chapter}:${startVerse}`;
}
const BOOK_SLUG_MAP: Map<string, BibleBookId> = (() => {
  const entries = new Map<string, BibleBookId>();
  Object.values(BOOK_ALIASES).forEach((book) => {
    const slug = book.toLowerCase().replace(/\s+/g, '-');
    if (!entries.has(slug)) {
      entries.set(slug, book);
    }
  });
  return entries;
})();

export function bookToSlug(book: BibleBookId): string {
  return book.toLowerCase().replace(/\s+/g, '-');
}

export function bookFromSlug(slug: string): BibleBookId | undefined {
  return BOOK_SLUG_MAP.get(slug.toLowerCase());
}

export function referenceToPassageId(reference: PassageReference): string {
  const slug = bookToSlug(reference.book);
  const startVerse = reference.startVerse ?? 1;
  const segment =
    reference.endVerse && reference.endVerse !== startVerse ? `${startVerse}-${reference.endVerse}` : `${startVerse}`;
  return `${slug}-${reference.chapter}-${segment}`;
}

export function referenceStringToPassageId(input: string): string {
  const parsed = parseReference(input);
  return referenceToPassageId(parsed);
}
