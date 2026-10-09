"""Cove House: the single measured model every drawing is built from.

Units are millimetres. Site origin is the front-left corner of the plot (road side);
+x runs to the right when standing at the road facing the sea, +y runs toward the sea.
House coordinates use the house's own front-left outer corner as origin.
"""
from shapely.geometry import box, Polygon
from shapely.ops import unary_union

# --- site ---------------------------------------------------------------------
PLOT_W, PLOT_D = 20_000, 50_000
HOUSE_ORIGIN = (1_450, 21_000)          # house front-left corner in site coords (garage centre stays at site x 15 450)
HOUSE_W, HOUSE_D = 11_000, 13_000
EXT_T, INT_T = 250, 120                  # wall thicknesses
GARAGE = (11_000, 0, 17_000, 8_000)      # house coords; 6.0 m wide for two cars and a motorbike (round 3)
LAUNDRY = (11_000, 8_000, 17_000, 13_000)
TERRACE = (0, 13_000, 11_000, 16_000)
# round 10: a third bedroom where the workout was (its back wall moved 600 mm into the living room),
# the upper work room split in half (workout at the back), and a wider front balcony centred on the
# front door with the same pillar + cable flower canopy as the back balcony
BED3_Y1 = 7_400
WORK_SPLIT = 6_500
FRONT_BALCONY = (6_550, -1_500, 10_550, 0)
HEDGE_T, STONE_T = 1_000, 400
FRONT_GATE = (6_800, 13_200)             # site x range
BACK_GATE = (6_500, 7_900)               # single solid arched door, 1.4 m, on the beach-path axis
BACK_PORTAL = (5_600, 8_800)             # arched plaster portal wall in the back hedge (site plan v5)
PORTAL_T = 600
PORTAL_CROWN = 4_000
BLUFF = 6_000                            # garden to beach, mm
BORDER_ROSE, BORDER_LAVENDER = 700, 700  # flower border inside the hedge: hedge > roses > lavender (round 10)

# levels (mm above garden level)
LV_GARDEN, LV_GF, LV_1F = 0, 450, 3_850
LV_SLAB = 200
LV_CEIL_1F = 6_850
LV_PLATE = 7_100
ROOF_PITCH = 20                          # degrees
EAVE = 1_000
LV_BEACH, LV_SEA = -6_000, -6_600

# section cut A-A runs front-to-back at house x = 9_000 (site x = 10_700)
SECTION_X_HOUSE = 9_000


def hx(x):
    return HOUSE_ORIGIN[0] + x


def hy(y):
    return HOUSE_ORIGIN[1] + y


# --- wall helpers ---------------------------------------------------------------
def wall(x0, y0, x1, y1, t=INT_T):
    """Interior wall on a centreline (axis-aligned)."""
    h = t / 2
    if x0 == x1:
        return box(x0 - h, min(y0, y1) - h, x0 + h, max(y0, y1) + h)
    return box(min(x0, x1) - h, y0 - h, max(x0, x1) + h, y0 + h)


def ring(x0, y0, x1, y1, t=EXT_T):
    return box(x0, y0, x1, y1).difference(box(x0 + t, y0 + t, x1 - t, y1 - t))


def cut(axis, c, s, e, t=EXT_T, exterior_side=None):
    """Opening box through a wall. axis='x' means a wall running along x at y=c."""
    pad = 20
    if exterior_side is not None:
        lo, hi = (c - pad, c + t + pad) if exterior_side == "min" else (c - t - pad, c + pad)
    else:
        lo, hi = c - t / 2 - pad, c + t / 2 + pad
    return box(s, lo, e, hi) if axis == "x" else box(lo, s, hi, e)


# Openings are described once and reused by the wall subtraction and the symbols.
# kind: window | door | double | arch | garage
# For axis 'x' the wall lies along x at coordinate c (a y value); for 'y' along y at x=c.
# swing: +1 opens toward increasing coordinate, -1 toward decreasing.

