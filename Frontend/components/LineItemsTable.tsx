import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CatalogItem, InvoiceItem } from '../types/index.js';
import { formatCurrency } from '../utils/currency.js';

interface LineItemsTableProps {
  items: InvoiceItem[];
  catalog: CatalogItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateUnitPrice: (id: string, price: number) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: Partial<InvoiceItem>) => void;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  catalog,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onRemoveItem,
  onAddItem,
}) => {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(1);

  const handleAddNewCatalogItem = () => {
    if (!selectedCatalogId) return;
    const cat = catalog.find((c) => c.service_id === selectedCatalogId);
    if (!cat) return;

    onAddItem({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      service: cat.service_name,
      matched_catalog_id: cat.service_id,
      matched_service_name: cat.service_name,
      category: cat.category,
      quantity: newQty,
      unit_price: cat.unit_price,
      amount: newQty * cat.unit_price,
      price_found: true,
      match_confidence: 'exact',
    });

    setSelectedCatalogId('');
    setNewQty(1);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-colors">
      {/* Table Header Section (Vertical Layout) */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col items-start gap-2.5 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <span>Verified Line Items</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({items.length} services configured)
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Amounts are deterministically computed (Qty × Rate). No LLM math.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Catalog Bound</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-4">Service Description</th>
              <th className="py-3 px-4 w-24 text-center">Qty</th>
              <th className="py-3 px-4 w-36 text-right">Unit Rate (₹)</th>
              <th className="py-3 px-4 w-36 text-right">Amount (₹)</th>
              <th className="py-3 px-4 w-36 text-center">Catalog Match</th>
              <th className="py-3 px-4 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                {/* Serial Number */}
                <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500 text-xs">
                  {idx + 1}
                </td>

                {/* Service Name */}
                <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="font-mono text-slate-400 dark:text-slate-500 font-medium text-xs">{idx + 1}.</span>
                      <span>{item.service}</span>
                    </span>
                    {item.matched_service_name && item.matched_service_name !== item.service && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                        Mapped to: {item.matched_service_name}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-4">{item.notes}</span>
                    )}
                  </div>
                </td>

                {/* Quantity */}
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 py-1 px-2 text-center text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </td>

                {/* Unit Price */}
                <td className="py-3.5 px-4 text-right">
                  <div className="relative inline-block w-28">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 dark:text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => onUpdateUnitPrice(item.id, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-6 pr-2 py-1 text-right text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </td>

                {/* Total Amount */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </td>

                {/* Catalog Match Status */}
                <td className="py-3.5 px-4 text-center">
                  {item.price_found ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {item.matched_catalog_id ? `ID: ${item.matched_catalog_id}` : 'Verified'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Review Required
                    </span>
                  )}
                </td>

                {/* Remove */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No line items in this invoice yet. Add an item below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Line Item Quick Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Add Service from Catalog:</span>
          <select
            value={selectedCatalogId}
            onChange={(e) => setSelectedCatalogId(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Choose an approved service...</option>
            {catalog.map((cat) => (
              <option key={cat.service_id} value={cat.service_id}>
                [{cat.service_id}] {cat.service_name} — {formatCurrency(cat.unit_price)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Qty:</span>
            <input
              type="number"
              min="1"
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 py-1 px-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleAddNewCatalogItem}
            disabled={!selectedCatalogId}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};
