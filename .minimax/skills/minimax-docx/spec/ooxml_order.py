"""Layered OOXML child-order registry.

This module models WordprocessingML child order as constraint layers:
- MUST: strict schema anchors that should always be respected
- SHOULD: high-value ordering hints for better compatibility
- MAY: low-risk optional guidance
- VENDOR: implementation-specific tail hints

Public compatibility contract remains `CONTAINER_ORDERS[str, tuple[str, ...]]`.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Sequence

try:
    from enum import StrEnum
except ImportError:  # pragma: no cover - Python < 3.11
    class StrEnum(str, Enum):
        """Compatibility shim for Python versions without enum.StrEnum."""


class RuleLevel(StrEnum):
    MUST = "must"
    SHOULD = "should"
    MAY = "may"
    VENDOR = "vendor"


DEFAULT_PROFILE = "repair"
PROFILE_LEVELS: dict[str, tuple[RuleLevel, ...]] = {
    "minimal": (RuleLevel.MUST,),
    "repair": (RuleLevel.MUST, RuleLevel.SHOULD),
    "compat": (RuleLevel.MUST, RuleLevel.SHOULD, RuleLevel.MAY),
    "strict": (RuleLevel.MUST, RuleLevel.SHOULD, RuleLevel.MAY, RuleLevel.VENDOR),
}


def _levels_for_profile(profile: str) -> tuple[RuleLevel, ...]:
    return PROFILE_LEVELS.get(profile, PROFILE_LEVELS[DEFAULT_PROFILE])


def _flatten_unique(parts: Iterable[tuple[str, ...]]) -> tuple[str, ...]:
    ordered: list[str] = []
    seen: set[str] = set()
    for part in parts:
        for element in part:
            if element in seen:
                continue
            ordered.append(element)
            seen.add(element)
    return tuple(ordered)


@dataclass(frozen=True)
class AssemblyPhase:
    name: str
    elements: tuple[str, ...]
    level: RuleLevel


@dataclass(frozen=True)
class ContainerOrder:
    name: str
    phases: tuple[AssemblyPhase, ...]

    @property
    def sequence(self) -> tuple[str, ...]:
        return self.build_sequence(DEFAULT_PROFILE)

    def build_sequence(self, profile: str = DEFAULT_PROFILE) -> tuple[str, ...]:
        levels = _levels_for_profile(profile)
        return _flatten_unique(phase.elements for phase in self.phases if phase.level in levels)

    def active_phases(self, profile: str = DEFAULT_PROFILE) -> tuple[AssemblyPhase, ...]:
        levels = _levels_for_profile(profile)
        return tuple(phase for phase in self.phases if phase.level in levels)


def _phase(level: RuleLevel, name: str, *elements: str) -> AssemblyPhase:
    return AssemblyPhase(name=name, elements=tuple(elements), level=level)


ORDER_BOOK: dict[str, ContainerOrder] = {
    "rPr": ContainerOrder(
        name="rPr",
        phases=(
            _phase(RuleLevel.MUST, "must-core", "rStyle", "rFonts", "b", "i", "color", "sz", "szCs", "u", "rtl"),
            _phase(
                RuleLevel.SHOULD,
                "should-emphasis",
                "bCs",
                "iCs",
                "caps",
                "smallCaps",
                "strike",
                "dstrike",
                "highlight",
                "vertAlign",
                "lang",
                "oMath",
            ),
            _phase(RuleLevel.MAY, "may-typography", "spacing", "w", "kern", "position", "fitText", "eastAsianLayout"),
            _phase(RuleLevel.VENDOR, "vendor-tail", "specVanish"),
        ),
    ),
    "pPr": ContainerOrder(
        name="pPr",
        phases=(
            _phase(RuleLevel.MUST, "must-layout", "pStyle", "numPr", "pBdr", "tabs", "spacing", "ind", "jc", "rPr", "sectPr"),
            _phase(
                RuleLevel.SHOULD,
                "should-flow-control",
                "keepNext",
                "keepLines",
                "pageBreakBefore",
                "widowControl",
                "textDirection",
                "textAlignment",
                "outlineLvl",
                "pPrChange",
            ),
            _phase(RuleLevel.MAY, "may-asian-layout", "kinsoku", "wordWrap", "autoSpaceDE", "autoSpaceDN", "snapToGrid"),
            _phase(RuleLevel.VENDOR, "vendor-formatting", "divId", "cnfStyle"),
        ),
    ),
    "sectPr": ContainerOrder(
        name="sectPr",
        phases=(
            _phase(RuleLevel.MUST, "must-page-model", "type", "pgSz", "pgMar", "cols", "docGrid"),
            _phase(
                RuleLevel.SHOULD,
                "should-section-flags",
                "headerReference",
                "footerReference",
                "footnotePr",
                "endnotePr",
                "titlePg",
                "textDirection",
                "bidi",
                "rtlGutter",
            ),
            _phase(RuleLevel.MAY, "may-page-extensions", "paperSrc", "pgBorders", "lnNumType", "pgNumType", "printerSettings"),
            _phase(RuleLevel.VENDOR, "vendor-tail", "sectPrChange"),
        ),
    ),
    "tcPr": ContainerOrder(
        name="tcPr",
        phases=(
            _phase(RuleLevel.MUST, "must-cell", "tcW", "gridSpan", "hMerge", "vMerge", "tcBorders", "tcMar", "vAlign"),
            _phase(RuleLevel.SHOULD, "should-cell-layout", "cnfStyle", "shd", "noWrap", "textDirection", "tcFitText", "hideMark"),
            _phase(RuleLevel.MAY, "may-cell-revision", "headers", "cellIns", "cellDel", "cellMerge"),
            _phase(RuleLevel.VENDOR, "vendor-tail", "tcPrChange"),
        ),
    ),
    "tblPr": ContainerOrder(
        name="tblPr",
        phases=(
            _phase(RuleLevel.MUST, "must-table", "tblStyle", "tblW", "jc", "tblBorders", "tblLayout", "tblCellMar", "tblLook"),
            _phase(
                RuleLevel.SHOULD,
                "should-table-layout",
                "tblpPr",
                "tblCellSpacing",
                "tblInd",
                "shd",
                "tblStyleRowBandSize",
                "tblStyleColBandSize",
            ),
            _phase(RuleLevel.MAY, "may-table-meta", "tblOverlap", "bidiVisual", "tblCaption", "tblDescription"),
            _phase(RuleLevel.VENDOR, "vendor-tail", "tblPrChange"),
        ),
    ),
    "tblBorders": ContainerOrder(
        name="tblBorders",
        phases=(
            _phase(RuleLevel.MUST, "must-outer-and-inner", "top", "left", "bottom", "right", "insideH", "insideV"),
            _phase(RuleLevel.MAY, "may-bidi-edges", "start", "end"),
        ),
    ),
    "pBdr": ContainerOrder(
        name="pBdr",
        phases=(_phase(RuleLevel.MUST, "must-border-loop", "top", "left", "bottom", "right", "between", "bar"),),
    ),
    "tcMar": ContainerOrder(
        name="tcMar",
        phases=(
            _phase(RuleLevel.MUST, "must-box", "top", "left", "bottom", "right"),
            _phase(RuleLevel.SHOULD, "should-bidi", "start", "end"),
        ),
    ),
    "tblCellMar": ContainerOrder(
        name="tblCellMar",
        phases=(
            _phase(RuleLevel.MUST, "must-box", "top", "left", "bottom", "right"),
            _phase(RuleLevel.SHOULD, "should-bidi", "start", "end"),
        ),
    ),
    "lvl": ContainerOrder(
        name="lvl",
        phases=(
            _phase(RuleLevel.MUST, "must-numbering", "start", "numFmt", "lvlText", "lvlJc", "pPr", "rPr"),
            _phase(RuleLevel.SHOULD, "should-numbering-controls", "lvlRestart", "pStyle", "isLgl", "suff", "lvlPicBulletId"),
            _phase(RuleLevel.MAY, "may-legacy", "legacy"),
        ),
    ),
    "numbering": ContainerOrder(
        name="numbering",
        phases=(
            _phase(RuleLevel.MUST, "must-numbering-root", "abstractNum", "num"),
            _phase(RuleLevel.SHOULD, "should-numbering-extensions", "numPicBullet"),
            _phase(RuleLevel.VENDOR, "vendor-tail", "numIdMacAtCleanup"),
        ),
    ),
    "tr": ContainerOrder(
        name="tr",
        phases=(
            _phase(RuleLevel.MUST, "must-row-core", "tblPrEx", "trPr", "tc"),
            _phase(RuleLevel.SHOULD, "should-row-content", "customXml", "sdt", "bookmarkStart", "bookmarkEnd"),
            _phase(
                RuleLevel.MAY,
                "may-ranges",
                "commentRangeStart",
                "commentRangeEnd",
                "moveFromRangeStart",
                "moveFromRangeEnd",
                "moveToRangeStart",
                "moveToRangeEnd",
            ),
            _phase(
                RuleLevel.VENDOR,
                "vendor-ranges",
                "customXmlInsRangeStart",
                "customXmlInsRangeEnd",
                "customXmlDelRangeStart",
                "customXmlDelRangeEnd",
                "customXmlMoveFromRangeStart",
                "customXmlMoveFromRangeEnd",
                "customXmlMoveToRangeStart",
                "customXmlMoveToRangeEnd",
            ),
        ),
    ),
    "style": ContainerOrder(
        name="style",
        phases=(
            _phase(RuleLevel.MUST, "must-style-identity", "name", "basedOn", "next", "qFormat"),
            _phase(RuleLevel.SHOULD, "should-style-switches", "aliases", "link", "uiPriority", "semiHidden", "unhideWhenUsed", "locked", "rsid"),
            _phase(RuleLevel.MUST, "must-style-payload", "pPr", "rPr", "tblPr", "trPr", "tcPr", "tblStylePr"),
            _phase(RuleLevel.MAY, "may-style-personalization", "autoRedefine", "hidden", "personal", "personalCompose", "personalReply"),
        ),
    ),
    "tbl": ContainerOrder(
        name="tbl",
        phases=(
            _phase(RuleLevel.MUST, "must-table-core", "tblPr", "tblGrid", "tr"),
            _phase(RuleLevel.SHOULD, "should-table-anchors", "bookmarkStart", "bookmarkEnd", "commentRangeStart", "commentRangeEnd"),
            _phase(RuleLevel.MAY, "may-move-ranges", "moveFromRangeStart", "moveFromRangeEnd", "moveToRangeStart", "moveToRangeEnd"),
            _phase(
                RuleLevel.VENDOR,
                "vendor-custom-ranges",
                "customXmlInsRangeStart",
                "customXmlInsRangeEnd",
                "customXmlDelRangeStart",
                "customXmlDelRangeEnd",
                "customXmlMoveFromRangeStart",
                "customXmlMoveFromRangeEnd",
                "customXmlMoveToRangeStart",
                "customXmlMoveToRangeEnd",
            ),
        ),
    ),
    "body": ContainerOrder(
        name="body",
        phases=(
            _phase(RuleLevel.MUST, "must-main-flow", "p", "tbl"),
            _phase(RuleLevel.SHOULD, "should-embedded-blocks", "customXml", "sdt", "altChunk"),
            _phase(RuleLevel.MAY, "may-ranges", "bookmarkStart", "bookmarkEnd", "commentRangeStart", "commentRangeEnd"),
            _phase(
                RuleLevel.VENDOR,
                "vendor-move-ranges",
                "moveFromRangeStart",
                "moveFromRangeEnd",
                "moveToRangeStart",
                "moveToRangeEnd",
                "customXmlInsRangeStart",
                "customXmlInsRangeEnd",
                "customXmlDelRangeStart",
                "customXmlDelRangeEnd",
                "customXmlMoveFromRangeStart",
                "customXmlMoveFromRangeEnd",
                "customXmlMoveToRangeStart",
                "customXmlMoveToRangeEnd",
            ),
            _phase(RuleLevel.MUST, "must-tail", "sectPr"),
        ),
    ),
    "settings": ContainerOrder(
        name="settings",
        phases=(
            _phase(
                RuleLevel.MUST,
                "must-core",
                "writeProtection",
                "view",
                "zoom",
                "trackRevisions",
                "documentProtection",
                "defaultTabStop",
                "defaultTableStyle",
                "compat",
                "rsids",
                "mathPr",
                "themeFontLang",
                "clrSchemeMapping",
            ),
            _phase(
                RuleLevel.SHOULD,
                "should-proofing-and-layout",
                "hideSpellingErrors",
                "hideGrammaticalErrors",
                "proofState",
                "attachedTemplate",
                "linkStyles",
                "evenAndOddHeaders",
                "bookFoldPrinting",
                "bookFoldPrintingSheets",
                "drawingGridHorizontalSpacing",
                "drawingGridVerticalSpacing",
                "characterSpacingControl",
            ),
            _phase(
                RuleLevel.MAY,
                "may-xml-handling",
                "doNotValidateAgainstSchema",
                "saveInvalidXml",
                "ignoreMixedContent",
                "showXMLTags",
                "alwaysMergeEmptyNamespace",
                "updateFields",
            ),
            _phase(RuleLevel.VENDOR, "vendor-tail", "docId", "defaultImageDpi", "conflictMode", "decimalSymbol", "listSeparator"),
        ),
    ),
}


def build_container_orders(profile: str = DEFAULT_PROFILE) -> dict[str, tuple[str, ...]]:
    return {container: spec.build_sequence(profile) for container, spec in ORDER_BOOK.items()}


CONTAINER_ORDERS: dict[str, tuple[str, ...]] = build_container_orders(DEFAULT_PROFILE)


class LayeredSchemaProvider:
    """SchemaProvider-compatible view over layered order rules."""

    def __init__(self, profile: str = DEFAULT_PROFILE) -> None:
        if profile not in PROFILE_LEVELS:
            raise ValueError(f"unknown profile: {profile}")
        self._profile = profile

    @property
    def profile(self) -> str:
        return self._profile

    def get_child_order(self, container_name: str) -> Sequence[str] | None:
        return get_child_order(container_name, profile=self._profile)

    def get_all_containers(self) -> Sequence[str]:
        return tuple(sorted(ORDER_BOOK))


def known_profiles() -> tuple[str, ...]:
    return tuple(PROFILE_LEVELS)


def get_child_order(container: str, profile: str = DEFAULT_PROFILE) -> tuple[str, ...] | None:
    spec = ORDER_BOOK.get(container)
    if spec is None:
        return None
    return spec.build_sequence(profile)


def get_phase_plan(container: str, profile: str = DEFAULT_PROFILE) -> tuple[AssemblyPhase, ...] | None:
    spec = ORDER_BOOK.get(container)
    return spec.active_phases(profile) if spec else None


def explain_container(container: str, profile: str = DEFAULT_PROFILE) -> str:
    spec = ORDER_BOOK.get(container)
    if spec is None:
        return f"{container}: not registered"

    sequence = spec.build_sequence(profile)
    phases = spec.active_phases(profile)
    pieces = [f"{container}: {len(sequence)} elems ({profile})"]
    for phase in phases:
        pieces.append(f"{phase.level}:{phase.name}[{len(phase.elements)}]")
    return " | ".join(pieces)
