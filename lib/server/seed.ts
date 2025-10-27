import { formatReference, parseReference } from '@/lib/scripture';
import type { PassageReference } from '@/lib/scripture';
import {
  getDatabase,
  type GroupMembershipRecord,
  type ModerationActionRecord,
  type PostRecord,
  type PrayerRequestRecord,
  type ReactionType,
  type ReportRecord,
  type ShareDraftRecord,
  type UserRecord,
} from './db';

let seeded = false;

const USER_SEED: UserRecord[] = [
  {
    id: 'user_miriam',
    name: 'Miriam L.',
    email: 'miriam@example.com',
    role: 'House Church Coordinator',
    location: 'Jerusalem, IL',
    profileSlug: 'miriam-l',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 36).toISOString(),
  },
  {
    id: 'user_samuel',
    name: 'Samuel K.',
    email: 'samuel@example.com',
    role: 'Mission Pastor',
    location: 'Nairobi, KE',
    profileSlug: 'samuel-k',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26).toISOString(),
  },
  {
    id: 'user_grace',
    name: 'Grace P.',
    email: 'grace@example.com',
    role: 'Discipleship Guide',
    location: 'Austin, US',
    profileSlug: 'grace-p',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: 'user_noah',
    name: 'Noah A.',
    email: 'noah@example.com',
    role: 'Prayer Room Host',
    location: 'Toronto, CA',
    profileSlug: 'noah-a',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'user_hannah',
    name: 'Hannah R.',
    email: 'hannah@example.com',
    role: 'Prayer Scribe',
    location: 'London, UK',
    profileSlug: 'hannah-r',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'user_admin',
    name: 'Abigail K.',
    email: 'abigail@goel.app',
    role: 'Admin',
    location: 'Chicago, US',
    profileSlug: 'abigail-k',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
  },
];

type SeedPostArgs = {
  id: string;
  authorId: string;
  reference: PassageReference;
  reflection?: string;
  tags: string[];
  createdHoursAgo: number;
  reactionCounts: Record<ReactionType, number>;
  commentCount: number;
};

const POST_SEED: SeedPostArgs[] = [
  {
    id: 'post_psalm_23_1_3',
    authorId: 'user_miriam',
    reference: parseReference('Psalms 23:1-3'),
    reflection:
      'Praying this over every weary heart tonight. He is still the Shepherd and He is still leading us beside His peace.',
    tags: ['Shepherd', 'Comfort', 'Evening'],
    createdHoursAgo: 2,
    reactionCounts: { amen: 48, praying: 17 },
    commentCount: 7,
  },
  {
    id: 'post_hebrews_10_24_25',
    authorId: 'user_samuel',
    reference: parseReference('Hebrews 10:24-25'),
    tags: ['Encouragement', 'Gathering'],
    createdHoursAgo: 5,
    reactionCounts: { amen: 63, praying: 9 },
    commentCount: 12,
  },
  {
    id: 'post_john_15_4_5',
    authorId: 'user_grace',
    reference: parseReference('John 15:4-5'),
    reflection:
      'Shared during our discipleship circle tonight. We are asking the Spirit to prune what keeps us from abiding closely in Jesus.',
    tags: ['Abide', 'Discipleship'],
    createdHoursAgo: 26,
    reactionCounts: { amen: 39, praying: 6 },
    commentCount: 5,
  },
  {
    id: 'post_isaiah_26_3_4',
    authorId: 'user_noah',
    reference: parseReference('Isaiah 26:3-4'),
    tags: ['Peace', 'Trust'],
    createdHoursAgo: 48,
    reactionCounts: { amen: 27, praying: 11 },
    commentCount: 3,
  },
];

type ReflectionSeed = {
  id: string;
  userId: string;
  postId: string;
  createdHoursAgo: number;
};

const REFLECTION_SEED: ReflectionSeed[] = [
  {
    id: 'reflection_miriam_john15',
    userId: 'user_miriam',
    postId: 'post_john_15_4_5',
    createdHoursAgo: 30,
  },
  {
    id: 'reflection_grace_psalm23',
    userId: 'user_grace',
    postId: 'post_psalm_23_1_3',
    createdHoursAgo: 60,
  },
  {
    id: 'reflection_noah_hebrews10',
    userId: 'user_noah',
    postId: 'post_hebrews_10_24_25',
    createdHoursAgo: 80,
  },
];

