import express, { Router } from 'express';
import { extractRouter } from './routes/extract.js';
import { pricingRouter } from './routes/pricing.js';
import { invoiceRouter, generateInvoiceNumber } from './routes/invoice.js';

export const backendApi = Router();

backendApi.use(express.json());

// Mount Backend routes
backendApi.use('/extract', extractRouter);
backendApi.use('/pricing', pricingRouter);
backendApi.use('/invoice', invoiceRouter);
backendApi.use('/invoices', invoiceRouter);
backendApi.use('/calculate', (req, res) => {
  // Direct shortcut for POST /api/calculate
  invoiceRouter(req, res, () => {});
});

// Utility route to fetch next invoice number
backendApi.get('/next-invoice-number', (_req, res) => {
  res.json({ next_invoice_number: generateInvoiceNumber() });
});

// Health check
backendApi.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'InvoiceAI Backend',
    timestamp: new Date().toISOString(),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
  });
});
