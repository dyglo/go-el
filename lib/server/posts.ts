"use server";

import {
  Prisma,
  PostStatus,
  ReportStatus,
  ReactionType as PrismaReactionType,
  type Reaction,
  type Report,
  type User,
} from '@prisma/client';
import { prisma } from './prisma';
import { getReflectionMetadataForPosts } from './reflections';
import type { Passage, PassageReference } from '@/lib/scripture';
import { bookFromSlug, scriptureRegistry } from '@/lib/scripture';

type ReactionLabel = 'amen' | 'praying';
export type ReactionType = ReactionLabel;

export type PostWithRelations = {
  id: string;
  reference: string;
  passageText: string;
  reflection: string | null;
  tags: string[];
  status: PostStatus;
  commentCount: number;
  createdAt: Date;
  authorId: string;
  author: User;
  reactions: Reaction[];
  reports: Report[];
};

export type FeedPost = {
  id: string;
  reference: string;
  passageText: string;
  reflection?: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    role?: string | null;
    location?: string | null;
  };
  createdAt: string;
  commentCount: number;
  reactions: {
    counts: Record<ReactionType, number>;
    viewer: ReactionType[];
  };
  reportCount: number;
  reflections: {
    count: number;
    viewerHasReflected: boolean;
  };
};

export type SharePayload = {
  userId: string;
  reference: string;
  passageText: string;
  testimony?: string;
  tags?: string[];
};

export type ReportPayload = {
  postId: string;
  reporterId: string;
  reason: string;
};

const REACTION_LABELS: ReactionLabel[] = ['amen', 'praying'];

const reactionLabelToPrisma: Record<ReactionLabel, PrismaReactionType> = {
  amen: PrismaReactionType.AMEN,
  praying: PrismaReactionType.PRAYING,
};

const prismaReactionToLabel: Record<PrismaReactionType, ReactionLabel> = {
  [PrismaReactionType.AMEN]: 'amen',
  [PrismaReactionType.PRAYING]: 'praying',
};

function ensureUserName(user: User | null): string {
  if (!user) {
    return 'Member';
  }
  return user.displayName ?? user.email ?? 'Member';
}

type PostStatusLabel = 'published' | 'flagged' | 'archived';
type ReportStatusLabel = 'pending' | 'in_review' | 'actioned' | 'dismissed';

function toPostStatusLabel(status: PostStatus): PostStatusLabel {
  return status.toLowerCase() as PostStatusLabel;
}

function toReportStatusLabel(status: ReportStatus): ReportStatusLabel {
  return status.toLowerCase() as ReportStatusLabel;
}

function emptyReactionCounts(): Record<ReactionLabel, number> {
  return REACTION_LABELS.reduce<Record<ReactionLabel, number>>((acc, label) => {
    acc[label] = 0;
    return acc;
  }, { amen: 0, praying: 0 });
}

function toFeedPost(
  post: PostWithRelations,
  viewerId?: string,
  reflectionInfo?: { count: number; viewerHas: boolean }
): FeedPost {
  const counts = emptyReactionCounts();
  const viewerReactions = new Set<ReactionLabel>();

  post.reactions.forEach((reaction) => {
    const label = prismaReactionToLabel[reaction.type as PrismaReactionType];
    counts[label] += 1;
    if (viewerId && reaction.userId === viewerId) {
      viewerReactions.add(label);
    }
  });

  const authorName = ensureUserName(post.author);
  const reflectionCount = reflectionInfo?.count ?? 0;
  const viewerHasReflection = reflectionInfo?.viewerHas ?? false;

  return {
    id: post.id,
    reference: post.reference,
    passageText: post.passageText,
    reflection: post.reflection ?? undefined,
    tags: post.tags ?? [],
    author: {
      id: post.authorId,
      name: authorName,
      role: post.author.role,
      location: post.author.location ?? undefined,
    },
    createdAt: post.createdAt.toISOString(),
    commentCount: post.commentCount,
    reactions: {
      counts,
      viewer: Array.from(viewerReactions.values()),
    },
    reportCount: post.reports.length,
    reflections: {
      count: reflectionCount,
      viewerHasReflected: viewerHasReflection,
    },
  };
}

export async function hydratePostsToFeedPosts(posts: PostWithRelations[], viewerId?: string): Promise<FeedPost[]> {
  if (posts.length === 0) {
    return [];
  }
  const postIds = posts.map((post) => post.id);
  const { counts, viewer } = await getReflectionMetadataForPosts(postIds, viewerId);

  return posts.map((post) =>
    toFeedPost(post, viewerId, {
      count: counts.get(post.id) ?? 0,
      viewerHas: viewer.has(post.id),
    })
  );
}

export async function getFeedPosts(viewerId?: string): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      reactions: true,
      reports: true,
    },
  });

  return hydratePostsToFeedPosts(posts, viewerId);
}

