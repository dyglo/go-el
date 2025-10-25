import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPrayerGroupDirectory,
  getPrayerGroupDetail,
  requestGroupMembership,
  createPrayerRequest,
  togglePrayerRequestPraying,
  archivePrayerRequest,
} from '@/lib/server/groups';
import { resetSeedData } from '@/lib/server/seed';

test('prayer group directory returns membership context and previews', () => {
  resetSeedData();
  const directory = getPrayerGroupDirectory('user_miriam');
  assert.ok(directory.length >= 2, 'expected seeded groups');

  const gatewatch = directory.find((group) => group.id === 'group_gatewatch');
  assert.ok(gatewatch, 'expected gatewatch group to be present');
  assert.equal(gatewatch?.viewerStatus, 'member');
  assert.ok((gatewatch?.previewRequests.length ?? 0) > 0, 'should include request previews');
});

test('requesting membership for a private group yields pending status', () => {
  resetSeedData();
  const result = requestGroupMembership('group_midnight_oil', 'user_hannah');
  assert.equal(result.status, 'pending');
  assert.equal(result.requiresApproval, true);

  const detail = getPrayerGroupDetail('group_midnight_oil', 'user_hannah');
  assert.equal(detail.membership.status, 'pending');
  assert.ok(detail.summary.pendingCount >= 1, 'pending queue should reflect membership request');
});

test('members can create, respond to, and archive prayer requests', () => {
  resetSeedData();
  const detailBefore = getPrayerGroupDetail('group_gatewatch', 'user_admin');
  const initialActive = detailBefore.requests.length;

  const created = createPrayerRequest({
    groupId: 'group_gatewatch',
    userId: 'user_admin',
    title: 'Integration test request',
    body: 'Please cover this automated test in prayer.',
    reference: 'Psalm 27:1',
  });

  assert.equal(created.prayingCount, 0);

  const toggled = togglePrayerRequestPraying({
    groupId: 'group_gatewatch',
    requestId: created.id,
    userId: 'user_admin',
  });
  assert.equal(toggled.prayingCount, 1);
  assert.equal(toggled.viewerHasPrayed, true);

  const archived = archivePrayerRequest({
    groupId: 'group_gatewatch',
    requestId: created.id,
    userId: 'user_admin',
  });
  assert.ok(archived.archivedAt, 'archived request should have timestamp');

  const detailAfter = getPrayerGroupDetail('group_gatewatch', 'user_admin');
  assert.equal(detailAfter.requests.length, initialActive, 'active count returns to original');
  assert.ok(
    detailAfter.archivedRequests.some((request) => request.id === created.id),
    'archived request should appear in archive list'
  );
});
