"""Build every Cove House drawing: DXF to design/blueprints, SVG to src/assets/blueprints.

    python tools/blueprint/build.py
"""
from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

from shapely.geometry import box, Polygon, Point
from shapely.ops import unary_union

import model as M
from sheet import Sheet

ROOT = Path(__file__).resolve().parents[2]
DXF_DIR = ROOT / "design" / "blueprints"
SVG_DIR = ROOT / "public" / "blueprints"
DATA = ROOT / "src" / "data" / "blueprint-rooms.json"
PROJECT = "LA CASA"
DRAWN = "G. MAULANA"
DATE = date(2026, 10, 4).strftime("%d.%m.%Y")


# ----------------------------------------------------------------------------- symbols
def opening_symbols(sh: Sheet, openings, off=(0, 0)):
    ox, oy = off

    def P(x, y):
        return (x + ox, y + oy)

    for o in openings:
        t = o.get("t", M.EXT_T if "ext" in o else M.INT_T)
        c, s, e = o["c"], o["s"], o["e"]
        if "ext" in o:
            lo, hi = (c, c + t) if o["ext"] == "min" else (c - t, c)
        else:
            lo, hi = c - t / 2, c + t / 2
        ax = o["axis"]

        def L(u0, v0, u1, v1, layer="OPEN", lt=None):
            if ax == "x":
                sh.line(P(u0, v0), P(u1, v1), layer, lt)
            else:
                sh.line(P(v0, u0), P(v1, u1), layer, lt)

        kind = o["kind"]
        if kind == "window":
            L(s, lo, e, lo)
            L(s, hi, e, hi)
            L(s, (lo + hi) / 2, e, (lo + hi) / 2)
            L(s, lo, s, hi)
            L(e, lo, e, hi)
        elif kind in ("arch", "garage"):
            L(s, lo, e, lo, "ABOVE", "DASHED")
            L(s, hi, e, hi, "ABOVE", "DASHED")
            L(s, lo, s, hi)
            L(e, lo, e, hi)
        elif kind in ("door", "double"):
            sw = o.get("swing", 1)
            face = hi if sw > 0 else lo
            leaves = []
            if kind == "door":
                hinge_s = o.get("hinge", "s") == "s"
                leaves.append((s if hinge_s else e, 1 if hinge_s else -1, e - s))
            else:
                w = (e - s) / 2
                leaves += [(s, 1, w), (e, -1, w)]
            L(s, lo, s, hi)
            L(e, lo, e, hi)
            for hu, du, w in leaves:
                # leaf drawn open at 90 degrees, swing arc back to the closed position
                L(hu, face, hu, face + sw * w)
                d_ang = 0 if du > 0 else 180
                n_ang = 90 if sw > 0 else 270
                if ax == "y":   # swap axes: u is y, v is x
                    d_ang = 90 if du > 0 else 270
                    n_ang = 0 if sw > 0 else 180
                a0, a1 = d_ang, n_ang
                if (a1 - a0) % 360 > 180:
                    a0, a1 = a1, a0
                centre = P(hu, face) if ax == "x" else P(face, hu)
                sh.arc(centre, w, a0, a1, "OPEN")


def walls_with_poche(sh: Sheet, walls, off=(0, 0)):
    from shapely.affinity import translate
    g = translate(walls, *off)
    sh.hatch(g, "ANSI31", 0.55)
    sh.outline(g, "WALL")


def room_tags(sh: Sheet, rooms, solid, off=(0, 0), meta=None):
    from shapely.affinity import translate
    out = []
    for rid, label, geom in rooms:
        net = geom.difference(solid)
        area = net.area / 1e6
        cx, cy = M.TAG_AT.get(rid, (net.representative_point().x, net.representative_point().y))
        cx, cy = cx + off[0], cy + off[1]
        # 3.2 / 2.2 mm: still standard drawing sizes, and readable on screen without leaning in
        sh.text((cx, cy + sh.p(2.0)), label, 3.2, cls="bp-room-name")
        sh.text((cx, cy - sh.p(2.3)), f"{area:.2f} m²", 2.2, cls="bp-room-area")
        sh.room(rid, translate(geom, *off), label, area)
        out.append(dict(id=rid, label=label.title(), area=round(area, 1)))
    return out


def stair(sh: Sheet, upper=False):
    s = M.STAIR
    x0, y0, x1, y1 = s["x0"], s["y0"], s["x1"], s["y1"]
    xa0, xa1 = x0 + 60, x0 + 60 + s["flight_w"]
    xb0, xb1 = xa1 + s["gap"], x1 - 60
    top = y0 + s["tread"] * s["treads"]
    cut_y = y0 + 1500
    for i in range(1, s["treads"] + 1):
        y = y0 + i * s["tread"]
        if upper:
            sh.line((xa0, y), (xa1, y), "OPEN")
            sh.line((xb0, y), (xb1, y), "OPEN")
        else:
            lt = None if y < cut_y else "HIDDEN"
            layer = "OPEN" if y < cut_y else "ABOVE"
            sh.line((xa0, y), (xa1, y), layer, lt)
            sh.line((xb0, y), (xb1, y), "ABOVE", "HIDDEN")
    sh.line((xa1, y0), (xa1, top), "OPEN")
    sh.line((xb0, y0), (xb0, top), "OPEN" if upper else "ABOVE", None if upper else "HIDDEN")
    sh.line((xa0, top), (xb1, top), "OPEN" if upper else "ABOVE", None if upper else "HIDDEN")
    if upper:
        # guard over the void of flight A at the landing edge
        sh.line((xa0, y0 - 40), (xa1, y0 - 40), "FURN")
        sh.line((xa0, y0 + 40), (xa1, y0 + 40), "FURN")
        mid = (xb0 + xb1) / 2
        sh.line((mid, y0 + 200), (mid, top - 200), "OPEN")
        sh.poly([(mid - 120, top - 420), (mid, top - 200), (mid + 120, top - 420)], "OPEN", closed=False)
        sh.text((mid, y0 - 350), "DN", 1.8)
    else:
        # break line where the plan cut passes through the flight
        sh.poly([(xa0, cut_y - 150), (xa0 + 400, cut_y - 150), (xa0 + 550, cut_y + 120),
                 (xa0 + 700, cut_y - 300), (xa0 + 850, cut_y + 150), (xa1, cut_y + 150)], "OPEN", closed=False)
        mid = (xa0 + xa1) / 2
        sh.line((mid, y0 + 200), (mid, cut_y - 300), "OPEN")
        sh.poly([(mid - 120, cut_y - 520), (mid, cut_y - 300), (mid + 120, cut_y - 520)], "OPEN", closed=False)
        sh.text((mid, y0 - 350), "UP", 1.8)


