import Image from "next/image";
import { photos } from "@/data/house";

const tiles = [
  { image: photos.ensuite, name: "Sea-glass mosaic", where: "Ensuite shower", alt: "Blue-grey glossy mosaic shower wall in the ensuite behind a plaster arch" },
  { image: photos.kitchen, name: "Sage glaze", where: "Kitchen hood alcove", alt: "Sage green glazed tiles inside the arched kitchen hood alcove" },
  { image: photos.guestBath, name: "Terracotta and ochre", where: "Guest bath", alt: "Warm terracotta and ochre glazed tiles behind the guest bath vanity" },
];

/** ERA's staggered image pair with a cut-out bloom, then a short statement about the materials. */
export function Materials() {
  return (
    <section aria-labelledby="materials-title" className="relative overflow-hidden py-[var(--space-section)]">
      <Image src={photos.bougainvillea} alt="" aria-hidden="true" width={700} height={700} className="pointer-events-none absolute -left-[8vw] bottom-[6vh] w-[min(36vw,480px)] -rotate-90" />
      <div className="wrap">
        <h2 id="materials-title" data-reveal className="caps mx-auto max-w-[22ch] text-center text-[length:var(--text-statement)] leading-[0.95]">
          Plaster outside, glaze inside
        </h2>
        <p data-reveal className="body-small mx-auto mt-8 max-w-[44ch] text-center text-ink-2">
          The house stays quiet on the outside: lime plaster, limestone and a terracotta roof. Colour comes in through
          handmade glazed tiles, glossy and a little uneven, in the kitchen and the bathrooms.
        </p>
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-12">
          {tiles.map((t, i) => (
            <figure
              key={t.name}
              data-reveal
              style={{ ["--reveal-i" as string]: i }}
              className={i === 0 ? "md:col-span-5 md:col-start-2" : i === 1 ? "md:col-span-4 md:col-start-8 md:mt-[18vh]" : "md:col-span-5 md:col-start-5 md:-mt-[4vh]"}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-2">
                <Image src={t.image} alt={t.alt} fill sizes="(min-width: 768px) 40vw, 92vw" placeholder="blur" className="object-cover" />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                <span className="caps text-2xl">{t.name}</span>
                <span className="label opacity-70">{t.where}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
