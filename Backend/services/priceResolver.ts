import fs from 'fs';
import path from 'path';

export interface CatalogItem {
  service_id: string;
  service_name: string;
  category: string;
  unit_price: number;
  description: string;
}

export interface ResolvedServiceItem {
  id: string;
  service: string;
  matched_catalog_id?: string;
  matched_service_name?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  price_found: boolean;
  match_confidence: 'exact' | 'normalized' | 'manual' | 'not_found';
  notes?: string;
}

const PRICING_CSV_PATH = path.resolve(process.cwd(), 'Backend/data/pricing.csv');

let cachedCatalog: CatalogItem[] | null = null;

export function loadPricingCatalog(): CatalogItem[] {
  try {
    const csvContent = fs.readFileSync(PRICING_CSV_PATH, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const items: CatalogItem[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split supporting commas without quotes
      const parts = line.split(',');
      if (parts.length >= 4) {
        items.push({
          service_id: parts[0].trim(),
          service_name: parts[1].trim(),
          category: parts[2].trim(),
          unit_price: parseFloat(parts[3].trim()) || 0,
          description: parts.slice(4).join(',').trim() || '',
        });
      }
    }
    cachedCatalog = items;
    return items;
  } catch (err) {
    console.error('Failed to load pricing.csv:', err);
    return cachedCatalog || [];
  }
}

export function getPricingCatalog(): CatalogItem[] {
  if (!cachedCatalog) {
    return loadPricingCatalog();
  }
  return cachedCatalog;
}

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministic Price Resolver
 * Matches extracted service names strictly against approved catalog items.
 * If no confident match is found, marks price_found = false so human review is triggered.
 */
export function resolveServicePrice(rawServiceName: string, quantity: number = 1): ResolvedServiceItem {
  const catalog = getPricingCatalog();
  const rawClean = cleanString(rawServiceName);
  const qty = Math.max(1, Number(quantity) || 1);

  // 1. Direct exact match (case insensitive)
  for (const item of catalog) {
    if (cleanString(item.service_name) === rawClean) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        service: rawServiceName,
        matched_catalog_id: item.service_id,
        matched_service_name: item.service_name,
        category: item.category,
        quantity: qty,
        unit_price: item.unit_price,
        amount: qty * item.unit_price,
        price_found: true,
        match_confidence: 'exact',
      };
    }
  }

  // 2. Normalized aliases and keyword containment
  // Map common synonyms to exact catalog items
  const aliasMap: Record<string, string> = {
    'logo': 'Logo Design',
    'logos': 'Logo Design',
    'logo design': 'Logo Design',
    'poster': 'Poster Design',
    'posters': 'Poster Design',
    'social media': 'Social Media Post',
    'social media post': 'Social Media Post',
    'social media posts': 'Social Media Post',
    'social post': 'Social Media Post',
    'promo video': 'Promotional Video',
    'promotional video': 'Promotional Video',
    'promo': 'Promotional Video',
    'website': 'Website Development',
    'web development': 'Website Development',
    'website development': 'Website Development',
    'site': 'Website Development',
    'landing page': 'Landing Page',
    'landing pages': 'Landing Page',
    'product photo': 'Product Photography',
    'product photography': 'Product Photography',
    'product photos': 'Product Photography',
    'photoshoot': 'Product Photography',
    'video edit': 'Video Editing',
    'video editing': 'Video Editing',
    'brochure': 'Brochure Design',
    'brochures': 'Brochure Design',
    'brochure design': 'Brochure Design',
    'social management': 'Social Media Management',
    'social media management': 'Social Media Management',
    'smm': 'Social Media Management',
  };

  if (aliasMap[rawClean]) {
    const targetName = aliasMap[rawClean];
    const match = catalog.find((c) => cleanString(c.service_name) === cleanString(targetName));
    if (match) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        service: rawServiceName,
        matched_catalog_id: match.service_id,
        matched_service_name: match.service_name,
        category: match.category,
        quantity: qty,
        unit_price: match.unit_price,
        amount: qty * match.unit_price,
        price_found: true,
        match_confidence: 'normalized',
      };
    }
  }

  // 3. Substring word intersection check
  const rawWords = rawClean.split(' ').filter((w) => w.length > 2);
  let bestMatch: CatalogItem | null = null;
  let highestScore = 0;

  for (const item of catalog) {
    const itemWords = cleanString(item.service_name).split(' ');
    let score = 0;
    for (const rw of rawWords) {
      if (itemWords.includes(rw)) score++;
      else if (itemWords.some((iw) => iw.startsWith(rw) || rw.startsWith(iw))) score += 0.6;
    }
    if (score > highestScore && score >= 1) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 1) {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      service: rawServiceName,
      matched_catalog_id: bestMatch.service_id,
      matched_service_name: bestMatch.service_name,
      category: bestMatch.category,
      quantity: qty,
      unit_price: bestMatch.unit_price,
      amount: qty * bestMatch.unit_price,
      price_found: true,
      match_confidence: 'normalized',
    };
  }

  // 4. Missing price in catalog -> Trigger human review
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    service: rawServiceName,
    quantity: qty,
    unit_price: 0,
    amount: 0,
    price_found: false,
    match_confidence: 'not_found',
    notes: 'Service was not located in the approved pricing database. Manual price review required.',
  };
}

export function resolveAllPrices(
  services: Array<{ name: string; quantity?: number; notes?: string | null }>
): ResolvedServiceItem[] {
  return services.map((s) => {
    const resolved = resolveServicePrice(s.name, s.quantity || 1);
    if (s.notes) {
      resolved.notes = resolved.notes ? `${resolved.notes} | ${s.notes}` : s.notes;
    }
    return resolved;
  });
}