GF_OPENINGS = [
    # front facade (y = 0)
    dict(kind="window", axis="x", c=0, s=1300, e=2900, ext="min"),
    dict(kind="window", axis="x", c=0, s=4900, e=5900, ext="min"),
    dict(kind="double", axis="x", c=0, s=7550, e=9550, ext="min", swing=1),   # on the plot centreline (site x 10 000)
    dict(kind="window", axis="x", c=0, s=10000, e=10600, ext="min"),
    # left facade (x = 0)
    dict(kind="window", axis="y", c=0, s=1300, e=3100, ext="min"),
    dict(kind="window", axis="y", c=0, s=5000, e=6200, ext="min"),
    dict(kind="window", axis="y", c=0, s=7600, e=8600, ext="min"),
    dict(kind="window", axis="y", c=0, s=10200, e=11800, ext="min"),
    # back facade (y = 13000) to the terrace
    dict(kind="double", axis="x", c=13000, s=900, e=2300, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=3100, e=4500, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=6300, e=7700, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=8700, e=10100, ext="max", swing=1),
    # right facade (x = 11000): boot room to garage, kitchen to laundry yard
    dict(kind="door", axis="y", c=11000, s=5300, e=6100, ext="max", swing=-1, hinge="e"),
    dict(kind="door", axis="y", c=11000, s=9000, e=9800, ext="max", swing=1, hinge="s"),
    # interior
    dict(kind="door", axis="y", c=4200, s=3000, e=3900, swing=-1, hinge="e"),
    dict(kind="door", axis="y", c=4200, s=5300, e=6100, swing=-1, hinge="s"),
    dict(kind="door", axis="x", c=2600, s=4700, e=5500, swing=-1, hinge="s"),
    dict(kind="door", axis="x", c=4400, s=9100, e=9900, swing=1, hinge="e"),
    dict(kind="door", axis="x", c=8400, s=8400, e=9200, swing=-1, hinge="s"),
    dict(kind="arch", axis="y", c=5600, s=8400, e=12400),
    # garage + laundry yard
    dict(kind="garage", axis="x", c=0, s=11500, e=16500, ext="min", t=200),   # 5.0 m two-car door
    dict(kind="arch", axis="x", c=13000, s=13500, e=14500, ext="max", t=200),
]

UF_OPENINGS = [
    dict(kind="window", axis="x", c=0, s=1600, e=3600, ext="min"),
    dict(kind="window", axis="x", c=0, s=6300, e=7300, ext="min"),
    dict(kind="double", axis="x", c=0, s=8400, e=10000, ext="min", swing=1),
    dict(kind="window", axis="y", c=0, s=900, e=2300, ext="min"),
    dict(kind="window", axis="y", c=0, s=4600, e=5800, ext="min"),
    dict(kind="window", axis="y", c=0, s=7400, e=8400, ext="min"),
    dict(kind="window", axis="y", c=0, s=11600, e=12400, ext="min"),
    dict(kind="double", axis="x", c=13000, s=1200, e=2600, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=3400, e=4800, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=6200, e=7400, ext="max", swing=1),
    dict(kind="double", axis="x", c=13000, s=8400, e=10000, ext="max", swing=1),
    dict(kind="window", axis="y", c=11000, s=4200, e=5600, ext="max"),
    dict(kind="window", axis="y", c=11000, s=7800, e=9200, ext="max"),
    dict(kind="window", axis="y", c=11000, s=10800, e=12200, ext="max"),
    dict(kind="door", axis="y", c=5600, s=3300, e=4200, swing=-1, hinge="s"),
    dict(kind="door", axis="x", c=3200, s=4400, e=5200, swing=-1, hinge="e"),
    dict(kind="door", axis="y", c=4200, s=4600, e=5400, swing=-1, hinge="s"),
    dict(kind="door", axis="x", c=9000, s=6200, e=7000, swing=-1, hinge="s"),
    dict(kind="door", axis="y", c=8000, s=2800, e=3700, swing=1, hinge="s"),
    # the workout room is reached through the work room
    dict(kind="door", axis="x", c=WORK_SPLIT, s=10000, e=10800, swing=1, hinge="e"),
]


def opening_box(o):
    t = o.get("t", EXT_T if "ext" in o else INT_T)
    return cut(o["axis"], o["c"], o["s"], o["e"], t=t, exterior_side=o.get("ext"))


