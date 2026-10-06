"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { photos, walk } from "@/data/house";

// One hand-set route curve; stops sit on it at these x positions (viewBox 0..1200).
const ROUTE = "M20 150 C140 150 160 92 280 112 S420 196 540 150 S700 70 820 118 S980 210 1080 160 S1160 120 1180 128";
const STOPS = [60, 300, 560, 830, 1150];

/**
 * Flower masses on the sideways track (left in vw from the start of the track). Each one sits across the
 * join of two panels, ERA style, so the planting carries on from one slide into the next.
 */
const BLOOMS: { img: "cascade" | "mound"; left: number; edge: "top" | "bottom"; w: number; flip?: boolean; turn?: boolean; depth: number; phone?: boolean }[] = [
  { img: "cascade", left: -6, edge: "top", w: 38, depth: 0.3, phone: true },
  { img: "mound", left: 80, edge: "bottom", w: 34, flip: true, depth: 0.7 },
  // turned upside down so it hangs from the top edge: its only straight cut stays above the screen
  { img: "mound", left: 251, edge: "top", w: 18, turn: true, depth: 0.2 },
  { img: "mound", left: 330, edge: "bottom", w: 26, depth: 0.8 },
];

/**
 * The concept, "Above the cove" and the walk as ONE horizontal chapter: the page pins and the panels
 * travel sideways, while lush masses of maroon roses and lavender drift a little at their own depth. On phones the panels stack and one mass remains.
 */
export function Story() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        // the track's own width, not scrollWidth: flowers hanging past its end must not push the last
        // panel off centre
        const dist = () => el.offsetWidth - window.innerWidth;
        const slide = gsap.to(el, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        // depth: the flowers drift a little against the track, nearer ones faster
        gsap.utils.toArray<HTMLElement>(".bloom").forEach((b) => {
          const d = Number(b.dataset.depth ?? 0.5);
          gsap.fromTo(b, { x: () => window.innerWidth * 0.1 * d }, {
            x: () => -window.innerWidth * 0.1 * d, ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, scrub: 0.6, invalidateOnRefresh: true },
          });
        });
        // the stacked words slide past each other a little, as ERA's "New Golden Mile" does
        gsap.utils.toArray<HTMLElement>(".cove-word").forEach((w, i) => {
          gsap.fromTo(w, { xPercent: (i - 1) * 12 }, {
            xPercent: (1 - i) * 6, ease: "none",
            scrollTrigger: { trigger: ".cove-panel", containerAnimation: slide, start: "left right", end: "right left", scrub: 0.6 },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="cove" aria-label="The concept, above the cove and the walk" className="relative overflow-hidden lg:h-[100dvh]">
      <div ref={track} className="relative flex flex-col lg:h-full lg:w-[350vw] lg:flex-row">
        {/* flower masses across the panel joins */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
          {BLOOMS.map((b, i) => (
            <div
              key={i}
              data-depth={b.depth}
              className={`bloom absolute ${b.phone ? "" : "hidden lg:block"}`}
              style={{ left: `${b.left}vw`, [b.edge]: b.edge === "top" ? "-5vh" : "-4vh", width: `max(${b.w}vw, 15rem)` }}
            >
              <Image
                src={b.img === "cascade" ? photos.bloomCascade : photos.bloomMound}
                alt=""
                sizes="38vw"
                className={`h-auto w-full ${b.flip ? "-scale-x-100" : ""} ${b.turn ? "rotate-180" : ""}`}
              />
            </div>
          ))}
        </div>

        {/* 1 · the concept, set wide and centred as ERA's */}
        <article aria-labelledby="concept-title" className="relative z-[1] flex w-full shrink-0 flex-col items-center justify-center px-[var(--gutter)] py-[var(--space-section)] text-center lg:h-full lg:w-[100vw] lg:py-0">
          <p className="label">The concept</p>
          <h2 id="concept-title" className="caps mt-10 max-w-[30ch] text-[clamp(2.2rem,1rem+3vw,4.6rem)] leading-[0.98]">
            La Casa is a family house of two floors and two bedrooms, closed in by a hedge and open to the sea
          </h2>
          <p className="body-small mt-12 max-w-[42ch] text-ink-2">
            Soft-modern Mediterranean, between classic and modern: lime plaster, rounded corners, tall arches on both floors
            and a low terracotta roof with wide eaves for tropical rain.
          </p>
          <ArchMark className="mt-12 h-10" />
        </article>

        {/* 2 · above the cove: stacked words around a tall photo, as ERA's "New Golden Mile" */}
        <article aria-labelledby="cove-title" className="cove-panel relative z-[1] flex w-full shrink-0 flex-col gap-10 px-[var(--gutter)] py-[var(--space-section)] lg:block lg:h-full lg:w-[150vw] lg:p-0">
          <h2 id="cove-title" className="display relative z-[1] flex flex-col text-[clamp(4.5rem,1rem+10vw,12.5rem)] leading-[0.86] lg:absolute lg:left-[24vw] lg:top-1/2 lg:-translate-y-1/2">
            <span className="cove-word block lg:pl-[9vw]">Above</span>
            <span className="cove-word block lg:pl-[22vw]">the</span>
            <span className="cove-word block">cove</span>
          </h2>
          <p className="caps text-[clamp(1.3rem,0.6rem+1.4vw,2.4rem)] tracking-[0.75em] lg:absolute lg:left-[3vw] lg:top-1/2 lg:-translate-y-1/2" aria-hidden="true">
            Indonesia
          </p>
          <figure className="relative aspect-[4/5] w-full overflow-hidden lg:absolute lg:left-[55vw] lg:top-[6vh] lg:aspect-auto lg:h-[88dvh] lg:w-[36vw]">
            <Image src={photos.portal} alt="The arched plaster portal in the back hedge, with the cove and its headlands beyond" fill sizes="(min-width: 1024px) 36vw, 92vw" placeholder="blur" className="object-cover" />
          </figure>
          <div className="max-w-[34ch] lg:absolute lg:bottom-[8vh] lg:left-[95vw]">
            <h3 className="caps text-[clamp(1.8rem,1rem+1.6vw,3rem)] leading-none">Six metres above the sea</h3>
            <p className="body-small mt-5 text-ink-2">
              Behind the arched portal the garden stops at a limestone bluff. Stone stairs in three flights of twelve go
              down to white sand, closed in by two headlands so the beach is seen only from the house and the sea.
            </p>
          </div>
          <figure className="relative aspect-[16/10] w-full overflow-hidden lg:absolute lg:left-[95vw] lg:top-[8vh] lg:aspect-auto lg:h-[48dvh] lg:w-[44vw]">
            <Image src={photos.coveView} alt="The beach, the bluff with its stone stairs and the arched portal, seen from the water" fill sizes="(min-width: 1024px) 46vw, 92vw" placeholder="blur" className="object-cover" />
          </figure>
        </article>

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
              <path className="route" d={ROUTE} fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
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
