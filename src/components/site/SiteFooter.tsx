import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-4 py-10 text-sm leading-7 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{SITE.name}，记录实践、思考、理解和成长。</p>
        <div className="flex flex-wrap gap-4">
          <Link className="hover:text-primary" href="/space">
            内容空间
          </Link>
          <Link className="hover:text-primary" href="/about">
            关于
          </Link>
          <span>内容归属站点所有者</span>
        </div>
      </Container>
    </footer>
  );
}
