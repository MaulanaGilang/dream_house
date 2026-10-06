"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { intro, loading } from "@/lib/scroll";
import { chapterSnap } from "@/lib/snap";
import { ArchMark } from "@/components/brand/ArchMark";
import film from "@/data/film.json";

/**
 * Film chapters as timeline positions: the film runs 0 → 1, the sky rises 1 → END. One scroll per
 * chapter: the gate, the drone over the front garden, the drone over the house to the cove, and the
 * house seen from the cove (the last frame of the film).
 */
const END = 1.25;
const chapters = [
  { at: film.chapters[0], text: "Through the gate, past the lavender" },
  { at: film.chapters[1], text: "Over the house to the cove" },
  { at: 1, text: "And down to a beach no one else can reach" },
];
const STOPS = [0, ...chapters.map((c) => c.at), END];

const frameUrl = (set: string, i: number) => `/film/${set}/f${String(i + 1).padStart(3, "0")}.webp`;
const clamp = gsap.utils.clamp;

/**
 * The house tour, scrubbed by scroll: a Higgsfield flyover cut into full-resolution frames and painted to
 * a pinned canvas. Each scroll gesture glides slowly to the next chapter; at the end a sky-blue arch
 * rises over the last frame, ERA style, with "Three reasons to call it home" set along its curve.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const cv = canvas.current!;
      // opaque canvas: the film always covers it, so the compositor never blends it
      const ctx = cv.getContext("2d", { alpha: false });
      if (!ctx) return;

      // title entrance waits for the intro arch to open
      const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      if (motionOk) {
        gsap.set(".hero-char", { yPercent: 110 });
        gsap.set(".hero-script", { clipPath: "inset(0 100% 0 0)" });
        gsap.set(".hero-flank", { autoAlpha: 0, y: 24 });
        intro.on(() => {
          const t = gsap.timeline({ defaults: { ease: "power4.out" } });
          t.to(".hero-char", { yPercent: 0, duration: 1.3, stagger: 0.05 })
            .to(".hero-script", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power2.inOut" }, 0.4)
            .to(".hero-flank", { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.7);
        });
      }

      const mm = gsap.matchMedia();
      mm.add(
        // "any" always matches, so the poster and the loading report also run with reduced motion on desktop
        { any: "all", motion: "(prefers-reduced-motion: no-preference)", narrow: "(max-width: 767px) and (orientation: portrait)" },
        (context) => {
          const { motion, narrow } = context.conditions as { motion: boolean; narrow: boolean };
          const set = narrow ? "mobile" : "desktop";
          const count = film.count;
          const blobs: (Blob | null)[] = new Array(count).fill(null);
          const state = { frame: 0 };
          let cancelled = false;

          // Full-resolution frames only, one at a time (no cross-fading, which reads as blur). A sliding
          // window of frames around the playhead is decoded off the main thread by createImageBitmap(blob)
          // without resizing (the resize option is the slow path), every other frame first in the
          // direction of travel so a glide never outruns the decoder.
          const bitmaps = new Map<number, ImageBitmap>();
          const pending = new Map<number, Promise<void>>();
          let dirF = 1;
          let lastF = -1;
          let shown = -1;
          const AHEAD = 36;
          const BEHIND = 8;
          const KEEP = 48;

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
          const pick = (i: number): [number, ImageBitmap] | null => {
            const b = bitmaps.get(i);
            if (b) return [i, b];
            let best: [number, ImageBitmap] | null = null;
            let bestD = Infinity;
            for (const [j, bm] of bitmaps) {
              const d = Math.abs(j - i);
              if (d < bestD) {
                bestD = d;
                best = [j, bm];
              }
            }
            return best;
          };
          const draw = (force?: boolean) => {
            const f = clamp(0, count - 1, state.frame);
            const moved = Math.abs(f - lastF) >= 0.01;
            if (moved && lastF >= 0) dirF = f > lastF ? 1 : -1;
            lastF = f;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(cv.clientWidth * dpr);
            const h = Math.round(cv.clientHeight * dpr);
            prime(f); // evicts far frames first, so the frame picked below is never a closed bitmap
            const hit = pick(Math.round(f));
            if (!hit) return;
            const resized = cv.width !== w || cv.height !== h;
            if (resized) {
              cv.width = w;
              cv.height = h;
            }
            if (!force && !resized && hit[0] === shown) return;
            shown = hit[0];
            const src = hit[1];
            const s = Math.max(cv.width / src.width, cv.height / src.height);
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(src, (cv.width - src.width * s) / 2, (cv.height - src.height * s) / 2, src.width * s, src.height * s);
          };
          const load = (i: number) =>
            fetch(frameUrl(set, i))
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
            setReady(true);
            if (!motion) return loading.set(1);
            for (let k = 1; k < order.length && !cancelled; k += 6) {
              await Promise.all(order.slice(k, k + 6).map(load));
              loading.set(Math.min(firstPass, k + 6) / firstPass);
            }
          })();

          if (!motion) return () => (cancelled = true);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=560%",
              pin: true,
              scrub: 0.4,
              onUpdate: (self) => {
                draw();
                // dark chrome once the sky has covered the film
                root.current?.setAttribute("data-chrome", self.progress * END > 1.15 ? "dark" : "light");
              },
            },
          });
          tl.to(state, { frame: count - 1, duration: 1, onUpdate: () => draw() }, 0);
          tl.to(".hero-title", { yPercent: -14, autoAlpha: 0, duration: 0.1 }, 0.02);
          chapters.forEach((c, i) => {
            tl.fromTo(`.hero-cap-${i}`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, c.at - 0.08);
            tl.to(`.hero-cap-${i}`, { autoAlpha: 0, y: -30, duration: 0.05 }, i < chapters.length - 1 ? c.at + 0.06 : 1.02);
          });
          // the sky arch rises over the last frame; its words already sit on the curve and only spread apart
          tl.fromTo(".hero-sky", { clipPath: "circle(0% at 50% 125%)" }, { clipPath: "circle(140% at 50% 125%)", duration: END - 1 }, 1);
          tl.fromTo(".hero-arc", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 1.05);
          tl.fromTo(".hero-arc-text", { wordSpacing: "0px" }, { wordSpacing: "46px", duration: END - 1.05 }, 1.05);
          tl.fromTo(".hero-sky-copy", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 1.12);

          // one slow, smooth glide per chapter
          const stopSnap = chapterSnap(tl.scrollTrigger!, STOPS.map((s) => s / tl.duration()), { duration: 1.8 });

          const onResize = () => draw(true);
          window.addEventListener("resize", onResize);
          return () => {
            cancelled = true;
            bitmaps.forEach((b) => b.close());
            bitmaps.clear();
            stopSnap();
            window.removeEventListener("resize", onResize);
          };
        },
      );
      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  const title = (word: string) =>
    word.split("").map((ch, i) => (
      <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
        <span className="hero-char inline-block">{ch}</span>
      </span>
    ));

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

      {/* ERA's lockup: two big lines, a large script crossing the foot of the second, the flank words level with the script */}
      <div className="hero-title absolute inset-x-0 top-[max(7vh,6.5rem)] flex flex-col items-center px-[var(--gutter)] text-center [text-shadow:0_2px_30px_oklch(20%_0.05_255/0.35)] md:top-[6vh]">
        <h1 className="display relative flex flex-col items-center text-[clamp(5.5rem,2rem+10vw,15rem)] leading-[0.84]" aria-label="La Casa">
          <span className="block">{title("La")}</span>
          <span className="block">{title("Casa")}</span>
        </h1>
        <div className="relative -mt-[0.46em] text-[clamp(4rem,1.4rem+7.4vw,11rem)]">
          <p className="hero-script script ml-[0.9em] -rotate-[10deg] pb-[0.15em] [text-shadow:0_2px_24px_oklch(20%_0.05_255/0.45)]">Indonesia</p>
        </div>
        <p className="hero-flank caps mt-2 text-[1.35rem] [@media(min-width:1024px)_and_(min-aspect-ratio:16/10)]:hidden">A house above the cove</p>
      </div>

      {/* the flank words sit on the hedge either side of the gate: placed in the film frame's own
          coordinates (it is drawn "cover"), so they stay on the hedge at any wide screen size */}
      <div className="hero-title pointer-events-none absolute inset-0 hidden [container-type:size] [text-shadow:0_2px_30px_oklch(20%_0.05_255/0.45)] [@media(min-width:1024px)_and_(min-aspect-ratio:16/10)]:block">
        {[
          { text: "A house", x: 0.13 },
          { text: "Above the cove", x: 0.87 },
        ].map((f) => (
          <span
            key={f.text}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={{
              left: `calc(50cqw + ${(f.x - 0.5).toFixed(2)} * max(100cqw, 177.78cqh))`,
              top: "calc(50cqh + 0.155 * max(56.25cqw, 100cqh))",
            }}
          >
            <span className="hero-flank caps block text-[clamp(1.8rem,0.8rem+1.8vw,3.4rem)]">{f.text}</span>
          </span>
        ))}
      </div>

      {chapters.map((c, i) => (
        <p key={c.text} className={`hero-cap-${i} invisible caps absolute inset-x-0 bottom-[12vh] mx-auto max-w-[18ch] text-center text-[length:var(--text-caps)] [text-shadow:0_2px_24px_oklch(20%_0.05_255/0.5)]`}>
          {c.text}
        </p>
      ))}

      {/* the sky that rises over the last frame; the three reasons continue on the same blue below */}
      <div aria-hidden="true" className="hero-sky absolute inset-0 bg-sky text-ink [clip-path:circle(0%_at_50%_125%)]">
        <svg viewBox="0 0 1000 520" className="hero-arc absolute left-1/2 top-[12vh] w-[min(92vw,1150px)] -translate-x-1/2 overflow-visible">
          <defs>
            <path id="arc" d="M40 520 A470 470 0 0 1 960 520" />
          </defs>
          <text className="hero-arc-text caps" fill="var(--color-ink)" style={{ fontSize: "58px", letterSpacing: "1px" }}>
            <textPath href="#arc" startOffset="50%" textAnchor="middle">Three reasons to call it home</textPath>
          </text>
        </svg>
        <div className="hero-sky-copy absolute inset-x-0 top-[50vh] flex flex-col items-center gap-5 text-center">
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
