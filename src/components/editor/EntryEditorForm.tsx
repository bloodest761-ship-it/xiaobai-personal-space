"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { archiveEntryAction, softDeleteEntryAction, unpublishEntryAction } from "@/actions/entries";
import { publishEditorEntryAction, saveEditorEntryAction } from "@/actions/editor";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { editorDocumentToText, emptyEditorDocument, isEditorDocument, type EditorDocument } from "@/components/editor/types";
import { entryTypeLabels, projectStatusLabels } from "@/lib/entry-labels";
import type { EntryRow } from "@/lib/admin-entries";
import type { Json } from "@/types/database";

type EntryEditorFormProps = { entry: EntryRow };
type SaveState = "saved" | "saving" | "unsaved" | "error";

export function EntryEditorForm({ entry }: EntryEditorFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [type, setType] = useState(entry.type);
  const [summary, setSummary] = useState(entry.summary ?? "");
  const [tags, setTags] = useState(entry.tags);
  const [featured, setFeatured] = useState(entry.featured);
  const [featuredOrder, setFeaturedOrder] = useState(entry.featured_order?.toString() ?? "");
  const [metadata, setMetadata] = useState(readMetadata(entry.metadata));
  const [content, setContent] = useState<EditorDocument>(isEditorDocument(entry.content_json) ? entry.content_json : emptyEditorDocument);
  const [contentText, setContentText] = useState(entry.content_text ?? editorDocumentToText(content));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState(entry.updated_at);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(entry.updated_at);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryVersion, setRecoveryVersion] = useState(0);
  const latestRevision = useRef(0);
  const editorInstance = useRef<Editor | null>(null);
  const latestEditorContent = useRef<EditorDocument>(content);
  const latestEditorText = useRef(contentText);
  const dirty = saveState === "unsaved" || saveState === "error";
  const draftKey = `xiaobai:entry-draft:${entry.id}`;

  const payload = useMemo(() => ({
    id: entry.id,
    title: title.trim(),
    slug: slug.trim(),
    type,
    summary: summary.trim() || null,
    content_json: content as Json,
    content_text: contentText,
    tags,
    featured,
    featured_order: featuredOrder.trim() ? Number(featuredOrder) : null,
    metadata: type === "project" ? metadata : {},
    expected_updated_at: expectedUpdatedAt,
  }), [content, contentText, entry.id, expectedUpdatedAt, featured, featuredOrder, metadata, slug, summary, tags, title, type]);

  const markChanged = useCallback(() => {
    latestRevision.current += 1;
    setRevision(latestRevision.current);
    setSaveState("unsaved");
    setError(null);
  }, []);

  const resolvePayload = useCallback(() => ({
    ...payload,
    content_json: (editorInstance.current?.getJSON() as EditorDocument | undefined ?? latestEditorContent.current) as Json,
    content_text: editorInstance.current
      ? editorDocumentToText(editorInstance.current.getJSON() as EditorDocument)
      : latestEditorText.current,
  }), [payload]);

  const update = <T,>(setValue: (value: T) => void, value: T) => { setValue(value); markChanged(); };

  const save = useCallback(async (force = false) => {
    if (!force && (saveState === "saving" || saveState === "saved")) return true;
    const savedRevision = latestRevision.current;
    setSaveState("saving");
    setError(null);
    const result = await saveEditorEntryAction(resolvePayload());
    if (!result.ok) {
      setSaveState("error");
      setError(result.error);
      return false;
    }
    setLastSavedAt(result.updatedAt);
    setExpectedUpdatedAt(result.updatedAt);
    if (latestRevision.current === savedRevision) {
      setSaveState("saved");
      localStorage.removeItem(draftKey);
    } else {
      setSaveState("unsaved");
    }
    return true;
  }, [draftKey, resolvePayload, saveState]);

  useEffect(() => {
    if (saveState !== "unsaved") return;
    localStorage.setItem(draftKey, JSON.stringify(resolvePayload()));
    const timer = window.setTimeout(() => { void save(); }, 1200);
    return () => window.clearTimeout(timer);
  }, [draftKey, resolvePayload, revision, save, saveState]);

  useEffect(() => {
    const stored = localStorage.getItem(draftKey);
    if (!stored) return;
    const timer = window.setTimeout(() => setShowRecovery(true), 0);
    return () => window.clearTimeout(timer);
  }, [draftKey]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function recoverDraft() {
    const stored = localStorage.getItem(draftKey);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as typeof payload;
      setTitle(draft.title); setSlug(draft.slug); setType(draft.type); setSummary(draft.summary ?? ""); setTags(draft.tags); setFeatured(draft.featured); setFeaturedOrder(draft.featured_order?.toString() ?? ""); setMetadata(readMetadata(draft.metadata)); latestEditorContent.current = draft.content_json as EditorDocument; latestEditorText.current = draft.content_text; setContent(draft.content_json as EditorDocument); setContentText(draft.content_text); setRecoveryVersion((value) => value + 1); markChanged();
    } finally { setShowRecovery(false); }
  }

  async function publish() {
    setSaveState("saving");
    const result = await publishEditorEntryAction(resolvePayload());
    if (!result.ok) { setSaveState("error"); setError(result.error); return; }
    setLastSavedAt(result.updatedAt);
    setSaveState("saved");
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="rounded-2xl border border-border bg-surface p-6">
        {showRecovery ? <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-secondary"><span>发现未保存的本地副本。</span><button type="button" onClick={recoverDraft} className="font-medium text-accent">恢复副本</button><button type="button" onClick={() => { localStorage.removeItem(draftKey); setShowRecovery(false); }} className="text-muted">忽略</button></div> : null}
        {error ? <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">保存失败：{error}。本地副本仍会保留。</p> : null}
        <div className="grid gap-5">
          <Field label="标题"><input value={title} onChange={(event) => update(setTitle, event.target.value)} required maxLength={120} className="field-input" /></Field>
          <Field label="Slug"><input value={slug} onChange={(event) => update(setSlug, event.target.value)} required maxLength={120} className="field-input" /></Field>
          <Field label="类型"><select value={type} onChange={(event) => update(setType, event.target.value as EntryRow["type"])} className="field-input">{Object.entries(entryTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="摘要"><textarea value={summary} onChange={(event) => update(setSummary, event.target.value)} maxLength={300} rows={3} className="field-input" /></Field>
          <TagInput tags={tags} onChange={(value) => update(setTags, value)} />
          <Field label="正文"><RichTextEditor entryId={entry.id} content={content} resetVersion={recoveryVersion} isProject={type === "project"} onEditorReady={(instance) => { editorInstance.current = instance; }} onChange={(json, text) => { latestEditorContent.current = json; latestEditorText.current = text; setContent(json); setContentText(text); markChanged(); }} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-border bg-page px-4 py-3 text-sm text-primary"><input type="checkbox" checked={featured} onChange={(event) => update(setFeatured, event.target.checked)} /> 是否精选</label><Field label="精选排序"><input value={featuredOrder} type="number" onChange={(event) => update(setFeaturedOrder, event.target.value)} className="field-input" /></Field></div>
          {type === "project" ? <ProjectFields metadata={metadata} onChange={(value) => update(setMetadata, value)} /> : null}
          <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void save(true)} disabled={saveState === "saving"} className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60">立即保存</button><SaveIndicator state={saveState} lastSavedAt={lastSavedAt} /></div>
        </div>
      </div>
      <aside className="space-y-5"><div className="rounded-2xl border border-border bg-surface p-6"><h2 className="text-lg font-semibold text-primary">日期</h2><dl className="mt-4 space-y-3 text-sm text-secondary"><MetaRow label="创建" value={formatDate(entry.created_at)} /><MetaRow label="最后保存" value={formatDate(lastSavedAt)} /><MetaRow label="发布" value={entry.published_at ? formatDate(entry.published_at) : "尚未发布"} /></dl></div><div className="rounded-2xl border border-border bg-surface p-6"><h2 className="text-lg font-semibold text-primary">操作</h2><div className="mt-5 grid gap-3"><button type="button" onClick={() => void publish()} disabled={saveState === "saving"} className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60">保存并发布</button><LifecycleForm id={entry.id} action={unpublishEntryAction} label="撤回为草稿" /><LifecycleForm id={entry.id} action={archiveEntryAction} label="归档" /><LifecycleForm id={entry.id} action={softDeleteEntryAction} label="删除到回收站" danger /></div></div></aside>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-medium text-primary"><span>{label}</span>{children}</label>; }
function MetaRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd className="text-right text-primary">{value}</dd></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function SaveIndicator({ state, lastSavedAt }: { state: SaveState; lastSavedAt: string }) { const label = state === "saving" ? "保存中..." : state === "error" ? "保存失败，本地已备份" : state === "unsaved" ? "有未保存更改" : `已保存：${formatDate(lastSavedAt)}`; return <span className={`text-sm ${state === "error" ? "text-red-700" : state === "unsaved" ? "text-amber-700" : "text-muted"}`}>{label}</span>; }
function LifecycleForm({ id, action, label, danger = false }: { id: string; action: (formData: FormData) => Promise<void>; label: string; danger?: boolean }) { return <form action={action}><input type="hidden" name="id" value={id} /><button type="submit" className={danger ? "min-h-11 rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700" : "min-h-11 rounded-full border border-border bg-page px-5 py-2 text-sm font-medium text-primary"}>{label}</button></form>; }

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) { const [value, setValue] = useState(""); const add = () => { const next = value.trim(); if (next && !tags.includes(next) && tags.length < 16) onChange([...tags, next]); setValue(""); }; return <Field label="标签"><div className="rounded-xl border border-border bg-page p-3"><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => onChange(tags.filter((item) => item !== tag))} className="rounded-full bg-subtle px-3 py-1 text-xs text-secondary">{tag} ×</button>)}</div><div className="mt-2 flex gap-2"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); } }} placeholder="输入标签后按回车" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={add} className="text-sm font-medium text-accent">添加</button></div></div></Field>; }
type Metadata = { projectStatus?: string; startDate?: string | null; endDate?: string | null; techStack?: string[]; repositoryUrl?: string | null; demoUrl?: string | null };
function readMetadata(value: unknown): Metadata { return value && typeof value === "object" && !Array.isArray(value) ? value as Metadata : {}; }
function ProjectFields({ metadata, onChange }: { metadata: Metadata; onChange: (metadata: Metadata) => void }) { const change = (key: keyof Metadata, value: string) => onChange({ ...metadata, [key]: value || null }); return <div className="rounded-2xl border border-border bg-page p-5"><h2 className="text-lg font-semibold text-primary">项目字段</h2><div className="mt-5 grid gap-4"><Field label="项目状态"><select value={metadata.projectStatus ?? "idea"} onChange={(event) => change("projectStatus", event.target.value)} className="field-input">{Object.entries(projectStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="开始时间"><input type="date" value={metadata.startDate ?? ""} onChange={(event) => change("startDate", event.target.value)} className="field-input" /></Field><Field label="结束时间"><input type="date" value={metadata.endDate ?? ""} onChange={(event) => change("endDate", event.target.value)} className="field-input" /></Field></div><Field label="技术栈"><input value={(metadata.techStack ?? []).join(", ")} onChange={(event) => onChange({ ...metadata, techStack: event.target.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean) })} className="field-input" /></Field><Field label="仓库地址"><input type="url" value={metadata.repositoryUrl ?? ""} onChange={(event) => change("repositoryUrl", event.target.value)} className="field-input" /></Field></div></div>; }
