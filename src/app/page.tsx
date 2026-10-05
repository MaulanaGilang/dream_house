import { Chrome } from "@/components/chrome/Chrome";
import { Preloader } from "@/components/chrome/Preloader";
import { RevealObserver } from "@/components/chrome/RevealObserver";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Architecture } from "@/components/sections/Architecture";
import { Drawings } from "@/components/sections/Drawings";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Materials } from "@/components/sections/Materials";
import { Night } from "@/components/sections/Night";
import { Reasons } from "@/components/sections/Reasons";
import { Rooms } from "@/components/sections/Rooms";
import { Story } from "@/components/sections/Story";

export default function Home() {
  return (
    <>
      <a href="#reasons-title" className="sr-only z-[90] bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip the film
      </a>
      <Preloader />
      <SmoothScroll />
      <Chrome />
      <main>
        <Hero />
        <Reasons />
        <Story />
        <Drawings />
        <Night />
        <Rooms />
        <Materials />
        <Architecture />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
