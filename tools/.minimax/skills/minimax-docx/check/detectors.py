"""Validation detectors for identifying document quality issues."""

from __future__ import annotations

import logging
import re
from functools import cached_property
from pathlib import Path
from typing import Protocol
import xml.etree.ElementTree as ET

from .report import ValidationReport

logger = logging.getLogger(__name__)

# XML namespaces
WML = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"

TOC_STYLE_RE = re.compile(r"^toc\d+$", re.IGNORECASE)
HEADING_STYLE_RE = re.compile(r"^heading\d+$", re.IGNORECASE)


class Detector(Protocol):
    """Interface contract for all validation detectors."""
    name: str

    def scan(self, ctx: "ScanContext") -> None:
        """Execute detection logic and record findings to context report."""
        ...


class ScanContext:
    """Provides unified access to document parts during validation.

    Lazily loads and caches document components to avoid redundant parsing
    when multiple detectors examine the same content.
    """

    def __init__(self, pkg_dir: Path, report: ValidationReport):
        self._pkg_dir = pkg_dir
        self.report = report

    @cached_property
    def document_root(self) -> ET.Element:
        """Parse and return the main document.xml root element."""
        doc_path = self._pkg_dir / "word" / "document.xml"
        if not doc_path.exists():
            raise FileNotFoundError(f"Missing document.xml in {self._pkg_dir}")
        return ET.parse(doc_path).getroot()

    @cached_property
    def parent_map(self) -> dict[ET.Element, ET.Element]:
        """Build child-to-parent mapping for element traversal."""
        return {child: parent for parent in self.document_root.iter() for child in parent}

    @cached_property
    def relationships(self) -> dict[str, str]:
        """Build mapping from relationship ID to target path."""
        rels_path = self._pkg_dir / "word" / "_rels" / "document.xml.rels"
        if not rels_path.exists():
            return {}

        result = {}
        tree = ET.parse(rels_path)
        for rel in tree.findall(".//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"):
            rid = rel.get("Id", "")
            target = rel.get("Target", "")
            if rid and target:
                result[rid] = target
        return result

    @property
    def word_dir(self) -> Path:
        """Path to the word/ subdirectory."""
        return self._pkg_dir / "word"

    @cached_property
    def styles_root(self) -> ET.Element | None:
        """Parse and return styles.xml root if available."""
        styles_path = self.word_dir / "styles.xml"
        if not styles_path.exists():
            return None
        return ET.parse(styles_path).getroot()

    @cached_property
    def toc_style_ids(self) -> set[str]:
        """Collect paragraph style IDs that represent TOC entries."""
        return self._collect_style_ids(("toc", "目录"))

    @cached_property
    def heading_style_ids(self) -> set[str]:
        """Collect paragraph style IDs that represent heading entries."""
        return self._collect_style_ids(("heading", "标题"))

    def _collect_style_ids(self, keywords: tuple[str, ...]) -> set[str]:
        styles = self.styles_root
        if styles is None:
            return set()

        ids: set[str] = set()
        for style in styles.findall(f".//{{{WML}}}style"):
            style_type = style.get(f"{{{WML}}}type") or style.get("type")
            if style_type and style_type != "paragraph":
                continue

            style_id = style.get(f"{{{WML}}}styleId") or style.get("styleId")
            if not style_id:
                continue

            terms = [style_id]
            name = style.find(f"{{{WML}}}name")
            aliases = style.find(f"{{{WML}}}aliases")
            based_on = style.find(f"{{{WML}}}basedOn")
            if name is not None:
                terms.append(name.get(f"{{{WML}}}val") or name.get("val") or "")
            if aliases is not None:
                terms.append(aliases.get(f"{{{WML}}}val") or aliases.get("val") or "")
            if based_on is not None:
                terms.append(based_on.get(f"{{{WML}}}val") or based_on.get("val") or "")

            blob = " ".join(terms).lower()
            if any(keyword.lower() in blob for keyword in keywords):
                ids.add(style_id)

        return ids

    def paragraph_style_id(self, paragraph: ET.Element) -> str | None:
        """Return paragraph style ID, if present."""
        ppr = paragraph.find(f"{{{WML}}}pPr")
        if ppr is None:
            return None

        pstyle = ppr.find(f"{{{WML}}}pStyle")
        if pstyle is None:
            return None

        return pstyle.get(f"{{{WML}}}val") or pstyle.get("val")

    def is_toc_style_id(self, style_id: str) -> bool:
        """Check whether a style ID should be treated as TOC style."""
        sid = style_id.strip()
        return TOC_STYLE_RE.match(sid) is not None or sid in self.toc_style_ids

    def is_heading_style_id(self, style_id: str) -> bool:
        """Check whether a style ID should be treated as heading style."""
        sid = style_id.strip()
        return HEADING_STYLE_RE.match(sid) is not None or sid in self.heading_style_ids


