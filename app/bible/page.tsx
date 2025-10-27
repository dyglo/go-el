import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { BibleClient } from './bible-client';

export default async function BiblePage() {
  const viewer = await getCurrentUser();

  if (!viewer) {
    redirect('/auth/sign-in');
  }

  return (
    <BibleClient
      viewer={{ id: viewer.id, name: viewer.name, email: viewer.email }}
    />
  );
}
