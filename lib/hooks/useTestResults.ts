import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type {
  TestResult,
  CreateTestResultInput,
  UpdateTestResultInput,
} from "../types";

export function useTestResults() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setResults([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("test_date", { ascending: false });

      if (fetchError) throw fetchError;
      setResults(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const createResult = async (
    input: CreateTestResultInput
  ): Promise<TestResult | null> => {
    try {
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: createError } = await supabase
        .from("test_results")
        .insert({
          ...input,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      setResults((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create result");
      return null;
    }
  };

  const updateResult = async (
    id: string,
    input: UpdateTestResultInput
  ): Promise<TestResult | null> => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("test_results")
        // @ts-expect-error - Supabase types not generated, runtime types are correct
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setResults((prev) => prev.map((r) => (r.id === id ? data : r)));
      return data as TestResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update result");
      return null;
    }
  };

  const deleteResult = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("test_results")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Update local state
      setResults((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete result");
      return false;
    }
  };

  return {
    results,
    loading,
    error,
    refetch: fetchResults,
    createResult,
    updateResult,
    deleteResult,
  };
}

// Hook for fetching a single result
export function useTestResult(id: string | undefined) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("test_results")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch result");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  return { result, loading, error };
}
