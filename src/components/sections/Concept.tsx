"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { photos } from "@/data/house";

export function Concept() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".bloom").forEach((el, i) => {
          gsap.fromTo(el, { yPercent: i ? 18 : -12, rotate: i ? 8 : -6 }, {
            yPercent: i ? -22 : 14, rotate: 0, ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="concept-title" className="relative overflow-hidden py-[var(--space-section)]">
      <Image src={photos.lavenderRoses} alt="" aria-hidden="true" width={700} height={707} className="bloom pointer-events-none absolute -left-[7vw] -top-[6vw] hidden w-[min(30vw,420px)] -scale-x-100 md:block" />
      <Image src={photos.roseBranch} alt="" aria-hidden="true" width={700} height={692} className="bloom pointer-events-none absolute -bottom-[6vw] -right-[5vw] w-[min(40vw,540px)] rotate-180" />
      <div className="wrap relative flex flex-col items-center text-center">
        <p className="label" data-reveal>The concept</p>
        <h2 id="concept-title" data-reveal className="caps mt-8 max-w-[24ch] text-[length:var(--text-statement)] leading-[0.95]">
          La Casa is a family house of two floors and two bedrooms, closed in by a hedge and open to the sea
        </h2>
        <p data-reveal className="body-small mt-12 max-w-[40ch] text-ink-2">
          Soft-modern Mediterranean, between classic and modern: lime plaster, rounded corners, tall arches on both floors
          and a low terracotta roof with wide eaves for tropical rain.
        </p>
        <ArchMark className="mt-12 h-10" />
      </div>
    </section>
  );
}
