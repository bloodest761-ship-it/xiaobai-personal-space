import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section className="border-b border-border bg-page">
      <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-medium text-accent">{SITE.name}</p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-tight text-primary sm:text-6xl">
            记录实践、思考、理解和成长
          </h1>
          <p className="mt-6 max-w-reading text-pretty text-lg leading-9 text-secondary">
            这里保存我做过的项目、学习后的心得、阶段性的思考，以及认知发生变化的过程。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/space">进入内容空间</Button>
            <Button href="/space/project" variant="secondary">
              查看项目
            </Button>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="grid gap-3">
            {["实践", "思考", "理解", "成长"].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-border bg-page px-5 py-4"
              >
                <span className="text-lg font-semibold text-primary">{item}</span>
                <span className="text-sm text-muted">0{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
