"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { areaOf, rooms } from "@/data/house";

/** Room by room: vertical scroll pans the row sideways on large screens; native swipe on small ones. */
export function Rooms() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="rooms" aria-labelledby="rooms-title" className="overflow-hidden lg:h-[100dvh]">
      <div
        ref={track}
        tabIndex={0}
        aria-label="Rooms, scroll sideways"
        className="flex h-full scroll-px-[var(--gutter)] snap-x snap-mandatory items-center gap-[clamp(1rem,2vw,2rem)] overflow-x-auto px-[var(--gutter)] py-[var(--space-section)] [scrollbar-width:none] lg:snap-none lg:overflow-visible lg:pt-16 lg:pb-0"
      >
        <div className="flex w-[80vw] shrink-0 snap-start flex-col justify-end self-stretch pb-4 sm:w-[44vw] lg:w-[30vw] lg:justify-center lg:pb-0">
          <h2 id="rooms-title" className="max-w-[9ch] text-[length:var(--text-3xl)]">Room by room.</h2>
          <p className="mt-6 max-w-[34ch] text-ink-2">
            Two bedrooms, a long work room and a living floor that opens to the terrace. Areas are net, measured from
            the drawings.
          </p>
        </div>
        {rooms.map((r) => {
          const area = areaOf(r.id);
          return (
            <article key={r.id} className="w-[80vw] shrink-0 snap-start sm:w-[52vw] lg:w-[34vw]">
              <div className="relative aspect-[4/5] overflow-hidden bg-paper-3 lg:aspect-auto lg:h-[54dvh]">
                <Image
                  src={r.image}
                  alt={r.alt}
                  fill
                  sizes="(min-width: 1024px) 34vw, 80vw"
                  placeholder="blur"
                  className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out)] hover:scale-[1.03]"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="text-2xl">{r.name}</h3>
                <p className="shrink-0 font-mono text-xs text-ink-3">
                  {r.floor === "ground" ? "Ground" : "Upper"}
                  {area ? `, ${area.toFixed(1)} m²` : ""}
                </p>
              </div>
              <p className="mt-2 max-w-[42ch] text-sm text-ink-2">{r.note}</p>
            </article>
          );
        })}
        <div aria-hidden="true" className="w-[var(--gutter)] shrink-0" />
      </div>
    </section>
  );
}