def ground_walls():
    parts = [
        ring(0, 0, HOUSE_W, HOUSE_D),
        box(*GARAGE).difference(box(11_000, 200, 16_800, 7_800)),
        box(11_000, 7_800, 17_000, 13_000).difference(box(11_000, 7_800, 16_800, 12_800)),
        wall(4200, 0, 4200, BED3_Y1), wall(0, 4400, 4200, 4400), wall(4200, 2600, 6600, 2600),
        wall(6600, 0, 6600, 2600), wall(5600, 4400, 5600, 13000), wall(5600, 7800, 8000, 7800),
        wall(8000, 4400, 8000, 8400), wall(8000, 4400, 11000, 4400), wall(8000, 6800, 11000, 6800),
        wall(8000, 8400, 11000, 8400), wall(0, BED3_Y1, 4200, BED3_Y1),
        # inner hall (round 5): a solid wall closes the stair off from the sitting room, and a short
        # wing wall hides the guest-bath door; family and guests reach both around the corner
        wall(6600, 4400, 8000, 4400), wall(6600, 2600, 6600, 3500),
    ]
    # terrace columns carrying the balcony above
    for x in (0, 2750, 5500, 8250, 11000):
        x0, x1 = max(0, x - 200), min(HOUSE_W, x + 200)
        parts.append(box(x0, 15_600, x1, 16_000))
    walls = unary_union(parts)
    holes = unary_union([opening_box(o) for o in GF_OPENINGS])
    return walls.difference(holes), walls


def upper_walls():
    parts = [
        ring(0, 0, HOUSE_W, HOUSE_D),
        wall(8000, 0, 8000, 13000), wall(5600, 0, 5600, 4400), wall(5600, 4400, 5600, 9000),
        wall(0, 3200, 5600, 3200), wall(4200, 3200, 4200, 6800), wall(0, 6800, 4200, 6800),
        wall(5600, 7800, 8000, 7800), wall(5600, 9000, 8000, 9000),
        wall(8000, WORK_SPLIT, 11000, WORK_SPLIT),
    ]
    walls = unary_union(parts)
    holes = unary_union([opening_box(o) for o in UF_OPENINGS])
    return walls.difference(holes), walls


GF_ROOMS = [
    ("bedroom-2", "BEDROOM 2", box(0, 0, 4200, 4400)),
    ("guest-bath", "GUEST BATH", box(4200, 0, 6600, 2600)),
    ("entrance", "ENTRANCE", box(6600, 0, 11000, 4400)),
    ("hall", "HALL", box(4200, 2600, 6600, 4400)),
    ("bedroom-3", "BEDROOM 3", box(0, 4400, 4200, BED3_Y1)),
    ("boot-room", "BOOT ROOM", box(8000, 4400, 11000, 6800)),
    ("pantry", "PANTRY", box(8000, 6800, 11000, 8400)),
    ("kitchen", "KITCHEN + DINING", box(5600, 7800, 11000, 13000).difference(box(8000, 7800, 11000, 8400))),
    ("living", "LIVING", unary_union([box(0, BED3_Y1, 5600, 13000), box(4200, 4400, 5600, BED3_Y1)])),
    ("terrace", "COVERED TERRACE", box(*TERRACE)),
    ("garage", "GARAGE", box(*GARAGE)),
    ("laundry", "LAUNDRY YARD", box(*LAUNDRY)),
]

UF_ROOMS = [
    ("ensuite", "ENSUITE", box(0, 0, 5600, 3200)),
    ("landing", "LANDING", box(5600, 0, 8000, 4400)),
    ("walk-in", "WALK-IN", box(0, 3200, 4200, 6800)),
    ("linen", "LINEN", box(5600, 7800, 8000, 9000)),
    ("master", "MASTER BEDROOM", unary_union([box(0, 6800, 5600, 13000), box(5600, 9000, 8000, 13000)])),
    ("work-room", "WORK ROOM", box(8000, 0, 11000, WORK_SPLIT)),
    ("workout", "WORKOUT", box(8000, WORK_SPLIT, 11000, 13000)),
    ("balcony", "BALCONY", box(0, 13000, 11000, 16000)),
    ("front-balcony", "BALCONY", box(*FRONT_BALCONY)),
]

# Where to place room tags when the polygon centroid is a poor spot (house coords)
TAG_AT = {
    "entrance": (8800, 3900), "hall": (5300, 3600), "living": (2600, 9800), "kitchen": (7700, 12450), "bedroom-2": (3150, 950),
    "guest-bath": (5400, 1250), "bedroom-3": (1400, 6950), "laundry": (13300, 10000), "pantry": (9300, 7750),
    "walk-in": (2500, 5650), "linen": (7000, 8400),
    "master": (3000, 12000), "work-room": (9950, 4100), "workout": (9500, 7500), "terrace": (6300, 14500),
    "garage": (14000, 6050), "front-balcony": (8550, -750),
}

# Stair: U-stair, 20 risers of 170 mm, 2 flights of 9 treads x 260 mm
STAIR = dict(x0=5600, y0=4400, x1=8000, y1=7800, flight_w=1090, gap=100, tread=260, treads=9)
