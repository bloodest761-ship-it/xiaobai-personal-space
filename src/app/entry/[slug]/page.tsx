import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryHeader } from "@/components/content/EntryHeader";
import { EntryNavigation } from "@/components/content/EntryNavigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { RichContent } from "@/components/editor/RichContent";
import { getEntryBySlug, getEntryNavigation } from "@/lib/public-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) {
    return {};
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function EntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const navigation = await getEntryNavigation(entry);

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <EntryHeader entry={entry} />
        <Container size="reading" className="py-12 sm:py-16">
          {entry.contentJson ? (
            <RichContent content={entry.contentJson} />
          ) : entry.body.length > 0 ? (
            <article className="space-y-6 text-lg leading-9 text-primary">
              {entry.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ) : (
            <EmptyState title="正文暂为空" description="这篇内容已经发布，但正文还没有填写。" />
          )}
          <div className="mt-12">
            <EntryNavigation previous={navigation.previous} next={navigation.next} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
