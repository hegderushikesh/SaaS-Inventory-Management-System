import React from 'react';
import { Menu, Building2 } from 'lucide-react';

export const Topbar = ({
  onToggleSidebar,
  organization,
  user
}) => {
  return (
    <header className="h-16 bg-white/90 backdrop-blur-xs border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile Menu Button & Brand indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline">StockFlow</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">
            {organization?.name || 'Workspace'}
          </span>
        </div>
      </div>

      {/* Right side info & user badge */}
      <div className="flex items-center gap-3">
        {organization && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-xs font-medium text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[150px]">{organization.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
