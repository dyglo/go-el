"use server";

import { prisma } from './prisma';
import { getCurrentUser } from './auth';

const DEFAULT_PAGE_SIZE = 12;

export async function toggleReflection(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) {
    throw new Error('Post not found.');
  }
  if (post.authorId === userId) {
    throw new Error('You cannot save reflections on your own post.');
  }

  const existing = await prisma.reflection.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existing) {
    await prisma.reflection.delete({ where: { id: existing.id } });
  } else {
    await prisma.reflection.create({
      data: {
        userId,
        postId,
      },
    });
  }

  const total = await prisma.reflection.count({ where: { postId } });

  return {
    isActive: !existing,
    total,
  };
}

export async function getReflectionMetadataForPosts(postIds: string[], viewerId?: string) {
  if (postIds.length === 0) {
    return {
      counts: new Map<string, number>(),
      viewer: new Set<string>(),
    };
  }

  const [counts, viewerReflections] = await Promise.all([
    prisma.reflection.groupBy({
      by: ['postId'],
      _count: { _all: true },
      where: { postId: { in: postIds } },
    }),
    viewerId
      ? prisma.reflection.findMany({
          where: { postId: { in: postIds }, userId: viewerId },
          select: { postId: true },
        })
      : Promise.resolve([]),
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((row) => {
    countMap.set(row.postId, row._count._all);
  });

  const viewerSet = new Set<string>();
  viewerReflections.forEach((row) => {
    viewerSet.add(row.postId);
  });

  return {
    counts: countMap,
    viewer: viewerSet,
  };
}

export type ReflectionListInput = {
  targetUserId: string;
  viewerId?: string;
  page?: number;
  pageSize?: number;
};

export async function listReflectionsForUser({ targetUserId, page = 1, pageSize = DEFAULT_PAGE_SIZE }: ReflectionListInput) {
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.max(1, pageSize);

  const [reflections, total] = await Promise.all([
    prisma.reflection.findMany({
      where: { userId: targetUserId },
      include: {
        post: {
          include: {
            author: true,
            reactions: true,
            reports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.reflection.count({ where: { userId: targetUserId } }),
  ]);

  return {
    reflections,
    total,
    page,
    pageSize: take,
  };
}

export async function assertViewerOrThrow() {
  const viewer = await getCurrentUser();
  if (!viewer) {
    throw new Error('Please sign in to continue.');
  }
  return viewer;
}
