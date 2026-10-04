---
name: architectural-blueprint
description: Draw the dream house's site plan, floor plans and sections as real CAD drawings (DXF via ezdxf) rendered in classic blueprint style for the website. Use whenever creating or editing any plan, section, elevation or blueprint asset in this project, or when the blueprint section of the site needs new artwork.
---

# Architectural blueprint

The blueprint must read as a real construction drawing, not an illustration. Every drawing starts as **measured CAD geometry** (millimetres, DXF), and the web art is rendered from that source. Never hand-draw plan SVG paths.

## Pipeline

1. **Source of truth:** `tools/blueprint/*.py` build a DXF with `ezdxf` (`python -m pip install -r tools/blueprint/requirements.txt`). Geometry comes from the measured layout (plot 20 × 50 m, house 11 × 13 m, garage 5.5 × 8 m, laundry yard 5.5 × 5 m, 6 m bluff). Keep all dimensions in one data module so plans and sections agree.
2. **Outputs per sheet:** `design/blueprints/<sheet>.dxf` (opens in AutoCAD, LibreCAD, etc.), `<sheet>.svg` for the web, and `<sheet>.png` for preview and checking.
3. **Render** with `ezdxf.addons.drawing` (SVG backend), then post-process: add the paper grid, wrap each DXF layer in `<g id="layer-…">` so GSAP can draw the layers in order, and keep strokes as strokes (no outlines) so `stroke-dashoffset` animation works.
4. **Look at the PNG before shipping.** Check dimension text values (set `dimlfac = 1`), overlaps, and that tags sit inside their rooms.

## Drawing standards

| Layer | Content | Lineweight |
|---|---|---|
| WALL | cut walls (outline) | 0.70 mm |
| HATCH | wall poché, ANSI31 at ~45° (or solid for concrete) | 0.13 mm |
| OPEN | door leaves, swings, window glass line | 0.35 mm |
| FURN | fixtures, sanitary, kitchen run, beds (light) | 0.13 mm |
| DIM | dimension chains, architectural tick terminators | 0.18 mm |
| GRID | structural grid, CENTER linetype + bubbles A, B, C… / 1, 2, 3… | 0.09 mm |
| TEXT | room tags, notes, title block | 0.18 mm |
| ABOVE | arches, eaves and the upper floor shown above the cut, DASHED linetype | 0.18 mm |

- Exterior walls 200 mm, interior walls 120 mm. Dimensions in mm, never in m.
- Doors: leaf line plus a 90° swing arc. Windows: three parallel lines within the wall thickness. Arched openings: plan opening plus a dashed arch outline (ABOVE).
- Stairs: treads, a break line at the cut, and an arrow labelled UP or DN.
- Dimension chains in three tiers outside the building: openings → rooms/grid → overall.
- Room tags: NAME in caps plus the area in m² with two decimals, centred in the room.
- Levels: datum symbol with values such as `±0.00`, `+3.40`, `−6.00 (beach)`.
- Every sheet has a north arrow, a scale bar, a scale note (1:100 plans, 1:200 site, 1:100 sections) and a title block (project "Dream House", sheet name and number, scale, date, "Drawn by Gilang Maulana").
- Section sheets mark the cut line on the plan (A–A, B–B) and show the 6 m limestone bluff, the cliff stairs and the beach level.

## Blueprint style

- Paper `#1f4e8c` (deep blueprint blue) with a 5 mm minor / 25 mm major grid at 8% and 14% opacity. Ink `#eef4ff`. No other colours; emphasis comes only from lineweight.
- Text: a technical sans or a stencil-like mono, all caps for labels.
- Optional, very subtle paper texture (noise ≤ 4% opacity). Never blur the linework.

## Sheets

1. Site plan (plot, hedge, gates, walk, Thuja driveway, cliff edge, stairs)
2. Ground floor plan
3. Upper floor plan
4. Section A–A: road → house → backyard → bluff → cove
5. Front elevation (arches, roof pitch, eaves)
