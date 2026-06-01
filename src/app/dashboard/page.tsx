"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Platform, PostStatus } from "@/types";
import PostCard from "@/components/PostCard";
import CalendarView from "@/components/CalendarView";
import { useDashboardData } from "@/hooks/useDashboardData";

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
];

function DashboardContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <DashboardView />
    </Suspense>
  );
}

function DashboardView() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const { 
    user, 
    activeClient,
    posts, 
    loading, 
    error, 
    isGenerating, 
    updatePostStatus, 
    editPost, 
    generateNextWeek, 
    regeneratePost 
  } = useDashboardData(clientId);
  
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PostStatus | "all">("all");

  const filteredPosts = posts.filter((post) => {
    const platformMatch = filterPlatform === "all" || post.platform === filterPlatform;
    const statusMatch = filterStatus === "all" || post.status === filterStatus;
    return platformMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-red-200">
        <p className="text-red-500 font-semibold">Failed to load dashboard.</p>
        <p className="text-slate-500 text-sm mt-2">Please make sure you have completed onboarding.</p>
      </div>
    );
  }

  const profile = activeClient || user;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {clientId ? `${activeClient?.business_name}'s Content` : user ? `${user.business_name}'s Content` : "This Week's Content"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {clientId ? `Managing content for client ${activeClient?.business_name}` : "Manage and approve your generated social media posts."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "calendar" 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Calendar
              </button>
            </div>
            <button 
              onClick={generateNextWeek}
              disabled={isGenerating || !user}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : "Generate Next Week"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform:</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as Platform | "all")}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PostStatus | "all")}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="edited">Edited</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onStatusChange={updatePostStatus}
                onEdit={editPost}
                onRegenerate={regeneratePost}
              />
            ))}
          </div>
        ) : (
          <CalendarView 
            posts={filteredPosts}
            onStatusChange={updatePostStatus}
            onEdit={editPost}
            onRegenerate={regeneratePost}
          />
        )}

        {filteredPosts.length === 0 && !loading && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
             <p className="text-slate-500 dark:text-slate-400">No posts found for the selected filters.</p>
             {!user && (
               <p className="text-indigo-600 font-medium mt-2">Finish onboarding to start generating content!</p>
             )}
          </div>
        )}
      </div>

      {/* Brand Settings Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Brand Profile</h3>
            <button className="text-xs text-indigo-600 hover:underline">Edit</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Name</p>
              <p className="text-sm text-slate-900 dark:text-white font-medium">{profile?.business_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Industry</p>
              <p className="text-sm text-slate-900 dark:text-white font-medium">{profile?.industry || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand Voice</p>
              <div className="inline-block px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded capitalize">
                {profile?.brand_voice || "Not set"}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Platforms</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.platforms?.map(p => (
                  <span key={p} className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-sm" title={p}>
                    {PLATFORMS.find(pl => pl.id === p)?.icon || "❓"}
                  </span>
                )) || <p className="text-xs text-slate-400 italic">None selected</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/20">
          <h3 className="font-bold mb-2">Agency Tip</h3>
          <p className="text-xs text-indigo-100 leading-relaxed">
            Consistent posting on Tuesdays and Thursdays has shown a 24% higher engagement rate for {user?.industry || "your industry"}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

