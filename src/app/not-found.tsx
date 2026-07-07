import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-page py-16">
      <Container size="reading">
        <div className="rounded-2xl border border-border bg-surface p-8">
          <p className="text-sm font-medium text-accent">404</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">没有找到这个页面</h1>
          <p className="mt-4 text-base leading-8 text-secondary">
            这个分类或内容可能还没有创建，也可能是示例 slug 不存在。
          </p>
          <Link
            href="/space"
            className="mt-6 inline-flex min-h-11 items-center rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-primary"
          >
            回到内容空间
          </Link>
        </div>
      </Container>
    </main>
  );
}
