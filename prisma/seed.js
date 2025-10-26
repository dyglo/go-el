const {
  PrismaClient,
  PostStatus,
  ReportStatus,
  ModerationActionType,
  GroupMembershipStatus,
  GroupRole,
  NotificationPreference,
} = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const now = Date.now();
const hoursAgo = (hours) => new Date(now - hours * 60 * 60 * 1000);
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);

const ADMIN_PASSWORD = 'AdminPass123!';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

const users = [
  {
    id: 'user_miriam',
    displayName: 'Miriam L.',
    email: 'miriam@example.com',
    role: 'House Church Coordinator',
    location: 'Jerusalem, IL',
    createdAt: daysAgo(36),
  },
  {
    id: 'user_samuel',
    displayName: 'Samuel K.',
    email: 'samuel@example.com',
    role: 'Mission Pastor',
    location: 'Nairobi, KE',
    createdAt: daysAgo(26),
  },
  {
    id: 'user_grace',
    displayName: 'Grace P.',
    email: 'grace@example.com',
    role: 'Discipleship Guide',
    location: 'Austin, US',
    createdAt: daysAgo(18),
  },
  {
    id: 'user_noah',
    displayName: 'Noah A.',
    email: 'noah@example.com',
    role: 'Prayer Room Host',
    location: 'Toronto, CA',
    createdAt: daysAgo(7),
  },
  {
    id: 'user_hannah',
    displayName: 'Hannah R.',
    email: 'hannah@example.com',
    role: 'Prayer Scribe',
    location: 'London, UK',
    createdAt: daysAgo(5),
  },
  {
    id: 'user_admin',
    displayName: 'Abigail K.',
    email: 'abigail@goel.app',
    role: 'Admin',
    location: 'Chicago, US',
    passwordHash: ADMIN_PASSWORD_HASH,
    createdAt: daysAgo(40),
  },
  {
    id: 'user_guest',
    displayName: 'Guest User',
    email: 'guest@goel.app',
    role: 'Member',
    createdAt: daysAgo(1),
  },
];

const posts = [
  {
    id: 'post_psalm_23_1_3',
    authorId: 'user_miriam',
    reference: 'Psalm 23:1-3',
    passageText:
      'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for his name’s sake.',
    reflection:
      'Praying this over every weary heart tonight. He is still the Shepherd and He is still leading us beside His peace.',
    tags: ['Shepherd', 'Comfort', 'Evening'],
    createdAt: hoursAgo(2),
    status: PostStatus.PUBLISHED,
  },
  {
    id: 'post_hebrews_10_24_25',
    authorId: 'user_samuel',
    reference: 'Hebrews 10:24-25',
    passageText:
      'And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another, and all the more as you see the Day drawing near.',
    reflection: null,
    tags: ['Encouragement', 'Gathering'],
    createdAt: hoursAgo(5),
    status: PostStatus.PUBLISHED,
  },
  {
    id: 'post_john_15_4_5',
    authorId: 'user_grace',
    reference: 'John 15:4-5',
    passageText:
      'Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me. I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.',
    reflection:
      'Shared during our discipleship circle tonight. We are asking the Spirit to prune what keeps us from abiding closely in Jesus.',
    tags: ['Abide', 'Discipleship'],
    createdAt: hoursAgo(26),
    status: PostStatus.PUBLISHED,
  },
  {
    id: 'post_isaiah_26_3_4',
    authorId: 'user_noah',
    reference: 'Isaiah 26:3-4',
    passageText:
      'You keep him in perfect peace whose mind is stayed on you, because he trusts in you. Trust in the Lord forever, for the Lord God is an everlasting rock.',
    reflection: null,
    tags: ['Peace', 'Trust'],
    createdAt: hoursAgo(48),
    status: PostStatus.PUBLISHED,
  },
];

const reactions = [
  { id: 'reaction_psalm_samuel_amen', postId: 'post_psalm_23_1_3', userId: 'user_samuel', type: 'amen' },
  { id: 'reaction_psalm_grace_praying', postId: 'post_psalm_23_1_3', userId: 'user_grace', type: 'praying' },
  { id: 'reaction_hebrews_miriam_amen', postId: 'post_hebrews_10_24_25', userId: 'user_miriam', type: 'amen' },
  { id: 'reaction_john_hannah_praying', postId: 'post_john_15_4_5', userId: 'user_hannah', type: 'praying' },
];

const reports = [
  {
    id: 'report_psalm_reference',
    postId: 'post_psalm_23_1_3',
    reporterId: 'user_hannah',
    reason: 'Please clarify which translation is being quoted.',
    status: ReportStatus.PENDING,
    createdAt: hoursAgo(1),
  },
];

