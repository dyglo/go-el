"use server";

import type { Group, GroupMembership, PrayerRequest, User } from '@prisma/client';
import {
  GroupMembershipStatus,
  GroupRole,
  NotificationPreference as PrismaNotificationPreference,
} from '@prisma/client';
import { prisma } from './prisma';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export type ViewerGroupStatus = 'guest' | 'pending' | 'member' | 'suspended';

export type PrayerRequestPreview = {
  id: string;
  title: string;
  createdAt: string;
  archivedAt?: string;
  prayingCount: number;
  authorName: string;
};

export type PrayerGroupSummary = {
  id: string;
  name: string;
  focus: string;
  scriptureAnchor: string;
  description: string;
  memberCount: number;
  memberLimit: number;
  pendingCount: number;
  viewerStatus: ViewerGroupStatus;
  isPrivate: boolean;
  tags: string[];
  lastActivityAt: string;
  facilitators: { id: string; name: string }[];
  previewRequests: PrayerRequestPreview[];
};

type MembershipRoleLabel = 'owner' | 'facilitator' | 'member';
type NotificationPreferenceLabel = 'all' | 'quiet' | 'mentions';

export type GroupMembershipView = {
  id: string;
  status: ViewerGroupStatus;
  role: MembershipRoleLabel;
  notifications: NotificationPreferenceLabel;
  joinedAt?: string;
  lastVisitedAt?: string;
};

export type PrayerRequestView = {
  id: string;
  title: string;
  body?: string;
  reference?: string;
  createdAt: string;
  archivedAt?: string;
  author: {
    id: string;
    name: string;
    role?: string | null;
  };
  prayingCount: number;
  viewerHasPrayed: boolean;
};

export type TypingIndicator = {
  id: string;
  name: string;
  role?: string;
  tone: 'typing' | 'praying';
};

export type PrayerGroupDetail = {
  summary: PrayerGroupSummary;
  membership: GroupMembershipView;
  requests: PrayerRequestView[];
  archivedRequests: PrayerRequestView[];
  typing: TypingIndicator[];
  capacityFull: boolean;
};

export type JoinGroupResult = {
  status: ViewerGroupStatus;
  requiresApproval: boolean;
  capacityFull?: boolean;
  membership: GroupMembershipView | null;
};

export type LeaveGroupResult = {
  status: ViewerGroupStatus;
  membership: GroupMembershipView | null;
};

export type NotificationPreferenceResult = {
  membership: GroupMembershipView;
};

export type TogglePrayerReactionResult = {
  prayingCount: number;
  viewerHasPrayed: boolean;
};

type ReactionJson = Record<'praying', number>;
type ReactionUserMap = Record<'praying', string[]>;

function mapStatus(status?: GroupMembershipStatus | null): ViewerGroupStatus {
  if (!status) {
    return 'guest';
  }
  switch (status) {
    case GroupMembershipStatus.MEMBER:
      return 'member';
    case GroupMembershipStatus.PENDING:
      return 'pending';
    case GroupMembershipStatus.SUSPENDED:
      return 'suspended';
    default:
      return 'guest';
  }
}

function toRoleLabel(role: GroupRole): MembershipRoleLabel {
  switch (role) {
    case GroupRole.OWNER:
      return 'owner';
    case GroupRole.FACILITATOR:
      return 'facilitator';
    default:
      return 'member';
  }
}

function toNotificationLabel(notification: PrismaNotificationPreference): NotificationPreferenceLabel {
  switch (notification) {
    case PrismaNotificationPreference.ALL:
      return 'all';
    case PrismaNotificationPreference.MENTIONS:
      return 'mentions';
    default:
      return 'quiet';
  }
}

