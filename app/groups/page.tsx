import { ensureUserByEmail, getCurrentUser } from '@/lib/server/auth';
import { getPrayerGroupDetail, getPrayerGroupDirectory } from '@/lib/server/groups';
import { GroupsClient } from './groups-client';

export default async function GroupsPage() {
  const viewer = (await getCurrentUser()) ?? (await ensureUserByEmail('guest@goel.app'));
  const directory = await getPrayerGroupDirectory(viewer.id);
  const initialGroupId = directory[0]?.id ?? null;
  const initialDetail = initialGroupId ? await getPrayerGroupDetail(initialGroupId, viewer.id) : null;

  return (
    <GroupsClient
      viewer={{ id: viewer.id, name: viewer.name }}
      initialDirectory={directory}
      initialGroupId={initialGroupId}
      initialDetail={initialDetail}
    />
  );
}
