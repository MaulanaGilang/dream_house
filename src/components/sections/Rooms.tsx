"use client";

import { useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { areaOf, photos, rooms } from "@/data/house";

/** Follows the cream arch that closes the night scene: the maroon block, then the room carousel. */
export function Rooms() {
  const [i, setI] = useState(0);
  const room = rooms[i];
  const area = areaOf(room.id);
  const go = (d: number) => setI((v) => (v + d + rooms.length) % rooms.length);

  return (
    <section aria-labelledby="rooms-title">
      <div className="wrap grid grid-cols-1 gap-12 pb-[var(--space-section)] pt-[clamp(2rem,5vw,5rem)] motion-reduce:pt-[var(--space-section)] md:grid-cols-12 md:items-end">
        <h2 id="rooms-title" className="label md:col-span-12">Rooms to live in</h2>
        <figure className="relative bg-maroon p-[clamp(1.5rem,4vw,4rem)] md:col-span-5">
          <Image src={photos.roseBranch} alt="" aria-hidden="true" width={600} height={593} className="pointer-events-none absolute -right-[16%] -top-[16%] w-[66%] rotate-[18deg]" />
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image src={photos.living} alt="The living room with arched doors to the terrace" fill sizes="(min-width: 768px) 34vw, 86vw" placeholder="blur" className="object-cover" />
          </div>
        </figure>
        <div className="md:col-span-6 md:col-start-7">
          <p data-reveal className="caps text-[length:var(--text-caps)] leading-[1.04]">
            Every detail was chosen to make the house calm, cool and easy to live in
          </p>
          <p data-reveal className="body-small mt-8 max-w-[42ch] text-ink-2">
            Lime plaster walls breathe in the humid air, wide eaves shade the windows, and the bedrooms sit upstairs
            above the living floor, away from the garden.
          </p>
          <ul className="label mt-8 grid gap-1 opacity-80">
            <li>Ground floor: living, kitchen, bedroom two, guest bath, workout</li>
            <li>Upper floor: master suite, work room, long balcony</li>
          </ul>
        </div>
      </div>

      <div className="pb-[var(--space-section)]">
        <div className="relative mx-auto aspect-[16/9] w-[min(92vw,1300px)] overflow-hidden bg-cream-2">
          {/* only the current room and its neighbours are mounted, and fetched at once (not lazily), so
              the next slide is already sharp when you get to it */}
          {rooms.map((r, k) => {
            const d = Math.min((k - i + rooms.length) % rooms.length, (i - k + rooms.length) % rooms.length);
            if (d > 1) return null;
            return (
              <Image
                key={r.id}
                src={r.image}
                alt={r.alt}
                fill
                loading="eager"
                sizes="(min-width: 1400px) 1300px, 92vw"
                quality={85}
                aria-hidden={k !== i}
                className={`object-cover transition-[opacity,transform] duration-[1000ms] ease-[var(--ease-out)] ${k === i ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
              />
            );
          })}
        </div>
        <div className="wrap mt-8 flex flex-col items-center gap-4 text-center" aria-live="polite">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => go(-1)} aria-label="Previous room" className="grid h-9 w-9 place-items-center hover:opacity-60">
              <CaretLeft size={16} weight="light" aria-hidden="true" />
            </button>
            <span className="label tabular-nums">{i + 1}</span>
            <span className="relative h-px w-28 bg-ink/25" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700" style={{ width: `${((i + 1) / rooms.length) * 100}%` }} />
            </span>
            <span className="label tabular-nums">{rooms.length}</span>
            <button type="button" onClick={() => go(1)} aria-label="Next room" className="grid h-9 w-9 place-items-center hover:opacity-60">
              <CaretRight size={16} weight="light" aria-hidden="true" />
            </button>
          </div>
          <h3 className="display text-[clamp(2.8rem,1.6rem+4vw,6rem)]">{room.name}</h3>
          <p className="label opacity-70">
            {room.floor === "Garden" ? "Garden and bluff" : `${room.floor} floor`}{area ? `, ${area.toFixed(1)} m² net` : ""}
          </p>
          <p className="body-small max-w-[44ch] text-ink-2">{room.note}</p>
        </div>
      </div>
    </section>
  );
}
