'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, ChevronDown, Flag, Heart, MessageCircle, Plus, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Passage } from '@/lib/scripture';
import type { FeedPost, ReactionType } from '@/lib/server/posts';
import { toggleReactionAction, reportPostAction } from './actions';
import { PrimaryHeader } from '@/components/layout/primary-header';

type ViewerInfo = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

type FeedClientProps = {
  initialPosts: FeedPost[];
  dailyFocus: Passage;
  viewer?: ViewerInfo | null;
};

const prayerHighlights = [
  {
    title: 'Midweek Intercession',
    group: 'Jerusalem House Church',
    requests: 4,
    scripture: 'Ephesians 6:18',
  },
  {
    title: 'Mothers in the Word',
    group: 'Bethany Fellowship',
    requests: 3,
    scripture: 'Philippians 4:6',
  },
];

const filterCategories = ['All', 'Gospels', 'Psalms', 'Epistles', 'Prophets'] as const;
type FilterCategory = (typeof filterCategories)[number];

function deriveBook(reference: string): string {
  const beforeColon = reference.split(':')[0] ?? reference;
  return beforeColon.replace(/\s*\d+$/u, '').trim();
}

function getCategoryForReference(reference: string): FilterCategory {
  const book = deriveBook(reference);
  if (['Matthew', 'Mark', 'Luke', 'John'].includes(book)) {
    return 'Gospels';
  }
  if (book === 'Psalms') {
    return 'Psalms';
  }
  if (['Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'].includes(book)) {
    return 'Prophets';
  }
  return 'Epistles';
}

function formatTimestamp(iso: string) {
  const created = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diff / (1000 * 60)));
    return `Shared ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (hours < 24) {
    return `Shared ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(hours / 24);
  return `Shared ${days} day${days === 1 ? '' : 's'} ago`;
}

