import Image from "next/image";
import { facts, photos } from "@/data/house";

export function Intro() {
  return (
    <section id="top-intro" className="wrap pt-[var(--space-section)]" aria-labelledby="intro-title">
      <div className="grid grid-cols-1 gap-[var(--space-2xl)] md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <h2 id="intro-title" data-reveal className="max-w-[14ch] text-[length:var(--text-3xl)]">
            Private, but never closed in.
          </h2>
          <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-8 max-w-[56ch] text-lg text-ink-2">
            A two-storey family house in warm lime plaster under a low terracotta roof, on a long plot that ends at a
            limestone bluff. A 3 m hedge closes the garden on all four sides. Behind the back gate, stone steps go down
            to a cove that only the house can reach.
          </p>
          <p data-reveal style={{ ["--reveal-i" as string]: 2 }} className="mt-5 max-w-[56ch] text-ink-3">
            Soft-modern Mediterranean: rounded corners and tall arches on both floors, natural stone, dark bronze
            frames and glazed tiles inside.
          </p>
        </div>
        <figure data-reveal className="md:col-span-4 md:col-start-9">
          <div className="arch relative aspect-[3/4] overflow-hidden bg-paper-3">
            <Image
              src={photos.facade}
              alt="Front of the house: cream plaster, tall arched windows on both floors and a low terracotta roof"
              fill
              sizes="(min-width: 768px) 30vw, 92vw"
              placeholder="blur"
              className="object-cover object-[50%_45%]"
            />
          </div>
          <figcaption className="mt-3 text-sm text-ink-3">The front, from the stepping-stone walk.</figcaption>
        </figure>
      </div>

      <dl className="mt-[var(--space-section)] grid grid-cols-2 border-t border-rule md:grid-cols-4">
        {facts.map((f, i) => (
          <div
            key={f.label}
            data-reveal
            style={{ ["--reveal-i" as string]: i }}
            className="border-b border-rule py-8 pr-4 md:border-b-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-8"
          >
            <dt className="text-sm text-ink-3">{f.label}</dt>
            <dd className="mt-2 font-display text-[length:var(--text-3xl)] leading-none">
              {f.value}
              {f.unit && <span className="ml-1 text-[0.45em] text-ink-2">{f.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
