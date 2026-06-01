"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

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

const steps = [
  {
    title: "Tell us about your business",
    body: "Share your brand, audience, and tone in a guided flow that takes under 3 minutes.",
  },
  {
    title: "AI generates your content",
    body: "ContentEngine creates a full week of posts optimized for every selected platform.",
  },
  {
    title: "You approve and post",
    body: "Edit or regenerate in one click, approve your favorites, then schedule everywhere.",
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

  const activePost = useMemo(
    () => demoPosts[demoIndex % demoPosts.length],
    [demoIndex],
  );

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
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>

          <Link
            href="/onboarding"
            className="rounded-full border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/35"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-5 pb-20 sm:px-8 sm:pb-24">
        <section className="pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                One-click setup in under 3 minutes
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.55 }}
                className="text-balance text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                AI That Runs Your Social Media — So You Don&apos;t Have To
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.55 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
              >
                Generate a full week of platform-optimized content in seconds,
                approve what you love, and publish with confidence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.55 }}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/onboarding"
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110"
                >
                  Start Free 7-Day Trial
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/12"
                >
                  View Pricing
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.65 }}
              className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">Live AI Demo</p>
                <button
                  onClick={() => setDemoIndex((current) => current + 1)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Regenerate
                </button>
              </div>
              <div className="rounded-2xl border border-indigo-300/20 bg-slate-950/80 p-4">
                <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {[
                    "X",
                    "LinkedIn",
                    "Instagram",
                    "Facebook",
                    "TikTok",
                  ].map((platform, index) => (
                    <motion.span
                      key={platform}
                      initial={{ opacity: 0.4, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.35 }}
                      className="rounded-full border border-white/15 bg-white/6 px-3 py-1"
                    >
                      {platform}
                    </motion.span>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={activePost}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl bg-white/4 px-4 py-4 text-sm leading-relaxed text-slate-200"
                  >
                    {activePost}
                  </motion.p>
                </AnimatePresence>

                <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                    Hashtags: #growth #smallbusiness #contentstrategy
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                    Image concept: Team planning social campaign on laptops
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Plans for every stage
              </h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Monthly or yearly billing available. Choose yearly and get 2
                months free.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-sm">
              <button
                className={`rounded-full px-4 py-2 font-medium transition ${
                  yearly ? "text-slate-300" : "bg-white text-slate-900"
                }`}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>
              <button
                className={`rounded-full px-4 py-2 font-medium transition ${
                  yearly ? "bg-white text-slate-900" : "text-slate-300"
                }`}
                onClick={() => setYearly(true)}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const price = yearly ? plan.yearly : plan.monthly;
              const period = yearly ? "/year" : "/month";

              return (
                <motion.article
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={`rounded-2xl border p-6 ${
                    plan.highlighted
                      ? "border-indigo-300/50 bg-gradient-to-b from-indigo-500/20 to-purple-500/10"
                      : "border-white/12 bg-white/3"
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    {plan.highlighted ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">
                        Most Popular
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-300">{plan.description}</p>
                  <p className="mt-5 text-4xl font-semibold text-white">
                    €{price}
                    <span className="ml-1 text-base font-normal text-slate-400">
                      {period}
                    </span>
                  </p>
                  {yearly ? (
                    <p className="mt-2 text-xs text-emerald-300">
                      Includes 2 months free vs monthly billing
                    </p>
                  ) : null}

                  <ul className="mt-6 space-y-3 text-sm text-slate-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/onboarding"
                    className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                      plan.highlighted
                        ? "bg-white text-slate-900 hover:bg-slate-200"
                        : "border border-white/20 bg-white/5 text-white hover:bg-white/12"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20">
          <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            From blank calendar to approved week in minutes
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, idx) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                className="rounded-2xl border border-white/10 bg-white/4 p-6"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/25 text-sm font-semibold text-indigo-100">
                  {idx + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">
            Trusted by small teams
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            What early users are saying
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {[
              {
                quote:
                  "We replaced 6+ hours of weekly writing with a 15-minute review process.",
                person: "Maya R. • Boutique Marketing Studio",
              },
              {
                quote:
                  "The platform-specific formatting is what sold us — no more rewriting for every channel.",
                person: "Daniel T. • SaaS Founder",
              },
              {
                quote:
                  "My clients love the white-label reports. It looks like our own in-house system.",
                person: "Sofia L. • Agency Owner",
              },
            ].map((item) => (
              <blockquote
                key={item.person}
                className="rounded-2xl border border-white/10 bg-white/4 p-6"
              >
                <p className="text-slate-100">“{item.quote}”</p>
                <footer className="mt-4 text-sm text-slate-400">{item.person}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-20">
          <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Everything you need to know
          </h2>

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-white/12 bg-white/4 px-5 py-4"
              >
                <summary className="cursor-pointer list-none pr-8 text-base font-medium text-slate-100">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-indigo-300/30 bg-gradient-to-r from-indigo-600/30 to-fuchsia-600/20 p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Let AI run your content calendar this week
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-200">
            Join ContentEngine and launch your first week of social posts in
            seconds.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Start Free 7-Day Trial
          </Link>
        </section>
      </main>
    </div>
  );
}
