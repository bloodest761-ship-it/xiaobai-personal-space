import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { EntryList } from "@/components/studio/EntryList";
import { StudioNav } from "@/components/studio/StudioNav";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminEntries } from "@/lib/admin-entries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容管理",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ status?: string }> };
type StatusFilter = "all" | "draft" | "published";

export default async function EntriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const entriesResult = await getAdminEntries({ status, deleted: "exclude", limit: 50 });
  const entries = entriesResult.data ?? [];

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-accent">Entries</p>
              <h1 className="mt-3 text-3xl font-semibold text-primary">内容管理</h1>
              <p className="mt-3 text-base leading-8 text-secondary">按最近更新时间查看草稿与已发布内容，并安全地管理状态。</p>
            </div>
            <Button href="/studio/new">新建内容</Button>
          </div>

          <StatusFilters selected={status} />

          {entriesResult.error ? (
            <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">
              {entriesResult.error} 请重新登录或稍后刷新页面。
            </div>
          ) : entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState title={status === "all" ? "还没有内容" : status === "draft" ? "目前没有草稿" : "目前还没有公开发布的内容"} description={status === "all" ? "从第一篇记录开始。" : "切换筛选或新建一篇内容。"} />
            </div>
          ) : (
            <EntryList entries={entries} returnStatus={status === "all" ? undefined : status} />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function StatusFilters({ selected }: { selected: StatusFilter }) {
  const filters: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "全部" },
    { value: "draft", label: "草稿" },
    { value: "published", label: "已发布" },
  ];
  return (
    <nav aria-label="内容状态筛选" className="mt-8 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = filter.value === selected;
        const href = filter.value === "all" ? "/studio/entries" : `/studio/entries?status=${filter.value}`;
        return <Link key={filter.value} href={href} aria-current={active ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium ${active ? "border-accent bg-accent text-white" : "border-border bg-surface text-secondary hover:border-accent"}`}>{filter.label}</Link>;
      })}
    </nav>
  );
}

function normalizeStatus(value?: string): StatusFilter {
  return value === "draft" || value === "published" ? value : "all";
}
