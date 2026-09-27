import React from 'react';
import { Percent, Shield, ArrowRightLeft, Info, HelpCircle } from 'lucide-react';
import { TaxOptionType } from '../types/index.js';
import { formatCurrency } from '../utils/currency.js';

interface TaxConfigurationSectionProps {
  taxType: TaxOptionType;
  taxRate: number;
  customRateValue: number;
  taxMode: 'intra_state' | 'inter_state';
  subtotal: number;
  discountAmount?: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  cgstRate?: number;
  sgstRate?: number;
  onSelectTaxType: (type: TaxOptionType, explicitRate?: number) => void;
  onUpdateCustomRate: (rate: number) => void;
  onUpdateTaxMode: (mode: 'intra_state' | 'inter_state') => void;
}

export const TaxConfigurationSection: React.FC<TaxConfigurationSectionProps> = ({
  taxType,
  taxRate,
  customRateValue,
  taxMode,
  subtotal,
  discountAmount = 0,
  taxAmount,
  cgstAmount = 0,
  sgstAmount = 0,
  cgstRate = 0,
  sgstRate = 0,
  onSelectTaxType,
  onUpdateCustomRate,
  onUpdateTaxMode,
}) => {
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);

  const taxOptions: Array<{
    id: TaxOptionType;
    label: string;
    rateDisplay: string;
    description: string;
  }> = [
    {
      id: 'none',
      label: 'None',
      rateDisplay: '0%',
      description: 'Zero tax applied to subtotal',
    },
    {
      id: 'gst_18',
      label: 'GST 18%',
      rateDisplay: '18%',
      description: 'Standard IT, media & consulting services',
    },
    {
      id: 'gst_5',
      label: 'GST 5%',
      rateDisplay: '5%',
      description: 'Concessional essentials & print services',
    },
    {
      id: 'custom',
      label: 'Custom',
      rateDisplay: taxType === 'custom' ? `${customRateValue}%` : 'Other %',
      description: 'Specify user-defined tax rate',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 transition-all no-print">
      {/* Header (Vertical Layout) */}
      <div className="flex flex-col items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Tax Configuration
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                Applied to Subtotal
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select statutory GST slab or enter a custom rate for this invoice
            </p>
          </div>
        </div>

        {/* Live Tax Summary Pill (Stacked Vertically) */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Calculated Tax:</span>
          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
            {formatCurrency(taxAmount)}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">({taxRate}%)</span>
        </div>
      </div>

      {/* Tax Slabs Selector Grid */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
          Tax Slabs
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {taxOptions.map((opt) => {
            const isSelected = taxType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectTaxType(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.rateDisplay}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Rate Input when 'custom' is selected */}
      {taxType === 'custom' && (
        <div className="mt-4 p-3.5 bg-indigo-50/40 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1">
              Custom Tax Percentage (%)
            </label>
            <div className="relative w-40">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={customRateValue}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                  onUpdateCustomRate(val);
                }}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                placeholder="Rate %"
              />
              <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                %
              </span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Common presets:</span>
            {[
              { label: 'GST 12%', val: 12 },
              { label: 'GST 28%', val: 28 },
              { label: '0.1%', val: 0.1 },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onUpdateCustomRate(p.val)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  customRateValue === p.val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tax Region Mode (Intra-State vs Inter-State) */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            GST Region Mode:
          </label>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onUpdateTaxMode('intra_state')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                taxMode === 'intra_state'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Intra-State (CGST + SGST)
            </button>
            <button
              type="button"
              onClick={() => onUpdateTaxMode('inter_state')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                taxMode === 'inter_state'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Inter-State (IGST)
            </button>
          </div>
        </div>

        {/* Breakdown badge */}
        <div className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
          {taxRate === 0 ? (
            <span className="text-slate-400 dark:text-slate-500 italic">No tax added to taxable subtotal</span>
          ) : taxMode === 'intra_state' ? (
            <span>
              CGST: <strong className="text-slate-800 dark:text-white">{cgstRate}%</strong> ({formatCurrency(cgstAmount)}) + SGST: <strong className="text-slate-800 dark:text-white">{sgstRate}%</strong> ({formatCurrency(sgstAmount)})
            </span>
          ) : (
            <span>
              IGST: <strong className="text-slate-800 dark:text-white">{taxRate}%</strong> ({formatCurrency(taxAmount)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
