"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import poster from "@/assets/photos/gate.webp";

const FRAME_COUNT = 301;
const COARSE_STEP = 6;

function frameUrl(set: "desktop" | "mobile", i: number) {
  return `/film/${set}/f${String(i + 1).padStart(3, "0")}.webp`;
}

const captions = [
  { at: 0.3, text: "Through the gate, a garden of lavender and thuja." },
  { at: 0.56, text: "Over the terracotta roof to the back gate." },
  { at: 0.82, text: "Down to a beach no one else can reach." },
];

/**
 * The house tour: a Higgsfield flyover cut into 301 frames and painted to a canvas,
 * one frame per scroll step. Coarse frames load first so scrubbing works almost at once.
 */
export function ScrollFilm() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      const cv = canvas.current;
      if (!el || !cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          narrow: "(max-width: 767px) and (orientation: portrait)",
        },
        (context) => {
          const { motion, narrow } = context.conditions as { motion: boolean; narrow: boolean };
          if (!motion) return;

          const set = narrow ? "mobile" : "desktop";
          const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
          const state = { frame: 0 };
          let cancelled = false;

          const nearestLoaded = (i: number) => {
            for (let d = 0; d < FRAME_COUNT; d++) {
              if (frames[i - d]) return frames[i - d];
              if (frames[i + d]) return frames[i + d];
            }
            return null;
          };

          const draw = () => {
            const img = nearestLoaded(Math.round(state.frame));
            if (!img) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = cv.clientWidth * dpr;
            const h = cv.clientHeight * dpr;
            if (cv.width !== w || cv.height !== h) {
              cv.width = w;
              cv.height = h;
            }
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
          };

          const load = (i: number) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.decoding = "async";
              img.onload = () => {
                if (!cancelled) {
                  frames[i] = img;
                  if (Math.abs(i - state.frame) <= COARSE_STEP) draw();
                }
                resolve();
              };
              img.onerror = () => resolve();
              img.src = frameUrl(set, i);
            });

          // coarse pass first, then fill in the gaps a few at a time
          const order: number[] = [];
          for (let i = 0; i < FRAME_COUNT; i += COARSE_STEP) order.push(i);
          for (let i = 0; i < FRAME_COUNT; i++) if (i % COARSE_STEP) order.push(i);
          (async () => {
            await load(0);
            if (!cancelled) setReady(true);
            for (let k = 1; k < order.length && !cancelled; k += 6) {
              await Promise.all(order.slice(k, k + 6).map(load));
            }
          })();

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "+=480%",
              pin: true,
              scrub: 0.6,
              onUpdate: draw,
            },
          });
          tl.to(state, { frame: FRAME_COUNT - 1, duration: 1, onUpdate: draw }, 0);
          tl.to(".film-intro", { autoAlpha: 0, y: -40, duration: 0.12 }, 0.06);
          captions.forEach((c, i) => {
            const sel = `.film-cap-${i}`;
            tl.fromTo(sel, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05 }, c.at - 0.06);
            if (i < captions.length - 1) tl.to(sel, { autoAlpha: 0, y: -24, duration: 0.05 }, c.at + 0.1);
          });
          tl.fromTo(".film-progress", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

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
      aria-label="House tour film, from the road to the cove"
      className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-ink text-on-image"
    >
      <Image
        src={poster}
        alt="The arched front gate in the hedge, the house beyond"
        fill
        preload
        sizes="100vw"
        placeholder="blur"
        className={`object-cover transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-scrim)_0%,transparent_62%)] md:bg-[linear-gradient(to_top,var(--color-scrim)_0%,transparent_46%),linear-gradient(to_bottom,oklch(18%_0.02_220/0.35)_0%,transparent_22%)]"
      />

      <div className="film-intro wrap absolute inset-x-0 bottom-0 pb-[clamp(2.5rem,8vh,6rem)]">
        <h1 className="max-w-[12ch] text-[length:var(--text-display)]">A house above the cove.</h1>
        <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-on-image/85">
          A private family home on a six metre bluff in Indonesia, between the city and the countryside.
        </p>
        <a
          href="#plans"
          className="group mt-8 inline-flex items-center gap-3 rounded-full bg-on-image py-2 pl-6 pr-2 text-sm font-medium text-ink transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          See the plans
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-on-image transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-y-0.5">
            <ArrowDown aria-hidden="true" size={16} weight="light" />
          </span>
        </a>
      </div>

      {captions.map((c, i) => (
        <p
          key={c.text}
          className={`film-cap-${i} invisible wrap absolute inset-x-0 bottom-0 pb-[clamp(3rem,10vh,7rem)] font-display text-[length:var(--text-2xl)] leading-[1.05]`}
        >
          <span className="block max-w-[18ch]">{c.text}</span>
        </p>
      ))}

      <div className="wrap absolute inset-x-0 bottom-0 pb-5">
        <div className="flex items-center gap-4 text-on-image/70">
          <span className="label">Road</span>
          <span className="relative h-px flex-1 bg-on-image/25">
            <span className="film-progress absolute inset-0 origin-left scale-x-0 bg-on-image" />
          </span>
          <span className="label">Cove</span>
        </div>
      </div>
    </section>
  );
}
