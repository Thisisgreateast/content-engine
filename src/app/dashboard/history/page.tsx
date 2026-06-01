"use client";

import React, { useState } from "react";
import { GeneratedPost } from "@/types";
import PostCard from "@/components/PostCard";

const MOCK_HISTORY: GeneratedPost[] = [
  {
    id: "h1",
    user_id: "user1",
    platform: "linkedin",
    day_of_week: "Friday",
    content: "Reflecting on a great week of growth and learning. 📈",
    hashtags: ["Growth", "Mindset"],
    status: "approved",
    original_content: "Reflecting on a great week of growth and learning. 📈",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "h2",
    user_id: "user1",
    platform: "twitter",
    day_of_week: "Thursday",
    content: "What's one tool you can't live without? For me, it's ContentEngine. 😉",
    hashtags: ["Tools", "SaaS"],
    status: "approved",
    original_content: "What's one tool you can't live without? For me, it's ContentEngine. 😉",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export default function HistoryPage() {
  const [posts] = useState<GeneratedPost[]>(MOCK_HISTORY);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Post History</h2>
        <p className="text-slate-500 dark:text-slate-400">View your previously generated and approved content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onStatusChange={() => {}} // History is read-only in this mock
          />
        ))}
      </div>
    </div>
  );
}
