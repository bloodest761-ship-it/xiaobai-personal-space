import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Project } from "@/types/content";

export function FeaturedProjects({ projects }: { projects: Project[] }) {

  return (
    <section className="bg-page py-16">
      <Container>
        <SectionHeading
          eyebrow="Projects"
          title="精选项目"
          description="项目内容强调目标、过程、问题、调整和当前成果。"
          action={<Button href="/space/project" variant="secondary">查看项目</Button>}
        />
        {projects.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无精选项目" description="发布项目并设置精选后，项目会显示在这里。" />
        )}
      </Container>
    </section>
  );
}
