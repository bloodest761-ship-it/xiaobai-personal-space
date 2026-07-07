"use client";

import { Container } from "@/components/ui/Container";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-page py-16">
      <Container size="reading">
        <div className="rounded-2xl border border-border bg-surface p-8">
          <p className="text-sm font-medium text-accent">页面错误</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">内容暂时无法显示</h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            {error.message || "请稍后再试，或返回上一页。"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-11 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-primary"
          >
            重新加载
          </button>
        </div>
      </Container>
    </main>
  );
}
