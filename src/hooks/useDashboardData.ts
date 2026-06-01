import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { GeneratedPost, UserProfile, Platform, PostStatus, EditRecord, GenerateRequest, GenerateResponse, Client } from "@/types";

export function useDashboardData(clientId?: string | null) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchUserAndPosts = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    try {
      // 1. Fetch the user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .limit(1)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // 2. Fetch client if clientId is provided
      if (clientId) {
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();
        
        if (clientError) throw clientError;
        setActiveClient(clientData);
      } else {
        setActiveClient(null);
      }

      // 3. Fetch posts
      let query = supabase
        .from("generated_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      } else {
        query = query.eq("user_id", userData.id).is("client_id", null);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (err: any) {
      console.error("Dashboard Data Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchUserAndPosts();
  }, [fetchUserAndPosts]);

  const updatePostStatus = async (postId: string, status: PostStatus) => {
    const supabase = getSupabase();
    try {
      const { error } = await supabase
        .from("generated_posts")
        .update({ status })
        .eq("id", postId);

      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
    } catch (err: any) {
      console.error("Update Status Error:", err);
      alert("Failed to update status");
    }
  };

  const editPost = async (postId: string, content: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const response = await fetch("/api/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          original: post.original_content,
          edited: content
        }),
      });

      if (!response.ok) throw new Error("Failed to save edit");

      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, content, status: "edited" as PostStatus, edited_content: content } : p
      ));
    } catch (err: any) {
      console.error("Edit Post Error:", err);
      throw err;
    }
  };

  const generateNextWeek = async () => {
    if (!user) return;
    
    // Determine which profile to use for generation
    const profile = activeClient || user;
    setIsGenerating(true);

    try {
      // 1. Fetch recent edits for learning context
      const editsResponse = await fetch(`/api/edits?user_id=${user.id}&limit=10`);
      const editsData = await editsResponse.json();
      const previous_edits: EditRecord[] = (editsData.edits || []).map((e: any) => ({
        original: e.original,
        edited: e.edited,
        platform: e.generated_posts.platform
      }));

      // 2. Call generation API
      const genRequest: GenerateRequest = {
        business_name: profile.business_name,
        industry: profile.industry,
        audience: profile.target_audience,
        brand_voice: profile.brand_voice,
        platforms: profile.platforms,
        previous_edits
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...genRequest, user_id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result: GenerateResponse = await response.json();
      
      // 3. Save generated posts to Supabase
      const supabase = getSupabase();
      const postsToInsert = result.posts.map(p => ({
        ...p,
        user_id: user.id,
        client_id: clientId || null,
        created_at: new Date().toISOString()
      }));

      const { data: insertedPosts, error: insertError } = await supabase
        .from("generated_posts")
        .insert(postsToInsert)
        .select();

      if (insertError) throw insertError;

      setPosts(prev => [...(insertedPosts || []), ...prev]);
      alert("Next week's content generated successfully!");
    } catch (err: any) {
      console.error("Generate Next Week Error:", err);
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const regeneratePost = async (postId: string) => {
    if (!user) return;
    const postToRegen = posts.find(p => p.id === postId);
    if (!postToRegen) return;

    // Use activeClient profile if available, otherwise fallback to main user profile
    const profile = activeClient || user;

    try {
      // 1. Fetch recent edits for learning context
      const editsResponse = await fetch(`/api/edits?user_id=${user.id}&limit=10`);
      const editsData = await editsResponse.json();
      const previous_edits: EditRecord[] = (editsData.edits || []).map((e: any) => ({
        original: e.original,
        edited: e.edited,
        platform: e.generated_posts.platform
      }));

      // 2. Call single generation API
      const response = await fetch("/api/generate/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: profile.business_name,
          industry: profile.industry,
          audience: profile.target_audience,
          brand_voice: profile.brand_voice,
          platform: postToRegen.platform,
          day_of_week: postToRegen.day_of_week,
          previous_edits,
          user_id: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Regeneration failed");
      }

      const result = await response.json();
      const newPostData = result.post;

      // 3. Update in Supabase
      const supabase = getSupabase();
      const { data: updatedPost, error: updateError } = await supabase
        .from("generated_posts")
        .update({
          content: newPostData.content,
          hashtags: newPostData.hashtags,
          image_suggestion: newPostData.image_suggestion,
          status: "pending",
          original_content: newPostData.content,
          edited_content: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", postId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 4. Update local state
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (err: any) {
      console.error("Regenerate Post Error:", err);
      alert(err.message);
      throw err;
    }
  };

  return {
    user,
    activeClient,
    posts,
    loading,
    error,
    isGenerating,
    updatePostStatus,
    editPost,
    generateNextWeek,
    regeneratePost,
    refreshData: fetchUserAndPosts
  };
}
