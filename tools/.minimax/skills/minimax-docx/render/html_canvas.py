"""Browser-based rendering engine for HTML to PNG conversion."""

from pathlib import Path


class BrowserRenderer:
    """Renders HTML content to PNG images using a headless browser.

    Uses Playwright for consistent cross-platform rendering with
    high-DPI support for crisp output.

    Usage:
        with BrowserRenderer(794, 1123) as renderer:
            renderer.render_to_png(html_content, output_path)
    """

    def __init__(self, width: int, height: int, scale: int = 2):
        """Initialize renderer with target dimensions.

        Args:
            width: Viewport width in CSS pixels.
            height: Viewport height in CSS pixels.
            scale: Device scale factor for high-DPI output.
        """
        self._width = width
        self._height = height
        self._scale = scale
        self._browser = None
        self._playwright = None

    def __enter__(self) -> "BrowserRenderer":
        """Start the browser instance."""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise ImportError(
                "Playwright required for HTML rendering. "
                "Install with: pip install playwright && playwright install chromium"
            )

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Clean up browser resources."""
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()

    def render_to_png(self, html: str, output_path: Path) -> Path:
        """Convert HTML string to PNG image file.

        Args:
            html: Complete HTML document as string.
            output_path: Destination path for the PNG file.

        Returns:
            Path to the created PNG file.

        Raises:
            RuntimeError: If called outside context manager.
        """
        if not self._browser:
            raise RuntimeError("Renderer must be used as context manager")

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        page = self._browser.new_page(
            viewport={"width": self._width, "height": self._height},
            device_scale_factor=self._scale,
        )

        try:
            page.set_content(html)
            page.screenshot(path=str(output_path), full_page=False)
        finally:
            page.close()

        return output_path
