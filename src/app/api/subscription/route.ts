import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { PRODUCT_CONFIGS } from "@/types";

/**
 * GET /api/subscription?userId=xxx
 * Returns the user's current subscription status with live Stripe data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get user subscription data from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, plan, stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at"
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let stripeStatus = null;
    let currentPeriodEnd = null;
    let cancelAtPeriodEnd = false;
    let planDisplayName = null;

    // If user has a Stripe subscription, get live status
    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripe_subscription_id
        );
        stripeStatus = subscription.status;
        currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        cancelAtPeriodEnd = subscription.cancel_at_period_end;

        // Get the plan name from metadata
        const planFromMetadata =
          subscription.items.data[0]?.price?.metadata?.plan;
        if (planFromMetadata) {
          planDisplayName =
            PRODUCT_CONFIGS[planFromMetadata as keyof typeof PRODUCT_CONFIGS]
              ?.name || planFromMetadata;
        }
      } catch (stripeError) {
        console.error(
          "Failed to fetch live subscription from Stripe:",
          stripeError
        );
        // Don't fail — return cached data from Supabase
      }
    }

    // Determine trial status
    const trialEndDate = user.trial_ends_at
      ? new Date(user.trial_ends_at)
      : null;
    const isOnTrial = trialEndDate ? trialEndDate > new Date() : false;
    const trialDaysRemaining = isOnTrial && trialEndDate
      ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    // Determine effective status for the user
    let effectiveStatus = "inactive";
    if (stripeStatus) {
      effectiveStatus = stripeStatus;
    } else if (isOnTrial) {
      effectiveStatus = "trialing";
    } else if (user.plan) {
      effectiveStatus = "active";
    }

    return NextResponse.json({
      plan: user.plan,
      plan_display_name: planDisplayName,
      status: effectiveStatus,
      stripe_status: stripeStatus,
      is_on_trial: isOnTrial,
      trial_ends_at: user.trial_ends_at,
      trial_days_remaining: trialDaysRemaining,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      has_subscription: !!user.stripe_subscription_id,
      stripe_customer_id: user.stripe_customer_id,
      created_at: user.created_at,
    });
  } catch (error: any) {
    console.error("Subscription Status Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to get subscription status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Update or cancel subscription
 * Body: { userId, action: "cancel" | "reactivate" | "upgrade", priceId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, priceId, plan, isYearly } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: userId, action" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get user's subscription data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, stripe_subscription_id, stripe_customer_id, plan")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "cancel": {
        if (!user.stripe_subscription_id) {
          return NextResponse.json(
            { error: "No active subscription to cancel" },
            { status: 400 }
          );
        }

        // Cancel at period end (user keeps access until billing period ends)
        const cancellation = await stripe.subscriptions.update(
          user.stripe_subscription_id,
          { cancel_at_period_end: true }
        );

        return NextResponse.json({
          success: true,
          cancel_at_period_end: cancellation.cancel_at_period_end,
          current_period_end: cancellation.current_period_end
            ? new Date(cancellation.current_period_end * 1000).toISOString()
            : null,
        });
      }

      case "reactivate": {
        if (!user.stripe_subscription_id) {
          return NextResponse.json(
            { error: "No subscription to reactivate" },
            { status: 400 }
          );
        }

        // Remove cancel_at_period_end
        const reactivation = await stripe.subscriptions.update(
          user.stripe_subscription_id,
          { cancel_at_period_end: false }
        );

        return NextResponse.json({
          success: true,
          message: "Subscription reactivated",
        });
      }

      case "upgrade":
      case "downgrade": {
        if (!user.stripe_subscription_id) {
          return NextResponse.json(
            { error: "No active subscription to modify" },
            { status: 400 }
          );
        }

        if (!priceId) {
          return NextResponse.json(
            { error: "Missing priceId for plan change" },
            { status: 400 }
          );
        }

        // Update the subscription to use the new price
        const subscription = await stripe.subscriptions.retrieve(
          user.stripe_subscription_id
        );
        const updatedSubscription = await stripe.subscriptions.update(
          user.stripe_subscription_id,
          {
            items: [
              {
                id: subscription.items.data[0].id,
                price: priceId,
              },
            ],
            proration_behavior: "create_prorations",
          }
        );

        // Update the plan in our database
        if (plan) {
          await supabase
            .from("users")
            .update({ plan })
            .eq("id", userId);
        }

        return NextResponse.json({
          success: true,
          plan,
          status: updatedSubscription.status,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Subscription Update Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}