import { Router, Request, Response } from 'express';
import { calculateInvoice, CalculationRequest } from '../services/invoiceCalculator.js';

export const invoiceRouter = Router();

export interface StoredInvoice {
  id: string; // e.g. INV-20260927-001
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
  items: Array<{
    id: string;
    service: string;
    matched_catalog_id?: string;
    quantity: number;
    unit_price: number;
    amount: number;
    price_found: boolean;
    notes?: string;
  }>;
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
  verification_checklist: {
    customer_info_verified: boolean;
    line_items_verified: boolean;
    prices_verified: boolean;
    calculations_verified: boolean;
  };
}

// In-memory persistent invoice store with initial demo data
let invoiceCounter = 4;
const invoicesStore: StoredInvoice[] = [
  {
    id: 'INV-20260926-001',
    invoice_number: 'INV-20260926-001',
    status: 'APPROVED',
    created_at: '2026-09-26T09:15:00.000Z',
    approved_at: '2026-09-26T09:20:00.000Z',
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      company: 'Apex Media India',
    },
    items: [
      {
        id: 'item-1',
        service: 'Logo Design',
        matched_catalog_id: 'S001',
        quantity: 2,
        unit_price: 1500,
        amount: 3000,
        price_found: true,
      },
      {
        id: 'item-2',
        service: 'Promotional Video',
        matched_catalog_id: 'S004',
        quantity: 1,
        unit_price: 5000,
        amount: 5000,
        price_found: true,
      },
    ],
    subtotal: 8000,
    tax_rate: 18,
    tax_mode: 'intra_state',
    tax_amount: 1440,
    cgst_rate: 9,
    cgst_amount: 720,
    sgst_rate: 9,
    sgst_amount: 720,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 8000,
    total: 9440,
    notes: 'Urgent delivery required within 3 business days.',
    verification_checklist: {
      customer_info_verified: true,
      line_items_verified: true,
      prices_verified: true,
      calculations_verified: true,
    },
  },
  {
    id: 'INV-20260926-002',
    invoice_number: 'INV-20260926-002',
    status: 'APPROVED',
    created_at: '2026-09-25T14:30:00.000Z',
    approved_at: '2026-09-25T14:45:00.000Z',
    customer: {
      name: 'Neha Patil',
      email: 'neha.patil@creatives.in',
      company: 'Patil Fashion Wear',
    },
    items: [
      {
        id: 'item-3',
        service: 'Poster Design',
        matched_catalog_id: 'S002',
        quantity: 4,
        unit_price: 800,
        amount: 3200,
        price_found: true,
      },
      {
        id: 'item-4',
        service: 'Brochure Design',
        matched_catalog_id: 'S009',
        quantity: 1,
        unit_price: 1200,
        amount: 1200,
        price_found: true,
      },
    ],
    subtotal: 4400,
    tax_rate: 18,
    tax_mode: 'intra_state',
    tax_amount: 792,
    cgst_rate: 9,
    cgst_amount: 396,
    sgst_rate: 9,
    sgst_amount: 396,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 4400,
    total: 5192,
    notes: 'Seasonal festive launch campaign collateral.',
    verification_checklist: {
      customer_info_verified: true,
      line_items_verified: true,
      prices_verified: true,
      calculations_verified: true,
    },
  },
  {
    id: 'INV-20260925-003',
    invoice_number: 'INV-20260925-003',
    status: 'APPROVED',
    created_at: '2026-09-25T11:10:00.000Z',
    approved_at: '2026-09-25T11:22:00.000Z',
    customer: {
      name: 'Acme Studio',
      email: 'finance@acmestudio.com',
      company: 'Acme Studio Global',
    },
    items: [
      {
        id: 'item-5',
        service: 'Website Development',
        matched_catalog_id: 'S005',
        quantity: 1,
        unit_price: 15000,
        amount: 15000,
        price_found: true,
      },
      {
        id: 'item-6',
        service: 'Product Photography',
        matched_catalog_id: 'S007',
        quantity: 1,
        unit_price: 3000,
        amount: 3000,
        price_found: true,
      },
    ],
    subtotal: 18000,
    tax_rate: 18,
    tax_mode: 'intra_state',
    tax_amount: 3240,
    cgst_rate: 9,
    cgst_amount: 1620,
    sgst_rate: 9,
    sgst_amount: 1620,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 18000,
    total: 21240,
    notes: 'Q3 Product portal rollout',
    verification_checklist: {
      customer_info_verified: true,
      line_items_verified: true,
      prices_verified: true,
      calculations_verified: true,
    },
  },
];

// Helper to generate sequential invoice number: INV-YYYYMMDD-00X
export function generateInvoiceNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const padIndex = String(invoiceCounter++).padStart(3, '0');
  return `INV-${yyyy}${mm}${dd}-${padIndex}`;
}

// POST /api/calculate
invoiceRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const calculationInput: CalculationRequest = req.body;
    const result = calculateInvoice(calculationInput);
    res.json(result);
  } catch (error: any) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Calculation failed', details: error?.message });
  }
});

// GET /api/invoices
invoiceRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    invoices: invoicesStore,
    total_count: invoicesStore.length,
    total_revenue: invoicesStore
      .filter((i) => i.status === 'APPROVED')
      .reduce((acc, curr) => acc + curr.total, 0),
    approved_count: invoicesStore.filter((i) => i.status === 'APPROVED').length,
    draft_count: invoicesStore.filter((i) => i.status === 'DRAFT').length,
  });
});

// GET /api/invoice/:id
invoiceRouter.get('/:id', (req: Request, res: Response) => {
  const inv = invoicesStore.find((i) => i.id === req.params.id);
  if (!inv) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }
  res.json(inv);
});

// POST /api/invoice/approve
invoiceRouter.post('/approve', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const invNumber = payload.invoice_number || generateInvoiceNumber();

    const finalizedInvoice: StoredInvoice = {
      id: invNumber,
      invoice_number: invNumber,
      status: 'APPROVED',
      created_at: payload.created_at || new Date().toISOString(),
      approved_at: new Date().toISOString(),
      customer: {
        name: payload.customer?.name || 'Valued Customer',
        email: payload.customer?.email || null,
        phone: payload.customer?.phone || null,
        company: payload.customer?.company || null,
        address: payload.customer?.address || null,
      },
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      tax_rate: payload.tax_rate ?? 18,
      tax_mode: payload.tax_mode || 'intra_state',
      tax_amount: payload.tax_amount || 0,
      cgst_rate: payload.cgst_rate,
      cgst_amount: payload.cgst_amount,
      sgst_rate: payload.sgst_rate,
      sgst_amount: payload.sgst_amount,
      igst_rate: payload.igst_rate,
      igst_amount: payload.igst_amount,
      discount_type: payload.discount_type || 'fixed',
      discount_value: payload.discount_value || 0,
      discount_amount: payload.discount_amount || 0,
      taxable_amount: payload.taxable_amount || payload.subtotal || 0,
      total: payload.total || 0,
      notes: payload.notes || null,
      raw_request_message: payload.raw_request_message || null,
      verification_checklist: payload.verification_checklist || {
        customer_info_verified: true,
        line_items_verified: true,
        prices_verified: true,
        calculations_verified: true,
      },
    };

    invoicesStore.unshift(finalizedInvoice);

    res.status(201).json({
      success: true,
      message: 'Invoice approved and stored successfully.',
      invoice: finalizedInvoice,
    });
  } catch (error: any) {
    console.error('Error approving invoice:', error);
    res.status(500).json({ error: 'Failed to approve invoice.', details: error?.message });
  }
});
