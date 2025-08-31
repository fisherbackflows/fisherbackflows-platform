'use client';

import Image from 'next/image';
import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function Logo({ 
  className = "", 
  width = 200, 
  height = 160,
  priority = false 
}: LogoProps) {
  return (
    <Image
      src="/fisher-backflows-logo.png"
      alt="Fisher Backflows LLC"
      width={width}
      height={height}
      priority={priority}
      draggable={false}
      className={`max-w-full h-auto w-auto ${className}`}
      style={{
        WebkitUserDrag: "none",
        userSelect: "none",
        filter: "brightness(1.1) contrast(1.05)"
      }}
    />
  );
}