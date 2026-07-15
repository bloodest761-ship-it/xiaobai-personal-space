"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { publishEditorEntryAction, saveEditorEntryAction } from "@/actions/editor";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { EntryLifecycleActions } from "@/components/studio/EntryList";
import { editorDocumentToText, emptyEditorDocument, isEditorDocument, type EditorDocument } from "@/components/editor/types";
import { entryTypeLabels, projectStatusLabels } from "@/lib/entry-labels";
import type { EntryRow } from "@/lib/admin-entries";
import type { Json } from "@/types/database";

type EntryEditorFormProps = { entry: EntryRow; autoFocusTitle?: boolean; studioReturnHref?: string };
type SaveState = "unsaved" | "saving" | "saved" | "failed" | "offline" | "recovering";
type SaveFailureKind = "network" | "login" | "permission" | "server" | "unknown";
type Metadata = {
  projectStatus?: string;
  startDate?: string | null;
  endDate?: string | null;
  techStack?: string[];
  repositoryUrl?: string | null;
  demoUrl?: string | null;
};

type EditableSnapshot = {
  id: string;
  title: string;
  slug: string;
  type: EntryRow["type"];
  summary: string;
  cover_path: string;
  content_json: EditorDocument;
  content_text: string;
  tags: string[];
  featured: boolean;
  featured_order: string;
  metadata: Metadata;
  expected_updated_at: string;
};

type DraftBackup = {
  formatVersion: 1;
  entryId: string;
  status: EntryRow["status"];
  snapshot: EditableSnapshot;
  clientUpdatedAt: string;
  serverUpdatedAt: string;
  syncedAt: string | null;
  sourceTabId: string;
};

const DRAFT_FORMAT_VERSION = 1;
const AUTOSAVE_DELAY = 1200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function makeTabId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDraftBackup(value: unknown, entryId: string): value is DraftBackup {
  if (!isRecord(value) || value.formatVersion !== DRAFT_FORMAT_VERSION || value.entryId !== entryId || !isRecord(value.snapshot)) return false;
  const snapshot = value.snapshot;
  return typeof value.status === "string"
    && typeof value.clientUpdatedAt === "string"
    && typeof value.serverUpdatedAt === "string"
    && (value.syncedAt === null || typeof value.syncedAt === "string")
    && typeof value.sourceTabId === "string"
    && snapshot.id === entryId
    && typeof snapshot.title === "string"
    && typeof snapshot.slug === "string"
    && typeof snapshot.type === "string"
    && typeof snapshot.summary === "string"
    && typeof snapshot.cover_path === "string"
    && typeof snapshot.content_text === "string"
    && Array.isArray(snapshot.tags)
    && typeof snapshot.featured === "boolean"
    && typeof snapshot.featured_order === "string"
    && isRecord(snapshot.metadata)
    && isRecord(snapshot.content_json)
    && typeof snapshot.expected_updated_at === "string";
}

function readBackup(key: string, entryId: string): { backup: DraftBackup | null; invalid: boolean; unavailable: boolean } {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { backup: null, invalid: false, unavailable: false };
    const value: unknown = JSON.parse(raw);
    if (!isDraftBackup(value, entryId)) {
      return { backup: null, invalid: true, unavailable: false };
    }
    return { backup: value as DraftBackup, invalid: false, unavailable: false };
  } catch {
    return { backup: null, invalid: false, unavailable: true };
  }
}

function normalizeSnapshot(snapshot: EditableSnapshot) {
  return {
    id: snapshot.id,
    title: snapshot.title.trim(),
    slug: snapshot.slug.trim(),
    type: snapshot.type,
    summary: snapshot.summary.trim() || null,
    cover_path: snapshot.cover_path.trim() || null,
    content_json: snapshot.content_json as Json,
    content_text: snapshot.content_text,
    tags: snapshot.tags,
    featured: snapshot.featured,
    featured_order: snapshot.featured_order.trim() ? Number(snapshot.featured_order) : null,
    metadata: snapshot.type === "project" ? snapshot.metadata : {},
    expected_updated_at: snapshot.expected_updated_at,
  };
}

