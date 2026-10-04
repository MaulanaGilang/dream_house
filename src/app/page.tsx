import { Blueprints } from "@/components/site/Blueprints";
import { Footer } from "@/components/site/Footer";
import { Intro } from "@/components/site/Intro";
import { Materials } from "@/components/site/Materials";
import { Nav } from "@/components/site/Nav";
import { PlotWalk } from "@/components/site/PlotWalk";
import { RevealObserver } from "@/components/site/RevealObserver";
import { Rooms } from "@/components/site/Rooms";
import { ScrollFilm } from "@/components/site/ScrollFilm";
import { SiteStory } from "@/components/site/SiteStory";

export default function Home() {
  return (
    <>
      <a
        href="#top-intro"
        className="sr-only z-[70] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip the film
      </a>
      <Nav />
      <main id="top">
        <ScrollFilm />
        <Intro />
        <SiteStory />
        <Blueprints />
        <Rooms />
        <Materials />
        <PlotWalk />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
