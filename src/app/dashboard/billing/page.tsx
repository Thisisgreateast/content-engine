"use client";

import React from "react";
import { PRODUCT_CONFIGS, Plan } from "@/types";

export default function BillingPage() {
  const currentPlan: Plan = "pro";
  const config = PRODUCT_CONFIGS[currentPlan];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription & Billing</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your plan and billing information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Current Plan</h3>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full uppercase">
                {config.name}
              </span>
              <p className="text-3xl font-bold text-slate-900 dark:text-white pt-2">
                €{config.monthlyAmount}<span className="text-sm font-normal text-slate-500">/month</span>
              </p>
              <p className="text-sm text-slate-500 pt-2">
                Next billing date: {new Date(Date.now() + 86400000 * 25).toLocaleDateString()}
              </p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
              Change Plan
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white">Plan Features</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Usage</h3>
           <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Posts this month</span>
                  <span className="font-bold">12 / {config.postsPerWeek * 4}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[15%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">API Tokens</span>
                  <span className="font-bold">4.2k / 50k</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[8%]" />
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Method</h3>
        </div>
        <div className="p-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400">
                VISA
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Visa ending in 4242</p>
                <p className="text-xs text-slate-500">Expires 12/28</p>
              </div>
           </div>
           <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
             Update
           </button>
        </div>
      </div>
    </div>
  );
}
