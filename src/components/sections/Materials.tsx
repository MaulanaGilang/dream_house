import Image from "next/image";
import { photos } from "@/data/house";

const tiles = [
  { image: photos.ensuite, name: "Sea-glass mosaic", where: "Ensuite shower", alt: "Blue-grey glossy mosaic shower wall in the ensuite behind a plaster arch" },
  { image: photos.kitchen, name: "Sage glaze", where: "Kitchen hood alcove", alt: "Sage green glazed tiles inside the arched kitchen hood alcove" },
  { image: photos.guestBath, name: "Terracotta and ochre", where: "Guest bath", alt: "Warm terracotta and ochre glazed tiles behind the guest bath vanity" },
];

/**
 * Three glazes, three equal columns on one baseline. Each caption sits directly under its own picture,
 * behind a hairline, with the number, the tile and the room stacked so nothing reads as belonging to a neighbour.
 */
export function Materials() {
  return (
    <section id="materials" aria-labelledby="materials-title" className="relative overflow-hidden py-[var(--space-section)]">
      <Image src={photos.lavenderRoses} alt="" aria-hidden="true" width={700} height={707} className="pointer-events-none absolute -right-[6vw] -top-[2vw] w-[min(30vw,420px)] -scale-x-100 -rotate-[150deg]" />
      <div className="wrap relative">
        <h2 id="materials-title" data-reveal className="caps mx-auto max-w-[22ch] text-center text-[length:var(--text-statement)] leading-[0.95]">
          Plaster outside, glaze inside
        </h2>
        <p data-reveal className="body-small mx-auto mt-8 max-w-[44ch] text-center text-ink-2">
          The house stays quiet on the outside: lime plaster, limestone and a terracotta roof. Colour comes in through
          handmade glazed tiles, glossy and a little uneven, in the kitchen and the bathrooms.
        </p>
        <ol className="mt-20 grid grid-cols-1 gap-x-[clamp(1.25rem,2.6vw,3rem)] gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <li key={t.name} data-reveal style={{ ["--reveal-i" as string]: i }} className={i === 2 ? "sm:col-span-2 sm:mx-auto sm:w-1/2 lg:col-span-1 lg:mx-0 lg:w-auto" : undefined}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden bg-cream-2">
                  <Image src={t.image} alt={t.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" placeholder="blur" className="object-cover" />
                </div>
                <figcaption className="mt-5 grid grid-cols-[2.25rem_1fr] border-t border-rule pt-4">
                  <span className="label tabular-nums opacity-55">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="caps block text-[clamp(1.5rem,1.1rem+0.8vw,2rem)]">{t.name}</span>
                    <span className="label mt-2 block opacity-70">{t.where}</span>
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
