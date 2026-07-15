"use server";

import { getEntryById, publishEntry, updateEditorEntry, type EntryRow } from "@/lib/admin-entries";
import { revalidateEntryViews } from "@/lib/entry-revalidation";
import { editorEntryInputSchema } from "@/lib/validation/entry";
import type { Json } from "@/types/database";

type EditorActionResult =
  | { ok: true; updatedAt: string; status?: EntryRow["status"] }
  | { ok: false; error: string };

export async function saveEditorEntryAction(payload: unknown): Promise<EditorActionResult> {
  const parsed = editorEntryInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "编辑内容无效。" };

  const existing = await getEntryById(parsed.data.id);
  if (existing.error || !existing.data) return { ok: false, error: existing.error ?? "找不到内容。" };

  if (existing.data.updated_at !== parsed.data.expected_updated_at) {
    return { ok: false, error: "内容已被较新的保存请求更新，请刷新后重试。" };
  }

  const result = await updateEditorEntry({
    ...parsed.data,
    content_json: restoreMissingNodeAttributes(existing.data.content_json, parsed.data.content_json),
  });
  if (result.error || !result.data) return { ok: false, error: result.error ?? "保存失败。" };

  revalidateEntryViews(result.data, existing.data.slug);
  return { ok: true, updatedAt: result.data.updated_at, status: result.data.status };
}

const attributeNodes = new Set(["callout", "insightShift", "imageFigure", "projectOverview"]);

function restoreMissingNodeAttributes(previous: Json, next: unknown): Json {
  if (!isRecord(previous) || !isRecord(next)) return next as Json;
  const merged = structuredClone(next) as Record<string, unknown>;
  const previousContent = Array.isArray(previous.content) ? previous.content : [];
  const nextContent = Array.isArray(merged.content) ? merged.content : [];
  const queues = new Map<string, Json[]>();

  for (const value of previousContent) {
    if (!isRecord(value) || typeof value.type !== "string" || !attributeNodes.has(value.type)) continue;
    queues.set(value.type, [...(queues.get(value.type) ?? []), value]);
  }

  for (const value of nextContent) {
    if (!isRecord(value) || typeof value.type !== "string" || !attributeNodes.has(value.type)) continue;
    const previousNode = queues.get(value.type)?.shift();
    const previousAttrs = isRecord(previousNode) ? previousNode.attrs : undefined;
    if (!isRecord(previousAttrs)) continue;
    if (!isRecord(value.attrs) || Object.keys(value.attrs).length === 0) value.attrs = previousAttrs;
  }

  return merged as Json;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function publishEditorEntryAction(payload: unknown): Promise<EditorActionResult> {
  const saved = await saveEditorEntryAction(payload);
  if (!saved.ok) return saved;

  const parsed = editorEntryInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "编辑内容无效。" };
  const result = await publishEntry(parsed.data.id);
  if (result.error || !result.data) return { ok: false, error: result.error ?? "发布失败。" };

  revalidateEntryViews(result.data, parsed.data.slug);
  return { ok: true, updatedAt: result.data.updated_at, status: result.data.status };
}
