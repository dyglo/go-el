import test from 'node:test';
import assert from 'node:assert/strict';
import { getPassageFromId, searchScripture } from '@/lib/server/posts';
import { resetSeedData } from '@/lib/server/seed';
import { scriptureRegistry, parseReference } from '@/lib/scripture';

test('getPassageFromId resolves passages by slug-based identifier', async () => {
  resetSeedData();
  const passage = await getPassageFromId('john-3-16-17');
  assert.ok(passage, 'passage should be found for John 3:16-17');
  assert.equal(passage?.reference.book, 'John');
  assert.equal(passage?.reference.startVerse, 16);
  assert.equal(passage?.reference.endVerse, 17);
});

test('searchScripture returns matching references from WEB data', async () => {
  resetSeedData();
  const results = await searchScripture('God so loved the world', 5);
  assert.ok(results.length > 0, 'expected search results for phrase');
  assert.ok(results.some((result) => result.reference.includes('John 3:16')));
});

test('scriptureRegistry serves consistent passages for parsed references', async () => {
  resetSeedData();
  const reference = parseReference('Psalms 23:1-3');
  const passage = await scriptureRegistry.getPassage('WEB', reference);
  assert.ok(passage);
  assert.equal(passage?.verses.length, 3);
});
