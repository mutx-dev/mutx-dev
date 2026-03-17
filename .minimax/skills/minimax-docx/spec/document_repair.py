"""
Tree repair utilities for WordprocessingML documents.

The fixer focuses on schema-order normalization and pragmatic structural recovery
for common generator mistakes (body section placement, loose border items,
and table width drift).
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol, Sequence
from xml.etree.ElementTree import Element

from .ns import W, clark
from .ooxml_order import LayeredSchemaProvider
from .tree_fixer import sort_by_spec, tag_name


class SchemaProvider(Protocol):
    def get_child_order(self, container_name: str) -> Sequence[str] | None:
        ...

    def get_all_containers(self) -> Sequence[str]:
        ...


@dataclass(frozen=True)
class RepairEvent:
    action: str
    container: str
    detail: str
    touched: int = 1


class DocumentFixer:
    _BORDER_LEAVES = frozenset({"top", "left", "bottom", "right", "between", "bar"})

    def __init__(self, schema_provider: SchemaProvider) -> None:
        self._schema = schema_provider
        self._events: list[RepairEvent] = []

    @property
    def events(self) -> tuple[RepairEvent, ...]:
        """Return an immutable trace of structural repairs from the last run."""
        return tuple(self._events)

    def clear_events(self) -> None:
        self._events.clear()

    def fix_all(self, root: Element) -> int:
        """Apply all structural fixes and return number of effective mutations."""
        self.clear_events()
        changes = 0

        for node in root.iter():
            local = tag_name(node.tag)
            if local == "pPr":
                moved = self.wrap_border_group(node)
                if moved:
                    self._record("wrap-border-group", local, "moved loose border leaves into pBdr", moved)
                    changes += moved

            order = self._schema.get_child_order(local)
            if order and sort_by_spec(node, order):
                self._record("reorder-children", local, "reordered children to schema sequence")
                changes += 1

            if local == "body" and self.ensure_sectpr_last(node):
                self._record("body-tail-normalize", local, "moved sectPr to trailing position")
                changes += 1

        return changes

    def align_grid(self, root: Element) -> int:
        """Align table cell widths (`tcW`) with `tblGrid` definitions."""
        w_attr = f"{{{W}}}w"
        type_attr = f"{{{W}}}type"
        val_attr = f"{{{W}}}val"

        parent_map = self._build_parent_map(root)
        touched = 0

        for table in self._iter_non_nested_tables(root, parent_map):
            grid = table.find(clark("tblGrid"))
            widths = self._grid_widths(grid, w_attr)
            if not widths:
                continue

            for row in table.findall(clark("tr")):
                cursor = 0
                for cell in row.findall(clark("tc")):
                    tc_pr = cell.find(clark("tcPr"))
                    if tc_pr is None:
                        cursor += 1
                        continue

                    span = self._node_int(tc_pr.find(clark("gridSpan")), val_attr, fallback=1)
                    end = cursor + span

                    tc_w = tc_pr.find(clark("tcW"))
                    if tc_w is None or end > len(widths):
                        cursor = end
                        continue

                    unit = tc_w.get(type_attr)
                    if unit not in (None, "", "dxa"):
                        cursor = end
                        continue

                    actual = self._safe_int(tc_w.get(w_attr))
                    expected = sum(widths[cursor:end])
                    if actual is None or expected <= 0:
                        cursor = end
                        continue

                    drift = abs(actual - expected) / expected
                    if drift > 0.04:
                        tc_w.set(w_attr, str(expected))
                        self._record(
                            "align-grid",
                            "tcW",
                            f"adjusted width from {actual} to {expected}",
                        )
                        touched += 1

                    cursor = end

        return touched

    def ensure_sectpr_last(self, body: Element) -> bool:
        """Rebuild body children so all `sectPr` nodes are placed at the end."""
        children = list(body)
        if not children:
            return False

        section_nodes = [node for node in children if tag_name(node.tag) == "sectPr"]
        if not section_nodes:
            return False

        content_nodes = [node for node in children if tag_name(node.tag) != "sectPr"]
        reordered = content_nodes + section_nodes

        if all(a is b for a, b in zip(children, reordered)):
            return False

        for child in children:
            body.remove(child)
        for child in reordered:
            body.append(child)

        return True

    def wrap_border_group(self, ppr: Element) -> int:
        """Move loose border leaves in `pPr` under a canonical `pBdr` node."""
        loose = [node for node in list(ppr) if tag_name(node.tag) in self._BORDER_LEAVES]
        if not loose:
            return 0

        pbdr = ppr.find(clark("pBdr"))
        if pbdr is None:
            pbdr = Element(clark("pBdr"))
            self._insert_at_schema_slot(ppr, pbdr, slot_name="pBdr")

        for node in loose:
            ppr.remove(node)
            pbdr.append(node)

        border_order = self._schema.get_child_order("pBdr")
        if border_order:
            sort_by_spec(pbdr, border_order)

        return len(loose)

    def _insert_at_schema_slot(self, parent: Element, node: Element, slot_name: str) -> None:
        order = self._schema.get_child_order(tag_name(parent.tag))
        if not order or slot_name not in order:
            parent.append(node)
            return

        rank = {name: idx for idx, name in enumerate(order)}
        slot_rank = rank[slot_name]

        insert_index = len(list(parent))
        for idx, child in enumerate(parent):
            child_rank = rank.get(tag_name(child.tag), len(rank) + idx)
            if child_rank > slot_rank:
                insert_index = idx
                break

        parent.insert(insert_index, node)

    def _iter_non_nested_tables(self, root: Element, parent_map: dict[Element, Element]) -> Iterable[Element]:
        for table in root.iter(clark("tbl")):
            parent = parent_map.get(table)
            nested = False
            while parent is not None:
                if tag_name(parent.tag) == "tbl":
                    nested = True
                    break
                parent = parent_map.get(parent)
            if not nested:
                yield table

    @staticmethod
    def _build_parent_map(root: Element) -> dict[Element, Element]:
        mapping: dict[Element, Element] = {}
        for parent in root.iter():
            for child in list(parent):
                mapping[child] = parent
        return mapping

    def _grid_widths(self, grid: Element | None, w_attr: str) -> list[int] | None:
        if grid is None:
            return None

        widths: list[int] = []
        for col in grid.findall(clark("gridCol")):
            value = self._safe_int(col.get(w_attr))
            if value is None:
                return None
            widths.append(value)

        return widths or None

    def _node_int(self, node: Element | None, attr: str, fallback: int) -> int:
        if node is None:
            return fallback
        parsed = self._safe_int(node.get(attr))
        if parsed is None or parsed <= 0:
            return fallback
        return parsed

    @staticmethod
    def _safe_int(raw: str | None) -> int | None:
        if raw is None:
            return None
        try:
            return int(raw)
        except ValueError:
            return None

    def _record(self, action: str, container: str, detail: str, touched: int = 1) -> None:
        self._events.append(
            RepairEvent(
                action=action,
                container=container,
                detail=detail,
                touched=touched,
            )
        )


def create_default_fixer(profile: str = "repair") -> DocumentFixer:
    """Build a fixer using the layered order registry profile."""
    return DocumentFixer(LayeredSchemaProvider(profile=profile))
