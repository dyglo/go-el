'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, BookmarkCheck, Calendar, Flame, Heart, LogOut, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { PrimaryHeader } from '@/components/layout/primary-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { FeedPost } from '@/lib/server/posts';

type ReflectionFeedItem = {
  post: FeedPost;
  savedAt: string;
};

type PlanSummaryClient = {
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
};

type PaginatedFeed = {
  items: FeedPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type PaginatedReflections = {
  items: ReflectionFeedItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type ProfileClientProps = {
  profile: {
    id: string;
    name: string;
    role?: string | null;
    location?: string;
    joinedAt: string;
    avatarUrl?: string;
  };
  viewerId?: string | null;
  posts: PaginatedFeed;
  reflections: PaginatedReflections | null;
  planSummaries: PlanSummaryClient[];
  activeTab: 'posts' | 'reflections' | 'plan';
  hasReflectionsTab: boolean;
  hasPlanTab: boolean;
  postsPage: number;
  reflectionsPage: number;
  onSignOut: () => Promise<{ signedOut: boolean }>;
};

function formatTimestamp(iso: string) {
  const created = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diff / (1000 * 60)));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatSavedDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatJoinedDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return 'GO';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Presents the profile feed with tabs so future spiritual disciplines can be layered in without rewriting layout.
 */
export function ProfileClient({
  profile,
  viewerId,
  posts,
  reflections,
  planSummaries,
  activeTab,
  hasReflectionsTab,
  hasPlanTab,
  postsPage,
  reflectionsPage,
  onSignOut,
}: ProfileClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isOwner = viewerId === profile.id;

  const totalReflections = reflections?.total ?? 0;

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      const result = await onSignOut();
      if (result?.signedOut) {
        router.replace('/auth/sign-in');
        router.refresh();
      }
    } catch (error) {
      // Silent failure – button will re-enable so the user can retry.
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleTabChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      if (value !== 'posts') {
        params.delete('postsPage');
      }
      if (value !== 'reflections') {
        params.delete('reflectionsPage');
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const buildPostsHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'posts');
    params.set('postsPage', String(page));
    return `${pathname}?${params.toString()}`;
  };

  const buildReflectionsHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'reflections');
    params.set('reflectionsPage', String(page));
    return `${pathname}?${params.toString()}`;
  };

  const topStats = useMemo(() => {
    if (isOwner) {
      const streak = planSummaries[0]?.currentStreak ?? 0;
      const remaining = planSummaries[0]?.remainingDays ?? planSummaries[0]?.totalDays ?? 0;
      return [
        {
          title: 'Shared Scriptures',
          value: posts.total,
          description: 'Testimonies rooted in the Word.',
        },
        {
          title: 'Plan Streak',
          value: streak,
          description: 'Consecutive days abiding.',
        },
        {
          title: 'Days Remaining',
          value: remaining,
          description: 'Until this guided journey concludes.',
        },
      ];
    }
    return [
      {
        title: 'Shared Scriptures',
        value: posts.total,
        description: 'Public posts anchored in Scripture.',
      },
      {
        title: 'Member Since',
        value: formatJoinedDate(profile.joinedAt),
        description: "Welcomed into GO'EL",
      },
      {
        title: 'Serving From',
        value: profile.location ?? 'Global fellowship',
        description: 'Context for their discipleship.',
      },
    ];
  }, [isOwner, planSummaries, posts.total, profile.joinedAt, profile.location]);

  const renderPostCard = (post: FeedPost) => {
    const tags = post.tags ?? [];
    const reflectionLabel = post.reflections.viewerHasReflected ? 'Reflection saved' : 'Reflection available';
    return (
      <Card key={post.id} className="rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-golden/40 bg-golden/10 p-2">
              <BookmarkedIcon />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">{post.reference}</p>
              <p className="text-white/80">{post.author.name}</p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">{formatTimestamp(post.createdAt)}</span>
        </div>

        <p className="mt-4 font-serif text-lg leading-relaxed text-white/90">&ldquo;{post.passageText}&rdquo;</p>

        {post.reflection ? (
          <div className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-sm text-white/75">
            <p>{post.reflection}</p>
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge key={`${post.id}-${tag}`} className="bg-white/10 text-xs font-medium uppercase tracking-[0.2em]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <Separator className="my-6 border-white/10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1">
              <Heart className="h-4 w-4 text-golden" />
              Amen {post.reactions.counts.amen}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1">
              <MessageCircle className="h-4 w-4 text-golden" />
              Praying {post.reactions.counts.praying}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-golden" />
            <span>{post.reflections.count} saved reflections</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
          <span>{reflectionLabel}</span>
          <span>{post.reportCount > 0 ? `${post.reportCount} reports` : 'Shepherded content'}</span>
        </div>
      </Card>
    );
  };

  const renderReflectionCard = (item: ReflectionFeedItem) => {
    const post = renderPostCard(item.post);
    return (
      <div key={`${item.post.id}-${item.savedAt}`} className="space-y-4">
        {post}
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">
          Saved on {formatSavedDate(item.savedAt)}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <PrimaryHeader active="profile" subtitle="Member Profile" containerClassName="max-w-6xl" />

      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <section className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-golden/40">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-golden/20 text-golden">{initialsFromName(profile.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-white">{profile.name}</h1>
                {isOwner ? (
                  <Badge variant="outline" className="mt-2 border-golden text-golden">
                    Your discipleship snapshot
                  </Badge>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/60">
                  {profile.role ? (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-4 w-4 text-golden" />
                      {profile.role}
                    </span>
                  ) : null}
                  {profile.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-golden" />
                      {profile.location}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-golden" />
                    Joined {formatJoinedDate(profile.joinedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
              {isOwner ? (
                <Button
                  variant="outline"
                  className="border-golden text-golden hover:bg-golden/10"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </Button>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                {topStats.map((stat) => (
                  <Card key={stat.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/40">{stat.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-golden">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/60">{stat.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="flex w-full justify-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-2">
              <TabsTrigger value="posts" disabled={isNavigating}>
                Posts ({posts.total})
              </TabsTrigger>
              <TabsTrigger value="reflections" disabled={!hasReflectionsTab || isNavigating}>
                Reflections ({totalReflections})
              </TabsTrigger>
              <TabsTrigger value="plan" disabled={!hasPlanTab || isNavigating}>
                Plan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {posts.items.length === 0 ? (
                <Card className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-white/70">No posts yet. Share a Scripture to begin shaping this space.</p>
                </Card>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {posts.items.map((post) => renderPostCard(post))}
                </div>
              )}
              {posts.hasMore ? (
                <div className="flex justify-center">
                  <Link href={buildPostsHref(postsPage + 1)}>
                    <Button variant="outline" className="border-golden text-golden hover:bg-golden/10">
                      Load more scriptures
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="reflections" className="space-y-6">
              {!hasReflectionsTab ? (
                <Card className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-white/70">Reflections are private to each disciple.</p>
                </Card>
              ) : reflections && reflections.items.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {reflections.items.map((item) => renderReflectionCard(item))}
                </div>
              ) : (
                <Card className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-white/70">
                    Save reflections from the feed to gather testimonies that point you back to Jesus.
                  </p>
                </Card>
              )}
              {hasReflectionsTab && reflections && reflections.hasMore ? (
                <div className="flex justify-center">
                  <Link href={buildReflectionsHref(reflectionsPage + 1)}>
                    <Button variant="outline" className="border-golden text-golden hover:bg-golden/10">
                      Load more reflections
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="plan" className="space-y-6">
              {!hasPlanTab ? (
                <Card className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-white/70">Reading plans are visible only to the disciple walking them.</p>
                </Card>
              ) : planSummaries.length === 0 ? (
                <Card className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-white/70">
                    Begin a guided plan to weave Scripture rhythms into your days.
                  </p>
                  <Link href="/plans" className="mt-4 inline-flex">
                    <Button className="bg-golden text-black hover:bg-golden/90">Choose a plan</Button>
                  </Link>
                </Card>
              ) : (
                planSummaries.map((plan) => (
                  <Card key={plan.planId} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
                        <p className="mt-1 text-sm text-white/70">{plan.subtitle}</p>
                      </div>
                      <Badge className="self-start bg-golden/10 text-xs uppercase tracking-[0.3em] text-golden">
                        {plan.totalDays} days
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-white/40">Completion</p>
                      <div className="mt-3 h-3 rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-golden transition-all duration-300"
                          style={{ width: `${plan.completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <span>
                          {plan.completedCount} of {plan.totalDays} days complete
                        </span>
                        <span>Remaining {plan.remainingDays}</span>
                        <span>Current streak {plan.currentStreak}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/70">
                      Continue walking gently with Jesus—{plan.remainingDays === 0
                        ? 'celebrate this completed journey and prayerfully choose the next.'
                        : 'let each reading draw you deeper into the gospel story.'}
                    </p>
                    <Link href="/plans" className="inline-flex">
                      <Button variant="outline" className="border-golden text-golden hover:bg-golden/10">
                        Revisit reading plan
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function BookmarkedIcon() {
  return <BookmarkCheck className="h-5 w-5 text-golden" />;
}

