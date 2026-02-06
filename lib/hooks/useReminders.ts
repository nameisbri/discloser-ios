import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
} from "../types";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReminders([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("next_date", { ascending: true });

      if (fetchError) throw fetchError;
      setReminders(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't load your reminders. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = async (
    input: CreateReminderInput
  ): Promise<Reminder | null> => {
    try {
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be signed in to create reminders. Please sign in and try again.");

      const { data, error: createError } = await supabase
        .from("reminders")
        .insert({
          ...input,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      setReminders((prev) =>
        [...prev, data].sort(
          (a, b) =>
            new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
        )
      );
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't create your reminder. Please check your internet connection and try again."
      );
      return null;
    }
  };

  const updateReminder = async (
    id: string,
    input: UpdateReminderInput
  ): Promise<Reminder | null> => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("reminders")
        // @ts-expect-error - Supabase types not generated, runtime types are correct
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setReminders((prev) =>
        prev
          .map((r) => (r.id === id ? data : r))
          .sort(
            (a, b) =>
              new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
          )
      );
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't update your reminder. Please check your internet connection and try again."
      );
      return null;
    }
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setReminders((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't delete your reminder. Please check your internet connection and try again."
      );
      return false;
    }
  };

  // Get next upcoming reminder (future date)
  const nextReminder = reminders.find(
    (r) => r.is_active && new Date(r.next_date) > new Date()
  );

  // Get overdue reminder (past date, most recent first)
  const overdueReminder = reminders.find(
    (r) => r.is_active && new Date(r.next_date) <= new Date()
  );

  return {
    reminders,
    activeReminders: reminders.filter((r) => r.is_active),
    nextReminder,
    overdueReminder,
    loading,
    error,
    refetch: fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}
