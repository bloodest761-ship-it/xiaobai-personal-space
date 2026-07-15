import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAdminState } from "@/lib/auth/admin";
import type { Database, Json } from "@/types/database";
import type { EditorEntryInput, EntryFormInput, NewEntryInput } from "@/lib/validation/entry";

export type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
export type EntryType = EntryRow["type"];
export type EntryStatus = EntryRow["status"];

type DataResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

type EntryListFilters = {
  query?: string;
  type?: EntryType | "all";
  status?: EntryStatus | "all";
  deleted?: "include" | "only" | "exclude";
  limit?: number;
  offset?: number;
};

const entryColumns =
  "id,title,slug,type,status,summary,content_json,content_text,cover_path,tags,featured,featured_order,metadata,created_by,created_at,updated_at,published_at,deleted_at";
const entryListColumns =
  "id,title,slug,type,status,summary,cover_path,tags,featured,featured_order,created_by,created_at,updated_at,published_at,deleted_at";

export const DEFAULT_WRITING_DRAFT_TITLE = "未命名心得";

const defaultTitles: Record<EntryType, string> = {
  reflection: DEFAULT_WRITING_DRAFT_TITLE,
  essay: "未命名随笔",
  project: "未命名项目",
  understanding: "未命名理解",
};

export async function getAdminEntries(
  filters: EntryListFilters = {},
): Promise<DataResult<EntryRow[]>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以读取后台内容。" };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("entries").select(entryListColumns);

  if (filters.deleted === "only") {
    query = query.not("deleted_at", "is", null);
  } else if (filters.deleted !== "include") {
    query = query.is("deleted_at", null);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    query = query.or(`title.ilike.${pattern},summary.ilike.${pattern},content_text.ilike.${pattern}`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const offset = Math.max(filters.offset ?? 0, 0);
  const { data, error } = await query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    return { data: null, error: "后台内容暂时无法读取。" };
  }

  return { data: (data ?? []) as EntryRow[], error: null };
}

export async function getEntryById(id: string): Promise<DataResult<EntryRow>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以读取后台内容。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .select(entryColumns)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { data: null, error: "没有找到这条内容。" };
  }

  return { data, error: null };
}

export async function createEntry(input: NewEntryInput): Promise<DataResult<EntryRow>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以创建内容。" };
  }

  const now = Date.now();
  const title = defaultTitles[input.type];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      title,
      slug: `${slugify(title)}-${now}`,
      type: input.type,
      status: "draft",
      summary: null,
      content_json: textToTiptapJson(""),
      content_text: "",
      cover_path: null,
      tags: [],
      featured: false,
      featured_order: null,
      metadata: defaultMetadata(input.type),
      created_by: admin.data.userId,
    })
    .select(entryColumns)
    .single();

  if (error || !data) {
    return { data: null, error: mapDatabaseError(error) };
  }

  return { data, error: null };
}

/**
 * The one-click writing route reuses its unfinished default reflection draft.
 * A visit never creates another row while that empty draft still exists.
 */
export async function getOrCreateWritingDraft(): Promise<DataResult<EntryRow>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以开始写作。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: reusableDrafts, error: reusableDraftError } = await supabase
    .from("entries")
    .select(entryColumns)
    .eq("created_by", admin.data.userId)
    .eq("type", "reflection")
    .eq("status", "draft")
    .eq("title", DEFAULT_WRITING_DRAFT_TITLE)
    .eq("content_text", "")
    .is("summary", null)
    .is("cover_path", null)
    .eq("featured", false)
    .is("featured_order", null)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (reusableDraftError) {
    return { data: null, error: "无法检查可继续编辑的草稿。" };
  }

  const reusableDraft = (reusableDrafts ?? []).find(isEmptyWritingDraft);

  if (reusableDraft) {
    return { data: reusableDraft, error: null };
  }

  return createEntry({ type: "reflection" });
}

function isEmptyWritingDraft(entry: EntryRow) {
  if (entry.tags.length > 0 || !isEmptyEditorDocument(entry.content_json)) return false;
  return true;
}

function isEmptyEditorDocument(value: Json) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const document = value as Record<string, Json | undefined>;
  return document.type === "doc" && Array.isArray(document.content) && document.content.length === 0;
}

export async function updateEntry(input: EntryFormInput): Promise<DataResult<EntryRow>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以更新内容。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .update({
      title: input.title,
      slug: input.slug,
      type: input.type,
      summary: input.summary || null,
      content_json: textToTiptapJson(input.content_text ?? ""),
      content_text: input.content_text ?? "",
      tags: input.tags,
      featured: input.featured,
      featured_order: input.featured_order,
      metadata: input.type === "project" ? input.metadata : {},
    })
    .eq("id", input.id)
    .select(entryColumns)
    .single();

  if (error || !data) {
    return { data: null, error: mapDatabaseError(error) };
  }

  return { data, error: null };
}

export async function updateEditorEntry(input: EditorEntryInput): Promise<DataResult<EntryRow>> {
  const admin = await requireAdmin();

  if (admin.error || !admin.data) {
    return { data: null, error: admin.error ?? "只有管理员可以更新内容。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .update({
      title: input.title,
      slug: input.slug,
      type: input.type,
      summary: input.summary || null,
      cover_path: input.cover_path,
      content_json: input.content_json as Json,
      content_text: input.content_text ?? "",
      tags: input.tags,
      featured: input.featured,
      featured_order: input.featured_order,
      metadata: input.type === "project" ? input.metadata : {},
    })
    .eq("id", input.id)
    .eq("updated_at", input.expected_updated_at)
    .select(entryColumns)
    .maybeSingle();

  if (error || !data) {
    return { data: null, error: error ? mapDatabaseError(error) : "内容已在其他保存请求中更新，请保留本地副本后刷新页面。" };
  }

  return { data, error: null };
}

