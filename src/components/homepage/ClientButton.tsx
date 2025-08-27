'use client';

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface ClientButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function ClientButton({ 
  children, 
  onClick, 
  className = '',
  size = 'default',
  variant = 'default'
}: ClientButtonProps) {
  return (
    <Button 
      onClick={onClick}
      className={className}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}