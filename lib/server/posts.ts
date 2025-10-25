import { randomUUID } from 'crypto';
import { scriptureRegistry, parseReference, formatReference, bookFromSlug } from '@/lib/scripture';
import type { Passage, PassageReference, ScriptureSearchResult, TranslationCode } from '@/lib/scripture';
import { getDatabase, type PostRecord, type ReactionType, type ShareDraftRecord, type UserRecord } from './db';
import { ensureSeedData } from './seed';

export type FeedPost = {
  id: string;
  passage: Passage;
  reflection?: string;
  tags: string[];
  author: Pick<UserRecord, 'id' | 'name' | 'role' | 'location'>;
  createdAt: string;
  commentCount: number;
  reactions: {
    counts: Record<ReactionType, number>;
    viewer: ReactionType[];
  };
  translation: TranslationCode;
  reportCount: number;
};

export type SharePayload = {
  userId: string;
  reference: PassageReference;
  reflection?: string;
  tags?: string[];
};

export type ReportPayload = {
  postId: string;
  reporterId: string;
  reason: string;
};

const DEFAULT_VIEWER_ID = 'viewer_guest';

function createId(prefix: string, length = 12) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, length)}`;
}

function resolveViewerId(viewerId?: string) {
  return viewerId ?? DEFAULT_VIEWER_ID;
}

async function toFeedPost(record: PostRecord, viewerId?: string): Promise<FeedPost> {
  const db = getDatabase();
  const author = db.users.get(record.authorId);
  const reference = parseReference(record.reference);
  const passage = await scriptureRegistry.getPassage(record.translation, reference);

  if (!author) {
    throw new Error(`Author ${record.authorId} missing for post ${record.id}.`);
  }

  if (!passage) {
    throw new Error(`Unable to load passage for ${record.reference}.`);
  }

  const viewerReactions: ReactionType[] = [];
  const resolvedViewer = resolveViewerId(viewerId);
  (['amen', 'praying'] as ReactionType[]).forEach((reaction) => {
    const set = record.reactionUserIds[reaction];
    if (set.has(resolvedViewer)) {
      viewerReactions.push(reaction);
    }
  });

  return {
    id: record.id,
    passage,
    reflection: record.reflection,
    tags: record.tags,
    author: {
      id: author.id,
      name: author.name,
      role: author.role,
      location: author.location,
    },
    createdAt: record.createdAt,
    commentCount: record.commentCount,
    reactions: {
      counts: record.reactionCounts,
      viewer: viewerReactions,
    },
    translation: record.translation,
    reportCount: record.reportUserIds.size,
  };
}

export async function getFeedPosts(viewerId?: string): Promise<FeedPost[]> {
  ensureSeedData();
  const db = getDatabase();
  const posts = Array.from(db.posts.values()).filter((post) => post.status === 'published');

  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return Promise.all(posts.map((post) => toFeedPost(post, viewerId)));
}

export async function toggleReaction(postId: string, reaction: ReactionType, viewerId?: string) {
  ensureSeedData();
  const db = getDatabase();
  const post = db.posts.get(postId);

  if (!post) {
    throw new Error(`Post ${postId} not found.`);
  }

  const resolvedViewer = resolveViewerId(viewerId);
  const reactionSet = post.reactionUserIds[reaction];

  if (!reactionSet) {
    throw new Error(`Reaction ${reaction} not initialized for post ${postId}.`);
  }

  if (reactionSet.has(resolvedViewer)) {
    reactionSet.delete(resolvedViewer);
    post.reactionCounts[reaction] = Math.max(0, post.reactionCounts[reaction] - 1);
  } else {
    reactionSet.add(resolvedViewer);
    post.reactionCounts[reaction] += 1;
  }

  return {
    counts: post.reactionCounts,
    viewer: (['amen', 'praying'] as ReactionType[]).filter((type) => post.reactionUserIds[type].has(resolvedViewer)),
  };
}

export async function reportPost(payload: ReportPayload) {
  ensureSeedData();
  const db = getDatabase();
  const post = db.posts.get(payload.postId);
  if (!post) {
    throw new Error(`Cannot report missing post ${payload.postId}.`);
  }

  post.reportUserIds.add(payload.reporterId);
  const reportId = createId('report', 10);
  const createdAt = new Date().toISOString();
  db.reports.set(reportId, {
    id: reportId,
    postId: payload.postId,
    reporterId: payload.reporterId,
    reason: payload.reason,
    createdAt,
    status: 'pending',
  });

  if (post.reportUserIds.size >= 3 && post.status === 'published') {
    post.status = 'flagged';
  }

  return {
    reportId,
    totalReports: post.reportUserIds.size,
    status: post.status,
    reportStatus: 'pending' as const,
  };
}

export async function createShare(payload: SharePayload) {
  ensureSeedData();
  const db = getDatabase();

  const user = db.users.get(payload.userId);
  if (!user) {
    throw new Error(`Cannot share Scripture for unknown user ${payload.userId}.`);
  }

  const referenceLabel = formatReference(payload.reference);
  const postId = createId('post', 12);

  const newRecord: PostRecord = {
    id: postId,
    authorId: user.id,
    reference: referenceLabel,
    translation: 'WEB',
    reflection: payload.reflection?.trim() || undefined,
    tags: payload.tags ?? [],
    createdAt: new Date().toISOString(),
    commentCount: 0,
    reactionCounts: { amen: 0, praying: 0 },
    reactionUserIds: { amen: new Set<string>(), praying: new Set<string>() },
    reportUserIds: new Set<string>(),
    status: 'published',
  };

  db.posts.set(newRecord.id, newRecord);

  const draft: ShareDraftRecord = {
    id: createId('share', 12),
    userId: payload.userId,
    reference: referenceLabel,
    reflection: payload.reflection,
    createdAt: new Date().toISOString(),
    submittedAt: newRecord.createdAt,
  };

  db.shares.set(draft.id, draft);

  return toFeedPost(newRecord, payload.userId);
}

export async function searchScripture(query: string, limit = 12): Promise<ScriptureSearchResult[]> {
  ensureSeedData();
  return scriptureRegistry.search('WEB', query, { limit });
}

export async function getPassageFromId(id: string): Promise<Passage | null> {
  ensureSeedData();
  const match = id.match(/^(?<bookSlug>[a-z0-9-]+)-(?<chapter>\d+)-(?<start>\d+)(?:-(?<end>\d+))?$/i);
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


