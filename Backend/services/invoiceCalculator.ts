export interface CalculationItemInput {
  id?: string;
  service: string;
  quantity: number;
  unit_price: number;
  price_found?: boolean;
}

export type TaxOptionType = 'none' | 'gst_18' | 'gst_5' | 'custom';

export interface CalculationRequest {
  items: CalculationItemInput[];
  tax_rate?: number; // e.g. 0, 5, 18, or custom %
  tax_type?: TaxOptionType | string;
  tax_mode?: 'intra_state' | 'inter_state'; // intra: CGST + SGST, inter: IGST
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number; // e.g. 500 fixed or 10 for 10%
}

export interface CalculationResult {
  items: Array<CalculationItemInput & { amount: number }>;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  tax_type: TaxOptionType;
  tax_rate: number;
  tax_mode: 'intra_state' | 'inter_state';
  tax_amount: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  total: number;
  has_unpriced_items: boolean;
  unpriced_count: number;
}

/**
 * Pure Deterministic Calculation Engine
 * Eliminates LLM arithmetic hallucinations completely.
 * Correctly applies tax configurations: None (0%), GST 18%, GST 5%, or Custom.
 */
export function calculateInvoice(params: CalculationRequest): CalculationResult {
  const {
    items = [],
    tax_mode = 'intra_state',
    discount_type = 'fixed',
    discount_value = 0,
  } = params;

  // Resolve tax type and safe rate
  let taxType: TaxOptionType = 'gst_18';
  let safeTaxRate = 18;

  if (params.tax_type === 'none') {
    taxType = 'none';
    safeTaxRate = 0;
  } else if (params.tax_type === 'gst_18') {
    taxType = 'gst_18';
    safeTaxRate = 18;
  } else if (params.tax_type === 'gst_5') {
    taxType = 'gst_5';
    safeTaxRate = 5;
  } else if (params.tax_type === 'custom') {
    taxType = 'custom';
    safeTaxRate = Math.max(0, Number(params.tax_rate) || 0);
  } else if (typeof params.tax_rate === 'number') {
    if (params.tax_rate === 0) {
      taxType = 'none';
      safeTaxRate = 0;
    } else if (params.tax_rate === 18) {
      taxType = 'gst_18';
      safeTaxRate = 18;
    } else if (params.tax_rate === 5) {
      taxType = 'gst_5';
      safeTaxRate = 5;
    } else {
      taxType = 'custom';
      safeTaxRate = Math.max(0, params.tax_rate);
    }
  }

  let subtotal = 0;
  let unpricedCount = 0;

  const calculatedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unit_price) || 0);
    const amount = Math.round(qty * unitPrice * 100) / 100;
    subtotal += amount;

    if (item.price_found === false || unitPrice === 0) {
      unpricedCount++;
    }

    return {
      ...item,
      quantity: qty,
      unit_price: unitPrice,
      amount,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;

  // Calculate discount
  let discountAmount = 0;
  const rawDiscount = Math.max(0, Number(discount_value) || 0);
  if (discount_type === 'percentage') {
    discountAmount = Math.round((subtotal * (Math.min(100, rawDiscount) / 100)) * 100) / 100;
  } else {
    discountAmount = Math.min(subtotal, Math.round(rawDiscount * 100) / 100);
  }

  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  // Calculate tax strictly on taxable amount (subtotal - discount)
  const taxAmount = safeTaxRate > 0
    ? Math.round((taxableAmount * (safeTaxRate / 100)) * 100) / 100
    : 0;

  // CGST / SGST vs IGST
  let cgstRate: number | undefined;
  let cgstAmount: number | undefined;
  let sgstRate: number | undefined;
  let sgstAmount: number | undefined;
  let igstRate: number | undefined;
  let igstAmount: number | undefined;

  if (safeTaxRate > 0) {
    if (tax_mode === 'intra_state') {
      cgstRate = Math.round((safeTaxRate / 2) * 100) / 100;
      sgstRate = Math.round((safeTaxRate / 2) * 100) / 100;
      cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
      sgstAmount = Math.round((taxAmount - cgstAmount) * 100) / 100;
    } else {
      igstRate = safeTaxRate;
      igstAmount = taxAmount;
    }
  }

  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    items: calculatedItems,
    subtotal,
    discount_type,
    discount_value: rawDiscount,
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    tax_type: taxType,
    tax_rate: safeTaxRate,
    tax_mode,
    tax_amount: taxAmount,
    cgst_rate: cgstRate,
    cgst_amount: cgstAmount,
    sgst_rate: sgstRate,
    sgst_amount: sgstAmount,
    igst_rate: igstRate,
    igst_amount: igstAmount,
    total: grandTotal,
    has_unpriced_items: unpricedCount > 0,
    unpriced_count: unpricedCount,
  };
}
