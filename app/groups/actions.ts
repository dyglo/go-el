'use server';

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

function resolveViewer() {
  const viewer = getCurrentUser();
  if (viewer) {
    return viewer;
  }
  return ensureUserByEmail('guest@goel.app');
}

export async function fetchGroupDetailAction(groupId: string) {
  const viewer = resolveViewer();
  const parsed = groupIdSchema.parse(groupId);
  const detail = getPrayerGroupDetail(parsed, viewer.id);
  return {
    detail,
  };
}

export async function fetchDirectoryAction() {
  const viewer = resolveViewer();
  const directory = getPrayerGroupDirectory(viewer.id);
  return { directory };
}

export async function joinGroupAction(input: { groupId: string }) {
  const viewer = resolveViewer();
  const parsed = groupIdSchema.parse(input.groupId);
  const result = requestGroupMembership(parsed, viewer.id);
  const detail = getPrayerGroupDetail(parsed, viewer.id);
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
  const viewer = resolveViewer();
  const parsed = groupIdSchema.parse(input.groupId);
  const result = leaveGroupMembership(parsed, viewer.id);
  const detail = getPrayerGroupDetail(parsed, viewer.id);
  return {
    status: result.status,
    membership: result.membership,
    summary: detail.summary,
    detail,
  };
}

export async function createPrayerRequestAction(input: z.infer<typeof createRequestSchema>) {
  const viewer = resolveViewer();
  const parsed = createRequestSchema.parse(input);
  createPrayerRequest({
    groupId: parsed.groupId,
    userId: viewer.id,
    title: parsed.title,
    body: parsed.body,
    reference: parsed.reference,
  });

  const detail = getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    detail,
    summary: detail.summary,
  };
}

export async function togglePrayerReactionAction(input: z.infer<typeof togglePrayerSchema>) {
  const viewer = resolveViewer();
  const parsed = togglePrayerSchema.parse(input);
  const result = togglePrayerRequestPraying({
    groupId: parsed.groupId,
    requestId: parsed.requestId,
    userId: viewer.id,
  });

  return result;
}

export async function archivePrayerRequestAction(input: z.infer<typeof archiveSchema>) {
  const viewer = resolveViewer();
  const parsed = archiveSchema.parse(input);
  archivePrayerRequest({
    groupId: parsed.groupId,
    requestId: parsed.requestId,
    userId: viewer.id,
  });

  const detail = getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    detail,
    summary: detail.summary,
  };
}

export async function setNotificationPreferenceAction(input: z.infer<typeof notificationsSchema>) {
  const viewer = resolveViewer();
  const parsed = notificationsSchema.parse(input);
  const result = updateNotificationPreference(parsed.groupId, viewer.id, parsed.preference);
  const detail = getPrayerGroupDetail(parsed.groupId, viewer.id);
  return {
    membership: result.membership,
    detail,
    summary: detail.summary,
  };
}
