import React, { useState } from 'react';
import { Check, Download, Share2, Copy, CheckCheck, Plus, ExternalLink, Printer, Link2 } from 'lucide-react';
import { StoredInvoice } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/currency.js';
import {
  openWhatsAppShare,
  generateWhatsAppMessage,
  copyInvoiceLinkToClipboard,
  getSharableInvoiceUrl,
} from '../utils/share.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

interface ApprovalSuccessProps {
  invoice: StoredInvoice;
  onCreateNew: () => void;
  onViewDashboard: () => void;
}

export const ApprovalSuccess: React.FC<ApprovalSuccessProps> = ({
  invoice,
  onCreateNew,
  onViewDashboard,
}) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = () => {
    const text = generateWhatsAppMessage(invoice);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyInvoiceLink = async () => {
    const res = await copyInvoiceLinkToClipboard(invoice.invoice_number);
    if (res.success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleDownloadPDF = () => {
    setIsPdfDownloading(true);
    setTimeout(() => {
      generateInvoicePDF(invoice);
      setIsPdfDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 150);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const safeCustName = (invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `${invoice.invoice_number}_${safeCustName}_TaxInvoice`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-6 sm:py-10 animate-fade-in no-print">
      {/* Big Success Tick */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/50 ring-8 ring-emerald-50 dark:ring-emerald-950/40">
        <Check className="w-10 h-10 stroke-[2.5]" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 mb-3">
        Authorization Complete
      </span>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Invoice Approved
      </h2>

      <div className="mt-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs max-w-md mx-auto transition-colors">
        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          {invoice.invoice_number}
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 font-mono my-2">
          {formatCurrency(invoice.total)}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Billed to <strong className="text-slate-700 dark:text-slate-200">{invoice.customer.name}</strong> • {formatDate(invoice.created_at)}
        </p>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 max-w-sm mx-auto">
        Your verified invoice has been finalized with zero pricing hallucination and full arithmetic compliance. Ready to send.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {/* Copy Invoice Link Button (Primary action for sharing online) */}
        <button
          type="button"
          onClick={handleCopyInvoiceLink}
          className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-slate-300/60 dark:shadow-indigo-950/60 transition-all active:scale-95 cursor-pointer"
          title="Copy unique sharable invoice link to clipboard"
        >
          {linkCopied ? (
            <>
              <CheckCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-300 font-bold">Link Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span>Copy Invoice Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={isPdfDownloading}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-100 dark:shadow-indigo-950/60 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
              <span>PDF Downloaded!</span>
            </>
          ) : isPdfDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </>
          )}
        </button>

        <button
          onClick={() => openWhatsAppShare(invoice)}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-100 dark:shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer"
          title={`Open WhatsApp with pre-filled invoice ${invoice.invoice_number} (${formatCurrency(invoice.total)})`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share via WhatsApp</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          title="Print using browser dialog or save as PDF"
        >
          <Printer className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>

        <button
          onClick={handleCopy}
          className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Copy Message</span>
            </>
          )}
        </button>
      </div>

      {/* Unique Sharable Invoice Link Card */}
      <div className="mt-6 max-w-lg mx-auto bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3 text-left transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
              Unique Sharable Invoice Link
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate block">
              {getSharableInvoiceUrl(invoice.invoice_number)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyInvoiceLink}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Copy unique sharable URL to clipboard"
        >
          {linkCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Links */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-xs">
        <button
          onClick={onCreateNew}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Another Invoice</span>
        </button>

        <button
          onClick={onViewDashboard}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
        >
          <span>View All Invoices on Dashboard →</span>
        </button>
      </div>
    </div>
  );
};
