import { Container } from "@/components/ui/Container";

export default function SpaceLoading() {
  return (
    <main className="min-h-screen bg-page py-14 sm:py-18">
      <Container>
        <div className="h-8 w-40 rounded-full bg-subtle" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 rounded-2xl border border-border bg-surface" />)}
        </div>
      </Container>
    </main>
  );
}
