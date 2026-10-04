import Image from "next/image";
import { photos } from "@/data/house";

const points = [
  { term: "Hedge", detail: "3.0 m of clipped green on every side, with a 1.2 m dry-stone wall outside it." },
  { term: "Gates", detail: "Two identical solid timber gates with arched tops, 3.0 m, front and back." },
  { term: "Bluff", detail: "6.0 m of limestone between the garden and the sand. 36 steps in three flights." },
];

export function SiteStory() {
  return (
    <section id="site" className="pt-[var(--space-section)]" aria-labelledby="site-title">
      <figure className="relative h-[78svh] min-h-[440px] w-full overflow-hidden" data-reveal>
        <Image
          src={photos.coveView}
          alt="The house seen from the water: a white sand cove, the limestone bluff, stone stairs and the arched back gate in the hedge"
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[50%_40%]"
        />
      </figure>

      <div className="wrap mt-[var(--space-2xl)] grid grid-cols-1 gap-[var(--space-2xl)] md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 id="site-title" data-reveal className="max-w-[11ch] text-[length:var(--text-3xl)]">
            A cove below, a bluff above.
          </h2>
          <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[44ch] text-ink-2">
            Two rocky headlands hide the beach from the coast on either side. The house stands back from the edge, so
            the garden stays calm and the beach stays out of sight from the road.
          </p>
          <dl className="mt-10 grid gap-6">
            {points.map((p, i) => (
              <div key={p.term} data-reveal style={{ ["--reveal-i" as string]: i + 2 }} className="grid grid-cols-[6.5rem_1fr] gap-4">
                <dt className="label pt-1 text-accent">{p.term}</dt>
                <dd className="text-ink-2">{p.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure data-reveal className="md:col-span-6 md:col-start-7">
          <div className="relative aspect-[4/5] overflow-hidden bg-paper-3 md:-mt-[22vh]">
            <Image
              src={photos.cliffStairs}
              alt="Worn limestone steps with a wrought iron handrail going down the bluff to the cove"
              fill
              sizes="(min-width: 768px) 45vw, 92vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-sm text-ink-3">Halfway down: the second landing.</figcaption>
        </figure>
      </div>
    </section>
  );
}
