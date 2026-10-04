"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { planPhotos, roomLists, sheets, type SheetId } from "@/data/house";

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
    el.setAttribute("viewBox", box);
    const [, , w, h] = box.split(" ").map(Number);
    host.style.aspectRatio = `${w} / ${h}`;
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

  return (
    <div ref={root}>
      <div role="tablist" aria-label="Drawing sheets" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {sheets.map((s, i) => {
          const active = s.id === sheet;
          return (
            <button
              key={s.id}
              id={`tab-${s.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="sheet-panel"
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => onTabKey(e, i)}
              onClick={() => {
                setSheet(s.id);
                if (s.id === "upper") setPicked("master");
                if (s.id === "ground") setPicked("living");
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors duration-200 ${active
                ? "border-blueprint-ink bg-blueprint-ink text-blueprint"
                : "border-blueprint-ink/30 text-blueprint-ink hover:border-blueprint-ink/70"}`}
            >
              <span className="font-mono text-xs opacity-70">{s.number}</span> {s.title}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div id="sheet-panel" role="tabpanel" aria-labelledby={`tab-${sheet}`} className="min-w-0">
          <div tabIndex={0} aria-label={`${meta.title} drawing, scrollable`} className="-mx-[var(--gutter)] overflow-x-auto overflow-y-hidden px-[var(--gutter)] lg:mx-0 lg:px-0">
            <div
              ref={frame}
              onClick={onSheetPointer}
              onMouseOver={onSheetPointer}
              className="bp-viewer relative aspect-[420/297] max-h-[78dvh] min-w-[640px] bg-blueprint-2/40 ring-1 ring-blueprint-ink/15"
              dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            />
          </div>
          {!svg && (
            <p className="mt-3 text-sm text-blueprint-dim" aria-live="polite">
              {failed ? "This sheet did not load. Reload the page, or download the DXF below." : "Loading the drawing…"}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-blueprint-dim">
            <span className="lg:hidden">Swipe sideways to see the whole drawing.</span>
            <button
              type="button"
              onClick={() => setFullSheet((v) => !v)}
              aria-pressed={fullSheet}
              className="ml-auto rounded-full border border-blueprint-ink/30 px-4 py-1.5 whitespace-nowrap text-blueprint-ink transition-colors hover:border-blueprint-ink/70"
            >
              {fullSheet ? "Show the drawing" : "Show the full sheet"}
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {isPlan ? (
            <>
              <div className="relative aspect-[4/3] overflow-hidden bg-blueprint-2 ring-1 ring-blueprint-ink/15">
                {pickedRoom && planPhotos[pickedRoom.id] ? (
                  <Image
                    key={pickedRoom.id}
                    src={planPhotos[pickedRoom.id]}
                    alt={`Render of the ${pickedRoom.label.toLowerCase()}`}
                    fill
                    sizes="20rem"
                    placeholder="blur"
                    className="object-cover"
                  />
                ) : (
                  <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-blueprint-dim">
                    {pickedRoom ? "No render of this room yet. The drawing shows it all." : "Pick a room on the plan."}
                  </p>
                )}
              </div>
              <div>
                <p className="font-display text-3xl" aria-live="polite">{pickedRoom?.label ?? meta.title}</p>
                {pickedRoom && <p className="mt-1 font-mono text-sm text-blueprint-dim">{pickedRoom.area.toFixed(1)} m² net</p>}
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {roomList.map((r) => (
                  <li key={r.id + r.area}>
                    <button
                      type="button"
                      onClick={() => setPicked(r.id)}
                      aria-pressed={picked === r.id}
                      className={`w-full truncate py-1 text-left transition-colors ${picked === r.id ? "text-blueprint-hot" : "text-blueprint-ink/80 hover:text-blueprint-ink"}`}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <dl className="grid gap-3">
              {notes[sheet as "site" | "section"].map((n) => (
                <div key={n.term} className="flex items-baseline justify-between gap-4 border-b border-blueprint-ink/15 pb-3">
                  <dt className="text-sm text-blueprint-dim">{n.term}</dt>
                  <dd className="font-mono text-sm">{n.detail}</dd>
                </div>
              ))}
            </dl>
          )}
          <a
            href={`/blueprints/${meta.number}-${meta.id}.dxf`}
            download
            className="group mt-auto inline-flex w-max items-center gap-3 rounded-full border border-blueprint-ink/40 py-2 pl-5 pr-2 text-sm whitespace-nowrap transition-colors hover:border-blueprint-ink"
          >
            Download {meta.number} DXF
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blueprint-ink/10 transition-transform duration-300 group-hover:translate-y-0.5">
              <DownloadSimple size={16} weight="light" aria-hidden="true" />
            </span>
          </a>
        </aside>
      </div>
    </div>
  );
}
