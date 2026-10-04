import Image from "next/image";
import { HOUSE_NAME, photos, sheets } from "@/data/house";

export function Footer() {
  return (
    <footer className="mt-[var(--space-section)]">
      <div className="relative h-[70svh] min-h-[380px] w-full overflow-hidden">
        <Image
          src={photos.aerial}
          alt="Aerial view of the whole plot: the hedge, both arched gates, the garden, the house and the cove behind it"
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover"
        />
      </div>
      <div className="wrap grid grid-cols-1 gap-[var(--space-2xl)] py-[var(--space-2xl)] md:grid-cols-12">
        <div className="md:col-span-6">
          <p translate="no" className="font-display text-[length:var(--text-display)] leading-none">{HOUSE_NAME}</p>
          <p className="mt-6 max-w-[44ch] text-ink-2">
            A family house, drawn and rendered ahead of construction. The concept renders and the tour film were made
            with Higgsfield, and the drawings come from one measured CAD model.
          </p>
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <p className="label text-ink-3">Drawings</p>
          <ul className="mt-4 grid gap-2">
            {sheets.map((s) => (
              <li key={s.id}>
                <a
                  href={`/blueprints/${s.number}-${s.id}.dxf`}
                  download
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-2 whitespace-nowrap transition-colors hover:text-accent"
                >
                  <span>
                    <span className="mr-3 font-mono text-sm text-ink-3">{s.number}</span>
                    {s.title}
                  </span>
                  <span className="font-mono text-xs text-ink-3">DXF, {s.scale}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href="#top" className="mt-8 inline-block text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            Back to the top
          </a>
        </div>
      </div>
      <div className="wrap border-t border-rule py-6 text-sm text-ink-3">© 2026 Gilang Maulana</div>
    </footer>
  );
}
