"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { features, photos } from "@/data/house";

/**
 * Night render with ERA's stacked list (one item lights up at a time), then, on the same pinned
 * picture, a cream arch rises with "Rooms to live in" and widens until it is the whole screen,
 * so the rooms continue on cream without the image scrolling away first.
 */
export function Night() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>(".feat");
        gsap.set(".night-arch", { yPercent: 105, scale: 0.55 });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=170%",
            pin: true,
            scrub: 0.4,
            onUpdate: (self) => root.current?.setAttribute("data-chrome", self.progress > 0.86 ? "dark" : "light"),
          },
        });
        // one scroll lights the list top to bottom, and every line stays lit
        items.forEach((el, i) => tl.to(el, { opacity: 1, duration: 0.2 }, 0.05 + i * 0.15));
        const rise = 0.05 + items.length * 0.15 + 0.15;
        tl.to(".night-list", { autoAlpha: 0, y: -30, duration: 0.4 }, rise + 0.15);
        tl.to(".night-arch", { yPercent: 0, scale: 1, duration: 1.1, ease: "power1.out" }, rise);
        tl.fromTo(".night-arch-title", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, rise + 0.5);
        // widen past the screen edges, ERA's 125vw arch
        tl.to(".night-arch-title", { autoAlpha: 0, y: -30, duration: 0.35 }, rise + 1.45);
        tl.to(".night-arch", { scale: 3.4, duration: 0.8, ease: "power2.in" }, rise + 1.45);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="rooms" data-chrome="light" aria-labelledby="night-title" className="relative h-[100dvh] min-h-[560px] overflow-hidden text-white">
      <Image src={photos.rearNight} alt="The back of the house at night: lanterns under the four terrace arches, warm light upstairs" fill sizes="100vw" placeholder="blur" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_left,oklch(16%_0.04_265/0.65)_0%,transparent_55%)]" />
      <div className="night-list absolute right-[var(--gutter)] top-1/2 -translate-y-1/2 border-l border-white/60 pl-5">
        <h2 id="night-title" className="label mb-4 opacity-80">At night, from the lawn</h2>
        <ul className="flex flex-col gap-1">
          {features.map((f, i) => (
            <li key={f} className={`feat caps text-[length:var(--text-caps)] ${i === 0 ? "opacity-100" : "opacity-35"}`}>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true" className="night-arch absolute inset-x-[6vw] bottom-0 top-[6vh] origin-bottom rounded-t-[50vw] bg-cream text-ink will-change-transform motion-reduce:hidden md:inset-x-[16vw]">
        <p className="night-arch-title display absolute inset-x-0 top-[22%] text-center text-[length:var(--text-mega)]">
          Rooms
          <br />
          to
          <span className="script -mt-[0.15em] block text-[length:var(--text-script)] normal-case">live in</span>
        </p>
      </div>
    </section>
  );
}
