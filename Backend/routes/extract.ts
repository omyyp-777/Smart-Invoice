import { Router, Request, Response } from 'express';
import { extractCustomerRequirement } from '../services/aiExtractor.js';
import { resolveAllPrices } from '../services/priceResolver.js';
import { calculateInvoice } from '../services/invoiceCalculator.js';

export const extractRouter = Router();

extractRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      message,
      tax_rate = 18,
      tax_type,
      tax_mode = 'intra_state',
      discount_type = 'fixed',
      discount_value = 0,
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Please provide a non-empty customer message to analyze.' });
      return;
    }

    // 1. High-speed extraction (strictly capped at 1.2s or instant rule-fallback)
    const extraction = await extractCustomerRequirement(message);

    // 2. Instant in-memory price resolution (< 0.1ms)
    const resolvedItems = resolveAllPrices(extraction.services);
    const unpricedItems = resolvedItems.filter((i) => !i.price_found);

    // 3. Instant deterministic calculation (< 0.1ms)
    const calculation = calculateInvoice({
      items: resolvedItems,
      tax_rate,
      tax_type,
      tax_mode,
      discount_type,
      discount_value,
    });

    // Return unified payload for single round-trip speed
    res.json({
      ...extraction,
      extraction,
      items: resolvedItems,
      all_prices_found: unpricedItems.length === 0,
      missing_count: unpricedItems.length,
      missing_items: unpricedItems,
      calculation,
    });
  } catch (error: any) {
    console.error('Error during extraction route:', error);
    res.status(500).json({
      error: 'Failed to extract requirement from message.',
      details: error?.message || 'Unknown error',
    });
  }
});
