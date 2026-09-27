import { Router, Request, Response } from 'express';
import { getPricingCatalog, resolveAllPrices, resolveServicePrice } from '../services/priceResolver.js';

export const pricingRouter = Router();

// GET /api/pricing -> Returns the approved pricing catalog
pricingRouter.get('/', (_req: Request, res: Response) => {
  try {
    const catalog = getPricingCatalog();
    res.json({
      catalog,
      total_items: catalog.length,
      last_updated: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve pricing catalog.' });
  }
});

// POST /api/resolve-prices -> Deterministic matching against pricing.csv
pricingRouter.post('/resolve', (req: Request, res: Response) => {
  try {
    const { services } = req.body;
    if (!services || !Array.isArray(services)) {
      res.status(400).json({ error: 'Expected an array of services with { name, quantity }.' });
      return;
    }

    const resolvedItems = resolveAllPrices(services);
    const unpricedItems = resolvedItems.filter((i) => !i.price_found);

    res.json({
      items: resolvedItems,
      all_prices_found: unpricedItems.length === 0,
      missing_count: unpricedItems.length,
      missing_items: unpricedItems,
    });
  } catch (error: any) {
    console.error('Error resolving prices:', error);
    res.status(500).json({ error: 'Failed to resolve prices against catalog.' });
  }
});

// POST /api/resolve-single
pricingRouter.post('/resolve-single', (req: Request, res: Response) => {
  try {
    const { service_name, quantity = 1 } = req.body;
    if (!service_name) {
      res.status(400).json({ error: 'service_name is required.' });
      return;
    }
    const resolved = resolveServicePrice(service_name, quantity);
    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve single service price.' });
  }
});
