import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { SignInClient } from '../sign-in-client';

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/feed');
  }

  return <SignInClient />;
}
