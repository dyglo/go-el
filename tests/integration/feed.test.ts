import test from 'node:test';
import assert from 'node:assert/strict';
import { getFeedPosts, toggleReaction, createShare } from '@/lib/server/posts';
import { resetSeedData } from '@/lib/server/seed';
import type { SharePayload } from '@/lib/server/posts';

test('getFeedPosts returns scripture-rich posts for the viewer', async () => {
  resetSeedData();
  const posts = await getFeedPosts();

  assert.ok(posts.length > 0, 'expected seeded posts to be returned');

  const [first] = posts;
  assert.ok(first.passage.verses.length > 0, 'passage should resolve verses');
  assert.ok(first.reactions.counts.amen >= 0, 'amen reaction count should be present');
});

test('toggleReaction adds and removes viewer reactions in sequence', async () => {
  resetSeedData();
  const viewerId = 'integration_viewer';
  const [post] = await getFeedPosts(viewerId);
  const initialAmenCount = post.reactions.counts.amen;

  const afterToggle = await toggleReaction(post.id, 'amen', viewerId);
  assert.equal(afterToggle.counts.amen, initialAmenCount + 1, 'reaction should increment on toggle');
  assert.ok(afterToggle.viewer.includes('amen'), 'viewer reaction should include amen');

  const reverted = await toggleReaction(post.id, 'amen', viewerId);
  assert.equal(reverted.counts.amen, initialAmenCount, 'reaction should revert to original count');
  assert.ok(!reverted.viewer.includes('amen'), 'viewer reaction should be removed after second toggle');
});

test('createShare persists a new post that immediately appears in the feed', async () => {
  resetSeedData();
  const payload: SharePayload = {
    userId: 'user_miriam',
    reference: {
      book: 'John',
      chapter: 1,
      startVerse: 1,
      endVerse: 5,
    },
    reflection: 'Integration test share sample.',
  };

  const newPost = await createShare(payload);
  assert.equal(newPost.passage.reference.book, 'John');
  assert.equal(newPost.passage.reference.startVerse, 1);

  const posts = await getFeedPosts(payload.userId);
  assert.ok(posts.some((post) => post.id === newPost.id), 'newly shared post should be part of feed');
});
