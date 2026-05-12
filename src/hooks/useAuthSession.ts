"use client";

import { useEffect, useMemo } from "react";
import type { Session, User } from "@supabase/supabase-js";
import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";

type UserProfileRow = {
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export type CurrentUserProfile = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
};

const AUTH_SESSION_KEY = ["auth-session"] as const;

async function fetchAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session ?? null;
}

function profileFromUser(user: User, profileRow?: UserProfileRow | null): CurrentUserProfile {
  return {
    userId: user.id,
    email: profileRow?.email || user.email || null,
    fullName:
      profileRow?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      null,
    role: profileRow?.role || "Public",
    avatarUrl:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
  };
}

async function fetchCurrentUserProfile(user: User) {
  const { data, error } = await supabase
    .from("users")
    .select("full_name,email,role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profileFromUser(user, data as UserProfileRow | null);
}

export function useAuthSession() {
  const swr = useSWR<Session | null>(AUTH_SESSION_KEY, fetchAuthSession, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const { mutate } = swr;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void mutate(session ?? null, false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mutate]);

  return swr;
}

export function useCurrentUserProfile() {
  const {
    data: session,
    error: sessionError,
    isLoading: sessionLoading,
  } = useAuthSession();
  const user = session?.user ?? null;

  const authProfile = useMemo(
    () => (user ? profileFromUser(user) : null),
    [user]
  );

  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
    mutate,
  } = useSWR<CurrentUserProfile | null>(
    user ? ["current-user-profile", user.id] : null,
    () => fetchCurrentUserProfile(user as User),
    {
      fallbackData: authProfile,
      keepPreviousData: true,
    }
  );

  return {
    session,
    accessToken: session?.access_token ?? null,
    user,
    profile: profile ?? authProfile,
    error: sessionError || profileError,
    isLoading: sessionLoading || (Boolean(user) && profileLoading && !profile),
    mutate,
  };
}
