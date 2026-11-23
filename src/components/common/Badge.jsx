import React from 'react';

export function Badge({ variant = 'fresh', children, className = '' }) {
  if (variant === 'fresh') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F7F1] text-[#14532D] tracking-wide transition-colors duration-300 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-[#218838] animate-pulse"></span>
        {children}
      </span>
    );
  }

  if (variant === 'warning' || variant === 'low-stock') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] dark:bg-[#594000] text-[#B45309] dark:text-[#F4C542] tracking-wide transition-colors duration-300 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-[#F4C542] dark:bg-[#fbbf24]"></span>
        {children}
      </span>
    );
  }

  if (variant === 'organic' || variant === 'halal') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#14532D] text-white tracking-wide shadow-sm transition-colors duration-300 ${className}`}>
        <svg className="w-3 h-3 text-[#94f99a]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
        {children}
      </span>
    );
  }

  if (variant === 'metric') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F7F1] text-[#14532D] border border-[#becaba]/60 tabular-nums transition-colors duration-300 ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2E8F0] text-[#263238] transition-colors duration-300 ${className}`}>
      {children}
    </span>
  );
}

