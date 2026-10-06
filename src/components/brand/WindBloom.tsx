"use client";

import { useEffect, useRef, useState } from "react";
import Image, { getImageProps, type StaticImageData } from "next/image";

/**
 * A flower cut-out that moves in the breeze: a tiny WebGL pass bends each pixel by an amount that grows
 * with its distance from where the plant is rooted, so stems stay put while the blooms, lavender spikes
 * and leaf tips sway and flutter. The plain image is shown until the first frame is drawn (and stays when
 * WebGL is missing or motion is reduced).
 *
 * root: "corner" = hanging from the image's top-left corner (the cascade), "base" = growing from its
 * bottom edge (the mound). Flip or rotate the wrapper in CSS; the root moves with the picture.
 */
export function WindBloom({ image, root, seed = 0, className = "" }: { image: StaticImageData; root: "corner" | "base"; seed?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    const vs = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
    const fs = `precision mediump float;
      varying vec2 uv; uniform sampler2D img; uniform float t; uniform float corner; uniform float aspect;
      void main(){
        // 0 at the root, 1 at the far tips
        float d = corner > .5 ? clamp(length(vec2(uv.x, uv.y / aspect)) / 1.15, 0., 1.) : clamp(1. - uv.y, 0., 1.);
        float w = d * d * (3. - 2. * d);
        // the whole mass bends, the tips lagging behind the base
        float bend = sin(t * .85 - d * 2.2) * .55 + sin(t * .37 + 1.3) * .45;
        vec2 sway = corner > .5 ? vec2(bend * .010, -bend * .006) : vec2(bend * .013, abs(bend) * .002);
        // and each blossom and leaf flutters on its own
        vec2 f = vec2(
          sin(uv.y * 23. + t * 1.9) * sin(uv.x * 17. - t * 1.3),
          sin(uv.x * 21. + t * 1.6) * cos(uv.y * 15. + t * 1.15)
        ) * .0045;
        // clamped, so where the cut-out meets its straight edges the planting never pulls away from them
        gl_FragColor = texture2D(img, clamp(uv - (sway + f) * w, 0., 1.));
      }`;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(prog, "t");
    gl.uniform1f(gl.getUniformLocation(prog, "corner"), root === "corner" ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(prog, "aspect"), image.height / image.width);

    let tex: WebGLTexture | null = null;
    let raf = 0;
    let visible = false;
    let alive = true;
    const t0 = performance.now() / 1000 + seed * 7.3;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const frame = () => {
      raf = 0;
      if (!alive || !tex) return;
      size();
      gl.uniform1f(uT, performance.now() / 1000 - t0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible) raf = requestAnimationFrame(frame);
    };

    // the optimised image at about the size it is drawn
    const need = cv.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5);
    const { props } = getImageProps({ src: image, alt: "", sizes: "40vw", quality: 75 });
    const options = (props.srcSet ?? "").split(", ").map((s) => {
      const [url, w] = s.trim().split(" ");
      return { url, w: parseInt(w, 10) };
    }).filter((o) => o.url && o.w).sort((a, b) => a.w - b.w);
    const src = (options.find((o) => o.w >= need) ?? options.at(-1))?.url ?? image.src;

    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      if (!alive) return;
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      frame();
      setLive(true);
      if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    img.src = src;

    // only animate while on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }, { rootMargin: "10% 25%" });
    io.observe(cv);

    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(raf);
      // free the GPU objects but keep the context: a canvas hands back the same context on the next
      // mount (React re-runs effects in development), and a lost one can never draw again
      if (tex) gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [image, root, seed]);

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
      <Image src={image} alt="" fill sizes="40vw" className={`object-contain transition-opacity duration-300 ${live ? "opacity-0" : ""}`} />
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