class GridConsistencyDetector:
    """Verifies table grid definitions align with actual cell widths.

    Tables in OOXML define column widths in tblGrid, and each cell can
    specify its own width. Mismatches cause rendering unpredictability.
    """
    name = "grid-consistency"

    def scan(self, ctx: ScanContext) -> None:
        tables = ctx.document_root.findall(f".//{{{WML}}}tbl")

        for idx, tbl in enumerate(tables, 1):
            grid = tbl.find(f"{{{WML}}}tblGrid")
            if grid is None:
                continue

            grid_cols = grid.findall(f"{{{WML}}}gridCol")
            defined_widths = []
            for col in grid_cols:
                w = col.get(f"{{{WML}}}w")
                if w and w.isdigit():
                    defined_widths.append(int(w))

            if not defined_widths:
                continue

            for row_idx, tr in enumerate(tbl.findall(f"{{{WML}}}tr"), 1):
                cells = tr.findall(f"{{{WML}}}tc")
                col_cursor = 0

                for tc in cells:
                    tc_pr = tc.find(f"{{{WML}}}tcPr")
                    if tc_pr is None:
                        col_cursor += 1
                        continue

                    span_elem = tc_pr.find(f"{{{WML}}}gridSpan")
                    span = 1
                    if span_elem is not None:
                        val = span_elem.get(f"{{{WML}}}val")
                        if val and val.isdigit():
                            span = int(val)

                    tc_w = tc_pr.find(f"{{{WML}}}tcW")
                    if tc_w is not None:
                        cell_width = tc_w.get(f"{{{WML}}}w")
                        if cell_width and cell_width.isdigit():
                            expected = sum(defined_widths[col_cursor:col_cursor + span])
                            actual = int(cell_width)
                            # Use 8% tolerance to allow for rounding in grid calculations
                            if expected > 0 and abs(actual - expected) / expected > 0.08:
                                ctx.report.warning(
                                    f"table[{idx}]/row[{row_idx}]",
                                    f"Cell width {actual} deviates from grid sum {expected}"
                                )

                    col_cursor += span


class AspectRatioDetector:
    """Checks that embedded images preserve their original proportions.

    Distorted images indicate cx/cy values were modified without
    maintaining the source aspect ratio.
    """
    name = "aspect-ratio"

    def scan(self, ctx: ScanContext) -> None:
        try:
            from PIL import Image
        except ImportError:
            return

        drawings = ctx.document_root.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip")

        for blip in drawings:
            embed = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
            if not embed or embed not in ctx.relationships:
                continue

            target = ctx.relationships[embed]
            img_path = ctx.word_dir / target

            if not img_path.exists():
                continue

            try:
                with Image.open(img_path) as img:
                    src_w, src_h = img.size
                    if src_h == 0:
                        continue
                    src_ratio = src_w / src_h
            except Exception:
                logger.exception(f"Failed to open image: {img_path}")
                continue

            extent = ctx.parent_map.get(blip)
            while extent is not None and not extent.tag.endswith("}extent"):
                extent = ctx.parent_map.get(extent)

            if extent is None:
                continue

            cx = extent.get("cx")
            cy = extent.get("cy")
            if not cx or not cy:
                continue

            try:
                doc_ratio = int(cx) / int(cy)
            except (ValueError, ZeroDivisionError):
                continue

            # Allow 3% deviation for minor rounding differences
            if abs(src_ratio - doc_ratio) / src_ratio > 0.03:
                ctx.report.warning(
                    f"image/{embed}",
                    f"Aspect ratio changed from {src_ratio:.2f} to {doc_ratio:.2f}"
                )


