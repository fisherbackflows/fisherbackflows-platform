'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
}

export default function PrefetchLink({ 
  href, 
  children, 
  className,
  prefetch = true 
}: PrefetchLinkProps) {
  const router = useRouter();

  useEffect(() => {
    if (prefetch) {
      // Prefetch on component mount for instant navigation
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  return (
    <Link 
      href={href} 
      className={className}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}