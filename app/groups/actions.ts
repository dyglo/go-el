'use server';

import { NotificationPreference as PrismaNotificationPreference } from '@prisma/client';
import { z } from 'zod';
import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import {
  archivePrayerRequest,
  createPrayerRequest,
  getPrayerGroupDetail,
  getPrayerGroupDirectory,
  leaveGroupMembership,
  requestGroupMembership,
  togglePrayerRequestPraying,
  updateNotificationPreference,
} from '@/lib/server/groups';

const groupIdSchema = z.string().min(1, 'Missing group id.');

const createRequestSchema = z.object({
  groupId: z.string().min(1, 'Group is required.'),
  title: z.string().min(4, 'Share a little more detail for this request.').max(220),
  body: z.string().max(500).optional(),
  reference: z.string().max(80).optional(),
});

const togglePrayerSchema = z.object({
  groupId: z.string().min(1),
  requestId: z.string().min(1),
});

const archiveSchema = togglePrayerSchema;

const notificationsSchema = z.object({
  groupId: z.string().min(1),
  preference: z.enum(['all', 'quiet', 'mentions']),
});

async function resolveViewer() {
  const viewer = await getCurrentUser();
  if (viewer) {
    return viewer;
  }
  return await ensureUserByEmail('guest@goel.app');
}

export async function fetchGroupDetailAction(groupId: string) {
  const viewer = await resolveViewer();
  const parsed = groupIdSchema.parse(groupId);
  const detail = await getPrayerGroupDetail(parsed, viewer.id);
  return {
    detail,
  };
}

export async function fetchDirectoryAction() {
  const viewer = await resolveViewer();
  const directory = await getPrayerGroupDirectory(viewer.id);
  return { directory };
}

export async function joinGroupAction(input: { groupId: string }) {
  const viewer = await resolveViewer();
  const parsed = groupIdSchema.parse(input.groupId);
  const result = await requestGroupMembership(parsed, viewer.id);
  const detail = await getPrayerGroupDetail(parsed, viewer.id);
  const summary = detail.summary;

  return {
    status: result.status,
    requiresApproval: result.requiresApproval,
    capacityFull: result.capacityFull ?? false,
    membership: result.membership,
    summary,
    detail,
  };
}

export async function leaveGroupAction(input: { groupId: string }) {
  const viewer = await resolveViewer();
  const parsed = groupIdSchema.parse(input.groupId);
  const result = await leaveGroupMembership(parsed, viewer.id);
  const detail = await getPrayerGroupDetail(parsed, viewer.id);
  return {
    status: result.status,
    membership: result.membership,
    summary: detail.summary,
    detail,
  };
}

export async function createPrayerRequestAction(input: z.infer<typeof createRequestSchema>) {
  const viewer = await resolveViewer();
  const parsed = createRequestSchema.parse(input);
  await createPrayerRequest({
    groupId: parsed.groupId,
    userId: viewer.id,
    title: parsed.title,
    body: parsed.body,
    reference: parsed.reference,
  });

  const detail = await getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    detail,
    summary: detail.summary,
  };
}

export async function togglePrayerReactionAction(input: z.infer<typeof togglePrayerSchema>) {
  const viewer = await resolveViewer();
  const parsed = togglePrayerSchema.parse(input);
  const result = await togglePrayerRequestPraying({
    groupId: parsed.groupId,
    requestId: parsed.requestId,
    userId: viewer.id,
  });

  return result;
}

export async function archivePrayerRequestAction(input: z.infer<typeof archiveSchema>) {
  const viewer = await resolveViewer();
  const parsed = archiveSchema.parse(input);
  await archivePrayerRequest({
    groupId: parsed.groupId,
    requestId: parsed.requestId,
    userId: viewer.id,
  });

  const detail = await getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    detail,
    summary: detail.summary,
  };
}

export async function setNotificationPreferenceAction(input: z.infer<typeof notificationsSchema>) {
  const viewer = await resolveViewer();
  const parsed = notificationsSchema.parse(input);
  const preferenceKey = parsed.preference.toUpperCase() as keyof typeof PrismaNotificationPreference;
  const preference = PrismaNotificationPreference[preferenceKey];
  const result = await updateNotificationPreference(parsed.groupId, viewer.id, preference);
  const detail = await getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    membership: result.membership,
    detail,
    summary: detail.summary,
  };
}
