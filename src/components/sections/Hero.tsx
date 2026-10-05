"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis, intro, loading } from "@/lib/scroll";
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

const frameUrl = (set: string, i: number) => `/film/${set}/f${String(i + 1).padStart(3, "0")}.avif`;
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
      const ctx = cv.getContext("2d");
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
          let drawn = -1;
          const draw = (force?: boolean) => {
            const want = Math.round(state.frame);
            const img = nearest(want);
            if (!img) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(cv.clientWidth * dpr);
            const h = Math.round(cv.clientHeight * dpr);
            const resized = cv.width !== w || cv.height !== h;
            if (resized) {
              cv.width = w;
              cv.height = h;
            }
            if (!force && !resized && drawn === want && frames[want]) return;
            drawn = frames[want] ? want : -1;
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
                  if (Math.abs(i - state.frame) < 8) draw(true);
                }
                resolve();
              };
              img.onerror = () => resolve();
              img.src = frameUrl(set, i);
            });

          // coarse pass first (every 12th frame) so the whole film scrubs at once, then fill in
          const order: number[] = [];
          for (const step of [12, 4, 1]) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
          const firstPass = Math.ceil(count / 12);
          (async () => {
            await load(0);
            if (cancelled) return;
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
          tl.to(".hero-flank", { autoAlpha: 0, duration: 0.08 }, 0.02);
          captions.forEach((c, i) => {
            tl.fromTo(`.hero-cap-${i}`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, c.at - 0.07);
            tl.to(`.hero-cap-${i}`, { autoAlpha: 0, y: -30, duration: 0.05 }, i < captions.length - 1 ? c.at + 0.07 : 0.97);
          });
          // the sky rises over the last frame
          tl.fromTo(".hero-sky", { clipPath: "circle(0% at 50% 118%)" }, { clipPath: "circle(150% at 50% 118%)", duration: END - 1 }, 1);
          tl.fromTo(".hero-arc", { rotate: -18, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 0.12 }, 1.06);
          tl.fromTo(".hero-sky-copy", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 1.11);

          // one gesture = one chapter: when the wheel or finger stops inside the film, glide to the next stop
          // (Lenis is created after this layout effect, so it is looked up when a glide starts)
          const st = tl.scrollTrigger!;
          let timer = 0;
          let dir = 1;
          let lastY = window.scrollY;
          const snap = () => {
            const y = window.scrollY;
            if (y <= st.start + 1 || y >= st.end - 1) return;
            const p = (tl.duration() * (y - st.start)) / (st.end - st.start);
            if (STOPS.some((s) => Math.abs(s - p) < 0.006)) return;
            const next = dir > 0 ? STOPS.find((s) => s > p) : [...STOPS].reverse().find((s) => s < p);
            if (next === undefined) return;
            const target = st.start + (next / tl.duration()) * (st.end - st.start);
            const duration = clamp(0.7, 1.5, (Math.abs(target - y) / window.innerHeight) * 0.95);
            getLenis()?.scrollTo(target, { duration, easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) });
          };
          const onScroll = () => {
            const y = window.scrollY;
            if (y !== lastY) dir = y > lastY ? 1 : -1;
            lastY = y;
            window.clearTimeout(timer);
            if (getLenis()) timer = window.setTimeout(snap, 110);
          };
          window.addEventListener("scroll", onScroll, { passive: true });

          const onResize = () => draw(true);
          window.addEventListener("resize", onResize);
          return () => {
            cancelled = true;
            window.clearTimeout(timer);
            window.removeEventListener("scroll", onScroll);
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
        <div className="mt-[-0.15em] grid w-full max-w-[1500px] grid-cols-1 items-center justify-items-center gap-[3vw] md:grid-cols-[1fr_auto_1fr] md:justify-items-stretch">
          <div className="hero-flank hidden justify-self-end text-right md:block">
            <p className="caps text-[clamp(1.6rem,0.9rem+1.6vw,2.9rem)]">A house</p>
            <p className="label mt-3 opacity-85">Two floors, two bedrooms</p>
          </div>
          <p className="hero-script script text-[length:var(--text-script)] [text-shadow:0_2px_24px_oklch(20%_0.05_255/0.45)]">Indonesia</p>
          <div className="hero-flank hidden justify-self-start text-left md:block">
            <p className="caps text-[clamp(1.6rem,0.9rem+1.6vw,2.9rem)]">Above the cove</p>
            <p className="label mt-3 opacity-85">On a 6 m limestone bluff</p>
          </div>
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
