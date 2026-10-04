"""Sheet = a list of drawing primitives in model millimetres, written to DXF and to SVG.

DXF keeps real entities (lines, arcs, hatches, DIMENSION entities, text) on named
layers so the file opens properly in CAD. SVG mirrors the same primitives for the
web, grouped by layer so the site can animate each layer in drawing order.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from xml.sax.saxutils import escape

import ezdxf
from ezdxf.enums import TextEntityAlignment
from shapely.geometry import MultiPolygon, Polygon

# layer: (DXF lineweight in 1/100 mm, SVG stroke in paper mm, draw order)
LAYERS = {
    "GROUND": (50, 0.45, 0),
    "SITE": (25, 0.22, 1),
    "PLANT": (13, 0.13, 2),
    "HATCH": (13, 0.08, 3),
    "WALL": (70, 0.55, 4),
    "OPEN": (35, 0.28, 5),
    "FURN": (13, 0.12, 6),
    "ABOVE": (18, 0.16, 7),
    "GRID": (9, 0.1, 8),
    "DIM": (18, 0.13, 9),
    "TEXT": (18, 0.13, 10),
    "FRAME": (50, 0.4, 11),
}
DASHES = {"DASHED": "1.6 1.0", "CENTER": "5 1 1 1", "HIDDEN": "0.8 0.6", "PHANTOM": "6 1 1 1 1 1"}
ALIGN = {
    "MC": TextEntityAlignment.MIDDLE_CENTER, "ML": TextEntityAlignment.MIDDLE_LEFT,
    "MR": TextEntityAlignment.MIDDLE_RIGHT, "BL": TextEntityAlignment.BOTTOM_LEFT,
    "BC": TextEntityAlignment.BOTTOM_CENTER, "BR": TextEntityAlignment.BOTTOM_RIGHT,
    "TL": TextEntityAlignment.TOP_LEFT, "TC": TextEntityAlignment.TOP_CENTER,
}


def _polys(geom):
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon)]


@dataclass
class Sheet:
    slug: str
    title: str
    number: str
    scale: int
    paper: tuple[float, float]           # paper size in mm (w, h)
    origin: tuple[float, float]          # model point at paper lower-left
    items: list = field(default_factory=list)
    rooms: list = field(default_factory=list)

    # paper mm -> model mm
    def p(self, mm: float) -> float:
        return mm * self.scale

    def line(self, a, b, layer, lt=None):
        self.items.append(("line", layer, lt, (tuple(a), tuple(b))))

    def poly(self, pts, layer, closed=True, lt=None):
        self.items.append(("poly", layer, lt, ([tuple(p) for p in pts], closed)))

    def rect(self, x0, y0, x1, y1, layer, lt=None):
        self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], layer, True, lt)

    def outline(self, geom, layer, lt=None):
        for pg in _polys(geom):
            self.poly(list(pg.exterior.coords)[:-1], layer, True, lt)
            for r in pg.interiors:
                self.poly(list(r.coords)[:-1], layer, True, lt)

    def arc(self, c, r, a0, a1, layer, lt=None):
        """Counter-clockwise arc from a0 to a1 degrees."""
        self.items.append(("arc", layer, lt, (tuple(c), r, a0, a1)))

    def circle(self, c, r, layer, lt=None):
        self.items.append(("circle", layer, lt, (tuple(c), r)))

    def text(self, at, s, h_mm, layer="TEXT", align="MC", rot=0.0, cls=""):
        self.items.append(("text", layer, None, (tuple(at), s, self.p(h_mm), align, rot, cls)))

    def hatch(self, geom, pattern="ANSI31", spacing_mm=0.9, layer="HATCH"):
        for pg in _polys(geom):
            self.items.append(("hatch", layer, None, (pg, pattern, self.p(spacing_mm))))

    def dim(self, a, b, offset, layer="DIM"):
        """Aligned-to-axis linear dimension; offset is model distance from the measured points."""
        self.items.append(("dim", layer, None, (tuple(a), tuple(b), offset)))

    def room(self, rid, geom, label, area):
        self.rooms.append((rid, geom, label, area))

    # -------------------------------------------------------------------------- DXF
    def to_dxf(self, path):
        doc = ezdxf.new("R2018", setup=True)
        doc.units = ezdxf.units.MM
        doc.header["$LTSCALE"] = self.scale * 0.5
        doc.header["$INSUNITS"] = 4
        for name, (lw, _, _) in LAYERS.items():
            doc.layers.add(name, lineweight=lw)
        doc.layers.add("ROOMS", lineweight=13)
        s = self.scale
        doc.dimstyles.new("COVE", dxfattribs=dict(
            dimtxt=1.8 * s, dimasz=0, dimtsz=0.9 * s, dimexe=1.2 * s, dimexo=1.0 * s,
            dimgap=0.6 * s, dimdec=0, dimlfac=1, dimtad=1, dimtih=0, dimtoh=0, dimzin=8,
        ))
        msp = doc.modelspace()
        for kind, layer, lt, data in self.items:
            att = {"layer": layer}
            if lt:
                att["linetype"] = lt
            if kind == "line":
                msp.add_line(*data, dxfattribs=att)
            elif kind == "poly":
                pts, closed = data
                msp.add_lwpolyline(pts, close=closed, dxfattribs=att)
            elif kind == "arc":
                c, r, a0, a1 = data
                msp.add_arc(c, r, a0, a1, dxfattribs=att)
            elif kind == "circle":
                msp.add_circle(data[0], data[1], dxfattribs=att)
            elif kind == "text":
                at, txt, h, align, rot, _ = data
                msp.add_text(txt, height=h, rotation=rot, dxfattribs=att).set_placement(at, align=ALIGN[align])
            elif kind == "hatch":
                pg, pattern, spacing = data
                h = msp.add_hatch(dxfattribs=att)
                if pattern == "SOLID":
                    h.set_solid_fill()
                else:
                    base = {"ANSI31": 3.175, "ANSI37": 3.175, "DOTS": 0.79375, "AR-SAND": 1.0}.get(pattern, 3.175)
                    h.set_pattern_fill(pattern, scale=spacing / base)
                h.paths.add_polyline_path(list(pg.exterior.coords)[:-1], is_closed=True, flags=1)
                for r in pg.interiors:
                    h.paths.add_polyline_path(list(r.coords)[:-1], is_closed=True, flags=16)
            elif kind == "dim":
                a, b, off = data
                horizontal = abs(a[1] - b[1]) < abs(a[0] - b[0])
                if horizontal:
                    base = (a[0], max(a[1], b[1]) + off if off > 0 else min(a[1], b[1]) + off)
                    d = msp.add_linear_dim(base=base, p1=a, p2=b, angle=0, dimstyle="COVE", dxfattribs=att)
                else:
                    base = (max(a[0], b[0]) + off if off > 0 else min(a[0], b[0]) + off, a[1])
                    d = msp.add_linear_dim(base=base, p1=a, p2=b, angle=90, dimstyle="COVE", dxfattribs=att)
                d.render()
        for _, geom, _, _ in self.rooms:
            for pg in _polys(geom):
                msp.add_lwpolyline(list(pg.exterior.coords)[:-1], close=True, dxfattribs={"layer": "ROOMS"})
        doc.saveas(path)

    # -------------------------------------------------------------------------- SVG
    K = 10  # SVG units per paper millimetre

    def _xy(self, pt):
        x = (pt[0] - self.origin[0]) / self.scale * self.K
        y = (self.paper[1] - (pt[1] - self.origin[1]) / self.scale) * self.K
        return round(x, 2), round(y, 2)

    def _d_poly(self, pts, closed):
        q = [self._xy(p) for p in pts]
        d = "M" + " L".join(f"{x} {y}" for x, y in q)
        return d + (" Z" if closed else "")

    def to_svg(self, path, rooms_meta=None):
        K = self.K
        W, H = self.paper[0] * K, self.paper[1] * K
        groups: dict[str, list[str]] = {k: [] for k in LAYERS}
        hatch_defs = set()
        for kind, layer, lt, data in self.items:
            dash = f' stroke-dasharray="{" ".join(str(float(v) * K) for v in DASHES[lt].split())}"' if lt else ""
            cls = ' class="d"' if lt else ""
            out = groups[layer]
            if kind == "line":
                (a, b) = data
                (x0, y0), (x1, y1) = self._xy(a), self._xy(b)
                out.append(f'<path{cls} d="M{x0} {y0} L{x1} {y1}" pathLength="1"{dash}/>')
            elif kind == "poly":
                pts, closed = data
                out.append(f'<path{cls} d="{self._d_poly(pts, closed)}" pathLength="1"{dash}/>')
            elif kind == "arc":
                c, r, a0, a1 = data
                sweep = (a1 - a0) % 360 or 360
                p0 = (c[0] + r * math.cos(math.radians(a0)), c[1] + r * math.sin(math.radians(a0)))
                p1 = (c[0] + r * math.cos(math.radians(a1)), c[1] + r * math.sin(math.radians(a1)))
                (x0, y0), (x1, y1) = self._xy(p0), self._xy(p1)
                rr = round(r / self.scale * K, 2)
                large = 1 if sweep > 180 else 0
                out.append(f'<path{cls} d="M{x0} {y0} A{rr} {rr} 0 {large} 0 {x1} {y1}" pathLength="1"{dash}/>')
            elif kind == "circle":
                c, r = data
                x, y = self._xy(c)
                out.append(f'<circle{cls} cx="{x}" cy="{y}" r="{round(r / self.scale * K, 2)}" pathLength="1"{dash}/>')
            elif kind == "text":
                at, txt, h, align, rot, tcls = data
                x, y = self._xy(at)
                anchor = {"L": "start", "C": "middle", "R": "end"}[align[1]]
                base = {"M": "central", "B": "auto", "T": "hanging"}[align[0]]
                fs = round(h / self.scale * K, 2)
                tr = f' transform="rotate({-rot} {x} {y})"' if rot else ""
                c2 = f' class="{tcls}"' if tcls else ""
                out.append(f'<text{c2} x="{x}" y="{y}" font-size="{fs}" text-anchor="{anchor}" dominant-baseline="{base}"{tr}>{escape(txt)}</text>')
            elif kind == "hatch":
                pg, pattern, spacing = data
                sp = round(spacing / self.scale * K, 2)
                pid = f"h-{pattern.lower()}-{sp}".replace(".", "_")
                hatch_defs.add((pid, pattern, sp))
                d = self._d_poly(list(pg.exterior.coords)[:-1], True)
                for r in pg.interiors:
                    d += " " + self._d_poly(list(r.coords)[:-1], True)
                out.append(f'<path d="{d}" fill="url(#{pid})" fill-rule="evenodd" stroke="none"/>')
            elif kind == "dim":
                out.append(self._svg_dim(*data))
        defs = []
        for pid, pattern, sp in sorted(hatch_defs):
            sw = 0.08 * K
            if pattern in ("ANSI31", "ANSI37"):
                extra = f'<line x1="0" y1="0" x2="{sp}" y2="0" stroke="currentColor" stroke-width="{sw}"/>' if pattern == "ANSI37" else ""
                defs.append(f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="{sp}" height="{sp}" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="{sp}" stroke="currentColor" stroke-width="{sw}"/>{extra}</pattern>')
            elif pattern == "SOLID":
                defs.append(f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="currentColor" fill-opacity=".18"/></pattern>')
            else:  # DOTS / AR-SAND
                defs.append(f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="{sp}" height="{sp}"><circle cx="{sp / 2}" cy="{sp / 2}" r="{0.09 * K}" fill="currentColor"/></pattern>')
        parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" class="bp-sheet" data-sheet="{self.slug}" role="img" aria-labelledby="t-{self.slug}">',
            f'<title id="t-{self.slug}">{escape(self.title)}, scale 1:{self.scale}</title>',
            f'<defs>{"".join(defs)}</defs>',
        ]
        for name, (_, sw, _) in sorted(LAYERS.items(), key=lambda kv: kv[1][2]):
            if not groups[name]:
                continue
            fill = "currentColor" if name == "TEXT" else "none"
            parts.append(f'<g id="{self.slug}-{name.lower()}" class="bp-layer bp-{name.lower()}" data-layer="{name.lower()}" fill="{fill}" stroke="currentColor" stroke-width="{sw * K:.2f}" stroke-linecap="round" stroke-linejoin="round">')
            parts.extend(groups[name])
            parts.append("</g>")
        if self.rooms:
            parts.append(f'<g class="bp-rooms" fill="transparent" stroke="none">')
            for rid, geom, label, area in self.rooms:
                d = " ".join(self._d_poly(list(pg.exterior.coords)[:-1], True) for pg in _polys(geom))
                parts.append(f'<path class="bp-room" data-room="{rid}" d="{d}"><title>{escape(label.title())}, {area:.1f} m²</title></path>')
            parts.append("</g>")
        parts.append("</svg>")
        with open(path, "w", encoding="utf8") as f:
            f.write("\n".join(parts))

    def _svg_dim(self, a, b, off):
        K, s = self.K, self.scale
        horizontal = abs(a[1] - b[1]) < abs(a[0] - b[0])
        value = round(abs(b[0] - a[0]) if horizontal else abs(b[1] - a[1]))
        exo, exe, tick, gap = 1.0 * s, 1.2 * s, 0.9 * s, 0.6 * s
        sg = 1 if off > 0 else -1
        els = []
        if horizontal:
            yd = (max(a[1], b[1]) if off > 0 else min(a[1], b[1])) + off
            for p in (a, b):
                els.append((p[0], p[1] + sg * exo, p[0], yd + sg * exe))
            els.append((min(a[0], b[0]) - exe * 0.5, yd, max(a[0], b[0]) + exe * 0.5, yd))
            for x in (a[0], b[0]):
                els.append((x - tick / 2, yd - tick / 2, x + tick / 2, yd + tick / 2))
            tx, ty, rot = (a[0] + b[0]) / 2, yd + gap, 0
        else:
            xd = (max(a[0], b[0]) if off > 0 else min(a[0], b[0])) + off
            for p in (a, b):
                els.append((p[0] + sg * exo, p[1], xd + sg * exe, p[1]))
            els.append((xd, min(a[1], b[1]) - exe * 0.5, xd, max(a[1], b[1]) + exe * 0.5))
            for y in (a[1], b[1]):
                els.append((xd - tick / 2, y - tick / 2, xd + tick / 2, y + tick / 2))
            tx, ty, rot = xd - gap, (a[1] + b[1]) / 2, 90
        d = " ".join(f"M{self._xy((x0, y0))[0]} {self._xy((x0, y0))[1]} L{self._xy((x1, y1))[0]} {self._xy((x1, y1))[1]}" for x0, y0, x1, y1 in els)
        x, y = self._xy((tx, ty))
        fs = round(1.8 * K, 2)
        tr = f' transform="rotate({-rot} {x} {y})"' if rot else ""
        return (f'<g class="bp-dim"><path d="{d}" pathLength="1"/>'
                f'<text x="{x}" y="{y}" font-size="{fs}" text-anchor="middle" dominant-baseline="auto" fill="currentColor" stroke="none"{tr}>{value}</text></g>')
