"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ArchMark } from "@/components/brand/ArchMark";
import { lockScroll } from "@/lib/scroll";
import { photos, rooms } from "@/data/house";

const ring = "LA CASA · ABOVE THE COVE · INDONESIA · ";

const chapters = [
  { href: "#top", label: "The film", note: "Road to sand", image: photos.gate },
  { href: "#reasons", label: "Three reasons", note: "Why here", image: photos.portal },
  { href: "#cove", label: "The cove", note: "Six metres up", image: photos.coveView },
  { href: "#drawings", label: "The drawings", note: "A-01 to A-04", image: photos.aerial },
  { href: "#rooms", label: "Rooms", note: `${rooms.length} rooms`, image: photos.entrance },
  { href: "#materials", label: "Materials", note: "Plaster and glaze", image: photos.kitchen },
  { href: "#architecture", label: "Architecture", note: "11 by 13 m", image: photos.facade },
];

/**
 * Fixed frame in the ERA manner: rotating emblem top-left, scroll counter on the left, and one
 * Menu button top-right that opens a maroon chapter index with an arched preview of each part.
 * The frame turns white over any section marked data-chrome="light".
 */
export function Chrome() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);

  useGSAP(
    () => {
      // white chrome while a photo section (data-chrome="light") sits under the top of the viewport
      const syncChrome = () => {
        const over = gsap.utils.toArray<HTMLElement>("[data-chrome]", document).some((el) => {
          if (el.dataset.chrome !== "light") return false;
          const r = el.getBoundingClientRect();
          return r.top <= 48 && r.bottom > 48;
        });
        root.current?.classList.toggle("chrome-light", over);
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onRefresh: syncChrome,
        onUpdate: (self) => {
          // a frame later, so the pinned scenes have already flipped their data-chrome
          requestAnimationFrame(syncChrome);
          if (count.current) count.current.textContent = String(Math.round(self.progress * 100)).padStart(2, "0");
          if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`;
        },
      });
      syncChrome();
    },
    { scope: root },
  );

  // open / close: curtain drops from the top, chapter lines rise one after another
  useGSAP(
    () => {
      const el = panel.current!;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.killTweensOf([el, ".menu-line", ".menu-pic", ".menu-foot"]);
      if (open) {
        gsap.set(el, { visibility: "visible" });
        gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: reduce ? 0.01 : 0.9, ease: "power4.inOut" });
        gsap.fromTo(".menu-line", { yPercent: 110 }, { yPercent: 0, duration: reduce ? 0.01 : 0.9, stagger: 0.05, ease: "power4.out", delay: reduce ? 0 : 0.35 });
        gsap.fromTo([".menu-pic", ".menu-foot"], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: reduce ? 0.01 : 0.9, ease: "power3.out", delay: reduce ? 0 : 0.55 });
      } else if (el.style.visibility === "visible") {
        gsap.to(el, {
          clipPath: "inset(0 0 100% 0)",
          duration: reduce ? 0.01 : 0.7,
          ease: "power4.inOut",
          onComplete: () => void gsap.set(el, { visibility: "hidden" }),
        });
      }
    },
    { dependencies: [open], scope: root },
  );

  const close = useCallback(() => setOpen(false), []);

  // scroll lock, inert page, focus in and back out, Escape and a focus loop inside the menu
  useEffect(() => {
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    if (!open) return;
    const trigger = button.current;
    lockScroll(true);
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    const first = panel.current?.querySelector<HTMLElement>("a");
    const t = window.setTimeout(() => first?.focus(), 400);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !panel.current) return;
      const items = [button.current!, ...Array.from(panel.current.querySelectorAll<HTMLElement>("a"))];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      lockScroll(false);
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <div ref={root} className={`chrome pointer-events-none fixed inset-0 z-50 text-ink transition-colors duration-500 [&.chrome-light]:text-white ${open ? "is-open" : ""}`}>
      <div
        ref={panel}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Chapters"
        className="pointer-events-auto invisible absolute inset-0 overflow-y-auto bg-maroon text-cream [clip-path:inset(0_0_100%_0)]"
      >
        <div className="grid min-h-full grid-cols-1 gap-10 px-[var(--gutter)] pb-10 pt-[clamp(7rem,16vh,10rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-[6vw]">
          <nav aria-label="Chapters">
            <ol className="flex flex-col">
              {chapters.map((c, i) => (
                <li key={c.href} className="overflow-hidden border-b border-cream/15 first:border-t">
                  <a
                    href={c.href}
                    onClick={close}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    className="menu-line group flex items-baseline gap-[clamp(1rem,2vw,2rem)] py-[clamp(0.55rem,1.4vh,0.95rem)]"
                  >
                    <span className="label w-8 shrink-0 tabular-nums opacity-55">{String(i + 1).padStart(2, "0")}</span>
                    <span className="caps text-[clamp(2rem,1.2rem+3vw,4.4rem)] leading-[0.92] transition-[transform,opacity] duration-500 ease-[var(--ease-out)] group-hover:translate-x-3 group-focus-visible:translate-x-3">
                      {c.label}
                    </span>
                    <span className="label ml-auto hidden opacity-60 sm:block">{c.note}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="menu-pic relative mx-auto hidden aspect-[3/4] w-full max-w-[26rem] overflow-hidden rounded-t-full bg-maroon-2 lg:block">
            {chapters.map((c, i) => (
              <Image
                key={c.href}
                src={c.image}
                alt=""
                fill
                sizes="26rem"
                className={`object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-out)] ${i === hover ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"}`}
              />
            ))}
          </div>

          <div className="menu-foot label flex flex-wrap items-center justify-between gap-4 opacity-75 lg:col-span-2">
            <span>La Casa · Above the cove · Indonesia</span>
            <a href="/blueprints/A-01-site.dxf" download className="underline underline-offset-4 hover:opacity-70">
              Site plan DXF
            </a>
          </div>
        </div>
      </div>

      <a href="#top" aria-label="La Casa, back to the top" className="pointer-events-auto absolute left-[clamp(1rem,2.4vw,2.25rem)] top-[clamp(1rem,2.4vw,2rem)] block h-[clamp(4.25rem,6vw,5.75rem)] w-[clamp(4.25rem,6vw,5.75rem)] [.is-open_&]:text-cream">
        <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <path id="ring" d="M50 50 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
          </defs>
          <text fill="currentColor" style={{ fontFamily: "var(--font-body)", fontStretch: "125%", fontSize: "8.2px", fontWeight: 700, letterSpacing: "1.6px" }}>
            <textPath href="#ring">{ring}</textPath>
          </text>
        </svg>
        <ArchMark className="absolute left-1/2 top-1/2 h-[38%] -translate-x-1/2 -translate-y-1/2" />
      </a>

      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        className="group pointer-events-auto absolute right-[clamp(1rem,2.4vw,2.25rem)] top-[clamp(1.4rem,2.8vw,2.4rem)] flex h-12 items-center gap-3 [.is-open_&]:text-cream"
      >
        <span className="caps text-[clamp(1.1rem,0.85rem+0.5vw,1.45rem)] leading-none">{open ? "Close" : "Menu"}</span>
        <span aria-hidden="true" className="relative block h-3 w-8">
          <span className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500 ease-[var(--ease-out)] ${open ? "translate-y-[6px] rotate-45" : "group-hover:translate-x-1"}`} />
          <span className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500 ease-[var(--ease-out)] ${open ? "-translate-y-[5px] -rotate-45" : "group-hover:-translate-x-1"}`} />
        </span>
      </button>

      <div aria-hidden="true" className="absolute bottom-[clamp(1.2rem,3vh,2.2rem)] left-[clamp(1.6rem,3.2vw,3rem)] hidden flex-col items-center gap-3 md:flex [.is-open_&]:opacity-0">
        <span ref={count} className="label tabular-nums">00</span>
        <span className="relative h-[22vh] w-px bg-current/25">
          <span ref={bar} className="absolute inset-0 origin-top scale-y-0 bg-current" />
        </span>
        <span className="label [writing-mode:vertical-rl] rotate-180">Scroll</span>
      </div>
    </div>
  );
}
