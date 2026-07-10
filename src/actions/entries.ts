"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveEntry,
  createEntry,
  getEntryById,
  normalizeTags,
  publishEntry,
  restoreEntry,
  softDeleteEntry,
  unpublishEntry,
  updateEntry,
} from "@/lib/admin-entries";
import { entryFormInputSchema, entryIdSchema, newEntryInputSchema } from "@/lib/validation/entry";
import type { EntryRow } from "@/lib/admin-entries";

export async function createEntryAction(formData: FormData) {
  const parsed = newEntryInputSchema.safeParse({
    type: formData.get("type"),
  });

  if (!parsed.success) {
    redirect(`/studio/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "无法创建内容。")}`);
  }

  const result = await createEntry(parsed.data);

  if (result.error || !result.data) {
    redirect(`/studio/new?error=${encodeURIComponent(result.error ?? "无法创建内容。")}`);
  }

  revalidateStudio();
  redirect(`/studio/edit/${result.data.id}?created=1`);
}

export async function updateEntryAction(formData: FormData) {
  const id = requireEntryId(formData, "/studio/entries");
  const existing = await getEntryById(id);

  if (existing.error || !existing.data) {
    redirect(`/studio/entries?error=${encodeURIComponent(existing.error ?? "没有找到这条内容。")}`);
  }

  const parsed = entryFormInputSchema.safeParse({
    id,
    title: formData.get("title"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    summary: nullableText(formData.get("summary")),
    content_text: nullableText(formData.get("content_text")),
    tags: normalizeTags(String(formData.get("tags") ?? "")),
    featured: formData.get("featured") === "on",
    featured_order: nullableNumber(formData.get("featured_order")),
    metadata: {
      projectStatus: nullableText(formData.get("projectStatus")) ?? undefined,
      startDate: nullableText(formData.get("startDate")),
      endDate: nullableText(formData.get("endDate")),
      techStack: normalizeTags(String(formData.get("techStack") ?? "")),
      repositoryUrl: nullableText(formData.get("repositoryUrl")),
      demoUrl: nullableText(formData.get("demoUrl")),
    },
  });

  if (!parsed.success) {
    redirect(
      `/studio/edit/${id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "输入不完整。")}`,
    );
  }

  const result = await updateEntry(parsed.data);

  if (result.error || !result.data) {
    redirect(`/studio/edit/${id}?error=${encodeURIComponent(result.error ?? "保存失败。")}`);
  }

  revalidateEntry(result.data, existing.data.slug);
  redirect(`/studio/edit/${result.data.id}?saved=1`);
}

export async function publishEntryAction(formData: FormData) {
  await runLifecycleAction(formData, publishEntry, "published=1", "发布失败。");
}

export async function unpublishEntryAction(formData: FormData) {
  await runLifecycleAction(formData, unpublishEntry, "unpublished=1", "撤回失败。");
}

export async function archiveEntryAction(formData: FormData) {
  await runLifecycleAction(formData, archiveEntry, "archived=1", "归档失败。");
}

export async function softDeleteEntryAction(formData: FormData) {
  const id = requireEntryId(formData, "/studio/entries");
  const existing = await getEntryById(id);

  if (existing.error || !existing.data) {
    redirect(`/studio/entries?error=${encodeURIComponent(existing.error ?? "没有找到这条内容。")}`);
  }

  const result = await softDeleteEntry(id);

  if (result.error || !result.data) {
    redirect(`/studio/edit/${id}?error=${encodeURIComponent(result.error ?? "删除失败。")}`);
  }

  revalidateEntry(result.data, existing.data.slug);
  redirect("/studio/entries?deleted=1");
}

export async function restoreEntryAction(formData: FormData) {
  const id = requireEntryId(formData, "/studio/trash");
  const existing = await getEntryById(id);

  if (existing.error || !existing.data) {
    redirect(`/studio/trash?error=${encodeURIComponent(existing.error ?? "没有找到这条内容。")}`);
  }

  const result = await restoreEntry(id);

  if (result.error || !result.data) {
    redirect(`/studio/trash?error=${encodeURIComponent(result.error ?? "恢复失败。")}`);
  }

  revalidateEntry(result.data, existing.data.slug);
  redirect("/studio/trash?restored=1");
}

async function runLifecycleAction(
  formData: FormData,
  action: (id: string) => Promise<{ data: EntryRow | null; error: string | null }>,
  successQuery: string,
  fallbackError: string,
) {
  const id = requireEntryId(formData, "/studio/entries");
  const existing = await getEntryById(id);

  if (existing.error || !existing.data) {
    redirect(`/studio/entries?error=${encodeURIComponent(existing.error ?? "没有找到这条内容。")}`);
  }

  const result = await action(id);

  if (result.error || !result.data) {
    redirect(`/studio/edit/${id}?error=${encodeURIComponent(result.error ?? fallbackError)}`);
  }

  revalidateEntry(result.data, existing.data.slug);
  redirect(`/studio/edit/${id}?${successQuery}`);
}

function requireEntryId(formData: FormData, errorPath: "/studio/entries" | "/studio/trash") {
  const parsed = entryIdSchema.safeParse(formData.get("id"));

  if (!parsed.success) {
    redirect(`${errorPath}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid entry ID.")}`);
  }

  return parsed.data;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function revalidateEntry(entry: EntryRow, previousSlug?: string) {
  revalidateStudio();
  revalidatePath("/");
  revalidatePath("/space");
  revalidatePath(`/space/${entry.type}`);

  const currentPath = entry.type === "project" ? `/project/${entry.slug}` : `/entry/${entry.slug}`;
  revalidatePath(currentPath);

  if (previousSlug && previousSlug !== entry.slug) {
    revalidatePath(entry.type === "project" ? `/project/${previousSlug}` : `/entry/${previousSlug}`);
  }
}

function revalidateStudio() {
  revalidatePath("/studio");
  revalidatePath("/studio/entries");
  revalidatePath("/studio/trash");
}
