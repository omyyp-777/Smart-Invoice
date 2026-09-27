import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowLeft, Check, AlertCircle, FileText, UserCheck, Calculator } from 'lucide-react';
import { InvoiceCalculation, InvoiceItem } from '../types/index.js';
import { formatCurrency } from '../utils/currency.js';

interface ReviewPanelProps {
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  };
  items: InvoiceItem[];
  calculation: InvoiceCalculation;
  invoiceNumber: string;
  isApproving: boolean;
  onApprove: (checklist: {
    customer_info_verified: boolean;
    line_items_verified: boolean;
    prices_verified: boolean;
    calculations_verified: boolean;
  }) => void;
  onBackToEdit: () => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  customer,
  items,
  calculation,
  invoiceNumber,
  isApproving,
  onApprove,
  onBackToEdit,
}) => {
  const [checkedCustomer, setCheckedCustomer] = useState(true);
  const [checkedLineItems, setCheckedLineItems] = useState(true);
  const [checkedPricing, setCheckedPricing] = useState(!calculation.has_unpriced_items);
  const [checkedCalculations, setCheckedCalculations] = useState(true);

  const canApprove =
    checkedCustomer &&
    checkedLineItems &&
    checkedPricing &&
    checkedCalculations &&
    !calculation.has_unpriced_items;

  const handleApprove = () => {
    if (!canApprove || isApproving) return;
    onApprove({
      customer_info_verified: checkedCustomer,
      line_items_verified: checkedLineItems,
      prices_verified: checkedPricing,
      calculations_verified: checkedCalculations,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-100 dark:border-indigo-900/60">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Review Before Approval
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Authorize invoice <strong>{invoiceNumber}</strong>. Human-in-the-loop verification guarantees complete compliance and accuracy.
          </p>
        </div>

        {/* Verification Checklist */}
        <div className="py-6 space-y-5">
          {/* 1. Customer Information */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    1. Customer Information
                  </h4>
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>
                      <strong>Name:</strong> {customer.name || 'Not provided'}
                    </p>
                    <p>
                      <strong>Email:</strong> {customer.email || 'None provided'}
                    </p>
                    {customer.company && (
                      <p>
                        <strong>Company:</strong> {customer.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checkedCustomer}
                  onChange={(e) => setCheckedCustomer(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified</span>
              </label>
            </div>
          </div>

          {/* 2. Line Items */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    2. Line Items
                  </h4>
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold text-[11px] w-5">
                          {idx + 1}.
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.service}</span>
                        <span className="text-slate-500 dark:text-slate-400">× {item.quantity}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono">({formatCurrency(item.amount)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checkedLineItems}
                  onChange={(e) => setCheckedLineItems(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified</span>
              </label>
            </div>
          </div>

          {/* 3. Pricing Verification */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    3. Pricing Integrity
                  </h4>
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    {calculation.has_unpriced_items ? (
                      <p className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Warning: {calculation.unpriced_count} service(s) lack approved catalog rates.
                      </p>
                    ) : (
                      <>
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">✓ All prices verified against approved catalog</p>
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">✓ Zero missing catalog items</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={calculation.has_unpriced_items}
                  checked={checkedPricing}
                  onChange={(e) => setCheckedPricing(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 disabled:opacity-50"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified</span>
              </label>
            </div>
          </div>

          {/* 4. Calculations */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    4. Calculation Engine
                  </h4>
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5 font-mono">
                    <p>Subtotal: {formatCurrency(calculation.subtotal)}</p>
                    {calculation.tax_rate === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">Tax: None (0%) — {formatCurrency(0)}</p>
                    ) : (
                      <p>
                        Tax ({calculation.tax_rate}%): {formatCurrency(calculation.tax_amount)}
                      </p>
                    )}
                    {calculation.discount_amount > 0 && (
                      <p className="text-emerald-600 dark:text-emerald-400">Discount: -{formatCurrency(calculation.discount_amount)}</p>
                    )}
                    <p className="font-bold text-slate-900 dark:text-white text-sm pt-1">
                      Final Total: {formatCurrency(calculation.total)}
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checkedCalculations}
                  onChange={(e) => setCheckedCalculations(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onBackToEdit}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoice Editor</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={!canApprove || isApproving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-200 dark:shadow-emerald-950/60 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isApproving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authorizing Invoice...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Approve &amp; Authorize Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
