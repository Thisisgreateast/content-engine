"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useClients } from "@/hooks/useClients";
import { BrandVoice, Platform, INDUSTRIES, BRAND_VOICE_DESCRIPTIONS } from "@/types";

export default function ClientsPage() {
  const { clients, loading, addClient, deleteClient, bulkGenerate } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [targetAudience, setTargetAudience] = useState("");
  const [brandVoice, setBrandVoice] = useState<BrandVoice>("professional");
  const [platforms, setPlatforms] = useState<Platform[]>(["linkedin"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addClient({
        business_name: businessName,
        industry,
        target_audience: targetAudience,
        brand_voice: brandVoice,
        platforms,
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Failed to add client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBusinessName("");
    setIndustry(INDUSTRIES[0]);
    setTargetAudience("");
    setBrandVoice("professional");
    setPlatforms(["linkedin"]);
  };

  const togglePlatform = (p: Platform) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((plat) => plat !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Client Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage multiple business accounts from one dashboard.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => bulkGenerate()}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2"
          >
            <span>⚡</span> Bulk Generate
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Add New Client
          </button>
        </div>
      </div>

      {/* Agency Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
             <span className="text-xl">🏷️</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">White-Label Branding</h4>
            <p className="text-sm text-slate-500">Remove ContentEngine branding from client-facing exports.</p>
          </div>
        </div>
        <button 
          onClick={() => setWhiteLabel(!whiteLabel)}
          className={`w-12 h-6 rounded-full transition-colors relative ${whiteLabel ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${whiteLabel ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No clients found. Add your first client to get started!</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-indigo-600 font-bold hover:underline"
          >
            + Add New Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{client.business_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{client.industry}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">⚙️</button>
                   <button 
                    onClick={() => deleteClient(client.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                   >
                     🗑️
                   </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{client.target_audience}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex gap-1.5">
                     {client.platforms.map(p => (
                       <span key={p} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs" title={p}>
                          {p === "facebook" && "👥"}
                          {p === "instagram" && "📸"}
                          {p === "linkedin" && "💼"}
                          {p === "twitter" && "🐦"}
                          {p === "tiktok" && "🎵"}
                       </span>
                     ))}
                  </div>
                  <Link 
                    href={`/dashboard?clientId=${client.id}`}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Manage Content →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Client</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Business Name</label>
                  <input
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {INDUSTRIES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
                  <textarea
                    required
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    placeholder="Describe who this business serves..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Brand Voice</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(BRAND_VOICE_DESCRIPTIONS).map((voice) => (
                      <button
                        key={voice}
                        type="button"
                        onClick={() => setBrandVoice(voice as BrandVoice)}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${
                          brandVoice === voice
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                      >
                        <p className="text-sm font-bold capitalize text-slate-900 dark:text-white">{voice}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Select Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {["twitter", "linkedin", "instagram", "facebook", "tiktok"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p as Platform)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                          platforms.includes(p as Platform)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-100 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Client Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
