import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { getUserByProfileHandle } from '@/lib/server/users';
import { getPostsByAuthor, type FeedPost, hydratePostsToFeedPosts } from '@/lib/server/posts';
import { listReflectionsForUser } from '@/lib/server/reflections';
import { summarisePlanProgress } from '@/lib/server/plan-progress';
import { GOSPEL_PLAN_ID, getPlanOverview } from '@/lib/server/plans';
import { ProfileClient } from './profile-client';

const POSTS_PAGE_SIZE = 6;
const REFLECTIONS_PAGE_SIZE = 6;

type SearchParams = {
  tab?: string;
  postsPage?: string;
  reflectionsPage?: string;
};

function parsePositiveInteger(value: string | undefined): number {
  if (!value) {
    return 1;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { handle: string };
  searchParams: SearchParams;
}) {
  const handle = decodeURIComponent(params.handle);

  const [viewer, profileUser] = await Promise.all([getCurrentUser(), getUserByProfileHandle(handle)]);

  if (!profileUser) {
    notFound();
  }

  const isOwner = viewer?.id === profileUser.id;

  const requestedTab = (searchParams.tab ?? 'posts').toLowerCase();
  const allowedTabs: Array<'posts' | 'reflections' | 'plan'> = ['posts'];
  if (isOwner) {
    allowedTabs.push('reflections', 'plan');
  }
  const activeTab = allowedTabs.includes(requestedTab as typeof allowedTabs[number])
    ? (requestedTab as typeof allowedTabs[number])
    : 'posts';

  const postsPage = parsePositiveInteger(searchParams.postsPage);
  const reflectionsPage = parsePositiveInteger(searchParams.reflectionsPage);

  const postsPromise = getPostsByAuthor(profileUser.id, viewer?.id, {
    page: postsPage,
    pageSize: POSTS_PAGE_SIZE,
  });

  const reflectionsPromise = isOwner
    ? listReflectionsForUser({
        targetUserId: profileUser.id,
        viewerId: viewer?.id,
        page: reflectionsPage,
        pageSize: REFLECTIONS_PAGE_SIZE,
      }).then(async (result) => {
  const reflectionPosts = result.reflections.map((entry: any) => entry.post);
        const hydrated = reflectionPosts.length
          ? await hydratePostsToFeedPosts(reflectionPosts, viewer?.id)
          : [];
        return {
          items: hydrated.map((post, index) => ({
            post,
            savedAt: result.reflections[index]?.createdAt.toISOString() ?? new Date().toISOString(),
          })),
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          hasMore: result.page * result.pageSize < result.total,
        };
      })
    : Promise.resolve(null);

  const planOverview = getPlanOverview(GOSPEL_PLAN_ID);
  const planPromise: Promise<
    {
      planId: string;
      title: string;
      subtitle: string;
      totalDays: number;
      completionPercent: number;
      completedCount: number;
      remainingDays: number;
      currentStreak: number;
      longestStreak: number;
      lastCompletedAt?: string;
    }[]
  > =
    isOwner && planOverview
      ? summarisePlanProgress(profileUser.id, GOSPEL_PLAN_ID, planOverview.totalDays).then((summary) => [
          {
            planId: planOverview.id,
            title: planOverview.title,
            subtitle: planOverview.subtitle,
            totalDays: planOverview.totalDays,
            completionPercent: summary.completionPercent,
            completedCount: summary.totalCompleted,
            remainingDays: summary.remainingDays,
            currentStreak: summary.currentStreak,
            longestStreak: summary.longestStreak,
            lastCompletedAt: summary.lastCompletedAt,
          },
        ])
      : Promise.resolve([]);

  const [postsData, reflections, planSummaries] = await Promise.all([
    postsPromise,
    reflectionsPromise,
    planPromise,
  ]);

  return (
    <ProfileClient
      profile={{
        id: profileUser.id,
        name: profileUser.name,
        role: profileUser.role,
        location: profileUser.location ?? undefined,
        joinedAt: profileUser.createdAt,
        avatarUrl: profileUser.avatarUrl ?? undefined,
      }}
      viewerId={viewer?.id}
      posts={{
        items: postsData.items,
        total: postsData.total,
        page: postsData.page,
        pageSize: postsData.pageSize,
        hasMore: postsData.hasMore,
      }}
      reflections={reflections}
      planSummaries={planSummaries}
      activeTab={activeTab}
      hasReflectionsTab={isOwner}
      hasPlanTab={isOwner && planSummaries.length > 0}
      postsPage={postsPage}
      reflectionsPage={reflectionsPage}
    />
  );
}


