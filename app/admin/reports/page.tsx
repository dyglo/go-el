import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import { getModerationDashboard } from '@/lib/server/moderation';
import { AdminReportsClient } from './admin-reports-client';

export default async function AdminReportsPage() {
  const moderator = (await getCurrentUser()) ?? (await ensureUserByEmail('abigail@goel.app'));
  const dashboard = await getModerationDashboard();

  return (
    <AdminReportsClient
      moderator={{ id: moderator.id, name: moderator.name }}
      initialReports={dashboard.reports}
    />
  );
}