export function FeedClient({ initialPosts, dailyFocus, viewer }: FeedClientProps) {
  const viewerId = viewer?.id ?? null;
  const [posts, setPosts] = useState(initialPosts);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingToggle, startToggle] = useTransition();
  const [pendingReport, startReport] = useTransition();

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'All') {
      return posts;
    }
    return posts.filter((post) => getCategoryForReference(post.reference) === activeFilter);
  }, [activeFilter, posts]);

  const handleToggleExpand = (postId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const optimisticUpdate = (postId: string, reaction: ReactionType) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) {
          return post;
        }
        const viewerHasReaction = post.reactions.viewer.includes(reaction);
        const nextViewer = viewerHasReaction
          ? post.reactions.viewer.filter((item) => item !== reaction)
          : [...post.reactions.viewer, reaction];
        const delta = viewerHasReaction ? -1 : 1;
        const nextCounts = {
          ...post.reactions.counts,
          [reaction]: Math.max(0, post.reactions.counts[reaction] + delta),
        };
        return {
          ...post,
          reactions: {
            counts: nextCounts,
            viewer: nextViewer,
          },
        };
      })
    );
  };

  const handleToggleReaction = (postId: string, reaction: ReactionType) => {
    if (!viewerId) {
      toast.info('Sign in to respond to Scriptures.');
      return;
    }
    optimisticUpdate(postId, reaction);
    startToggle(async () => {
      try {
        const result = await toggleReactionAction({
          postId,
          reaction,
          viewerId,
        });
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  reactions: {
                    counts: result.counts,
                    viewer: result.viewer,
                  },
                }
              : post
          )
        );
      } catch (error) {
        toast.error('We were not able to update your response. Please try again.');
      }
    });
  };

  const handleReport = (postId: string) => {
    const reason = 'Community report from feed';
    startReport(async () => {
      try {
        const result = await reportPostAction({
          postId,
          reporterId: viewerId ?? 'viewer_guest',
          reason,
        });
        toast.success(
          result.status === 'flagged'
            ? 'Thank you. This passage has been flagged for review.'
            : 'Thank you. Our shepherds will review this shortly.'
        );
      } catch (error) {
        toast.error('Unable to submit report. Please try again later.');
      }
    });
  };

  const isPending = pendingToggle || pendingReport;

  return (
    <div className="min-h-screen bg-midnight text-white">
      <PrimaryHeader
        active="feed"
        subtitle="Scripture Feed"
        primaryAction={{
          label: 'Share Scripture',
          href: '/share',
          icon: <Plus className="h-4 w-4" />,
          disabled: isPending,
          className: 'bg-golden text-black hover:bg-golden/90',
        }}
      />

      <main className="container mx-auto max-w-6xl px-4 py-12">
        <AnimatePresence>
          <motion.section
            key="daily-focus"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="grid gap-6 p-8 md:grid-cols-[2fr,1fr] md:p-10">
              <div>
                <h2 className="text-xs uppercase tracking-[0.4em] text-white/40">Daily Focus</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                  <BadgeCheck className="h-4 w-4 text-golden" />
                  <span>WEB Translation</span>
                </div>
                <h3 className="mt-6 text-3xl font-semibold text-golden md:text-4xl">
                  {dailyFocus.reference.book} {dailyFocus.reference.chapter}:{dailyFocus.reference.startVerse}
                </h3>
                <p className="mt-4 font-serif text-lg leading-relaxed text-white/85">
                  &ldquo;{dailyFocus.verses.map((verse) => verse.text).join(' ')}&rdquo;
                </p>
                <Link
                  href={`/passage/${dailyFocus.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm text-golden hover:text-golden/80"
                >
                  Dwell in the passage
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">
                  Prayer Highlights
                </h4>
                <div className="space-y-4">
                  {prayerHighlights.map((highlight) => (
                    <div key={highlight.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-golden">{highlight.title}</p>
                        <Badge variant="outline" className="border-golden/40 text-xs text-golden">
                          {highlight.requests} requests
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/40">
                        {highlight.group}
                      </p>
                      <p className="mt-3 text-sm text-white/70">Anchored in {highlight.scripture}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        <section className="mb-8 flex flex-wrap items-center gap-3">
          {filterCategories.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              className={
                activeFilter === filter
                  ? 'bg-golden text-black hover:bg-golden/90'
                  : 'border-white/20 bg-transparent text-white/70 hover:text-white'
              }
              onClick={() => setActiveFilter(filter)}
              disabled={isPending}
              size="sm"
            >
              {filter}
            </Button>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {filteredPosts.map((post) => {
               const bookCategory = getCategoryForReference(post.reference);
               const passageText = post.passageText;
               const shouldClamp = passageText.length > 360 && !expanded.has(post.id);

              return (
                <motion.article
                  key={post.id}
                  layout
                  className="rounded-3xl border border-white/10 bg-black/60 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">{bookCategory}</p>
                      <h3 className="mt-1 text-2xl font-semibold text-golden">{post.reference}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-white/10 text-white/60">
                        {formatTimestamp(post.createdAt)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-white/10 text-white/60 hover:text-white"
                        onClick={() => handleReport(post.id)}
                        disabled={isPending}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p
                    className={`mt-4 font-serif text-lg leading-relaxed text-white/90 ${
                      shouldClamp ? 'line-clamp-4' : ''
                    }`}
                  >
                    &ldquo;{passageText}&rdquo;
                  </p>

                  {passageText.length > 360 && (
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(post.id)}
                      className="mt-2 inline-flex items-center gap-2 text-sm text-golden hover:text-golden/80"
                    >
                      {expanded.has(post.id) ? 'Show less' : 'Read the full passage'}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded.has(post.id) ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}

                  {post.reflection && (
                    <div className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-sm text-white/75">
                      <p>{post.reflection}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} className="bg-white/10 text-xs font-medium uppercase tracking-[0.2em]">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Separator className="my-6 border-white/10" />

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={post.reactions.viewer.includes('amen') ? 'default' : 'outline'}
                        className={
                          post.reactions.viewer.includes('amen')
                            ? 'bg-golden text-black hover:bg-golden/90'
                            : 'border-white/15 bg-transparent text-white/80 hover:text-white'
                        }
                        onClick={() => handleToggleReaction(post.id, 'amen')}
                        disabled={pendingToggle}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Amen {post.reactions.counts.amen}
                      </Button>
                      <Button
                        variant={post.reactions.viewer.includes('praying') ? 'default' : 'outline'}
                        className={
                          post.reactions.viewer.includes('praying')
                            ? 'bg-white text-black hover:bg-white/90'
                            : 'border-white/15 bg-transparent text-white/80 hover:text-white'
                        }
                        onClick={() => handleToggleReaction(post.id, 'praying')}
                        disabled={pendingToggle}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Praying {post.reactions.counts.praying}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Share2 className="h-4 w-4" />
                      <span>{post.commentCount} reflections</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm text-white/60">
                    <span>
                      Shared by{' '}
                      <span className="text-white/85">
                        {post.author.name} â€¢ {post.author.role}
                      </span>
                    </span>
                    {post.reportCount > 0 && (
                      <span className="text-xs uppercase tracking-[0.3em] text-red-400/80">
                        {post.reportCount} reports
                      </span>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
              <h4 className="text-sm uppercase tracking-[0.3em] text-white/40">Community Rhythm</h4>
              <p className="mt-3 text-base text-white/75">
                This space is moderated to remain Scripture-first. Amen and Praying responses are
                commitments, not emojis.
              </p>
              <Separator className="my-6 border-white/10" />
              <Link href="/share">
                <Button className="w-full bg-golden text-black hover:bg-golden/90" disabled={isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Share today&apos;s reading
                </Button>
              </Link>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <h4 className="text-sm uppercase tracking-[0.3em] text-white/40">Need guidance?</h4>
              <p className="mt-3 text-sm text-white/70">
                We are building gentle guardrails for every share. Report content if it shifts away
                from Christ-centered edification.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}







