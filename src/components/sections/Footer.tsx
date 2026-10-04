import { ArchMark } from "@/components/brand/ArchMark";
import { sheets } from "@/data/house";

export function Footer() {
  return (
    <footer className="bg-cream pb-10 pt-[var(--space-section)]">
      <div className="wrap flex flex-col items-center text-center">
        <ArchMark className="h-16" title="La Casa" />
        <p translate="no" className="display mt-8 text-[length:var(--text-mega)]">La Casa</p>
        <p className="label mt-6">A house to come home to, above the cove</p>

        <ul className="mt-16 grid w-full max-w-3xl grid-cols-1 border-t border-rule sm:grid-cols-2">
          {sheets.map((s) => (
            <li key={s.id} className="border-b border-rule">
              <a href={`/blueprints/${s.number}-${s.id}.dxf`} download className="flex items-baseline justify-between gap-4 px-2 py-4 transition-opacity hover:opacity-60">
                <span className="caps text-xl">{s.number} {s.title}</span>
                <span className="label opacity-70">DXF {s.scale}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="body-small mt-16 max-w-[56ch] text-ink-3">
          Concept renders and the tour film were made with Higgsfield from a massing model of the site plan. The drawings
          come from the same measured model.
        </p>
        <div className="label mt-10 flex w-full max-w-3xl flex-wrap justify-between gap-4 opacity-70">
          <span>© 2026 Gilang Maulana</span>
          <a href="#top" className="hover:opacity-60">Back to the top</a>
        </div>
      </div>
    </footer>
  );
}
