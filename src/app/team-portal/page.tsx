import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function TeamPortalPage() {
  // Server-side auth check - better SEO, no loading flash
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('team-session');

  if (!sessionCookie) {
    // Not authenticated, redirect to login
    redirect('/team-portal/login');
  }

  // User is authenticated, redirect to dashboard
  redirect('/team-portal/dashboard');
}