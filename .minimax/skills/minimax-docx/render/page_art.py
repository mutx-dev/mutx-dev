"""Page background artwork generation for document covers and sections."""

from pathlib import Path

from .themes import PlotStyle, FOREST
from .html_canvas import BrowserRenderer


# A4 at 96 DPI
PAGE_WIDTH = 794
PAGE_HEIGHT = 1123


class PageArtist:
    """Generates decorative page backgrounds for document sections.

    Creates visually distinct backgrounds for front cover, body pages,
    and back cover using CSS-based designs rendered to PNG.
    """

    def __init__(self, style: PlotStyle = FOREST):
        """Initialize with a visual theme.

        Args:
            style: PlotStyle defining colors and typography.
        """
        self._style = style

    def render_set(self, output_dir: Path) -> list[Path]:
        """Generate all page background images.

        Creates three images: front.png, body.png, closing.png

        Args:
            output_dir: Directory to write the PNG files.

        Returns:
            List of paths to created image files.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        templates = [
            ("front.png", self._front_template()),
            ("body.png", self._content_template()),
            ("closing.png", self._closing_template()),
        ]

        results = []
        with BrowserRenderer(PAGE_WIDTH, PAGE_HEIGHT) as renderer:
            for filename, html in templates:
                path = output_dir / filename
                renderer.render_to_png(html, path)
                results.append(path)

        return results

    def _base_html(self, body_content: str) -> str:
        """Wrap content in a complete HTML document."""
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
html, body {{ margin: 0; padding: 0; }}
*, *::before, *::after {{ box-sizing: border-box; }}
html, body {{
    width: {PAGE_WIDTH}px;
    height: {PAGE_HEIGHT}px;
    background: {self._style.background};
    font-family: {self._style.font_family};
    overflow: hidden;
}}
</style>
</head>
<body>
{body_content}
</body>
</html>"""

    def _front_template(self) -> str:
        """HTML template for front cover with diagonal accent."""
        s = self._style
        content = f"""
<div style="
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, {s.accents[0]}15 0%, transparent 50%);
"></div>
<div style="
    position: absolute;
    bottom: 80px; right: 60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, {s.accents[1]}30, transparent 70%);
"></div>
<div style="
    position: absolute;
    top: 40px; left: 40px;
    width: 8px; height: 120px;
    background: {s.accents[0]};
"></div>
"""
        return self._base_html(content)

    def _content_template(self) -> str:
        """HTML template for body pages with subtle edge decoration."""
        s = self._style
        content = f"""
<div style="
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: linear-gradient(180deg, {s.accents[0]}40, transparent 30%, transparent 70%, {s.accents[0]}40);
"></div>
"""
        return self._base_html(content)

    def _closing_template(self) -> str:
        """HTML template for back cover with bottom arc."""
        s = self._style
        content = f"""
<div style="
    position: absolute;
    bottom: -200px; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(ellipse, {s.accents[0]}20, transparent 60%);
"></div>
<div style="
    position: absolute;
    bottom: 60px; left: 50%;
    transform: translateX(-50%);
    width: 100px; height: 3px;
    background: {s.accents[0]};
"></div>
"""
        return self._base_html(content)
