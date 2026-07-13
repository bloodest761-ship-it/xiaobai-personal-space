import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { hasPublicSupabaseEnv, getPublicEnv } from "@/lib/env";
import type { EntryRow } from "@/lib/admin-entries";
import type { ContentCategory, ContentType, Entry, Project, ProjectStatus } from "@/types/content";
import type { Database, Json } from "@/types/database";

export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;
const HOME_LIMIT = 20;
const LIST_LIMIT = 20;

export const categories: ContentCategory[] = [
  { type: "reflection", name: "心得", description: "记录学习和实践之后，认知发生变化的过程。", href: "/space/reflection" },
  { type: "essay", name: "随笔", description: "保存尚未完全成熟，但值得留下的个人思考。", href: "/space/essay" },
  { type: "project", name: "项目", description: "展示项目目标、过程、问题、调整和当前成果。", href: "/space/project" },
  { type: "understanding", name: "理解", description: "用自己的语言重新解释学过的知识。", href: "/space/understanding" },
];

const listColumns = "title,slug,type,summary,cover_path,tags,created_at,updated_at,published_at,featured,featured_order";
const detailColumns = `${listColumns},content_json,content_text,metadata`;

export type HomeContent = {
  featuredEntries: Entry[];
  featuredProjects: Project[];
  latestUpdates: Array<Entry | Project>;
};

export type CategoryStats = { count: number; latestTitle: string; updatedAt?: string };

export function getCategory(type: ContentType) {
  return categories.find((category) => category.type === type);
}

export function isContentType(value: string): value is ContentType {
  return categories.some((category) => category.type === value);
}

export async function getHomeContent(): Promise<HomeContent> {
  return getCachedHomeContent();
}

export function getEntriesByType(type: "project", limit?: number): Promise<Project[]>;
export function getEntriesByType(type: Exclude<ContentType, "project">, limit?: number): Promise<Entry[]>;
export async function getEntriesByType(type: ContentType, limit = LIST_LIMIT): Promise<Entry[] | Project[]> {
  const safeLimit = normalizeLimit(limit);
  return getCachedEntriesByType(type, safeLimit)();
}

export async function getProjects(limit = LIST_LIMIT) {
  return getEntriesByType("project", limit);
}

export async function getEntryBySlug(slug: string) {
  const row = await getPublicEntryRow(slug);
  return row && row.type !== "project" ? rowToEntry(row, true) : null;
}

export async function getProjectBySlug(slug: string) {
  const row = await getPublicEntryRow(slug);
  return row?.type === "project" ? rowToProject(row, true) : null;
}

const getPublicEntryRow = cache(async (slug: string) => getCachedEntryBySlug(slug)());

export async function getEntryNavigation(entry: Entry) {
  return getCachedEntryNavigation(entry.slug, entry.publishedAt)();
}

export async function getCategoryStats(type: ContentType): Promise<CategoryStats> {
  return getCachedCategoryStats(type)();
}

const getCachedHomeContent = unstable_cache(
  async (): Promise<HomeContent> => {
    const supabase = createPublicClient();
    if (!supabase) return { featuredEntries: [], featuredProjects: [], latestUpdates: [] };

    const { data } = await supabase
      .from("entries")
      .select(listColumns)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(HOME_LIMIT);

    const rows = (data ?? []) as EntryRow[];
    const latestUpdates = rows.slice(0, 5).map(rowToListContent);
    const featured = rows.filter((row) => row.featured).sort(sortFeatured);

    return {
      featuredEntries: featured.filter((row) => row.type !== "project").slice(0, 4).map((row) => rowToEntry(row, false)),
      featuredProjects: featured.filter((row) => row.type === "project").slice(0, 4).map((row) => rowToProject(row, false)),
      latestUpdates,
    };
  },
  ["public-content", "home"],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content", "home"] },
);

function getCachedEntriesByType(type: ContentType, limit: number) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return [] as Entry[] | Project[];
      const { data } = await supabase
        .from("entries")
        .select(listColumns)
        .eq("status", "published")
        .eq("type", type)
        .is("deleted_at", null)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      const rows = (data ?? []) as EntryRow[];
      return type === "project" ? rows.map((row) => rowToProject(row, false)) : rows.map((row) => rowToEntry(row, false));
    },
    ["public-content", "list", type, String(limit)],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content", `list:${type}`] },
  );
}

function getCachedEntryBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return null;
      const { data } = await supabase
        .from("entries")
        .select(detailColumns)
        .eq("slug", slug)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle();
      return (data ?? null) as EntryRow | null;
    },
    ["public-content", "detail", slug],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content", `entry:${slug}`] },
  );
}

