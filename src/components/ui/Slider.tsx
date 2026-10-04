"use client";

import { useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Slide } from "@/data/house";

type Props = { slides: Slide[]; className?: string; sizes?: string; label: string };

/** ERA-style image slider: one frame, "1 ——— n" pagination with arrows underneath. */
export function Slider({ slides, className = "", sizes = "30vw", label }: Props) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length);
  return (
    <div className={className} role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-cream-2">
        {slides.map((s, k) => (
          <Image
            key={k}
            src={s.image}
            alt={s.alt}
            fill
            sizes={sizes}
            placeholder="blur"
            aria-hidden={k !== i}
            className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out)] ${k === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
          />
        ))}
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="grid h-8 w-8 place-items-center transition-opacity hover:opacity-60">
            <CaretLeft size={14} weight="light" aria-hidden="true" />
          </button>
          <span className="label tabular-nums">{i + 1}</span>
          <span className="relative h-px w-24 bg-current/25" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 bg-current transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${((i + 1) / slides.length) * 100}%` }} />
          </span>
          <span className="label tabular-nums">{slides.length}</span>
          <button type="button" onClick={() => go(1)} aria-label="Next image" className="grid h-8 w-8 place-items-center transition-opacity hover:opacity-60">
            <CaretRight size={14} weight="light" aria-hidden="true" />
          </button>
          <span className="sr-only" aria-live="polite">{`Image ${i + 1} of ${slides.length}`}</span>
        </div>
      )}
    </div>
  );
}
