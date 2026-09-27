import React from 'react';
import { User, Mail, Building, FileText, CheckCircle2, Clock, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import { ExtractionResult, InvoiceItem } from '../types/index.js';

interface ExtractionCardProps {
  extraction: ExtractionResult;
  customerData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
  };
  onUpdateCustomer: (field: string, value: string) => void;
  items: InvoiceItem[];
  onProceedToPricing: () => void;
}

export const ExtractionCard: React.FC<ExtractionCardProps> = ({
  extraction,
  customerData,
  onUpdateCustomer,
  items,
  onProceedToPricing,
}) => {
  const isMissingEmail = !customerData.email.trim();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-colors">
      {/* Header bar (Vertical Layout) */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex flex-col items-start gap-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
            AI
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
              AI Extraction Results
            </h2>
            <p className="text-xs text-slate-400">
              Extracted via {extraction.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Validated Schema Parser'} • Fully editable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Requirement Parsed
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer Info Form (Editable) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Customer Information</span>
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              Click any field to edit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Customer Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => onUpdateCustomer('name', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Email Address
                {isMissingEmail && (
                  <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                    (Not detected in text)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => onUpdateCustomer('email', e.target.value)}
                  placeholder="e.g. rahul@gmail.com"
                  className={`w-full text-sm font-medium rounded-lg px-3 py-2 border transition-all ${
                    isMissingEmail
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 focus:bg-white dark:focus:bg-slate-900 focus:ring-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Company / Organization</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerData.company}
                  onChange={(e) => onUpdateCustomer('company', e.target.value)}
                  placeholder="Optional company name"
                  className="w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone / WhatsApp</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerData.phone}
                  onChange={(e) => onUpdateCustomer('phone', e.target.value)}
                  placeholder="Optional phone number"
                  className="w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Missing email warning if user hasn't typed one */}
          {isMissingEmail && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Human Attention:</strong> Customer email was not detected in the raw message. You can enter it above before generating the invoice.
              </span>
            </div>
          )}
        </div>

        {/* Notes & Special Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Delivery Notes &amp; Deadlines</span>
          </label>
          <input
            type="text"
            value={customerData.notes}
            onChange={(e) => onUpdateCustomer('notes', e.target.value)}
            placeholder="e.g. Urgent delivery, specific color scheme, milestone timeline..."
            className="w-full text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Services Extracted Preview */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Identified Service Requests ({items.length})
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 divide-y divide-slate-200/80 dark:divide-slate-700/60">
            {items.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.service}</span>
                  <span className="text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-mono">
                    Qty: {item.quantity}
                  </span>
                </div>
                <div>
                  {item.price_found ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ In Catalog ({item.matched_service_name || item.service})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      ⚠ Not in Catalog
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onProceedToPricing}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Proceed to Line Items &amp; Pricing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
