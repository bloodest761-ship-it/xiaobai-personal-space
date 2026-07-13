import { Container } from "@/components/ui/Container";

export default function StudioLoading() {
  return (
    <main className="min-h-screen bg-page py-12 sm:py-16">
      <Container>
        <div className="space-y-5">
          <div className="h-5 w-24 rounded-full bg-subtle" />
          <div className="h-10 w-56 rounded-full bg-subtle" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-32 rounded-2xl border border-border bg-surface" />)}
          </div>
        </div>
      </Container>
    </main>
  );
}
