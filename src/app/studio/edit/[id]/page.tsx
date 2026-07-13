import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { EntryEditorForm } from "@/components/editor/EntryEditorForm";
import { StudioNav } from "@/components/studio/StudioNav";
import { Container } from "@/components/ui/Container";
import { getEntryById } from "@/lib/admin-entries";
import { entryStatusLabels, entryTypeLabels } from "@/lib/entry-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑内容",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEntryPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEntryById(id);
  if (result.error || !result.data) notFound();
  const entry = result.data;

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-accent">Edit</p>
              <h1 className="mt-3 text-3xl font-semibold text-primary">编辑内容</h1>
              <p className="mt-3 text-base leading-8 text-secondary">{entryTypeLabels[entry.type]} · {entryStatusLabels[entry.status]}{entry.deleted_at ? " · 已在回收站" : ""}</p>
            </div>
            <Link href="/studio/entries" className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium text-primary">返回列表</Link>
          </div>
          <EntryEditorForm entry={entry} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