export async function publishEntry(id: string): Promise<DataResult<EntryRow>> {
  const existing = await getEntryById(id);
  if (existing.error || !existing.data) return { data: null, error: existing.error ?? "没有找到这条内容。" };
  if (existing.data.status !== "draft") return { data: null, error: "只有草稿可以发布，请刷新列表后重试。" };
  if (!isPublishable(existing.data)) return { data: null, error: "请先填写标题和正文，再发布内容。" };
  return updateEntryStatus(id, {
    status: "published",
    publishedAt: "first-publish",
    deletedAt: "keep",
    expectedStatus: "draft",
  });
}

export async function unpublishEntry(id: string): Promise<DataResult<EntryRow>> {
  const existing = await getEntryById(id);
  if (existing.error || !existing.data) return { data: null, error: existing.error ?? "没有找到这条内容。" };
  if (existing.data.status !== "published") return { data: null, error: "只有已发布内容可以撤回，请刷新列表后重试。" };
  return updateEntryStatus(id, {
    status: "draft",
    publishedAt: "keep",
    deletedAt: "keep",
    expectedStatus: "published",
  });
}

export async function archiveEntry(id: string): Promise<DataResult<EntryRow>> {
  return updateEntryStatus(id, {
    status: "archived",
    publishedAt: "keep",
    deletedAt: "keep",
  });
}

export async function softDeleteEntry(id: string): Promise<DataResult<EntryRow>> {
  return updateEntryStatus(id, {
    publishedAt: "keep",
    deletedAt: "now",
  });
}

/** Permanently delete drafts only. Storage assets intentionally remain untouched. */
export async function deleteDraftEntry(id: string): Promise<DataResult<EntryRow>> {
  const existing = await getEntryById(id);
  if (existing.error || !existing.data) return { data: null, error: existing.error ?? "内容已被删除或状态已改变，请刷新列表。" };
  if (existing.data.status !== "draft" || existing.data.deleted_at) {
    return { data: null, error: "已发布内容必须先撤回；只有草稿可以永久删除。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("status", "draft")
    .is("deleted_at", null)
    .select(entryColumns)
    .maybeSingle();
  if (error || !data) return { data: null, error: error ? mapDatabaseError(error) : "内容已被删除或状态已改变，请刷新列表。" };
  return { data, error: null };
}

export async function restoreEntry(id: string): Promise<DataResult<EntryRow>> {
  return updateEntryStatus(id, {
    publishedAt: "keep",
    deletedAt: "clear",
  });
}

async function updateEntryStatus(
  id: string,
  options: {
    status?: EntryStatus;
    publishedAt: "keep" | "first-publish";
    deletedAt: "keep" | "now" | "clear";
    expectedStatus?: EntryStatus;
  },
): Promise<DataResult<EntryRow>> {
  const existing = await getEntryById(id);

  if (existing.error || !existing.data) {
    return { data: null, error: existing.error ?? "没有找到这条内容。" };
  }

  const supabase = await createSupabaseServerClient();
  const patch: Database["public"]["Tables"]["entries"]["Update"] = {};

  if (options.status) {
    patch.status = options.status;
  }

  if (options.publishedAt === "first-publish" && !existing.data.published_at) {
    patch.published_at = new Date().toISOString();
  }

  if (options.deletedAt === "now") {
    patch.deleted_at = new Date().toISOString();
  } else if (options.deletedAt === "clear") {
    patch.deleted_at = null;
  }

  let mutation = supabase.from("entries").update(patch).eq("id", id);
  if (options.expectedStatus) mutation = mutation.eq("status", options.expectedStatus);
  const { data, error } = await mutation.select(entryColumns).maybeSingle();

  if (error || !data) {
    return { data: null, error: error ? mapDatabaseError(error) : "内容状态已改变，请刷新列表后重试。" };
  }

  return { data, error: null };
}

function isPublishable(entry: EntryRow) {
  return entry.title.trim().length > 0 && (entry.content_text?.trim().length ?? 0) > 0;
}

async function requireAdmin(): Promise<DataResult<{ userId: string }>> {
  const adminState = await getCurrentAdminState();

  if (adminState.status === "unauthenticated") {
    return { data: null, error: "登录已失效，请重新登录后再试。" };
  }

  if (adminState.status === "not-admin") {
    return { data: null, error: "你没有管理内容的权限。" };
  }

  if (adminState.status === "missing-env") {
    return { data: null, error: "后台配置暂不可用，请稍后再试。" };
  }

  if (adminState.status !== "admin") {
    return { data: null, error: "只有管理员可以操作后台内容。" };
  }

  return { data: { userId: adminState.user.id }, error: null };
}

function defaultMetadata(type: EntryType): Json {
  if (type !== "project") {
    return {};
  }

  return {
    projectStatus: "idea",
    startDate: null,
    endDate: null,
    techStack: [],
    repositoryUrl: null,
    demoUrl: null,
  };
}

export function textToTiptapJson(text: string): Json {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    })),
  };
}

export function normalizeTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "entry";
}

function mapDatabaseError(error: { code?: string; message?: string } | null) {
  if (error?.code === "23505") {
    return "Slug 已经存在，请换一个。";
  }

  return "内容保存失败，请检查输入后重试。";
}
