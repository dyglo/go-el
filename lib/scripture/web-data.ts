import type { BibleBookId } from './types';

type WebTranslationData = Record<
  BibleBookId,
  Record<number, Record<number, string>>
>;

export const WEB_TRANSLATION_DATA: WebTranslationData = {
  Genesis: {},
  Exodus: {},
  Leviticus: {},
  Numbers: {},
  Deuteronomy: {},
  Joshua: {},
  Judges: {},
  Ruth: {},
  '1 Samuel': {},
  '2 Samuel': {},
  '1 Kings': {},
  '2 Kings': {},
  '1 Chronicles': {},
  '2 Chronicles': {},
  Ezra: {},
  Nehemiah: {},
  Esther: {},
  Job: {},
  Psalms: {
    1: {
      1: 'Blessed is the man who doesn’t walk in the counsel of the wicked, nor stand in the way of sinners, nor sit in the seat of scoffers.',
      2: 'But his delight is in Yahweh’s law. On his law he meditates day and night.',
      3: 'He will be like a tree planted by the streams of water, that produces its fruit in its season, whose leaf also does not wither. Whatever he does prospers.',
    },
    23: {
      1: 'Yahweh is my shepherd: I shall lack nothing.',
      2: 'He makes me lie down in green pastures. He leads me beside still waters.',
      3: 'He restores my soul. He guides me in the paths of righteousness for his name’s sake.',
      4: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.',
      5: 'You prepare a table before me in the presence of my enemies. You anoint my head with oil. My cup runs over.',
      6: 'Surely goodness and loving kindness will follow me all the days of my life, and I will dwell in Yahweh’s house forever.',
    },
  },
  Proverbs: {},
  Ecclesiastes: {},
  'Song of Solomon': {},
  Isaiah: {
    26: {
      3: 'You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you.',
      4: 'Trust in Yahweh forever; for in Yah, Yahweh, is an everlasting Rock.',
    },
    40: {
      8: 'The grass withers, the flower fades; but the word of our God stands forever.',
    },
  },
  Jeremiah: {},
  Lamentations: {},
  Ezekiel: {},
  Daniel: {},
  Hosea: {},
  Joel: {},
  Amos: {},
  Obadiah: {},
  Jonah: {},
  Micah: {},
  Nahum: {},
  Habakkuk: {},
  Zephaniah: {},
  Haggai: {},
  Zechariah: {},
  Malachi: {},
  Matthew: {},
  Mark: {},
  Luke: {},
  John: {
    3: {
      16: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.',
    },
    15: {
      4: 'Remain in me, and I in you. As the branch can’t bear fruit by itself, unless it remains in the vine, so neither can you, unless you remain in me.',
      5: 'I am the vine. You are the branches. He who remains in me, and I in him, bears much fruit, for apart from me you can do nothing.',
    },
  },
  Acts: {},
  Romans: {
    8: {
      28: 'We know that all things work together for good for those who love God, for those who are called according to his purpose.',
    },
  },
  '1 Corinthians': {},
  '2 Corinthians': {},
  Galatians: {},
  Ephesians: {},
  Philippians: {},
  Colossians: {
    3: {
      16: 'Let the word of Christ dwell in you richly; in all wisdom teaching and admonishing one another with psalms, hymns, and spiritual songs, singing with grace in your heart to the Lord.',
    },
  },
  '1 Thessalonians': {},
  '2 Thessalonians': {},
  '1 Timothy': {},
  '2 Timothy': {},
  Titus: {},
  Philemon: {},
  Hebrews: {
    3: {
      13: 'But exhort one another day by day, so long as it is called “today”; lest any one of you be hardened by the deceitfulness of sin.',
    },
    4: {
      12: 'For the word of God is living and active, and sharper than any two-edged sword, piercing even to the dividing of soul and spirit, of both joints and marrow, and is able to discern the thoughts and intentions of the heart.',
    },
    10: {
      24: 'Let’s consider how to provoke one another to love and good works,',
      25: 'not forsaking our own assembling together, as the custom of some is, but exhorting one another; and so much the more as you see the Day approaching.',
    },
  },
  James: {
    4: {
      8: 'Draw near to God, and he will draw near to you. Cleanse your hands, you sinners; and purify your hearts, you double-minded.',
    },
  },
  '1 Peter': {},
  '2 Peter': {},
  '1 John': {},
  '2 John': {},
  '3 John': {},
  Jude: {},
  Revelation: {},
};
