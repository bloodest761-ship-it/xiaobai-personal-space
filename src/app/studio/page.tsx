import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { getCurrentAdminState } from "@/lib/auth/admin";
import { getAdminEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "后台",
  description: "受保护的后台入口。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudioPage() {
  const adminState = await getCurrentAdminState();

  if (adminState.status === "missing-env") {
    redirect("/login?reason=setup");
  }

  if (adminState.status === "unauthenticated") {
    redirect("/login");
  }

  if (adminState.status === "not-admin") {
    redirect("/login?reason=not-admin");
  }

  const entriesResult = await getAdminEntries();
  const databaseStatus = entriesResult.error ? "数据库查询需要检查配置" : "数据库连接正常";

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-14 sm:py-18">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-medium text-accent">Studio</p>
              <h1 className="mt-3 text-3xl font-semibold text-primary">后台已连接</h1>
              <p className="mt-4 text-base leading-8 text-secondary">
                当前只完成 Supabase 认证、权限和数据库基础。内容管理将在阶段 3 实现。
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-page p-5">
                  <p className="text-sm text-muted">当前管理员邮箱</p>
                  <p className="mt-2 break-words font-medium text-primary">
                    {adminState.email ?? "未提供邮箱"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-page p-5">
                  <p className="text-sm text-muted">数据库连接状态</p>
                  <p className="mt-2 font-medium text-primary">{databaseStatus}</p>
                </div>
              </div>
            </section>
            <aside className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-primary">阶段提示</h2>
              <p className="mt-3 text-sm leading-7 text-secondary">
                这里不会提前创建完整内容管理后台。阶段 3 才会实现列表、新建、编辑和发布。
              </p>
              <form action={logoutAction} className="mt-6">
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-full border border-border bg-page px-5 py-2 text-sm font-medium text-primary transition hover:border-accent"
                >
                  退出登录
                </button>
              </form>
            </aside>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
