import { randomUUID } from 'crypto';
import {
  getDatabase,
  type ModerationActionRecord,
  type PostRecord,
  type ReportRecord,
  type UserRecord,
} from './db';
import { ensureSeedData } from './seed';

export type ModerationSummary = {
  total: number;
  pending: number;
  inReview: number;
  actioned: number;
  dismissed: number;
};

export type ModerationActionView = {
  id: string;
  action: ModerationActionRecord['action'];
  createdAt: string;
  notes?: string;
  actor: {
    id: string;
    name: string;
    role?: string;
  };
};

export type ModerationReportView = {
  id: string;
  status: ReportRecord['status'];
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
    status: PostRecord['status'];
    reference: string;
    reflection?: string;
    tags: string[];
    createdAt: string;
    author: {
      id: string;
      name: string;
      role?: string;
    };
    reactionCounts: PostRecord['reactionCounts'];
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
  action: ModerationActionRecord['action'];
  notes?: string;
};

function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function getUserName(user: UserRecord | undefined | null, fallback: string) {
  if (!user) {
    return fallback;
  }
  return user.name ?? user.email ?? fallback;
}

function toReportView(report: ReportRecord): ModerationReportView {
  const db = getDatabase();
  const post = db.posts.get(report.postId);
  if (!post) {
    throw new Error(`Missing post ${report.postId} for report ${report.id}.`);
  }
  const reporter = db.users.get(report.reporterId);
  const author = db.users.get(post.authorId);
  const actions = Array.from(db.moderationActions.values())
    .filter((action) => action.reportId === report.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((action) => {
      const actor = db.users.get(action.actorId);
      return {
        id: action.id,
        action: action.action,
        createdAt: action.createdAt,
        notes: action.notes,
        actor: {
          id: actor?.id ?? action.actorId,
          name: getUserName(actor, 'Moderator'),
          role: actor?.role,
        },
      };
    });

  return {
    id: report.id,
    status: report.status,
    reason: report.reason,
    notes: report.notes,
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt ?? undefined,
    reporter: {
      id: reporter?.id ?? report.reporterId,
      name: getUserName(reporter, 'Community Member'),
      email: reporter?.email,
    },
    post: {
      id: post.id,
      status: post.status,
      reference: post.reference,
      reflection: post.reflection,
      tags: post.tags,
      createdAt: post.createdAt,
      author: {
        id: author?.id ?? post.authorId,
        name: getUserName(author, 'Member'),
        role: author?.role,
      },
      reactionCounts: post.reactionCounts,
      reportCount: post.reportUserIds.size,
    },
    actions,
  };
}

export function getModerationDashboard(): ModerationDashboard {
  ensureSeedData();
  const db = getDatabase();
  const reports = Array.from(db.reports.values()).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );

  const summary: ModerationSummary = {
    total: reports.length,
    pending: reports.filter((report) => report.status === 'pending').length,
    inReview: reports.filter((report) => report.status === 'in_review').length,
    actioned: reports.filter((report) => report.status === 'actioned').length,
    dismissed: reports.filter((report) => report.status === 'dismissed').length,
  };

  return {
    summary,
    reports: reports.map((report) => toReportView(report)),
  };
}

export function moderateReport(input: ModerationActionInput): ModerationReportView {
  ensureSeedData();
  const db = getDatabase();
  const report = db.reports.get(input.reportId);
  if (!report) {
    throw new Error('Report not found.');
  }

  const post = db.posts.get(report.postId);
  if (!post) {
    throw new Error('Reported post no longer exists.');
  }

  const actor = db.users.get(input.actorId);
  if (!actor) {
    throw new Error('Moderator account missing.');
  }

  const nowIso = new Date().toISOString();

  switch (input.action) {
    case 'warn':
      report.status = 'in_review';
      report.resolvedAt = nowIso;
      post.status = post.status === 'archived' ? post.status : 'flagged';
      break;
    case 'hide':
      report.status = 'actioned';
      report.resolvedAt = nowIso;
      post.status = 'flagged';
      break;
    case 'suspend':
      report.status = 'actioned';
      report.resolvedAt = nowIso;
      post.status = 'archived';
      break;
    case 'restore':
      report.status = 'dismissed';
      report.resolvedAt = nowIso;
      post.status = 'published';
      break;
    default:
      throw new Error(`Unsupported moderation action "${input.action}".`);
  }

  if (input.notes) {
    report.notes = input.notes;
  }

  const actionRecord: ModerationActionRecord = {
    id: createId('moderation'),
    reportId: report.id,
    postId: post.id,
    actorId: input.actorId,
    action: input.action,
    notes: input.notes,
    createdAt: nowIso,
  };

  db.moderationActions.set(actionRecord.id, actionRecord);

  return toReportView(report);
}
