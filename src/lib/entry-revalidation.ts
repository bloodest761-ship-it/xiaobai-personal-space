import { revalidatePath, revalidateTag } from "next/cache";
import type { EntryRow } from "@/lib/admin-entries";

/** Refresh every public view that can expose an entry, plus Studio. */
export function revalidateEntryViews(entry: EntryRow, previousSlug?: string) {
  revalidateTag("public-content", "max");
  revalidateTag("home", "max");
  revalidateTag(`list:${entry.type}`, "max");
  revalidateTag(`entry:${entry.slug}`, "max");
  if (previousSlug && previousSlug !== entry.slug) {
    revalidateTag(`entry:${previousSlug}`, "max");
  }

  revalidateStudioViews();
  revalidatePath("/");
  revalidatePath("/space");
  revalidatePath(`/space/${entry.type}`);
  revalidatePath(entry.type === "project" ? `/project/${entry.slug}` : `/entry/${entry.slug}`);

  if (previousSlug && previousSlug !== entry.slug) {
    revalidatePath(entry.type === "project" ? `/project/${previousSlug}` : `/entry/${previousSlug}`);
  }
}

export function revalidateStudioViews() {
  revalidatePath("/studio");
  revalidatePath("/studio/entries");
  // Keep the pre-existing trash route coherent without extending its feature set.
  revalidatePath("/studio/trash");
}
