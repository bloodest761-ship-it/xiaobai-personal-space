import type { ProjectStatus } from "@/types/content";

const statusLabels: Record<ProjectStatus, string> = {
  idea: "构思中",
  in_progress: "开发中",
  iterating: "持续迭代",
  completed: "已完成",
  paused: "暂停",
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
      {statusLabels[status]}
    </span>
  );
}
