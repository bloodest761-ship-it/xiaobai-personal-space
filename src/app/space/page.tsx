import type { Metadata } from "next";
import { CategoryCard } from "@/components/content/CategoryCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容空间",
  description: "心得、随笔、项目和理解的分类入口。",
};

export default function SpacePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-page">
        <Container className="py-14 sm:py-18">
          <SectionHeading
            eyebrow="Space"
            title="内容空间"
            description="把学习、实践、项目和理解分开保存，让每一种内容都有合适的位置。"
          />
          <div className="grid gap-5 md:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard key={category.type} category={category} />
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
