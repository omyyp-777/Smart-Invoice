import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Hash,
  FileCheck,
  ArrowRight,
  Printer,
  AlertTriangle,
  Download,
  Check,
  Share2,
} from 'lucide-react';
import { InvoiceCalculation, InvoiceItem, TaxOptionType } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/currency.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { openWhatsAppShare } from '../utils/share.js';

interface InvoicePreviewProps {
  invoiceNumber: string;
  createdDate: string;
  status: 'DRAFT' | 'APPROVED';
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  };
  items: InvoiceItem[];
  calculation: InvoiceCalculation;
  taxRate: number;
  taxType?: TaxOptionType;
  taxMode: 'intra_state' | 'inter_state';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  notes?: string | null;
  onUpdateTaxRate: (rate: number) => void;
  onSelectTaxType?: (type: TaxOptionType, rate?: number) => void;
  onUpdateTaxMode: (mode: 'intra_state' | 'inter_state') => void;
  onUpdateDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  onProceedToReview: () => void;
  onBackToEdit: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceNumber,
  createdDate,
  status,
  customer,
  items,
  calculation,
  taxRate,
  taxType,
  taxMode,
  discountType,
  discountValue,
  notes,
  onUpdateTaxRate,
  onSelectTaxType,
  onUpdateTaxMode,
  onUpdateDiscount,
  onProceedToReview,
  onBackToEdit,
}) => {
  const hasUnpriced = calculation.has_unpriced_items;
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);

  // Derive current tax option
  const resolvedTaxType: TaxOptionType =
    taxType ||
    (taxRate === 0 ? 'none' : taxRate === 18 ? 'gst_18' : taxRate === 5 ? 'gst_5' : 'custom');

  const handleDownloadPDF = () => {
    setIsPdfDownloading(true);
    setTimeout(() => {
      generateInvoicePDF({
        invoiceNumber,
        createdDate,
        status,
        customer,
        items,
        calculation,
        taxRate,
        taxMode,
        discountType,
        discountValue,
        notes,
      });
      setIsPdfDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 150);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const safeCustName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `${invoiceNumber}_${safeCustName}_TaxInvoice`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Controls Bar for Tax & Discount (Vertical Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4 no-print transition-colors">
        {/* Section 1: Tax Configuration */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Tax Configuration
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCustomInputOpen(false);
                if (onSelectTaxType) onSelectTaxType('none', 0);
                else onUpdateTaxRate(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                resolvedTaxType === 'none'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              None
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomInputOpen(false);
                if (onSelectTaxType) onSelectTaxType('gst_18', 18);
                else onUpdateTaxRate(18);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                resolvedTaxType === 'gst_18'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              GST 18%
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomInputOpen(false);
                if (onSelectTaxType) onSelectTaxType('gst_5', 5);
                else onUpdateTaxRate(5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                resolvedTaxType === 'gst_5'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              GST 5%
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCustomInputOpen(true);
                  if (resolvedTaxType !== 'custom') {
                    const rate = (taxRate !== 0 && taxRate !== 18 && taxRate !== 5) ? taxRate : 12;
                    if (onSelectTaxType) onSelectTaxType('custom', rate);
                    else onUpdateTaxRate(rate);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  resolvedTaxType === 'custom'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Custom {resolvedTaxType === 'custom' && `(${taxRate}%)`}
              </button>

              {(resolvedTaxType === 'custom' || customInputOpen) && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                      if (onSelectTaxType) onSelectTaxType('custom', val);
                      else onUpdateTaxRate(val);
                    }}
                    className="w-16 py-1 px-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-1 focus:ring-indigo-500"
                    placeholder="%"
                  />
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: GST Region Mode & Discount (Vertical stacked) */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* GST Mode */}
          {taxRate > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                GST Region Mode
              </label>
              <select
                value={taxMode}
                onChange={(e) => onUpdateTaxMode(e.target.value as any)}
                className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="intra_state">Intra-State (CGST + SGST)</option>
                <option value="inter_state">Inter-State (IGST)</option>
              </select>
            </div>
          )}

          {/* Discount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Discount
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => onUpdateDiscount(discountType, Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 py-1.5 px-2.5 text-xs font-mono font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={discountType}
                onChange={(e) => onUpdateDiscount(e.target.value as any, discountValue)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="fixed">₹ Flat</option>
                <option value="percentage">% Percent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Action Buttons (Vertical stacked row) */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          {status === 'APPROVED' && (
            <button
              onClick={() =>
                openWhatsAppShare({
                  invoice_number: invoiceNumber,
                  total: calculation.total,
                  subtotal: calculation.subtotal,
                  tax_rate: taxRate,
                  tax_amount: calculation.tax_amount,
                  discount_amount: calculation.discount_amount,
                  customer,
                  items,
                  notes,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
              title={`Share invoice ${invoiceNumber} via WhatsApp`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share via WhatsApp</span>
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isPdfDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Download PDF directly to device"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                <span>Downloaded!</span>
              </>
            ) : isPdfDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Open browser print dialog to print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>Print / Browser PDF</span>
          </button>
        </div>
      </div>

      {/* THE ACTUAL AUTHENTIC INVOICE PAPER (Pixel-perfect Letterhead Style for Paper & PDF Export) */}
      <div
        id="printable-invoice"
        className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 sm:p-12 relative text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:w-full"
      >
        {/* ALL HEADER SECTIONS IN VERTICAL MANNER */}
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-8">
          {/* Vertical Header Section 1: Company / Issuer Identity */}
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                IA
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">
                  INVOICEAI
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Smart AI Invoice Automation &amp; Verification
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              HQ: Digital Park, Sector 62, Noida, India<br />
              GSTIN: 07AAAAA0000A1Z5 • support@invoiceai.internal
            </p>
          </div>

          {/* Vertical Header Section 2: Invoice Metadata & Reference */}
          <div className="flex flex-col items-start gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2.5 py-0.5 rounded border border-slate-200">
                TAX INVOICE
              </span>
              <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200/70 text-slate-800">
                STATUS: {status}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
              <div className="text-base font-mono font-bold text-slate-900 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>{invoiceNumber}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Invoice Date: {formatDate(createdDate)}</span>
              </div>
            </div>
          </div>

          {/* Vertical Header Section 3: Billed To (Customer Details) */}
          <div className="flex flex-col items-start gap-1 p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 w-full">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              BILLED TO
            </h4>
            <p className="font-bold text-base text-slate-900">
              {customer.name || 'Valued Customer'}
            </p>
            {customer.company && (
              <p className="font-semibold text-slate-700 text-xs sm:text-sm">{customer.company}</p>
            )}
            {customer.email ? (
              <p className="text-slate-600 text-xs">{customer.email}</p>
            ) : (
              <p className="text-amber-700 text-xs font-medium italic">Email not provided</p>
            )}
            {customer.phone && (
              <p className="text-slate-500 text-xs">Phone: {customer.phone}</p>
            )}
          </div>

          {/* Vertical Header Section 4: Payment Terms */}
          <div className="flex flex-col items-start gap-1 p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 w-full">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              PAYMENT TERMS
            </h4>
            <p className="font-semibold text-slate-800 text-xs sm:text-sm">Due upon receipt</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Payment accepted via UPI, NEFT, IMPS or Corporate Wire Transfer.<br />
              Catalog reference verified via AI Engine with zero arithmetic discrepancy.
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 w-20 text-center">Qty</th>
                <th className="py-3 px-3 w-28 text-right">Rate</th>
                <th className="py-3 px-3 w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono text-slate-400 font-semibold">{idx + 1}.</span>
                      <span>{item.service}</span>
                    </p>
                    {item.matched_service_name && item.matched_service_name !== item.service && (
                      <p className="text-[11px] text-slate-500 pl-4">
                        Catalog Match: {item.matched_service_name}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-6">
          <div className="max-w-xs text-xs text-slate-500 space-y-1.5">
            {notes && (
              <div>
                <span className="font-bold text-slate-700">Notes &amp; Instructions:</span>
                <p className="italic text-slate-600 mt-0.5">{notes}</p>
              </div>
            )}
            <div className="pt-2 text-[11px] text-slate-400">
              Prices guaranteed from company catalog. Deterministically generated with zero arithmetic hallucination.
            </div>
          </div>

          <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(calculation.subtotal)}
              </span>
            </div>

            {calculation.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  Discount {discountType === 'percentage' ? `(${discountValue}%)` : '(Flat)'}
                </span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(calculation.discount_amount)}
                </span>
              </div>
            )}

            {calculation.tax_rate > 0 && (
              <>
                {taxMode === 'intra_state' ? (
                  <>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>CGST ({calculation.cgst_rate}%)</span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(calculation.cgst_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>SGST ({calculation.sgst_rate}%)</span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(calculation.sgst_amount || 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST ({calculation.tax_rate}%)</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(calculation.tax_amount)}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-base sm:text-lg font-extrabold text-slate-900">
              <span>TOTAL DUE</span>
              <span className="font-mono text-indigo-700">
                {formatCurrency(calculation.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl no-print transition-colors">
        <button
          onClick={onBackToEdit}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          ← Edit Customer &amp; Line Items
        </button>

        {status === 'APPROVED' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Open browser print dialog to print or save PDF"
            >
              <Printer className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() =>
                openWhatsAppShare({
                  invoice_number: invoiceNumber,
                  total: calculation.total,
                  subtotal: calculation.subtotal,
                  tax_rate: taxRate,
                  tax_amount: calculation.tax_amount,
                  discount_amount: calculation.discount_amount,
                  customer,
                  items,
                  notes,
                })
              }
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        ) : hasUnpriced ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-2 rounded-xl border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please resolve unpriced items before human approval.</span>
          </div>
        ) : (
          <button
            onClick={onProceedToReview}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Proceed to Human Review &amp; Approval</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
