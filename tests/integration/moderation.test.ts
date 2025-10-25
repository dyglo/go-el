import test from 'node:test';
import assert from 'node:assert/strict';
import { getModerationDashboard, moderateReport } from '@/lib/server/moderation';
import { resetSeedData } from '@/lib/server/seed';

const ADMIN_ID = 'user_admin';

test('moderation dashboard returns seeded reports and summary totals', () => {
  resetSeedData();
  const dashboard = getModerationDashboard();
  assert.ok(dashboard.summary.total >= 2, 'should include seeded reports');
  assert.ok(
    dashboard.reports.every((report) => report.post.reference.length > 0),
    'reports include associated post references'
  );
});

test('moderateReport tracks warn and hide actions with status updates', () => {
  resetSeedData();
  const warned = moderateReport({
    reportId: 'report_psalm_translation',
    actorId: ADMIN_ID,
    action: 'warn',
    notes: 'Reviewed content, awaiting author acknowledgement.',
  });

  assert.equal(warned.status, 'in_review');
  assert.ok(warned.actions.length >= 1);
  assert.equal(warned.actions[0].action, 'warn');

  const hidden = moderateReport({
    reportId: 'report_psalm_translation',
    actorId: ADMIN_ID,
    action: 'hide',
    notes: 'Temporarily hiding while we clarify translation context.',
  });

  assert.equal(hidden.status, 'actioned');
  assert.equal(hidden.post.status, 'flagged');
  assert.ok(hidden.actions.some((action) => action.action === 'hide'));
});

test('restoring a report dismisses it and republishes the post', () => {
  resetSeedData();
  const restored = moderateReport({
    reportId: 'report_john_commentary',
    actorId: ADMIN_ID,
    action: 'restore',
    notes: 'Reflection trimmed to Scripture-only, clearing report.',
  });

  assert.equal(restored.status, 'dismissed');
  assert.equal(restored.post.status, 'published');
  assert.ok(restored.actions[0]?.action === 'restore');
});
