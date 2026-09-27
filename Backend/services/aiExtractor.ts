import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * High-Speed Extraction Engine
 * Uses gemini-3.1-flash-lite with a strict 1200ms timeout guard.
 * If Gemini takes longer than 1.2s, seamlessly falls back to instant (<1ms) pattern parsing.
 */
export async function extractCustomerRequirement(rawMessage: string): Promise<ExtractionResult> {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    throw new Error('Customer message cannot be empty.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const ai = getAiClient();

      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Customer Message:
"${trimmed}"

Extract JSON strictly matching:
{
  "customer_name": string | null,
  "email": string | null,
  "phone": string | null,
  "company": string | null,
  "services": [ { "name": string, "quantity": integer } ],
  "notes": string | null,
  "urgency": "normal" | "urgent" | "immediate"
}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      // Strict 1200ms maximum wait time for instant responsiveness
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AI response exceeded 1200ms limit')), 1200);
      });

      const response = await Promise.race([geminiCall, timeoutPromise]);

      if (timeoutId) clearTimeout(timeoutId);

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return {
          customer_name: parsed.customer_name || null,
          email: parsed.email || null,
          phone: parsed.phone || null,
          company: parsed.company || null,
          services: Array.isArray(parsed.services) && parsed.services.length > 0
            ? parsed.services.map((s: any) => ({
                name: String(s.name || '').trim(),
                quantity: Math.max(1, Number(s.quantity) || 1),
                notes: s.notes || null,
              }))
            : [{ name: 'Custom Requirement', quantity: 1 }],
          notes: parsed.notes || null,
          urgency: parsed.urgency === 'urgent' || parsed.urgency === 'immediate' ? parsed.urgency : 'normal',
          raw_message: trimmed,
          source: 'gemini',
        };
      }
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      // Fast path fallback for immediate response
    }
  }

  // Instant fallback rule extractor (< 1ms execution)
  return fallbackRuleExtractor(trimmed);
}

export function fallbackRuleExtractor(text: string): ExtractionResult {
  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;

  // Extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Extract name
  let customerName: string | null = null;
  const namePatterns = [
    /(?:hi|hello|hey)[,\s]+i['’]m\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:client|customer|from)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      customerName = match[1].trim();
      break;
    }
  }

  // Extract company
  let company: string | null = null;
  const companyMatch = text.match(/(?:for|from|at)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?(?:\s+(?:Inc|LLC|Media|Studio|Creatix|TechNova|Global|PVT))?)/i);
  if (companyMatch && companyMatch[1] && !['urgent', 'tomorrow', 'today'].includes(companyMatch[1].toLowerCase())) {
    company = companyMatch[1].trim();
  }

  // Word to number
  const wordToNum: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    a: 1,
    an: 1,
  };

  const services: ExtractedService[] = [];

  const serviceRegexes = [
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(logo(?:s|\s+designs?|design)?)/i, baseName: 'Logo Design' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(poster(?:s|\s+designs?|design)?)/i, baseName: 'Poster Design' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(social\s+media\s+posts?|social\s+posts?)/i, baseName: 'Social Media Post' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(promo(?:tional)?\s+videos?|videos?)/i, baseName: 'Promotional Video' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(websites?|website\s+development)/i, baseName: 'Website Development' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(landing\s+pages?)/i, baseName: 'Landing Page' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(product\s+photograph(?:y|s)|photoshoots?)/i, baseName: 'Product Photography' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(video\s+edit(?:ing)?)/i, baseName: 'Video Editing' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(brochures?|brochure\s+designs?)/i, baseName: 'Brochure Design' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(social\s+media\s+management)/i, baseName: 'Social Media Management' },
    { pattern: /(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+)?(3d\s+animations?|animation)/i, baseName: '3D Animation' },
  ];

  for (const { pattern, baseName } of serviceRegexes) {
    const match = text.match(pattern);
    if (match) {
      const qtyStr = (match[1] || '1').toLowerCase();
      const qty = wordToNum[qtyStr] || parseInt(qtyStr, 10) || 1;
      services.push({
        name: baseName,
        quantity: qty,
      });
    }
  }

  const isUrgent = /urgent|asap|rush|immediately|today|tomorrow/i.test(text);

  return {
    customer_name: customerName,
    email,
    phone,
    company,
    services: services.length > 0 ? services : [{ name: 'Custom Requirement', quantity: 1 }],
    notes: isUrgent ? 'Urgent delivery requested' : null,
    urgency: isUrgent ? 'urgent' : 'normal',
    raw_message: text,
    source: 'rule_fallback',
  };
}
