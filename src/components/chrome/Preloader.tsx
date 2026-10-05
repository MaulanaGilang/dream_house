"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { intro, loading, lockScroll } from "@/lib/scroll";

/**
 * The ERA Residence intro, in La Casa's colours: a maroon field with the name between two flanking
 * words and a hairline that fills as the film loads; then an arch-shaped window onto the gate rises
 * and widens until it is the whole screen, handing over to the hero underneath without a cut.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const pic = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!intro.done()) lockScroll(true);

      // the arch window: width w, top y (px); its photo is pinned to the viewport so it lines up with the hero
      const arch = { w: 0, y: 0 };
      const paint = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const r = arch.w / 2;
        if (win.current) Object.assign(win.current.style, { width: `${arch.w}px`, top: `${arch.y}px`, borderRadius: `${r}px ${r}px 0 0` });
        if (pic.current) Object.assign(pic.current.style, { width: `${vw}px`, height: `${vh}px`, left: `${r - vw / 2}px`, top: `${-arch.y}px` });
        if (ring.current) {
          const rw = arch.w + 28;
          Object.assign(ring.current.style, { width: `${rw}px`, top: `${arch.y - 14}px`, borderRadius: `${rw / 2}px ${rw / 2}px 0 0` });
        }
      };
      const start = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        arch.w = Math.min(vw * 0.3, vh * 0.42);
        arch.y = vh + 40;
        paint();
      };
      start();

      const parts = gsap.utils.toArray<HTMLElement>("[data-part]", el);
      gsap.from(parts, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.07, ease: "power3.out", delay: 0.1 });

      const fill = gsap.quickTo(bar.current, "scaleY", { duration: 0.5, ease: "power2.out" });
      const fonts = document.fonts?.ready ?? Promise.resolve();
      let fontsIn = 0;
      fonts.then(() => (fontsIn = 1));
      const off = loading.on((p) => fill(0.15 * fontsIn + 0.85 * p));

      const minTime = new Promise((r) => setTimeout(r, reduce ? 200 : 1500));
      const ready = new Promise<void>((r) => {
        const check = loading.on((p) => p >= 1 && r());
        setTimeout(() => {
          check();
          r();
        }, 6000);
      });

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        lockScroll(false);
        intro.finish();
        gsap.to(el, { autoAlpha: 0, duration: 0.25, onComplete: () => void (el.style.display = "none") });
      };

      let alive = true;
      Promise.all([minTime, ready, fonts]).then(() => {
        if (!alive) return;
        off();
        fill(1);
        if (reduce) return finish();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const full = Math.max(vw, vh) * 1.6;
        const r = full / 2;
        const lift = r - Math.sqrt(r * r - (vw / 2) ** 2); // how far the curve dips at the screen edge
        const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: finish });
        tl.to(parts, { autoAlpha: 0, y: -18, duration: 0.6, stagger: 0.04, ease: "power2.in" }, 0.25)
          .to(arch, { y: vh * 0.2, duration: 1.15, ease: "power3.out", onUpdate: paint }, 0.35)
          .fromTo(ring.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.6)
          .to(arch, { w: full, y: -lift - 8, duration: 1.25, onUpdate: paint }, 1.55)
          .to(ring.current, { autoAlpha: 0, duration: 0.4 }, 1.6);
      });

      const onResize = () => !finished && paint();
      window.addEventListener("resize", onResize);
      return () => {
        alive = false;
        off();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="fixed inset-0 z-[80] overflow-hidden bg-maroon text-cream">
      <p className="script pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(14rem,34vw,34rem)] leading-none opacity-[0.05]">
        La Casa
      </p>

      <div className="relative z-[1] flex h-full flex-col justify-between px-[var(--gutter)] py-[clamp(1.5rem,5vh,3.25rem)]">
        <div data-part className="flex justify-center">
          <svg viewBox="0 0 40 48" className="h-11 text-silver" aria-hidden="true">
            <path d="M2 48V20a18 18 0 0 1 36 0v28" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9.5 48V21a10.5 10.5 0 0 1 21 0v27" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>

        <div className="grid grid-cols-1 items-center justify-items-center gap-[clamp(1rem,5vw,6rem)] sm:grid-cols-[1fr_auto_1fr] sm:justify-items-stretch">
          <span data-part className="label justify-self-end tracking-[0.7em] max-sm:hidden">Above</span>
          <div className="flex flex-col items-center">
            <span data-part className="display text-center text-[clamp(3.6rem,2rem+6vw,8rem)] leading-[0.84]">
              La
              <br />
              Casa
            </span>
            <span data-part className="script -mt-[0.35em] ml-[1.2em] -rotate-12 text-[clamp(2.4rem,1.4rem+3vw,4.6rem)] text-silver">
              Indonesia
            </span>
          </div>
          <span data-part className="label tracking-[0.7em] max-sm:hidden">the cove</span>
        </div>

        <div className="flex flex-col items-center gap-6">
          <span data-part className="relative h-24 w-px overflow-hidden bg-cream/20">
            <span ref={bar} className="absolute inset-0 origin-top scale-y-0 bg-cream" />
          </span>
          <p data-part className="label text-center opacity-75">
            La Casa
            <br />A house above the cove
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div ref={ring} className="invisible absolute bottom-0 left-1/2 -translate-x-1/2 border border-b-0 border-cream/35" />
        <div ref={win} className="absolute bottom-[-200vh] left-1/2 -translate-x-1/2 overflow-hidden bg-ink">
          <div ref={pic} className="absolute">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/film/poster.avif" alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            <div className="hero-scrim absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
