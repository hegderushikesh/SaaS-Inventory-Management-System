import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  className = '',
  rows = 3,
  id,
  ...props
}, ref) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-slate-700 select-none flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 text-xs">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full bg-white border text-sm text-slate-900 rounded-lg p-3 transition-colors placeholder:text-slate-400 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
