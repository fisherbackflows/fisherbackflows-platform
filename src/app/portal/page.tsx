import { redirect } from 'next/navigation';

export default function CustomerPortalPage() {
  // Server-side redirect - no client-side loading flash, better SEO
  redirect('/portal/directory');
}