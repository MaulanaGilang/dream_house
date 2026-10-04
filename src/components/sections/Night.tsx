"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { features, photos } from "@/data/house";

/** Night render with ERA's stacked list: one item lights up at a time as you scroll. */
export function Night() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>(".feat");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=90%", pin: true, scrub: 0.5 },
        });
        items.forEach((el, i) => {
          tl.to(el, { opacity: 1, duration: 0.5 }, i);
          if (i < items.length - 1) tl.to(el, { opacity: 0.35, duration: 0.5 }, i + 0.8);
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-chrome="light" aria-labelledby="night-title" className="relative h-[100dvh] min-h-[560px] overflow-hidden text-white">
      <Image src={photos.rearNight} alt="The back of the house at night: lanterns under the four terrace arches, warm light upstairs" fill sizes="100vw" placeholder="blur" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_left,oklch(16%_0.04_265/0.65)_0%,transparent_55%)]" />
      <div className="absolute right-[var(--gutter)] top-1/2 -translate-y-1/2 border-l border-white/60 pl-5">
        <h2 id="night-title" className="label mb-4 opacity-80">At night, from the lawn</h2>
        <ul className="flex flex-col gap-1">
          {features.map((f, i) => (
            <li key={f} className={`feat caps text-[length:var(--text-caps)] ${i === 0 ? "opacity-100" : "opacity-35"}`}>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
