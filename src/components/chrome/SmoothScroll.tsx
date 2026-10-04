"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Lenis inertia scrolling driven by the GSAP ticker so pinned ScrollTriggers stay in sync. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!;
      const el = id === "#top" ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement | number, { offset: 0, duration: 1.6 });
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
