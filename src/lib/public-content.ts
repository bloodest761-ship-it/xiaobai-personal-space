import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPublicSupabaseEnv } from "@/lib/env";
import type { EntryRow } from "@/lib/admin-entries";
import type { ContentCategory, ContentType, Entry, Project, ProjectStatus } from "@/types/content";
import type { Json } from "@/types/database";

export const categories: ContentCategory[] = [
  {
    type: "reflection",
    name: "心得",
    description: "记录学习和实践之后，认知发生变化的过程。",
    href: "/space/reflection",
  },
  {
    type: "essay",
    name: "随笔",
    description: "保存尚未完全成熟，但值得留下的个人思考。",
    href: "/space/essay",
  },
  {
    type: "project",
    name: "项目",
    description: "展示项目目标、过程、问题、调整和当前成果。",
    href: "/space/project",
  },
  {
    type: "understanding",
    name: "理解",
    description: "用自己的语言重新解释学过的知识。",
    href: "/space/understanding",
  },
];

const entryColumns =
  "id,title,slug,type,status,summary,content_json,content_text,cover_path,tags,featured,featured_order,metadata,created_by,created_at,updated_at,published_at,deleted_at";

export function getCategory(type: ContentType) {
  return categories.find((category) => category.type === type);
}

export function isContentType(value: string): value is ContentType {
  return categories.some((category) => category.type === value);
}

export async function getEntriesByType(type: ContentType) {
  const rows = await getPublishedRows();
  return rows.filter((row) => row.type === type && row.type !== "project").map(rowToEntry);
}

export async function getProjects() {
  const rows = await getPublishedRows();
  return rows.filter((row) => row.type === "project").map(rowToProject);
}

export async function getFeaturedEntries() {
  const rows = await getPublishedRows();
  return rows
    .filter((row) => row.featured && row.type !== "project")
    .sort(sortFeatured)
    .map(rowToEntry)
    .slice(0, 4);
}

export async function getFeaturedProjects() {
  const rows = await getPublishedRows();
  return rows
    .filter((row) => row.featured && row.type === "project")
    .sort(sortFeatured)
    .map(rowToProject)
    .slice(0, 4);
}

export async function getLatestUpdates() {
  const rows = await getPublishedRows();
  return rows
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
    .map((row) => (row.type === "project" ? rowToProject(row) : rowToEntry(row)));
}

export async function getEntryBySlug(slug: string) {
  const row = await getPublishedRowBySlug(slug);
  return row && row.type !== "project" ? rowToEntry(row) : null;
}

export async function getProjectBySlug(slug: string) {
  const row = await getPublishedRowBySlug(slug);
  return row?.type === "project" ? rowToProject(row) : null;
}

export async function getEntryNavigation(entry: Entry) {
  const entries = (await getPublishedRows())
    .filter((row) => row.type !== "project")
    .sort((left, right) => {
      return new Date(right.published_at ?? 0).getTime() - new Date(left.published_at ?? 0).getTime();
    })
    .map(rowToEntry);
  const currentIndex = entries.findIndex((item) => item.slug === entry.slug);

  return {
    previous: entries[currentIndex + 1],
    next: entries[currentIndex - 1],
  };
}

export async function getCategoryStats(type: ContentType) {
  const rows = await getPublishedRows();
  const items = rows.filter((row) => row.type === type);
  const latest = [...items].sort((left, right) => {
    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  })[0];

  return {
    count: items.length,
    latestTitle: latest ? latest.title : "暂无内容",
    updatedAt: latest?.updated_at,
  };
}

export function getContentTitle(content: Entry | Project) {
  return content.type === "project" ? content.name : content.title;
}

async function getPublishedRows() {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("entries")
      .select(entryColumns)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false, nullsFirst: false });

    return data ?? [];
  } catch {
    return [];
  }
}

async function getPublishedRowBySlug(slug: string) {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("entries")
      .select(entryColumns)
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

function rowToEntry(row: EntryRow): Entry {
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
    body: textToParagraphs(row.content_text),
  };
}

function rowToProject(row: EntryRow): Project {
  const metadata = normalizeMetadata(row.metadata);
  const paragraphs = textToParagraphs(row.content_text);

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
    cover: {
      src: row.cover_path || "/images/cover-vision.svg",
      alt: row.title,
    },
    gallery: [],
    sections: {
      background: paragraphs,
      goals: [],
      process: [],
      problems: [],
      adjustments: [],
      result: [],
      learnings: [],
      nextSteps: [],
    },
  };
}

function textToParagraphs(text: string | null) {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeMetadata(value: Json) {
  const record = isRecord(value) ? value : {};
  return {
    projectStatus: normalizeProjectStatus(record.projectStatus),
    startDate: asString(record.startDate),
    techStack: Array.isArray(record.techStack)
      ? record.techStack.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function normalizeProjectStatus(value: Json | undefined): ProjectStatus {
  if (
    value === "idea" ||
    value === "in_progress" ||
    value === "iterating" ||
    value === "completed" ||
    value === "paused"
  ) {
    return value;
  }

  return "idea";
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

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return new Date(right.published_at ?? 0).getTime() - new Date(left.published_at ?? 0).getTime();
}
