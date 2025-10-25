import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import { getModerationDashboard } from '@/lib/server/moderation';
import { AdminReportsClient } from './admin-reports-client';

export default function AdminReportsPage() {
  const moderator = getCurrentUser() ?? ensureUserByEmail('abigail@goel.app');
  const dashboard = getModerationDashboard();

  return (
    <AdminReportsClient
      moderator={{ id: moderator.id, name: moderator.name }}
      initialReports={dashboard.reports}
    />
  );
}
