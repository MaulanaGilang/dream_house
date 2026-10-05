"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { chapterSnap, glideTo } from "@/lib/snap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { reasons } from "@/data/house";

/**
 * Three reasons in ONE pinned frame, ERA's quote panel: each reason is a full-bleed picture with its line
 * set big in caps. Scrolling raises the next picture through an arch-shaped window (the house's motif)
 * over the one before, one gesture per reason. The sky the film ends on sits directly above.
 */
export function Reasons() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const n = reasons.length;

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const layers = gsap.utils.toArray<HTMLElement>(".reason-layer");
        const pics = gsap.utils.toArray<HTMLElement>(".reason-pic");
        const copies = gsap.utils.toArray<HTMLElement>(".reason-copy");
        // the arch window is written out by hand each frame: browsers shorten inset(... round ...), which
        // throws off GSAP's string interpolation, so one progress value drives the whole shape
        const arch = (el: HTMLElement, p: number) => {
          el.style.clipPath = `inset(${(p * 100).toFixed(2)}% 0% 0% 0% round ${(48 * p).toFixed(2)}vw ${(48 * p).toFixed(2)}vw 0 0)`;
        };
        layers.slice(1).forEach((el) => arch(el, 1));
        gsap.set(copies.slice(1), { autoAlpha: 0, y: 70 });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage.current,
            start: "top top",
            end: `+=${(n - 1) * 110}%`,
            pin: true,
            scrub: 0.4,
            onUpdate: (self) => setActive(Math.round(self.progress * (n - 1))),
          },
        });
        for (let i = 1; i < n; i++) {
          const at = i - 1 + 0.12;
          const s = { p: 1 };
          tl.to(s, { p: 0, duration: 0.7, ease: "power2.inOut", onUpdate: () => arch(layers[i], s.p) }, at)
            .to(pics[i - 1], { scale: 1.08, yPercent: -4, duration: 0.7 }, at)
            .to(copies[i - 1], { autoAlpha: 0, y: -50, duration: 0.3 }, at)
            .to(copies[i], { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.45);
        }
        tl.to({}, { duration: 0.18 }, n - 1 - 0.18);
        trigger.current = tl.scrollTrigger!;
        const stop = chapterSnap(tl.scrollTrigger!, reasons.map((_, i) => i / (n - 1)));
        return () => {
          stop();
          trigger.current = null;
          layers.forEach((el) => (el.style.clipPath = ""));
        };
      });
    },
    { scope: root },
  );

  const go = (i: number) => {
    if (trigger.current) glideTo(trigger.current, i / (n - 1));
  };

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

      <div ref={stage} data-chrome="light" className="relative h-[100dvh] min-h-[620px] overflow-hidden text-white motion-reduce:h-auto">
        {reasons.map((r, i) => (
          <article
            key={r.title}
            aria-labelledby={`reason-${i}`}
            className="reason-layer absolute inset-0 overflow-hidden motion-reduce:relative motion-reduce:h-[100dvh]"
            style={{ zIndex: i + 1 }}
          >
            <div className="reason-pic absolute inset-0 will-change-transform">
              <Image src={r.slides[0].image} alt={r.slides[0].alt} fill sizes="100vw" placeholder="blur" className="object-cover" priority={i === 0} />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,oklch(16%_0.04_265/0.72)_0%,oklch(16%_0.04_265/0.25)_45%,transparent_70%)]" />
            <div className="reason-copy absolute inset-x-[var(--gutter)] bottom-[clamp(2.5rem,9vh,6rem)] md:left-[42vw] md:right-[var(--gutter)]">
              <span aria-hidden="true" className="caps block text-[clamp(3.5rem,2rem+3vw,5.5rem)] leading-[0.5] md:pl-[2.4em]">
                “
              </span>
              <p id={`reason-${i}`} className="caps mt-5 max-w-[30ch] text-[clamp(1.9rem,1rem+2.3vw,3.7rem)] leading-[1.02] [text-indent:2.2em] [text-shadow:0_2px_30px_oklch(16%_0.04_265/0.35)]">
                {r.text}
              </p>
              <p className="label mt-8 leading-[1.6]">
                <span className="tabular-nums opacity-70">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                <br />
                {r.title}
              </p>
            </div>
          </article>
        ))}

        {/* chapter index: where you are, and a way to jump */}
        <nav aria-label="Reasons" className="absolute left-[clamp(5.5rem,8vw,8.5rem)] top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 motion-reduce:hidden md:flex">
          {reasons.map((r, i) => (
            <button
              key={r.title}
              type="button"
              onClick={() => go(i)}
              aria-current={active === i ? "step" : undefined}
              className="label group flex items-center gap-3 text-left"
            >
              <span className={`h-px bg-white transition-[width,opacity] duration-500 ease-[var(--ease-out)] ${active === i ? "w-12 opacity-100" : "w-5 opacity-50 group-hover:w-8"}`} />
              <span className={`transition-opacity duration-500 ${active === i ? "opacity-100" : "opacity-55 group-hover:opacity-90"}`}>{r.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
