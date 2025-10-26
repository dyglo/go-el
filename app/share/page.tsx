import { redirect } from 'next/navigation';
import { featureFlags } from '@/lib/config/flags';
import { getCurrentUser } from '@/lib/server/auth';
import { ShareClient } from './share-client';

export default async function SharePage() {
  const viewer = await getCurrentUser();
  if (!viewer) {
    redirect('/auth/sign-in');
  }

  return (
    <ShareClient
      viewer={{ id: viewer.id, name: viewer.name, email: viewer.email }}
      featureFlags={featureFlags}
    />
  );
}
