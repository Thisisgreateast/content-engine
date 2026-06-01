"use client";

import React, { useState } from "react";
import { GeneratedPost, PostStatus, Platform } from "@/types";

interface PostCardProps {
  post: GeneratedPost;
  onStatusChange: (postId: string, newStatus: PostStatus) => void;
  onEdit?: (postId: string, newContent: string) => Promise<void>;
  onRegenerate?: (postId: string) => Promise<void>;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  twitter: "🐦",
  linkedin: "💼",
  instagram: "📸",
  facebook: "👥",
  tiktok: "🎵",
};

export default function PostCard({ post, onStatusChange, onEdit, onRegenerate }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editedContent, setEditedContent] = useState(
    post.edited_content || post.content
  );

  const handleSave = async () => {
    if (onEdit) {
      setIsSaving(true);
      try {
        await onEdit(post.id, editedContent);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to save edit:", error);
        alert("Failed to save edit. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
      onStatusChange(post.id, "edited");
    }
  };

  const handleApprove = () => {
    onStatusChange(post.id, post.status === "approved" ? "pending" : "approved");
  };

  const handleRegen = async () => {
    if (onRegenerate) {
      setIsRegenerating(true);
      try {
        await onRegenerate(post.id);
      } catch (error) {
        console.error("Failed to regenerate:", error);
        alert("Failed to regenerate. Please try again.");
      } finally {
        setIsRegenerating(false);
      }
    } else {
      setIsRegenerating(true);
      setTimeout(() => {
        setIsRegenerating(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative">
      {(isRegenerating || isSaving) && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center flex-col gap-2">
          <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-indigo-600">
            {isSaving ? "Saving..." : "Regenerating..."}
          </span>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{PLATFORM_ICONS[post.platform]}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            {post.platform}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {post.day_of_week}
        </span>
      </div>

      <div className="p-5 flex-1 space-y-4">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-32 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 dark:text-slate-300"
          />
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {post.status === "edited" ? editedContent : post.content}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {post.image_suggestion && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              🖼️ Image Suggestion
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              {post.image_suggestion}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-lg transition-colors"
            >
              Edit
            </button>
          )}
          <button 
            onClick={handleRegen}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-lg transition-colors"
          >
            Regen
          </button>
        </div>

        <button
          onClick={handleApprove}
          className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all ${
            post.status === "approved"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-emerald-500"
          }`}
        >
          {post.status === "approved" ? "✓ Approved" : "Approve"}
        </button>
      </div>
    </div>
  );
}
