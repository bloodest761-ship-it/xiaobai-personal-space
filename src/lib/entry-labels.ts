import type { EntryStatus, EntryType } from "@/lib/admin-entries";

export const entryTypeLabels: Record<EntryType, string> = {
  reflection: "心得",
  essay: "随笔",
  project: "项目",
  understanding: "理解",
};

export const entryStatusLabels: Record<EntryStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

export const projectStatusLabels = {
  idea: "想法",
  in_progress: "进行中",
  iterating: "迭代中",
  completed: "已完成",
  paused: "暂停",
} as const;
