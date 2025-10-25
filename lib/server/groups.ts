import { randomUUID } from 'crypto';
import {
  getDatabase,
  type GroupMembershipRecord,
  type GroupRecord,
  type PrayerRequestRecord,
} from './db';
import { ensureSeedData } from './seed';

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

export type GroupMembershipView = {
  id: string;
  status: ViewerGroupStatus;
  role: GroupMembershipRecord['role'];
  notifications: GroupMembershipRecord['notifications'];
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

function createId(prefix: string, slice = 10) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, slice)}`;
}

function findMembership(groupId: string, userId: string): GroupMembershipRecord | null {
  const db = getDatabase();
  for (const membership of Array.from(db.groupMemberships.values())) {
    if (membership.groupId === groupId && membership.userId === userId) {
      return membership;
    }
  }
  return null;
}

function applyArchivePolicy(request: PrayerRequestRecord, nowMs: number) {
  if (request.archivedAt) {
    return;
  }
  const createdAtMs = new Date(request.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return;
  }
  if (nowMs - createdAtMs >= THIRTY_DAYS_MS) {
    const archivedAt = new Date(createdAtMs + THIRTY_DAYS_MS).toISOString();
    request.archivedAt = archivedAt;
    request.lastActivityAt = archivedAt;
  }
}

function toMembershipView(record: GroupMembershipRecord | null, fallbackStatus: ViewerGroupStatus = 'guest'): GroupMembershipView {
  if (!record) {
    return {
      id: 'guest',
      status: fallbackStatus,
      role: 'member',
      notifications: 'quiet',
    };
  }
  return {
    id: record.id,
    status: record.status,
    role: record.role,
    notifications: record.notifications,
    joinedAt: record.joinedAt,
    lastVisitedAt: record.lastVisitedAt,
  };
}

function toRequestView(
  request: PrayerRequestRecord,
  viewerId: string | null | undefined
): PrayerRequestView {
  const db = getDatabase();
  const author = db.users.get(request.authorId);
  const viewerHasPrayed = viewerId ? request.reactionUserIds.praying.has(viewerId) : false;
  return {
    id: request.id,
    title: request.title,
    body: request.body,
    reference: request.reference,
    createdAt: request.createdAt,
    archivedAt: request.archivedAt,
    author: {
      id: author?.id ?? request.authorId,
      name: author?.name ?? author?.email ?? 'Member',
      role: author?.role ?? null,
    },
    prayingCount: request.reactionCounts.praying,
    viewerHasPrayed,
  };
}

function deriveViewerStatus(membership: GroupMembershipRecord | null): ViewerGroupStatus {
  if (!membership) {
    return 'guest';
  }
  if (membership.status === 'member') {
    return 'member';
  }
  if (membership.status === 'pending') {
    return 'pending';
  }
  return 'suspended';
}

function buildSummary(
  group: GroupRecord,
  viewerId: string | null | undefined,
  nowMs: number
): PrayerGroupSummary {
  const db = getDatabase();
  const membership = viewerId ? findMembership(group.id, viewerId) : null;
  const viewerStatus = deriveViewerStatus(membership);

  const facilitatorList = Array.from(group.facilitatorIds).map((id) => {
    const user = db.users.get(id);
    return {
      id,
      name: user?.name ?? user?.email ?? 'Facilitator',
    };
  });

  const requests = Array.from(group.requestIds)
    .map((requestId) => db.prayerRequests.get(requestId))
    .filter((request): request is PrayerRequestRecord => Boolean(request));

  const previews = requests
    .map((request) => {
      applyArchivePolicy(request, nowMs);
      const author = db.users.get(request.authorId);
      return {
        id: request.id,
        title: request.title,
        createdAt: request.createdAt,
        archivedAt: request.archivedAt,
        prayingCount: request.reactionCounts.praying,
        authorName: author?.name ?? author?.email ?? 'Member',
      };
    })
    .filter((preview) => !preview.archivedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 2);

  return {
    id: group.id,
    name: group.name,
    focus: group.focus,
    scriptureAnchor: group.scriptureAnchor,
    description: group.description,
    memberCount: group.memberIds.size,
    memberLimit: group.memberLimit,
    pendingCount: group.pendingMemberIds.size,
    viewerStatus,
    isPrivate: group.isPrivate,
    tags: group.tags,
    lastActivityAt: group.lastActivityAt,
    facilitators: facilitatorList,
    previewRequests: previews,
  };
}

function deriveTypingIndicators(
  group: GroupRecord,
  viewerId: string | null | undefined,
  nowMs: number
): TypingIndicator[] {
  const db = getDatabase();
  const indicators: TypingIndicator[] = [];

  for (const membership of Array.from(db.groupMemberships.values())) {
    if (membership.groupId !== group.id) {
      continue;
    }
    if (membership.status !== 'member') {
      continue;
    }
    if (viewerId && membership.userId === viewerId) {
      continue;
    }
    if (!membership.lastVisitedAt) {
      continue;
    }
    const lastVisitedMs = new Date(membership.lastVisitedAt).getTime();
    if (Number.isNaN(lastVisitedMs)) {
      continue;
    }
    const minutesSinceVisit = (nowMs - lastVisitedMs) / (1000 * 60);
    if (minutesSinceVisit > 15) {
      continue;
    }
    const user = db.users.get(membership.userId);
    if (!user) {
      continue;
    }
    indicators.push({
      id: user.id,
      name: user.name ?? user.email ?? 'Member',
      role: user.role ?? undefined,
      tone: minutesSinceVisit < 5 ? 'typing' : 'praying',
    });
  }

  return indicators.slice(0, 3);
}

export function getPrayerGroupDirectory(viewerId?: string | null): PrayerGroupSummary[] {
  ensureSeedData();
  const db = getDatabase();
  const nowMs = Date.now();

  const groups = Array.from(db.groups.values()).sort((a, b) =>
    a.lastActivityAt < b.lastActivityAt ? 1 : -1
  );

  return groups.map((group) => buildSummary(group, viewerId ?? null, nowMs));
}

export function getPrayerGroupDetail(
  groupId: string,
  viewerId?: string | null
): PrayerGroupDetail {
  ensureSeedData();
  const db = getDatabase();
  const nowMs = Date.now();
  const group = db.groups.get(groupId);
  if (!group) {
    throw new Error('Prayer group not found.');
  }

  const membershipRecord = viewerId ? findMembership(groupId, viewerId) : null;
  const membershipView = toMembershipView(membershipRecord);

  if (membershipRecord) {
    membershipRecord.lastVisitedAt = new Date().toISOString();
  }

  const requests = Array.from(group.requestIds)
    .map((requestId) => db.prayerRequests.get(requestId))
    .filter((request): request is PrayerRequestRecord => Boolean(request));

  const activeRequests: PrayerRequestView[] = [];
  const archivedRequests: PrayerRequestView[] = [];

  requests.forEach((request) => {
    applyArchivePolicy(request, nowMs);
    const view = toRequestView(request, viewerId);
    if (request.archivedAt) {
      archivedRequests.push(view);
    } else {
      activeRequests.push(view);
    }
  });

  activeRequests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  archivedRequests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const summary = buildSummary(group, viewerId ?? null, nowMs);
  const typing = deriveTypingIndicators(group, viewerId ?? null, nowMs);

  return {
    summary,
    membership: membershipView,
    requests: activeRequests,
    archivedRequests,
    typing,
    capacityFull: group.memberIds.size >= group.memberLimit,
  };
}

export function requestGroupMembership(
  groupId: string,
  userId: string
): JoinGroupResult {
  ensureSeedData();
  const db = getDatabase();
  const group = db.groups.get(groupId);
  if (!group) {
    throw new Error('Unable to join a missing group.');
  }

  const nowIso = new Date().toISOString();
  const membership = findMembership(groupId, userId);

  if (membership && membership.status === 'member') {
    return {
      status: 'member',
      requiresApproval: false,
      membership: toMembershipView(membership),
    };
  }

  if (group.memberIds.size >= group.memberLimit && !group.memberIds.has(userId)) {
    return {
      status: membership ? deriveViewerStatus(membership) : 'guest',
      requiresApproval: false,
      capacityFull: true,
      membership: membership ? toMembershipView(membership) : null,
    };
  }

  if (group.isPrivate) {
    if (!membership) {
      const newMembership: GroupMembershipRecord = {
        id: createId('membership'),
        groupId,
        userId,
        role: 'member',
        status: 'pending',
        notifications: 'quiet',
      };
      db.groupMemberships.set(newMembership.id, newMembership);
      group.pendingMemberIds.add(userId);
      group.updatedAt = nowIso;
      return {
        status: 'pending',
        requiresApproval: true,
        membership: toMembershipView(newMembership),
      };
    }

    membership.status = 'pending';
    membership.notifications = membership.notifications ?? 'quiet';
    membership.lastVisitedAt = nowIso;
    group.pendingMemberIds.add(userId);
    group.memberIds.delete(userId);
    group.updatedAt = nowIso;
    return {
      status: 'pending',
      requiresApproval: true,
      membership: toMembershipView(membership),
    };
  }

  if (!membership) {
    const record: GroupMembershipRecord = {
      id: createId('membership'),
      groupId,
      userId,
      role: group.facilitatorIds.has(userId) ? 'facilitator' : 'member',
      status: 'member',
      notifications: 'quiet',
      joinedAt: nowIso,
      lastVisitedAt: nowIso,
    };
    db.groupMemberships.set(record.id, record);
    group.memberIds.add(userId);
    group.pendingMemberIds.delete(userId);
    group.lastActivityAt = nowIso;
    group.updatedAt = nowIso;
    return {
      status: 'member',
      requiresApproval: false,
      membership: toMembershipView(record),
    };
  }

  membership.status = 'member';
  membership.joinedAt = membership.joinedAt ?? nowIso;
  membership.notifications = membership.notifications ?? 'quiet';
  membership.lastVisitedAt = nowIso;
  if (!membership.role) {
    membership.role = 'member';
  }
  group.pendingMemberIds.delete(userId);
  group.memberIds.add(userId);
  group.lastActivityAt = nowIso;
  group.updatedAt = nowIso;

  return {
    status: 'member',
    requiresApproval: false,
    membership: toMembershipView(membership),
  };
}

export function leaveGroupMembership(groupId: string, userId: string): LeaveGroupResult {
  ensureSeedData();
  const db = getDatabase();
  const group = db.groups.get(groupId);
  if (!group) {
    throw new Error('Group not found.');
  }

  const membership = findMembership(groupId, userId);
  if (!membership) {
    return {
      status: 'guest',
      membership: null,
    };
  }

  membership.status = 'suspended';
  membership.lastVisitedAt = new Date().toISOString();
  membership.notifications = 'quiet';

  group.memberIds.delete(userId);
  group.pendingMemberIds.delete(userId);
  group.updatedAt = membership.lastVisitedAt;

  return {
    status: 'suspended',
    membership: toMembershipView(membership),
  };
}

export function updateNotificationPreference(
  groupId: string,
  userId: string,
  preference: GroupMembershipRecord['notifications']
): NotificationPreferenceResult {
  ensureSeedData();
  const membership = findMembership(groupId, userId);
  if (!membership) {
    throw new Error('Membership not found.');
  }
  if (membership.status !== 'member') {
    throw new Error('Only active members can update notifications.');
  }
  membership.notifications = preference;
  membership.lastVisitedAt = new Date().toISOString();
  return {
    membership: toMembershipView(membership),
  };
}

export function createPrayerRequest(input: {
  groupId: string;
  userId: string;
  title: string;
  body?: string;
  reference?: string;
}): PrayerRequestView {
  ensureSeedData();
  const db = getDatabase();
  const group = db.groups.get(input.groupId);
  if (!group) {
    throw new Error('Prayer group not found.');
  }

  const membership = findMembership(input.groupId, input.userId);
  if (!membership || membership.status !== 'member') {
    throw new Error('Only members can share requests.');
  }

  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('Please provide a prayer request title.');
  }
  if (title.length > 220) {
    throw new Error('Prayer request titles should remain under 220 characters.');
  }

  const nowIso = new Date().toISOString();
  const record: PrayerRequestRecord = {
    id: createId('request'),
    groupId: input.groupId,
    authorId: input.userId,
    title,
    body: input.body?.trim() ? input.body.trim() : undefined,
    reference: input.reference?.trim() ? input.reference.trim() : undefined,
    createdAt: nowIso,
    archivedAt: undefined,
    answeredAt: undefined,
    lastActivityAt: nowIso,
    reactionCounts: { praying: 0 },
    reactionUserIds: { praying: new Set<string>() },
  };

  db.prayerRequests.set(record.id, record);
  group.requestIds.add(record.id);
  group.lastActivityAt = nowIso;
  group.updatedAt = nowIso;

  membership.lastVisitedAt = nowIso;

  return toRequestView(record, input.userId);
}

export function togglePrayerRequestPraying(input: {
  groupId: string;
  requestId: string;
  userId: string;
}): TogglePrayerReactionResult {
  ensureSeedData();
  const db = getDatabase();
  const group = db.groups.get(input.groupId);
  if (!group) {
    throw new Error('Prayer group not found.');
  }

  const request = db.prayerRequests.get(input.requestId);
  if (!request || request.groupId !== input.groupId) {
    throw new Error('Prayer request not found.');
  }

  const membership = findMembership(input.groupId, input.userId);
  if (!membership || membership.status !== 'member') {
    throw new Error('Only members can respond to prayer requests.');
  }

  const reactionSet = request.reactionUserIds.praying;
  const nowIso = new Date().toISOString();
  if (reactionSet.has(input.userId)) {
    reactionSet.delete(input.userId);
    request.reactionCounts.praying = Math.max(0, request.reactionCounts.praying - 1);
  } else {
    reactionSet.add(input.userId);
    request.reactionCounts.praying += 1;
  }

  request.lastActivityAt = nowIso;
  membership.lastVisitedAt = nowIso;
  group.lastActivityAt = nowIso;
  group.updatedAt = nowIso;

  return {
    prayingCount: request.reactionCounts.praying,
    viewerHasPrayed: reactionSet.has(input.userId),
  };
}

export function archivePrayerRequest(input: {
  groupId: string;
  requestId: string;
  userId: string;
}): PrayerRequestView {
  ensureSeedData();
  const db = getDatabase();
  const group = db.groups.get(input.groupId);
  if (!group) {
    throw new Error('Prayer group not found.');
  }
  const request = db.prayerRequests.get(input.requestId);
  if (!request || request.groupId !== input.groupId) {
    throw new Error('Prayer request not found.');
  }

  const membership = findMembership(input.groupId, input.userId);
  if (!membership || membership.status !== 'member') {
    throw new Error('Only members can archive requests.');
  }

  if (request.archivedAt) {
    return toRequestView(request, input.userId);
  }

  const nowIso = new Date().toISOString();
  if (request.authorId !== input.userId && membership.role === 'member') {
    throw new Error('Only facilitators or the author can archive this request.');
  }

  request.archivedAt = nowIso;
  request.lastActivityAt = nowIso;
  group.lastActivityAt = nowIso;
  group.updatedAt = nowIso;
  membership.lastVisitedAt = nowIso;

  return toRequestView(request, input.userId);
}