class AnnotationLinkDetector:
    """Validates comment references have corresponding definitions.

    Comments in OOXML span from commentRangeStart to commentRangeEnd,
    referencing entries in comments.xml. Orphaned references cause errors.
    """
    name = "annotation-links"

    def scan(self, ctx: ScanContext) -> None:
        comments_file = ctx.word_dir / "comments.xml"

        range_starts = ctx.document_root.findall(f".//{{{WML}}}commentRangeStart")
        referenced_ids = {rs.get(f"{{{WML}}}id") for rs in range_starts if rs.get(f"{{{WML}}}id")}

        if not referenced_ids:
            return

        if not comments_file.exists():
            for rid in referenced_ids:
                ctx.report.blocker(
                    f"comment/{rid}",
                    "Comment reference exists but comments.xml is missing"
                )
            return

        comments_tree = ET.parse(comments_file)
        defined_ids = set()
        for comment in comments_tree.findall(f".//{{{WML}}}comment"):
            cid = comment.get(f"{{{WML}}}id")
            if cid:
                defined_ids.add(cid)

        orphans = referenced_ids - defined_ids
        for oid in orphans:
            ctx.report.blocker(
                f"comment/{oid}",
                "Reference points to undefined comment entry"
            )


class BookmarkIntegrityDetector:
    """Validates bookmark start/end pairs are properly matched.

    Bookmarks require both bookmarkStart and bookmarkEnd with matching IDs.
    Unmatched bookmarks cause cross-reference failures.
    """
    name = "bookmark-integrity"

    def scan(self, ctx: ScanContext) -> None:
        starts = ctx.document_root.findall(f".//{{{WML}}}bookmarkStart")
        ends = ctx.document_root.findall(f".//{{{WML}}}bookmarkEnd")

        start_ids = {s.get(f"{{{WML}}}id") for s in starts if s.get(f"{{{WML}}}id")}
        end_ids = {e.get(f"{{{WML}}}id") for e in ends if e.get(f"{{{WML}}}id")}

        # Check for orphaned starts (no matching end)
        orphan_starts = start_ids - end_ids
        for oid in orphan_starts:
            ctx.report.warning(
                f"bookmark/{oid}",
                "bookmarkStart has no matching bookmarkEnd"
            )

        # Check for orphaned ends (no matching start)
        orphan_ends = end_ids - start_ids
        for oid in orphan_ends:
            ctx.report.warning(
                f"bookmark/{oid}",
                "bookmarkEnd has no matching bookmarkStart"
            )


class DrawingIdUniquenessDetector:
    """Ensures drawing element IDs are unique across the document.

    Duplicate docPr id values cause rendering issues in some viewers
    and may result in images not displaying correctly.
    """
    name = "drawing-id-uniqueness"

    def scan(self, ctx: ScanContext) -> None:
        doc_prs = ctx.document_root.findall(f".//{{{WP}}}docPr")

        seen_ids: dict[str, int] = {}
        for doc_pr in doc_prs:
            id_val = doc_pr.get("id")
            if not id_val:
                continue

            if id_val in seen_ids:
                seen_ids[id_val] += 1
            else:
                seen_ids[id_val] = 1

        for id_val, count in seen_ids.items():
            if count > 1:
                ctx.report.warning(
                    f"drawing/docPr[@id={id_val}]",
                    f"Duplicate drawing ID found {count} times"
                )


