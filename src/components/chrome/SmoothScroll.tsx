"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/scroll";

/**
 * Lenis (darkroom.engineering) inertia scrolling, driven by the GSAP ticker so pinned
 * ScrollTriggers read the same scroll position Lenis paints. In-page anchors glide too.
 */
export function SmoothScroll() {
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4, autoRaf: false });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!;
      const el = id === "#top" ? 0 : document.querySelector<HTMLElement>(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.8, force: true });
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