function parseCounts(value: unknown, fallback: ReactionJson): ReactionJson {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      praying: typeof record.praying === 'number' ? (record.praying as number) : fallback.praying,
    };
  }
  if (typeof value === 'string') {
    try {
      return parseCounts(JSON.parse(value), fallback);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
}

function parseUserIds(value: unknown, fallback: ReactionUserMap): ReactionUserMap {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const praying = record.praying;
    if (Array.isArray(praying) && praying.every((item) => typeof item === 'string')) {
      return { praying: praying as string[] };
    }
  }
  if (typeof value === 'string') {
    try {
      return parseUserIds(JSON.parse(value), fallback);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
}

function ensureUserName(user: User | null | undefined): string {
  if (!user) {
    return 'Member';
  }
  return user.displayName ?? user.email ?? 'Member';
}

function toMembershipView(membership: GroupMembership | null): GroupMembershipView {
  if (!membership) {
    return {
      id: 'guest',
      status: 'guest',
      role: 'member',
      notifications: 'quiet',
    };
  }

  return {
    id: membership.id,
    status: mapStatus(membership.status),
    role: toRoleLabel(membership.role),
    notifications: toNotificationLabel(membership.notifications),
    joinedAt: membership.joinedAt ? membership.joinedAt.toISOString() : undefined,
    lastVisitedAt: membership.lastVisitedAt ? membership.lastVisitedAt.toISOString() : undefined,
  };
}

function toPrayerRequestView(
  request: PrayerRequest & { author: User },
  viewerId: string
): PrayerRequestView {
  const counts = parseCounts(request.reactionCounts, { praying: 0 });
  const userIds = parseUserIds(request.reactionUserIds, { praying: [] });
  const prayingUsers = new Set(userIds.praying ?? []);

  return {
    id: request.id,
    title: request.title,
    body: request.body ?? undefined,
    reference: request.reference ?? undefined,
    createdAt: request.createdAt.toISOString(),
    archivedAt: request.archivedAt ? request.archivedAt.toISOString() : undefined,
    author: {
      id: request.authorId,
      name: ensureUserName(request.author),
      role: request.author.role,
    },
    prayingCount: counts.praying ?? 0,
    viewerHasPrayed: prayingUsers.has(viewerId),
  };
}

function toPreview(request: PrayerRequest & { author: User }): PrayerRequestPreview {
  const counts = parseCounts(request.reactionCounts, { praying: 0 });
  return {
    id: request.id,
    title: request.title,
    createdAt: request.createdAt.toISOString(),
    archivedAt: request.archivedAt ? request.archivedAt.toISOString() : undefined,
    prayingCount: counts.praying ?? 0,
    authorName: ensureUserName(request.author),
  };
}

function toSummary(
  group: Group & {
    memberships: (GroupMembership & { user: User })[];
    requests: (PrayerRequest & { author: User })[];
  },
  viewerId: string
): PrayerGroupSummary {
  const memberCount = group.memberships.filter(
    (membership) => membership.status === GroupMembershipStatus.MEMBER
  ).length;
  const pendingCount = group.memberships.filter(
    (membership) => membership.status === GroupMembershipStatus.PENDING
  ).length;
  const viewerMembership = group.memberships.find((membership) => membership.userId === viewerId) ?? null;
  const facilitators = group.memberships
    .filter((membership) => membership.role !== GroupRole.MEMBER)
    .map((membership) => ({
      id: membership.userId,
      name: ensureUserName(membership.user),
    }));

  const previewRequests = group.requests
    .filter((request) => !request.archivedAt)
    .slice(0, 3)
    .map((request) => toPreview(request));

  return {
    id: group.id,
    name: group.name,
    focus: group.focus,
    scriptureAnchor: group.scriptureAnchor,
    description: group.description,
    memberCount,
    memberLimit: group.memberLimit,
    pendingCount,
    viewerStatus: mapStatus(viewerMembership?.status),
    isPrivate: group.isPrivate,
    tags: group.tags ?? [],
    lastActivityAt: group.lastActivityAt.toISOString(),
    facilitators,
    previewRequests,
  };
}

async function getGroupContext(groupId: string, viewerId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: { user: true },
      },
      requests: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!group) {
    throw new Error('Prayer group not found.');
  }
  const memberCount = group.memberships.filter(
    (membership) => membership.status === GroupMembershipStatus.MEMBER
  ).length;
  return {
    group,
    summary: toSummary(group, viewerId),
    memberCount,
  };
}

export async function getPrayerGroupDirectory(viewerId: string): Promise<PrayerGroupSummary[]> {
  const groups = await prisma.group.findMany({
    orderBy: { lastActivityAt: 'desc' },
    include: {
      memberships: {
        include: { user: true },
      },
      requests: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  return groups.map((group) => toSummary(group, viewerId));
}

export async function getPrayerGroupDetail(
  groupId: string,
  viewerId: string
): Promise<PrayerGroupDetail> {
  const { group, summary, memberCount } = await getGroupContext(groupId, viewerId);
  const viewerMembership =
    group.memberships.find((membership) => membership.userId === viewerId) ?? null;

  const activeRequests = group.requests
    .filter((request) => !request.archivedAt)
    .map((request) => toPrayerRequestView(request, viewerId));

  const archivedRequests = group.requests
    .filter((request) => Boolean(request.archivedAt))
    .map((request) => toPrayerRequestView(request, viewerId));

  return {
    summary,
    membership: toMembershipView(viewerMembership),
    requests: activeRequests,
    archivedRequests,
    typing: [],
    capacityFull: memberCount >= group.memberLimit,
  };
}

export async function requestGroupMembership(groupId: string, userId: string): Promise<JoinGroupResult> {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: true,
      },
    });
    if (!group) {
      throw new Error('Prayer group not found.');
    }

    const existing = group.memberships.find((membership) => membership.userId === userId) ?? null;
    const memberCount = group.memberships.filter(
      (membership) => membership.status === GroupMembershipStatus.MEMBER
    ).length;
    const capacityFull = memberCount >= group.memberLimit;

    if (existing) {
      return {
        status: mapStatus(existing.status),
        requiresApproval: existing.status !== GroupMembershipStatus.MEMBER && group.isPrivate,
        capacityFull,
        membership: toMembershipView(existing),
      };
    }

    if (capacityFull) {
      return {
        status: 'guest',
        requiresApproval: false,
        capacityFull: true,
        membership: null,
      };
    }

    const status = group.isPrivate ? GroupMembershipStatus.PENDING : GroupMembershipStatus.MEMBER;
    const membership = await tx.groupMembership.create({
      data: {
        groupId,
        userId,
        status,
        joinedAt: status === GroupMembershipStatus.MEMBER ? new Date() : undefined,
        role: GroupRole.MEMBER,
        notifications: PrismaNotificationPreference.QUIET,
      },
    });

    return {
      status: mapStatus(membership.status),
      requiresApproval: group.isPrivate && membership.status !== GroupMembershipStatus.MEMBER,
      capacityFull: false,
      membership: toMembershipView(membership),
    };
  });
}

