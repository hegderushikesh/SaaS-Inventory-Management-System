import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 select-none flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            <LeftIcon className="w-4 h-4 stroke-[1.8]" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full bg-white border text-sm text-slate-900 rounded-lg transition-colors placeholder:text-slate-400 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-9' : 'pl-3.5'
          } ${RightIcon ? 'pr-9' : 'pr-3.5'} py-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
              : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 shadow-2xs'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
            <RightIcon className="w-4 h-4 stroke-[1.8]" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-0.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
