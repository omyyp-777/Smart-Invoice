export interface CatalogItem {
  service_id: string;
  service_name: string;
  category: string;
  unit_price: number;
  description: string;
}

export interface ExtractedService {
  name: string;
  quantity: number;
  notes?: string | null;
}

export interface ExtractionResult {
  customer_name: string | null;
  email: string | null;
  phone?: string | null;
  company?: string | null;
  services: ExtractedService[];
  notes: string | null;
  urgency?: 'normal' | 'urgent' | 'immediate';
  raw_message: string;
  source: 'gemini' | 'rule_fallback';
}

export interface InvoiceItem {
  id: string;
  service: string;
  matched_catalog_id?: string;
  matched_service_name?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  price_found: boolean;
  match_confidence?: 'exact' | 'normalized' | 'manual' | 'not_found';
  notes?: string;
}

export type TaxOptionType = 'none' | 'gst_18' | 'gst_5' | 'custom';

export interface InvoiceCalculation {
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  tax_type?: TaxOptionType;
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

export interface StoredInvoice {
  id: string;
  invoice_number: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT';
  created_at: string;
  approved_at?: string;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    address?: string | null;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_mode: 'intra_state' | 'inter_state';
  tax_amount: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  total: number;
  notes?: string | null;
  raw_request_message?: string;
  verification_checklist?: {
    customer_info_verified: boolean;
    line_items_verified: boolean;
    prices_verified: boolean;
    calculations_verified: boolean;
  };
}

export type StepState = 'input' | 'extraction' | 'builder' | 'review' | 'approved';
