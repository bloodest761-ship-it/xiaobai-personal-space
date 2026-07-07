import { CurrentFocus } from "@/components/home/CurrentFocus";
import { FeaturedEntries } from "@/components/home/FeaturedEntries";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { LatestUpdates } from "@/components/home/LatestUpdates";
import { ProfileIntro } from "@/components/home/ProfileIntro";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProfileIntro />
        <CurrentFocus />
        <FeaturedEntries />
        <FeaturedProjects />
        <LatestUpdates />
      </main>
      <SiteFooter />
    </>
  );
}