export type PaginatedFeedPosts = {
  items: FeedPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export async function getPostsByAuthor(
  authorId: string,
  viewerId?: string,
  options?: { page?: number; pageSize?: number }
): Promise<PaginatedFeedPosts> {
  const page = options?.page && options.page > 0 ? options.page : 1;
  const pageSize = options?.pageSize && options.pageSize > 0 ? options.pageSize : 10;
  const skip = (page - 1) * pageSize;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId, status: PostStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        reactions: true,
        reports: true,
      },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where: { authorId, status: PostStatus.PUBLISHED } }),
  ]);

  const items = await hydratePostsToFeedPosts(posts, viewerId);
  const hasMore = skip + posts.length < total;

  return {
    items,
    total,
    page,
    pageSize,
    hasMore,
  };
}

export async function createShare(payload: SharePayload): Promise<FeedPost> {
  const reference = payload.reference.trim();
  const passageText = payload.passageText.trim();
  if (!reference) {
    throw new Error('Please provide a Scripture reference.');
  }
  if (!passageText) {
    throw new Error('Please include the verse text you wish to share.');
  }

  const reflection = payload.testimony?.trim() ? payload.testimony.trim() : null;

  const createdPost = await prisma.post.create({
    data: {
      authorId: payload.userId,
      reference,
      passageText,
      translation: 'USER',
      reflection,
      tags: payload.tags ?? [],
      status: PostStatus.PUBLISHED,
      shares: {
        create: {
          userId: payload.userId,
          reference,
          passageText,
          reflection,
        },
      },
    },
    include: {
      author: true,
      reactions: true,
      reports: true,
    },
  });

  return toFeedPost(createdPost, payload.userId, { count: 0, viewerHas: false });
}

export async function toggleReaction(postId: string, reaction: ReactionType, viewerId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Error('Post not found.');
  }

  const user = await prisma.user.findUnique({ where: { id: viewerId } });
  if (!user) {
    throw new Error('User not found.');
  }

  const prismaType = reactionLabelToPrisma[reaction];

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_type: {
        postId,
        userId: viewerId,
        type: prismaType,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    try {
      await prisma.reaction.create({
        data: {
          postId,
          userId: viewerId,
          type: prismaType,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }
  }

  const [groupCounts, viewerReactions] = await Promise.all([
    prisma.reaction.groupBy({
      by: ['type'],
      _count: { _all: true },
      where: { postId },
    }),
    prisma.reaction.findMany({
      where: { postId, userId: viewerId },
      select: { type: true },
    }),
  ]);

  const counts = emptyReactionCounts();
  for (const item of groupCounts) {
    const label = prismaReactionToLabel[item.type as PrismaReactionType];
    counts[label] = item._count._all;
  }

  return {
    counts,
    viewer: viewerReactions.map((item) => prismaReactionToLabel[item.type as PrismaReactionType]),
  };
}

export async function reportPost(payload: ReportPayload) {
  const post = await prisma.post.findUnique({
    where: { id: payload.postId },
    include: { reports: { select: { reporterId: true } } },
  });
  if (!post) {
    throw new Error('Cannot report a post that does not exist.');
  }

  const reporter = await prisma.user.findUnique({ where: { id: payload.reporterId } });
  if (!reporter) {
    throw new Error('Reporter account missing.');
  }

  const report = await prisma.report.create({
    data: {
      postId: payload.postId,
      reporterId: payload.reporterId,
      reason: payload.reason,
      status: ReportStatus.PENDING,
    },
  });

  const reporterIds = new Set(post.reports.map((item) => item.reporterId));
  reporterIds.add(payload.reporterId);

  let nextStatus = post.status;
  if (reporterIds.size >= 3 && post.status === PostStatus.PUBLISHED) {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { status: PostStatus.FLAGGED },
      select: { status: true },
    });
    nextStatus = updated.status;
  }

  return {
    reportId: report.id,
    totalReports: reporterIds.size,
    status: toPostStatusLabel(nextStatus),
    reportStatus: toReportStatusLabel(report.status),
  };
}

export async function getPassageFromId(id: string): Promise<Passage | null> {
  const match = id.match(
    /^(?<bookSlug>[a-z0-9-]+)-(?<chapter>\d+)-(?<start>\d+)(?:-(?<end>\d+))?$/i
  );
  if (!match?.groups) {
    return null;
  }

  const { bookSlug, chapter, start, end } = match.groups as {
    bookSlug: string;
    chapter: string;
    start: string;
    end?: string;
  };

  const book = bookFromSlug(bookSlug);
  if (!book) {
    return null;
  }

  const chapterNumber = Number.parseInt(chapter, 10);
  const startVerse = Number.parseInt(start, 10);
  const endVerse = end ? Number.parseInt(end, 10) : undefined;

  if (Number.isNaN(chapterNumber) || Number.isNaN(startVerse)) {
    return null;
  }

  const reference: PassageReference = {
    book,
    chapter: chapterNumber,
    startVerse,
    endVerse,
  };

  return scriptureRegistry.getPassage('WEB', reference);
}


