import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/content";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Tag } from "@/components/ui/Tag";
import { ProjectStatusBadge } from "@/components/project/ProjectStatusBadge";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent">
      <Link href={`/project/${project.slug}`} className="block border-b border-border bg-subtle">
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          width={1200}
          height={720}
          className="aspect-[5/3] h-auto w-full object-cover"
        />
      </Link>
      <div className="p-6">
        <ProjectStatusBadge status={project.status} />
        <h3 className="mt-4 text-xl font-semibold leading-8 text-primary">
          <Link href={`/project/${project.slug}`} className="hover:text-accent">
            {project.name}
          </Link>
        </h3>
        <p className="mt-3 text-sm leading-7 text-secondary">{project.summary}</p>
        <div className="mt-5">
          <DateDisplay updatedAt={project.updatedAt} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
        </div>
      </div>
    </article>
  );
}
