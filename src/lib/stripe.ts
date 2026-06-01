import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecretKey) {
  console.warn(
    "STRIPE_SECRET_KEY not configured. Set it in your .env file for payments to work."
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  typescript: true,
});

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  priceId: string;
  userId: string;
  email: string;
  businessName: string;
  trialDays?: number;
}) {
  const { customerId, priceId, userId, email, businessName, trialDays = 7 } = params;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    customer_email: customerId ? undefined : email,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        user_id: userId,
        business_name: businessName,
      },
    },
    metadata: {
      user_id: userId,
      business_name: businessName,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/onboarding?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  };

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Update subscription price
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const items = subscription.items.data;

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: items[0].id,
        price: newPriceId,
      },
    ],
  });
}

/**
 * List all active products for the pricing page
 */
export async function listProducts() {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  return prices.data;
}