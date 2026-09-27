import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Database,
  LayoutDashboard,
  PlusCircle,
  Plus,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

interface NavbarProps {
  activeTab: 'create' | 'dashboard' | 'catalog';
  onSelectTab: (tab: 'create' | 'dashboard' | 'catalog') => void;
  onNewInvoice: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onNewInvoice,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'create' as const,
      label: 'Create Invoice',
      icon: PlusCircle,
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'catalog' as const,
      label: 'Pricing Catalog',
      icon: Database,
    },
  ];

  const handleNavClick = (tab: 'create' | 'dashboard' | 'catalog') => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const handleNewRequestClick = () => {
    onNewInvoice();
    setMobileOpen(false);
  };

  // Filter nav items if search query is typed
  const filteredNavItems = searchQuery.trim()
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

  return (
    <>
      {/* ============================================================ */}
      {/* 1. DESKTOP FLOATING VERTICAL LEFT SIDEBAR                     */}
      {/* ============================================================ */}
      <aside
        className={`hidden md:flex fixed top-3 bottom-3 left-3 z-30 ${
          isCollapsed ? 'w-[76px]' : 'w-[250px]'
        } bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex-col justify-between overflow-y-auto no-scrollbar p-3.5 no-print transition-all duration-300 ease-in-out`}
        aria-label="Sidebar Navigation"
      >
        <div className="space-y-4">
          {/* TOP SECTION: Branding & Collapse Toggle */}
          <div className="relative">
            {isCollapsed ? (
              // Collapsed Header: Centered Logo + Expand Button
              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('create')}
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-300/40 dark:shadow-indigo-950/60 transition-transform active:scale-95 cursor-pointer"
                  title="InvoiceAI - Create Invoice"
                >
                  <FileText className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Expanded Header: Full Brand Title + Subtitle + Collapse Button
              <div className="flex items-start justify-between gap-2 pt-1 px-1">
                <div
                  onClick={() => handleNavClick('create')}
                  className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
                  title="InvoiceAI Home"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950/60 shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight truncate">
                      InvoiceAI
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      AI Invoice Automation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* SEARCH FIELD */}
          <div className="pt-1">
            {isCollapsed ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Search navigation..."
                aria-label="Search navigation"
              >
                <Search className="w-4 h-4" />
              </button>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subtle Divider */}
          <div className="h-px bg-slate-200/80 dark:border-slate-800" />

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2.5">
                Navigation
              </p>
            )}

            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-full rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center cursor-pointer ${
                    isCollapsed
                      ? 'justify-center p-2.5'
                      : 'px-3.5 py-2.5 gap-3 text-left'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION: Theme Toggle & + New Request & Micro Trust Indicator */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          {/* 1. Light / Dark Mode Toggle */}
          {isCollapsed ? (
            <button
              onClick={toggleTheme}
              type="button"
              className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>

              <button
                onClick={toggleTheme}
                type="button"
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-300 dark:bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle light/dark theme"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isDark ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* 2. + New Request Button */}
          {isCollapsed ? (
            <button
              onClick={handleNewRequestClick}
              type="button"
              className="w-10 h-10 mx-auto rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
              title="New Request"
              aria-label="Create new request"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNewRequestClick}
              type="button"
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              title="Create a new invoice request"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          )}

          {/* 3. Deterministic Verification Indicator */}
          {isCollapsed ? (
            <div
              className="flex justify-center py-1"
              title="Deterministic Verification - Catalog Backed"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : (
            <div className="px-1 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate font-medium">Deterministic Verification</span>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE COMPACT HEADER (Visible on screens < md)          */}
      {/* ============================================================ */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between no-print transition-colors">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => handleNavClick('create')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
              InvoiceAI
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Catalog Verified
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={handleNewRequestClick}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. MOBILE COLLAPSIBLE DRAWER / SIDEBAR                      */}
      {/* ============================================================ */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#111827] h-full shadow-2xl z-10 flex flex-col justify-between p-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800 transition-colors">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
                      InvoiceAI
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      AI Invoice Automation
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5" aria-label="Mobile Navigation">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">
                  Navigation
                </p>

                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
              {/* Theme Toggle in Mobile Drawer */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isDark ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>

                <button
                  onClick={toggleTheme}
                  type="button"
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 dark:bg-indigo-600 transition-colors duration-200 ease-in-out"
                  aria-label="Toggle theme"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isDark ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleNewRequestClick}
                className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Request</span>
              </button>

              <div className="px-1 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Deterministic Verification</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

