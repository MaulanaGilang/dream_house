"use client";

import { useEffect, useState } from "react";
import { ArchMark } from "@/components/brand/ArchMark";

/** Short cream curtain with the arch mark while the poster frame and fonts arrive (never longer than 2.6 s). */
export function Preloader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setDone(true);
    };
    const min = new Promise((r) => setTimeout(r, 900));
    const ready = Promise.all([document.fonts?.ready, new Promise((r) => (document.readyState === "complete" ? r(null) : window.addEventListener("load", r, { once: true })))]);
    Promise.all([min, ready]).then(finish);
    const cap = setTimeout(finish, 2600);
    return () => clearTimeout(cap);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[80] grid place-items-center bg-cream transition-[clip-path] duration-[1200ms] ease-[var(--ease-in-out)] ${done ? "pointer-events-none [clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0_0)]"}`}
    >
      <div className="flex flex-col items-center gap-6">
        <ArchMark className="h-20 animate-pulse" />
        <span className="display text-5xl">La Casa</span>
      </div>
    </div>
  );
}