function classifySaveFailure(error: unknown): { kind: SaveFailureKind; message: string } {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = message.toLowerCase();
  if (typeof navigator !== "undefined" && !navigator.onLine || /network|fetch|timeout|连接|网络/.test(normalized)) {
    return { kind: "network", message: "网络连接失败，内容已保留在本地备份中。" };
  }
  if (/登录|认证|session|unauthenticated|not logged/.test(normalized)) {
    return { kind: "login", message: "登录状态已失效，请重新登录后重试保存。" };
  }
  if (/权限|管理员|forbidden|permission|authorized/.test(normalized)) {
    return { kind: "permission", message: "当前没有保存权限，请确认管理员登录状态。" };
  }
  if (message) return { kind: "server", message: "服务器未能保存最新内容，已保留本地备份。" };
  return { kind: "unknown", message: "保存出现未知问题，内容已保留在本地备份。" };
}

export function EntryEditorForm({ entry, autoFocusTitle = false, studioReturnHref = "/studio/entries" }: EntryEditorFormProps) {
  const initialContent = isEditorDocument(entry.content_json) ? entry.content_json : emptyEditorDocument;
  const initialContentText = entry.content_text ?? editorDocumentToText(initialContent);
  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [type, setType] = useState(entry.type);
  const [summary, setSummary] = useState(entry.summary ?? "");
  const [coverPath, setCoverPath] = useState(entry.cover_path ?? "");
  const [tags, setTags] = useState(entry.tags);
  const [featured, setFeatured] = useState(entry.featured);
  const [featuredOrder, setFeaturedOrder] = useState(entry.featured_order?.toString() ?? "");
  const [metadata, setMetadata] = useState(readMetadata(entry.metadata));
  const [content, setContent] = useState<EditorDocument>(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState(entry.updated_at);
  const [failure, setFailure] = useState<{ kind: SaveFailureKind; message: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const [recoveryBackup, setRecoveryBackup] = useState<DraftBackup | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [otherTabWarning, setOtherTabWarning] = useState(false);
  const [recoveryVersion, setRecoveryVersion] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [entryStatus, setEntryStatus] = useState<EntryRow["status"]>(entry.status);
  const titleInput = useRef<HTMLInputElement>(null);
  const focusEditorAfterReady = useRef(false);
  const editorInstance = useRef<Editor | null>(null);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const saveInFlight = useRef<Promise<boolean> | null>(null);
  const saveQueued = useRef(false);
  const retryAfterReconnect = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const recoveryHandled = useRef(false);
  const tabId = useRef(makeTabId());
  const statusRef = useRef<EntryRow["status"]>(entry.status);
  const serverUpdatedAt = useRef(entry.updated_at);
  const draftKey = `xiaobai-draft:${entry.id}`;

  const snapshotRef = useRef<EditableSnapshot>({
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    type: entry.type,
    summary: entry.summary ?? "",
    cover_path: entry.cover_path ?? "",
    content_json: initialContent,
    content_text: initialContentText,
    tags: entry.tags,
    featured: entry.featured,
    featured_order: entry.featured_order?.toString() ?? "",
    metadata: readMetadata(entry.metadata),
    expected_updated_at: entry.updated_at,
  });

  const clearDebounce = useCallback(() => {
    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const writeBackup = useCallback((syncedAt: string | null) => {
    const backup: DraftBackup = {
      formatVersion: DRAFT_FORMAT_VERSION,
      entryId: entry.id,
      status: statusRef.current,
      snapshot: snapshotRef.current,
      clientUpdatedAt: new Date().toISOString(),
      serverUpdatedAt: serverUpdatedAt.current,
      syncedAt,
      sourceTabId: tabId.current,
    };
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(backup));
      return true;
    } catch {
      return false;
    }
  }, [draftKey, entry.id]);

  const removeBackup = useCallback(() => {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Local storage is an optional safety layer.
    }
  }, [draftKey]);

  const markChanged = useCallback((patch: Partial<EditableSnapshot>) => {
    snapshotRef.current = { ...snapshotRef.current, ...patch };
    revisionRef.current += 1;
    dirtyRef.current = true;
    if (saveInFlight.current) saveQueued.current = true;
    setRevision(revisionRef.current);
    setFailure(null);
    const backedUp = writeBackup(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSaveState(backedUp ? "offline" : "failed");
      if (!backedUp) setFailure({ kind: "network", message: "离线，且本地备份不可用。" });
    } else {
      setSaveState("unsaved");
    }
  }, [writeBackup]);

  const saveLatest = useCallback(async (force = false): Promise<boolean> => {
    clearDebounce();
    if (saveInFlight.current) return saveInFlight.current;
    if (!force && !dirtyRef.current) return true;

    const runQueue = async () => {
      do {
        saveQueued.current = false;
        const savedRevision = revisionRef.current;

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          const backedUp = writeBackup(null);
          dirtyRef.current = true;
          retryAfterReconnect.current = true;
          setFailure({ kind: "network", message: backedUp ? "离线，已在本地备份。" : "离线，且本地备份不可用。" });
          setSaveState(backedUp ? "offline" : "failed");
          return false;
        }

        setSaveState("saving");
        setFailure(null);
        let result: Awaited<ReturnType<typeof saveEditorEntryAction>>;
        try {
          result = await saveEditorEntryAction(normalizeSnapshot(snapshotRef.current));
        } catch (error) {
          const nextFailure = classifySaveFailure(error);
          const backedUp = writeBackup(null);
          dirtyRef.current = true;
          if (nextFailure.kind === "network") retryAfterReconnect.current = true;
          setFailure(backedUp ? nextFailure : { ...nextFailure, message: `${nextFailure.message} 本地备份不可用。` });
          setSaveState(nextFailure.kind === "network" && backedUp ? "offline" : "failed");
          return false;
        }

        if (!result.ok) {
          const nextFailure = classifySaveFailure(result.error);
          const backedUp = writeBackup(null);
          dirtyRef.current = true;
          if (nextFailure.kind === "network") retryAfterReconnect.current = true;
          setFailure(backedUp ? nextFailure : { ...nextFailure, message: `${nextFailure.message} 本地备份不可用。` });
          setSaveState(nextFailure.kind === "network" && backedUp ? "offline" : "failed");
          return false;
        }

        serverUpdatedAt.current = result.updatedAt;
        snapshotRef.current = { ...snapshotRef.current, expected_updated_at: result.updatedAt };
        setLastSavedAt(result.updatedAt);

        if (revisionRef.current !== savedRevision || saveQueued.current) {
          dirtyRef.current = true;
          setSaveState("unsaved");
          writeBackup(null);
          continue;
        }

        dirtyRef.current = false;
        retryAfterReconnect.current = false;
        setSaveState("saved");
        writeBackup(result.updatedAt);
        return true;
      } while (true);
    };

    const pending = runQueue();
    saveInFlight.current = pending;
    try {
      return await pending;
    } finally {
      saveInFlight.current = null;
    }
  }, [clearDebounce, writeBackup]);

  useEffect(() => {
    if (!autoFocusTitle) return;
    const timer = window.setTimeout(() => {
      titleInput.current?.focus();
      titleInput.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoFocusTitle]);

  useEffect(() => {
    if (saveState !== "unsaved") return;
    clearDebounce();
    debounceTimer.current = window.setTimeout(() => { void saveLatest(); }, AUTOSAVE_DELAY);
    return clearDebounce;
  }, [clearDebounce, revision, saveLatest, saveState]);

  useEffect(() => {
    const recovery = readBackup(draftKey, entry.id);
    const notice = recovery.unavailable
      ? "本地草稿不可读取，本次将继续使用服务器内容。"
      : recovery.invalid
        ? "发现无法读取的旧本地草稿，已安全忽略。"
        : null;
    if (notice) {
      const timer = window.setTimeout(() => setRecoveryNotice(notice), 0);
      return () => window.clearTimeout(timer);
    }
    if (!recovery.backup || recovery.backup.syncedAt || recoveryHandled.current) return;
    const localTime = Date.parse(recovery.backup.clientUpdatedAt);
    const serverTime = Date.parse(entry.updated_at);
    if (Number.isFinite(localTime) && Number.isFinite(serverTime) && localTime > serverTime) {
      recoveryHandled.current = true;
      const timer = window.setTimeout(() => setRecoveryBackup(recovery.backup), 0);
      return () => window.clearTimeout(timer);
    }
  }, [draftKey, entry.id, entry.updated_at]);

  useEffect(() => {
    const onOnline = () => {
      if (!retryAfterReconnect.current || !dirtyRef.current) return;
      retryAfterReconnect.current = false;
      void saveLatest(true);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [saveLatest]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== draftKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue) as DraftBackup;
        if (incoming.entryId === entry.id && incoming.sourceTabId !== tabId.current) setOtherTabWarning(true);
      } catch {
        // Another tab can write an invalid old-format value without affecting this editor.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [draftKey, entry.id]);

  useEffect(() => {
    const persistBeforeLeaving = () => {
      if (dirtyRef.current) writeBackup(null);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      persistBeforeLeaving();
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistBeforeLeaving();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [writeBackup]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveLatest(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveLatest]);

  function recoverDraft() {
    if (!recoveryBackup) return;
    setSaveState("recovering");
    const snapshot = { ...recoveryBackup.snapshot, expected_updated_at: serverUpdatedAt.current };
    snapshotRef.current = snapshot;
    setTitle(snapshot.title);
    setSlug(snapshot.slug);
    setType(snapshot.type);
    setSummary(snapshot.summary);
    setCoverPath(snapshot.cover_path);
    setTags(snapshot.tags);
    setFeatured(snapshot.featured);
    setFeaturedOrder(snapshot.featured_order);
    setMetadata(readMetadata(snapshot.metadata));
    setContent(snapshot.content_json);
    setRecoveryVersion((value) => value + 1);
    setRecoveryBackup(null);
    markChanged({});
  }

  function useServerContent() {
    removeBackup();
    setRecoveryBackup(null);
  }

  async function publish() {
    if (isPublishing || entryStatus !== "draft") return;
    clearDebounce();
    setIsPublishing(true);
    const saved = await saveLatest(true);
    if (!saved) {
      setFailure({ kind: "server", message: "最新内容尚未保存，无法发布。" });
      setSaveState("failed");
      setIsPublishing(false);
      return;
    }

    setSaveState("saving");
    let result: Awaited<ReturnType<typeof publishEditorEntryAction>>;
    try {
      result = await publishEditorEntryAction(normalizeSnapshot(snapshotRef.current));
    } catch (error) {
      const nextFailure = classifySaveFailure(error);
      const backedUp = writeBackup(null);
      dirtyRef.current = true;
      setFailure(backedUp ? nextFailure : { ...nextFailure, message: `${nextFailure.message} 本地备份不可用。` });
      setSaveState(nextFailure.kind === "network" && backedUp ? "offline" : "failed");
      setIsPublishing(false);
      return;
    }
    if (!result.ok) {
      const nextFailure = classifySaveFailure(result.error);
      const backedUp = writeBackup(null);
      dirtyRef.current = true;
      setFailure(backedUp ? nextFailure : { ...nextFailure, message: `${nextFailure.message} 本地备份不可用。` });
      setSaveState(nextFailure.kind === "network" && backedUp ? "offline" : "failed");
      setIsPublishing(false);
      return;
    }

    serverUpdatedAt.current = result.updatedAt;
    statusRef.current = result.status ?? "published";
    setEntryStatus(result.status ?? "published");
    snapshotRef.current = { ...snapshotRef.current, expected_updated_at: result.updatedAt };
    setLastSavedAt(result.updatedAt);
    dirtyRef.current = false;
    setSaveState("saved");
    writeBackup(result.updatedAt);
    setIsPublishing(false);
  }

  const update = <K extends keyof EditableSnapshot>(setter: (value: EditableSnapshot[K]) => void, key: K, value: EditableSnapshot[K]) => {
    setter(value);
    markChanged({ [key]: value } as Partial<EditableSnapshot>);
  };

  const busy = saveState === "saving" || isPublishing;

  return (
    <section className="mt-8 max-w-5xl">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {recoveryBackup ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-secondary">
            <span>发现一份尚未同步的本地内容。</span>
            <button type="button" onClick={recoverDraft} className="font-medium text-accent">恢复本地内容</button>
            <button type="button" onClick={useServerContent} className="font-medium text-primary">使用服务器内容</button>
            <button type="button" onClick={() => setRecoveryBackup(null)} className="text-muted">稍后决定</button>
          </div>
        ) : null}
        {recoveryNotice ? <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-secondary">{recoveryNotice}</p> : null}
        {otherTabWarning ? <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-secondary">该内容可能正在另一个标签页编辑，请留意保存版本。</p> : null}
        {failure ? <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{failure.message}</span><button type="button" onClick={() => void saveLatest(true)} disabled={busy} className="font-medium text-accent disabled:opacity-60">重试保存</button></div> : null}

        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <Field label="标题">
              <input
                ref={titleInput}
                value={title}
                onChange={(event) => update(setTitle, "title", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Tab" && !event.shiftKey) {
                    event.preventDefault();
                    if (editorInstance.current) editorInstance.current.commands.focus("start");
                    else focusEditorAfterReady.current = true;
                  }
                }}
                required
                maxLength={120}
                autoFocus={autoFocusTitle}
                placeholder="给这篇内容起个标题"
                className="min-h-14 w-full border-0 border-b border-border bg-transparent px-0 py-2 text-2xl font-semibold tracking-tight text-primary outline-none transition placeholder:text-muted focus:border-accent sm:text-3xl"
              />
            </Field>
            <Field label="内容类型">
              <select value={type} onChange={(event) => update(setType, "type", event.target.value as EntryRow["type"])} className="field-input">
                {Object.entries(entryTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>

          <div className="sticky top-20 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-sm backdrop-blur">
            <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
            {saveState === "failed" || saveState === "offline" ? <button type="button" onClick={() => void saveLatest(true)} disabled={busy} className="text-sm font-medium text-accent disabled:opacity-60">重试保存</button> : null}
          </div>

          <Field label="正文">
            <RichTextEditor
              entryId={entry.id}
              content={content}
              resetVersion={recoveryVersion}
              isProject={type === "project"}
              onEditorReady={(instance) => {
                editorInstance.current = instance;
                if (focusEditorAfterReady.current) {
                  focusEditorAfterReady.current = false;
                  requestAnimationFrame(() => instance.commands.focus("start"));
                }
              }}
              onChange={(json, text) => {
                setContent(json);
                markChanged({ content_json: json, content_text: text });
              }}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <button type="button" onClick={() => void saveLatest(true)} disabled={busy} className="min-h-11 rounded-full border border-border bg-page px-5 py-2 text-sm font-medium text-primary disabled:opacity-60">保存草稿</button>
            {entryStatus === "draft" ? (
            <button type="button" onClick={() => void publish()} disabled={busy} className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60">{isPublishing ? "正在发布…" : "发布（公开）"}</button>
            ) : null}
          </div>

          <details className="rounded-xl border border-border bg-page p-4" open={type === "project"}>
            <summary className="cursor-pointer text-sm font-medium text-primary">更多设置</summary>
            <div className="mt-5 grid gap-5">
              <Field label="摘要"><textarea value={summary} onChange={(event) => update(setSummary, "summary", event.target.value)} maxLength={300} rows={3} className="field-input" /></Field>
              <TagInput tags={tags} onChange={(value) => update(setTags, "tags", value)} />
              <Field label="Slug"><input value={slug} onChange={(event) => update(setSlug, "slug", event.target.value)} required maxLength={120} className="field-input" /></Field>
              <Field label="封面地址"><input value={coverPath} onChange={(event) => update(setCoverPath, "cover_path", event.target.value)} maxLength={2048} className="field-input" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-primary"><input type="checkbox" checked={featured} onChange={(event) => update(setFeatured, "featured", event.target.checked)} /> 设为精选</label>
                <Field label="精选顺序"><input value={featuredOrder} type="number" onChange={(event) => update(setFeaturedOrder, "featured_order", event.target.value)} className="field-input" /></Field>
              </div>
              {type === "project" ? <ProjectFields metadata={metadata} onChange={(value) => update(setMetadata, "metadata", value)} /> : null}
              <p className="text-xs text-muted">创建于 {formatDate(entry.created_at)}；最近服务器保存于 {formatDate(lastSavedAt)}。</p>
            </div>
            <div className="border-t border-border pt-5">
                <EntryLifecycleActions entry={{ id: entry.id, title, slug, type, status: entryStatus, featured, created_at: entry.created_at, updated_at: lastSavedAt, published_at: entry.published_at }} afterDeleteHref={studioReturnHref} onStatusChanged={(status) => { statusRef.current = status; setEntryStatus(status); }} />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-primary"><span>{label}</span>{children}</label>;
}

function SaveIndicator({ state, lastSavedAt }: { state: SaveState; lastSavedAt: string }) {
  const details: Record<SaveState, { icon: string; label: string; className: string }> = {
    unsaved: { icon: "●", label: "未保存", className: "text-amber-700" },
    saving: { icon: "◌", label: "正在保存…", className: "text-secondary" },
    saved: { icon: "✓", label: `${formatDate(lastSavedAt)} 已保存`, className: "text-muted" },
    failed: { icon: "!", label: "保存失败", className: "text-red-700" },
    offline: { icon: "○", label: "离线，已在本地备份", className: "text-amber-700" },
    recovering: { icon: "◌", label: "正在恢复…", className: "text-secondary" },
  };
  const current = details[state];
  return <span role="status" className={`text-sm ${current.className}`}><span aria-hidden="true">{current.icon} </span>{current.label}</span>;
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const next = value.trim();
    if (next && !tags.includes(next) && tags.length < 16) onChange([...tags, next]);
    setValue("");
  };
  return <Field label="标签"><div className="rounded-xl border border-border bg-surface p-3"><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => onChange(tags.filter((item) => item !== tag))} className="rounded-full bg-subtle px-3 py-1 text-xs text-secondary">{tag} ×</button>)}</div><div className="mt-2 flex gap-2"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); } }} placeholder="输入标签后按回车" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={add} className="text-sm font-medium text-accent">添加</button></div></div></Field>;
}

function readMetadata(value: unknown): Metadata {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Metadata : {};
}

function ProjectFields({ metadata, onChange }: { metadata: Metadata; onChange: (metadata: Metadata) => void }) {
  const change = (key: keyof Metadata, value: string) => onChange({ ...metadata, [key]: value || null });
  return <div className="rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold text-primary">项目设置</h2><div className="mt-5 grid gap-4"><Field label="项目状态"><select value={metadata.projectStatus ?? "idea"} onChange={(event) => change("projectStatus", event.target.value)} className="field-input">{Object.entries(projectStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="开始时间"><input type="date" value={metadata.startDate ?? ""} onChange={(event) => change("startDate", event.target.value)} className="field-input" /></Field><Field label="结束时间"><input type="date" value={metadata.endDate ?? ""} onChange={(event) => change("endDate", event.target.value)} className="field-input" /></Field></div><Field label="技术栈"><input value={(metadata.techStack ?? []).join(", ")} onChange={(event) => onChange({ ...metadata, techStack: event.target.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean) })} className="field-input" /></Field><Field label="仓库地址"><input type="url" value={metadata.repositoryUrl ?? ""} onChange={(event) => change("repositoryUrl", event.target.value)} className="field-input" /></Field></div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
