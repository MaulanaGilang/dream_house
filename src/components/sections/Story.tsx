"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { photos, walk } from "@/data/house";

// One hand-set route curve; stops sit on it at these x positions (viewBox 0..1200).
const ROUTE = "M20 150 C140 150 160 92 280 112 S420 196 540 150 S700 70 820 118 S980 210 1080 160 S1160 120 1180 128";
const STOPS = [60, 300, 560, 830, 1150];

/** The garland: cut-outs strung along the whole track (left in % of the track), so they bridge every panel. */
const GARLAND: { left: number; edge: "top" | "bottom"; w: number; rot: number; flip?: boolean; img: "a" | "b"; depth: number; phone?: boolean }[] = [
  { left: -2, edge: "top", w: 19, rot: 180, img: "a", depth: 0.4, phone: true },
  { left: 9, edge: "bottom", w: 16, rot: -8, img: "b", depth: 0.8 },
  { left: 17, edge: "top", w: 14, rot: 160, flip: true, img: "b", depth: 0.5 },
  { left: 24, edge: "bottom", w: 21, rot: 12, img: "a", depth: 1, phone: true },
  { left: 33, edge: "top", w: 16, rot: 200, img: "a", depth: 0.7 },
  { left: 42, edge: "bottom", w: 15, rot: -14, flip: true, img: "b", depth: 0.6 },
  { left: 50, edge: "top", w: 19, rot: 170, img: "b", depth: 0.9, phone: true },
  { left: 59, edge: "bottom", w: 17, rot: 6, img: "a", depth: 0.5 },
  { left: 67, edge: "top", w: 14, rot: 190, flip: true, img: "a", depth: 0.8 },
  { left: 75, edge: "bottom", w: 20, rot: -10, img: "b", depth: 1, phone: true },
  { left: 84, edge: "top", w: 16, rot: 175, img: "b", depth: 0.6 },
  { left: 93, edge: "bottom", w: 17, rot: 14, flip: true, img: "a", depth: 0.7 },
];

/**
 * Concept, the bluff and the walk as ONE horizontal chapter: the page pins and the content travels
 * sideways while a garland of maroon roses and lavender, strung across every panel, sways and drifts at
 * its own depth. On phones the panels stack and only a few flowers remain.
 */
