"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { photos } from "@/data/house";

/** ERA's "New Golden Mile" move: giant split words pan sideways around a tall image. */
export function Bluff() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const dist = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="cove" aria-labelledby="bluff-title" className="overflow-hidden lg:h-[100dvh]">
      <div ref={track} className="flex flex-col gap-12 px-[var(--gutter)] py-[var(--space-section)] lg:h-full lg:w-max lg:flex-row lg:items-center lg:gap-[6vw] lg:py-0">
        <h2 id="bluff-title" className="display flex flex-col text-[length:var(--text-mega)] lg:flex-row lg:items-center lg:gap-[4vw]">
          <span>Six</span>
          <span className="label tracking-[0.9em] lg:order-first">Indonesia</span>
          <span>metres</span>
        </h2>
        <figure className="relative aspect-[4/5] w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-[78dvh] lg:w-[34vw]">
          <Image src={photos.portal} alt="The arched plaster portal in the back hedge, with the cove and its headlands beyond" fill sizes="(min-width: 1024px) 34vw, 92vw" placeholder="blur" className="object-cover" />
        </figure>
        <p className="display text-[length:var(--text-mega)] lg:whitespace-nowrap">above the sea</p>
        <div className="max-w-[30ch] shrink-0 lg:max-w-[26ch]">
          <h3 className="caps text-[length:var(--text-caps)]">A cove for one house</h3>
          <p className="body-small mt-5 text-ink-2">
            Behind the arched portal the garden stops at a limestone bluff. Stone stairs in three flights of twelve go
            down to white sand, closed in by two headlands so the beach is seen only from the house and the sea.
          </p>
        </div>
        <figure className="relative aspect-[16/10] w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-[60dvh] lg:w-[48vw]">
          <Image src={photos.coveView} alt="The beach, the bluff with its stone stairs and the arched portal, seen from the water" fill sizes="(min-width: 1024px) 48vw, 92vw" placeholder="blur" className="object-cover" />
        </figure>
        <div aria-hidden="true" className="hidden w-[var(--gutter)] shrink-0 lg:block" />
      </div>
    </section>
  );
}