function getCachedEntryNavigation(slug: string, publishedAt: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return { previous: undefined, next: undefined };
      const baseQuery = () => supabase.from("entries").select(listColumns).eq("status", "published").neq("type", "project").is("deleted_at", null);
      const [older, newer] = await Promise.all([
        baseQuery().lt("published_at", publishedAt).order("published_at", { ascending: false }).limit(1).maybeSingle(),
        baseQuery().gt("published_at", publishedAt).order("published_at", { ascending: true }).limit(1).maybeSingle(),
      ]);
      return {
        previous: older.data ? rowToEntry(older.data as EntryRow, false) : undefined,
        next: newer.data ? rowToEntry(newer.data as EntryRow, false) : undefined,
      };
    },
    ["public-content", "navigation", slug, publishedAt],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content", `entry:${slug}`] },
  );
}

function getCachedCategoryStats(type: ContentType) {
  return unstable_cache(
    async (): Promise<CategoryStats> => {
      const supabase = createPublicClient();
      if (!supabase) return { count: 0, latestTitle: "暂无内容" };
      const { data, count } = await supabase
        .from("entries")
        .select("title,updated_at", { count: "exact" })
        .eq("status", "published")
        .eq("type", type)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);
      const latest = data?.[0];
      return { count: count ?? 0, latestTitle: latest?.title ?? "暂无内容", updatedAt: latest?.updated_at };
    },
    ["public-content", "category-stats", type],
    { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content", `list:${type}`] },
  );
}

function createPublicClient() {
  if (!hasPublicSupabaseEnv()) return null;
  const env = getPublicEnv();
  return createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function rowToListContent(row: EntryRow): Entry | Project {
  return row.type === "project" ? rowToProject(row, false) : rowToEntry(row, false);
}

function rowToEntry(row: EntryRow, includeBody: boolean): Entry {
  return {
    slug: row.slug,
    type: row.type === "project" ? "reflection" : row.type,
    title: row.title,
    summary: row.summary ?? "",
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags,
    featured: row.featured,
    cover: row.cover_path ? { src: row.cover_path, alt: row.title } : undefined,
    body: includeBody ? textToParagraphs(row.content_text) : [],
    contentJson: includeBody ? row.content_json : undefined,
  };
}

function rowToProject(row: EntryRow, includeBody: boolean): Project {
  const metadata = includeBody ? normalizeMetadata(row.metadata) : { projectStatus: "idea" as ProjectStatus, startDate: null, techStack: [] };
  const paragraphs = includeBody ? textToParagraphs(row.content_text) : [];
  return {
    slug: row.slug,
    type: "project",
    name: row.title,
    title: row.title,
    summary: row.summary ?? "",
    status: metadata.projectStatus,
    startedAt: metadata.startDate ?? row.created_at,
    updatedAt: row.updated_at,
    techStack: metadata.techStack,
    featured: row.featured,
    cover: { src: row.cover_path || "/images/cover-vision.svg", alt: row.title },
    gallery: [],
    contentJson: includeBody ? row.content_json : undefined,
    sections: { background: paragraphs, goals: [], process: [], problems: [], adjustments: [], result: [], learnings: [], nextSteps: [] },
  };
}

function textToParagraphs(text: string | null) {
  return (text ?? "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function normalizeMetadata(value: Json) {
  const record = isRecord(value) ? value : {};
  return {
    projectStatus: normalizeProjectStatus(record.projectStatus),
    startDate: asString(record.startDate),
    techStack: Array.isArray(record.techStack) ? record.techStack.filter((item): item is string => typeof item === "string") : [],
  };
}

function normalizeProjectStatus(value: Json | undefined): ProjectStatus {
  return value === "idea" || value === "in_progress" || value === "iterating" || value === "completed" || value === "paused" ? value : "idea";
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: Json | undefined) {
  return typeof value === "string" && value ? value : null;
}

function sortFeatured(left: EntryRow, right: EntryRow) {
  const leftOrder = left.featured_order ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.featured_order ?? Number.MAX_SAFE_INTEGER;
  return leftOrder === rightOrder
    ? new Date(right.published_at ?? 0).getTime() - new Date(left.published_at ?? 0).getTime()
    : leftOrder - rightOrder;
}

function normalizeLimit(limit: number) {
  return Math.max(1, Math.min(Math.floor(limit), LIST_LIMIT));
}
