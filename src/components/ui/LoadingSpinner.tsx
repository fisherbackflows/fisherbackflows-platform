import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'slate';
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    slate: 'border-slate-600'
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className={`animate-spin rounded-full border-2 border-transparent border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}></div>
        {text && (
          <p className={`text-sm font-medium ${color === 'white' ? 'text-white' : color === 'blue' ? 'text-blue-800' : 'text-slate-800'}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingSpinner;