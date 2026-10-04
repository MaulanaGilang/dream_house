"""Render each DXF to a blueprint-coloured PNG for checking (python tools/blueprint/preview.py)."""
import sys
from pathlib import Path

import ezdxf
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from ezdxf.addons.drawing import Frontend, RenderContext, config
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "design" / "blueprints"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC

cfg = config.Configuration(
    background_policy=config.BackgroundPolicy.CUSTOM, custom_bg_color="#1f4e8c",
    color_policy=config.ColorPolicy.CUSTOM, custom_fg_color="#eef4ff", lineweight_scaling=1.2,
)
for f in sorted(SRC.glob("*.dxf")):
    doc = ezdxf.readfile(f)
    fig = plt.figure(figsize=(16.8, 11.88))
    ax = fig.add_axes([0, 0, 1, 1])
    Frontend(RenderContext(doc), MatplotlibBackend(ax), config=cfg).draw_layout(doc.modelspace())
    fig.savefig(OUT / f"{f.stem}.png", dpi=320, facecolor="#1f4e8c")
    plt.close(fig)
    print("preview", f.stem)