class HyperlinkValidityDetector:
    """Checks that hyperlinks have valid relationship targets.

    Hyperlinks referencing missing relationships will not work
    when clicked in Word.
    """
    name = "hyperlink-validity"

    def scan(self, ctx: ScanContext) -> None:
        hyperlinks = ctx.document_root.findall(f".//{{{WML}}}hyperlink")

        for hl in hyperlinks:
            rid = hl.get(f"{{{REL}}}id")
            if rid and rid not in ctx.relationships:
                anchor = hl.get(f"{{{WML}}}anchor", "")
                if not anchor:  # Only flag if no internal anchor either
                    ctx.report.warning(
                        f"hyperlink/{rid}",
                        "Hyperlink references missing relationship"
                    )


class SectionIsolationDetector:
    """Checks that cover pages are properly isolated with section breaks.

    Cover pages using excessive spacing (Gaps) without section breaks
    risk content overflow on smaller paper sizes (A5, B5).
    """
    name = "section-isolation"

    # Threshold: if total spacing before first page break exceeds this, warn
    SPACING_THRESHOLD_TWIPS = 4000  # ~200pt

    def scan(self, ctx: ScanContext) -> None:
        body = ctx.document_root.find(f".//{{{WML}}}body")
        if body is None:
            return

        total_spacing = 0
        found_section_break = False
        paragraph_count = 0

        for elem in body:
            if elem.tag != f"{{{WML}}}p":
                continue

            paragraph_count += 1
            pPr = elem.find(f"{{{WML}}}pPr")

            # Check for section break
            if pPr is not None:
                sectPr = pPr.find(f"{{{WML}}}sectPr")
                if sectPr is not None:
                    found_section_break = True
                    break

                # Accumulate spacing
                spacing = pPr.find(f"{{{WML}}}spacing")
                if spacing is not None:
                    before = spacing.get(f"{{{WML}}}before") or spacing.get("before") or "0"
                    after = spacing.get(f"{{{WML}}}after") or spacing.get("after") or "0"
                    try:
                        total_spacing += int(before) + int(after)
                    except ValueError:
                        pass

            # Check for page break in runs
            for run in elem.findall(f".//{{{WML}}}br"):
                br_type = run.get(f"{{{WML}}}type") or run.get("type")
                if br_type == "page":
                    # Page break found before section break
                    if total_spacing > self.SPACING_THRESHOLD_TWIPS and not found_section_break:
                        ctx.report.warning(
                            "cover/spacing-overflow-risk",
                            (
                                f"High spacing ({total_spacing} twips) detected before first page break "
                                f"without section isolation. On small paper (A5/B5), cover content may overflow. "
                                f"Consider using SectionProperties with NextPage type."
                            ),
                        )
                    return

        # No page break found in first several paragraphs
        if paragraph_count > 10 and total_spacing > self.SPACING_THRESHOLD_TWIPS:
            ctx.report.warning(
                "cover/no-section-break",
                "Document appears to lack section breaks. Multi-section documents should use explicit sectPr.",
            )


class OutlineLevelDetector:
    """Validates outline level hierarchy for proper TOC structure.

    Detects flat TOC structures where all headings use the same outline level,
    which results in incorrect TOC nesting.
    """
    name = "outline-level"

    def scan(self, ctx: ScanContext) -> None:
        body = ctx.document_root.find(f".//{{{WML}}}body")
        if body is None:
            return

        outline_levels: dict[int, int] = {}  # level -> count

        for para in body.findall(f".//{{{WML}}}p"):
            pPr = para.find(f"{{{WML}}}pPr")
            if pPr is None:
                continue

            outline = pPr.find(f"{{{WML}}}outlineLvl")
            if outline is not None:
                val = outline.get(f"{{{WML}}}val") or outline.get("val")
                if val and val.isdigit():
                    level = int(val)
                    outline_levels[level] = outline_levels.get(level, 0) + 1

        if not outline_levels:
            return

        # Check for flat structure (only one level used with many entries)
        if len(outline_levels) == 1:
            level, count = next(iter(outline_levels.items()))
            if count > 3:
                ctx.report.warning(
                    "toc/flat-hierarchy",
                    (
                        f"All {count} outline entries use level {level}. "
                        "This creates a flat TOC without nesting. "
                        "Consider using multiple levels (e.g., 0 for chapters, 1 for sections)."
                    ),
                )


