import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/portal
 * Creates a Stripe Customer Portal session for managing subscriptions
 *
 * Body: { userId, returnUrl?, flow? }
 * - flow: "cancel" | "update" | "invoices" (default: "cancel")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, returnUrl, flow } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get the user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id, plan")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer exists. User must subscribe first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const defaultReturnUrl = `${appUrl}/dashboard/billing`;

    // Configure portal configuration based on requested flow
    let configuration: any = {
      customer: user.stripe_customer_id,
      return_url: returnUrl || defaultReturnUrl,
    };

    // For specific flows, we can use flow_data to pre-select the destination
    if (flow === "cancel") {
      configuration.flow_data = {
        type: "subscription_cancel",
      };
    } else if (flow === "invoices") {
      configuration.flow_data = {
        type: "invoice_list",
      };
    }
    // "update" flow (default) — just opens the portal

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create(configuration);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      returnUrl: returnUrl || defaultReturnUrl,
    });
  } catch (error: any) {
    console.error("Portal Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}