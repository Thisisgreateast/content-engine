import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { Client, BrandVoice, Platform } from "@/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // For demo purposes, if no user is logged in, we fetch the first user's clients
      let userId = user?.id;
      if (!userId) {
        const { data: userData } = await supabase.from("users").select("id").limit(1).single();
        userId = userData?.id;
      }

      if (!userId) throw new Error("No user found");

      const { data, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("agency_user_id", userId)
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;
      setClients(data || []);
    } catch (err: any) {
      console.error("Fetch Clients Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: Omit<Client, "id" | "agency_user_id" | "created_at">) => {
    const supabase = getSupabase();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let userId = user?.id;
      if (!userId) {
        const { data: userData } = await supabase.from("users").select("id").limit(1).single();
        userId = userData?.id;
      }

      if (!userId) throw new Error("No user found");

      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...clientData,
          agency_user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      setClients(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error("Add Client Error:", err);
      throw err;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Omit<Client, "id" | "agency_user_id" | "created_at">>) => {
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (err: any) {
      console.error("Update Client Error:", err);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    const supabase = getSupabase();
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error("Delete Client Error:", err);
      throw err;
    }
  };

  const bulkGenerate = async () => {
    const supabase = getSupabase();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let userId = user?.id;
      if (!userId) {
        const { data: userData } = await supabase.from("users").select("id").limit(1).single();
        userId = userData?.id;
      }

      if (!userId) throw new Error("No user found");

      const response = await fetch("/api/generate/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clientIds: clients.map(c => c.id),
          agencyUserId: userId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Bulk generation failed");
      }
      
      alert("Bulk generation completed for all clients!");
    } catch (err: any) {
      console.error("Bulk Generation Error:", err);
      alert(err.message || "Bulk generation failed.");
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    bulkGenerate,
    refreshClients: fetchClients,
  };
}
