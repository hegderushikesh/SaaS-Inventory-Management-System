import React from 'react';

const variants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-blue-50 text-blue-700 border-blue-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-red-50 text-red-700 border-red-200/80'
};

const dotColors = {
  default: 'bg-slate-400',
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500'
};

export const Badge = ({
  children,
  variant = 'default',
  dot = false,
  className = ''
}) => {
  const variantClass = variants[variant] || variants.default;
  const dotClass = dotColors[variant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${variantClass} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      {children}
    </span>
  );
};

export default Badge;
