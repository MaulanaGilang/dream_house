"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { walk } from "@/data/house";

// One hand-set route curve; stops sit on it at these x positions (viewBox 0..1200).
const ROUTE = "M20 150 C140 150 160 92 280 112 S420 196 540 150 S700 70 820 118 S980 210 1080 160 S1160 120 1180 128";
const STOPS = [60, 300, 560, 830, 1150];

export function Walk() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".route", { strokeDashoffset: 1 }, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 70%", end: "center 45%", scrub: 0.6 },
        });
        gsap.from(".route-stop", {
          autoAlpha: 0, y: 12, stagger: 0.12, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 55%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="walk-title" className="overflow-hidden py-[var(--space-section)]">
      <div className="wrap flex flex-col items-center text-center">
        <h2 id="walk-title" className="display text-[length:var(--text-mega)]">
          From the road
          <span className="script -my-[0.2em] block text-[length:var(--text-script)] normal-case">down</span>
          to the sand
        </h2>
      </div>
      <div className="mx-auto mt-16 w-full max-w-[1500px] px-[var(--gutter)]">
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
      <p className="body-small mx-auto mt-12 max-w-[44ch] px-[var(--gutter)] text-center text-ink-2">
        A stepping-stone walk from the gate to the door, a lavender path from the terrace to the portal, and stone stairs
        down the bluff. Distances are measured on the site plan.
      </p>
    </section>
  );
}
