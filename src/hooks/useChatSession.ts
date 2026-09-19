import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { simpleHash } from "../lib/utils";
import { isEmail } from "../lib/email";

const STORAGE_KEY = "vk_chat_credentials";

type Credentials = { userId: string; password: string; dbId: string };

export function useChatSession() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Credentials;
          const { data } = await supabase
            .from("chat_users")
            .select("*")
            .eq("generated_user_id", parsed.userId)
            .single();
          if (data) {
            const hash = await simpleHash(parsed.password);
            if (hash === data.generated_password_hash) {
              setCredentials(parsed);
            }
          }
        }
      } catch { /* ignore */ }
      setIsLoading(false);
    };
    restore();
  }, []);

  const register = useCallback(async (userId: string, password: string) => {
    setError(null);
    const id = userId.trim().toLowerCase();
    if (!isEmail(id)) return setError("Enter a valid email address");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setIsLoading(true);
    try {
      const hash = await simpleHash(password);
      const { data, error: insertError } = await supabase
        .from("chat_users")
        .insert({ generated_user_id: id, generated_password_hash: hash })
        .select()
        .single();
      if (insertError) {
        if (String(insertError.message).includes("duplicate") || insertError.code === "23505") {
          throw new Error("An account with that email already exists — try signing in");
        }
        throw insertError;
      }
      const creds = { userId: id, password, dbId: data.id };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      setCredentials(creds);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (userId: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("chat_users")
        .select("*")
        .eq("generated_user_id", userId.trim().toLowerCase())
        .single();
      if (fetchError || !data) throw new Error("No account with that email");
      const hash = await simpleHash(password);
      if (hash !== data.generated_password_hash) throw new Error("Wrong password");
      const creds = { userId: data.generated_user_id, password, dbId: data.id };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      setCredentials(creds);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCredentials(null);
  }, []);

  return { credentials, isLoading, error, register, login, logout };
}
