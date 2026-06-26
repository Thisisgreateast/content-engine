"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  BRAND_VOICE_DESCRIPTIONS,
  INDUSTRIES,
  PRODUCT_CONFIGS,
  type BrandVoice,
  type Plan,
  type Platform,
} from "@/types";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type OnboardingState = {
  businessName: string;
  industry: string;
  website: string;
  targetAudience: string;
  brandVoice: BrandVoice;
  platforms: Platform[];
  plan: Plan;
  email: string;
  userId: string;
};

const STEP_LABELS = [
  "Business",
  "Audience",
  "Voice",
  "Platforms",
  "Plan",
  "Checkout",
] as const;

const PLAN_ORDER: Plan[] = ["starter", "pro", "agency"];

const PLATFORM_OPTIONS: {
  id: Platform;
  label: string;
  icon: string;
  description: string;
}[] = [
  { id: "twitter", label: "Twitter / X", icon: "𝕏", description: "Fast updates and hooks" },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "in",
    description: "Thought leadership and B2B",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "◎",
    description: "Visual storytelling and reels",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "f",
    description: "Community and conversation",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: "♫",
    description: "Short-form trend content",
  },
];

const AUDIENCE_SUGGESTIONS = [
  "Busy business owners who need consistent weekly marketing without hiring a full-time social media manager.",
  "Decision-makers and professionals looking for practical, proven ideas they can apply quickly.",
  "Growth-focused founders who want high-impact content that drives trust and conversions.",
  "Community-first customers who value authenticity, clear expertise, and educational content.",
];

