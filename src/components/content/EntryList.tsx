import type { Entry } from "@/types/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryCard } from "@/components/content/EntryCard";

type EntryListProps = {
  entries: Entry[];
  emptyTitle: string;
  emptyDescription: string;
};

export function EntryList({ entries, emptyTitle, emptyDescription }: EntryListProps) {
  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {entries.map((entry) => (
        <EntryCard key={entry.slug} entry={entry} />
      ))}
    </div>
  );
}
