import type { Json } from "@/types/database";

export const entryTypes = ["reflection", "essay", "project", "understanding"] as const;
export const entryStatuses = ["draft", "published", "archived"] as const;

export type EntryType = (typeof entryTypes)[number];
export type EntryStatus = (typeof entryStatuses)[number];

export type ProjectMetadata = {
  projectStatus?: "idea" | "in_progress" | "iterating" | "completed" | "paused";
  startDate?: string | null;
  endDate?: string | null;
  techStack?: string[];
  repositoryUrl?: string | null;
  demoUrl?: string | null;
};

export type EntryRecord = {
  id: string;
  title: string;
  slug: string;
  type: EntryType;
  status: EntryStatus;
  summary: string | null;
  content_json: Json;
  content_text: string | null;
  cover_path: string | null;
  tags: string[];
  featured: boolean;
  featured_order: number | null;
  metadata: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
};
