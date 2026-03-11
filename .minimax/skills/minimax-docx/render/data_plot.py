"""Data visualization chart generation using matplotlib."""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:
    matplotlib = None
    plt = None

from .themes import PlotStyle, FOREST


class DataPlotter:
    """Generates data visualization charts with consistent styling.

    All charts follow the provided PlotStyle theme for visual coherence
    across the document.
    """

    def __init__(
        self,
        style: PlotStyle = FOREST,
        width: float = 8.0,
        height: float = 6.0,
        dpi: int = 150,
    ):
        """Initialize plotter with visual configuration.

        Args:
            style: PlotStyle defining colors and fonts.
            width: Figure width in inches.
            height: Figure height in inches.
            dpi: Resolution for output images.
        """
        if plt is None:
            raise ImportError(
                "matplotlib is required for chart rendering. "
                "Install with: pip install matplotlib"
            )
        self._style = style
        self._width = width
        self._height = height
        self._dpi = dpi

    def _create_figure(self) -> tuple[plt.Figure, plt.Axes]:
        """Set up a new figure with theme-appropriate defaults."""
        plt.rcParams["font.family"] = self._style.font_family.split(",")[0].strip()
        plt.rcParams["axes.unicode_minus"] = False

        fig, ax = plt.subplots(figsize=(self._width, self._height), dpi=self._dpi)
        fig.patch.set_facecolor(self._style.background)
        ax.set_facecolor(self._style.background)
        return fig, ax

    def _setup_axes(self, ax: plt.Axes, show_grid: str = None) -> None:
        """Apply minimal chrome styling to axes."""
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_color(self._style.grid_color)
        ax.spines["bottom"].set_color(self._style.grid_color)
        ax.tick_params(colors=self._style.foreground, labelsize=9)

        if show_grid:
            ax.grid(axis=show_grid, color=self._style.grid_color, linewidth=0.5, alpha=0.7)

    def _save(self, fig: plt.Figure, output: Path) -> Path:
        """Finalize and save the figure."""
        output = Path(output)
        output.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)
        return output

    def bar_vertical(
        self,
        categories: Sequence[str],
        datasets: list[tuple[str, Sequence[float]]],
        output: Path,
        show_values: bool = True,
    ) -> Path:
        """Render grouped vertical bar chart.

        Args:
            categories: Labels for x-axis groups.
            datasets: List of (series_name, values) pairs.
            output: Path for output image.
            show_values: Whether to annotate bars with values.

        Returns:
            Path to saved image.
        """
        fig, ax = self._create_figure()
        self._setup_axes(ax, show_grid="y")

        n_groups = len(categories)
        n_series = len(datasets)
        bar_width = 0.8 / n_series
        indices = list(range(n_groups))

        for i, (name, values) in enumerate(datasets):
            color = self._style.accent_at(i)
            positions = [
                idx + i * bar_width - (n_series - 1) * bar_width / 2
                for idx in indices
            ]
            bars = ax.bar(positions, values, bar_width, label=name, color=color)

            if show_values:
                for bar in bars:
                    h = bar.get_height()
                    ax.annotate(
                        f"{h:.0f}",
                        xy=(bar.get_x() + bar.get_width() / 2, h),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha="center",
                        va="bottom",
                        fontsize=8,
                        color=self._style.foreground,
                    )

        ax.set_xticks(indices)
        ax.set_xticklabels(categories)
        ax.legend(frameon=False, fontsize=9)

        return self._save(fig, output)

    def bar_horizontal(
        self,
        categories: Sequence[str],
        datasets: list[tuple[str, Sequence[float]]],
        output: Path,
    ) -> Path:
        """Render grouped horizontal bar chart.

        Args:
            categories: Labels for y-axis groups.
            datasets: List of (series_name, values) pairs.
            output: Path for output image.

        Returns:
            Path to saved image.
        """
        fig, ax = self._create_figure()
        self._setup_axes(ax, show_grid="x")

        n_groups = len(categories)
        n_series = len(datasets)
        bar_height = 0.8 / n_series
        indices = list(range(n_groups))

        for i, (name, values) in enumerate(datasets):
            color = self._style.accent_at(i)
            positions = [
                idx + i * bar_height - (n_series - 1) * bar_height / 2
                for idx in indices
            ]
            ax.barh(positions, values, bar_height, label=name, color=color)

        ax.set_yticks(indices)
        ax.set_yticklabels(categories)
        ax.legend(frameon=False, fontsize=9)

        return self._save(fig, output)

    def line_chart(
        self,
        x_labels: Sequence[str],
        datasets: list[tuple[str, Sequence[float]]],
        output: Path,
        markers: bool = True,
    ) -> Path:
        """Render multi-series line chart.

        Args:
            x_labels: Labels for x-axis points.
            datasets: List of (series_name, values) pairs.
            output: Path for output image.
            markers: Whether to show point markers.

        Returns:
            Path to saved image.
        """
        fig, ax = self._create_figure()
        self._setup_axes(ax, show_grid="y")

        x_indices = range(len(x_labels))
        marker_style = "o" if markers else None

        for i, (name, values) in enumerate(datasets):
            color = self._style.accent_at(i)
            ax.plot(x_indices, values, label=name, color=color, marker=marker_style, linewidth=2)

        ax.set_xticks(list(x_indices))
        ax.set_xticklabels(x_labels)
        ax.legend(frameon=False, fontsize=9)

        return self._save(fig, output)

    def area_stacked(
        self,
        x_labels: Sequence[str],
        datasets: list[tuple[str, Sequence[float]]],
        output: Path,
    ) -> Path:
        """Render stacked area chart.

        Args:
            x_labels: Labels for x-axis points.
            datasets: List of (series_name, values) pairs.
            output: Path for output image.

        Returns:
            Path to saved image.
        """
        fig, ax = self._create_figure()
        self._setup_axes(ax, show_grid="y")

        x_indices = range(len(x_labels))
        labels = [d[0] for d in datasets]
        values = [d[1] for d in datasets]
        colors = [self._style.accent_at(i) for i in range(len(datasets))]

        ax.stackplot(x_indices, *values, labels=labels, colors=colors, alpha=0.8)
        ax.set_xticks(list(x_indices))
        ax.set_xticklabels(x_labels)
        ax.legend(loc="upper left", frameon=False, fontsize=9)

        return self._save(fig, output)

    def donut(
        self,
        labels: Sequence[str],
        values: Sequence[float],
        output: Path,
        hole_ratio: float = 0.5,
    ) -> Path:
        """Render ring/donut chart.

        Args:
            labels: Slice labels.
            values: Slice values.
            output: Path for output image.
            hole_ratio: Size of center hole (0-1).

        Returns:
            Path to saved image.
        """
        fig, ax = self._create_figure()

        colors = [self._style.accent_at(i) for i in range(len(labels))]

        wedges, texts, autotexts = ax.pie(
            values,
            labels=labels,
            colors=colors,
            autopct="%1.1f%%",
            startangle=90,
            pctdistance=0.75,
            wedgeprops={"linewidth": 2, "edgecolor": self._style.background},
        )

        for text in texts:
            text.set_color(self._style.foreground)
            text.set_fontsize(10)
        for autotext in autotexts:
            autotext.set_color(self._style.background)
            autotext.set_fontsize(9)
            autotext.set_weight("bold")

        center_circle = plt.Circle((0, 0), hole_ratio, fc=self._style.background)
        ax.add_patch(center_circle)

        ax.axis("equal")

        return self._save(fig, output)
