"""Proof of concept: real CAD (DXF) drawing rendered in blueprint style."""
import math
import ezdxf
from ezdxf.addons.drawing import Frontend, RenderContext, layout, svg, config
from ezdxf.addons.drawing.properties import LayoutProperties
from ezdxf.enums import TextEntityAlignment

doc = ezdxf.new("R2018", setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for name, lw in [("WALL", 70), ("HATCH", 13), ("OPEN", 25), ("DIM", 18), ("TEXT", 18), ("GRID", 9), ("FURN", 13)]:
    doc.layers.add(name, lineweight=lw)

T = 200  # exterior wall mm
t = 120  # interior wall mm
W, D = 6000, 4500  # outer size


def wall_rect(x0, y0, x1, y1, thick):
    outer = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    inner = [(x0 + thick, y0 + thick), (x1 - thick, y0 + thick), (x1 - thick, y1 - thick), (x0 + thick, y1 - thick)]
    msp.add_lwpolyline(outer, close=True, dxfattribs={"layer": "WALL"})
    msp.add_lwpolyline(inner, close=True, dxfattribs={"layer": "WALL"})
    h = msp.add_hatch(dxfattribs={"layer": "HATCH"})
    h.set_pattern_fill("ANSI31", scale=12)
    h.paths.add_polyline_path(outer, is_closed=True, flags=1)
    h.paths.add_polyline_path(inner, is_closed=True, flags=16)


wall_rect(0, 0, W, D, T)
# interior partition with door opening
x = 3600
msp.add_lwpolyline([(x, T), (x, 2200), (x + t, 2200), (x + t, T)], dxfattribs={"layer": "WALL"})
msp.add_lwpolyline([(x, 3100), (x, D - T), (x + t, D - T), (x + t, 3100)], dxfattribs={"layer": "WALL"})
for y0, y1 in [(T, 2200), (3100, D - T)]:
    h = msp.add_hatch(dxfattribs={"layer": "HATCH"})
    h.set_pattern_fill("ANSI31", scale=12)
    h.paths.add_polyline_path([(x, y0), (x + t, y0), (x + t, y1), (x, y1)], is_closed=True)
# door leaf + swing (900 mm)
msp.add_line((x + t, 2200), (x + t + 900, 2200), dxfattribs={"layer": "OPEN"})
msp.add_arc((x + t, 2200), 900, 0, 90, dxfattribs={"layer": "OPEN"})
# arched window on south wall, shown as triple line
for k, yy in enumerate([0, T / 2, T]):
    msp.add_line((1200, yy), (2400, yy), dxfattribs={"layer": "OPEN" if k == 1 else "WALL"})

# dimensions
dim_style = "EZDXF"
doc.dimstyles.get(dim_style).dxf.dimtxt = 180
doc.dimstyles.get(dim_style).dxf.dimasz = 0
doc.dimstyles.get(dim_style).dxf.dimtsz = 90  # architectural ticks
doc.dimstyles.get(dim_style).dxf.dimlfac = 1
for a, b in [((0, 0), (1200, 0)), ((1200, 0), (2400, 0)), ((2400, 0), (W, 0))]:
    msp.add_linear_dim(base=(0, -700), p1=a, p2=b, dimstyle=dim_style, dxfattribs={"layer": "DIM"}).render()
msp.add_linear_dim(base=(0, -1300), p1=(0, 0), p2=(W, 0), dimstyle=dim_style, dxfattribs={"layer": "DIM"}).render()
msp.add_linear_dim(base=(W + 900, 0), p1=(W, 0), p2=(W, D), angle=90, dimstyle=dim_style, dxfattribs={"layer": "DIM"}).render()

# room tags
for cx, label, area in [(1800, "LIVING", "19.8 m²"), (4800, "GUEST BATH", "8.2 m²")]:
    msp.add_text(label, height=220, dxfattribs={"layer": "TEXT"}).set_placement((cx, D / 2 + 150), align=TextEntityAlignment.MIDDLE_CENTER)
    msp.add_text(area, height=150, dxfattribs={"layer": "TEXT"}).set_placement((cx, D / 2 - 150), align=TextEntityAlignment.MIDDLE_CENTER)

# grid bubbles
for i, gx in enumerate([0, 3600, W]):
    msp.add_line((gx, D + 300), (gx, D + 1200), dxfattribs={"layer": "GRID", "linetype": "CENTER"})
    msp.add_circle((gx, D + 1500), 300, dxfattribs={"layer": "GRID"})
    msp.add_text("ABC"[i], height=250, dxfattribs={"layer": "TEXT"}).set_placement((gx, D + 1500), align=TextEntityAlignment.MIDDLE_CENTER)

doc.saveas("poc.dxf")

# render blueprint style: everything white on blueprint blue
cfg = config.Configuration(
    background_policy=config.BackgroundPolicy.CUSTOM,
    custom_bg_color="#1f4e8c",
    color_policy=config.ColorPolicy.CUSTOM,
    custom_fg_color="#eef4ff",
    lineweight_scaling=1.6,
)
ctx = RenderContext(doc)
backend = svg.SVGBackend()
Frontend(ctx, backend, config=cfg).draw_layout(msp)
page = layout.Page(0, 0, layout.Units.mm, margins=layout.Margins.all(20))
svg_str = backend.get_string(page)
open("poc.svg", "w", encoding="utf8").write(svg_str)
print("ok", len(svg_str))
