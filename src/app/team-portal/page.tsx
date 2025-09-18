import { redirect } from 'next/navigation';

export default async function TeamPortalPage() {
  // Always redirect to login page for team portal access
  // This provides a consistent entry point and ensures proper authentication flow
  redirect('/team-portal/login');
}