export async function leaveGroupMembership(
  groupId: string,
  userId: string
): Promise<LeaveGroupResult> {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });
  if (!membership) {
    return {
      status: 'guest',
      membership: null,
    };
  }

  await prisma.groupMembership.delete({ where: { id: membership.id } });

  return {
    status: 'guest',
    membership: null,
  };
}

export async function createPrayerRequest(input: {
  groupId: string;
  userId: string;
  title: string;
  body?: string;
  reference?: string;
}): Promise<PrayerRequestView> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.groupMembership.findUnique({
      where: { groupId_userId: { groupId: input.groupId, userId: input.userId } },
      include: { user: true },
    });
    if (!membership || membership.status !== GroupMembershipStatus.MEMBER) {
      throw new Error('Only members can share requests.');
    }

    const title = input.title.trim();
    if (title.length < 4) {
      throw new Error('Please provide a little more detail for this request.');
    }
    if (title.length > 220) {
      throw new Error('Prayer request titles should remain under 220 characters.');
    }

    const request = await tx.prayerRequest.create({
      data: {
        groupId: input.groupId,
        authorId: input.userId,
        title,
        body: input.body?.trim() || undefined,
        reference: input.reference?.trim() || undefined,
        reactionCounts: { praying: 0 },
        reactionUserIds: { praying: [] },
      },
      include: {
        author: true,
      },
    });

    await tx.group.update({
      where: { id: input.groupId },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return toPrayerRequestView(request, input.userId);
  });
}

export async function togglePrayerRequestPraying(input: {
  groupId: string;
  requestId: string;
  userId: string;
}): Promise<TogglePrayerReactionResult> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.groupMembership.findUnique({
      where: { groupId_userId: { groupId: input.groupId, userId: input.userId } },
    });
    if (!membership || membership.status !== GroupMembershipStatus.MEMBER) {
      throw new Error('Only members can respond to prayer requests.');
    }

    const request = await tx.prayerRequest.findUnique({
      where: { id: input.requestId },
    });
    if (!request || request.groupId !== input.groupId) {
      throw new Error('Prayer request not found.');
    }

    const counts = parseCounts(request.reactionCounts, { praying: 0 });
    const userIds = parseUserIds(request.reactionUserIds, { praying: [] });
    const prayingSet = new Set(userIds.praying ?? []);

    if (prayingSet.has(input.userId)) {
      prayingSet.delete(input.userId);
    } else {
      prayingSet.add(input.userId);
    }

    counts.praying = prayingSet.size;

    await tx.prayerRequest.update({
      where: { id: request.id },
      data: {
        reactionCounts: counts,
        reactionUserIds: { praying: Array.from(prayingSet) },
        lastActivityAt: new Date(),
      },
    });

    return {
      prayingCount: counts.praying,
      viewerHasPrayed: prayingSet.has(input.userId),
    };
  });
}

export async function archivePrayerRequest(input: {
  groupId: string;
  requestId: string;
  userId: string;
}): Promise<PrayerRequestView> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.groupMembership.findUnique({
      where: { groupId_userId: { groupId: input.groupId, userId: input.userId } },
      include: { user: true },
    });
    if (!membership || membership.status !== GroupMembershipStatus.MEMBER) {
      throw new Error('Only members can archive requests.');
    }

    const request = await tx.prayerRequest.findUnique({
      where: { id: input.requestId },
      include: { author: true },
    });

    if (!request || request.groupId !== input.groupId) {
      throw new Error('Prayer request not found.');
    }

    if (request.authorId !== input.userId && membership.role === GroupRole.MEMBER) {
      throw new Error('Only facilitators or the author can archive this request.');
    }

    const archivedAt = request.archivedAt ? new Date(request.archivedAt) : new Date();

    const updated = await tx.prayerRequest.update({
      where: { id: request.id },
      data: {
        archivedAt,
        lastActivityAt: archivedAt,
      },
      include: { author: true },
    });

    await tx.group.update({
      where: { id: input.groupId },
      data: {
        lastActivityAt: archivedAt,
      },
    });

    return toPrayerRequestView(updated, input.userId);
  });
}

export async function updateNotificationPreference(
  groupId: string,
  userId: string,
  preference: PrismaNotificationPreference
): Promise<NotificationPreferenceResult> {
  const membership = await prisma.groupMembership.update({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    data: {
      notifications: preference,
    },
  });

  return {
    membership: toMembershipView(membership),
  };
}
