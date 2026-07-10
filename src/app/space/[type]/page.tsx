import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryList } from "@/components/content/EntryList";
import { ProjectCard } from "@/components/project/ProjectCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  categories,
  getCategory,
  getEntriesByType,
  getProjects,
  isContentType,
} from "@/lib/public-content";
import type { ContentType } from "@/types/content";

type PageProps = {
  params: Promise<{ type: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return categories.map((category) => ({ type: category.type }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;

  if (!isContentType(type)) {
    return {};
  }

  const category = getCategory(type);

  return {
    title: category?.name,
    description: category?.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { type } = await params;

  if (!isContentType(type)) {
    notFound();
  }

  const category = getCategory(type);

  if (!category) {
    notFound();
  }

  const contentType = type as ContentType;
  const entries = await getEntriesByType(contentType);
  const projects = await getProjects();

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-14 sm:py-18">
          <SectionHeading
            eyebrow="Category"
            title={category.name}
            description={category.description}
          />
          {contentType === "project" ? (
            projects.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState title="暂无项目" description="项目记录会在后续真实内容补充后出现。" />
            )
          ) : (
            <EntryList
              entries={entries}
              emptyTitle={`暂无${category.name}`}
              emptyDescription="这里会在后续发布真实内容后显示列表。"
            />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
