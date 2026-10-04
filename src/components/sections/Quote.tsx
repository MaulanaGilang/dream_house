import Image from "next/image";
import { photos } from "@/data/house";

export function Quote() {
  return (
    <section data-chrome="light" aria-label="The idea" className="relative h-[100dvh] min-h-[560px] overflow-hidden text-white">
      <Image src={photos.terrace} alt="The covered terrace under cream plaster arches, set for dinner" fill sizes="100vw" placeholder="blur" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_left,var(--color-scrim)_0%,transparent_60%)]" />
      <figure className="absolute bottom-[12vh] right-[var(--gutter)] max-w-[min(36rem,84vw)]">
        <span aria-hidden="true" className="caps block text-[4rem] leading-[0.6]">“</span>
        <blockquote data-reveal className="caps mt-2 text-[length:var(--text-caps)] leading-[1.02]">
          Every room opens through an arch, and every arch looks out to green or to the sea.
        </blockquote>
        <figcaption className="label mt-6">The idea behind the plan</figcaption>
      </figure>
    </section>
  );
}
