# Direction options (2026-10-04)

Decision sheet for the next phase. Nothing here is built yet.

## Decisions (2026-10-04)

1. **Website style:** B + A. ERA-style editorial Mediterranean site, with a Masters-style scroll film as the centrepiece and a clickable site plan.
2. **3D:** a video played by scrolling (frame sequence painted to a canvas). No real-time 3D.
3. **Site:** keep the 3 m hedge and the solid arched-top timber gate on all four sides, back gate included. The bluff is **6 m** above the cove beach. Access is by stone stairs only (no lift).
4. **Tiles: interiors only**, none on the outside. Handmade glossy glazed ceramic with natural tone variation, in muted colours; the walls stay cream plaster around them. Proposed palette: sea-glass blue-grey mosaic for the master ensuite shower wall (34d318a4), sage/olive vertical-stack for the kitchen backsplash and pantry (076f9877), terracotta/sand/ochre squares for the guest bath (dee0921f). Material board: a825902b. Waiting for the user's confirmation.
5. **Language:** English.
6. **Blueprint:** must look like a real construction blueprint. It is built as CAD geometry (DXF via ezdxf) and rendered in blueprint style. See `.claude/skills/architectural-blueprint` and `tools/blueprint/poc.py`.

## Decisions, round 2 (2026-10-04)

1. **Name: La Casa**, used everywhere (tab, site, drawing title blocks). Logo: a simple maroon arch with a silver inner arch (`src/app/icon.svg`, `ArchMark`).
2. **Single source of truth: `design/site-plan-1000m2.svg` (v5).** The CAD model (`tools/blueprint/model.py`), the drawings, the massing model (`tools/massing/build_scene.py`, guide renders in `design/massing/`) and every render and film frame follow it.
3. **Back gate:** a 1.4 m solid arched timber door set in a 3.2 m arched plaster portal wall (crown 4 m), on the beach-path axis. It is not see-through.
4. **Thuja** only along the straight part of the driveway; none along the front hedge.
5. **Renders and film:** all old images and clips deleted and regenerated from massing views of the plan. The film is three Kling 3.0 Pro 1080p clips plus a cove drift, cut to 12 fps AVIF frames at 1920 px. Clip 2 is trimmed at 6.9 s, because later frames invent a second gateway.
6. **Website:** rebuilt on the DNA of era-residence.com: condensed serif capitals, a script accent word, an extended sans for labels, a circle reveal, sky-blue fields, a maroon block, lavender and rose cut-outs (bougainvillea until round 3), a route line and a rotating emblem. A single theme only; the Day / Dusk mode is removed.

The sections below are the original options, kept for reference.

## 1. Website style references

Every site below won or was shortlisted at Awwwards (several also won at The FWA or CSS Design Awards). Each one is a property showcase, which is the same job as this site.

| # | Style | Example (award) | What it does well | Fit for us |
|---|---|---|---|---|
| A | **Cinematic scroll film**: the scroll drives one long camera move | [Masters Residence](https://dviga.marketing/masters-en) (Awwwards HM, Aug 2026) | Every scroll step moves the camera through 3D renders of the building | Closest to the current plan. Risk: looks like "a video in a box" if the type and layout are weak |
| B | **Editorial resort brochure**: a magazine layout with light/dark modes | [ERA Residence](https://www.era-residence.com/) (SOTD, Aug 2026, Mediterranean, Marbella) | Day/night toggle, horizontal scroll chapters, video gallery, warm natural materials | Same style family as our house. Strongest match for the overall look |
| C | **Chaptered story**: the site reads like a short book | [Loam House](https://residences.loamhouse.com.au) (Nominee, Sep 2026); [Quinta D. AmÃ¡lia](https://www.quintadamalia.com/) (Nominee, Sep 2026, "the website had to become the property before the first stone") | Large type, slow pacing, a few images per chapter | Quinta has the same problem we do (the house isn't built yet). Cheap to make, elegant |
| D | **Interactive 3D model and site plan** | [LIKOVA](https://likova.space) (SOTD + Developer, Aug 2026); [Sobha Privy](https://sobha-privy-collection.com/) (SOTD, Sep 2026) | WebGL model you can orbit, a site plan you can click, zoom-on-scroll | Most impressive, but needs a real 3D model of the house |
| E | **360Â° immersive walk-through** | [Above the Clouds, 111 W 57](https://quadplex80.com/) (SOTD, May 2025) | Panoramas you can drag, moving between rooms | Panoramas can be generated room by room. Good for interiors |
| F | **Playful "dollhouse" world** | [Miu Miu: A House That We Shaped](https://immersivebags.miumiu.com/) (SOTD, Aug 2026) | A stylised house you click through room by room | Charming but a toy. Doesn't fit "warm and refined" |
| G | **Warm boutique holiday home** | [Vakantiehuis Coquelicots](https://coquelicots.nl) (HM, Aug 2026) | Colourful, personal, parallax, GSAP | Good for personality and colour (our tiles). Lower production value |

**Recommendation:** combine **B with A**: ERA's editorial Mediterranean look, with one Masters-style scroll film as the centrepiece. Borrow **D's clickable site plan** for the blueprint section.

## 2. Blueprint and 3D content

Blueprint (all drawn by hand as SVG, animated with GSAP, so it costs no credits):
- Site section through the bluff: road â†’ gate â†’ garden â†’ house â†’ backyard â†’ cliff edge â†’ stairs â†’ cove, with heights marked. This is the "private but elevated" story in one drawing.
- Site plan: the existing v4 SVG, redrawn for the bluff with a clickable legend.
- Ground and upper floor plans. Hover a room to see its render and size.
- Linework that draws itself (stroke-dashoffset) when the section scrolls into view.

3D or video:
- **Scroll-scrubbed image sequence** (recommended): a Higgsfield video, exported to about 150â€“250 WebP frames and painted to a canvas as you scroll. Smooth on phones, and it reuses the existing concept images as keyframes.
- **Real-time 3D** (React Three Fiber): only works with a properly modelled house. AI image-to-3D gives a lumpy shell (see the test notes below).
- **Hybrid**: a simple low-poly 3D "massing" model (boxes, arches and roof planes built in code from the plan's measurements). It turns and explodes into floors, then crossfades into the photoreal renders. It shows that the layout is real.

AI image-to-3D test (2026-10-04): the Hunyuan3D v3 job failed. The Tripo H3.1 job (a7457aa1) worked, but the result is one fused mesh: 1.44 M triangles in a 45 MB GLB, with no interior and no separate floors, and the back of the house is invented by the model. Not usable as the hero 3D. At most it could be a decimated background prop.

## 3. Site: cove + bluff

The plot sits on a limestone bluff about 8â€“12 m above a small horseshoe cove. The headlands on either side hide the beach. The cliff stairs (switchbacks, iron handrail) lead down to the sand.
Test renders: 4dc4dbdb (back hedge kept), 90bf456b (back hedge replaced by a balustrade with an arched opening), 3979105a (view from the beach up to the house).

## 4. Tile accents (colour without going Moroccan)

Tiles go on the step risers, the front-door surround, a thin band under the upper windows, planters, the stair risers to the beach, the kitchen backsplash and the bathrooms.
- Amalfi / Vietri: lemon yellow, cobalt, sea green (cdc18666). The most colourful and cheerful.
- Portuguese azulejo: cobalt on white (b48f6a49). Calm, seaside, works well with cream.
- Andalusian / Sicilian majolica: terracotta, ochre, olive, teal (bb96ea48). The warmest, closest to the roof colour.
