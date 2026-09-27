import {
  CatalogItem,
  ExtractionResult,
  InvoiceCalculation,
  InvoiceItem,
  StoredInvoice,
  TaxOptionType,
} from '../types/index.js';

export interface UnifiedAnalysisResult extends ExtractionResult {
  extraction?: ExtractionResult;
  items?: InvoiceItem[];
  all_prices_found?: boolean;
  missing_count?: number;
  missing_items?: InvoiceItem[];
  calculation?: InvoiceCalculation;
}

export async function extractCustomerRequirement(
  message: string,
  options?: {
    tax_rate?: number;
    tax_mode?: 'intra_state' | 'inter_state';
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
  }
): Promise<UnifiedAnalysisResult> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...options }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to extract customer requirement.');
  }

  return res.json();
}

export async function resolvePrices(
  services: Array<{ name: string; quantity: number; notes?: string | null }>
): Promise<{
  items: InvoiceItem[];
  all_prices_found: boolean;
  missing_count: number;
  missing_items: InvoiceItem[];
}> {
  const res = await fetch('/api/pricing/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ services }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to resolve prices against catalog.');
  }

  return res.json();
}

export async function calculateInvoice(params: {
  items: Array<{ service: string; quantity: number; unit_price: number; price_found?: boolean }>;
  tax_rate?: number;
  tax_type?: TaxOptionType;
  tax_mode?: 'intra_state' | 'inter_state';
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
}): Promise<InvoiceCalculation> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to calculate invoice amounts.');
  }

  return res.json();
}

export async function approveInvoice(payload: Partial<StoredInvoice>): Promise<{
  success: boolean;
  invoice: StoredInvoice;
}> {
  const res = await fetch('/api/invoice/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to approve invoice.');
  }

  return res.json();
}

export async function fetchPricingCatalog(): Promise<{
  catalog: CatalogItem[];
  total_items: number;
}> {
  const res = await fetch('/api/pricing');
  if (!res.ok) {
    throw new Error('Failed to fetch pricing catalog.');
  }
  return res.json();
}

export async function fetchInvoices(): Promise<{
  invoices: StoredInvoice[];
  total_count: number;
  total_revenue: number;
  approved_count: number;
  draft_count: number;
}> {
  const res = await fetch('/api/invoices');
  if (!res.ok) {
    throw new Error('Failed to fetch invoice history.');
  }
  return res.json();
}