const moderationActions = [
  {
    id: 'mod_action_warn_psalm',
    reportId: 'report_psalm_reference',
    postId: 'post_psalm_23_1_3',
    actorId: 'user_admin',
    action: ModerationActionType.WARN,
    notes: 'Requested clearer translation note from author.',
    createdAt: hoursAgo(0.5),
  },
];

const groups = [
  {
    id: 'group_gatewatch',
    name: 'Gatewatch Intercessors',
    focus: 'Night watch prayer covering global cities.',
    scriptureAnchor: 'Isaiah 62:6-7',
    description:
      'Interceding nightly for awakening in global cities. We take turns carrying the midnight hour.',
    ownerId: 'user_miriam',
    memberLimit: 40,
    isPrivate: false,
    tags: ['Intercession', 'Cities'],
    createdAt: daysAgo(14),
    memberships: [
      {
        id: 'membership_gatewatch_owner',
        userId: 'user_miriam',
        role: GroupRole.OWNER,
        status: GroupMembershipStatus.MEMBER,
      },
      {
        id: 'membership_gatewatch_facilitator',
        userId: 'user_grace',
        role: GroupRole.FACILITATOR,
        status: GroupMembershipStatus.MEMBER,
      },
      {
        id: 'membership_gatewatch_admin',
        userId: 'user_admin',
        role: GroupRole.FACILITATOR,
        status: GroupMembershipStatus.MEMBER,
      },
      {
        id: 'membership_gatewatch_hannah',
        userId: 'user_hannah',
        role: GroupRole.MEMBER,
        status: GroupMembershipStatus.MEMBER,
      },
    ],
    requests: [
      {
        id: 'request_gatewatch_vigil',
        authorId: 'user_miriam',
        title: 'Cover the midnight prayer vigil',
        body: 'Asking the Lord for alertness tonight as we intercede for Jerusalem and Nairobi.',
        reference: 'Ephesians 6:18',
        createdAt: hoursAgo(4),
        prayingUserIds: ['user_grace', 'user_admin'],
      },
      {
        id: 'request_gatewatch_testimony',
        authorId: 'user_grace',
        title: 'Give thanks for last night’s breakthrough',
        body: 'We sensed a release over Nairobi. Let’s give thanks and continue to watch.',
        reference: 'Psalm 118:23',
        createdAt: hoursAgo(20),
        prayingUserIds: ['user_miriam'],
        archivedAt: null,
      },
    ],
  },
  {
    id: 'group_midnight_oil',
    name: 'Midnight Oil Collective',
    focus: 'Creative intercession through music and scripture.',
    scriptureAnchor: 'Acts 16:25',
    description:
      'Songwriters and intercessors gathering weekly to lift worship in the night hours.',
    ownerId: 'user_noah',
    memberLimit: 18,
    isPrivate: true,
    tags: ['Worship', 'Creative'],
    createdAt: daysAgo(10),
    memberships: [
      {
        id: 'membership_midnight_owner',
        userId: 'user_noah',
        role: GroupRole.OWNER,
        status: GroupMembershipStatus.MEMBER,
      },
      {
        id: 'membership_midnight_miriam',
        userId: 'user_miriam',
        role: GroupRole.FACILITATOR,
        status: GroupMembershipStatus.MEMBER,
      },
      {
        id: 'membership_midnight_pending_hannah',
        userId: 'user_hannah',
        role: GroupRole.MEMBER,
        status: GroupMembershipStatus.PENDING,
      },
    ],
    requests: [
      {
        id: 'request_midnight_song',
        authorId: 'user_noah',
        title: 'Pray for fresh lyrics this Friday',
        body: 'We are recording a spontaneous worship set during the night watch.',
        reference: 'Psalm 42:8',
        createdAt: hoursAgo(10),
        prayingUserIds: ['user_miriam'],
      },
    ],
  },
];

async function seedUsers() {
  for (const user of users) {
    const { id, createdAt, passwordHash, ...base } = user;
    const data = {
      ...base,
      passwordHash: passwordHash ?? undefined,
      createdAt,
    };
    await prisma.user.upsert({
      where: { id },
      update: {
        displayName: data.displayName,
        email: data.email,
        role: data.role,
        location: data.location ?? null,
        passwordHash: data.passwordHash ?? undefined,
      },
      create: {
        id,
        ...data,
      },
    });
  }
}

async function seedAdminUser() {
  await prisma.adminUser.upsert({
    where: { email: 'abigail@goel.app' },
    update: {
      name: 'Abigail K.',
      passwordHash: ADMIN_PASSWORD_HASH,
    },
    create: {
      id: 'admin_user_admin',
      name: 'Abigail K.',
      email: 'abigail@goel.app',
      passwordHash: ADMIN_PASSWORD_HASH,
    },
  });
}

