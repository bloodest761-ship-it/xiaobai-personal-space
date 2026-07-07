import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryHeader } from "@/components/content/EntryHeader";
import { EntryNavigation } from "@/components/content/EntryNavigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { entries } from "@/data/mock-content";
import { getEntryBySlug, getEntryNavigation } from "@/lib/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);

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
  const entry = getEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const navigation = getEntryNavigation(entry);

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <EntryHeader entry={entry} />
        <Container size="reading" className="py-12 sm:py-16">
          <article className="space-y-6 text-lg leading-9 text-primary">
            {entry.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
          <div className="mt-12">
            <EntryNavigation previous={navigation.previous} next={navigation.next} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
