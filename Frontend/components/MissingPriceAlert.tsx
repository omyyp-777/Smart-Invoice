import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, Check, Search, ShieldAlert } from 'lucide-react';
import { CatalogItem, InvoiceItem } from '../types/index.js';
import { formatCurrency } from '../utils/currency.js';

interface MissingPriceAlertProps {
  unpricedItems: InvoiceItem[];
  catalog: CatalogItem[];
  onSetManualPrice: (itemId: string, unitPrice: number, notes?: string) => void;
  onMapToCatalog: (itemId: string, catalogItem: CatalogItem) => void;
  onRemoveItem: (itemId: string) => void;
}

export const MissingPriceAlert: React.FC<MissingPriceAlertProps> = ({
  unpricedItems,
  catalog,
  onSetManualPrice,
  onMapToCatalog,
  onRemoveItem,
}) => {
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});
  const [selectedCatalogMap, setSelectedCatalogMap] = useState<Record<string, string>>({});

  if (unpricedItems.length === 0) return null;

  const handlePriceChange = (itemId: string, value: string) => {
    setManualPrices((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleApplyManual = (itemId: string) => {
    const val = parseFloat(manualPrices[itemId] || '0');
    if (!val || val <= 0) return;
    onSetManualPrice(itemId, val, 'Manual price set by reviewer (Item not in standard catalog)');
  };

  const handleApplyCatalog = (itemId: string) => {
    const catId = selectedCatalogMap[itemId];
    if (!catId) return;
    const found = catalog.find((c) => c.service_id === catId);
    if (found) {
      onMapToCatalog(itemId, found);
    }
  };

  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
          <ShieldAlert className="w-6 h-6 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide flex items-center gap-2">
              <span>Price Review Required ({unpricedItems.length} Unresolved)</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-full border border-amber-300 dark:border-amber-700">
              Zero Price Hallucination Guard
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            The AI understood the requested service, but <strong>no matching entry exists in your approved pricing catalog</strong>. To prevent price fabrication, human resolution is required before generating the invoice.
          </p>

          <div className="mt-4 space-y-4">
            {unpricedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 p-4 shadow-xs transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        "{item.service}"
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono border border-slate-200 dark:border-slate-700">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Status: <strong className="text-amber-700 dark:text-amber-400">NOT IN APPROVED CATALOG</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Item</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Enter Custom Approved Rate */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Option A: Enter Custom Approved Unit Rate (₹)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-medium text-slate-400">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 4500"
                          value={manualPrices[item.id] || ''}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleApplyManual(item.id)}
                        disabled={!manualPrices[item.id] || parseFloat(manualPrices[item.id]) <= 0}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Rate</span>
                      </button>
                    </div>
                  </div>

                  {/* Option B: Map to existing Catalog Item */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Option B: Map to Existing Catalog Service
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCatalogMap[item.id] || ''}
                        onChange={(e) =>
                          setSelectedCatalogMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">Select standard catalog item...</option>
                        {catalog.map((cat) => (
                          <option key={cat.service_id} value={cat.service_id}>
                            {cat.service_name} ({formatCurrency(cat.unit_price)})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleApplyCatalog(item.id)}
                        disabled={!selectedCatalogMap[item.id]}
                        className="px-3 py-1.5 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Map</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
