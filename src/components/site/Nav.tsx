"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { HOUSE_NAME } from "@/data/house";

const links = [
  { href: "#site", label: "The site" },
  { href: "#plans", label: "Plans" },
  { href: "#rooms", label: "Rooms" },
  { href: "#materials", label: "Materials" },
  { href: "#walk", label: "Walk" },
];

type Theme = "day" | "dusk";

function readTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "day" || set === "dusk") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dusk" : "day";
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  mq.addEventListener("change", cb);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", cb);
  };
}

function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "day" as Theme);
  const next: Theme = theme === "day" ? "dusk" : "day";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("cove-theme", next);
        } catch {}
      }}
      aria-label={`Switch to ${next}`}
      className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-ink/10 active:scale-95"
    >
      {theme === "day" ? <Moon size={18} weight="light" /> : <Sun size={18} weight="light" />}
    </button>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-5">
      <nav
        aria-label="Sections"
        className="flex h-14 w-full max-w-[880px] items-center justify-between gap-4 rounded-full border border-ink/10 bg-paper/80 pl-5 pr-2 shadow-[0_12px_40px_-18px_oklch(20%_0.02_220/0.35)] backdrop-blur-xl"
      >
        <a href="#top" translate="no" className="font-display text-xl font-semibold tracking-tight whitespace-nowrap">
          {HOUSE_NAME}
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3 py-2 text-sm whitespace-nowrap text-ink-2 transition-colors duration-200 hover:bg-ink/[.06] hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu"
            onClick={() => setOpen((v) => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-full md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span
              aria-hidden="true"
              className={`absolute h-px w-5 bg-ink transition-transform duration-300 ease-[var(--ease-out)] ${open ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-px w-5 bg-ink transition-transform duration-300 ease-[var(--ease-out)] ${open ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </div>
      </nav>

      <div
        id="menu"
        className={`fixed inset-0 -z-10 overscroll-contain bg-paper/95 backdrop-blur-2xl transition-opacity duration-300 md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
      >
        <ul className="wrap flex h-full flex-col justify-center gap-2">
          {links.map((l, i) => (
            <li key={l.href} className="overflow-hidden">
              <a
                href={l.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                className={`block font-display text-5xl transition-[transform,opacity] duration-500 ease-[var(--ease-out)] ${open ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
