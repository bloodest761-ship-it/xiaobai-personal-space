import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ProfileIntro() {
  return (
    <section className="bg-surface py-16">
      <Container>
        <SectionHeading
          eyebrow="Profile"
          title="一个持续搭建中的个人内容空间"
          description="这里不会把还在路上的项目包装成完成品，而是保留学习、调试、理解和修正的过程。"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["我是谁", "一个正在通过真实项目学习机器人、视觉和软件工程的人。"],
            ["正在做什么", "把项目实践、阶段性理解和学习方法沉淀成可回看的内容。"],
            ["为什么记录", "让过程不只停留在脑子里，也能被整理、复盘和继续迭代。"],
          ].map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-border bg-page p-6">
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-secondary">{description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
