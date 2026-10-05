import Image from "next/image";
import { photos } from "@/data/house";

export function Architecture() {
  return (
    <section id="architecture" aria-labelledby="arch-title">
      <div data-chrome="light" className="relative h-[100dvh] min-h-[560px] overflow-hidden text-white">
        <Image src={photos.facade} alt="The front of the house: cream plaster, arched windows, a small balcony over the arched front door" fill sizes="100vw" placeholder="blur" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(20%_0.04_265/0.4)_0%,transparent_45%)]" />
        <h2 id="arch-title" className="display absolute inset-x-0 top-[7vh] text-center text-[clamp(3.4rem,0.6rem+12.6vw,15.5rem)] leading-[0.82]">
          Architecture
        </h2>
      </div>
      <div data-chrome="light" className="relative h-[100dvh] min-h-[560px] overflow-hidden text-white">
        <Image src={photos.aerial} alt="Aerial view of the whole plot, the house, the hedge, both gates and the cove behind" fill sizes="100vw" placeholder="blur" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-scrim)_0%,transparent_55%)]" />
        <div className="absolute bottom-[10vh] left-[var(--gutter)] max-w-[min(38rem,86vw)] md:left-[18vw]">
          <p data-reveal className="caps text-[length:var(--text-caps)] leading-[1.04]">
            Soft-modern Mediterranean: rounded corners, tall arches on both floors and a low terracotta roof with wide eaves
          </p>
          <p className="label mt-6 opacity-85">11 by 13 m, two floors, on a 20 by 50 m plot</p>
        </div>
      </div>
    </section>
  );
}
