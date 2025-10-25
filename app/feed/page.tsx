import { FeedClient } from './feed-client';
import { getFeedPosts } from '@/lib/server/posts';
import { getWebPassageByReference } from '@/lib/scripture';
import { getCurrentUser } from '@/lib/server/auth';

export default async function FeedPage() {
  const viewer = getCurrentUser();
  const [posts, dailyFocus] = await Promise.all([
    getFeedPosts(viewer?.id),
    getWebPassageByReference('Hebrews 3:13'),
  ]);

  if (!dailyFocus) {
    throw new Error('Unable to load daily focus passage.');
  }

  return (
    <FeedClient
      initialPosts={posts}
      dailyFocus={dailyFocus}
      viewer={viewer ? { id: viewer.id, name: viewer.name, email: viewer.email } : null}
    />
  );
}