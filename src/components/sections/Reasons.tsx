"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { reasons, type Reason } from "@/data/house";

/**
 * Three reasons, each as ERA's quote panel: a full-bleed picture drifting with a slow parallax, the
 * reason set big in caps with a hanging quote mark, and the title as a small signature underneath.
 * The sky the film ends on sits directly above, so the first picture rises out of it.
 */
export function Reasons() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".reason").forEach((panel) => {
          gsap.fromTo(panel.querySelector(".reason-bg"), { yPercent: -9 }, {
            yPercent: 9, ease: "none",
            scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: 0.5 },
          });
          gsap.from(panel.querySelectorAll(".reason-in"), {
            autoAlpha: 0, y: 40, duration: 1.1, stagger: 0.12, ease: "power3.out",
            scrollTrigger: { trigger: panel, start: "top 55%" },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="reasons" aria-labelledby="reasons-title" className="bg-sky">
      <h2 id="reasons-title" className="sr-only">Three reasons to call it home</h2>

      {/* without motion the film does not play, so the opening lines appear here instead */}
      <div className="hidden flex-col items-center gap-5 py-[var(--space-section)] text-center motion-reduce:flex">
        <p className="caps text-[length:var(--text-statement)]">Three reasons to call it home</p>
        <div className="flex items-center gap-4">
          <span className="label">The coast</span>
          <ArchMark className="h-9" />
          <span className="label">Indonesia</span>
        </div>
      </div>

      {reasons.map((r, i) => (
        <ReasonPanel key={r.title} reason={r} index={i} />
      ))}
    </section>
  );
}

function ReasonPanel({ reason, index }: { reason: Reason; index: number }) {
  const [k, setK] = useState(0);
  const n = reason.slides.length;
  const go = (d: number) => setK((v) => (v + d + n) % n);

  // the pictures change on their own every few seconds, unless reduced motion is on
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setK((v) => (v + 1) % n), 6500);
    return () => window.clearInterval(t);
  }, [n, k]);

  return (
    <article
      data-chrome="light"
      aria-labelledby={`reason-${index}`}
      className="reason relative h-[100dvh] min-h-[620px] overflow-hidden text-white"
      role="group"
      aria-roledescription="carousel"
    >
      <div className="reason-bg absolute inset-x-0 -inset-y-[10%]">
        {reason.slides.map((s, j) => (
          <Image
            key={j}
            src={s.image}
            alt={s.alt}
            fill
            sizes="100vw"
            placeholder="blur"
            aria-hidden={j !== k}
            className={`object-cover transition-[opacity,transform] duration-[1400ms] ease-[var(--ease-out)] ${j === k ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"}`}
          />
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,oklch(16%_0.04_265/0.72)_0%,oklch(16%_0.04_265/0.25)_45%,transparent_70%)]" />

      <div className="absolute inset-x-[var(--gutter)] bottom-[clamp(2.5rem,9vh,6rem)] md:left-[42vw] md:right-[var(--gutter)]">
        <span aria-hidden="true" className="reason-in caps block text-[clamp(3.5rem,2rem+3vw,5.5rem)] leading-[0.5] md:pl-[2.4em]">
          “
        </span>
        <p id={`reason-${index}`} className="reason-in caps mt-5 max-w-[30ch] text-[clamp(1.9rem,1rem+2.3vw,3.7rem)] leading-[1.02] [text-indent:2.2em] [text-shadow:0_2px_30px_oklch(16%_0.04_265/0.35)]">
          {reason.text}
        </p>
        <div className="reason-in mt-8 flex flex-wrap items-end justify-between gap-6">
          <p className="label leading-[1.6]">
            <span className="tabular-nums opacity-70">{String(index + 1).padStart(2, "0")} / 03</span>
            <br />
            {reason.title}
          </p>
          {n > 1 && (
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => go(-1)} aria-label="Previous picture" className="grid h-9 w-9 place-items-center transition-opacity hover:opacity-60">
                <CaretLeft size={15} weight="light" aria-hidden="true" />
              </button>
              <span className="label tabular-nums">{k + 1}</span>
              <span className="relative h-px w-20 bg-white/35" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 bg-white transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${((k + 1) / n) * 100}%` }} />
              </span>
              <span className="label tabular-nums">{n}</span>
              <button type="button" onClick={() => go(1)} aria-label="Next picture" className="grid h-9 w-9 place-items-center transition-opacity hover:opacity-60">
                <CaretRight size={15} weight="light" aria-hidden="true" />
              </button>            </div>
          )}
        </div>
      </div>
    </article>
  );
}
