"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDraftLifecycleAction,
  publishEntryLifecycleAction,
  withdrawEntryLifecycleAction,
} from "@/actions/lifecycle";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import { formatDate } from "@/lib/dates";
import { entryTypeLabels } from "@/lib/entry-labels";
import type { EntryStatus, EntryType } from "@/lib/admin-entries";

export type StudioEntryListItem = {
  id: string;
  title: string;
  slug: string;
  type: EntryType;
  status: EntryStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type ActiveAction = "withdraw" | "delete" | null;

export function EntryList({ entries, returnStatus }: { entries: StudioEntryListItem[]; returnStatus?: "draft" | "published" }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="hidden grid-cols-[minmax(12rem,1.4fr)_6rem_8rem_8rem_8rem_11rem] gap-4 border-b border-border px-5 py-3 text-sm text-muted lg:grid">
        <span>标题</span><span>类型</span><span>状态</span><span>更新时间</span><span>创建时间</span><span>操作</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => <EntryRow key={entry.id} entry={entry} returnStatus={returnStatus} />)}
      </div>
    </div>
  );
}

function EntryRow({ entry, returnStatus }: { entry: StudioEntryListItem; returnStatus?: "draft" | "published" }) {
  const editHref = `/studio/edit/${entry.id}${returnStatus ? `?status=${returnStatus}` : ""}`;
  return (
    <article className="grid gap-3 px-5 py-5 lg:grid-cols-[minmax(12rem,1.4fr)_6rem_8rem_8rem_8rem_11rem] lg:items-center">
      <div className="min-w-0">
        <Link href={editHref} className="font-medium text-primary hover:text-accent">
          {entry.title.trim() || "无标题草稿"}
        </Link>
        <p className="mt-1 break-all text-xs text-muted">/{entry.slug} · {entry.featured ? "精选" : "未精选"}</p>
      </div>
      <p className="text-sm text-secondary"><span className="mr-2 text-muted lg:hidden">类型：</span>{entryTypeLabels[entry.type]}</p>
      <p className="text-sm text-secondary"><span className="mr-2 text-muted lg:hidden">状态：</span><StatusLabel entry={entry} /></p>
      <p className="text-sm text-muted"><span className="mr-2 lg:hidden">更新：</span>{formatDate(entry.updated_at)}</p>
      <p className="text-sm text-muted"><span className="mr-2 lg:hidden">创建：</span>{formatDate(entry.created_at)}</p>
      <EntryLifecycleActions entry={entry} editHref={editHref} />
    </article>
  );
}

export function StatusLabel({ entry }: { entry: Pick<StudioEntryListItem, "status" | "published_at"> }) {
  if (entry.status === "draft" && entry.published_at) return <>已撤回后的草稿</>;
  if (entry.status === "draft") return <>草稿</>;
  if (entry.status === "published") return <>已发布</>;
  return <>已归档</>;
}

export function EntryLifecycleActions({
  entry,
  afterDeleteHref,
  onStatusChanged,
  editHref,
}: {
  entry: StudioEntryListItem;
  afterDeleteHref?: string;
  onStatusChanged?: (status: EntryStatus) => void;
  editHref?: string;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inFlightAction, setInFlightAction] = useState<"publish" | "withdraw" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function open(action: Exclude<ActiveAction, null>, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setError(null);
    setConfirmation("");
    setActiveAction(action);
  }

  function close() {
    if (isSubmitting) return;
    setActiveAction(null);
    setError(null);
  }

  async function run(action: "publish" | "withdraw" | "delete") {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setInFlightAction(action);
    setError(null);
    let result: Awaited<ReturnType<typeof publishEntryLifecycleAction>>;
    try {
      result = action === "publish"
        ? await publishEntryLifecycleAction(entry.id)
        : action === "withdraw"
          ? await withdrawEntryLifecycleAction(entry.id)
          : await deleteDraftLifecycleAction(entry.id);
    } catch {
      setIsSubmitting(false);
      setInFlightAction(null);
      setError("操作请求未完成，请检查网络后重试。");
      return;
    }
    setIsSubmitting(false);
    if (!result.ok) {
      setInFlightAction(null);
      setError(result.error);
      return;
    }
    if (action === "delete") {
      try { window.localStorage.removeItem(`xiaobai-draft:${entry.id}`); } catch { /* optional client backup */ }
      if (afterDeleteHref) router.replace(afterDeleteHref);
      else router.refresh();
      return;
    }
    onStatusChanged?.(result.entry.status);
    setActiveAction(null);
    setNotice(action === "publish" ? "内容已发布，公开页面已同步更新。" : "内容已撤回为草稿，公开页面已同步更新。");
    router.refresh();
  }

  const disabled = isSubmitting;
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={editHref ?? `/studio/edit/${entry.id}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:border-accent">编辑</Link>
      {entry.status === "draft" ? <button type="button" disabled={disabled} onClick={() => void run("publish")} className="rounded-full border border-accent px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-60">{inFlightAction === "publish" ? "正在发布…" : "发布（公开）"}</button> : null}
      {entry.status === "published" ? <button type="button" disabled={disabled} onClick={(event) => open("withdraw", event.currentTarget)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary disabled:opacity-60">撤回</button> : null}
      {entry.status === "draft" ? <button type="button" disabled={disabled} onClick={(event) => open("delete", event.currentTarget)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60">删除</button> : null}
      {notice ? <p role="status" className="basis-full text-xs text-secondary">{notice}</p> : null}
      <ConfirmActionDialog
        open={activeAction === "withdraw"}
        title="确认撤回内容"
        description="撤回后，这篇内容将从公开页面消失，但内容仍会保留为草稿，可以继续编辑并重新发布。"
        confirmLabel="确认撤回"
        isSubmitting={isSubmitting}
        submittingLabel="正在撤回…"
        error={error}
        onCancel={close}
        onConfirm={() => void run("withdraw")}
        returnFocusRef={triggerRef}
      />
      <ConfirmActionDialog
        open={activeAction === "delete"}
        title="永久删除草稿"
        description={`将永久删除“${entry.title.trim() || "无标题草稿"}”。删除后无法恢复，但已上传到 Storage 的图片不会自动删除。`}
        confirmLabel="永久删除"
        danger
        confirmationText="删除"
        confirmationValue={confirmation}
        onConfirmationValueChange={setConfirmation}
        isSubmitting={isSubmitting}
        submittingLabel="正在删除…"
        error={error}
        onCancel={close}
        onConfirm={() => void run("delete")}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}
