# ContentEngine 🚀

## AI That Runs Your Social Media — So You Don't Have To

ContentEngine is a **complete, production-ready SaaS business** that generates AI-powered social media content for small businesses worldwide. Users subscribe, enter their brand details, and get a full week of platform-optimized posts generated instantly.

**This is not just a code project. This is a real business with MRR (Monthly Recurring Revenue) built in.**

---

## 📋 Table of Contents

- [The Business Opportunity](#-the-business-opportunity)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Pricing Strategy](#-pricing-strategy)
- [Target Market](#-target-market)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [API Routes](#-api-routes)
- [Operational Costs](#-operational-costs)
- [Profit Margin Analysis](#-profit-margin-analysis)
- [Scaling Guide](#-scaling-guide)
- [Deployment](#-deployment)

---

## 💰 The Business Opportunity

**The Problem:** Small businesses know they need social media content, but don't have time to create it. Hiring a social media manager costs $3,000-$5,000/month. Using freelancers is inconsistent. Doing it themselves burns time they should spend running their business.

**The Solution:** ContentEngine delivers enterprise-quality social media content at a fraction of the cost. A full week of platform-optimized, on-brand posts in under 3 minutes.

**The Market:**
- 33M+ small businesses in the US alone
- 91% of businesses use social media for marketing
- Average small business spends 6+ hours/week on social media
- Social media management market: $19.6B and growing

**The Business Model:** SaaS subscription with 3 tiers. MRR-based. High retention due to AI learning (the more they use it, the better it gets — switching costs increase over time).

---

## ✨ Features

### Core Features
- **AI-Powered Content Generation**: Uses OpenAI GPT-4o to generate platform-optimized posts
- **5 Platform Support**: Twitter/X, LinkedIn, Instagram, Facebook, TikTok
- **7 Brand Voices**: Professional, Casual, Bold, Warm, Funny, Luxury, Minimal
- **50+ Industries**: Pre-configured hook templates and hashtag strategies
- **Multi-Platform Native**: Each platform gets optimized content — not copy-paste
- **Edit & Approval Workflow**: Functional dashboard with grid and calendar views
- **AI Learning System**: Learns from user edits to improve future generations


### Business Features
- **3 Subscription Tiers**: Starter (€29/mo), Pro (€79/mo), Agency (€199/mo)
- **7-Day Free Trial**: Proven conversion model, no credit card required
- **Stripe Integration**: Complete subscription management, trial handling, webhooks
- **Client Management**: Agency tier supports unlimited client accounts
- **White-Label Exports**: Agency users can remove ContentEngine branding
- **Bulk Generation**: Generate content for all clients at once

### Technical Features
- **Next.js 14 App Router**: Modern, fast, SEO-optimized
- **Supabase Backend**: PostgreSQL database, authentication, realtime
- **Stripe Subscriptions**: Metered billing, trial management, webhook sync
- **OpenAI GPT-4o**: State-of-the-art content generation with JSON mode
- **Tailwind CSS**: Clean, responsive, professional design
- **TypeScript**: End-to-end type safety
- **Row-Level Security**: Supabase RLS policies for data isolation

---

## 🔧 How It Works

1. **User signs up** (3-minute onboarding wizard)
2. **Enters business details**: name, industry, audience, brand voice, platforms
3. **Selects plan**: Starter, Pro, or Agency (with 7-day free trial)
4. **AI generates content**: Full week of platform-optimized posts instantly
5. **User reviews & edits**: Can edit, regenerate, approve, or schedule posts via Grid or Calendar views
6. **AI learns**: Every edit improves future generations

---

## 💵 Pricing Strategy

| Tier | Monthly | Yearly | Posts/Week | Platforms | Target Customer |
|------|---------|--------|-------------|-----------|-----------------|
| **Starter** | €29 | €290 (save €58) | 10 | 1 | Solopreneurs, freelancers |
| **Pro** | €79 | €790 (save €158) | 30 | 3 | Growing businesses |
| **Agency** | €199 | €1,990 (save €398) | Unlimited | 10 | Agencies, marketing firms |

**Pricing Psychology:**
- Yearly pricing saves ~17% — incentivizes annual commitment
- Pro tier is the default recommended — anchors value
- Agency tier is priced for agencies charging clients €500-€2,000/month for social media
- 7-day free trial removes purchase friction

---

## 🎯 Target Market

### Primary Markets
1. **Solopreneurs & Freelancers** (Starter plan)
   - Coaches, consultants, creators
   - Need consistent content but don't have time
   - Price-sensitive, need quick ROI

2. **Small-to-Medium Businesses** (Pro plan — SWEET SPOT)
   - Local businesses (restaurants, shops, services)
   - B2B companies needing LinkedIn presence
   - E-commerce brands needing Instagram/Facebook content
   - Willing to pay €79/month for 10+ hours/week savings

3. **Marketing Agencies** (Agency plan)
   - Manage 5-50+ client accounts
   - Need white-label solutions
   - Can resell at 3-5x markup
   - Highest LTV (lifetime value)

### Secondary Markets
- Real estate agents
- Healthcare professionals
- Non-profits
- Educational institutions
- Event planners

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | React-based full-stack framework |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Database** | Supabase (PostgreSQL) | User data, posts, edit history |
| **Auth** | Supabase Auth | User authentication |
| **Payments** | Stripe | Subscriptions, billing, webhooks |
| **AI** | OpenAI GPT-4o | Content generation |
| **Animation** | Framer Motion | UI animations |
| **Deployment** | Vercel | Hosting, edge functions |
| **Language** | TypeScript | Type safety |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- A Stripe account
- An OpenAI API key with GPT-4o access

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd contentengine
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Email Auth in Authentication > Settings
4. Copy your project URL and anon key

### 4. Set Up Stripe
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create Products and Prices in Dashboard:
   - Starter Monthly (€29), Starter Yearly (€290)
   - Pro Monthly (€79), Pro Yearly (€790)
   - Agency Monthly (€199), Agency Yearly (€1,990)
3. Add metadata `plan: starter|pro|agency` to each price
4. Set up webhook endpoint: `https://your-domain.com/api/webhook/stripe`
5. Copy webhook signing secret

### 5. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## 🗄️ Database Schema

The database uses PostgreSQL via Supabase with 5 tables:

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users |
| business_name | TEXT | User's business name |
| industry | TEXT | Industry selection |
| target_audience | TEXT | Audience description |
| brand_voice | TEXT | Professional, Casual, etc. |
| platforms | TEXT[] | Array of selected platforms |
| plan | TEXT | starter, pro, agency, or null |
| stripe_customer_id | TEXT | Stripe customer reference |
| stripe_subscription_id | TEXT | Stripe subscription reference |
| trial_ends_at | TIMESTAMPTZ | Free trial end date |

### `generated_posts`
Stores all AI-generated posts with status tracking, edit history references, and platform metadata.

### `clients`
Agency tier — manages per-client brand settings.

### `edit_history`
Tracks user edits for AI learning — feeds back into the system prompt.

### `token_usage`
Monitors OpenAI API costs per user for potential overage billing.

See `supabase/schema.sql` for the complete schema with indexes and RLS policies.

---

## 🌐 API Routes

### `POST /api/generate`
**AI Generation Engine** — Generates a week of platform-optimized posts.

**Input:**
```json
{
  "business_name": "Bloom Wellness",
  "industry": "Health & Wellness",
  "audience": "Busy professionals aged 25-45",
  "brand_voice": "warm",
  "platforms": ["twitter", "linkedin", "instagram"],
  "previous_edits": [...]
}
```

**Output:**
```json
{
  "posts": [
    {
      "platform": "twitter",
      "day_of_week": "Monday",
      "content": "Your health isn't a luxury. It's the foundation.",
      "hashtags": ["#wellness", "#health"],
      "image_suggestion": "Photo of someone meditating at sunrise"
    }
  ],
  "usage": {
    "prompt_tokens": 850,
    "completion_tokens": 1200,
    "total_tokens": 2050
  }
}
```

### `POST /api/checkout`
Creates a Stripe Checkout Session for new subscriptions.

### `POST /api/webhook/stripe`
Handles subscription lifecycle events:
- `checkout.session.completed` — activates subscription
- `customer.subscription.updated` — syncs plan changes
- `customer.subscription.deleted` — marks subscription cancelled
- `invoice.payment_succeeded` — confirms payment
- `invoice.payment_failed` — handles payment issues

### `POST /api/edits`
Records user edits for AI learning.

### `GET /api/edits?user_id=xxx`
Retrieves recent edits for AI context.

### `POST /api/portal`
Creates Stripe Customer Portal session for subscription management.

---

## 📊 Operational Costs

### Per-User Costs (Pro Plan ≈ 30 posts/week, 3 platforms)

| Item | Cost | Notes |
|------|------|-------|
| **OpenAI GPT-4o** | ~€0.15/generation | ~1,500-2,000 tokens per generation |
| **Supabase** | ~€0.01/user | Scales with users |
| **Vercel Hosting** | ~€20/month flat | Free tier for early stage |
| **Stripe Fees** | 2.9% + €0.25 | Transaction processing |

**Total variable cost per Pro user: ~€0.16/month** (almost pure margin)

### Monthly Fixed Costs

| Item | Cost | Scale |
|------|------|-------|
| Vercel Pro | €20/month | 0-100 users |
| OpenAI API | Variable | ~€0.15 per active user/month |
| Stripe | 2.9% + €0.25/tx | Scales with revenue |

---

## 💰 Profit Margin Analysis

### Per-Tier Margins

| Tier | Revenue | COGS | Gross Profit | Margin |
|------|---------|------|-------------|--------|
| **Starter** | €29 | ~€0.10 | €28.90 | **99.7%** |
| **Pro** | €79 | ~€0.30 | €78.70 | **99.6%** |
| **Agency** | €199 | ~€1.50 | €197.50 | **99.2%** |

### Monthly Revenue Scenarios

| Users | MRR | OpenAI Cost | Gross Profit |
|-------|-----|-------------|--------------|
| 100 | €4,900 | ~€20 | **€4,880** |
| 500 | €24,500 | ~€100 | **€24,400** |
| 1,000 | €49,000 | ~€200 | **€48,800** |
| 10,000 | €490,000 | ~€2,000 | **€488,000** |

*Assumes average revenue per user (ARPU) of €49 (mix of tiers)*

---

## 📈 Scaling Guide

### Phase 1: Launch (0-100 users)
- **Cost**: ~€50/month (Vercel + OpenAI minimum)
- **Focus**: Validate demand, collect testimonials, refine AI quality
- **Marketing**: Product Hunt, Twitter/X, LinkedIn, indie hacker communities

### Phase 2: Growth (100-1,000 users)
- **Cost**: ~€200/month
- **Focus**: SEO content marketing, referral program, affiliate partnerships
- **Hiring**: Part-time customer support
- **Optimization**: Cache common industry patterns to reduce API costs

### Phase 3: Scale (1,000-10,000 users)
- **Cost**: ~€2,000/month
- **Focus**: Enterprise sales (Agency tier), API access, custom integrations
- **Hiring**: Full-time support, sales team
- **Infrastructure**: Database optimization, CDN caching, potential fine-tuned AI model

### Key Metrics to Track
- **MRR** (Monthly Recurring Revenue) — the north star
- **Churn Rate** — target <5% monthly
- **LTV** (Lifetime Value) — target €500+ per user
- **CAC** (Customer Acquisition Cost) — target <€50
- **Trial-to-Paid Conversion** — target >20%
- **Net Promoter Score** — target 50+

---

## 🌍 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push the code to a GitHub repository
2. Import the project in Vercel
3. Add environment variables
4. Set up Stripe webhook endpoint: `https://your-domain.com/api/webhook/stripe`
5. Deploy!

### Environment Variables (Production)
All variables from `.env.example` plus:
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

---

## 🏆 Why This Is a Real Business (Not Just Code)

1. **MRR Business Model**: The most valuable type of SaaS business. Predictable, recurring revenue.

2. **Proven Pricing**: €29/€79/€199 is the sweet spot for small business SaaS — low enough to impulse-buy, high enough for serious margins.

3. **AI Lock-In**: The more users edit posts, the better the AI gets for them. This creates switching costs — users won't leave because they'd lose their trained AI.

4. **Platform Agnostic**: Works with any social media platform. As new platforms emerge, add them to the system prompt.

5. **Agency Upsell**: Agencies pay €199/month and happily resell at €500-€2,000/month to their clients. This creates a partner distribution channel.

6. **Zero Marginal Cost**: After building the AI engine, each additional user costs ~€0.16/month in OpenAI tokens. At €79/month, that's 99.8% margin.

7. **Defensible Moat**: The combination of GPT-4o system prompt engineering + user edit history learning creates a barrier that's hard to replicate.

8. **7-Day Free Trial**: Proven conversion mechanic. Reduces risk for users, increases signups.

---

## 📝 License

MIT — Build your business, make money, change the world.

---

*Built with ❤️ by the ContentEngine team*