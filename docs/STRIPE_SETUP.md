# Stripe Setup Guide for ContentEngine

This guide walks you through setting up Stripe for the ContentEngine subscription platform.

## Overview

ContentEngine uses Stripe for:
- **Subscription billing** (monthly and yearly plans)
- **Free trial management** (7-day trial on all plans)
- **Webhook event handling** (subscription lifecycle)
- **Customer portal** (users manage their own billing)

---

## Step 1: Create Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and create an account
2. Complete your business profile (can be done with test mode initially)

## Step 2: Create Products and Prices

In the Stripe Dashboard, navigate to **Products** → **Add Product**.

### Create 6 Prices (3 plans × 2 billing periods)

| Product Name | Billing | Amount | Price ID (placeholder) | Metadata |
|-------------|---------|--------|----------------------|----------|
| Starter | Monthly | €29.00 | `price_starter_monthly` | `plan: starter` |
| Starter | Yearly | €290.00 | `price_starter_yearly` | `plan: starter` |
| Pro | Monthly | €79.00 | `price_pro_monthly` | `plan: pro` |
| Pro | Yearly | €790.00 | `price_pro_yearly` | `plan: pro` |
| Agency | Monthly | €199.00 | `price_agency_monthly` | `plan: agency` |
| Agency | Yearly | €1,990.00 | `price_agency_yearly` | `plan: agency` |

### For Each Price:
1. **Product Name**: e.g., "ContentEngine Pro"
2. **Description**: e.g., "30 AI-generated posts per week, up to 3 platforms"
3. **Pricing Model**: Standard pricing
4. **Price**: Set the amount in EUR (€)
5. **Billing Period**: Monthly or Yearly
6. **Metadata**: Add key `plan` with value `starter`, `pro`, or `agency`
   - This is **critical** — the webhook handler reads this metadata to determine the plan

## Step 3: Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy the **Secret Key** (starts with `sk_live_` or `sk_test_`)
3. Copy the **Publishable Key** (starts with `pk_live_` or `pk_test_`)

## Step 4: Configure Webhook

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://your-domain.com/api/webhook/stripe`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
3. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. After creating, copy the **Webhook Signing Secret** (starts with `whsec_`)

## Step 5: Environment Variables

Add these to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Update Price IDs in Code

Update the price IDs in `/src/types/index.ts` to match your Stripe dashboard:

```typescript
export const PRODUCT_CONFIGS: Record<Plan, ProductConfig> = {
  starter: {
    monthlyPriceId: "price_1...", // Your Starter monthly price ID
    yearlyPriceId: "price_1...", // Your Starter yearly price ID
    // ...
  },
  pro: {
    monthlyPriceId: "price_1...", // Your Pro monthly price ID
    yearlyPriceId: "price_1...", // Your Pro yearly price ID
    // ...
  },
  agency: {
    monthlyPriceId: "price_1...", // Your Agency monthly price ID
    yearlyPriceId: "price_1...", // Your Agency yearly price ID
    // ...
  },
};
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout` | POST | Create checkout session for new subscription |
| `/api/webhook/stripe` | POST | Stripe webhook handler (server-to-server) |
| `/api/portal` | POST | Create customer portal session |
| `/api/subscription?userId=xxx` | GET | Get subscription status for a user |

## Checkout Flow

```
User selects plan → Frontend calls POST /api/checkout
  → Returns Stripe Checkout URL → User redirected to Stripe
  → User completes payment → Stripe redirects to /dashboard
  → Stripe sends webhook → Webhook updates users table
  → Dashboard loads with active subscription
```

## Testing

In Stripe test mode, use these test card numbers:
- **Success**: `4242 4242 4242 4242` (Visa)
- **3D Secure**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

## Stripe CLI (Local Development)

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Troubleshooting

### Webhook returns 400 "Invalid signature"
- Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret in your Stripe dashboard
- For local dev, the CLI outputs a signing secret — use that one

### Subscription not updating in database
- Check the webhook logs in Stripe Dashboard → Developers → Webhooks
- Verify the `plan` metadata is set on the Stripe price
- Check the Supabase table has the correct schema

### Checkout session returns error
- Verify the price ID exists and is active
- Ensure the user exists in the `users` table (must be created via Supabase Auth first)
- Check that the success_url and cancel_url are valid URLs