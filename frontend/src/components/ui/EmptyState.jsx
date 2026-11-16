import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  iconVariant = 'default',
  className = ''
}) => {
  const iconVariants = {
    default: 'bg-slate-50 border-slate-200/60 text-slate-400',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    warning: 'bg-amber-50 border-amber-100 text-amber-600',
    primary: 'bg-blue-50 border-blue-100 text-blue-600'
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-xs ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3.5 shadow-2xs ${
          iconVariants[iconVariant] || iconVariants.default
        }`}
      >
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex items-center gap-2.5 flex-wrap justify-center">
          {actionLabel && onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              leftIcon={actionIcon}
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};

export default EmptyState;
