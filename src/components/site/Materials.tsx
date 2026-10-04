import Image from "next/image";
import { photos } from "@/data/house";

const swatches = [
  { name: "Lime plaster", where: "Walls, inside and out", color: "var(--swatch-plaster)" },
  { name: "Terracotta", where: "Roof tiles, ground floor", color: "var(--swatch-terracotta)" },
  { name: "Natural stone", where: "Arches, plinth, pillars", color: "var(--swatch-stone)" },
  { name: "Dark bronze", where: "Window and door frames", color: "var(--swatch-bronze)" },
];

const tiles = [
  { image: photos.ensuite, name: "Sea-glass mosaic", where: "Master ensuite, shower wall", tone: "var(--swatch-seaglass)",
    alt: "Blue-grey glossy mosaic tiles on the ensuite shower wall behind a plaster arch" },
  { image: photos.kitchen, name: "Sage glaze", where: "Kitchen backsplash and hood alcove", tone: "var(--swatch-sage)",
    alt: "Sage green glazed tiles in a vertical stack inside the arched kitchen hood alcove" },
  { image: photos.guestBath, name: "Terracotta and ochre", where: "Guest bath, to two thirds height", tone: "var(--swatch-terracotta)",
    alt: "Warm terracotta, sand and ochre glazed square tiles behind an oak vanity" },
];

export function Materials() {
  return (
    <section id="materials" aria-labelledby="materials-title" className="wrap pt-[var(--space-section)]">
      <h2 id="materials-title" data-reveal className="max-w-[16ch] text-[length:var(--text-3xl)]">
        Lime, clay, stone and glaze.
      </h2>
      <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[56ch] text-ink-2">
        The outside stays quiet: plaster, stone and a terracotta roof. Colour comes in through glazed tiles in the
        kitchen and bathrooms, handmade, glossy and a little uneven.
      </p>

      <div className="mt-[var(--space-2xl)] grid grid-cols-1 gap-[clamp(0.75rem,1.4vw,1.5rem)] md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
        <figure data-reveal className="relative min-h-[320px] overflow-hidden bg-paper-3 md:col-span-2 md:row-span-2">
          <Image
            src={photos.materials}
            alt="Material board: sea-glass mosaic, sage glazed tiles and terracotta squares beside travertine, oak, brass and linen"
            fill
            sizes="(min-width: 768px) 64vw, 92vw"
            placeholder="blur"
            className="object-cover"
          />
        </figure>
        {tiles.slice(0, 2).map((t, i) => (
          <TileCard key={t.name} tile={t} i={i + 1} />
        ))}
        <TileCard tile={tiles[2]} i={3} />
        <div data-reveal style={{ ["--reveal-i" as string]: 4 }} className="grid grid-cols-2 gap-px bg-rule md:col-span-2">
          {swatches.map((s) => (
            <div key={s.name} className="flex items-center gap-4 bg-paper p-5">
              <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: s.color }} />
              <span className="min-w-0">
                <span className="block font-medium">{s.name}</span>
                <span className="block text-sm text-ink-3">{s.where}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TileCard({ tile, i }: { tile: (typeof tiles)[number]; i: number }) {
  return (
    <figure data-reveal style={{ ["--reveal-i" as string]: i }} className="flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-3">
        <Image src={tile.image} alt={tile.alt} fill sizes="(min-width: 768px) 30vw, 92vw" placeholder="blur" className="object-cover" />
      </div>
      <figcaption className="mt-3 grid grid-cols-[0.75rem_1fr] items-baseline gap-x-3">
        <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: tile.tone }} />
        <span className="font-medium">{tile.name}</span>
        <span className="col-start-2 text-sm text-ink-3">{tile.where}</span>
      </figcaption>
    </figure>
  );
}
