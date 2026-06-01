"use client";

import React from "react";
import { GeneratedPost, Platform, PostStatus } from "@/types";

interface CalendarViewProps {
  posts: GeneratedPost[];
  onStatusChange: (postId: string, newStatus: PostStatus) => void;
  onEdit: (postId: string, content: string) => Promise<void>;
  onRegenerate: (postId: string) => Promise<void>;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
];

export default function CalendarView({ posts, onStatusChange, onEdit, onRegenerate }: CalendarViewProps) {
  // Group posts by day and platform
  const groupedPosts: Record<string, Record<string, GeneratedPost>> = {};
  
  DAYS.forEach(day => {
    groupedPosts[day] = {};
    posts.forEach(post => {
      if (post.day_of_week === day) {
        groupedPosts[day][post.platform] = post;
      }
    });
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[1000px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="p-4 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            Platform
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-4 font-bold text-slate-900 dark:text-white text-sm text-center">
              {day}
            </div>
          ))}
        </div>

        {PLATFORMS.map((platform) => (
          <div key={platform.id} className="grid grid-cols-8 border-b last:border-0 border-slate-100 dark:border-slate-800/50 min-h-[120px]">
            <div className="p-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl">{platform.icon}</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{platform.id}</span>
            </div>
            {DAYS.map(day => {
              const post = groupedPosts[day][platform.id];
              return (
                <div key={day} className="p-2 border-r last:border-0 border-slate-100 dark:border-slate-800/50 group relative">
                  {post ? (
                    <div className="h-full flex flex-col gap-2">
                      <div className={`p-2 rounded-lg text-[11px] leading-tight h-full overflow-hidden ${
                        post.status === 'approved' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50' 
                          : post.status === 'edited'
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50'
                          : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50'
                      }`}>
                        <p className="line-clamp-4">{post.content}</p>
                      </div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/95 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col p-3 border border-indigo-500 rounded-lg shadow-xl">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-bold text-indigo-600 uppercase">{day} • {platform.id}</span>
                           <div className={`w-2 h-2 rounded-full ${
                             post.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                           }`} />
                         </div>
                         <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-6 mb-3">{post.content}</p>
                         <div className="mt-auto flex gap-1">
                            <button 
                              onClick={() => onStatusChange(post.id, post.status === 'approved' ? 'pending' : 'approved')}
                              className="flex-1 text-[10px] bg-indigo-600 text-white font-bold py-1 rounded"
                            >
                              {post.status === 'approved' ? 'Unapprove' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => onRegenerate(post.id)}
                              className="px-2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-1 rounded"
                            >
                              Regen
                            </button>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-20 grayscale">
                       <span className="text-xl">{platform.icon}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
