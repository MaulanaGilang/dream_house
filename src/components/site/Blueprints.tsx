import { BlueprintViewer } from "./BlueprintViewer";

export function Blueprints() {
  return (
    <section
      id="plans"
      aria-labelledby="plans-title"
      className="mt-[var(--space-section)] bg-blueprint py-[var(--space-section)] text-blueprint-ink"
    >
      <div className="wrap">
        <p className="label text-blueprint-dim" data-reveal>Drawings, sheets A-01 to A-04</p>
        <h2 id="plans-title" data-reveal className="mt-4 max-w-[13ch] text-[length:var(--text-3xl)]">
          Drawn to be built.
        </h2>
        <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[58ch] text-blueprint-ink/80">
          Every sheet comes from one measured CAD model, drawn to scale with walls, openings and levels. Pick a room on
          a floor plan to see it, or download the DXF and open it in any CAD program.
        </p>
        <div className="mt-12">
          <BlueprintViewer />
        </div>
      </div>
    </section>
  );
}
