"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { photos, planPhotos, roomLists, sheets, type SheetId } from "@/data/house";

const notes: Record<"site" | "section", { term: string; detail: string }[]> = {
  site: [
    { term: "Plot", detail: "20 × 50 m, 1,000 m²" },
    { term: "Front garden", detail: "21 m deep" },
    { term: "House + terrace", detail: "13 m + 3 m" },
    { term: "Backyard", detail: "13 m deep" },
    { term: "Bluff", detail: "6.00 m to the beach" },
  ],
  section: [
    { term: "Ground floor", detail: "+0.45" },
    { term: "Upper floor", detail: "+3.85" },
    { term: "Eaves", detail: "+7.10, roof pitch 20°" },
    { term: "Ridge", detail: "+9.47" },
    { term: "Beach", detail: "−6.00" },
  ],
};

export function BlueprintViewer() {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drawn = useRef(new Set<SheetId>());
  const [sheet, setSheet] = useState<SheetId>("ground");
  const [svgs, setSvgs] = useState<Partial<Record<SheetId, string>>>({});
  const [failedSheets, setFailed] = useState<Partial<Record<SheetId, boolean>>>({});
  const svg = svgs[sheet] ?? null;
  const failed = !!failedSheets[sheet];
  const [picked, setPicked] = useState<string | null>("living");
  const [inView, setInView] = useState(false);

  const meta = sheets.find((s) => s.id === sheet)!;
  const isPlan = sheet === "ground" || sheet === "upper";
  const roomList = isPlan ? roomLists[sheet] : [];
  const pickedRoom = roomList.find((r) => r.id === picked) ?? null;

  // load each sheet SVG once; tab switches after that are instant
  useEffect(() => {
    if (svgs[sheet]) return;
    let alive = true;
    fetch(`/blueprints/${sheet}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => alive && setSvgs((m) => ({ ...m, [sheet]: text })))
      .catch(() => alive && setFailed((f) => ({ ...f, [sheet]: true })));
    return () => {
      alive = false;
    };
  }, [sheet, svgs]);

  useGSAP(
    () => {
      ScrollTrigger.create({ trigger: root.current, start: "top 70%", once: true, onEnter: () => setInView(true) });
    },
    { scope: root },
  );

  // draw the linework in layer order the first time a sheet is seen
  useGSAP(
    () => {
      const el = frame.current;
      if (!el || !svg || !inView || drawn.current.has(sheet)) return;
      drawn.current.add(sheet);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const layers = Array.from(el.querySelectorAll<SVGGElement>(".bp-layer"));
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      layers.forEach((layer, i) => {
        const strokes = layer.querySelectorAll("path[pathLength]:not(.d), circle[pathLength]:not(.d)");
        const rest = layer.querySelectorAll("text, path:not([pathLength]), .d");
        if (strokes.length) {
          tl.fromTo(strokes, { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.1, stagger: { amount: 0.5 }, clearProps: "strokeDasharray,strokeDashoffset" }, i * 0.14);
        }
        if (rest.length) tl.fromTo(rest, { opacity: 0 }, { opacity: 1, duration: 0.6 }, i * 0.14 + 0.3);
      });
    },
    { dependencies: [svg, inView, sheet], scope: frame },
  );

  // crop to the drawing itself, or show the whole A3 sheet with its title block
  const [fullSheet, setFullSheet] = useState(false);
  useEffect(() => {
    const host = frame.current;
    const el = host?.querySelector("svg");
    if (!host || !el) return;
    const full = el.dataset.full ?? el.getAttribute("viewBox") ?? "0 0 4200 2970";
    el.dataset.full = full;
    let box = full;
    if (!fullSheet) {
      const parts = Array.from(el.querySelectorAll<SVGGraphicsElement>(".bp-layer:not(.bp-frame):not(.bp-text), .bp-rooms"));
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const g of parts) {
        const b = g.getBBox();
        if (!b.width) continue;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      }
      if (Number.isFinite(x0)) {
        const pad = 60;
        box = `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`;
      }
    }
    // the frame keeps one fixed height for every sheet (so the page never changes length when you switch);
    // the drawing scales to fill it as large as it fits
    el.setAttribute("viewBox", box);
    el.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [svg, fullSheet]);

  // reflect the picked room on the drawing
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    el.querySelectorAll(".bp-room").forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-room") === picked));
  }, [picked, svg]);

  const onSheetPointer = useCallback((e: React.MouseEvent) => {
    const room = (e.target as Element).closest?.(".bp-room");
    if (room) setPicked(room.getAttribute("data-room"));
  }, []);

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = sheets[(i + (e.key === "ArrowRight" ? 1 : sheets.length - 1)) % sheets.length];
    setSheet(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };


  const go = (d: number) => {
    const i = sheets.findIndex((s) => s.id === sheet);
    const next = sheets[(i + d + sheets.length) % sheets.length];
    setSheet(next.id);
    if (next.id === "upper") setPicked("master");
    if (next.id === "ground") setPicked("living");
  };
  const index = sheets.findIndex((s) => s.id === sheet);

  return (
    <div ref={root} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-x-10">
      <dl className="flex flex-wrap gap-x-[clamp(2rem,5vw,5rem)] gap-y-4 lg:col-span-2">
        {[
          ["Bedrooms", "2"],
          ["Floor area", "286 m²"],
          ["Plot", "1,000 m²"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label opacity-70">{k}</dt>
            <dd className="caps mt-2 text-[length:var(--text-caps)]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="min-w-0">
        <div id="sheet-panel" role="tabpanel" aria-labelledby={`tab-${sheet}`}>
          <div tabIndex={0} aria-label={`${meta.title} drawing, scrollable`} className="-mx-[var(--gutter)] overflow-x-auto overflow-y-hidden px-[var(--gutter)] lg:mx-0 lg:px-0">
            <div
              ref={frame}
              onClick={onSheetPointer}
              onMouseOver={onSheetPointer}
              className="bp-viewer relative mx-auto h-[min(84dvh,64vw)] min-h-[440px] w-full min-w-[640px] bg-blueprint shadow-[0_30px_80px_-40px_oklch(25%_0.05_265/0.6)]"
              dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            />
          </div>
          {!svg && (
            <p className="body-small mt-3 text-ink-2" aria-live="polite">
              {failed ? "This sheet did not load. Reload the page, or download the DXF." : "Loading the drawing…"}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => go(-1)} aria-label="Previous sheet" className="grid h-9 w-9 place-items-center transition-opacity hover:opacity-60">
              <CaretLeft size={16} weight="light" aria-hidden="true" />
            </button>
            <span className="label tabular-nums">{index + 1}</span>
            <span className="relative h-px w-28 bg-ink/25" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700" style={{ width: `${((index + 1) / sheets.length) * 100}%` }} />
            </span>
            <span className="label tabular-nums">{sheets.length}</span>
            <button type="button" onClick={() => go(1)} aria-label="Next sheet" className="grid h-9 w-9 place-items-center transition-opacity hover:opacity-60">
              <CaretRight size={16} weight="light" aria-hidden="true" />
            </button>
          </div>
          <p className="display text-[clamp(2.8rem,1.6rem+4vw,6rem)]">{meta.title}</p>
          <div role="tablist" aria-label="Drawing sheets" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {sheets.map((s, i) => (
              <button
                key={s.id}
                id={`tab-${s.id}`}
                role="tab"
                type="button"
                aria-selected={s.id === sheet}
                aria-controls="sheet-panel"
                tabIndex={s.id === sheet ? 0 : -1}
                onKeyDown={(e) => onTabKey(e, i)}
                onClick={() => go(i - index)}
                className={`label whitespace-nowrap transition-opacity ${s.id === sheet ? "underline underline-offset-4" : "opacity-55 hover:opacity-100"}`}
              >
                {s.number} {s.title}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setFullSheet((v) => !v)} aria-pressed={fullSheet} className="label opacity-70 transition-opacity hover:opacity-100">
            {fullSheet ? "Show the drawing only" : "Show the full sheet with title block"}
          </button>
        </div>
      </div>

      {/* sticks below the fixed menu button so the frame never covers it */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-[7rem]">
        {isPlan ? (
          <>
            <div className="relative aspect-[4/3] overflow-hidden bg-sky-2">
              {pickedRoom && planPhotos[pickedRoom.id] ? (
                <Image key={pickedRoom.id} src={planPhotos[pickedRoom.id]} alt={`Render of the ${pickedRoom.label.toLowerCase()}`} fill sizes="18rem" placeholder="blur" className="object-cover" />
              ) : (
                <p className="body-small absolute inset-0 grid place-items-center p-6 text-center text-ink-2">
                  {pickedRoom ? "No render of this room. The drawing shows it all." : "Pick a room on the plan."}
                </p>
              )}
            </div>
            <div>
              <p className="caps text-[length:var(--text-caps)]" aria-live="polite">{pickedRoom?.label ?? meta.title}</p>
              {pickedRoom && <p className="label mt-2 opacity-70">{pickedRoom.area.toFixed(1)} m² net</p>}
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {roomList.map((r) => (
                <li key={r.id + r.area}>
                  <button
                    type="button"
                    onClick={() => setPicked(r.id)}
                    aria-pressed={picked === r.id}
                    className={`label w-full truncate py-1 text-left transition-opacity ${picked === r.id ? "underline underline-offset-4" : "opacity-60 hover:opacity-100"}`}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
          {sheet === "site" && (
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden bg-sky-2">
                <Image src={photos.coveView} alt="The stone stairs down the bluff from the arched portal to the beach" fill sizes="18rem" placeholder="blur" className="object-cover" />
              </div>
              <figcaption className="label mt-3 opacity-70">The stone stairs, from the cove</figcaption>
            </figure>
          )}
          <dl className="grid gap-3">
            {notes[sheet as "site" | "section"].map((n) => (
              <div key={n.term} className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
                <dt className="label opacity-70">{n.term}</dt>
                <dd className="body-small">{n.detail}</dd>
              </div>
            ))}
          </dl>
          </>
        )}
        <a
          href={`/blueprints/${meta.number}-${meta.id}.dxf`}
          download
          className="label inline-flex w-max items-center gap-3 rounded-full border border-ink/40 px-5 py-3 whitespace-nowrap transition-colors hover:bg-ink hover:text-sky"
        >
          Download {meta.number} DXF
          <DownloadSimple size={14} weight="light" aria-hidden="true" />
        </a>
      </aside>
    </div>
  );
}