type PlanProgressSeed = {
  id: string;
  userId: string;
  planId: string;
  day: number;
  completedDaysAgo: number;
};

const PLAN_PROGRESS_SEED: PlanProgressSeed[] = [
  {
    id: 'progress_miriam_day_1',
    userId: 'user_miriam',
    planId: 'gospel-journey-30',
    day: 1,
    completedDaysAgo: 10,
  },
  {
    id: 'progress_miriam_day_2',
    userId: 'user_miriam',
    planId: 'gospel-journey-30',
    day: 2,
    completedDaysAgo: 9,
  },
  {
    id: 'progress_grace_day_1',
    userId: 'user_grace',
    planId: 'gospel-journey-30',
    day: 1,
    completedDaysAgo: 5,
  },
  {
    id: 'progress_grace_day_2',
    userId: 'user_grace',
    planId: 'gospel-journey-30',
    day: 2,
    completedDaysAgo: 3,
  },
  {
    id: 'progress_grace_day_3',
    userId: 'user_grace',
    planId: 'gospel-journey-30',
    day: 3,
    completedDaysAgo: 1,
  },
];

type GroupSeed = {
  id: string;
  name: string;
  focus: string;
  scriptureAnchor: string;
  description: string;
  ownerId: string;
  facilitators: string[];
  members: string[];
  pending?: string[];
  memberLimit: number;
  isPrivate: boolean;
  tags: string[];
  createdDaysAgo: number;
  imageUrl?: string;
};

const GROUP_SEED: GroupSeed[] = [
  {
    id: 'group_gatewatch',
    name: 'Gate Watch Intercessors',
    focus: 'Covering families and cities at dawn in united Scripture prayer.',
    scriptureAnchor: 'Nehemiah 4:9',
    description:
      'We take the first watch each morning, opening the Word together and guarding our communities in prayer.',
    ownerId: 'user_miriam',
    facilitators: ['user_admin'],
    members: ['user_miriam', 'user_samuel', 'user_grace', 'user_noah'],
    memberLimit: 25,
    isPrivate: false,
    tags: ['Intercession', 'Families', 'Morning'],
    createdDaysAgo: 24,
  },
  {
    id: 'group_midnight_oil',
    name: 'Midnight Oil Fellowship',
    focus: 'Late-night encouragement for weary hearts through gentle petitions.',
    scriptureAnchor: 'Acts 20:7-8',
    description:
      'A quiet room for those up late interceding for breakthrough, guided by short passages and reflective prayer.',
    ownerId: 'user_grace',
    facilitators: ['user_grace'],
    members: ['user_grace', 'user_noah'],
    pending: ['user_hannah'],
    memberLimit: 25,
    isPrivate: true,
    tags: ['Night', 'Care', 'Encouragement'],
    createdDaysAgo: 10,
  },
];

type RequestSeed = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body?: string;
  reference?: string;
  createdHoursAgo: number;
  prayingUserIds?: string[];
};

const REQUEST_SEED: RequestSeed[] = [
  {
    id: 'request_surgery',
    groupId: 'group_gatewatch',
    authorId: 'user_grace',
    title: 'Surgery for my father this Friday',
    body: 'Asking for steady hands for the surgeons and peace for our family as we trust the Shepherd.',
    reference: 'Psalm 121:1-2',
    createdHoursAgo: 6,
    prayingUserIds: ['user_miriam', 'user_noah', 'user_admin'],
  },
  {
    id: 'request_house_church',
    groupId: 'group_gatewatch',
    authorId: 'user_miriam',
    title: 'Cover our new house church launch',
    body: 'We gather this Sunday in Ramot. Pray for bold proclamation and tender hearts among the neighbours.',
    reference: 'Acts 2:42-47',
    createdHoursAgo: 54,
    prayingUserIds: ['user_samuel'],
  },
  {
    id: 'request_midnight_comfort',
    groupId: 'group_midnight_oil',
    authorId: 'user_noah',
    title: 'Comfort for David after job loss',
    body: 'He needs a door to open soon and for hope to stir again. We are walking with him nightly.',
    reference: 'Isaiah 43:19',
    createdHoursAgo: 12,
    prayingUserIds: ['user_grace'],
  },
  {
    id: 'request_archived_mission',
    groupId: 'group_gatewatch',
    authorId: 'user_samuel',
    title: 'Mission trip thanksgiving',
    body: 'Trip completed with joy. Leaving this note archived so we remember how the Lord provided.',
    reference: 'Romans 15:20',
    createdHoursAgo: 24 * 38,
    prayingUserIds: ['user_miriam', 'user_grace'],
  },
];

