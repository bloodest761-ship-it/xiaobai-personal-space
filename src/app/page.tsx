import { CurrentFocus } from "@/components/home/CurrentFocus";
import { FeaturedEntries } from "@/components/home/FeaturedEntries";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { LatestUpdates } from "@/components/home/LatestUpdates";
import { ProfileIntro } from "@/components/home/ProfileIntro";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getHomeContent } from "@/lib/public-content";

export const revalidate = 300;

export default async function Home() {
  const homeContent = await getHomeContent();
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProfileIntro />
        <CurrentFocus />
        <FeaturedEntries entries={homeContent.featuredEntries} />
        <FeaturedProjects projects={homeContent.featuredProjects} />
        <LatestUpdates updates={homeContent.latestUpdates} />
      </main>
      <SiteFooter />
    </>
  );
}
