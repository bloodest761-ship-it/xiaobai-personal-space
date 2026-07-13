/*
import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
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
  const entriesResult = await getAdminEntries({ limit: 50 });
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
*/

import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminEntries } from "@/lib/admin-entries";
import { formatDate } from "@/lib/dates";
import { entryStatusLabels, entryTypeLabels } from "@/lib/entry-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "后台",
  description: "受保护的内容管理后台。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudioPage() {
  const entriesResult = await getAdminEntries({ limit: 50 });
  const entries = entriesResult.data ?? [];
  const activeEntries = entries.filter((entry) => !entry.deleted_at);
  const drafts = activeEntries.filter((entry) => entry.status === "draft");
  const published = activeEntries.filter((entry) => entry.status === "published");
  const projects = activeEntries.filter((entry) => entry.type === "project");
  const recentModified = activeEntries.slice(0, 5);
  const recentPublished = published
    .filter((entry) => entry.published_at)
    .sort((left, right) => {
      return (
        new Date(right.published_at ?? 0).getTime() -
        new Date(left.published_at ?? 0).getTime()
      );
    })
    .slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-accent">Studio</p>
              <h1 className="mt-3 text-3xl font-semibold text-primary">写作后台</h1>
              <p className="mt-3 max-w-reading text-base leading-8 text-secondary">
                管理草稿、发布内容、归档和回收站。当前正文仍使用简单文本输入。
              </p>
            </div>
            <Button href="/studio/new">新建内容</Button>
          </div>

          {entriesResult.error ? (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-5 text-sm text-secondary">
              {entriesResult.error}
            </div>
          ) : null}

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard label="草稿数量" value={drafts.length} />
            <MetricCard label="已发布数量" value={published.length} />
            <MetricCard label="项目数量" value={projects.length} />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <DashboardList title="最近修改内容" entries={recentModified} empty="还没有可管理的内容。" />
            <DashboardList title="最近发布内容" entries={recentPublished} empty="还没有已发布内容。" />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-primary">{value}</p>
    </div>
  );
}

function DashboardList({
  title,
  entries,
  empty,
}: {
  title: string;
  entries: Awaited<ReturnType<typeof getAdminEntries>>["data"];
  empty: string;
}) {
  const safeEntries = entries ?? [];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      {safeEntries.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="暂无内容" description={empty} />
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {safeEntries.map((entry) => (
            <Link
              key={entry.id}
              href={`/studio/edit/${entry.id}`}
              className="grid gap-2 py-4 transition hover:text-accent sm:grid-cols-[1fr_auto]"
            >
              <span>
                <span className="font-medium text-primary">{entry.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {entryTypeLabels[entry.type]} · {entryStatusLabels[entry.status]}
                </span>
              </span>
              <span className="text-sm text-muted">{formatDate(entry.updated_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