const REPORT_SEED: ReportRecord[] = [
  {
    id: 'report_psalm_translation',
    postId: 'post_psalm_23_1_3',
    reporterId: 'user_noah',
    reason: 'Clarify translation context for seekers reading along.',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'report_john_commentary',
    postId: 'post_john_15_4_5',
    reporterId: 'user_miriam',
    reason: 'Reflection may drift into personal commentary. Needs review.',
    status: 'in_review',
    notes: 'Awaiting follow-up from author to trim personal story.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const MODERATION_ACTION_SEED: ModerationActionRecord[] = [
  {
    id: 'action_warn_john_reflection',
    reportId: 'report_john_commentary',
    postId: 'post_john_15_4_5',
    actorId: 'user_admin',
    action: 'warn',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    notes: 'Sent reminder to keep reflections within Scripture text. Awaiting acknowledgement.',
  },
];

export function ensureSeedData() {
  if (seeded) {
    return;
  }

  const db = getDatabase();
  const now = Date.now();

  if (db.users.size === 0) {
    USER_SEED.forEach((user) => {
      db.users.set(user.id, user);
    });
  }

  if (db.posts.size === 0) {
    POST_SEED.forEach((seed) => {
      const createdAt = new Date(now - seed.createdHoursAgo * 60 * 60 * 1000);
      const post: PostRecord = {
        id: seed.id,
        authorId: seed.authorId,
        reference: formatReference(seed.reference),
        translation: 'WEB',
        reflection: seed.reflection,
        tags: seed.tags,
        createdAt: createdAt.toISOString(),
        commentCount: seed.commentCount,
        reactionCounts: seed.reactionCounts,
        reactionUserIds: {
          amen: new Set<string>(['seed_viewer_a', 'seed_viewer_b']),
          praying: new Set<string>(['seed_viewer_c']),
        },
        reportUserIds: new Set<string>(),
        status: 'published',
      };
      db.posts.set(post.id, post);
    });
  }

  if (db.reflections.size === 0) {
    REFLECTION_SEED.forEach((seed) => {
      const createdAt = new Date(now - seed.createdHoursAgo * 60 * 60 * 1000).toISOString();
      db.reflections.set(seed.id, {
        id: seed.id,
        userId: seed.userId,
        postId: seed.postId,
        createdAt,
      });
    });
  }

  if (db.planProgress.size === 0) {
    PLAN_PROGRESS_SEED.forEach((seed) => {
      const completedAt = new Date(now - seed.completedDaysAgo * 24 * 60 * 60 * 1000).toISOString();
      db.planProgress.set(seed.id, {
        id: seed.id,
        userId: seed.userId,
        planId: seed.planId,
        day: seed.day,
        completedAt,
      });
    });
  }

  if (db.groups.size === 0) {
    GROUP_SEED.forEach((seed) => {
      const createdAt = new Date(now - seed.createdDaysAgo * 24 * 60 * 60 * 1000);
      const baseMembers = Array.from(new Set<string>([seed.ownerId, ...seed.facilitators, ...seed.members]));
      const group = {
        id: seed.id,
        name: seed.name,
        focus: seed.focus,
        scriptureAnchor: seed.scriptureAnchor,
        description: seed.description,
        ownerId: seed.ownerId,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        memberLimit: seed.memberLimit,
        isPrivate: seed.isPrivate,
        tags: seed.tags,
        imageUrl: seed.imageUrl,
        pendingMemberIds: new Set<string>(seed.pending ?? []),
        memberIds: new Set<string>(baseMembers),
        facilitatorIds: new Set<string>(seed.facilitators),
        requestIds: new Set<string>(),
        lastActivityAt: createdAt.toISOString(),
      };
      db.groups.set(group.id, group);
    });
  }

  if (db.groupMemberships.size === 0) {
    GROUP_SEED.forEach((seed) => {
      const group = db.groups.get(seed.id);
      if (!group) {
        return;
      }

      const baseMembers = Array.from(new Set<string>([seed.ownerId, ...seed.facilitators, ...seed.members]));
      baseMembers.forEach((userId, index) => {
        const membershipId = `${seed.id}_member_${userId}`;
        const record: GroupMembershipRecord = {
          id: membershipId,
          groupId: seed.id,
          userId,
          role: userId === group.ownerId ? 'owner' : seed.facilitators.includes(userId) ? 'facilitator' : 'member',
          status: 'member',
          joinedAt: new Date(now - seed.createdDaysAgo * 24 * 60 * 60 * 1000 + index * 60 * 60 * 1000).toISOString(),
          notifications:
            userId === group.ownerId || seed.facilitators.includes(userId) ? 'all' : ('quiet' as GroupMembershipRecord['notifications']),
          lastVisitedAt: new Date(now - index * 30 * 60 * 1000).toISOString(),
        };
        db.groupMemberships.set(membershipId, record);
        group.memberIds.add(userId);
      });

      (seed.pending ?? []).forEach((userId) => {
        const membershipId = `${seed.id}_pending_${userId}`;
        const record: GroupMembershipRecord = {
          id: membershipId,
          groupId: seed.id,
          userId,
          role: 'member',
          status: 'pending',
          notifications: 'quiet',
        };
        db.groupMemberships.set(membershipId, record);
        group.pendingMemberIds.add(userId);
      });

      group.facilitatorIds = new Set<string>(seed.facilitators);
      db.groups.set(group.id, group);
    });
  }

  if (db.prayerRequests.size === 0) {
    REQUEST_SEED.forEach((seed) => {
      const createdAt = new Date(now - seed.createdHoursAgo * 60 * 60 * 1000);
      const archivedAt =
        seed.createdHoursAgo >= 24 * 30
          ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
      const reactionUsers = new Set<string>(seed.prayingUserIds ?? []);
      const request: PrayerRequestRecord = {
        id: seed.id,
        groupId: seed.groupId,
        authorId: seed.authorId,
        title: seed.title,
        body: seed.body,
        reference: seed.reference,
        createdAt: createdAt.toISOString(),
        archivedAt,
        answeredAt: undefined,
        lastActivityAt: (archivedAt ?? createdAt.toISOString()),
        reactionCounts: { praying: reactionUsers.size },
        reactionUserIds: { praying: reactionUsers },
      };
      db.prayerRequests.set(request.id, request);

      const group = db.groups.get(seed.groupId);
      if (group) {
        group.requestIds.add(request.id);
        const activityTimestamps = [
          new Date(group.lastActivityAt).getTime(),
          createdAt.getTime(),
          archivedAt ? new Date(archivedAt).getTime() : createdAt.getTime(),
        ];
        const latest = Math.max(...activityTimestamps);
        group.lastActivityAt = new Date(latest).toISOString();
        group.updatedAt = group.lastActivityAt;
        db.groups.set(group.id, group);
      }
    });
  }

  if (db.reports.size === 0) {
    REPORT_SEED.forEach((report) => {
      db.reports.set(report.id, report);
      const post = db.posts.get(report.postId);
      if (!post) {
        return;
      }
      post.reportUserIds.add(report.reporterId);
      if (report.status === 'actioned') {
        post.status = 'archived';
      } else if (report.status !== 'dismissed' && post.status === 'published') {
        post.status = 'flagged';
      }
      db.posts.set(post.id, post);
    });
  }

  if (db.moderationActions.size === 0) {
    MODERATION_ACTION_SEED.forEach((action) => {
      db.moderationActions.set(action.id, action);
    });
  }

  if (db.shares.size === 0) {
    const shares: ShareDraftRecord[] = [];
    shares.forEach((share) => {
      db.shares.set(share.id, share);
    });
  }

  seeded = true;
}

export function resetSeedData() {
  const db = getDatabase();
  db.users.clear();
  db.posts.clear();
  db.reports.clear();
  db.shares.clear();
  db.reflections.clear();
  db.planProgress.clear();
  db.sessions.clear();
  db.magicLinks.clear();
  db.oauthStates.clear();
  db.groups.clear();
  db.groupMemberships.clear();
  db.prayerRequests.clear();
  db.moderationActions.clear();
  seeded = false;
  ensureSeedData();
}
