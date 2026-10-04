---
name: architectural-blueprint
description: Draw the dream house's site plan, floor plans and sections as real CAD drawings (DXF via ezdxf) rendered in classic blueprint style for the website. Use whenever creating or editing any plan, section, elevation or blueprint asset in this project, or when the blueprint section of the site needs new artwork.
---

# Architectural blueprint

The blueprint must read as a real construction drawing, not an illustration. Every drawing starts as **measured CAD geometry** (millimetres, DXF), and the web art is rendered from that source. Never hand-draw plan SVG paths.

## Pipeline

1. **Source of truth:** `tools/blueprint/model.py` holds every measurement: plot, walls, openings, rooms and levels (install with `python -m pip install -r tools/blueprint/requirements.txt` plus `shapely`). Change the house here, never in the SVG.
2. **Build:** `python tools/blueprint/build.py` draws each sheet once as primitives (`sheet.py`) and writes two backends from the same primitives:
   - `design/blueprints/A-0x-<sheet>.dxf`: real CAD with layers, hatches and DIMENSION entities. A copy goes to `public/blueprints/` for download.
   - `public/blueprints/<sheet>.svg`: one `<g class="bp-layer bp-<layer>">` per layer in drawing order, every stroke with `pathLength="1"` so GSAP can draw it, and room hit areas in `.bp-rooms` with `data-room` ids.
   - `src/data/blueprint-rooms.json`: net room areas (room polygon minus walls) used across the site.
3. **Check:** `python tools/blueprint/preview.py <out-dir>` renders the DXFs to blueprint PNGs. Look at them for overlaps, dimension values, and tags sitting inside their rooms.
4. Walls are shapely unions with openings subtracted. Doors, windows and arches come from the opening table, so the symbols and the wall gaps always agree.

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
