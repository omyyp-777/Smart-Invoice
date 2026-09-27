import { StoredInvoice } from '../types/index.js';
import { formatCurrency } from './currency.js';

export interface WhatsAppShareData {
  invoice_number: string;
  total: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  customer?: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
  };
  items?: Array<{ service: string; quantity: number; amount: number }>;
  notes?: string | null;
}

/**
 * Generates the pre-filled WhatsApp message containing the Invoice ID and Total Amount
 */
export function generateWhatsAppMessage(invoice: WhatsAppShareData | StoredInvoice): string {
  const customerName = invoice.customer?.name || 'Valued Customer';
  const invoiceId = invoice.invoice_number;
  const totalAmount = formatCurrency(invoice.total);

  const lines = [
    `Hi ${customerName},`,
    '',
    `Your approved invoice is ready:`,
    `*Invoice ID:* ${invoiceId}`,
    `*Total Amount:* ${totalAmount}`,
    `*Status:* APPROVED ✓`,
    '',
    invoice.items && invoice.items.length > 0 ? '*Line Items:*' : null,
    ...(invoice.items || []).map(
      (it, idx) => `${idx + 1}. ${it.service} × ${it.quantity} — ${formatCurrency(it.amount)}`
    ),
    invoice.items && invoice.items.length > 0 ? '' : null,
    invoice.subtotal ? `Subtotal: ${formatCurrency(invoice.subtotal)}` : null,
    invoice.tax_rate ? `GST (${invoice.tax_rate}%): ${formatCurrency(invoice.tax_amount || 0)}` : null,
    invoice.discount_amount && invoice.discount_amount > 0
      ? `Discount: -${formatCurrency(invoice.discount_amount)}`
      : null,
    `*Total Due: ${totalAmount}*`,
    '',
    invoice.notes ? `Notes: ${invoice.notes}` : null,
    '',
    'Thank you for your business! Please let us know if you have any questions.',
  ].filter((l): l is string => l !== null);

  return lines.join('\n');
}

/**
 * Generates the pre-filled WhatsApp link with the Invoice ID and Total Amount
 */
export function getWhatsAppUrl(invoice: WhatsAppShareData | StoredInvoice): string {
  const text = encodeURIComponent(generateWhatsAppMessage(invoice));
  const rawPhone = invoice.customer?.phone || '';
  const phone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';
  return phone.length >= 7 ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

/**
 * Opens WhatsApp click-to-chat with the pre-filled invoice message
 */
export function openWhatsAppShare(invoice: WhatsAppShareData | StoredInvoice) {
  const url = getWhatsAppUrl(invoice);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function triggerPrintPdf() {
  window.print();
}

/**
 * Generates a unique sharable invoice URL pointing directly to this invoice record
 */
export function getSharableInvoiceUrl(invoiceNumber: string): string {
  if (typeof window === 'undefined') {
    return `https://invoiceai.app/?invoice=${encodeURIComponent(invoiceNumber)}`;
  }
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('invoice', invoiceNumber);
  return url.toString();
}

/**
 * Copies the unique sharable invoice URL to the system clipboard using the Web Clipboard API
 * with automatic fallback if clipboard access is constrained.
 */
export async function copyInvoiceLinkToClipboard(invoiceNumber: string): Promise<{ success: boolean; url: string }> {
  const url = getSharableInvoiceUrl(invoiceNumber);

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch (err) {
      console.warn('Web Clipboard API writeText failed, trying fallback:', err);
    }
  }

  // Fallback for browsers / iframes restricting async clipboard
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: successful, url };
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return { success: false, url };
  }
}