def furniture_ground(sh: Sheet):
    F = "FURN"
    # bedroom 2: queen bed, nightstands, wardrobe
    sh.rect(250, 1400, 2250, 3000, F); sh.rect(250, 1400, 750, 3000, F)
    sh.rect(250, 900, 700, 1300, F); sh.rect(250, 3100, 700, 3500, F)
    sh.rect(800, 3720, 3800, 4340, F); sh.line((800, 3720), (3800, 4340), F); sh.line((800, 4340), (3800, 3720), F)
    # guest bath
    sh.rect(4380, 1800, 4760, 2480, F); sh.circle((4570, 1950), 170, F)
    sh.rect(5000, 260, 6100, 760, F); sh.circle((5550, 510), 180, F)
    sh.rect(5700, 1640, 6540, 2540, F); sh.line((5700, 1640), (6540, 2540), F); sh.line((5700, 2540), (6540, 1640), F)
    # entrance, furnished as the ruang tamu (guest sitting room): two armchairs flanking the door,
    # coffee table, sofa with its back to the stair, sideboard on the right wall, rug dashed
    sh.rect(7000, 1350, 10200, 3500, "ABOVE", "DASHED")
    sh.rect(6780, 1050, 7480, 1800, F); sh.rect(9700, 1050, 10400, 1800, F)
    sh.rect(7900, 1600, 9200, 2350, F)
    sh.rect(7300, 2650, 9800, 3450, F); sh.rect(7300, 3150, 9800, 3450, F)
    sh.rect(10560, 2600, 10940, 4100, F)
    # workout: mat, rack, mirror
    sh.rect(700, 5000, 2500, 5800, F); sh.rect(3200, 4700, 3900, 6500, F); sh.line((300, 4700), (300, 6500), F)
    # boot room: shelving + bench
    sh.rect(8120, 4520, 10600, 4960, F); sh.rect(8120, 6200, 9800, 6680, F)
    # pantry shelves
    sh.rect(8120, 6920, 10880, 7280, F); sh.rect(10520, 6920, 10880, 8280, F)
    # living: sofa, armchairs, coffee table, prayer corner
    sh.rect(800, 11300, 4200, 12200, F); sh.rect(800, 11300, 1600, 12200, F)
    sh.rect(1600, 9400, 3600, 10500, F)
    sh.rect(4300, 9300, 5200, 10200, F); sh.rect(4300, 10500, 5200, 11400, F)
    sh.rect(300, 6950, 2100, 8650, "ABOVE", "DASHED")
    sh.rect(700, 7250, 1500, 8350, F)
    sh.text((1200, 6950 + sh.p(1.6)), "PRAYER CORNER", 1.5, align="BC", cls="bp-note")
    # kitchen: run on the right wall with hood alcove, island, dining table for six
    sh.rect(10150, 10300, 10750, 12700, F); sh.rect(10150, 11000, 10750, 11900, "ABOVE", "DASHED")
    sh.circle((10450, 11200), 140, F); sh.circle((10450, 11700), 140, F)
    sh.rect(8200, 9900, 9200, 12100, F)
    sh.rect(6100, 9500, 7100, 11700, F)
    for y in (9900, 10600, 11300):
        sh.rect(5750, y - 200, 6050, y + 200, F); sh.rect(7150, y - 200, 7450, y + 200, F)
    # terrace: outdoor table + BBQ counter
    sh.rect(900, 14000, 3500, 15000, F)
    sh.rect(9900, 13300, 10600, 15300, F)
    sh.text((10250, 15500), "BBQ", 1.5, align="BC", cls="bp-note")
    # garage: two cars side by side (Civic Type R 1.89 m, GT-R 1.90 m wide), the Ducati across the
    # back wall, storage in both back corners
    for x in (11600, 14300):
        sh.rect(x, 800, x + 1900, 5400, F)
        sh.rect(x + 150, 2300, x + 1750, 4000, F)  # glasshouse
    sh.rect(13100, 6550, 15200, 7350, F); sh.circle((13450, 6950), 300, F); sh.circle((14850, 6950), 300, F)
    sh.rect(11300, 6400, 12700, 7700, F)
    sh.rect(15700, 6200, 16700, 7700, F)
    # laundry yard: washer, dryer, sink, drying lines
    for x in (11300, 12000):
        sh.rect(x, 12000, x + 600, 12700, F); sh.circle((x + 300, 12350), 220, F)
    sh.rect(12800, 12100, 13700, 12700, F)
    for x in (14500, 15200, 15900, 16500):
        sh.line((x, 8700), (x, 11400), "ABOVE", "DASHED")
    sh.rect(11000, 8000, 16800, 12800, "ABOVE", "DASHED")
    sh.text((13650, 8300), "PERGOLA OVER", 1.4, align="BC", cls="bp-note")


