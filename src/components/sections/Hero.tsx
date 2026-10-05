"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { intro, loading } from "@/lib/scroll";
import { chapterSnap } from "@/lib/snap";
import { ArchMark } from "@/components/brand/ArchMark";
import film from "@/data/film.json";

/** Film chapters, as timeline positions (the film itself runs 0 → 1, the sky rises 1 → END). */
const END = 1.2;
const captions = [
  { at: 0.3, text: "Through the gate, past the lavender" },
  { at: 0.55, text: "Over the roof to the arched portal" },
  { at: 0.8, text: "Down to a beach no one else can reach" },
];
const STOPS = [0, ...captions.map((c) => c.at), END];

const frameUrl = (set: string, i: number) => `/film/${set}/f${String(i + 1).padStart(3, "0")}.webp`;
const clamp = gsap.utils.clamp;

/**
 * The house tour, scrubbed by scroll: a Higgsfield flyover (road, gate, roof, portal, cove) cut into
 * frames and painted to a pinned canvas. Each scroll gesture glides to the next chapter, and at the
 * end a sky-blue circle rises over the last frame, ERA style, so the film hands straight over to the
 * three reasons without a second picture in between.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const cv = canvas.current!;
      // opaque, low-latency canvas: the film always covers it, so the compositor never blends it
      const ctx = cv.getContext("2d", { alpha: false, desynchronized: true });
      if (!ctx) return;

      // title entrance waits for the intro arch to open
      const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      if (motionOk) {
        gsap.set(".hero-char", { yPercent: 110 });
        gsap.set(".hero-script", { clipPath: "inset(0 100% 0 0)" });
        gsap.set(".hero-flank", { autoAlpha: 0, x: (i) => (i ? 36 : -36) });
        intro.on(() => {
          const t = gsap.timeline({ defaults: { ease: "power4.out" } });
          t.to(".hero-char", { yPercent: 0, duration: 1.3, stagger: 0.05 })
            .to(".hero-script", { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power2.inOut" }, 0.45)
            .to(".hero-flank", { autoAlpha: 1, x: 0, duration: 1.2, stagger: 0.08 }, 0.6);
        });
      }

      const mm = gsap.matchMedia();
      mm.add(
        // "any" always matches, so the poster and the loading report also run with reduced motion on desktop
        { any: "all", motion: "(prefers-reduced-motion: no-preference)", narrow: "(max-width: 767px) and (orientation: portrait)" },
        (context) => {
          const { motion, narrow } = context.conditions as { motion: boolean; narrow: boolean };
          // two frame sets: light 1280 px frames for motion (they decode fast enough to keep a glide at
          // 60 fps) and the full 1920 px frame, fetched and swapped in once the playhead rests. Phones use
          // their own small portrait set for both.
          const liteSet = narrow ? "mobile" : "desktop-lite";
          const fullSet = narrow ? "mobile" : "desktop";
          const sharpen = liteSet !== fullSet;
          const count = film.count;
          const blobs: (Blob | null)[] = new Array(count).fill(null);
          const state = { frame: 0 };
          let cancelled = false;

          // A sliding window of decoded light frames around the playhead (every other frame first, in the
          // direction of travel, so a fast glide never outruns the decoder), cross-faded in pairs so
          // 12 fps footage still glides when the scroll is slow. createImageBitmap(blob) without
          // resizing decodes off the main thread.
          const bitmaps = new Map<number, ImageBitmap>();
          const pending = new Map<number, Promise<void>>();
          let dirF = 1;
          let lastF = -1;
          const AHEAD = 40;
          const BEHIND = 8;
          const KEEP = 50;
          let full: { i: number; bmp: ImageBitmap } | null = null;
          let restTimer = 0;

          const decode = (i: number): Promise<void> | undefined => {
            const blob = blobs[i];
            if (!blob || bitmaps.has(i)) return;
            if (pending.has(i)) return pending.get(i);
            const job = createImageBitmap(blob)
              .then((b) => {
                pending.delete(i);
                if (cancelled) return void b.close();
                bitmaps.set(i, b);
                if (Math.abs(i - state.frame) < 1.5) draw(true);
              })
              .catch(() => void pending.delete(i));
            pending.set(i, job);
            return job;
          };
          const prime = (center: number) => {
            const c = Math.round(center);
            const at = (i: number) => i >= 0 && i < count && decode(i);
            for (let d = 0; d <= AHEAD && pending.size < 4; d += 2) at(c + d * dirF);
            for (let d = 1; d <= AHEAD && pending.size < 4; d += 2) at(c + d * dirF);
            for (let d = 1; d <= BEHIND && pending.size < 4; d++) at(c - d * dirF);
            for (const [i, b] of bitmaps) {
              if (Math.abs(i - c) > KEEP) {
                b.close();
                bitmaps.delete(i);
              }
            }
          };
          // the decoded frame at i, or the closest decoded one (never a synchronous decode on the main thread)
          const pick = (i: number): ImageBitmap | null => {
            const b = bitmaps.get(i);
            if (b) return b;
            let best: ImageBitmap | null = null;
            let bestD = Infinity;
            for (const [j, bm] of bitmaps) {
              const d = Math.abs(j - i);
              if (d < bestD) {
                bestD = d;
                best = bm;
              }
            }
            return best;
          };
          const paint = (src: ImageBitmap, alpha: number) => {
            const s = Math.max(cv.width / src.width, cv.height / src.height);
            ctx.globalAlpha = alpha;
            ctx.drawImage(src, (cv.width - src.width * s) / 2, (cv.height - src.height * s) / 2, src.width * s, src.height * s);
          };
          // at rest: fetch and decode the sharp 1920 px frame, then show it if the playhead is still there
          const restOn = (i: number) => {
            if (!sharpen || full?.i === i) return;
            fetch(frameUrl(fullSet, i))
              .then((r) => (r.ok ? r.blob() : null))
              .then((b) => (b ? createImageBitmap(b) : null))
              .then((bmp) => {
                if (!bmp) return;
                if (cancelled || Math.abs(state.frame - i) > 0.02) return void bmp.close();
                full?.bmp.close();
                full = { i, bmp };
                draw(true);
              })
              .catch(() => undefined);
          };
          const draw = (force?: boolean) => {
            const f = clamp(0, count - 1, state.frame);
            const moved = Math.abs(f - lastF) >= 0.01;
            if (moved && lastF >= 0) dirF = f > lastF ? 1 : -1;
            const base = Math.floor(f);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(cv.clientWidth * dpr);
            const h = Math.round(cv.clientHeight * dpr);
            prime(f); // evicts far frames first, so the frame picked below is never a closed bitmap
            if (moved) {
              window.clearTimeout(restTimer);
              restTimer = window.setTimeout(() => restOn(Math.round(state.frame)), 150);
            }
            const resting = full && Math.abs(f - full.i) < 0.02;
            const a = resting ? full!.bmp : pick(base);
            if (!a) return;
            const resized = cv.width !== w || cv.height !== h;
            if (resized) {
              cv.width = w;
              cv.height = h;
            }
            if (!force && !resized && !moved) return;
            lastF = f;
            paint(a, 1);
            if (!resting) {
              const t = f - base;
              // blend in the next frame only while the playhead really sits between two frames
              const next = t > 0.12 && t < 0.88 && base + 1 < count ? bitmaps.get(base + 1) : undefined;
              if (next) paint(next, t);
            }
            ctx.globalAlpha = 1;
          };
          const load = (i: number) =>
            fetch(frameUrl(liteSet, i))
              .then((r) => (r.ok ? r.blob() : null))
              .then((b) => {
                if (cancelled || !b) return;
                blobs[i] = b;
                if (Math.abs(i - state.frame) <= AHEAD) decode(i);
              })
              .catch(() => undefined);

          // coarse pass first (every 12th frame) so the whole film scrubs at once, then fill in
          const order: number[] = [];
          for (const step of [12, 4, 2, 1]) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
          const firstPass = Math.ceil(count / 12);
          (async () => {
            await load(0);
            await decode(0);
            if (cancelled) return;
            draw(true);
            restOn(0);
            setReady(true);
            if (!motion) return loading.set(1);
            let done = 1;
            for (let k = 1; k < order.length && !cancelled; k += 6) {
              await Promise.all(order.slice(k, k + 6).map(load));
              done = Math.min(firstPass, k + 6);
              loading.set(done / firstPass);
            }
          })();

          if (!motion) return () => (cancelled = true);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=380%",
              pin: true,
              scrub: 0.3,
              onUpdate: (self) => {
                draw();
                // dark chrome once the sky has covered the film
                root.current?.setAttribute("data-chrome", self.progress * END > 1.1 ? "dark" : "light");
              },
            },
          });
          tl.to(state, { frame: count - 1, duration: 1, onUpdate: () => draw() }, 0);
          tl.to(".hero-title", { yPercent: -16, autoAlpha: 0, duration: 0.12 }, 0.02);
          captions.forEach((c, i) => {
            tl.fromTo(`.hero-cap-${i}`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, c.at - 0.07);
            tl.to(`.hero-cap-${i}`, { autoAlpha: 0, y: -30, duration: 0.05 }, i < captions.length - 1 ? c.at + 0.07 : 0.97);
          });
          // the sky rises over the last frame
          tl.fromTo(".hero-sky", { clipPath: "circle(0% at 50% 118%)" }, { clipPath: "circle(150% at 50% 118%)", duration: END - 1 }, 1);
          tl.fromTo(".hero-arc", { rotate: -18, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 0.12 }, 1.06);
          tl.fromTo(".hero-sky-copy", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 1.11);

          // one gesture = one chapter (ERA's section-snap timing)
          const stopSnap = chapterSnap(tl.scrollTrigger!, STOPS.map((s) => s / tl.duration()));

          const onResize = () => draw(true);
          window.addEventListener("resize", onResize);
          return () => {
            cancelled = true;
            window.clearTimeout(restTimer);
            bitmaps.forEach((b) => b.close());
            bitmaps.clear();
            full?.bmp.close();
            stopSnap();
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
      <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0" />

      <div className="hero-title absolute inset-x-0 top-[max(8vh,7.5rem)] md:top-[8vh] flex flex-col items-center px-[var(--gutter)] text-center [text-shadow:0_2px_30px_oklch(20%_0.05_255/0.35)]">
        <h1 className="display text-[length:var(--text-mega)]" aria-label="La Casa">
          {"La Casa".split("").map((ch, i) => (
            <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
              <span className="hero-char inline-block whitespace-pre">{ch}</span>
            </span>
          ))}
        </h1>
        {/* ERA's lockup: the script tilts up across the foot of the title, the two flank words sit a step lower */}
        <div className="mt-[-0.3em] grid w-full max-w-[1500px] grid-cols-1 items-center justify-items-center gap-[3vw] md:grid-cols-[1fr_auto_1fr] md:justify-items-stretch">
          <p className="hero-flank caps hidden justify-self-end text-right text-[clamp(1.6rem,0.9rem+1.6vw,2.9rem)] md:block md:translate-y-[85%]">A house</p>
          <div className="ml-[0.9em] -rotate-[11deg] md:ml-[1.6em]">
            <p className="hero-script script text-[length:var(--text-script)] [text-shadow:0_2px_24px_oklch(20%_0.05_255/0.45)]">Indonesia</p>
          </div>
          <p className="hero-flank caps hidden justify-self-start text-left text-[clamp(1.6rem,0.9rem+1.6vw,2.9rem)] md:block md:translate-y-[85%]">Above the cove</p>
          <p className="hero-flank caps mt-4 text-[1.35rem] md:hidden">A house above the cove</p>
        </div>
      </div>

      {captions.map((c, i) => (
        <p key={c.text} className={`hero-cap-${i} invisible caps absolute inset-x-0 bottom-[12vh] mx-auto max-w-[16ch] text-center text-[length:var(--text-caps)] [text-shadow:0_2px_24px_oklch(20%_0.05_255/0.5)]`}>
          {c.text}
        </p>
      ))}

      {/* the sky that rises over the last frame; the three reasons continue on the same blue below */}
      <div aria-hidden="true" className="hero-sky absolute inset-0 bg-sky text-ink [clip-path:circle(0%_at_50%_118%)]">
        <svg viewBox="0 0 1000 520" className="hero-arc absolute left-1/2 top-[9vh] w-[min(92vw,1100px)] -translate-x-1/2 overflow-visible">
          <defs>
            <path id="arc" d="M60 500 A470 470 0 0 1 940 500" />
          </defs>
          <text className="caps" fill="var(--color-ink)" style={{ fontSize: "52px", letterSpacing: "2px" }}>
            <textPath href="#arc" startOffset="50%" textAnchor="middle">Three reasons to call it home</textPath>
          </text>
        </svg>
        <div className="hero-sky-copy absolute inset-x-0 top-[48vh] flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-4">
            <span className="label">The coast</span>
            <ArchMark className="h-9" />
            <span className="label">Indonesia</span>
          </div>
          <span className="h-[16vh] w-px bg-ink/40" />
          <p className="label max-w-[26ch]">A house to come home to, closed in by a garden, open to the sea</p>
        </div>
      </div>
    </section>
  );
}
