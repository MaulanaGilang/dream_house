import { ArchMark } from "@/components/brand/ArchMark";
import { Slider } from "@/components/ui/Slider";
import { reasons } from "@/data/house";

/**
 * Three reasons, each with a small slider. The sky-blue field they sit on is the one that rises over
 * the last frame of the film (Hero), so there is no picture or second transition in between.
 */
export function Reasons() {
  return (
    <section id="reasons" aria-labelledby="reasons-title" className="bg-sky">
      <h2 id="reasons-title" className="sr-only">Three reasons to call it home</h2>

      {/* without motion the film does not play, so the opening lines appear here instead */}
      <div className="hidden flex-col items-center gap-5 pt-[var(--space-section)] text-center motion-reduce:flex">
        <p className="caps text-[length:var(--text-statement)]">Three reasons to call it home</p>
        <div className="flex items-center gap-4">
          <span className="label">The coast</span>
          <ArchMark className="h-9" />
          <span className="label">Indonesia</span>
        </div>
      </div>

      <div className="wrap flex flex-col gap-[var(--space-section)] py-[var(--space-section)]">
        {reasons.map((r, i) => (
          <article key={r.title} className="flex flex-col items-center text-center">
            <h3 data-reveal className="display text-[length:var(--text-mega)]">{r.title}</h3>
            <Slider slides={r.slides} label={r.title} className="mt-10 w-[min(84vw,420px)]" sizes="420px" />
            <p data-reveal className="body-small mt-10 max-w-[46ch] text-ink-2">{r.text}</p>
            <p className="label mt-6">{String(i + 1).padStart(2, "0")} / 03</p>
          </article>
        ))}
      </div>
    </section>
  );
}
