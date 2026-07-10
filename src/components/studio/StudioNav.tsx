import Link from "next/link";

const items = [
  { href: "/studio", label: "仪表板" },
  { href: "/studio/entries", label: "内容管理" },
  { href: "/studio/new", label: "新建内容" },
  { href: "/studio/trash", label: "回收站" },
];

export function StudioNav() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="后台导航">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary transition hover:border-accent hover:text-primary"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
