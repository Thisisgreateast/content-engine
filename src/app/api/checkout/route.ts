import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";
import { PRODUCT_CONFIGS, Plan } from "@/types";

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session for subscription
 * Uses service role to ensure user profile existence.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId, email, businessName, plan, isYearly } = body;

    if (!priceId || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: priceId, userId, email" },
        { status: 400 }
      );
    }

    // Safety check for placeholder IDs
    if (priceId.startsWith("price_") && (priceId.includes("_monthly") || priceId.includes("_yearly"))) {
      console.error(`BLOCKER: Placeholder Price ID detected: ${priceId}. Real Stripe Price IDs start with 'price_1...'`);
      return NextResponse.json(
        { error: `Configuration Error: The Price ID '${priceId}' is a placeholder. You must create this product in Stripe and add the real Price ID (e.g., price_1Q...) to your Vercel Environment Variables.` },
        { status: 500 }
      );
    }

    // Use Service Role (Admin) to handle user profile creation bypass RLS
    const supabase = getServiceSupabase();

    // Verify the user exists in Supabase
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("id", userId)
      .single();

    // Fallback: If user not found in public.users, create the profile on the fly
    if (userError && userError.code === "PGRST116") {
      console.log("User profile not found in public.users, creating it now...");
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({ id: userId, business_name: businessName || "" })
        .select()
        .single();
      
      if (createError) {
        console.error("Failed to create user profile:", createError);
      } else {
        user = newUser;
        userError = null;
      }
    }

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          user_id: userId,
          business_name: businessName || "",
        },
      });
      customerId = customer.id;

      // Immediately save the stripe_customer_id so subsequent calls use it
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: userId,
          plan: plan || "starter",
          is_yearly: isYearly ? "true" : "false",
        },
      },
      metadata: {
        user_id: userId,
        plan: plan || "starter",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}