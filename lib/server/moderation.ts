"use server";

import type {
  ModerationAction as PrismaModerationAction,
  ModerationActionType as PrismaModerationActionType,
  Post as PrismaPost,
  Report as PrismaReport,
  User,
  Reaction,
} from '@prisma/client';
import { PostStatus, ReportStatus as ReportStatusEnum, ModerationActionType as ModerationActionTypeEnum } from '@prisma/client';
import { prisma } from './prisma';
import type { ReactionType } from './posts';

export type ModerationSummary = {
  total: number;
  pending: number;
  inReview: number;
  actioned: number;
  dismissed: number;
};

type ModerationActionLabel = 'hide' | 'warn' | 'suspend' | 'restore';
type ReportStatusLabel = 'pending' | 'in_review' | 'actioned' | 'dismissed';
type PostStatusLabel = 'published' | 'flagged' | 'archived';

export type ModerationActionView = {
  id: string;
  action: ModerationActionLabel;
  createdAt: string;
  notes?: string;
  actor: {
    id: string;
    name: string;
    role?: string | null;
  };
};

export type ModerationReportView = {
  id: string;
  status: ReportStatusLabel;
  reason: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  reporter: {
    id: string;
    name: string;
    email?: string | null;
  };
  post: {
    id: string;
    status: PostStatusLabel;
    reference: string;
    reflection?: string | null;
    tags: string[];
    createdAt: string;
    author: {
      id: string;
      name: string;
      role?: string | null;
    };
    reactionCounts: Record<ReactionType, number>;
    reportCount: number;
  };
  actions: ModerationActionView[];
};

export type ModerationDashboard = {
  summary: ModerationSummary;
  reports: ModerationReportView[];
};

export type ModerationActionInput = {
  reportId: string;
  actorId: string;
  action: PrismaModerationActionType;
  notes?: string;
};

function ensureUserName(user: User | null | undefined, fallback: string): string {
  if (!user) {
    return fallback;
  }
  return user.displayName ?? user.email ?? fallback;
}

function toReactionCounts(reactions: Reaction[]): Record<ReactionType, number> {
  return reactions.reduce<Record<ReactionType, number>>((acc, reaction) => {
    const label = reaction.type.toLowerCase() as ReactionType;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, { amen: 0, praying: 0 });
}

function toReportStatusLabel(status: string): ReportStatusLabel {
  return status.toLowerCase() as ReportStatusLabel;
}

function toPostStatusLabel(status: string): PostStatusLabel {
  return status.toLowerCase() as PostStatusLabel;
}

function toActionLabel(action: PrismaModerationActionType): ModerationActionLabel {
  return action.toLowerCase() as ModerationActionLabel;
}

function toActionView(
  action: PrismaModerationAction & { actor: User | null }
): ModerationActionView {
  return {
    id: action.id,
    action: toActionLabel(action.action),
    createdAt: action.createdAt.toISOString(),
    notes: action.notes ?? undefined,
    actor: {
      id: action.actorId,
      name: ensureUserName(action.actor, 'Moderator'),
      role: action.actor?.role,
    },
  };
}

function toReportView(
  report: PrismaReport & {
    reporter: User | null;
    post: PrismaPost & { author: User | null; reactions: Reaction[]; reports: PrismaReport[] };
    actions: (PrismaModerationAction & { actor: User | null })[];
  }
): ModerationReportView {
  const postRecord = report.post as any;

  return {
    id: report.id,
    status: toReportStatusLabel(report.status),
    reason: report.reason,
    notes: report.notes ?? undefined,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt ? report.resolvedAt.toISOString() : undefined,
    reporter: {
      id: report.reporterId,
      name: ensureUserName(report.reporter, 'Community Member'),
      email: report.reporter?.email ?? null,
    },
    post: {
      id: report.postId,
      status: toPostStatusLabel(postRecord.status),
      reference: (postRecord as any).reference ?? '',
      reflection: (postRecord as any).reflection,
      tags: (postRecord as any).tags ?? [],
      createdAt: (postRecord as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      author: {
        id: (postRecord as any).authorId ?? postRecord.author?.id ?? 'unknown',
        name: ensureUserName(postRecord.author, 'Member'),
        role: postRecord.author?.role,
      },
      reactionCounts: toReactionCounts(postRecord.reactions),
      reportCount: postRecord.reports.length,
    },
    actions: report.actions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((action) => toActionView(action)),
  };
}

export async function getModerationDashboard(): Promise<ModerationDashboard> {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: true,
      post: {
        include: {
          author: true,
          reactions: true,
          reports: true,
        },
      },
      actions: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const views = reports.map((report) => toReportView(report));
  const summary: ModerationSummary = {
    total: views.length,
    pending: views.filter((report) => report.status === 'pending').length,
    inReview: views.filter((report) => report.status === 'in_review').length,
    actioned: views.filter((report) => report.status === 'actioned').length,
    dismissed: views.filter((report) => report.status === 'dismissed').length,
  };

  return {
    summary,
    reports: views,
  };
}

export async function moderateReport(
  input: ModerationActionInput
): Promise<ModerationReportView> {
  return prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: input.reportId },
      include: {
        post: { include: { reactions: true, reports: true, author: true } },
      },
    });
    if (!report) {
      throw new Error('Report not found.');
    }

    const actor = await tx.user.findUnique({ where: { id: input.actorId } });
    if (!actor) {
      throw new Error('Moderator account missing.');
    }

    let nextReportStatus = report.status;
    let nextPostStatus = report.post.status;
    const resolvedAt = new Date();

    switch (input.action) {
      case ModerationActionTypeEnum.WARN:
        nextReportStatus = ReportStatusEnum.IN_REVIEW;
        nextPostStatus = report.post.status === PostStatus.ARCHIVED ? report.post.status : PostStatus.FLAGGED;
        break;
      case ModerationActionTypeEnum.HIDE:
        nextReportStatus = ReportStatusEnum.ACTIONED;
        nextPostStatus = PostStatus.FLAGGED;
        break;
      case ModerationActionTypeEnum.SUSPEND:
        nextReportStatus = ReportStatusEnum.ACTIONED;
        nextPostStatus = PostStatus.ARCHIVED;
        break;
      case ModerationActionTypeEnum.RESTORE:
        nextReportStatus = ReportStatusEnum.DISMISSED;
        nextPostStatus = PostStatus.PUBLISHED;
        break;
      default:
        throw new Error(`Unsupported moderation action "${input.action}".`);
    }

    const updatedReport = await tx.report.update({
      where: { id: report.id },
      data: {
        status: nextReportStatus,
        notes: input.notes ?? report.notes,
        resolvedAt,
      },
      include: {
        reporter: true,
        post: {
          include: {
            reactions: true,
            reports: true,
            author: true,
          },
        },
        actions: {
          include: { actor: true },
        },
      },
    });

    await tx.post.update({
      where: { id: report.postId },
      data: { status: nextPostStatus },
    });

    await tx.moderationAction.create({
      data: {
        reportId: report.id,
        postId: report.postId,
        actorId: input.actorId,
        action: input.action,
        notes: input.notes,
      },
    });

    const refreshed = await tx.report.findUnique({
      where: { id: report.id },
      include: {
        reporter: true,
        post: {
          include: {
            reactions: true,
            reports: true,
            author: true,
          },
        },
        actions: {
          include: { actor: true },
        },
      },
    });

    if (!refreshed) {
      throw new Error('Unable to load updated moderation report.');
    }

    return toReportView(refreshed);
  });
}
