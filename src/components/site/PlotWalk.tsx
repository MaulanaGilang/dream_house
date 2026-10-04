"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { walk } from "@/data/house";

/** From the road to the sand: the sticky marker shows how far along the plot each stop is. */
export function PlotWalk() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stop = walk[active];
  const progress = active / (walk.length - 1);

  return (
    <section id="walk" aria-labelledby="walk-title" className="wrap pt-[var(--space-section)]">
      <div className="grid grid-cols-1 gap-[var(--space-2xl)] md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <h2 id="walk-title" className="max-w-[10ch] text-[length:var(--text-3xl)]">From the road to the sand.</h2>
            <div className="mt-10 hidden md:block" aria-hidden="true">
              <p className="font-display text-[length:var(--text-3xl)] leading-none whitespace-nowrap tabular-nums">{stop.at}</p>
              <p className="mt-3 text-ink-2">{stop.title}</p>
              <div className="relative mt-8 h-56 w-px bg-rule">
                <span
                  className="absolute left-0 top-0 w-px origin-top bg-accent transition-transform duration-700 ease-[var(--ease-out)]"
                  style={{ height: "100%", transform: `scaleY(${progress})` }}
                />
                {walk.map((w, i) => (
                  <span
                    key={w.title}
                    className={`absolute -left-[3px] h-[7px] w-[7px] rounded-full transition-colors duration-500 ${i <= active ? "bg-accent" : "bg-paper-3"}`}
                    style={{ top: `calc(${(i / (walk.length - 1)) * 100}% - 3px)` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <ol className="grid gap-[clamp(3rem,8vw,7rem)] md:col-span-7 md:col-start-6">
          {walk.map((w, i) => (
            <li key={w.title} ref={(el) => { items.current[i] = el; }} data-index={i}>
              <figure>
                <div className={`relative overflow-hidden bg-paper-3 ${i % 3 === 1 ? "arch aspect-[4/5] md:w-4/5" : "aspect-[3/2]"}`}>
                  <Image src={w.image} alt={w.alt} fill sizes="(min-width: 768px) 56vw, 92vw" placeholder="blur" className="object-cover" />
                </div>
                <figcaption className="mt-5 grid grid-cols-[5.5rem_1fr] gap-4">
                  <span className="font-mono text-sm text-accent">{w.at}</span>
                  <span>
                    <span className="block text-xl font-medium">{w.title}</span>
                    <span className="mt-1 block max-w-[46ch] text-ink-2">{w.text}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