def furniture_upper(sh: Sheet):
    F = "FURN"
    # back balcony: flowering timber pergola over (beams dashed, as everything overhead)
    sh.rect(150, 13150, 10850, 15850, "ABOVE", "DASHED")
    for x in range(1250, 10850, 1100):
        sh.line((x, 13150), (x, 15850), "ABOVE", "DASHED")
    sh.text((5500, 15400), "FLOWERING PERGOLA OVER", 1.6, align="BC", cls="bp-note")
    # ensuite: freestanding tub under the arched window, shower, double vanity, WC
    from shapely.geometry import Point as Pt
    from shapely.affinity import scale as sc
    tub = sc(Pt(2600, 950).buffer(1), 850, 400)
    sh.poly(list(tub.exterior.coords)[:-1], F)
    sh.poly(list(sc(Pt(2600, 950).buffer(1), 720, 290).exterior.coords)[:-1], F)
    sh.rect(4200, 260, 5540, 1600, F); sh.line((4200, 1600), (5540, 260), F)
    sh.rect(500, 2500, 3200, 3140, F); sh.circle((1200, 2820), 200, F); sh.circle((2500, 2820), 200, F)
    sh.rect(3500, 2450, 3880, 3140, F)
    # walk-in closet: hanging + shelves + island
    sh.rect(260, 3260, 860, 6740, F); sh.rect(860, 3260, 4140, 3860, F); sh.rect(860, 6140, 4140, 6740, F)
    sh.rect(1900, 4300, 3100, 5000, F)
    # master bedroom: king bed, nightstands, seating
    sh.rect(250, 9000, 2350, 11000, F); sh.rect(250, 9000, 750, 11000, F)
    sh.rect(250, 8450, 700, 8900, F); sh.rect(250, 11100, 700, 11550, F)
    sh.rect(6100, 10000, 7000, 10900, F); sh.rect(6100, 11400, 7000, 12300, F); sh.circle((7450, 11150), 300, F)
    # work room: sit-stand desk facing the balcony, chair, shelves, reading chair
    sh.rect(8700, 1100, 10500, 1900, F); sh.circle((9600, 2500), 320, F)
    sh.rect(8120, 4800, 8520, 9600, F)
    sh.rect(9800, 10400, 10600, 11200, F); sh.circle((9300, 10800), 280, F)
    # linen shelves
    sh.rect(5720, 7920, 6100, 8880, F)
    # balconies: balustrades
    sh.line((0, 15900), (11000, 15900), F); sh.line((0, 16000), (11000, 16000), F)
    sh.poly([(8250, 0), (8250, -1300), (10750, -1300), (10750, 0)], F, closed=False)
    sh.poly([(8350, 0), (8350, -1200), (10650, -1200), (10650, 0)], F, closed=False)
    for x in (0, 2750, 5500, 8250, 11000):
        x0, x1 = max(0, x - 200), min(M.HOUSE_W, x + 200)
        sh.rect(x0, 15600, x1, 16000, "ABOVE", "DASHED")
    # garage roof below (hip roof outline)
    gx0, gy0, gx1, gy1 = 11000, -400, 16900, 8400
    sh.rect(gx0, gy0, gx1, gy1, "ABOVE")
    ridge_y0, ridge_y1 = gy0 + (gx1 - gx0) / 2, gy1 - (gx1 - gx0) / 2
    xm = (gx0 + gx1) / 2
    sh.line((xm, ridge_y0), (xm, ridge_y1), "ABOVE")
    for (x, y), (rx, ry) in [((gx0, gy0), (xm, ridge_y0)), ((gx1, gy0), (xm, ridge_y0)),
                             ((gx0, gy1), (xm, ridge_y1)), ((gx1, gy1), (xm, ridge_y1))]:
        sh.line((x, y), (rx, ry), "ABOVE")
    sh.text((xm, 4000), "GARAGE ROOF", 1.6, cls="bp-note")
    sh.text((xm, 4000 - sh.p(3)), "BELOW", 1.6, cls="bp-note")


def grid_and_marks(sh: Sheet, cols, rows, top_y, left_x, extent):
    xmin, ymin, xmax, ymax = extent
    for i, x in enumerate(cols):
        sh.line((x, ymax + 300), (x, top_y - 450), "GRID", "CENTER")
        sh.circle((x, top_y), 450, "GRID")
        sh.text((x, top_y), "ABCDEFG"[i], 2.2)
    for i, y in enumerate(rows):
        sh.line((xmin - 300, y), (left_x + 450, y), "GRID", "CENTER")
        sh.circle((left_x, y), 450, "GRID")
        sh.text((left_x, y), str(i + 1), 2.2)


def section_mark(sh: Sheet, x, y_lo, y_hi, letter="A"):
    for y, sgn in ((y_lo, -1), (y_hi, 1)):
        sh.line((x, y), (x, y + sgn * 900), "GRID", "PHANTOM")
        cy = y + sgn * 1500
        sh.circle((x, cy), 550, "GRID")
        sh.text((x, cy), letter, 2.4)
        # arrow pointing in the viewing direction (-x)
        sh.poly([(x - 550, cy + 380), (x - 1000, cy), (x - 550, cy - 380)], "GRID")


def scale_bar(sh: Sheet, at, metres, step):
    x, y = at
    seg = step * 1000
    for i in range(int(metres / step)):
        sh.rect(x + i * seg, y, x + (i + 1) * seg, y + sh.p(1.6), "TEXT")
        if i % 2 == 0:
            sh.hatch(box(x + i * seg, y, x + (i + 1) * seg, y + sh.p(1.6)), "SOLID", layer="FRAME")
    for i in range(int(metres / step) + 1):
        sh.text((x + i * seg, y - sh.p(1.6)), str(i * step), 1.6, align="TC")
    sh.text((x + metres * 1000 + sh.p(3), y + sh.p(0.8)), "m", 1.6, align="ML")


def north_arrow(sh: Sheet, c, r_mm=7, rot=0):
    r = sh.p(r_mm)
    sh.circle(c, r, "TEXT")
    a = math.radians(90 + rot)
    tip = (c[0] + r * 0.85 * math.cos(a), c[1] + r * 0.85 * math.sin(a))
    l = (c[0] + r * 0.45 * math.cos(a + 2.5), c[1] + r * 0.45 * math.sin(a + 2.5))
    rr = (c[0] + r * 0.45 * math.cos(a - 2.5), c[1] + r * 0.45 * math.sin(a - 2.5))
    sh.poly([tip, l, c, rr], "TEXT")
    sh.hatch(Polygon([tip, l, c]), "SOLID", layer="FRAME")
    lab = (c[0] + r * 1.35 * math.cos(a), c[1] + r * 1.35 * math.sin(a))
    sh.text(lab, "PLAN N", 1.6)


def frame_side(sh: Sheet, notes):
    """A3 frame with a title column on the right (for 1:100 plans)."""
    P = lambda mx, my: (sh.origin[0] + sh.p(mx), sh.origin[1] + sh.p(my))
    sh.poly([P(10, 10), P(410, 10), P(410, 287), P(10, 287)], "FRAME")
    sh.line(P(330, 10), P(330, 287), "FRAME")
    x0 = 334
    sh.text(P(x0, 279), PROJECT, 4.2, align="TL", cls="bp-title")
    sh.text(P(x0, 271), "Private residence above a cove", 2.0, align="TL", cls="bp-note")
    sh.text(P(x0, 266.5), "Indonesia", 2.0, align="TL", cls="bp-note")
    sh.line(P(330, 260), P(410, 260), "FRAME")
    y = 252
    for n in notes:
        sh.text(P(x0, y), n, 1.8, align="TL", cls="bp-note")
        y -= 5
    north_arrow(sh, P(370, 88))
    scale_bar(sh, P(x0 + 2, 66), 5, 1)
    sh.line(P(330, 56), P(410, 56), "FRAME")
    rows = [("SHEET", sh.title), ("NO.", sh.number), ("SCALE", f"1:{sh.scale} @ A3"), ("DATE", DATE), ("DRAWN", DRAWN)]
    y = 50
    for k, v in rows:
        sh.text(P(x0, y), k, 1.5, align="TL", cls="bp-note")
        sh.text(P(x0 + 14, y), v, 2.0, align="TL", cls="bp-value")
        y -= 8
    sh.line(P(330, 12 + 0), P(410, 12), "FRAME")


