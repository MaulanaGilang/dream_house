import { BlueprintViewer } from "./BlueprintViewer";

export function Drawings() {
  return (
    <section id="drawings" aria-labelledby="drawings-title" className="bg-sky py-[var(--space-section)]">
      <div className="wrap">
        <div className="flex flex-col items-center text-center">
          <p className="label" data-reveal>Sheets A-01 to A-04</p>
          <h2 id="drawings-title" data-reveal className="display mt-6 text-[length:var(--text-mega)]">The drawings</h2>
          <p data-reveal className="body-small mt-8 max-w-[52ch] text-ink-2">
            Every sheet is drawn to scale from one measured model of the site plan: walls, openings, levels and the bluff.
            Pick a room to see it, or download the DXF and open it in any CAD program.
          </p>
        </div>
        <div className="mt-16">
          <BlueprintViewer />
        </div>
      </div>
    </section>
  );
}
