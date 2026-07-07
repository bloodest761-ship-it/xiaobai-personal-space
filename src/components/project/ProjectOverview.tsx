import type { Project } from "@/types/content";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Tag } from "@/components/ui/Tag";
import { ProjectStatusBadge } from "@/components/project/ProjectStatusBadge";

type ProjectOverviewProps = {
  project: Project;
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-primary">项目概览</h2>
      <div className="mt-5 space-y-5">
        <div>
          <p className="text-sm text-muted">状态</p>
          <div className="mt-2">
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">时间</p>
          <div className="mt-2">
            <DateDisplay startedAt={project.startedAt} updatedAt={project.updatedAt} />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">技术栈</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
