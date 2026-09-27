/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../Frontend/context/ThemeContext.js';
import { Navbar } from '../Frontend/components/Navbar.js';
import { CreateInvoice } from '../Frontend/pages/CreateInvoice.js';
import { Dashboard } from '../Frontend/pages/Dashboard.js';
import { PricingCatalog } from '../Frontend/pages/PricingCatalog.js';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'dashboard' | 'catalog'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('invoice')) {
        return 'dashboard';
      }
    }
    return 'create';
  });
  const [initialInvoiceNumber, setInitialInvoiceNumber] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('invoice');
    }
    return null;
  });
  const [keyReset, setKeyReset] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('invoiceai_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('invoiceai_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Listen to popstate or direct URL changes with invoice param
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get('invoice');
      if (inv) {
        setInitialInvoiceNumber(inv);
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleNewInvoice = () => {
    setActiveTab('create');
    setKeyReset((prev) => prev + 1);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/60 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-200">
        {/* Floating Vertical Left Sidebar + Mobile Responsive Header */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNewInvoice={handleNewInvoice}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Column (Adjusted dynamically for expanded 250px vs collapsed 76px sidebar) */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            isSidebarCollapsed ? 'md:pl-[96px]' : 'md:pl-[272px]'
          } w-full transition-all duration-300 ease-in-out`}
        >
          {/* Main Page Content */}
          <main className="flex-1 pb-16 w-full">
            {activeTab === 'create' && (
              <CreateInvoice
                key={keyReset}
                onViewDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                onNewInvoice={handleNewInvoice}
                initialInvoiceNumber={initialInvoiceNumber}
              />
            )}

            {activeTab === 'catalog' && (
              <PricingCatalog onStartInvoice={handleNewInvoice} />
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">InvoiceAI</span>
                <span>—</span>
                <span className="text-slate-500 dark:text-slate-400">AI understands. Your pricing database decides.</span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  100% Deterministic Arithmetic
                </span>
                <span>•</span>
                <span>Kodnexus AI Build Battle</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
