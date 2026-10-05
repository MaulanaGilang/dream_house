"use client";

import type Lenis from "lenis";

/** The one Lenis instance (set by SmoothScroll), so the menu, the intro and the film can drive or pause it. */
let lenis: Lenis | null = null;
let locked = false;

export const setLenis = (l: Lenis | null) => {
  lenis = l;
  if (l && locked) l.stop();
};

export const getLenis = () => lenis;

/** Smooth-scroll to an element or y; falls back to native scrolling when Lenis is off (reduced motion). */
export function scrollToTarget(target: HTMLElement | number, opts: { duration?: number; immediate?: boolean } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: opts.duration ?? 1.6, immediate: opts.immediate, force: true });
    return;
  }
  const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: opts.immediate ? "instant" : "smooth" });
}

/** Pause page scrolling (intro, open menu). Safe to call before Lenis exists: it picks the state up. */
export function lockScroll(on: boolean) {
  locked = on;
  if (on) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle("is-locked", on);
}

/* ---------------------------------------------------------------- loading + intro handshake */

type Listener = (p: number) => void;
let progress = 0;
const listeners = new Set<Listener>();

/** How much of what the first screen needs (fonts, poster, the first pass of film frames) has arrived, 0..1. */
export const loading = {
  set(p: number) {
    progress = Math.max(progress, Math.min(1, p));
    listeners.forEach((f) => f(progress));
  },
  get: () => progress,
  on(f: Listener) {
    listeners.add(f);
    f(progress);
    return () => void listeners.delete(f);
  },
};

let introDone = false;
const introListeners = new Set<() => void>();

/** Fired once the intro arch has opened onto the hero. */
export const intro = {
  finish() {
    if (introDone) return;
    introDone = true;
    introListeners.forEach((f) => f());
  },
  done: () => introDone,
  on(f: () => void) {
    if (introDone) f();
    else introListeners.add(f);
    return () => void introListeners.delete(f);
  },
};
