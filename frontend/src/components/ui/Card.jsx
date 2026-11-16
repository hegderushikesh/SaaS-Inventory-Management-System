import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl shadow-xs transition-shadow duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
      <div className={`p-5 pb-3.5 border-b border-slate-100/90 flex items-center justify-between gap-4 ${className}`} {...props}>
        {children}
      </div>
      );
};

      export const CardTitle = ({children, className = '', ...props }) => {
  return (
        <h3 className={`text-sm font-semibold text-slate-900 tracking-tight ${className}`} {...props}>
          {children}
        </h3>
        );
};

        export const CardDescription = ({children, className = '', ...props }) => {
  return (
          <p className={`text-xs text-slate-500 mt-0.5 leading-normal ${className}`} {...props}>
            {children}
          </p>
          );
};

          export const CardContent = ({children, className = '', ...props }) => {
  return (
          <div className={`p-5 ${className}`} {...props}>
            {children}
          </div>
          );
};

          export const CardFooter = ({children, className = '', ...props }) => {
  return (
            <div className={`px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-3 ${className}`} {...props}>
              {children}
            </div>
            );
};

            export const MetricCard = ({
              title,
              value,
              subtitle,
              icon: Icon,
            variant = 'default',
            badgeText = null,
            badgeVariant = 'default',
            className = ''
}) => {
  const iconVariants = {
            default: 'bg-slate-100 text-slate-600 border border-slate-200/60',
            primary: 'bg-blue-50 text-blue-600 border border-blue-100',
            success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
            warning: 'bg-amber-50 text-amber-600 border border-amber-100',
            danger: 'bg-red-50 text-red-600 border border-red-100'
  };

            return (
              <Card className={`relative overflow-hidden hover:border-slate-300/80 transition-colors ${className}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {title}
                      </span>
                      {Icon && (
                        <div className={`p-2 rounded-lg ${iconVariants[variant] || iconVariants.default}`}>
                          <Icon className="w-4 h-4 stroke-[1.8]" />
                        </div>
                      )}
                  </div>

                      <div className="mt-3 flex items-baseline gap-2.5">
                        <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                          {value}
                        </span>
                        {badgeText && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badgeVariant === 'warning'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : badgeVariant === 'danger'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : badgeVariant === 'success'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              {badgeText}
                            </span>
          )}
                          </div>

        {subtitle && (
                          <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    );
};

                    export default Card;
