import type { TranslationCode } from '@/lib/scripture';

export type ReactionType = 'amen' | 'praying';

export type UserRecord = {
  id: string;
  name: string;
  email?: string;
  role: string;
  location?: string;
  avatarUrl?: string;
  createdAt: string;
};

export type PostRecord = {
  id: string;
  reference: string;
  translation: TranslationCode;
  reflection?: string;
  tags: string[];
  authorId: string;
  createdAt: string;
  commentCount: number;
  reactionCounts: Record<ReactionType, number>;
  reactionUserIds: Record<ReactionType, Set<string>>;
  reportUserIds: Set<string>;
  status: 'published' | 'flagged' | 'archived';
};

export type ReportRecord = {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  status: 'pending' | 'in_review' | 'actioned' | 'dismissed';
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type MagicLinkRecord = {
  id: string;
  userId: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
};

export type OAuthStateRecord = {
  id: string;
  provider: 'google' | 'apple';
  redirectTo?: string;
  createdAt: string;
  expiresAt: string;
};

export type ShareDraftRecord = {
  id: string;
  userId: string;
  reference: string;
  reflection?: string;
  createdAt: string;
  submittedAt?: string;
};

export type GroupRecord = {
  id: string;
  name: string;
  focus: string;
  scriptureAnchor: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberLimit: number;
  isPrivate: boolean;
  tags: string[];
  imageUrl?: string;
  pendingMemberIds: Set<string>;
  memberIds: Set<string>;
  facilitatorIds: Set<string>;
  requestIds: Set<string>;
  lastActivityAt: string;
};

export type GroupMembershipRecord = {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'facilitator' | 'member';
  status: 'member' | 'pending' | 'suspended';
  joinedAt?: string;
  mutedUntil?: string;
  notifications: 'all' | 'quiet' | 'mentions';
  lastVisitedAt?: string;
};

export type PrayerRequestRecord = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body?: string;
  reference?: string;
  createdAt: string;
  archivedAt?: string;
  answeredAt?: string;
  lastActivityAt: string;
  reactionCounts: Record<'praying', number>;
  reactionUserIds: Record<'praying', Set<string>>;
};

export type ModerationActionRecord = {
  id: string;
  reportId?: string;
  postId: string;
  actorId: string;
  action: 'hide' | 'warn' | 'suspend' | 'restore';
  createdAt: string;
  notes?: string;
};

type DatabaseShape = {
  users: Map<string, UserRecord>;
  posts: Map<string, PostRecord>;
  reports: Map<string, ReportRecord>;
  shares: Map<string, ShareDraftRecord>;
  sessions: Map<string, SessionRecord>;
  magicLinks: Map<string, MagicLinkRecord>;
  oauthStates: Map<string, OAuthStateRecord>;
  groups: Map<string, GroupRecord>;
  groupMemberships: Map<string, GroupMembershipRecord>;
  prayerRequests: Map<string, PrayerRequestRecord>;
  moderationActions: Map<string, ModerationActionRecord>;
};

const globalWithDb = globalThis as typeof globalThis & {
  __goelDb?: DatabaseShape;
};

const existingDb = globalWithDb.__goelDb;

const database: DatabaseShape = {
  users: existingDb?.users ?? new Map(),
  posts: existingDb?.posts ?? new Map(),
  reports: existingDb?.reports ?? new Map(),
  shares: existingDb?.shares ?? new Map(),
  sessions: existingDb?.sessions ?? new Map(),
  magicLinks: existingDb?.magicLinks ?? new Map(),
  oauthStates: existingDb?.oauthStates ?? new Map(),
  groups: existingDb?.groups ?? new Map(),
  groupMemberships: existingDb?.groupMemberships ?? new Map(),
  prayerRequests: existingDb?.prayerRequests ?? new Map(),
  moderationActions: existingDb?.moderationActions ?? new Map(),
};

// Re-assign to ensure any new collections are available without losing existing state.
globalWithDb.__goelDb = database;

export function getDatabase(): DatabaseShape {
  return database;
}
