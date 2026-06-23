"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Plan = {
  name: "Starter" | "Pro" | "Agency";
  monthly: number;
  yearly: number;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthly: 29,
    yearly: 290,
    description: "Perfect for solo founders and local businesses.",
    features: [
      "10 posts per week",
      "1 platform",
      "Brand voice presets",
      "7-day free trial",
    ],
    cta: "Start Starter Trial",
  },
  {
    name: "Pro",
    monthly: 79,
    yearly: 790,
    description: "Best for growing teams that need consistent output.",
    features: [
      "30 posts per week",
      "3 platforms",
      "Custom brand voice",
      "Priority generation",
      "7-day free trial",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    monthly: 199,
    yearly: 1990,
    description: "Built for agencies managing multiple clients.",
    features: [
      "Unlimited posts",
      "10 platforms",
      "White-label reports",
      "Client management",
      "Bulk generation",
      "7-day free trial",
    ],
    cta: "Start Agency Trial",
  },
];

const faqs = [
  {
    question: "How does the 7-day trial work?",
    answer:
      "You can start any plan with a full 7-day trial. You will not be charged until the trial ends, and you can cancel anytime before renewal.",
  },
  {
    question: "Will posts be different for each platform?",
    answer:
      "Yes. ContentEngine generates platform-native copy for X, LinkedIn, Instagram, Facebook, and TikTok instead of copy-pasting one generic post.",
  },
  {
    question: "Can I adjust tone and brand voice later?",
    answer:
      "Absolutely. Update your brand settings anytime. ContentEngine also learns from your edits and uses them to improve future generations.",
  },
  {
    question: "Is Agency tier white-label ready?",
    answer:
      "Yes. Agency users can remove ContentEngine branding from exports and manage multiple client workspaces in one dashboard.",
  },
];

const demoPosts = [
  "Monday • LinkedIn: Share a founder story with a clear CTA.",
  "Tuesday • Instagram: Behind-the-scenes photo + short punchy caption.",
  "Wednesday • X: Fast tip thread with 3 actionable takeaways.",
  "Thursday • Facebook: Community question to increase comments.",
  "Friday • TikTok: 15-second script idea with hook + payoff.",
];

export default function Home() {
  const [yearly, setYearly] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [authMode, setAuthMode] = useState<"none" | "signin" | "signup" | "trial">("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = getSupabase();

  const activePost = useMemo(
    () => demoPosts[demoIndex % demoPosts.length],
    [demoIndex],
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 1. Call server-side signup to bypass redirect issues
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const payload = await res.json();
      
      if (!res.ok) {
        setError(`Signup Error: ${payload.error}`);
        setLoading(false);
        return;
      }
      
      // 2. Sign in client-side immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        setError(`Sign In Error: ${signInError.message}`);
        setLoading(false);
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(`Unexpected Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      // 1. Call server-side signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: randomPassword }),
      });
      
      const payload = await res.json();
      
      if (!res.ok) {
        setError(`Trial Signup Error: ${payload.error}`);
        setLoading(false);
        return;
      }
      
      // 2. Sign in client-side
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: randomPassword });
      
      if (signInError) {
        setError(`Trial Sign In Error: ${signInError.message}`);
        setLoading(false);
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(`Unexpected Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_42%),radial-gradient(circle_at_80%_70%,_rgba(168,85,247,0.22),_transparent_45%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 shadow-[0_0_20px_rgba(129,140,248,0.8)]" />
            <span className="text-sm font-semibold tracking-[0.22em] text-slate-300 uppercase">
              ContentEngine
            </span>
          </div>

          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
            <button onClick={() => setAuthMode("signin")} className="transition hover:text-white">
              Sign In
            </button>
          </div>

          <button
            onClick={() => setAuthMode("trial")}
            className="rounded-full border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/35"
          >
            Start Free Trial
          </button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-5 pb-20 sm:px-8 sm:pb-24">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-balance text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            AI That Runs Your Social Media — So You Don&apos;t Have To
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 mx-auto max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            Generate a full week of platform-optimized content in seconds, approve what you love, and publish with confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-wrap justify-center items-center gap-4"
          >
            <button
              onClick={() => setAuthMode("trial")}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110"
            >
              Start Free 7-Day Trial
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/12"
            >
              Create Account
            </button>
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Plans for every stage</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.highlighted ? "border-indigo-300/50 bg-indigo-500/10" : "border-white/12 bg-white/3"
                }`}
              >
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-5 text-4xl font-semibold text-white">€{yearly ? plan.yearly : plan.monthly}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setAuthMode("trial")}
                  className="mt-8 w-full rounded-full bg-white/10 border border-white/20 py-3 text-sm font-semibold hover:bg-white/20 transition"
                >
                  {plan.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Auth Modal Overlay */}
        <AnimatePresence>
          {authMode !== "none" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-8 shadow-2xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    {authMode === "signin" && "Welcome Back"}
                    {authMode === "signup" && "Create Your Account"}
                    {authMode === "trial" && "Start Your Free Trial"}
                  </h2>
                  <button onClick={() => setAuthMode("none")} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form
                  onSubmit={
                    authMode === "signin" ? handleSignIn : 
                    authMode === "signup" ? handleSignUp : handleStartTrial
                  }
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>

                  {authMode !== "trial" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    {loading ? "Processing..." : 
                     authMode === "signin" ? "Sign In" : 
                     authMode === "signup" ? "Create Account" : "Get Started Now"}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                  {authMode === "signin" ? (
                    <p>Don't have an account? <button onClick={() => setAuthMode("signup")} className="text-indigo-400">Sign Up</button></p>
                  ) : (
                    <p>Already have an account? <button onClick={() => setAuthMode("signin")} className="text-indigo-400">Sign In</button></p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
