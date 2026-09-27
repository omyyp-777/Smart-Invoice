import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceCalculation, InvoiceItem, StoredInvoice } from '../types/index.js';

export interface PDFInvoiceData {
  invoiceNumber: string;
  createdDate: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT';
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  };
  items: InvoiceItem[];
  calculation?: InvoiceCalculation;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  taxMode?: 'intra_state' | 'inter_state';
  cgstAmount?: number;
  sgstAmount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  total?: number;
  notes?: string | null;
}

function formatPdfCurrency(amount: number): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  return 'Rs. ' + rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPdfDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isStoredInvoice(data: PDFInvoiceData | StoredInvoice): data is StoredInvoice {
  return 'invoice_number' in data && 'created_at' in data;
}

/**
 * Generates and downloads a clean, professional, print-ready PDF invoice.
 */
export function generateInvoicePDF(data: PDFInvoiceData | StoredInvoice): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isStored = isStoredInvoice(data);
    const invoiceNum = isStored ? data.invoice_number : data.invoiceNumber;
    const createdDate = isStored ? data.created_at : data.createdDate;
    const status = data.status || 'APPROVED';
    const customer = data.customer || { name: 'Valued Customer' };
    const items = data.items || [];
    const notes = data.notes;

    const subtotal = isStored
      ? data.subtotal
      : (data.calculation ? data.calculation.subtotal : (data.subtotal ?? 0));
    const taxRate = isStored
      ? data.tax_rate
      : (data.calculation ? data.calculation.tax_rate : (data.taxRate ?? 0));
    const taxAmount = isStored
      ? data.tax_amount
      : (data.calculation ? data.calculation.tax_amount : (data.taxAmount ?? 0));
    const taxMode = isStored
      ? data.tax_mode
      : (data.calculation ? data.calculation.tax_mode : (data.taxMode ?? 'intra_state'));
    const cgstAmount = isStored
      ? (data.cgst_amount ?? 0)
      : (data.calculation ? (data.calculation.cgst_amount ?? 0) : (data.cgstAmount ?? 0));
    const sgstAmount = isStored
      ? (data.sgst_amount ?? 0)
      : (data.calculation ? (data.calculation.sgst_amount ?? 0) : (data.sgstAmount ?? 0));
    const discountAmount = isStored
      ? data.discount_amount
      : (data.calculation ? data.calculation.discount_amount : (data.discountAmount ?? 0));
    const total = isStored
      ? data.total
      : (data.calculation ? data.calculation.total : (data.total ?? (subtotal - discountAmount + taxAmount)));

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 14;

    // 1. Brand Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Logo icon / initial
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(margin, 5, 18, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('IA', margin + 9, 16.5, { align: 'center' });

    // Company Name
    doc.setFontSize(16);
    doc.text('INVOICEAI', margin + 22, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Smart AI Invoice Automation & Verification System', margin + 22, 19);

    // Invoice Number & Status on Top Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(invoiceNum, pageWidth - margin, 12, { align: 'right' });

    // Status Pill
    const statusText = status === 'APPROVED' ? 'STATUS: APPROVED' : 'STATUS: DRAFT';
    doc.setFontSize(8);
    if (status === 'APPROVED') {
      doc.setFillColor(16, 185, 129); // emerald-500
    } else {
      doc.setFillColor(245, 158, 11); // amber-500
    }
    const pillWidth = 32;
    doc.roundedRect(pageWidth - margin - pillWidth, 15, pillWidth, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth - margin - (pillWidth / 2), 19.2, { align: 'center' });

    // 2. Company & Billing Info Section (Vertical Manner)
    let currentY = 34;

    // Vertical Section 1: Bill To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('BILLED TO', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(customer.name || 'Valued Customer', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600

    if (customer.company) {
      doc.text(`Company: ${customer.company}`, margin, currentY);
      currentY += 4;
    }
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, margin, currentY);
      currentY += 4;
    }
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, margin, currentY);
      currentY += 4;
    }

    currentY += 3;

    // Vertical Section 2: Invoice Metadata & Terms (Stacked Vertically)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('INVOICE DETAILS & PAYMENT TERMS', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Invoice Reference: ${invoiceNum}  |  Issue Date: ${formatPdfDate(createdDate)}  |  Payment Terms: Due upon receipt`, margin, currentY);

    currentY += 4;
    doc.text('GSTIN: 07AAAAA0000A1Z5  |  Payment Mode: UPI / NEFT / IMPS / Corporate Wire', margin, currentY);

    currentY += 6;

    // Divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // 3. Line Items AutoTable
    const tableBody = items.map((it, idx) => [
      String(idx + 1),
      it.matched_service_name && it.matched_service_name !== it.service
        ? `${it.service}\n(Catalog: ${it.matched_service_name})`
        : it.service,
      String(it.quantity),
      formatPdfCurrency(it.unit_price),
      formatPdfCurrency(it.amount),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Item Description', 'Qty', 'Unit Rate', 'Amount']],
      body: tableBody,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: 3,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
    let summaryY = finalY + 6;

    // 4. Notes on Left, Totals on Right
    if (notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Notes / Instructions:', margin, summaryY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(notes, 85);
      doc.text(splitNotes, margin, summaryY + 4);
    }

    // Right Summary Box
    const summaryX = pageWidth - margin - 75;
    const summaryRight = pageWidth - margin;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    // Subtotal
    doc.text('Subtotal:', summaryX, summaryY);
    doc.text(formatPdfCurrency(subtotal), summaryRight, summaryY, { align: 'right' });
    summaryY += 4.5;

    // Discount
    if (discountAmount > 0) {
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text('Discount Applied:', summaryX, summaryY);
      doc.text(`-${formatPdfCurrency(discountAmount)}`, summaryRight, summaryY, { align: 'right' });
      doc.setTextColor(71, 85, 105);
      summaryY += 4.5;
    }

    // GST Taxes
    if (taxRate > 0) {
      if (taxMode === 'intra_state') {
        const halfRate = taxRate / 2;
        doc.text(`CGST (${halfRate}%):`, summaryX, summaryY);
        doc.text(formatPdfCurrency(cgstAmount || 0), summaryRight, summaryY, { align: 'right' });
        summaryY += 4.5;

        doc.text(`SGST (${halfRate}%):`, summaryX, summaryY);
        doc.text(formatPdfCurrency(sgstAmount || 0), summaryRight, summaryY, { align: 'right' });
        summaryY += 4.5;
      } else {
        doc.text(`IGST (${taxRate}%):`, summaryX, summaryY);
        doc.text(formatPdfCurrency(taxAmount), summaryRight, summaryY, { align: 'right' });
        summaryY += 4.5;
      }
    }

    // Divider for Total
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(summaryX, summaryY, summaryRight, summaryY);
    summaryY += 5;

    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL DUE:', summaryX, summaryY);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(formatPdfCurrency(total), summaryRight, summaryY, { align: 'right' });

    // 5. Official Verification Stamp / Compliance Footer
    const footerY = 278; // A4 height is 297mm

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('VERIFIED ARITHMETIC & CATALOG PRICING COMPLIANCE', margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'This invoice is deterministically calculated. No pricing hallucinations. Generated via InvoiceAI.',
      margin,
      footerY + 3.5
    );

    doc.text(
      `Generated on ${new Date().toLocaleString('en-IN')}`,
      pageWidth - margin,
      footerY + 3.5,
      { align: 'right' }
    );

    // Save & Trigger Direct File Download
    const cleanFilename = `${invoiceNum.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Standard blob-based download with anchor element (safe in sandboxed iframes)
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 200);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
