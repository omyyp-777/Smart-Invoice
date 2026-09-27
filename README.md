# InvoiceAI — AI-Powered Invoice Automation & Verification

> **"From customer message to approved invoice."**
> **Core differentiator:** AI understands. Your pricing database decides.

Built for the **Kodnexus AI Build Battle**.

---

## 💡 The Problem

Businesses receive customer requirements in messy, unstructured natural language across emails, WhatsApp messages, and Slack chats:
> *"Hi, I'm Rahul Sharma. I need two logo designs and one promotional video. My email is rahul@gmail.com and this is an urgent delivery for Apex Media."*

Manual invoice preparation is slow, tedious, and prone to costly pricing errors or arithmetic mistakes. Conversely, naive LLM invoice generators often hallucinate prices, miscalculate taxes, or invent imaginary service deliverables.

---

## 🛡️ The InvoiceAI Solution

**InvoiceAI** decouples linguistic understanding from pricing authority:
1. **AI Understands:** Extracts structured customer information, quantities, and services from natural language using Google Gemini (`gemini-3.8-flash`).
2. **Pricing Database Decides:** Service names are matched deterministically against the company's approved `pricing.csv` catalog.
3. **Missing-Price Guard:** Any service not found in the catalog (e.g. *3D Animation*) triggers an immediate **Price Review Required** alert. The AI is strictly barred from inventing prices.
4. **Deterministic Arithmetic:** Subtotals, GST (CGST/SGST/IGST), discounts, and totals are computed strictly in programmatic backend code without LLM arithmetic.
5. **Human-in-the-Loop Review:** A 4-point verification checklist ensures human authorization before any invoice is finalized.
6. **Instant Export:** Generates pixel-perfect printable vector invoices, one-click PDF export, and formatted WhatsApp customer messages.

---

## 🔄 User Journey & Workflow

```text
┌───────────────────────────┐
│     Customer Message      │
│  "I need 2 logos and 1    │
│    promotional video..."  │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│       AI Extraction       │
│  Name, Email, Services,   │
│     Quantity, Notes       │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│     Price Resolution      │
│   Backend / pricing.csv   │
└─────────────┬─────────────┘
              ▼
       ┌──────┴──────┐
       ▼             ▼
    FOUND         MISSING
       │             │
   Auto-Price   ⚠ Review Alert
       │             │
       └──────┬──────┘
              ▼
┌───────────────────────────┐
│      Invoice Builder      │
│  Subtotal + GST + Discount│
│  (0% Arithmetic Fallacy)  │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│   Human Review Checklist  │
│      Verify & Approve     │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│      Approved Invoice     │
│   PDF Export & WhatsApp   │
└───────────────────────────┘
```

---

## 📁 Project Architecture & Clean Separation

```text
├── Backend/                       # Dedicated Server-Side Engine
│   ├── app.ts                     # API Router (/api/extract, /api/pricing, /api/invoice)
│   ├── data/
│   │   └── pricing.csv            # Single Source of Financial Truth
│   ├── routes/
│   │   ├── extract.ts             # Customer requirement parsing route
│   │   ├── pricing.ts             # Catalog retrieval & deterministic resolver route
│   │   └── invoice.ts             # Calculation engine & approval storage
│   └── services/
│       ├── aiExtractor.ts         # Gemini 3.8 Flash SDK integration with fallback
│       ├── priceResolver.ts       # CSV parser, keyword matcher, and missing-price guard
│       └── invoiceCalculator.ts   # Deterministic GST, CGST, SGST, IGST & discount math
│
├── Frontend/                      # Dedicated Client-Side Interface
│   ├── components/
│   │   ├── Navbar.tsx             # SaaS Header & quick navigation
│   │   ├── PipelineFlow.tsx       # 5-stage visual progress tracker
│   │   ├── MessageInput.tsx       # Prompt input + 4 one-click test presets
│   │   ├── ExtractionCard.tsx     # Editable AI output inspection card
│   │   ├── MissingPriceAlert.tsx  # Interactive missing-price protection alert
│   │   ├── LineItemsTable.tsx     # Verified catalog line items editor
│   │   ├── InvoicePreview.tsx     # Authentic letterhead paper invoice preview
│   │   ├── ReviewPanel.tsx        # Human-in-the-loop verification checklist
│   │   └── ApprovalSuccess.tsx    # Celebration, PDF export & WhatsApp share
│   ├── pages/
│   │   ├── CreateInvoice.tsx      # Main end-to-end invoice automation pipeline
│   │   ├── Dashboard.tsx          # Real-time revenue overview & recent invoice log
│   │   └── PricingCatalog.tsx     # Approved database browser with category filters
│   ├── services/
│   │   └── api.ts                 # Type-safe API client
│   ├── types/
│   │   └── index.ts               # Shared TypeScript schemas
│   └── utils/
│       ├── currency.ts            # Indian Rupee (INR) formatting & dates
│       └── share.ts               # WhatsApp message formatter & print/PDF triggers
│
├── server.ts                      # Full-stack entry point mounting Express & Vite
└── metadata.json                  # Application capabilities & metadata
```

---

## 🧪 Quick Test Scenarios for Judges

Click any of the built-in preset cards on the **Create Invoice** screen:
1. **Demo 1: Standard Agency Order**
   - *"Hi, I'm Rahul Sharma. I need two logo designs and one promotional video..."*
   - Matches `Logo Design` (₹1,500 × 2) and `Promotional Video` (₹5,000 × 1).
   - Subtotal: ₹8,000 | GST 18%: ₹1,440 | Total: **₹9,440**.
2. **Demo 2: Price Protection Demonstration (The Killer Feature)**
   - *"Hey, I'm Ananya Sen from Creatix. Please invoice us for two logo designs and one 3D animation sequence..."*
   - `Logo Design` is resolved to ₹1,500.
   - `3D Animation` is flagged as **⚠ NOT IN CATALOG**.
   - Halts auto-calculation and requires reviewer to set an authorized rate or map to a service.
3. **Demo 3: Missing Email / Rush**
   - Tests incomplete information handling; highlights editable customer form.
4. **Demo 4: Digital Agency Bundle with Discount**
   - Multi-item calculation (Website, Landing Page, Social Media Management) with custom GST slabs and discounts.
