import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedProjects } from "@/lib/content";

export function FeaturedProjects() {
  const featuredProjects = getFeaturedProjects();

  return (
    <section className="bg-page py-16">
      <Container>
        <SectionHeading
          eyebrow="Projects"
          title="精选项目"
          description="项目内容强调目标、过程、问题、调整和当前成果。"
          action={<Button href="/space/project" variant="secondary">查看项目</Button>}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </section>
  );
}
