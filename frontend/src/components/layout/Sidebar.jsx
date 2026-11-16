import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({
  user,
  organization,
  onLogout,
  isOpen = false,
  onClose = () => {}
}) => {
  const location = useLocation();

  // Close mobile drawer on route changes or escape key
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : 'U';

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight leading-none block">
                StockFlow
              </span>
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block mt-0.5">
                Inventory SaaS
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Workspace
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-600 font-semibold shadow-2xs border border-blue-100/60'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 stroke-[1.8]" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-60" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-3 border-t border-slate-100">
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-2xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.name || user?.email || 'Admin User'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {organization?.name || 'My Organization'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 stroke-[1.8]" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:hidden transition-transform duration-200 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
