import Link from "next/link";
import type { ContentCategory } from "@/types/content";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { getCategoryStats } from "@/lib/public-content";

type CategoryCardProps = {
  category: ContentCategory;
};

export async function CategoryCard({ category }: CategoryCardProps) {
  const stats = await getCategoryStats(category.type);

  return (
    <Link
      href={category.href}
      className="group rounded-2xl border border-border bg-surface p-6 transition duration-200 hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-accent">0{stats.count}</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">{category.name}</h2>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-sm text-muted group-hover:border-accent">
          进入
        </span>
      </div>
      <p className="mt-5 text-base leading-8 text-secondary">{category.description}</p>
      <div className="mt-8 border-t border-border pt-5">
        <p className="text-sm text-muted">最近内容</p>
        <p className="mt-2 font-medium text-primary">{stats.latestTitle}</p>
        {stats.updatedAt ? <DateDisplay updatedAt={stats.updatedAt} /> : null}
      </div>
    </Link>
  );
}
