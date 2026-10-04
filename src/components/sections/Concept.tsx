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
      <Image src={photos.bougainvillea} alt="" aria-hidden="true" width={700} height={700} className="bloom pointer-events-none absolute -left-[10vw] -top-[10vw] hidden w-[min(32vw,440px)] md:block" />
      <Image src={photos.bougainvillea} alt="" aria-hidden="true" width={700} height={700} className="bloom pointer-events-none absolute -bottom-[8vw] -right-[6vw] w-[min(42vw,560px)] rotate-180" />
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
