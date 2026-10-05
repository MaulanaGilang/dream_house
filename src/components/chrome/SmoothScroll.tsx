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

    // anything that changes the page height (a drawing loading, a sheet switch, late images) moves every
    // pinned scene below it; re-measure them, otherwise a pin starts late and the page jumps back
    let lastH = document.body.scrollHeight;
    let t = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    ro.observe(document.body);
    const stopObserving = () => {
      window.clearTimeout(t);
      ro.disconnect();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return stopObserving;

    // era-residence.com's own settings: a 1.2 s expo-out glide per wheel input
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      autoRaf: false,
    });
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
      lenis.scrollTo(el, { offset: 0, duration: 1.8, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), force: true });
    };
    document.addEventListener("click", onClick);
    return () => {
      stopObserving();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