class HeaderFooterDetector:
    """Checks for header/footer presence in multi-page documents.

    Documents with multiple sections or many paragraphs should typically
    have headers and/or footers for navigation.
    """
    name = "header-footer"

    PARAGRAPH_THRESHOLD = 30  # Suggest headers/footers for documents with 30+ paragraphs

    def scan(self, ctx: ScanContext) -> None:
        body = ctx.document_root.find(f".//{{{WML}}}body")
        if body is None:
            return

        paragraphs = body.findall(f".//{{{WML}}}p")
        if len(paragraphs) < self.PARAGRAPH_THRESHOLD:
            return

        # Check for header/footer references
        has_header = False
        has_footer = False

        for sectPr in ctx.document_root.findall(f".//{{{WML}}}sectPr"):
            if sectPr.find(f"{{{WML}}}headerReference") is not None:
                has_header = True
            if sectPr.find(f"{{{WML}}}footerReference") is not None:
                has_footer = True

        if not has_header and not has_footer:
            ctx.report.warning(
                "document/no-header-footer",
                (
                    f"Document has {len(paragraphs)} paragraphs but no headers or footers. "
                    "Consider adding page numbers or document title for navigation."
                ),
            )


class TocImplementationDetector:
    """Detect TOC implementation mode and stale static TOC risks."""

    name = "toc-implementation"

    def scan(self, ctx: ScanContext) -> None:
        body = ctx.document_root.find(f".//{{{WML}}}body")
        if body is None:
            return

        paragraphs = body.findall(f"{{{WML}}}p")
        toc_indices: list[int] = []
        heading_indices: list[int] = []

        for idx, paragraph in enumerate(paragraphs, 1):
            style_id = ctx.paragraph_style_id(paragraph)
            if not style_id:
                continue

            if ctx.is_toc_style_id(style_id):
                toc_indices.append(idx)
            if ctx.is_heading_style_id(style_id):
                heading_indices.append(idx)

        if not toc_indices:
            return

        has_toc_field = False
        for field in ctx.document_root.findall(f".//{{{WML}}}fldSimple"):
            instr = field.get(f"{{{WML}}}instr") or field.get("instr") or ""
            if "TOC" in instr.upper():
                has_toc_field = True
                break
        if not has_toc_field:
            for instr_text in ctx.document_root.findall(f".//{{{WML}}}instrText"):
                text = (instr_text.text or "").upper()
                if "TOC" in text:
                    has_toc_field = True
                    break

        if not has_toc_field:
            ctx.report.warning(
                "toc/static",
                (
                    f"Detected {len(toc_indices)} TOC-style paragraphs but no TOC field. "
                    "Template flow should remove stale TOC entries and rebuild TOC from current headings."
                ),
            )

        if heading_indices and len(toc_indices) > len(heading_indices) * 2:
            ctx.report.warning(
                "toc/mismatch",
                (
                    f"TOC-style paragraph count ({len(toc_indices)}) is much higher than heading count "
                    f"({len(heading_indices)}). Possible leftover template TOC entries."
                ),
            )

        if heading_indices:
            first_heading = min(heading_indices)
            leaked_toc = [idx for idx in toc_indices if idx > first_heading]
            if leaked_toc:
                ctx.report.warning(
                    "toc/leakage",
                    (
                        "TOC-style paragraphs appear after body headings. "
                        "Likely TOC content leaked into main body and should be cleaned."
                    ),
                )
