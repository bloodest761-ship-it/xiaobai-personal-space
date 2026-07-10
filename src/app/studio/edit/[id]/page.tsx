import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import {
  archiveEntryAction,
  publishEntryAction,
  softDeleteEntryAction,
  unpublishEntryAction,
  updateEntryAction,
} from "@/actions/entries";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Container } from "@/components/ui/Container";
import { getEntryById } from "@/lib/admin-entries";
import { getCurrentAdminState } from "@/lib/auth/admin";
import { formatDate } from "@/lib/dates";
import { entryStatusLabels, entryTypeLabels, projectStatusLabels } from "@/lib/entry-labels";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑内容",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EditEntryPage({ params, searchParams }: PageProps) {
  await requireAdminPage();
  const { id } = await params;
  const query = await searchParams;
  const result = await getEntryById(id);

  if (result.error || !result.data) {
    notFound();
  }

  const entry = result.data;
  const metadata = normalizeMetadata(entry.metadata);

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-accent">Edit</p>
              <h1 className="mt-3 text-3xl font-semibold text-primary">编辑内容</h1>
              <p className="mt-3 text-base leading-8 text-secondary">
                {entryTypeLabels[entry.type]} · {entryStatusLabels[entry.status]}
                {entry.deleted_at ? " · 已在回收站" : ""}
              </p>
            </div>
            <Link
              href="/studio/entries"
              className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium text-primary"
            >
              返回列表
            </Link>
          </div>

          <Message query={query} />

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
            <form action={updateEntryAction} className="rounded-2xl border border-border bg-surface p-6">
              <input type="hidden" name="id" value={entry.id} />
              <div className="grid gap-5">
                <Field label="标题">
                  <input
                    name="title"
                    required
                    maxLength={120}
                    defaultValue={entry.title}
                    className="field-input"
                  />
                </Field>
                <Field label="Slug">
                  <input
                    name="slug"
                    required
                    maxLength={120}
                    defaultValue={entry.slug}
                    className="field-input"
                  />
                </Field>
                <Field label="类型">
                  <select name="type" defaultValue={entry.type} className="field-input">
                    {Object.entries(entryTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="摘要">
                  <textarea
                    name="summary"
                    maxLength={300}
                    defaultValue={entry.summary ?? ""}
                    rows={3}
                    className="field-input"
                  />
                </Field>
                <Field label="标签">
                  <input
                    name="tags"
                    defaultValue={entry.tags.join(", ")}
                    placeholder="用逗号分隔，例如：学习, 复盘"
                    className="field-input"
                  />
                </Field>
                <Field label="正文">
                  <textarea
                    name="content_text"
                    defaultValue={entry.content_text ?? ""}
                    rows={14}
                    className="field-input font-mono leading-7"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-border bg-page px-4 py-3 text-sm text-primary">
                    <input type="checkbox" name="featured" defaultChecked={entry.featured} />
                    是否精选
                  </label>
                  <Field label="精选排序">
                    <input
                      name="featured_order"
                      type="number"
                      defaultValue={entry.featured_order ?? ""}
                      className="field-input"
                    />
                  </Field>
                </div>

                {entry.type === "project" ? (
                  <div className="rounded-2xl border border-border bg-page p-5">
                    <h2 className="text-lg font-semibold text-primary">项目元数据</h2>
                    <div className="mt-5 grid gap-4">
                      <Field label="项目状态">
                        <select
                          name="projectStatus"
                          defaultValue={metadata.projectStatus}
                          className="field-input"
                        >
                          {Object.entries(projectStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="开始日期">
                          <input
                            name="startDate"
                            type="date"
                            defaultValue={metadata.startDate ?? ""}
                            className="field-input"
                          />
                        </Field>
                        <Field label="结束日期">
                          <input
                            name="endDate"
                            type="date"
                            defaultValue={metadata.endDate ?? ""}
                            className="field-input"
                          />
                        </Field>
                      </div>
                      <Field label="技术栈">
                        <input
                          name="techStack"
                          defaultValue={metadata.techStack.join(", ")}
                          className="field-input"
                        />
                      </Field>
                      <Field label="仓库地址">
                        <input
                          name="repositoryUrl"
                          type="url"
                          defaultValue={metadata.repositoryUrl ?? ""}
                          className="field-input"
                        />
                      </Field>
                      <Field label="演示地址">
                        <input
                          name="demoUrl"
                          type="url"
                          defaultValue={metadata.demoUrl ?? ""}
                          className="field-input"
                        />
                      </Field>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white"
                >
                  保存草稿
                </button>
              </div>
            </form>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold text-primary">日期</h2>
                <dl className="mt-4 space-y-3 text-sm text-secondary">
                  <MetaRow label="创建" value={formatDate(entry.created_at)} />
                  <MetaRow label="更新" value={formatDate(entry.updated_at)} />
                  <MetaRow label="发布" value={entry.published_at ? formatDate(entry.published_at) : "尚未发布"} />
                  <MetaRow label="删除" value={entry.deleted_at ? formatDate(entry.deleted_at) : "未删除"} />
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold text-primary">操作</h2>
                <div className="mt-5 grid gap-3">
                  <ActionForm id={entry.id} action={publishEntryAction} label="发布" primary />
                  <ActionForm id={entry.id} action={unpublishEntryAction} label="撤回为草稿" />
                  <ActionForm id={entry.id} action={archiveEntryAction} label="归档" />
                  <ActionForm id={entry.id} action={softDeleteEntryAction} label="删除到回收站" danger />
                </div>
              </div>
            </aside>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-primary">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ActionForm({
  id,
  action,
  label,
  primary = false,
  danger = false,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const className = danger
    ? "min-h-11 rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700"
    : primary
      ? "min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white"
      : "min-h-11 rounded-full border border-border bg-page px-5 py-2 text-sm font-medium text-primary";

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

function Message({ query }: { query: Record<string, string | undefined> }) {
  const text =
    query.error ??
    (query.created ? "草稿已创建。" : null) ??
    (query.saved ? "内容已保存。" : null) ??
    (query.published ? "内容已发布。" : null) ??
    (query.unpublished ? "内容已撤回。" : null) ??
    (query.archived ? "内容已归档。" : null);

  if (!text) {
    return null;
  }

  return (
    <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-6 text-secondary">
      {text}
    </p>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-primary">{value}</dd>
    </div>
  );
}

function normalizeMetadata(value: Json) {
  const record = isRecord(value) ? value : {};
  return {
    projectStatus: asString(record.projectStatus) || "idea",
    startDate: asString(record.startDate),
    endDate: asString(record.endDate),
    techStack: Array.isArray(record.techStack)
      ? record.techStack.filter((item): item is string => typeof item === "string")
      : [],
    repositoryUrl: asString(record.repositoryUrl),
    demoUrl: asString(record.demoUrl),
  };
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
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
