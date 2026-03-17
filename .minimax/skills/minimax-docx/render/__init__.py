"""Visual rendering components for document backgrounds and charts."""

from .themes import PlotStyle, FOREST, ARCTIC, DUSK
from .html_canvas import BrowserRenderer
from .page_art import PageArtist
from .data_plot import DataPlotter

__all__ = [
    "PlotStyle",
    "FOREST",
    "ARCTIC",
    "DUSK",
    "BrowserRenderer",
    "PageArtist",
    "DataPlotter",
]
