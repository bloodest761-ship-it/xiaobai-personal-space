import { EntryCard } from "@/components/content/EntryCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Entry } from "@/types/content";

export function FeaturedEntries({ entries }: { entries: Entry[] }) {

  return (
    <section className="bg-surface py-16">
      <Container>
        <SectionHeading
          eyebrow="Entries"
          title="精选内容"
          description="用示例内容验证心得、随笔和理解类文章的展示方式。"
          action={<Button href="/space" variant="secondary">全部内容</Button>}
        />
        {entries.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {entries.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无精选内容" description="发布并设置精选后，内容会显示在这里。" />
        )}
      </Container>
    </section>
  );
}
