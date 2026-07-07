import Link from "next/link";
import type { Entry } from "@/types/content";

type EntryNavigationProps = {
  previous?: Entry;
  next?: Entry;
};

export function EntryNavigation({ previous, next }: EntryNavigationProps) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="文章导航"
      className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link className="rounded-2xl border border-border bg-surface p-5 hover:border-accent" href={`/entry/${previous.slug}`}>
          <span className="text-sm text-muted">上一篇</span>
          <span className="mt-2 block font-medium text-primary">{previous.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link className="rounded-2xl border border-border bg-surface p-5 text-left hover:border-accent sm:text-right" href={`/entry/${next.slug}`}>
          <span className="text-sm text-muted">下一篇</span>
          <span className="mt-2 block font-medium text-primary">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
