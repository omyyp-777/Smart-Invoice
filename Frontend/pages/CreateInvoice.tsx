import React, { useState, useEffect } from 'react';
import { PipelineFlow } from '../components/PipelineFlow.js';
import { MessageInput } from '../components/MessageInput.js';
import { ExtractionCard } from '../components/ExtractionCard.js';
import { MissingPriceAlert } from '../components/MissingPriceAlert.js';
import { LineItemsTable } from '../components/LineItemsTable.js';
import { InvoicePreview } from '../components/InvoicePreview.js';
import { ReviewPanel } from '../components/ReviewPanel.js';
import { ApprovalSuccess } from '../components/ApprovalSuccess.js';
import { TaxConfigurationSection } from '../components/TaxConfigurationSection.js';
import {
  CatalogItem,
  ExtractionResult,
  InvoiceCalculation,
  InvoiceItem,
  StepState,
  StoredInvoice,
  TaxOptionType,
} from '../types/index.js';
import {
  extractCustomerRequirement,
  resolvePrices,
  calculateInvoice,
  approveInvoice,
  fetchPricingCatalog,
} from '../services/api.js';

interface CreateInvoiceProps {
  onViewDashboard: () => void;
  initialCatalog?: CatalogItem[];
}

export const CreateInvoice: React.FC<CreateInvoiceProps> = ({
  onViewDashboard,
  initialCatalog = [],
}) => {
  const [currentStep, setCurrentStep] = useState<StepState>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>(initialCatalog);

  // Step 1 Extraction state
  const [rawMessage, setRawMessage] = useState<string>('');
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  // Customer Data (editable)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  // Step 2 & 3 Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Step 4 Calculation state
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-20260926-004');
  const [taxType, setTaxType] = useState<TaxOptionType>('gst_18');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [customTaxRate, setCustomTaxRate] = useState<number>(12);
  const [taxMode, setTaxMode] = useState<'intra_state' | 'inter_state'>('intra_state');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [calculation, setCalculation] = useState<InvoiceCalculation>({
    subtotal: 0,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 0,
    tax_type: 'gst_18',
    tax_rate: 18,
    tax_mode: 'intra_state',
    tax_amount: 0,
    cgst_rate: 9,
    cgst_amount: 0,
    sgst_rate: 9,
    sgst_amount: 0,
    total: 0,
    has_unpriced_items: false,
    unpriced_count: 0,
  });

  // Step 5 Approved invoice state
  const [approvedInvoice, setApprovedInvoice] = useState<StoredInvoice | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Load catalog on mount
  useEffect(() => {
    fetchPricingCatalog()
      .then((data) => setCatalog(data.catalog))
      .catch((err) => console.warn('Could not load catalog:', err));

    fetch('/api/next-invoice-number')
      .then((res) => res.json())
      .then((data) => {
        if (data.next_invoice_number) setInvoiceNumber(data.next_invoice_number);
      })
      .catch(() => {});
  }, []);

  // Recalculate invoice whenever items, tax, or discount change
  const runCalculation = async (
    currentItems: InvoiceItem[],
    rate: number = taxRate,
    type: TaxOptionType = taxType,
    mode: 'intra_state' | 'inter_state' = taxMode,
    discType: 'percentage' | 'fixed' = discountType,
    discVal: number = discountValue
  ) => {
    try {
      const calcResult = await calculateInvoice({
        items: currentItems.map((i) => ({
          service: i.service,
          quantity: i.quantity,
          unit_price: i.unit_price,
          price_found: i.price_found,
        })),
        tax_rate: rate,
        tax_type: type,
        tax_mode: mode,
        discount_type: discType,
        discount_value: discVal,
      });

      setCalculation(calcResult);
      if (typeof calcResult.tax_rate === 'number') {
        setTaxRate(calcResult.tax_rate);
      }
    } catch (err) {
      console.error('Calculation failed:', err);
    }
  };

  // Step 1: Analyze Request via AI (Single Ultra-Fast Roundtrip)
  const handleAnalyzeMessage = async (message: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setRawMessage(message);

    try {
      // 1-step unified call: Extraction + Catalog Price Matching + Arithmetic in one shot
      const unifiedResult = await extractCustomerRequirement(message, {
        tax_rate: taxRate,
        tax_mode: taxMode,
        discount_type: discountType,
        discount_value: discountValue,
      });

      const extracted = unifiedResult.extraction || unifiedResult;
      setExtraction(extracted);

      setCustomerData({
        name: extracted.customer_name || 'Valued Customer',
        email: extracted.email || '',
        phone: extracted.phone || '',
        company: extracted.company || '',
        notes: extracted.notes || '',
      });

      if (unifiedResult.items && unifiedResult.items.length > 0) {
        setItems(unifiedResult.items);
      } else {
        // Fallback resolve
        const resolution = await resolvePrices(extracted.services);
        setItems(resolution.items);
      }

      if (unifiedResult.calculation) {
        setCalculation(unifiedResult.calculation);
      } else {
        await runCalculation(unifiedResult.items || items, taxRate, taxType, taxMode, discountType, discountValue);
      }

      // Move directly to extraction view
      setCurrentStep('extraction');
    } catch (error: any) {
      console.error('Extraction error:', error);
      setErrorMessage(error?.message || 'Could not analyze requirement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Customer data updates
  const handleUpdateCustomer = (field: string, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
  };

  // Line item modifications
  const handleUpdateQuantity = (id: string, qty: number) => {
    const updated = items.map((it) => {
      if (it.id === id) {
        const newQty = Math.max(1, qty);
        return {
          ...it,
          quantity: newQty,
          amount: newQty * it.unit_price,
        };
      }
      return it;
    });
    setItems(updated);
    runCalculation(updated);
  };

  const handleUpdateUnitPrice = (id: string, price: number) => {
    const updated = items.map((it) => {
      if (it.id === id) {
        const newPrice = Math.max(0, price);
        return {
          ...it,
          unit_price: newPrice,
          amount: it.quantity * newPrice,
          price_found: newPrice > 0,
        };
      }
      return it;
    });
    setItems(updated);
    runCalculation(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    runCalculation(updated);
  };

  const handleAddItem = (newItem: Partial<InvoiceItem>) => {
    const item: InvoiceItem = {
      id: newItem.id || `item-${Date.now()}`,
      service: newItem.service || 'Custom Service',
      matched_catalog_id: newItem.matched_catalog_id,
      matched_service_name: newItem.matched_service_name,
      category: newItem.category,
      quantity: newItem.quantity || 1,
      unit_price: newItem.unit_price || 0,
      amount: (newItem.quantity || 1) * (newItem.unit_price || 0),
      price_found: Boolean(newItem.unit_price && newItem.unit_price > 0),
      match_confidence: newItem.match_confidence || 'manual',
    };
    const updated = [...items, item];
    setItems(updated);
    runCalculation(updated);
  };

  // Missing price resolutions
  const handleSetManualPrice = (itemId: string, unitPrice: number, notes?: string) => {
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          unit_price: unitPrice,
          amount: it.quantity * unitPrice,
          price_found: true,
          match_confidence: 'manual' as const,
          notes: notes || it.notes,
        };
      }
      return it;
    });
    setItems(updated);
    runCalculation(updated);
  };

  const handleMapToCatalog = (itemId: string, catalogItem: CatalogItem) => {
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          matched_catalog_id: catalogItem.service_id,
          matched_service_name: catalogItem.service_name,
          category: catalogItem.category,
          unit_price: catalogItem.unit_price,
          amount: it.quantity * catalogItem.unit_price,
          price_found: true,
          match_confidence: 'manual' as const,
        };
      }
      return it;
    });
    setItems(updated);
    runCalculation(updated);
  };

  // Tax and discount adjustments
  const handleSelectTaxType = (type: TaxOptionType, explicitRate?: number) => {
    setTaxType(type);
    let resolvedRate = taxRate;
    if (type === 'none') {
      resolvedRate = 0;
    } else if (type === 'gst_18') {
      resolvedRate = 18;
    } else if (type === 'gst_5') {
      resolvedRate = 5;
    } else if (type === 'custom') {
      resolvedRate = explicitRate !== undefined ? explicitRate : customTaxRate;
    }
    setTaxRate(resolvedRate);
    runCalculation(items, resolvedRate, type, taxMode, discountType, discountValue);
  };

  const handleUpdateCustomRate = (rate: number) => {
    setCustomTaxRate(rate);
    setTaxType('custom');
    setTaxRate(rate);
    runCalculation(items, rate, 'custom', taxMode, discountType, discountValue);
  };

  const handleUpdateTaxRate = (rate: number) => {
    setTaxRate(rate);
    const resolvedType: TaxOptionType =
      rate === 0 ? 'none' : rate === 18 ? 'gst_18' : rate === 5 ? 'gst_5' : 'custom';
    setTaxType(resolvedType);
    if (resolvedType === 'custom') {
      setCustomTaxRate(rate);
    }
    runCalculation(items, rate, resolvedType, taxMode, discountType, discountValue);
  };

  const handleUpdateTaxMode = (mode: 'intra_state' | 'inter_state') => {
    setTaxMode(mode);
    runCalculation(items, taxRate, taxType, mode, discountType, discountValue);
  };

  const handleUpdateDiscount = (type: 'percentage' | 'fixed', value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
    runCalculation(items, taxRate, taxType, taxMode, type, value);
  };

  // Approval step
  const handleApprove = async (checklist: any) => {
    setIsApproving(true);
    try {
      const payload: Partial<StoredInvoice> = {
        invoice_number: invoiceNumber,
        status: 'APPROVED',
        customer: {
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          company: customerData.company || null,
        },
        items: items,
        subtotal: calculation.subtotal,
        tax_rate: calculation.tax_rate,
        tax_mode: taxMode,
        tax_amount: calculation.tax_amount,
        cgst_rate: calculation.cgst_rate,
        cgst_amount: calculation.cgst_amount,
        sgst_rate: calculation.sgst_rate,
        sgst_amount: calculation.sgst_amount,
        igst_rate: calculation.igst_rate,
        igst_amount: calculation.igst_amount,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: calculation.discount_amount,
        taxable_amount: calculation.taxable_amount,
        total: calculation.total,
        notes: customerData.notes || null,
        raw_request_message: rawMessage,
        verification_checklist: checklist,
      };

      const result = await approveInvoice(payload);
      setApprovedInvoice(result.invoice);
      setCurrentStep('approved');
    } catch (err: any) {
      console.error('Approval failed:', err);
      setErrorMessage(err?.message || 'Failed to approve invoice.');
    } finally {
      setIsApproving(false);
    }
  };

  // Reset to create another invoice
  const handleReset = () => {
    setCurrentStep('input');
    setRawMessage('');
    setExtraction(null);
    setCustomerData({ name: '', email: '', phone: '', company: '', notes: '' });
    setItems([]);
    setDiscountValue(0);
    setApprovedInvoice(null);
    setErrorMessage(null);
    fetch('/api/next-invoice-number')
      .then((res) => res.json())
      .then((data) => {
        if (data.next_invoice_number) setInvoiceNumber(data.next_invoice_number);
      })
      .catch(() => {});
  };

  const unpricedItems = items.filter((it) => !it.price_found || it.unit_price === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Pipeline Navigation / Step Indicator */}
      <PipelineFlow currentStep={currentStep} hasUnpricedItems={unpricedItems.length > 0} />

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-900 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SCREEN 1: Customer Message Input */}
      {currentStep === 'input' && (
        <MessageInput onAnalyze={handleAnalyzeMessage} isLoading={isLoading} />
      )}

      {/* SCREEN 2 & 3: Extraction & Price Verification & Builder */}
      {(currentStep === 'extraction' || currentStep === 'builder') && (
        <div className="space-y-6">
          {extraction && (
            <ExtractionCard
              extraction={extraction}
              customerData={customerData}
              onUpdateCustomer={handleUpdateCustomer}
              items={items}
              onProceedToPricing={() => setCurrentStep('builder')}
            />
          )}

          {/* Missing Price Alert (Section 10 Key Feature!) */}
          <MissingPriceAlert
            unpricedItems={unpricedItems}
            catalog={catalog}
            onSetManualPrice={handleSetManualPrice}
            onMapToCatalog={handleMapToCatalog}
            onRemoveItem={handleRemoveItem}
          />

          {/* Verified Line Items Table */}
          <LineItemsTable
            items={items}
            catalog={catalog}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateUnitPrice={handleUpdateUnitPrice}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
          />

          {/* Tax Configuration Section (None, GST 18%, GST 5%, Custom) */}
          <TaxConfigurationSection
            taxType={taxType}
            taxRate={taxRate}
            customRateValue={customTaxRate}
            taxMode={taxMode}
            subtotal={calculation.subtotal}
            discountAmount={calculation.discount_amount}
            taxAmount={calculation.tax_amount}
            cgstAmount={calculation.cgst_amount}
            sgstAmount={calculation.sgst_amount}
            cgstRate={calculation.cgst_rate}
            sgstRate={calculation.sgst_rate}
            onSelectTaxType={handleSelectTaxType}
            onUpdateCustomRate={handleUpdateCustomRate}
            onUpdateTaxMode={handleUpdateTaxMode}
          />

          {/* Authentic Invoice Preview */}
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            createdDate={new Date().toISOString()}
            status="DRAFT"
            customer={customerData}
            items={items}
            calculation={calculation}
            taxRate={taxRate}
            taxType={taxType}
            taxMode={taxMode}
            discountType={discountType}
            discountValue={discountValue}
            notes={customerData.notes}
            onUpdateTaxRate={handleUpdateTaxRate}
            onSelectTaxType={handleSelectTaxType}
            onUpdateTaxMode={handleUpdateTaxMode}
            onUpdateDiscount={handleUpdateDiscount}
            onProceedToReview={() => setCurrentStep('review')}
            onBackToEdit={() => setCurrentStep('extraction')}
          />
        </div>
      )}

      {/* SCREEN 4: Review Before Approval (Section 12) */}
      {currentStep === 'review' && (
        <ReviewPanel
          customer={customerData}
          items={items}
          calculation={calculation}
          invoiceNumber={invoiceNumber}
          isApproving={isApproving}
          onApprove={handleApprove}
          onBackToEdit={() => setCurrentStep('builder')}
        />
      )}

      {/* SCREEN 5: Approved Invoice (Section 13) */}
      {currentStep === 'approved' && approvedInvoice && (
        <div className="space-y-8">
          <ApprovalSuccess
            invoice={approvedInvoice}
            onCreateNew={handleReset}
            onViewDashboard={onViewDashboard}
          />

          {/* Final Approved Printable Invoice view */}
          <div className="pt-4 border-t border-slate-200 print:border-none print:pt-0">
            <h3 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 no-print">
              Final Authorized Record
            </h3>
            <InvoicePreview
              invoiceNumber={approvedInvoice.invoice_number}
              createdDate={approvedInvoice.created_at}
              status="APPROVED"
              customer={approvedInvoice.customer}
              items={approvedInvoice.items}
              calculation={{
                subtotal: approvedInvoice.subtotal,
                discount_type: approvedInvoice.discount_type,
                discount_value: approvedInvoice.discount_value,
                discount_amount: approvedInvoice.discount_amount,
                taxable_amount: approvedInvoice.taxable_amount,
                tax_rate: approvedInvoice.tax_rate,
                tax_mode: approvedInvoice.tax_mode,
                tax_amount: approvedInvoice.tax_amount,
                cgst_rate: approvedInvoice.cgst_rate,
                cgst_amount: approvedInvoice.cgst_amount,
                sgst_rate: approvedInvoice.sgst_rate,
                sgst_amount: approvedInvoice.sgst_amount,
                igst_rate: approvedInvoice.igst_rate,
                igst_amount: approvedInvoice.igst_amount,
                total: approvedInvoice.total,
                has_unpriced_items: false,
                unpriced_count: 0,
              }}
              taxRate={approvedInvoice.tax_rate}
              taxMode={approvedInvoice.tax_mode}
              discountType={approvedInvoice.discount_type}
              discountValue={approvedInvoice.discount_value}
              notes={approvedInvoice.notes}
              onUpdateTaxRate={() => {}}
              onUpdateTaxMode={() => {}}
              onUpdateDiscount={() => {}}
              onProceedToReview={() => {}}
              onBackToEdit={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};
