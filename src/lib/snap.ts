"use client";

import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "@/lib/scroll";

/**
 * One gesture = one chapter, timed like era-residence.com's section snap: 40 ms after the scroll settles
 * inside a pinned scene, a 1.2 s glide to the next stop in the direction of travel. `stops` are scroll
 * progress values (0..1) of the trigger. Lenis is created after layout effects, so it is looked up late.
 */
export function chapterSnap(st: ScrollTrigger, stops: number[]) {
  let timer = 0;
  let dir = 1;
  let lastY = window.scrollY;
  const snap = () => {
    const y = window.scrollY;
    if (y <= st.start + 1 || y >= st.end - 1) return;
    const p = (y - st.start) / (st.end - st.start);
    if (stops.some((s) => Math.abs(s - p) < 0.004)) return;
    const next = dir > 0 ? stops.find((s) => s > p) : [...stops].reverse().find((s) => s < p);
    if (next === undefined) return;
    getLenis()?.scrollTo(st.start + next * (st.end - st.start), { duration: 1.2, easing: (t: number) => 1 - (1 - t) ** 3 });
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
    window.clearTimeout(timer);
    if (getLenis()) timer = window.setTimeout(snap, 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
  };
}

/** Glide to a given stop of a pinned scene (used by in-scene pagination). */
export function glideTo(st: ScrollTrigger, progress: number) {
  getLenis()?.scrollTo(st.start + progress * (st.end - st.start), { duration: 1.2, easing: (t: number) => 1 - (1 - t) ** 3, force: true });
}
