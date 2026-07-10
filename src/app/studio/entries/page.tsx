import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  archiveEntryAction,
  publishEntryAction,
  softDeleteEntryAction,
  unpublishEntryAction,
} from "@/actions/entries";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminEntries, type EntryStatus, type EntryType } from "@/lib/admin-entries";
import { getCurrentAdminState } from "@/lib/auth/admin";
import { formatDate } from "@/lib/dates";
import { entryStatusLabels, entryTypeLabels } from "@/lib/entry-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容管理",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    error?: string;
    deleted?: string;
  }>;
};

export default async function EntriesPage({ searchParams }: PageProps) {
  await requireAdminPage();
  const params = await searchParams;
  const selectedType = normalizeType(params.type);
  const selectedStatus = normalizeStatus(params.status);
  const entriesResult = await getAdminEntries({
    query: params.q,
    type: selectedType,
    status: selectedStatus,
    deleted: "exclude",
  });
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
              <p className="mt-3 text-base leading-8 text-secondary">
                搜索、筛选和管理所有未删除内容。
              </p>
            </div>
            <Button href="/studio/new">新建内容</Button>
          </div>

          <Message error={params.error ?? entriesResult.error} success={params.deleted ? "内容已删除到回收站。" : null} />

          <form className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-[1fr_12rem_12rem_auto]">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="搜索标题、摘要或正文"
              className="min-h-11 rounded-xl border border-border bg-page px-4 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            <select
              name="type"
              defaultValue={selectedType}
              className="min-h-11 rounded-xl border border-border bg-page px-4 py-2 text-sm text-primary outline-none focus:border-accent"
            >
              <option value="all">全部类型</option>
              {Object.entries(entryTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="min-h-11 rounded-xl border border-border bg-page px-4 py-2 text-sm text-primary outline-none focus:border-accent"
            >
              <option value="all">全部状态</option>
              {Object.entries(entryStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white">
              筛选
            </button>
          </form>

          {entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState title="暂无内容" description="还没有符合条件的内容，可以先新建一篇草稿。" />
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="hidden grid-cols-[1.4fr_7rem_7rem_9rem_1fr] gap-4 border-b border-border px-5 py-3 text-sm text-muted lg:grid">
                <span>标题</span>
                <span>类型</span>
                <span>状态</span>
                <span>更新时间</span>
                <span>操作</span>
              </div>
              <div className="divide-y divide-border">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_7rem_7rem_9rem_1fr] lg:items-center"
                  >
                    <div>
                      <Link
                        href={`/studio/edit/${entry.id}`}
                        className="font-medium text-primary hover:text-accent"
                      >
                        {entry.title}
                      </Link>
                      <p className="mt-1 break-all text-xs text-muted">/{entry.slug}</p>
                    </div>
                    <p className="text-sm text-secondary">{entryTypeLabels[entry.type]}</p>
                    <p className="text-sm text-secondary">{entryStatusLabels[entry.status]}</p>
                    <p className="text-sm text-muted">{formatDate(entry.updated_at)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/studio/edit/${entry.id}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:border-accent"
                      >
                        编辑
                      </Link>
                      <ActionButton id={entry.id} action={publishEntryAction} label="发布" />
                      <ActionButton id={entry.id} action={unpublishEntryAction} label="撤回" />
                      <ActionButton id={entry.id} action={archiveEntryAction} label="归档" />
                      <ActionButton id={entry.id} action={softDeleteEntryAction} label="删除" danger />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function ActionButton({
  id,
  action,
  label,
  danger = false,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={
          danger
            ? "rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
            : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:border-accent"
        }
      >
        {label}
      </button>
    </form>
  );
}

function Message({ error, success }: { error?: string | null; success?: string | null }) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-6 text-secondary">
      {error ?? success}
    </p>
  );
}

async function requireAdminPage() {
  const state = await getCurrentAdminState();

  if (state.status === "missing-env") {
    redirect("/login?reason=setup");
  }

  if (state.status === "unauthenticated") {
    redirect("/login");
  }

  if (state.status === "not-admin") {
    redirect("/login?reason=not-admin");
  }
}

function normalizeType(value?: string): EntryType | "all" {
  return value === "reflection" || value === "essay" || value === "project" || value === "understanding"
    ? value
    : "all";
}

function normalizeStatus(value?: string): EntryStatus | "all" {
  return value === "draft" || value === "published" || value === "archived" ? value : "all";
}
