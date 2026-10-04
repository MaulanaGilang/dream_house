"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";

const ring = "LA CASA · ABOVE THE COVE · INDONESIA · ";

/**
 * Fixed frame in the ERA manner: rotating emblem top-left, drawings link top-right,
 * scroll counter on the left. Turns white over any section marked data-chrome="light".
 */
export function Chrome() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      // white chrome while a photo section (data-chrome="light") sits under the top of the viewport
      const lights = gsap.utils.toArray<HTMLElement>("[data-chrome='light']", document);
      const syncChrome = () => {
        const over = lights.some((el) => {
          const r = el.getBoundingClientRect();
          return r.top <= 48 && r.bottom > 48;
        });
        root.current?.classList.toggle("chrome-light", over);
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onRefresh: syncChrome,
        onUpdate: (self) => {
          syncChrome();
          if (count.current) count.current.textContent = String(Math.round(self.progress * 100)).padStart(2, "0");
          if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`;
        },
      });
      syncChrome();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="chrome pointer-events-none fixed inset-0 z-50 text-ink transition-colors duration-500 [&.chrome-light]:text-white">
      <a href="#top" aria-label="La Casa, back to the top" className="pointer-events-auto absolute left-[clamp(1rem,2.4vw,2.25rem)] top-[clamp(1rem,2.4vw,2rem)] block h-[clamp(4.25rem,6vw,5.75rem)] w-[clamp(4.25rem,6vw,5.75rem)]">
        <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <path id="ring" d="M50 50 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
          </defs>
          <text fill="currentColor" style={{ fontFamily: "var(--font-body)", fontStretch: "125%", fontSize: "8.2px", fontWeight: 700, letterSpacing: "1.6px" }}>
            <textPath href="#ring">{ring}</textPath>
          </text>
        </svg>
        <ArchMark className="absolute left-1/2 top-1/2 h-[38%] -translate-x-1/2 -translate-y-1/2" />
      </a>

      <nav aria-label="Main" className="pointer-events-auto absolute right-[clamp(1rem,2.4vw,2.25rem)] top-[clamp(1.1rem,2.4vw,2rem)] flex flex-col items-end gap-2 text-right">
        <a href="#drawings" className="caps text-[clamp(1.05rem,0.8rem+0.6vw,1.45rem)] leading-[0.95] underline decoration-1 underline-offset-[5px] transition-opacity hover:opacity-70">
          See the
          <br />
          drawings
        </a>
        <a href="#rooms" className="label transition-opacity hover:opacity-70">Rooms</a>
        <a href="#cove" className="label -mt-1 transition-opacity hover:opacity-70">The cove</a>
      </nav>

      <div aria-hidden="true" className="absolute bottom-[clamp(1.2rem,3vh,2.2rem)] left-[clamp(1.6rem,3.2vw,3rem)] hidden flex-col items-center gap-3 md:flex">
        <span ref={count} className="label tabular-nums">00</span>
        <span className="relative h-[22vh] w-px bg-current/25">
          <span ref={bar} className="absolute inset-0 origin-top scale-y-0 bg-current" />
        </span>
        <span className="label [writing-mode:vertical-rl] rotate-180">Scroll</span>
      </div>
    </div>
  );
}
