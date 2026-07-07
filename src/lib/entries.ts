import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAdminState } from "@/lib/auth/admin";
import type { Database } from "@/types/database";

type EntryRow = Database["public"]["Tables"]["entries"]["Row"];

type DataResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

const entryColumns =
  "id,title,slug,type,status,summary,content_json,content_text,cover_path,tags,featured,featured_order,metadata,created_by,created_at,updated_at,published_at,deleted_at";

export async function getPublishedEntries(): Promise<DataResult<EntryRow[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .select(entryColumns)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) {
      return { data: null, error: "公开内容暂时无法读取。" };
    }

    return { data: data ?? [], error: null };
  } catch {
    return { data: null, error: "公开内容暂时无法读取，请检查 Supabase 环境配置。" };
  }
}

export async function getPublishedEntryBySlug(slug: string): Promise<DataResult<EntryRow>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .select(entryColumns)
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) {
      return { data: null, error: "没有找到已发布内容。" };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: "公开内容暂时无法读取，请检查 Supabase 环境配置。" };
  }
}

export async function getAdminEntries(): Promise<DataResult<EntryRow[]>> {
  const adminState = await getCurrentAdminState();

  if (adminState.status !== "admin") {
    return { data: null, error: "只有管理员可以读取后台内容。" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .select(entryColumns)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: null, error: "后台内容暂时无法读取。" };
  }

  return { data: data ?? [], error: null };
}

export async function getEntryById(id: string): Promise<DataResult<EntryRow>> {
  const adminState = await getCurrentAdminState();

  if (adminState.status !== "admin") {
    return { data: null, error: "只有管理员可以读取后台内容。" };
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