def frame_bottom(sh: Sheet, notes):
    """A3 frame with a title strip along the bottom (for 1:200 site + section)."""
    P = lambda mx, my: (sh.origin[0] + sh.p(mx), sh.origin[1] + sh.p(my))
    sh.poly([P(10, 10), P(410, 10), P(410, 287), P(10, 287)], "FRAME")
    sh.line(P(10, 52), P(410, 52), "FRAME")
    sh.line(P(120, 10), P(120, 52), "FRAME")
    sh.line(P(300, 10), P(300, 52), "FRAME")
    sh.text(P(15, 46), PROJECT, 4.2, align="TL", cls="bp-title")
    sh.text(P(15, 38), "Private residence above a cove", 2.0, align="TL", cls="bp-note")
    sh.text(P(15, 33.5), "Indonesia", 2.0, align="TL", cls="bp-note")
    scale_bar(sh, P(16, 18), 20, 5)
    y = 46
    for n in notes:
        sh.text(P(125, y), n, 1.8, align="TL", cls="bp-note")
        y -= 5
    rows = [("SHEET", sh.title), ("NO.", sh.number), ("SCALE", f"1:{sh.scale} @ A3"), ("DATE", DATE), ("DRAWN", DRAWN)]
    y = 46
    for k, v in rows:
        sh.text(P(305, y), k, 1.5, align="TL", cls="bp-note")
        sh.text(P(320, y), v, 2.0, align="TL", cls="bp-value")
        y -= 7.5


# ----------------------------------------------------------------------------- plans
def plan_sheet(slug, title, number, upper=False):
    sh = Sheet(slug, title, number, 100, (420, 297), (-10150, -8250))
    walls, solid = (M.upper_walls() if upper else M.ground_walls())
    openings = M.UF_OPENINGS if upper else M.GF_OPENINGS
    rooms = M.UF_ROOMS if upper else M.GF_ROOMS

    if upper:
        # balcony slabs as thin outlines
        sh.rect(0, 13000, 11000, 16000, "OPEN")
        sh.rect(8250, -1300, 10750, 0, "OPEN")
    else:
        sh.rect(0, 13000, 11000, 16000, "OPEN")
        # front steps
        for i, y in enumerate((-300, -600, -900)):
            sh.line((6900 - i * 150, y), (9700 + i * 150, y), "OPEN")
        sh.poly([(6600, 0), (6600, -900), (10000, -900), (10000, 0)], "OPEN", closed=False)
    walls_with_poche(sh, walls)
    opening_symbols(sh, openings)
    stair(sh, upper)
    (furniture_upper if upper else furniture_ground)(sh)
    meta = room_tags(sh, rooms, solid)

    # dimension chains
    if upper:
        front_pts = [0, 1600, 3600, 5600, 6300, 7300, 8000, 8400, 10000, 11000]
        left_pts = [0, 900, 2300, 3200, 4600, 5800, 6800, 7400, 8400, 11600, 12400, 13000, 16000]
        rooms_x = [0, 5600, 8000, 11000]
        rooms_y = [0, 3200, 6800, 13000, 16000]
        ylo = -1300
    else:
        front_pts = [0, 1300, 2900, 4900, 5900, 7550, 9550, 10000, 10600, 11000, 11500, 16500, 17000]
        left_pts = [0, 1300, 3100, 4400, 5000, 6200, 6800, 7600, 8600, 10200, 11800, 13000, 16000]
        rooms_x = [0, 4200, 6600, 11000, 17000]
        rooms_y = [0, 4400, 6800, 13000, 16000]
        ylo = -900
    for a, b in zip(front_pts, front_pts[1:]):
        sh.dim((a, ylo), (b, ylo), -1200)
    for a, b in zip(rooms_x, rooms_x[1:]):
        sh.dim((a, ylo), (b, ylo), -2300)
    sh.dim((0, ylo), (rooms_x[-1], ylo), -3400)
    for a, b in zip(left_pts, left_pts[1:]):
        sh.dim((0, a), (0, b), -1200)
    for a, b in zip(rooms_y, rooms_y[1:]):
        sh.dim((0, a), (0, b), -2300)
    sh.dim((0, 0), (0, 16000), -3400)
    if not upper:
        for a, b in ((0, 8000), (8000, 13000)):
            sh.dim((17000, a), (17000, b), 1200)

    grid_and_marks(sh, [0, 4200, 5600, 8000, 11000], [0, 4400, 6800, 13000], 19800, -4900,
                   (0, 0, 11000, 16000))
    section_mark(sh, M.SECTION_X_HOUSE, ylo - 4000, 16600)

    lv = "+0.45" if not upper else "+3.85"
    sh.text((2100, 17300), f"FFL {lv}", 1.8, cls="bp-note")
    notes = [
        "All dimensions in millimetres.",
        "Exterior walls 250, interior 120.",
        "Levels relative to garden ±0.00.",
        f"Floor level {lv}.",
        "Section A-A: sheet A-04.",
        "Arched heads shown dashed.",
    ]
    frame_side(sh, notes)
    return sh, meta


