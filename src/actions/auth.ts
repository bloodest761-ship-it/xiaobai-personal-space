"use server";

import { redirect } from "next/navigation";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getSafeStudioRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginInputSchema } from "@/lib/validation/entry";

export type LoginActionState = {
  message: string | null;
  fields?: {
    email?: string;
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!hasPublicSupabaseEnv()) {
    return {
      message: "Supabase 环境变量尚未配置，请先根据 SETUP_SUPABASE.md 创建 .env.local。",
      fields: {
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "登录信息不完整。",
      fields: {
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      message: "登录失败，请检查邮箱和密码。",
      fields: {
        email: parsed.data.email,
      },
    };
  }

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return {
      message: "这个账号不是管理员，已拒绝进入后台。",
      fields: {
        email: parsed.data.email,
      },
    };
  }

  redirect(getSafeStudioRedirect(formData.get("next")));
}

export async function logoutAction() {
  if (hasPublicSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
