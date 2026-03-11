"""Visual theme definitions for charts and page backgrounds."""

from dataclasses import dataclass


@dataclass(frozen=True)
class PlotStyle:
    """Immutable visual configuration for rendering components.

    Attributes:
        background: Primary background color in hex format.
        foreground: Primary text/line color in hex format.
        accents: Tuple of accent colors for data series.
        grid_color: Color for chart grid lines.
        font_family: Font family for text elements.
    """
    background: str
    foreground: str
    accents: tuple[str, ...]
    grid_color: str
    font_family: str

    def accent_at(self, index: int) -> str:
        """Retrieve accent color by index, cycling if out of range.

        Args:
            index: Zero-based position in the accent palette.

        Returns:
            Hex color string from the accents tuple.
        """
        return self.accents[index % len(self.accents)]


# Earthy greens and browns inspired by woodland environments
FOREST = PlotStyle(
    background="#F8F6F0",
    foreground="#2D3A2D",
    accents=("#4A7C59", "#8B9D77", "#D4A574", "#6B4423", "#9CAF88"),
    grid_color="#E0DDD4",
    font_family="Georgia, serif",
)

# Cool blues and whites evoking polar landscapes
ARCTIC = PlotStyle(
    background="#F0F4F8",
    foreground="#1E3A5F",
    accents=("#4A90A4", "#7FB3D3", "#B8D4E8", "#2E6B8A", "#5BA3C6"),
    grid_color="#D6E3ED",
    font_family="Helvetica Neue, sans-serif",
)

# Warm purples and oranges of twilight
DUSK = PlotStyle(
    background="#FAF5F0",
    foreground="#3D2C3E",
    accents=("#8B5A7C", "#C4A484", "#D4956A", "#6B4E71", "#A67C94"),
    grid_color="#EDE6DF",
    font_family="Palatino, serif",
)
