import { EntryCard } from "@/components/content/EntryCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedEntries } from "@/lib/content";

export function FeaturedEntries() {
  const featuredEntries = getFeaturedEntries();

  return (
    <section className="bg-surface py-16">
      <Container>
        <SectionHeading
          eyebrow="Entries"
          title="精选内容"
          description="用示例内容验证心得、随笔和理解类文章的展示方式。"
          action={<Button href="/space" variant="secondary">全部内容</Button>}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {featuredEntries.map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </Container>
    </section>
  );
}
