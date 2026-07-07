import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <main className="min-h-screen bg-page py-16">
      <Container>
        <div className="rounded-2xl border border-border bg-surface p-8">
          <p className="text-sm font-medium text-accent">正在加载</p>
          <div className="mt-6 space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-subtle" />
            <div className="h-4 w-full rounded-full bg-subtle" />
            <div className="h-4 w-5/6 rounded-full bg-subtle" />
          </div>
        </div>
      </Container>
    </main>
  );
}
