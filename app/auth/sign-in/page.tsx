import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { SignInClient } from '../sign-in-client';

export default function SignInPage() {
  const user = getCurrentUser();
  if (user) {
    redirect('/feed');
  }

  return <SignInClient />;
}