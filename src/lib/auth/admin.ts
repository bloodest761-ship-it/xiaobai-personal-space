import type { User } from "@supabase/supabase-js";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminState =
  | {
      status: "missing-env";
      user: null;
      email: null;
    }
  | {
      status: "unauthenticated";
      user: null;
      email: null;
    }
  | {
      status: "not-admin";
      user: User;
      email: string | null;
    }
  | {
      status: "admin";
      user: User;
      email: string | null;
    };

export async function getCurrentAdminState(): Promise<AdminState> {
  if (!hasPublicSupabaseEnv()) {
    return {
      status: "missing-env",
      user: null,
      email: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "unauthenticated",
      user: null,
      email: null,
    };
  }

  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return {
      status: "not-admin",
      user,
      email: user.email ?? null,
    };
  }

  return {
    status: "admin",
    user,
    email: user.email ?? null,
  };
}

export async function isCurrentUserAdmin() {
  const state = await getCurrentAdminState();
  return state.status === "admin";
}
