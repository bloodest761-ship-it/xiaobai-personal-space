import Link from "next/link";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getContentTitle, getLatestUpdates } from "@/lib/public-content";

export async function LatestUpdates() {
  const updates = (await getLatestUpdates()).slice(0, 5);

  return (
    <section className="bg-surface py-16">
      <Container>
        <SectionHeading
          eyebrow="Latest"
          title="最近更新"
          description="这里暂时显示 mock 数据，后续会接入真实内容。"
        />
        {updates.length > 0 ? (
          <div className="divide-y divide-border rounded-2xl border border-border bg-page">
            {updates.map((item) => (
              <Link
                key={item.slug}
                href={item.type === "project" ? `/project/${item.slug}` : `/entry/${item.slug}`}
                className="grid gap-2 px-5 py-5 transition hover:bg-accent-soft sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span className="font-medium text-primary">{getContentTitle(item)}</span>
                <DateDisplay updatedAt={item.updatedAt} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无最近更新" description="发布内容后，最近更新会显示在这里。" />
        )}
      </Container>
    </section>
  );
}
