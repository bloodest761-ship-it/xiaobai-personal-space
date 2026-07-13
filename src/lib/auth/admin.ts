import { cache } from "react";
import { headers } from "next/headers";
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
      user: AdminUser;
      email: string | null;
    }
  | {
      status: "admin";
      user: AdminUser;
      email: string | null;
};

type AdminUser = { id: string; email?: string | null };

const getAdminRecord = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data;
});

export async function getCurrentAdminState(): Promise<AdminState> {
  if (!hasPublicSupabaseEnv()) {
    return {
      status: "missing-env",
      user: null,
      email: null,
    };
  }

  const requestHeaders = await headers();
  const proxiedUserId = requestHeaders.get("x-xiaobai-auth-user-id");
  const proxiedEmail = requestHeaders.get("x-xiaobai-auth-user-email");
  const supabase = await createSupabaseServerClient();
  const user = proxiedUserId
    ? { id: proxiedUserId, email: proxiedEmail }
    : (await supabase.auth.getUser()).data.user;

  if (!user) {
    return {
      status: "unauthenticated",
      user: null,
      email: null,
    };
  }

  const data = await getAdminRecord(user.id);

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
