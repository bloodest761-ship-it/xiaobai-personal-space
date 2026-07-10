import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createEntryAction } from "@/actions/entries";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioNav } from "@/components/studio/StudioNav";
import { Container } from "@/components/ui/Container";
import { getCurrentAdminState } from "@/lib/auth/admin";
import { entryTypeLabels } from "@/lib/entry-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新建内容",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

const descriptions = {
  reflection: "学习、实践之后的认知变化和复盘。",
  essay: "尚未完全成熟，但值得留下的个人思考。",
  project: "项目目标、过程、问题、调整和阶段结果。",
  understanding: "用自己的语言解释学过的知识。",
} as const;

export default async function NewEntryPage({ searchParams }: PageProps) {
  await requireAdminPage();
  const { error } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-12 sm:py-16">
          <StudioNav />
          <p className="text-sm font-medium text-accent">New</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">新建内容</h1>
          <p className="mt-3 max-w-reading text-base leading-8 text-secondary">
            先选择内容类型。系统会创建一篇草稿，然后进入编辑页面。
          </p>

          {error ? (
            <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-secondary">
              {error}
            </p>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {Object.entries(entryTypeLabels).map(([type, label]) => (
              <form
                key={type}
                action={createEntryAction}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <input type="hidden" name="type" value={type} />
                <h2 className="text-2xl font-semibold text-primary">{label}</h2>
                <p className="mt-3 min-h-14 text-sm leading-7 text-secondary">
                  {descriptions[type as keyof typeof descriptions]}
                </p>
                <button
                  type="submit"
                  className="mt-6 min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white"
                >
                  创建{label}草稿
                </button>
              </form>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

async function requireAdminPage() {
  const state = await getCurrentAdminState();

  if (state.status === "missing-env") {
    redirect("/login?reason=setup");
  }

  if (state.status === "unauthenticated") {
    redirect("/login");
  }

  if (state.status === "not-admin") {
    redirect("/login?reason=not-admin");
  }
}