async function seedPosts() {
  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        reference: post.reference,
        passageText: post.passageText,
        reflection: post.reflection,
        tags: post.tags,
        status: post.status,
      },
      create: {
        id: post.id,
        authorId: post.authorId,
        reference: post.reference,
        passageText: post.passageText,
        reflection: post.reflection,
        translation: 'USER',
        tags: post.tags,
        status: post.status,
        commentCount: 0,
        createdAt: post.createdAt,
        updatedAt: post.createdAt,
      },
    });

    await prisma.shareDraft.upsert({
      where: { id: `${post.id}_draft` },
      update: {
        reference: post.reference,
        passageText: post.passageText,
        reflection: post.reflection,
        submittedAt: post.createdAt,
      },
      create: {
        id: `${post.id}_draft`,
        userId: post.authorId,
        postId: post.id,
        reference: post.reference,
        passageText: post.passageText,
        reflection: post.reflection,
        createdAt: post.createdAt,
        submittedAt: post.createdAt,
      },
    });
  }
}

async function seedReactions() {
  for (const reaction of reactions) {
    await prisma.reaction.upsert({
      where: { id: reaction.id },
      update: {
        postId: reaction.postId,
        userId: reaction.userId,
        type: reaction.type,
      },
      create: reaction,
    });
  }
}

async function seedReports() {
  for (const report of reports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        reason: report.reason,
        status: report.status,
        notes: report.notes ?? null,
        resolvedAt: report.resolvedAt ?? null,
      },
      create: {
        ...report,
      },
    });
  }

  for (const action of moderationActions) {
    await prisma.moderationAction.upsert({
      where: { id: action.id },
      update: {
        action: action.action,
        notes: action.notes ?? null,
      },
      create: action,
    });
  }
}

async function seedGroups() {
  for (const group of groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        focus: group.focus,
        scriptureAnchor: group.scriptureAnchor,
        description: group.description,
        memberLimit: group.memberLimit,
        isPrivate: group.isPrivate,
        tags: group.tags,
        lastActivityAt: group.createdAt,
      },
      create: {
        id: group.id,
        name: group.name,
        focus: group.focus,
        scriptureAnchor: group.scriptureAnchor,
        description: group.description,
        ownerId: group.ownerId,
        memberLimit: group.memberLimit,
        isPrivate: group.isPrivate,
        tags: group.tags,
        imageUrl: null,
        createdAt: group.createdAt,
        updatedAt: group.createdAt,
        lastActivityAt: group.createdAt,
      },
    });

    for (const membership of group.memberships) {
      await prisma.groupMembership.upsert({
        where: { id: membership.id },
        update: {
          role: membership.role,
          status: membership.status,
          joinedAt:
            membership.status === GroupMembershipStatus.MEMBER
              ? membership.joinedAt ?? daysAgo(7)
              : null,
          notifications:
            membership.status === GroupMembershipStatus.MEMBER
              ? NotificationPreference.ALL
              : NotificationPreference.QUIET,
        },
        create: {
          id: membership.id,
          groupId: group.id,
          userId: membership.userId,
          role: membership.role,
          status: membership.status,
          joinedAt:
            membership.status === GroupMembershipStatus.MEMBER
              ? membership.joinedAt ?? daysAgo(7)
              : null,
          notifications:
            membership.status === GroupMembershipStatus.MEMBER
              ? NotificationPreference.ALL
              : NotificationPreference.QUIET,
        },
      });
    }

    for (const request of group.requests) {
      const counts = { praying: request.prayingUserIds?.length ?? 0 };
      const userIds = { praying: request.prayingUserIds ?? [] };
      await prisma.prayerRequest.upsert({
        where: { id: request.id },
        update: {
          title: request.title,
          body: request.body ?? null,
          reference: request.reference ?? null,
          archivedAt: request.archivedAt ?? null,
          reactionCounts: counts,
          reactionUserIds: userIds,
          lastActivityAt: request.archivedAt ?? request.createdAt,
        },
        create: {
          id: request.id,
          groupId: group.id,
          authorId: request.authorId,
          title: request.title,
          body: request.body ?? null,
          reference: request.reference ?? null,
          createdAt: request.createdAt,
          archivedAt: request.archivedAt ?? null,
          reactionCounts: counts,
          reactionUserIds: userIds,
          lastActivityAt: request.archivedAt ?? request.createdAt,
        },
      });
    }

    const latestActivity = group.requests.reduce((latest, request) => {
      const timestamps = [
        group.createdAt.getTime(),
        request.createdAt.getTime(),
        request.archivedAt ? new Date(request.archivedAt).getTime() : 0,
      ];
      const latestForRequest = Math.max(...timestamps);
      return Math.max(latest, latestForRequest);
    }, group.createdAt.getTime());

    await prisma.group.update({
      where: { id: group.id },
      data: {
        lastActivityAt: new Date(latestActivity),
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedAdminUser();
  await seedPosts();
  await seedReactions();
  await seedReports();
  await seedGroups();
}

main()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
