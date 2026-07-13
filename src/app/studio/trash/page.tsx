import Link from "next/link";
import type { Metadata } from "next";
import { restoreEntryAction } from "@/actions/entries";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminEntries } from "@/lib/admin-entries";
import { formatDate } from "@/lib/dates";
import { entryStatusLabels, entryTypeLabels } from "@/lib/entry-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "回收站",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ error?: string; restored?: string }>;
};

export default async function TrashPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const entriesResult = await getAdminEntries({ deleted: "only", limit: 50 });
  const entries = entriesResult.data ?? [];

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <p className="text-sm font-medium text-accent">Trash</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">回收站</h1>
          <p className="mt-3 text-base leading-8 text-secondary">
            这里显示已软删除内容。本阶段只支持恢复，不做永久删除。
          </p>

          <Message error={params.error ?? entriesResult.error} success={params.restored ? "内容已恢复。" : null} />

          {entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState title="回收站为空" description="删除到回收站的内容会显示在这里。" />
            </div>
          ) : (
            <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div>
                    <Link href={`/studio/edit/${entry.id}`} className="font-medium text-primary">
                      {entry.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {entryTypeLabels[entry.type]} · {entryStatusLabels[entry.status]} · 删除于{" "}
                      {entry.deleted_at ? formatDate(entry.deleted_at) : "-"}
                    </p>
                  </div>
                  <form action={restoreEntryAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      className="min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white"
                    >
                      恢复
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function Message({ error, success }: { error?: string | null; success?: string | null }) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-6 text-secondary">
      {error ?? success}
    </p>
  );
}
