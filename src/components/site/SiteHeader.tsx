import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/space", label: "内容空间" },
  { href: "/space/project", label: "项目" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-page/95 backdrop-blur">
      <Container className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-base font-semibold text-primary">
          {SITE.name}
        </Link>
        <nav aria-label="主导航" className="flex flex-wrap gap-2 text-sm text-secondary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-accent-soft hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
