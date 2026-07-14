import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { getCurrentAdminState } from "@/lib/auth/admin";
import { getSafeStudioRedirect } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录",
  description: "管理员登录入口。",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    reason?: string;
    next?: string;
  }>;
};

const reasonMessages: Record<string, string> = {
  setup: "Supabase 尚未配置，暂时无法进入后台。",
  "not-admin": "当前账号不是管理员，已拒绝进入后台。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const adminState = await getCurrentAdminState();
  const { reason, next } = await searchParams;
  const nextPath = getSafeStudioRedirect(next);

  if (adminState.status === "admin") {
    redirect(nextPath);
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container size="reading" className="py-14 sm:py-18">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-sm font-medium text-accent">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-primary">登录写作后台</h1>
            <p className="mt-4 text-base leading-8 text-secondary">
              阶段 2 只提供单一管理员登录，不提供公开注册。
            </p>
            {reason ? (
              <p className="mt-5 rounded-xl border border-border bg-page px-4 py-3 text-sm leading-6 text-secondary">
                {reasonMessages[reason] ?? "请先登录管理员账号。"}
              </p>
            ) : null}
            <LoginForm nextPath={nextPath} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
