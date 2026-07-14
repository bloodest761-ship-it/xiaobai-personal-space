import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntryEditorForm } from "@/components/editor/EntryEditorForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Container } from "@/components/ui/Container";
import { getOrCreateWritingDraft } from "@/lib/admin-entries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新建内容",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewEntryPage() {
  const draftResult = await getOrCreateWritingDraft();

  if (draftResult.error || !draftResult.data) {
    redirect(`/studio/entries?error=${encodeURIComponent(draftResult.error ?? "无法开始写作。")}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <p className="text-sm font-medium text-accent">Write</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">开始写作</h1>
          <p className="mt-3 max-w-reading text-base leading-8 text-secondary">
            默认创建或继续编辑一篇心得草稿。标题与正文优先，其余设置可按需展开。
          </p>
          <EntryEditorForm entry={draftResult.data} autoFocusTitle />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
