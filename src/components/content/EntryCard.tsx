import Image from "next/image";
import Link from "next/link";
import type { Entry } from "@/types/content";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Tag } from "@/components/ui/Tag";
import { getCategory } from "@/lib/public-content";

type EntryCardProps = {
  entry: Entry;
};

export function EntryCard({ entry }: EntryCardProps) {
  const category = getCategory(entry.type);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent">
      {entry.cover ? (
        <Link href={`/entry/${entry.slug}`} className="block border-b border-border bg-subtle">
          <Image
            src={entry.cover.src}
            alt={entry.cover.alt}
            width={1200}
            height={720}
            className="aspect-[5/3] h-auto w-full object-cover"
          />
        </Link>
      ) : null}
      <div className="p-6">
        <p className="text-sm font-medium text-accent">{category?.name}</p>
        <h3 className="mt-3 text-xl font-semibold leading-8 text-primary">
          <Link href={`/entry/${entry.slug}`} className="hover:text-accent">
            {entry.title}
          </Link>
        </h3>
        <p className="mt-3 text-sm leading-7 text-secondary">{entry.summary}</p>
        <div className="mt-5">
          <DateDisplay publishedAt={entry.publishedAt} updatedAt={entry.updatedAt} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
    </article>
  );
}
