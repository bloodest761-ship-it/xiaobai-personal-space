import Image from "next/image";
import type { Entry } from "@/types/content";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Tag } from "@/components/ui/Tag";
import { getCategory } from "@/lib/public-content";

type EntryHeaderProps = {
  entry: Entry;
};

export function EntryHeader({ entry }: EntryHeaderProps) {
  const category = getCategory(entry.type);

  return (
    <header className="border-b border-border bg-page py-12 sm:py-16">
      <div className="mx-auto w-full max-w-reading px-5 sm:px-8">
        <p className="text-sm font-medium text-accent">{category?.name}</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight text-primary sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-5 text-lg leading-9 text-secondary">{entry.summary}</p>
        <div className="mt-6">
          <DateDisplay publishedAt={entry.publishedAt} updatedAt={entry.updatedAt} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
      {entry.cover ? (
        <div className="mx-auto mt-10 w-full max-w-page px-5 sm:px-8 lg:px-10">
          <Image
            src={entry.cover.src}
            alt={entry.cover.alt}
            width={1200}
            height={720}
            priority
            className="aspect-[5/3] rounded-2xl border border-border bg-subtle object-cover"
          />
        </div>
      ) : null}
    </header>
  );
}
