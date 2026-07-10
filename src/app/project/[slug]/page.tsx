import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/project/ImageGallery";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectBySlug } from "@/lib/public-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;
export const dynamic = "force-dynamic";

const sectionLabels = {
  background: "项目背景",
  goals: "目标与限制",
  process: "实现过程",
  problems: "遇到的问题",
  adjustments: "关键调整",
  result: "当前结果",
  learnings: "我学到了什么",
  nextSteps: "下一步计划",
} as const;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.name,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <section className="border-b border-border py-12 sm:py-16">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
              <div>
                <p className="text-sm font-medium text-accent">Project</p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight text-primary sm:text-5xl">
                  {project.name}
                </h1>
                <p className="mt-5 max-w-reading text-lg leading-9 text-secondary">
                  {project.summary}
                </p>
              </div>
              <ProjectOverview project={project} />
            </div>
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              width={1200}
              height={720}
              priority
              className="mt-10 aspect-[5/3] rounded-2xl border border-border bg-subtle object-cover"
            />
          </Container>
        </section>
        <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_22rem]">
          <article className="space-y-10">
            {Object.entries(sectionLabels).map(([key, label]) => (
              <section key={key} className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-2xl font-semibold text-primary">{label}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-secondary">
                  {project.sections[key as keyof typeof sectionLabels].length > 0 ? (
                    project.sections[key as keyof typeof sectionLabels].map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))
                  ) : (
                    <p>暂无内容。</p>
                  )}
                </div>
              </section>
            ))}
          </article>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-primary">图片展示区域</h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                当前为阶段 1 的本地示例图，后续会替换为真实项目图片。
              </p>
            </div>
          </aside>
        </Container>
        <Container className="pb-16">
          {project.gallery.length > 0 ? (
            <ImageGallery images={project.gallery} />
          ) : (
            <EmptyState title="暂无项目图片" description="阶段 3 尚未实现图片上传，图片会在后续阶段补充。" />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