# ----------------------------------------------------------------------------- site
def site_sheet():
    sh = Sheet("site", "SITE PLAN", "A-01", 200, (420, 297), (0, 0))
    # rotate: road on the left, sea on the right. sheet X = site y, sheet Y = 20000 - site x
    OX, OY = 9_000, 21_000           # model offset so the plot sits inside the frame
    R = lambda x, y: (OX + y, OY + (M.PLOT_W - x))
    Rp = lambda pts: [R(*p) for p in pts]

    def rbox(x0, y0, x1, y1):
        return Polygon(Rp([(x0, y0), (x1, y0), (x1, y1), (x0, y1)]))

    # road
    sh.line(R(-500, -800), R(20500, -800), "SITE")
    sh.line(R(-500, -7800), R(20500, -7800), "SITE")
    sh.line(R(-500, -4300), R(20500, -4300), "SITE", "DASHED")
    sh.text(R(10000, -6000), "ROAD", 2.4, rot=90)
    # property line
    sh.poly(Rp([(0, 0), (M.PLOT_W, 0), (M.PLOT_W, M.PLOT_D), (0, M.PLOT_D)]), "SITE", True, "PHANTOM")
    # stone wall (outside) and hedge (inside), with gate gaps
    gates = {0: M.FRONT_GATE, M.PLOT_D: M.BACK_GATE}
    outer = box(-M.STONE_T, -M.STONE_T, M.PLOT_W + M.STONE_T, M.PLOT_D + M.STONE_T).difference(box(0, 0, M.PLOT_W, M.PLOT_D))
    hedge = box(0, 0, M.PLOT_W, M.PLOT_D).difference(box(M.HEDGE_T, M.HEDGE_T, M.PLOT_W - M.HEDGE_T, M.PLOT_D - M.HEDGE_T))
    px0, px1 = M.BACK_PORTAL
    py0, py1 = M.PLOT_D - M.PORTAL_T / 2, M.PLOT_D + M.PORTAL_T / 2
    gaps = unary_union([box(M.FRONT_GATE[0], -M.STONE_T - 10, M.FRONT_GATE[1], M.HEDGE_T + 10),
                        box(px0, M.PLOT_D - M.HEDGE_T - 10, px1, M.PLOT_D + M.STONE_T + 10)])
    from shapely.affinity import affine_transform
    T = lambda g: affine_transform(g, [0, 1, -1, 0, OX, OY + M.PLOT_W])
    sw = T(outer.difference(gaps)); hg = T(hedge.difference(gaps))
    sh.hatch(sw, "ANSI37", 1.2); sh.outline(sw, "WALL")
    sh.hatch(hg, "DOTS", 0.9, layer="PLANT"); sh.outline(hg, "PLANT")

    def leaf(hx_, yy, w, dirx, sgn):
        tip = (hx_, yy + sgn * w)
        sh.line(R(hx_, yy), R(*tip), "OPEN")
        c = R(hx_, yy)
        ang = lambda p: math.degrees(math.atan2(p[1] - c[1], p[0] - c[0]))
        a0, a1 = ang(R(hx_ + dirx * w, yy)), ang(R(*tip))
        if (a1 - a0) % 360 > 180:
            a0, a1 = a1, a0
        sh.arc(c, w, a0, a1, "OPEN")

    # front gate: two solid leaves swinging inward between limestone pillars
    gx0, gx1 = M.FRONT_GATE
    for px in (gx0 - 600, gx1):
        p = T(box(px, -M.STONE_T, px + 600, M.HEDGE_T))
        sh.hatch(p, "ANSI31", 0.6); sh.outline(p, "WALL")
    w = (gx1 - gx0) / 2
    leaf(gx0, 0, w, 1, 1)
    leaf(gx1, 0, w, -1, 1)
    # back gate: arched plaster portal wall (crown 4.0 m) with one solid arched door, opening inward
    dx0, dx1 = M.BACK_GATE
    portal = T(box(px0, py0, px1, py1).difference(box(dx0, py0 - 10, dx1, py1 + 10)))
    sh.hatch(portal, "ANSI31", 0.6); sh.outline(portal, "WALL")
    leaf(dx0, py0, dx1 - dx0, 1, -1)
    sh.text(R((px0 + px1) / 2 - 2600, M.PLOT_D - 2600), "ARCHED PORTAL", 1.8, cls="bp-note")
    # house roof plan (hipped, 1000 eaves), garage hip roof, laundry pergola, terrace/balcony
    hx0, hy0 = M.HOUSE_ORIGIN
    rx0, ry0, rx1, ry1 = hx0 - M.EAVE, hy0 - M.EAVE, hx0 + M.HOUSE_W + M.EAVE, hy0 + M.HOUSE_D + M.EAVE
    roof = rbox(rx0, ry0, rx1, ry1)
    sh.outline(roof, "WALL")
    half = (rx1 - rx0) / 2
    r0, r1 = (ry0 + half, ry1 - half)
    xm = (rx0 + rx1) / 2
    sh.line(R(xm, r0), R(xm, r1), "OPEN")
    for (x, y), ry in (((rx0, ry0), r0), ((rx1, ry0), r0), ((rx0, ry1), r1), ((rx1, ry1), r1)):
        sh.line(R(x, y), R(xm, ry), "OPEN")
    wall_line = rbox(hx0, hy0, hx0 + M.HOUSE_W, hy0 + M.HOUSE_D)
    sh.outline(wall_line, "ABOVE", "HIDDEN")
    g = M.GARAGE
    gx0, gy0, gx1, gy1 = hx0 + g[0], hy0 + g[1] - 400, hx0 + g[2] + 400, hy0 + g[3] + 400
    sh.outline(rbox(gx0, gy0, gx1, gy1), "WALL")
    gm = (gx0 + gx1) / 2
    gr0, gr1 = gy0 + (gx1 - gx0) / 2, gy1 - (gx1 - gx0) / 2
    sh.line(R(gm, gr0), R(gm, gr1), "OPEN")
    for (x, y), ry in (((gx0, gy0), gr0), ((gx1, gy0), gr0), ((gx0, gy1), gr1), ((gx1, gy1), gr1)):
        sh.line(R(x, y), R(gm, ry), "OPEN")
    lx0, ly0, lx1, ly1 = hx0 + M.LAUNDRY[0], hy0 + M.LAUNDRY[1], hx0 + M.LAUNDRY[2], hy0 + M.LAUNDRY[3]
    sh.outline(rbox(lx0, ly0 + 400, lx1, ly1), "SITE")
    for i in range(1, 8):
        x = lx0 + i * (lx1 - lx0) / 8
        sh.line(R(x, ly0 + 400), R(x, ly1), "SITE")
    tx0, ty0, tx1, ty1 = hx0, hy0 + M.HOUSE_D + M.EAVE, hx0 + M.HOUSE_W, hy0 + 16_000
    sh.outline(rbox(tx0, ty0, tx1, ty1), "OPEN")
    sh.text(R((tx0 + tx1) / 2, (ty0 + ty1) / 2), "TERRACE + BALCONY", 2.0, cls="bp-note")
    sh.text(R(xm - 2600, hy0 + 4200), "HOUSE", 3.0, cls="bp-room-name")
    sh.text(R(xm - 1000, hy0 + 4200), "2 FLOORS, RIDGE +9.47", 2.0, cls="bp-note")
    sh.text(R(gm + 1400, hy0 + 2600), "GARAGE", 2.6, cls="bp-room-name")
    sh.text(R((lx0 + lx1) / 2, ly1 + 2600), "LAUNDRY YARD", 2.0, cls="bp-note")
    # driveway (site plan v6): it takes the whole gate and sweeps across to the straight run up the
    # right side, so cars never cross a planted bed; the front walk stops at the driveway's edge
    # driveway (site plan v7): a 5 m two-car lane that enters through the gate and makes one smooth
    # S into the straight run in front of the 5 m garage door; the front walk stops at its edge
    from shapely.geometry import LineString
    gc = M.HOUSE_ORIGIN[0] + (M.GARAGE[0] + M.GARAGE[2]) / 2          # garage centre, site x
    p0, p1, p2, p3 = (sum(M.FRONT_GATE) / 2, 0), (sum(M.FRONT_GATE) / 2, 4800), (gc, 4200), (gc, 9800)
    s_curve = [((1 - u) ** 3 * p0[0] + 3 * (1 - u) ** 2 * u * p1[0] + 3 * (1 - u) * u ** 2 * p2[0] + u ** 3 * p3[0],
                (1 - u) ** 3 * p0[1] + 3 * (1 - u) ** 2 * u * p1[1] + 3 * (1 - u) * u ** 2 * p2[1] + u ** 3 * p3[1])
               for u in (i / 48 for i in range(49))]
    centre = LineString([(p0[0], -400)] + s_curve + [(gc, hy0)])
    drive = centre.buffer(2500, cap_style=2, join_style=1).intersection(box(M.HEDGE_T, -10, M.PLOT_W - M.HEDGE_T, hy0))
    dr = T(drive)
    sh.hatch(dr, "DOTS", 1.4, layer="SITE"); sh.outline(dr, "SITE")
    # front walk: stepping stones + lavender, from the front door down to the driveway edge
    walk_from = next(y for y in range(0, 20000, 100) if not drive.intersects(box(9150, y, 10850, y + 100))) + 200
    for y in range(int(walk_from), 20700, 800):
        sh.rect(*R(9550, y), *R(10450, y + 500), "SITE")
    for x in (9150, 10850):
        for y in range(int(walk_from) + 100, 20600, 600):
            sh.circle(R(x, y), 220, "PLANT")
    # columnar thuja either side of the straight run only (clear of the S)
    for x in (gc - 3000, gc + 3000):
        for y in range(11500, 19600, 2500):
            sh.circle(R(x, y), 450, "PLANT"); sh.circle(R(x, y), 150, "PLANT")
    # picnic tree: irregular canopy
    cx, cy, rr = 5200, 9500, 2800
    canopy = [(cx + (rr + (200 if i % 2 else -150)) * math.cos(i * math.pi / 9), cy + (rr + (200 if i % 2 else -150)) * math.sin(i * math.pi / 9)) for i in range(18)]
    sh.poly(Rp(canopy), "PLANT"); sh.circle(R(cx, cy), 250, "PLANT")
    sh.text(R(cx, cy - 4200), "PICNIC TREE", 2.0, cls="bp-note")
    sh.text(R(4600, 15800), "FRONT LAWN", 2.8, cls="bp-room-name")
    # backyard path, lavender, foot rinse
    for y in range(37600, 48900, 800):
        sh.rect(*R(6500, y), *R(7900, y + 500), "SITE")
    for x in (6100, 8300):
        for y in range(37600, 48800, 600):
            sh.circle(R(x, y), 220, "PLANT")
    sh.circle(R(9300, 37800), 300, "OPEN")
    sh.text(R(9300, 37800 + 900), "FOOT RINSE", 1.8, align="BL", rot=0, cls="bp-note")
    sh.text(R(14000, 43500), "BACKYARD", 2.8, cls="bp-room-name")
    # bluff edge, cliff face, stairs, beach, sea
    edge = [(-3000, 50700), (1000, 50650), (4000, 50800), (8000, 50600), (12000, 50750), (16000, 50650), (20000, 50700), (23000, 50600)]
    toe = [(-3000, 55600), (1500, 55400), (6000, 55700), (11000, 55300), (15000, 55600), (20000, 55400), (23000, 55500)]
    sh.poly(Rp(edge), "GROUND", closed=False)
    sh.poly(Rp(toe), "SITE", closed=False)
    face = Polygon(Rp(edge + toe[::-1]))
    stairs = [
        ("land", (M.BACK_PORTAL[0], 50400, M.BACK_PORTAL[1], 51600)),
        ("flight", (1800, 51600, 6000, 52800), -1),
        ("land", (600, 51600, 1800, 54000)),
        ("flight", (1800, 52800, 6000, 54000), 1),
        ("land", (6000, 52800, 7200, 55200)),
        ("flight", (1800, 54000, 6000, 55200), -1),
    ]
    stair_geom = unary_union([box(*s[1]) for s in stairs])
    sg = T(stair_geom)
    sh.hatch(face.difference(sg.buffer(150)), "ANSI31", 2.4, layer="HATCH")
    from shapely.geometry import Polygon as _P
    sh.outline(sg, "WALL")
    for s in stairs:
        if s[0] == "flight":
            x0, y0, x1, y1 = s[1]
            for i in range(1, 12):
                x = x0 + i * (x1 - x0) / 12
                sh.line(R(x, y0), R(x, y1), "OPEN")
    sh.text(R(4000, 56200), "STONE STAIRS · 36 RISERS · 6.00 m", 1.4, cls="bp-note")
    shore = [(-3000, 61000), (2000, 60600), (7000, 61300), (12000, 60800), (17000, 61200), (23000, 60900)]
    sh.poly(Rp(shore), "SITE", closed=False)
    sand = Polygon(Rp(toe + shore[::-1]))
    sh.hatch(sand, "DOTS", 1.8, layer="SITE")
    for k in range(1, 4):
        wave = [(x, y + k * 1600) for x, y in shore]
        sh.poly(Rp(wave), "SITE", closed=False, lt="DASHED")
    sh.text(R(10000, 58500), "PRIVATE COVE BEACH −6.00", 2.0, cls="bp-room-name")
    sh.text(R(10000, 65500), "SEA", 2.4, cls="bp-room-name")
    sh.text(R(10000, 52900), "", 1)
    # dimensions (in rotated space we dimension along sheet axes)
    sh.dim(R(0, 0), R(0, M.PLOT_D), sh.p(8))
    sh.dim(R(0, 0), R(0, 21000), sh.p(4))
    sh.dim(R(0, 21000), R(0, 34000), sh.p(4))
    sh.dim(R(0, 34000), R(0, 37000), sh.p(4))
    sh.dim(R(0, 37000), R(0, M.PLOT_D), sh.p(4))
    sh.dim(R(M.PLOT_W, 0), R(0, 0), -sh.p(8))
    north_arrow(sh, (OX + 57_000, OY + 30_000), 7, rot=-90)
    # section cut A-A along site x = 10700
    sx = M.HOUSE_ORIGIN[0] + M.SECTION_X_HOUSE
    a, b = R(sx, -9000), R(sx, 63000)
    for p, sgn in ((a, -1), (b, 1)):
        sh.line(p, (p[0] - sgn * 1500, p[1]), "GRID", "PHANTOM")
        c = (p[0] + sgn * 900, p[1])
        sh.circle(c, 800, "GRID"); sh.text(c, "A", 2.4)
        sh.poly([(c[0] - 550, c[1] + 600), (c[0], c[1] + 1500), (c[0] + 550, c[1] + 600)], "GRID")
    notes = ["Plot 20 × 50 m = 1,000 m².", "Hedge 3.0 m high, stone wall 1.2 m outside.",
             "Both gates solid timber, arched, 3.0 m.", "Garden ±0.00, beach −6.00.",
             "Roof plan shown, eaves 1.0 m.", "Section A-A: sheet A-04."]
    frame_bottom(sh, notes)
    return sh


