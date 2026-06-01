"use client";

import React, { useState } from "react";
import { 
  INDUSTRIES, 
  BRAND_VOICE_DESCRIPTIONS, 
  BrandVoice,
  Platform
} from "@/types";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    businessName: "Acme Studio",
    industry: "SaaS (Software as a Service)",
    website: "https://acme.studio",
    targetAudience: "Tech-savvy professionals aged 25-45 who are interested in productivity tools and remote work.",
    brandVoice: "professional" as BrandVoice,
    platforms: ["linkedin", "twitter"] as Platform[],
  });

  const handlePlatformToggle = (platform: Platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Brand Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Update your business information and brand personality.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Target Audience</h3>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            className="w-full h-32 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
          />
        </section>

        {/* Brand Voice */}
        <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Brand Voice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(BRAND_VOICE_DESCRIPTIONS) as BrandVoice[]).map((voice) => (
              <button
                key={voice}
                onClick={() => setFormData({ ...formData, brandVoice: voice })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  formData.brandVoice === voice
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                }`}
              >
                <h3 className="font-bold text-slate-900 dark:text-white capitalize">{voice}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {BRAND_VOICE_DESCRIPTIONS[voice]}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Platforms</h3>
          <div className="flex flex-wrap gap-3">
            {(["twitter", "linkedin", "instagram", "facebook", "tiktok"] as Platform[]).map((platform) => (
              <button
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${
                  formData.platforms.includes(platform)
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                }`}
              >
                <span className="capitalize">{platform}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="pt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
