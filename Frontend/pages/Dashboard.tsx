import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Printer,
  Share2,
  X,
  ShieldCheck,
  Download,
  Calendar,
  Hash,
  RotateCcw,
  Filter,
  Link2,
  Check,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StoredInvoice } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/currency.js';
import { openWhatsAppShare, copyInvoiceLinkToClipboard, getSharableInvoiceUrl } from '../utils/share.js';
import { fetchInvoices } from '../services/api.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

interface DashboardProps {
  onNewInvoice: () => void;
  initialInvoiceNumber?: string | null;
}

const renderStatusBadge = (status: 'APPROVED' | 'DRAFT' | string) => {
  const isApproved = status === 'APPROVED';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs tracking-wide transition-all ${
        isApproved
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
          : 'bg-amber-50 text-amber-800 border-amber-300'
      }`}
    >
      {isApproved ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
          <span>Approved</span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 text-amber-600 shrink-0 stroke-[2.5]" />
          <span>Draft</span>
        </>
      )}
    </span>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNewInvoice, initialInvoiceNumber }) => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [invoiceNumberQuery, setInvoiceNumberQuery] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DRAFT'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [modalLinkCopied, setModalLinkCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoices()
      .then((data) => {
        const list = data.invoices || [];
        setInvoices(list);
        if (initialInvoiceNumber) {
          const needle = initialInvoiceNumber.trim().toLowerCase();
          const found = list.find(
            (inv: StoredInvoice) =>
              inv.invoice_number.toLowerCase() === needle ||
              inv.id.toLowerCase() === needle
          );
          if (found) {
            setSelectedInvoice(found);
          }
        }
      })
      .catch((err) => console.error('Failed to load invoices:', err));
  }, [initialInvoiceNumber]);

  // Close modal and return to dashboard on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedInvoice) {
        setSelectedInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice]);

  // Quick preset helper
  const handleSelectDatePreset = (preset: 'all' | 'today' | '7days' | '30days' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = toDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === '30days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    }
  };

  const handleResetFilters = () => {
    setInvoiceNumberQuery('');
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  const isFilteringActive = Boolean(
    invoiceNumberQuery.trim() ||
    searchTerm.trim() ||
    statusFilter !== 'ALL' ||
    startDate ||
    endDate ||
    datePreset !== 'all'
  );

  // Calculate real-time summary statistics directly from application state
  const stats = React.useMemo(() => {
    const totalApprovedCount = invoices.filter((inv) => inv.status === 'APPROVED').length;
    const pendingDraftCount = invoices.filter((inv) => inv.status === 'DRAFT').length;
    const totalApprovedRevenue = invoices
      .filter((inv) => inv.status === 'APPROVED')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const totalGrossRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    return {
      totalInvoices: invoices.length,
      totalApprovedCount,
      pendingDraftCount,
      totalApprovedRevenue,
      totalGrossRevenue,
    };
  }, [invoices]);

  // Donut chart status distribution dataset
  const chartData = React.useMemo(() => {
    return [
      {
        name: 'Approved',
        value: stats.totalApprovedCount,
        color: '#10b981', // emerald-500
        count: stats.totalApprovedCount,
      },
      {
        name: 'Draft',
        value: stats.pendingDraftCount,
        color: '#f59e0b', // amber-500
        count: stats.pendingDraftCount,
      },
    ];
  }, [stats]);

  const filteredInvoices = invoices.filter((inv) => {
    // 1. Specific Invoice Number Query (exact or partial)
    if (invoiceNumberQuery.trim()) {
      const q = invoiceNumberQuery.trim().toLowerCase();
      if (!inv.invoice_number.toLowerCase().includes(q)) {
        return false;
      }
    }

    // 2. Customer Name / Email / Company keyword search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchCustomer =
        inv.customer.name.toLowerCase().includes(q) ||
        (inv.customer.email && inv.customer.email.toLowerCase().includes(q)) ||
        (inv.customer.company && inv.customer.company.toLowerCase().includes(q)) ||
        inv.invoice_number.toLowerCase().includes(q);
      if (!matchCustomer) {
        return false;
      }
    }

    // 3. Status filter
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
      return false;
    }

    // 4. Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const invDate = new Date(inv.created_at);
      if (invDate < start) {
        return false;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const invDate = new Date(inv.created_at);
      if (invDate > end) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Greeting & Header (Vertical Layout) */}
      <div className="flex flex-col items-start gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Operational Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Good afternoon 👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of AI-generated and catalog-verified invoices.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 dark:shadow-indigo-950/60 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Real-Time Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Revenue (Approved) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1 font-mono">
              {formatCurrency(stats.totalApprovedRevenue)}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{formatCurrency(stats.totalGrossRevenue)} gross volume</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Approved Invoice Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Invoices</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
              {stats.totalApprovedCount}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Human authorized</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Draft Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Drafts</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {stats.pendingDraftCount}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting sign-off</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Invoices</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {stats.totalInvoices}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Catalog verified</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Invoice Status Distribution (Recharts Donut Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workload Overview
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Status Breakdown
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Invoice Status Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual overview of pending drafts requiring human review vs approved invoices.
            </p>
          </div>

          {stats.pendingDraftCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>{stats.pendingDraftCount}</strong> pending draft{stats.pendingDraftCount === 1 ? '' : 's'} awaiting human sign-off
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>All invoices approved and up-to-date</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-5">
          {/* Donut Chart Visual */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[190px]">
            {stats.totalInvoices === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-4">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">0 Invoices</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">No invoices recorded yet</p>
              </div>
            ) : (
              <div className="w-full h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const total = stats.totalInvoices || 1;
                          const pct = Math.round(((Number(data.value) || 0) / total) * 100);
                          return (
                            <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-slate-700">
                              <p className="font-bold flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: (data.payload as any)?.color }}
                                />
                                <span>{data.name}</span>
                              </p>
                              <p className="font-mono text-slate-300 mt-0.5">
                                {data.value} {Number(data.value) === 1 ? 'record' : 'records'} ({pct}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={stats.totalApprovedCount > 0 && stats.pendingDraftCount > 0 ? 4 : 0}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#ffffff"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
                    {stats.totalInvoices}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                    Total
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Details & Interactive Quick Filters */}
          <div className="md:col-span-7 flex flex-col justify-center gap-3">
            {/* Approved Row */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-200 dark:ring-emerald-800 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-slate-800'
              }`}
              title="Click to filter by Approved"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Approved Invoices</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    {stats.totalInvoices > 0
                      ? `${Math.round((stats.totalApprovedCount / stats.totalInvoices) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {stats.totalApprovedCount}{' '}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-sans">
                    ({formatCurrency(stats.totalApprovedRevenue)})
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalInvoices > 0
                        ? (stats.totalApprovedCount / stats.totalInvoices) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Draft Row */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                statusFilter === 'DRAFT'
                  ? 'bg-amber-50/70 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-800 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-slate-800'
              }`}
              title="Click to filter by Pending Drafts"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Pending Drafts</span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                    {stats.totalInvoices > 0
                      ? `${Math.round((stats.pendingDraftCount / stats.totalInvoices) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
                  {stats.pendingDraftCount}{' '}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-sans">
                    awaiting human sign-off
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalInvoices > 0
                        ? (stats.pendingDraftCount / stats.totalInvoices) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              <span>Click a card above to filter the table below</span>
              {statusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Show all statuses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table (Section 18) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Table Controls (Vertical Layout) */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col items-start gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          {/* Header Row: Title, Filter Toggle Interface, and Global Reset */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-mono font-medium">
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'record' : 'records'}
                {isFilteringActive && ` of ${stats.totalInvoices}`}
              </span>
            </div>

            {/* Filter Interface: Toggle between All, Only Draft, or Only Approved */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="tablist"
                aria-label="Filter invoices by status"
                className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/80 shadow-2xs gap-1"
              >
                {/* 1. All Invoices */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'ALL'}
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-300 dark:ring-slate-700 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                  title="Show all invoices regardless of status"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>All</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold'
                        : 'bg-slate-300/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stats.totalInvoices}
                  </span>
                </button>

                {/* 2. Only Draft */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'DRAFT'}
                  onClick={() => setStatusFilter('DRAFT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'DRAFT'
                      ? 'bg-amber-500 dark:bg-amber-500 text-white shadow-xs font-bold ring-1 ring-amber-600'
                      : 'text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                  }`}
                  title="Show only pending draft invoices awaiting sign-off"
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Only Draft</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      statusFilter === 'DRAFT'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-medium'
                    }`}
                  >
                    {stats.pendingDraftCount}
                  </span>
                </button>

                {/* 3. Only Approved */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'APPROVED'}
                  onClick={() => setStatusFilter('APPROVED')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'APPROVED'
                      ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-700'
                      : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40'
                  }`}
                  title="Show only verified and approved invoices"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Only Approved</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      statusFilter === 'APPROVED'
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium'
                    }`}
                  >
                    {stats.totalApprovedCount}
                  </span>
                </button>
              </div>

              {isFilteringActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-800 transition-colors cursor-pointer"
                  title="Clear all search queries and filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tier 1: Search Inputs (Invoice Number Search & Customer Search) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {/* 1. Dedicated Search by Invoice Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Search Invoice #
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={invoiceNumberQuery}
                  onChange={(e) => setInvoiceNumberQuery(e.target.value)}
                  placeholder="e.g. INV-20260926-001"
                  className="w-full pl-8 pr-7 py-1.5 text-xs font-mono font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {invoiceNumberQuery && (
                  <button
                    type="button"
                    onClick={() => setInvoiceNumberQuery('')}
                    className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    title="Clear invoice # filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Search Customer / Keyword */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Search Customer / Company
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Customer name, email, or company..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    title="Clear customer search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tier 2: Date Range Filter with Quick Presets & Pickers */}
          <div className="w-full pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date Range Filter</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: '7days', label: 'Last 7 Days' },
                    { key: '30days', label: 'Last 30 Days' },
                    { key: 'custom', label: 'Custom' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectDatePreset(key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      datePreset === key
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers (From - To) */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setDatePreset('all');
                  }}
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Filter Tier 3: Active Status Indicator & Filter Tags */}
          <div className="w-full pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Quick Status Context Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status Filter:</span>
              {statusFilter === 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>All Invoices ({stats.totalInvoices})</span>
                </span>
              )}
              {statusFilter === 'DRAFT' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Drafts Only ({stats.pendingDraftCount} pending)</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="ml-1 text-amber-600 hover:text-amber-900 dark:hover:text-amber-100 underline text-[11px] font-normal cursor-pointer"
                  >
                    Clear
                  </button>
                </span>
              )}
              {statusFilter === 'APPROVED' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Approved Only ({stats.totalApprovedCount} verified)</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="ml-1 text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-100 underline text-[11px] font-normal cursor-pointer"
                  >
                    Clear
                  </button>
                </span>
              )}
            </div>

            {/* Active Filter Indicators */}
            {isFilteringActive && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Applied Filters:</span>
                {invoiceNumberQuery && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-mono font-medium">
                    #{invoiceNumberQuery}
                    <button
                      onClick={() => setInvoiceNumberQuery('')}
                      className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    Keyword: {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(startDate || endDate) && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-mono">
                    {startDate || '...'} → {endDate || '...'}
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setDatePreset('all');
                      }}
                      className="hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-semibold">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{inv.customer.name}</p>
                      {inv.customer.company && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{inv.customer.company}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-1">
                      {inv.items.map((it) => `${it.service} (×${it.quantity})`).join(', ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderStatusBadge(inv.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(inv.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => generateInvoicePDF(inv)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openWhatsAppShare(inv)}
                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded transition-colors cursor-pointer"
                        title="Share via WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      {statusFilter === 'DRAFT' && stats.pendingDraftCount === 0 ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            No Pending Draft Invoices
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            All recorded invoices have been verified and approved. There are no pending drafts requiring sign-off.
                          </p>
                          <div className="pt-2 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setStatusFilter('ALL')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View All Invoices</span>
                            </button>
                            <button
                              type="button"
                              onClick={onNewInvoice}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create New Invoice</span>
                            </button>
                          </div>
                        </>
                      ) : statusFilter === 'APPROVED' && stats.totalApprovedCount === 0 ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800">
                            <Clock className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            No Approved Invoices Yet
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            You currently have {stats.pendingDraftCount} draft invoice{stats.pendingDraftCount === 1 ? '' : 's'} awaiting human sign-off.
                          </p>
                          <div className="pt-2 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setStatusFilter('DRAFT')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-200/80 rounded-lg transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>View Pending Drafts ({stats.pendingDraftCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusFilter('ALL')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View All Invoices</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
                            <Search className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            No invoice records found
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isFilteringActive
                              ? 'No invoices match your active filters (Invoice #, Date range, Customer, or Status).'
                              : 'No invoice records exist in the database yet.'}
                          </p>
                          {isFilteringActive ? (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Clear All Filters</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onNewInvoice}
                              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create New Invoice</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Quick View Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedInvoice(null);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Invoice Details</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {selectedInvoice.invoice_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Cancel and return to Dashboard"
              >
                <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Cancel</span>
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">CUSTOMER:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedInvoice.customer.name}</p>
                  <p className="text-slate-600 dark:text-slate-300">{selectedInvoice.customer.email}</p>
                  {selectedInvoice.customer.company && (
                    <p className="text-slate-500 dark:text-slate-400">{selectedInvoice.customer.company}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">TOTAL DUE:</span>
                  <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400 font-mono mt-0.5">
                    {formatCurrency(selectedInvoice.total)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    {renderStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Line Items Breakdown:</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.service}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">× {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.tax_rate > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>GST ({selectedInvoice.tax_rate}%):</span>
                    <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                  </div>
                )}
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-700 pt-1 text-sm">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                  <strong>Notes:</strong> {selectedInvoice.notes}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Always-visible Cancel button to redirect back to Dashboard */}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Cancel and return to Dashboard"
                >
                  <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Cancel</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await copyInvoiceLinkToClipboard(selectedInvoice.invoice_number);
                      if (res.success) {
                        setModalLinkCopied(true);
                        setTimeout(() => setModalLinkCopied(false), 3000);
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Copy unique sharable invoice URL to clipboard"
                  >
                    {modalLinkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        <span className="text-emerald-300 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Copy Invoice Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => generateInvoicePDF(selectedInvoice)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => openWhatsAppShare(selectedInvoice)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share via WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const orig = document.title;
                      document.title = `${selectedInvoice.invoice_number}_TaxInvoice`;
                      window.print();
                      setTimeout(() => {
                        document.title = orig;
                      }, 1000);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