# ----------------------------------------------------------------------------- section
def section_sheet():
    sh = Sheet("section", "SECTION A-A", "A-04", 200, (420, 297), (0, 0))
    OX, OY = 12_000, 36_000
    S = lambda y, z: (OX + y, OY + z)
    Sp = lambda pts: [S(*p) for p in pts]
    hy0 = M.HOUSE_ORIGIN[1]

    # ground profile: road, garden, bluff, beach, sea floor
    ground_top = [(-9000, -150), (-800, -150), (-800, 0), (50_650, 0), (51_100, -1_200), (51_500, -2_600),
                  (52_200, -3_600), (53_100, -4_900), (55_500, -6_000), (60_800, -6_400), (68_000, -8_200)]
    sh.poly(Sp(ground_top), "GROUND", closed=False)
    earth = Polygon(Sp(ground_top + [(68_000, -10_500), (56_000, -9_000), (49_000, -2_500), (-9_000, -2_500)]))
    sh.hatch(earth, "ANSI31", 2.6)
    sh.poly(Sp([(-9_000, -2_500), (49_000, -2_500), (56_000, -9_000), (68_000, -10_500)]), "SITE", closed=False, lt="DASHED")
    # sea
    sh.line(S(60_000, M.LV_SEA), S(70_000, M.LV_SEA), "SITE")
    for k in range(1, 3):
        sh.line(S(61_000 + k * 1500, M.LV_SEA - k * 450), S(70_000, M.LV_SEA - k * 450), "SITE", "DASHED")
    # front stone wall + hedge + gate (cut)
    sh.rect(*S(-400, 0), *S(0, 1200), "WALL"); sh.hatch(Polygon(Sp([(-400, 0), (0, 0), (0, 1200), (-400, 1200)])), "ANSI37", 1.0)
    sh.poly(Sp([(0, 0), (0, 3000), (1000, 3000), (1000, 0)]), "PLANT", closed=False)
    sh.rect(*S(380, 0), *S(560, 3000), "WALL")
    sh.text(S(500, 3700), "GATE 3.0", 1.5, cls="bp-note")
    # front walk + lavender bumps
    for y in range(1500, 19600, 1100):
        sh.arc(S(y, 0), 300, 0, 180, "PLANT")
    # house slab, walls, floors, roof
    gf, f1, slab = M.LV_GF, M.LV_1F, M.LV_SLAB
    y0, y1 = hy0, hy0 + M.HOUSE_D
    slab_g = Polygon(Sp([(y0, gf - 200), (y1, gf - 200), (y1, gf), (y0, gf)]))
    sh.hatch(slab_g, "SOLID"); sh.outline(slab_g, "WALL")
    for i in range(3):
        sh.poly(Sp([(y0 - 900 + i * 300, i * 150), (y0 - 900 + i * 300, (i + 1) * 150), (y0 - 600 + i * 300, (i + 1) * 150)]), "OPEN", closed=False)
    upper = Polygon(Sp([(y0 - 1300, f1 - slab), (y1 + 3000, f1 - slab), (y1 + 3000, f1), (y0 - 1300, f1)]))
    sh.hatch(upper, "SOLID"); sh.outline(upper, "WALL")
    t = M.EXT_T

    def cut_wall(y, z0, z1, thick=t):
        g = Polygon(Sp([(y, z0), (y + thick, z0), (y + thick, z1), (y, z1)]))
        sh.hatch(g, "ANSI31", 0.6); sh.outline(g, "WALL")

    # front wall: door opening on GF (450-3500), balcony door on 1F (3850-6500)
    cut_wall(y0, gf, gf + 0.01)
    cut_wall(y0, gf + 3050, f1 - slab)
    cut_wall(y0, f1 + 2650, M.LV_PLATE)
    # back wall: kitchen door GF, balcony door 1F
    cut_wall(y1 - t, gf + 3050, f1 - slab)
    cut_wall(y1 - t, f1 + 2650, M.LV_PLATE)
    # interior walls cut at y=4400, 6800, 8400 (GF) - partitions to ceiling
    for yy in (4400, 6800):
        cut_wall(y0 + yy - 60, gf, f1 - slab, M.INT_T)
    cut_wall(y0 + 8400 - 60, gf + 2200, f1 - slab, M.INT_T)  # pantry door opening below
    # door/window glass lines in openings
    for y, z0, z1 in ((y0, gf, gf + 3050), (y0, f1, f1 + 2650), (y1 - t, gf, gf + 3050), (y1 - t, f1, f1 + 2650)):
        sh.line(S(y + t / 2, z0), S(y + t / 2, z1), "OPEN")
    # ceiling line 1F + roof
    sh.line(S(y0 + t, M.LV_CEIL_1F), S(y1 - t, M.LV_CEIL_1F), "OPEN")
    pitch = math.tan(math.radians(M.ROOF_PITCH))
    e0, e1 = y0 - M.EAVE, y1 + M.EAVE
    zr = M.LV_PLATE + (M.HOUSE_D / 2) * pitch
    zm = (y0 + y1) / 2
    ze = M.LV_PLATE - M.EAVE * pitch
    roof_top = [(e0, ze + 250), (zm, zr + 250), (e1, ze + 250)]
    roof_bot = [(e0, ze), (zm, zr), (e1, ze)]
    rf = Polygon(Sp(roof_bot + roof_top[::-1]))
    sh.hatch(rf, "ANSI31", 0.6); sh.outline(rf, "WALL")
    sh.line(S(e0, ze), S(e0, ze + 250), "WALL")
    # balconies: front (projecting), back over terrace, balustrades
    sh.rect(*S(y0 - 1300, f1), *S(y0 - 1200, f1 + 1000), "OPEN")
    sh.rect(*S(y1 + 2900, f1), *S(y1 + 3000, f1 + 1000), "OPEN")
    # terrace column beyond + arch (elevation, thin)
    for yy in (y1 + 2600,):
        sh.rect(*S(yy, 300), *S(yy + 400, f1 - slab), "SITE")
    # furniture hint: kitchen island, desk
    sh.rect(*S(y0 + 9900, gf), *S(y0 + 12100, gf + 900), "FURN")
    sh.rect(*S(y0 + 1100, f1 + 720), *S(y0 + 1900, f1 + 760), "FURN")
    sh.line(S(y0 + 1500, f1), S(y0 + 1500, f1 + 720), "FURN")
    # garage beyond (elevation)
    sh.poly(Sp([(y0, gf - 450), (y0, 2900), (y0 + 8000, 2900), (y0 + 8000, gf - 450)]), "SITE", closed=False)
    # back hedge, stone wall, back gate beyond
    sh.poly(Sp([(49_000, 0), (49_000, 3000), (50_000, 3000), (50_000, 0)]), "PLANT", closed=False)
    # arched plaster portal beyond the cut (crown 4.0 m)
    pt = M.PORTAL_T / 2
    sh.poly(Sp([(50_000 - pt, 0), (50_000 - pt, M.PORTAL_CROWN - 300), (50_000 - pt + 120, M.PORTAL_CROWN),
                (50_000 + pt - 120, M.PORTAL_CROWN), (50_000 + pt, M.PORTAL_CROWN - 300), (50_000 + pt, 0)]), "SITE", closed=False)
    sh.text(S(50_000, M.PORTAL_CROWN + 700), "PORTAL 4.0", 1.5, cls="bp-note")
    sh.rect(*S(50_000, 0), *S(50_400, 1200), "WALL")
    sh.hatch(Polygon(Sp([(50_000, 0), (50_400, 0), (50_400, 1200), (50_000, 1200)])), "ANSI37", 1.0)
    # cliff stairs beyond (thin stepped profile)
    steps = []
    z, y = 0, 50_600
    steps.append((y, z))
    for flight in range(3):
        for _ in range(12):
            z -= 6000 / 36
            steps.append((y, z))
            y += 140
            steps.append((y, z))
        y += 600
        steps.append((y, z))
    sh.poly(Sp(steps), "SITE", closed=False)
    # levels
    def level(y, z, label, side=1):
        p = S(y, z)
        sh.poly([(p[0] - 500, p[1] + 500), (p[0], p[1]), (p[0] + 500, p[1] + 500)], "TEXT")
        sh.line((p[0] - 900, p[1]), (p[0] + 2600 * side, p[1]), "TEXT")
        sh.text((p[0] + 2800 * side if side > 0 else p[0] - 2800, p[1] + 200), label, 1.6, align="BL" if side > 0 else "BR", cls="bp-value")
    level(3_000, 0, "±0.00 GARDEN")
    level(y0 - 4000, gf, "+0.45 GF", -1)
    level(y0 - 4000, f1, "+3.85 1F", -1)
    level(y0 - 4000, M.LV_PLATE, "+7.10 EAVES", -1)
    level(zm, zr + 250, "+9.47 RIDGE")
    level(57_000, M.LV_BEACH, "−6.00 BEACH")
    level(64_000, M.LV_SEA, "−6.60 SEA (APPROX.)")
    # labels
    for y, label in ((10_000, "FRONT GARDEN"), (zm, "HOUSE"), (43_500, "BACKYARD")):
        sh.text(S(y, -1300), label, 2.2, cls="bp-room-name")
    sh.text(S(63_000, -4600), "COVE", 2.2, cls="bp-room-name")
    sh.text(S(-5000, 900), "ROAD", 2.0, cls="bp-room-name")
    sh.text(S(y0 + 2200, gf + 1400), "ENTRANCE", 1.4, cls="bp-note")
    sh.text(S(y0 + 5600, gf + 1400), "BOOT ROOM", 1.4, cls="bp-note")
    sh.text(S(y0 + 10800, gf + 1800), "KITCHEN", 1.4, cls="bp-note")
    sh.text(S(zm, f1 + 1800), "WORK ROOM", 1.4, cls="bp-note")
    sh.text(S(y1 + 1500, gf + 1400), "TERRACE", 1.4, cls="bp-note")
    # dimensions
    for a, b in ((0, 21_000), (21_000, 34_000), (34_000, 37_000), (37_000, 50_000)):
        sh.dim(S(a, -2_500), S(b, -2_500), -sh.p(5))
    sh.dim(S(0, -2_500), S(50_000, -2_500), -sh.p(10))
    sh.dim(S(50_400, 0), S(50_400, M.LV_BEACH), -sh.p(4))
    sh.dim(S(1000, 0), S(1000, 3000), sh.p(3))
    notes = ["Cut front to back through the entrance,", "boot room, pantry, kitchen and work room.",
             "Roof pitch 20°, terracotta tiles, eaves 1.0 m.", "Floor to floor 3.40 m.",
             "Bluff 6.00 m: stone stairs, 3 flights of 12.", "Sea level approximate, to survey."]
    frame_bottom(sh, notes)
    return sh


def main():
    DXF_DIR.mkdir(parents=True, exist_ok=True)
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    sheets = []
    site = site_sheet(); sheets.append(site)
    gf, gmeta = plan_sheet("ground", "GROUND FLOOR PLAN", "A-02"); sheets.append(gf)
    uf, umeta = plan_sheet("upper", "UPPER FLOOR PLAN", "A-03", upper=True); sheets.append(uf)
    sec = section_sheet(); sheets.append(sec)
    for sh in sheets:
        dxf = DXF_DIR / f"{sh.number}-{sh.slug}.dxf"
        sh.to_dxf(dxf)
        (SVG_DIR / dxf.name).write_bytes(dxf.read_bytes())  # downloadable copy for the site
        sh.to_svg(SVG_DIR / f"{sh.slug}.svg")
        print("wrote", sh.number, sh.slug, len(sh.items), "items")
    DATA.write_text(json.dumps({"ground": gmeta, "upper": umeta}, indent=2), encoding="utf8")


if __name__ == "__main__":
    main()
