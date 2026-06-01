import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events for subscription lifecycle
 *
 * Events handled:
 * - checkout.session.completed: Creates/updates user subscription in DB
 * - customer.subscription.updated: Syncs subscription changes
 * - customer.subscription.deleted: Marks subscription as cancelled
 * - invoice.payment_succeeded: Updates subscription status
 * - invoice.payment_failed: Alerts about failed payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return NextResponse.json(
          { error: "Webhook not configured" },
          { status: 500 }
        );
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Creates or updates the user's subscription record in Supabase
 */
async function handleCheckoutCompleted(session: any, supabase: ReturnType<typeof getSupabase>) {
  const userId = session.metadata?.user_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!userId || !subscriptionId || !customerId) {
    console.error("Missing metadata in checkout session:", {
      userId,
      subscriptionId,
      customerId,
    });
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = subscription.items.data[0]?.price?.metadata?.plan || "starter";

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  // Update the user record in Supabase
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: plan,
      trial_ends_at: trialEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Failed to update user after checkout:", error);
  } else {
    console.log(`Subscription created for user ${userId} — plan: ${plan}`);
  }
}

/**
 * Handle customer.subscription.updated
 * Syncs subscription changes (plan upgrades/downgrades, trial end, etc.)
 */
async function handleSubscriptionUpdated(subscription: any, supabase: ReturnType<typeof getSupabase>) {
  const customerId = subscription.customer;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const plan = subscription.items.data[0]?.price?.metadata?.plan || "starter";
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("users")
    .update({
      plan,
      trial_ends_at: trialEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update subscription:", error);
  } else {
    console.log(`Subscription updated for user ${user.id} — plan: ${plan}`);
  }
}

/**
 * Handle customer.subscription.deleted
 * Marks subscription as cancelled
 */
async function handleSubscriptionDeleted(subscription: any, supabase: ReturnType<typeof getSupabase>) {
  const customerId = subscription.customer;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const { error } = await supabase
    .from("users")
    .update({
      plan: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to cancel subscription:", error);
  } else {
    console.log(`Subscription cancelled for user ${user.id}`);
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: any, supabase: ReturnType<typeof getSupabase>) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (user) {
      await supabase
        .from("users")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  console.warn(`Payment failed for customer ${customerId}`);

  // In a production system, you would:
  // 1. Send an email notification to the user
  // 2. Update the user's subscription status
  // 3. Optionally apply grace period logic
}