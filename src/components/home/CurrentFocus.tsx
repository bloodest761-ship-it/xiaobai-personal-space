import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const focusItems = ["机器人", "嵌入式控制", "计算机视觉", "软件工程", "学习复盘"];

export function CurrentFocus() {
  return (
    <section className="bg-page py-16">
      <Container>
        <SectionHeading
          eyebrow="Focus"
          title="当前关注"
          description="阶段 1 先展示方向，真实内容会在后续写作后台完成后逐步补充。"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {focusItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-surface px-5 py-6 text-center text-base font-medium text-primary"
            >
              {item}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
