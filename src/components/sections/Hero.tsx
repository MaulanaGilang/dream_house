"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import film from "@/data/film.json";

const captions = [
  { at: 0.3, text: "Through the gate, past the lavender" },
  { at: 0.55, text: "Over the roof to the arched portal" },
  { at: 0.8, text: "Down to a beach no one else can reach" },
];

const frameUrl = (set: string, i: number) => `/film/${set}/f${String(i + 1).padStart(3, "0")}.avif`;

/**
 * The house tour, scrubbed by scroll: a Higgsfield flyover (road, roof, portal, cove) cut into
 * HD frames and painted to a pinned canvas. Every Nth frame loads first so it scrubs at once.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const cv = canvas.current!;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", narrow: "(max-width: 767px) and (orientation: portrait)" },
        (context) => {
          const { motion, narrow } = context.conditions as { motion: boolean; narrow: boolean };
          const set = narrow ? "mobile" : "desktop";
          const count = film.count;
          const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
          const state = { frame: 0 };
          let cancelled = false;

          const nearest = (i: number) => {
            for (let d = 0; d < count; d++) {
              if (frames[i - d]) return frames[i - d];
              if (frames[i + d]) return frames[i + d];
            }
            return null;
          };
          const draw = () => {
            const img = nearest(Math.round(state.frame));
            if (!img) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(cv.clientWidth * dpr);
            const h = Math.round(cv.clientHeight * dpr);
            if (cv.width !== w || cv.height !== h) {
              cv.width = w;
              cv.height = h;
            }
            const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
            ctx.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
          };
          const load = (i: number) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.decoding = "async";
              img.onload = () => {
                if (!cancelled) {
                  frames[i] = img;
                  if (Math.abs(i - state.frame) < 8) draw();
                }
                resolve();
              };
              img.onerror = () => resolve();
              img.src = frameUrl(set, i);
            });

          const order: number[] = [];
          for (const step of [12, 4, 1]) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
          (async () => {
            await load(0);
            if (!cancelled) setReady(true);
            if (!motion) return;
            for (let k = 1; k < order.length && !cancelled; k += 6) await Promise.all(order.slice(k, k + 6).map(load));
          })();

          if (!motion) return () => (cancelled = true);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: root.current, start: "top top", end: "+=520%", pin: true, scrub: 0.7, onUpdate: draw },
          });
          tl.to(state, { frame: count - 1, duration: 1, onUpdate: draw }, 0);
          tl.to(".hero-title", { yPercent: -18, autoAlpha: 0, duration: 0.14 }, 0.04);
          tl.to(".hero-flank", { autoAlpha: 0, duration: 0.08 }, 0.03);
          captions.forEach((c, i) => {
            tl.fromTo(`.hero-cap-${i}`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, c.at - 0.06);
            if (i < captions.length - 1) tl.to(`.hero-cap-${i}`, { autoAlpha: 0, y: -30, duration: 0.05 }, c.at + 0.12);
          });
          const onResize = () => draw();
          window.addEventListener("resize", onResize);
          return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
          };
        },
      );
      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-chrome="light"
      aria-label="La Casa, a tour from the road to the cove"
      className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-ink text-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/film/poster.avif"
        alt="The wide arched timber gate in the hedge with the house beyond"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
        fetchPriority="high"
      />
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,oklch(22%_0.05_250/0.45)_0%,transparent_38%,transparent_62%,var(--color-scrim)_100%)]" />

      <div className="hero-title absolute inset-x-0 top-[9vh] flex flex-col items-center text-center">
        <h1 className="display text-[length:var(--text-mega)]">La Casa</h1>
        <p className="script -mt-[0.32em] ml-[18vw] text-[length:var(--text-script)]">Indonesia</p>
      </div>
      <p className="hero-flank caps absolute left-[12vw] top-[40vh] hidden text-[length:var(--text-caps)] [text-shadow:0_1px_18px_oklch(20%_0.04_265/0.45)] md:block">A house</p>
      <p className="hero-flank caps absolute right-[12vw] top-[40vh] hidden text-[length:var(--text-caps)] [text-shadow:0_1px_18px_oklch(20%_0.04_265/0.45)] md:block">Above the cove</p>

      {captions.map((c, i) => (
        <p key={c.text} className={`hero-cap-${i} invisible caps absolute inset-x-0 bottom-[16vh] mx-auto max-w-[16ch] text-center text-[length:var(--text-caps)]`}>
          {c.text}
        </p>
      ))}

      <a href="#drawings" className="group absolute bottom-[4vh] left-1/2 grid h-24 w-24 -translate-x-1/2 place-items-center rounded-full border border-white/45 text-center transition-colors duration-500 hover:bg-white hover:text-ink">
        <span className="label max-w-[9ch]">View the drawings</span>
      </a>
    </section>
  );
}
