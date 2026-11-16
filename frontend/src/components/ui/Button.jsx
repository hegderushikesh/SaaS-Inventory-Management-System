import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-600/90 active:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500/30',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 shadow-2xs border border-slate-200 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300',
  outline:
    'bg-transparent hover:bg-slate-100/80 text-slate-700 border border-slate-200 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200/80 focus-visible:ring-2 focus-visible:ring-slate-300',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-600 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500/30'
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-md font-medium',
  md: 'px-3.5 py-2 text-sm gap-2 rounded-lg font-medium',
  lg: 'px-4 py-2.5 text-base gap-2.5 rounded-lg font-medium'
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-hidden disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.99]';
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0 stroke-[1.8]" />
      ) : null}

      <span>{children}</span>

      {!isLoading && RightIcon ? (
        <RightIcon className="w-4 h-4 shrink-0 stroke-[1.8]" />
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
