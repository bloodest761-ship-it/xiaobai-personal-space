"use server";

import { deleteDraftEntry, publishEntry, unpublishEntry, type EntryRow } from "@/lib/admin-entries";
import { revalidateEntryViews } from "@/lib/entry-revalidation";
import { entryIdSchema } from "@/lib/validation/entry";

export type LifecycleActionResult =
  | { ok: true; entry: Pick<EntryRow, "id" | "status" | "updated_at"> }
  | { ok: false; error: string };

async function runLifecycle(
  id: unknown,
  operation: (entryId: string) => ReturnType<typeof publishEntry>,
): Promise<LifecycleActionResult> {
  const parsed = entryIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "内容标识无效，请刷新列表后重试。" };

  const result = await operation(parsed.data);
  if (result.error || !result.data) return { ok: false, error: result.error ?? "操作失败，请稍后重试。" };
  revalidateEntryViews(result.data);
  return { ok: true, entry: { id: result.data.id, status: result.data.status, updated_at: result.data.updated_at } };
}

export async function publishEntryLifecycleAction(id: unknown) {
  return await runLifecycle(id, publishEntry);
}

export async function withdrawEntryLifecycleAction(id: unknown) {
  return await runLifecycle(id, unpublishEntry);
}

export async function deleteDraftLifecycleAction(id: unknown) {
  return await runLifecycle(id, deleteDraftEntry);
}