const BRAND_VOICES = Object.keys(BRAND_VOICE_DESCRIPTIONS) as BrandVoice[];

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWebsite(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [isYearly, setIsYearly] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const supabase = getSupabase();

  const [form, setForm] = useState<OnboardingState>({
    businessName: "",
    industry: "",
    website: "",
    targetAudience: "",
    brandVoice: "professional",
    platforms: ["linkedin", "instagram"],
    plan: "pro",
    email: "",
    userId: "",
  });

  // Load Auth User on Mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setForm(prev => ({
          ...prev,
          userId: user.id,
          email: user.email || prev.email
        }));
      } else {
        // Fallback for non-auth users (legacy or direct entry)
        const existingId = localStorage.getItem("contentengine_user_id");
        if (existingId) {
          setForm(prev => ({ ...prev, userId: existingId }));
        }
      }
    };
    checkUser();
  }, [supabase]);

  const selectedPlan = PRODUCT_CONFIGS[form.plan];

  const audienceSuggestion = useMemo(() => {
    const index = (form.businessName.length + form.industry.length + step) % AUDIENCE_SUGGESTIONS.length;
    return AUDIENCE_SUGGESTIONS[index];
  }, [form.businessName.length, form.industry.length, step]);

  const stepError = useMemo(() => {
    if (step === 1) {
      if (!form.businessName.trim()) return "Business name is required.";
      if (!form.industry.trim()) return "Select your industry.";
      if (!isValidWebsite(form.website)) return "Website must start with https:// or http://";
    }

    if (step === 2 && form.targetAudience.trim().length < 20) {
      return "Please describe your audience in at least 20 characters.";
    }

    if (step === 3 && !form.brandVoice) {
      return "Select a brand voice.";
    }

    if (step === 4 && form.platforms.length === 0) {
      return "Pick at least one platform.";
    }

    if (step === 5) {
      const max = PRODUCT_CONFIGS[form.plan].maxPlatforms;
      if (form.platforms.length > max) {
        return `Your selected plan supports up to ${max} platform${max > 1 ? "s" : ""}.`;
      }
    }

    if (step === 6 && !isValidEmail(form.email.trim())) {
      return "Enter a valid email for Stripe checkout.";
    }

    return null;
  }, [form, step]);

  const canContinue = !stepError;
  const progress = (step / STEP_LABELS.length) * 100;

  function updateField<K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setCheckoutError(null);
  }

  function togglePlatform(platform: Platform) {
    setForm((prev) => {
      const exists = prev.platforms.includes(platform);
      const platforms = exists
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
    setCheckoutError(null);
  }

  function selectPlan(plan: Plan) {
    const max = PRODUCT_CONFIGS[plan].maxPlatforms;
    setForm((prev) => ({
      ...prev,
      plan,
      platforms: prev.platforms.slice(0, max),
    }));
  }

  function nextStep() {
    if (!canContinue) return;
    setStep((current) => (Math.min(current + 1, 6) as Step));
  }

  function prevStep() {
    setStep((current) => (Math.max(current - 1, 1) as Step));
  }

  async function handleCheckout() {
    if (!canContinue || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      let finalUserId = form.userId;
      
      if (!finalUserId) {
        const generatedId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Date.now().toString(36);
        finalUserId = `user_${generatedId}`;
      }

      localStorage.setItem("contentengine_user_id", finalUserId);
      localStorage.setItem(
        "contentengine_onboarding",
        JSON.stringify({ ...form, userId: finalUserId, isYearly, updatedAt: new Date().toISOString() }),
      );

      const priceId = isYearly
        ? PRODUCT_CONFIGS[form.plan].yearlyPriceId
        : PRODUCT_CONFIGS[form.plan].monthlyPriceId;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: finalUserId,
          priceId,
          email: form.email.trim(),
          businessName: form.businessName,
          plan: form.plan,
          isYearly,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to start Stripe checkout.");
      }

      if (!payload?.url) {
        throw new Error("Stripe checkout URL missing from API response.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutLoading(false);
      setCheckoutError(
        error instanceof Error ? error.message : "Something went wrong starting checkout.",
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_42%),radial-gradient(circle_at_85%_70%,_rgba(168,85,247,0.22),_transparent_45%)]" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 shadow-[0_0_20px_rgba(129,140,248,0.8)]" />
            <span className="text-sm font-semibold tracking-[0.22em] text-slate-300 uppercase">
              ContentEngine
            </span>
          </Link>
          <span className="hidden text-xs tracking-wide text-slate-300 uppercase sm:block">
            Onboarding wizard
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-7 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between text-xs tracking-wide text-slate-300 uppercase">
            <span>Step {step} of 6</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-6">
            {STEP_LABELS.map((label, index) => (
              <div
                key={label}
                className={`rounded-lg px-2 py-2 text-center text-xs ${
                  index + 1 <= step
                    ? "bg-indigo-500/20 text-indigo-100"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-3xl border border-white/12 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                    Tell us about your business
                  </h1>
                  <p className="mt-2 text-slate-300">
                    We use this to generate industry-specific content in your tone.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Business name *</span>
                      <input
                        value={form.businessName}
                        onChange={(event) => updateField("businessName", event.target.value)}
                        placeholder="Acme Fitness Studio"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-medium text-slate-200">Industry *</span>
                      <select
                        value={form.industry}
                        onChange={(event) => updateField("industry", event.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-medium text-slate-200">Website (optional)</span>
                      <input
                        value={form.website}
                        onChange={(event) => updateField("website", event.target.value)}
                        placeholder="https://yourbusiness.com"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">Who is your target audience?</h2>
                  <p className="mt-2 text-slate-300">
                    Better audience detail gives better hooks, wording, and calls to action.
                  </p>

                  <div className="mt-6 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-4">
                    <p className="text-xs font-semibold tracking-wide text-indigo-200 uppercase">AI suggestion</p>
                    <p className="mt-2 text-sm text-slate-100">{audienceSuggestion}</p>
                    <button
                      type="button"
                      onClick={() => updateField("targetAudience", audienceSuggestion)}
                      className="mt-3 rounded-full border border-indigo-300/40 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/35"
                    >
                      Use suggestion
                    </button>
                  </div>

                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Target audience *</span>
                    <textarea
                      value={form.targetAudience}
                      onChange={(event) => updateField("targetAudience", event.target.value)}
                      rows={7}
                      placeholder="Example: Independent gym owners in urban areas who want simple social media systems to attract and retain clients."
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                    />
                  </label>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">Select your brand voice</h2>
                  <p className="mt-2 text-slate-300">Choose the personality your posts should follow.</p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {BRAND_VOICES.map((voice) => {
                      const selected = form.brandVoice === voice;
                      return (
                        <button
                          key={voice}
                          type="button"
                          onClick={() => updateField("brandVoice", voice)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-indigo-300/60 bg-indigo-500/20"
                              : "border-white/12 bg-white/4 hover:border-white/25"
                          }`}
                        >
                          <p className="text-base font-semibold text-white">{labelize(voice)}</p>
                          <p className="mt-2 text-sm text-slate-300">{BRAND_VOICE_DESCRIPTIONS[voice]}</p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">Choose your platforms</h2>
                  <p className="mt-2 text-slate-300">We generate platform-native content for each selection.</p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {PLATFORM_OPTIONS.map((platform) => {
                      const selected = form.platforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => togglePlatform(platform.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-indigo-300/60 bg-indigo-500/20"
                              : "border-white/12 bg-white/4 hover:border-white/25"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white">
                              {platform.icon}
                            </span>
                            <span className="text-sm font-semibold text-white">{platform.label}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">{platform.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">Select your plan</h2>
                  <p className="mt-2 text-slate-300">Pick monthly or yearly (2 months free yearly).</p>

                  <div className="mt-6 inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsYearly(false)}
                      className={`rounded-full px-4 py-2 font-medium transition ${
                        isYearly ? "text-slate-300" : "bg-white text-slate-900"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsYearly(true)}
                      className={`rounded-full px-4 py-2 font-medium transition ${
                        isYearly ? "bg-white text-slate-900" : "text-slate-300"
                      }`}
                    >
                      Yearly
                    </button>
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {PLAN_ORDER.map((plan) => {
                      const config = PRODUCT_CONFIGS[plan];
                      const selected = form.plan === plan;
                      const price = isYearly ? config.yearlyAmount : config.monthlyAmount;

                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => selectPlan(plan)}
                          className={`rounded-2xl border p-5 text-left transition ${
                            selected
                              ? "border-indigo-300/60 bg-indigo-500/20"
                              : "border-white/12 bg-white/4 hover:border-white/25"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-white">{config.name}</p>
                            {plan === "pro" ? (
                              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-900 uppercase">
                                Recommended
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-4 text-3xl font-semibold text-white">
                            €{price}
                            <span className="text-sm font-normal text-slate-400">
                              {isYearly ? "/year" : "/month"}
                            </span>
                          </p>
                          <p className="mt-2 text-xs text-slate-300">
                            {config.postsPerWeek >= 999
                              ? "Unlimited posts/week"
                              : `${config.postsPerWeek} posts/week`} • up to {config.maxPlatforms} platform
                            {config.maxPlatforms > 1 ? "s" : ""}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">Start your free trial</h2>
                  <p className="mt-2 text-slate-300">
                    Complete Stripe checkout and we&apos;ll launch your dashboard with your first AI generation.
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/12 bg-white/5 p-5">
                    <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                      <p>
                        <span className="text-slate-400">Business:</span> {form.businessName || "—"}
                      </p>
                      <p>
                        <span className="text-slate-400">Industry:</span> {form.industry || "—"}
                      </p>
                      <p>
                        <span className="text-slate-400">Voice:</span> {labelize(form.brandVoice)}
                      </p>
                      <p>
                        <span className="text-slate-400">Platforms:</span> {form.platforms.length}
                      </p>
                    </div>
                  </div>

                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Work email *</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                    />
                  </label>

                  {checkoutError ? (
                    <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      {checkoutError}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={!canContinue || checkoutLoading}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkoutLoading
                      ? "Starting checkout..."
                      : `Continue to Stripe — €${
                          isYearly ? selectedPlan.yearlyAmount : selectedPlan.monthlyAmount
                        }${isYearly ? "/year" : "/month"}`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              <div className="flex items-center gap-3">
                {stepError ? <span className="text-xs text-amber-300">{stepError}</span> : null}
                {step < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canContinue}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/12 bg-slate-900/60 p-6 backdrop-blur">
            <p className="text-xs font-semibold tracking-widest text-indigo-200 uppercase">Live summary</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Your setup</h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">Business</dt>
                <dd className="text-slate-100">{form.businessName || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Industry</dt>
                <dd className="text-slate-100">{form.industry || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Brand voice</dt>
                <dd className="text-slate-100">{labelize(form.brandVoice)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Platforms</dt>
                <dd className="text-slate-100">{form.platforms.length} selected</dd>
              </div>
              <div>
                <dt className="text-slate-400">Plan</dt>
                <dd className="text-slate-100">
                  {selectedPlan.name} • €
                  {isYearly ? selectedPlan.yearlyAmount : selectedPlan.monthlyAmount}
                  {isYearly ? "/year" : "/month"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-4 text-xs text-indigo-100">
              Includes 7-day free trial. No charge today. You can cancel before renewal.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
