"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { Slider } from "@/components/ui/Slider";
import { photos, reasons } from "@/data/house";

/** A sky-blue circle rises over the last frame of the film, then three reasons, each with a small slider. */
export function Reasons() {
  const intro = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".reasons-circle",
          { clipPath: "circle(18% at 50% 118%)" },
          {
            clipPath: "circle(150% at 50% 118%)",
            ease: "none",
            scrollTrigger: { trigger: intro.current, start: "top top", end: "+=120%", pin: true, scrub: 0.6 },
          },
        );
        gsap.fromTo(".reasons-arc", { rotate: -18, autoAlpha: 0 }, {
          rotate: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: intro.current, start: "top top", end: "+=60%", scrub: 0.6 },
        });
      });
    },
    { scope: intro },
  );

  return (
    <section aria-labelledby="reasons-title" className="bg-sky">
      <div ref={intro} className="relative h-[100dvh] overflow-hidden">
        <Image src={photos.coveView} alt="" fill sizes="100vw" className="object-cover" aria-hidden="true" />
        <div className="reasons-circle absolute inset-0 bg-sky [clip-path:circle(150%_at_50%_118%)]">
          <svg viewBox="0 0 1000 520" className="reasons-arc absolute left-1/2 top-[9vh] w-[min(92vw,1100px)] -translate-x-1/2 overflow-visible" aria-hidden="true">
            <defs>
              <path id="arc" d="M60 500 A470 470 0 0 1 940 500" />
            </defs>
            <text className="caps" fill="var(--color-ink)" style={{ fontSize: "52px", letterSpacing: "2px" }}>
              <textPath href="#arc" startOffset="50%" textAnchor="middle">Three reasons to call it home</textPath>
            </text>
          </svg>
          <div className="absolute inset-x-0 top-[48vh] flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-4">
              <span className="label">The coast</span>
              <ArchMark className="h-9" />
              <span className="label">Indonesia</span>
            </div>
            <span className="h-[16vh] w-px bg-ink/40" aria-hidden="true" />
            <h2 id="reasons-title" className="label max-w-[26ch]">A house to come home to, closed in by a garden, open to the sea</h2>
          </div>
        </div>
      </div>

      <div className="wrap flex flex-col gap-[var(--space-section)] pb-[var(--space-section)]">
        {reasons.map((r, i) => (
          <article key={r.title} className="flex flex-col items-center text-center">
            <h3 data-reveal className="display text-[length:var(--text-mega)]">{r.title}</h3>
            <Slider slides={r.slides} label={r.title} className="mt-10 w-[min(84vw,420px)]" sizes="420px" />
            <p data-reveal className="body-small mt-10 max-w-[46ch] text-ink-2">{r.text}</p>
            <p className="label mt-6">{String(i + 1).padStart(2, "0")} / 03</p>
          </article>
        ))}
      </div>
    </section>
  );
}
