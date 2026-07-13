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

const defaultTitles: Record<EntryType, string> = {
  reflection: "未命名心得",
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
  return updateEntryStatus(id, {
    status: "published",
    publishedAt: "first-publish",
    deletedAt: "keep",
  });
}

export async function unpublishEntry(id: string): Promise<DataResult<EntryRow>> {
  return updateEntryStatus(id, {
    status: "draft",
    publishedAt: "keep",
    deletedAt: "keep",
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

  const { data, error } = await supabase
    .from("entries")
    .update(patch)
    .eq("id", id)
    .select(entryColumns)
    .single();

  if (error || !data) {
    return { data: null, error: mapDatabaseError(error) };
  }

  return { data, error: null };
}

async function requireAdmin(): Promise<DataResult<{ userId: string }>> {
  const adminState = await getCurrentAdminState();

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
