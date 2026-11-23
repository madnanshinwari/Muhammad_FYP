import React from 'react';

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base font-semibold'
  };

  const variantStyles = {
    // Primary Action: Solid #218838 background, #FFFFFF text, 0.5rem radius. On hover: shifts to #14532D
    primary: 'bg-[#218838] dark:bg-[#2a7a44] hover:bg-[#14532D] dark:hover:bg-[#1a5a32] text-white shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]',
    // Secondary / Accent: Solid #F4C542 background, #263238 bold text
    secondary: 'bg-[#F4C542] dark:bg-[#d4a826] hover:bg-[#efc13e] dark:hover:bg-[#c49a1e] text-[#263238] dark:text-white font-bold shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]',
    // Outline Action: White bg, 1.5px border in #218838, #218838 text, hover #F3F7F1
    outline: 'bg-white dark:bg-[#353535] border-[1.5px] border-[#218838] dark:border-[#94f99a] text-[#218838] dark:text-[#94f99a] hover:bg-[#F3F7F1] dark:hover:bg-[#404040] transition-all duration-200 active:scale-[0.98]',
    // Ghost
    ghost: 'bg-transparent text-[#263238] dark:text-[#e0e0e0] hover:bg-[#F3F7F1] dark:hover:bg-[#354035] hover:text-[#14532D] dark:hover:text-[#b1f2be] transition-colors duration-300',
    // Danger
    danger: 'bg-[#ba1a1a] dark:bg-[#8b0000] hover:bg-[#93000a] dark:hover:bg-[#6b0000] text-white shadow-sm transition-all duration-200'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
