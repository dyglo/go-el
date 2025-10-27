import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { ensureProfileSlugForUser } from '@/lib/server/profile';

export default async function ProfileRedirectPage() {
  const viewer = await getCurrentUser();
  if (!viewer) {
    redirect('/auth/sign-in');
  }

  const slug = viewer.profileSlug ?? (await ensureProfileSlugForUser(viewer.id));
  redirect(`/u/${slug ?? viewer.id}`);
}
