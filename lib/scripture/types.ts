export type BibleBookId =
  | 'Genesis'
  | 'Exodus'
  | 'Leviticus'
  | 'Numbers'
  | 'Deuteronomy'
  | 'Joshua'
  | 'Judges'
  | 'Ruth'
  | '1 Samuel'
  | '2 Samuel'
  | '1 Kings'
  | '2 Kings'
  | '1 Chronicles'
  | '2 Chronicles'
  | 'Ezra'
  | 'Nehemiah'
  | 'Esther'
  | 'Job'
  | 'Psalms'
  | 'Proverbs'
  | 'Ecclesiastes'
  | 'Song of Solomon'
  | 'Isaiah'
  | 'Jeremiah'
  | 'Lamentations'
  | 'Ezekiel'
  | 'Daniel'
  | 'Hosea'
  | 'Joel'
  | 'Amos'
  | 'Obadiah'
  | 'Jonah'
  | 'Micah'
  | 'Nahum'
  | 'Habakkuk'
  | 'Zephaniah'
  | 'Haggai'
  | 'Zechariah'
  | 'Malachi'
  | 'Matthew'
  | 'Mark'
  | 'Luke'
  | 'John'
  | 'Acts'
  | 'Romans'
  | '1 Corinthians'
  | '2 Corinthians'
  | 'Galatians'
  | 'Ephesians'
  | 'Philippians'
  | 'Colossians'
  | '1 Thessalonians'
  | '2 Thessalonians'
  | '1 Timothy'
  | '2 Timothy'
  | 'Titus'
  | 'Philemon'
  | 'Hebrews'
  | 'James'
  | '1 Peter'
  | '2 Peter'
  | '1 John'
  | '2 John'
  | '3 John'
  | 'Jude'
  | 'Revelation';

export type PassageReference = {
  book: BibleBookId;
  chapter: number;
  startVerse: number;
  endVerse?: number;
};

export type Verse = {
  verse: number;
  text: string;
};

export type Chapter = {
  chapter: number;
  verses: Verse[];
};

export type Passage = {
  id: string;
  reference: PassageReference;
  verses: Verse[];
  translation: TranslationCode;
  plainText: string;
};

export type TranslationCode = 'WEB';

export type ScriptureSearchResult = {
  id: string;
  reference: string;
  translation: TranslationCode;
  highlight: string;
  plainText: string;
};

export type TranslationAdapter = {
  id: TranslationCode;
  getPassage: (reference: PassageReference) => Promise<Passage | null>;
  search: (query: string, options?: { limit?: number }) => Promise<ScriptureSearchResult[]>;
};
