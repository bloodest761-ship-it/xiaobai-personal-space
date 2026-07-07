import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "关于",
  description: "关于小白的个人内容空间。",
};

const sections = [
  {
    title: "我是谁",
    body: "一个正在通过真实项目学习机器人、嵌入式控制、计算机视觉和软件工程的人。",
  },
  {
    title: "当前方向",
    body: "围绕机器人实践、视觉算法理解、项目调试和学习方法做长期记录。",
  },
  {
    title: "为什么建立这个网站",
    body: "不是为了包装成果，而是为了把实践过程、阶段性困惑和认知变化整理成可以回看的内容。",
  },
  {
    title: "内容原则",
    body: "不把准备做写成已经完成，不虚构经历和成果，不确定的地方明确标记待补充。",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-14 sm:py-18">
          <SectionHeading
            eyebrow="About"
            title="关于这个空间"
            description="这里是一个仍在搭建中的个人内容系统，先记录真实过程，再慢慢形成稳定结构。"
          />
          <div className="grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
                <p className="mt-4 text-base leading-8 text-secondary">{section.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