export function Story() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // every flower breathes in the breeze, each on its own clock
        gsap.utils.toArray<HTMLElement>(".bloom-sway").forEach((el, i) => {
          gsap.fromTo(el, { rotation: -3 - (i % 3) }, { rotation: 3 + (i % 2) * 2, duration: 3.2 + (i % 4) * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -i * 0.6 });
          gsap.to(el, { y: (i % 2 ? -1 : 1) * 10, duration: 4.5 + (i % 3), ease: "sine.inOut", yoyo: true, repeat: -1 });
        });
      });
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const dist = () => el.scrollWidth - window.innerWidth;
        const slide = gsap.to(el, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        // depth: the garland drifts a little against the track, nearer flowers faster
        gsap.utils.toArray<HTMLElement>(".bloom").forEach((b) => {
          const d = Number(b.dataset.depth ?? 0.5);
          gsap.fromTo(b, { x: () => window.innerWidth * 0.12 * d }, {
            x: () => -window.innerWidth * 0.12 * d, ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, scrub: 0.6, invalidateOnRefresh: true },
          });
        });
        // the route draws itself as the walk panel slides in
        gsap.fromTo(".route", { strokeDashoffset: 1 }, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: ".walk-panel", containerAnimation: slide, start: "left 85%", end: "center 55%", scrub: 0.6 },
        });
        gsap.from(".route-stop", {
          autoAlpha: 0, y: 12, stagger: 0.12, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: ".walk-panel", containerAnimation: slide, start: "left 60%" },
        });
      });
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".route", { strokeDashoffset: 1 }, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: ".walk-panel", start: "top 70%", end: "center 45%", scrub: 0.6 },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="cove" aria-label="The concept, the bluff and the walk" className="relative overflow-hidden lg:h-[100dvh]">
      <div ref={track} className="relative flex flex-col lg:h-full lg:w-max lg:flex-row lg:items-center">
        {/* garland across the whole track */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          {GARLAND.map((g, i) => (
            <div
              key={i}
              data-depth={g.depth}
              className={`bloom absolute ${g.phone ? "" : "hidden lg:block"}`}
              style={{ left: `${g.left}%`, [g.edge]: g.edge === "top" ? "-7vh" : "-9vh", width: `min(${g.w}vw, ${g.w * 15}px)` }}
            >
              <div className="bloom-sway origin-center will-change-transform">
                <Image src={g.img === "a" ? photos.lavenderRoses : photos.roseBranch} alt="" width={600} height={600} className="h-auto w-full" style={{ transform: `rotate(${g.rot}deg)${g.flip ? " scaleX(-1)" : ""}` }} />
              </div>
            </div>
          ))}
        </div>

        {/* 1 · the concept */}
        <article aria-labelledby="concept-title" className="relative z-[1] flex w-full shrink-0 flex-col items-center justify-center px-[var(--gutter)] py-[var(--space-section)] text-center lg:h-full lg:w-[100vw] lg:py-0">
          <p className="label">The concept</p>
          <h2 id="concept-title" className="caps mt-8 max-w-[24ch] text-[length:var(--text-statement)] leading-[0.95]">
            La Casa is a family house of two floors and two bedrooms, closed in by a hedge and open to the sea
          </h2>
          <p className="body-small mt-12 max-w-[40ch] text-ink-2">
            Soft-modern Mediterranean, between classic and modern: lime plaster, rounded corners, tall arches on both floors
            and a low terracotta roof with wide eaves for tropical rain.
          </p>
          <ArchMark className="mt-12 h-10" />
        </article>

        {/* 2 · six metres above the sea */}
        <div className="relative z-[1] flex shrink-0 flex-col gap-12 px-[var(--gutter)] py-[var(--space-section)] lg:h-full lg:flex-row lg:items-center lg:gap-[6vw] lg:px-[4vw] lg:py-0">
          <h2 id="bluff-title" className="display flex flex-col text-[length:var(--text-mega)] lg:flex-row lg:items-center lg:gap-[4vw]">
            <span>Six</span>
            <span className="label tracking-[0.9em] lg:order-first">Indonesia</span>
            <span>metres</span>
          </h2>
          <figure className="relative aspect-[4/5] w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-[70dvh] lg:w-[32vw]">
            <Image src={photos.portal} alt="The arched plaster portal in the back hedge, with the cove and its headlands beyond" fill sizes="(min-width: 1024px) 32vw, 92vw" placeholder="blur" className="object-cover" />
          </figure>
          <p className="display text-[length:var(--text-mega)] lg:whitespace-nowrap">above the sea</p>
          <div className="max-w-[30ch] shrink-0 lg:max-w-[26ch]">
            <h3 className="caps text-[length:var(--text-caps)]">A cove for one house</h3>
            <p className="body-small mt-5 text-ink-2">
              Behind the arched portal the garden stops at a limestone bluff. Stone stairs in three flights of twelve go
              down to white sand, closed in by two headlands so the beach is seen only from the house and the sea.
            </p>
          </div>
          <figure className="relative aspect-[16/10] w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-[56dvh] lg:w-[44vw]">
            <Image src={photos.coveView} alt="The beach, the bluff with its stone stairs and the arched portal, seen from the water" fill sizes="(min-width: 1024px) 44vw, 92vw" placeholder="blur" className="object-cover" />
          </figure>
        </div>

        {/* 3 · from the road down to the sand */}
        <article aria-labelledby="walk-title" className="walk-panel relative z-[1] flex w-full shrink-0 flex-col justify-center py-[var(--space-section)] lg:h-full lg:w-[100vw] lg:py-0">
          <div className="flex flex-col items-center px-[var(--gutter)] text-center">
            <h2 id="walk-title" className="display text-[clamp(3.4rem,1rem+7vw,9rem)]">
              From the road
              <span className="script -my-[0.2em] block text-[length:var(--text-script)] normal-case">down</span>
              to the sand
            </h2>
          </div>
          <div className="mx-auto mt-10 w-full max-w-[1400px] px-[var(--gutter)]">
            <svg viewBox="0 0 1200 260" className="w-full overflow-visible" role="img" aria-label="The walk from the front gate at 0 m, past the front door at 21 m, the terrace at 34 m and the arched portal at 50 m, down to the beach 6 m below">
              <path className="route" d={ROUTE} fill="none" stroke="var(--color-ink)" strokeWidth="1.4" pathLength="1" strokeDasharray="1" />
              {walk.map((w, i) => {
                const x = STOPS[i];
                const up = i % 2 === 0;
                return (
                  <g key={w.name} className="route-stop">
                    <circle cx={x} cy={up ? 62 : 222} r="3.2" fill="var(--color-ink)" />
                    <text x={x} y={up ? 40 : 205} textAnchor="middle" className="label" style={{ fontSize: "11px" }} fill="var(--color-ink)">
                      {w.name}
                    </text>
                    <text x={x} y={up ? 26 : 191} textAnchor="middle" style={{ fontSize: "10px", fontStretch: "125%" }} fill="var(--color-ink)" opacity=".6">
                      {w.at}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="body-small mx-auto mt-8 max-w-[44ch] px-[var(--gutter)] text-center text-ink-2">
            A stepping-stone walk from the door to the driveway, a lavender path from the terrace to the portal, and stone
            stairs down the bluff. Distances are measured on the site plan.
          </p>
        </article>
      </div>
    </section>
  );
}
