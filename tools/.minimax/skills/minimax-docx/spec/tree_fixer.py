"""
XML tree node reordering utilities.

Provides functions to sort child elements according to ECMA-376 schema sequences.
Uses stable sorting to preserve relative order of unrecognized elements.
"""

from __future__ import annotations

from typing import Sequence
from xml.etree.ElementTree import Element


def tag_name(clark_notation: str) -> str:
    """Extract local name from Clark notation {uri}localname.

    Args:
        clark_notation: Element tag in form {namespace}name or just name

    Returns:
        The local name portion without namespace
    """
    close_brace = clark_notation.rfind("}")
    if close_brace == -1:
        return clark_notation
    return clark_notation[close_brace + 1:]


def make_rank_index(sequence: Sequence[str]) -> dict[str, int]:
    """Create priority mapping from element sequence.

    Args:
        sequence: Ordered list of element local names

    Returns:
        Dictionary mapping each name to its position index
    """
    return {name: idx for idx, name in enumerate(sequence)}


def sort_by_spec(container: Element, spec_order: Sequence[str]) -> bool:
    """Rearrange children of container to match specification order.

    Elements not found in spec_order retain their relative positions
    and are placed after all recognized elements.

    Args:
        container: Parent XML element whose children will be reordered
        spec_order: Sequence of local element names in correct order

    Returns:
        True if any elements were moved, False if already ordered
    """
    children = list(container)
    if len(children) < 2:
        return False

    rank_map = make_rank_index(spec_order)
    unknown_rank = len(spec_order)

    # Track original indices for stable sort of unrecognized elements
    orig_pos = {id(elem): i for i, elem in enumerate(children)}

    def ordering_key(elem: Element) -> tuple[int, int]:
        local = tag_name(elem.tag)
        rank = rank_map.get(local, unknown_rank)
        return (rank, orig_pos[id(elem)])

    sorted_children = sorted(children, key=ordering_key)

    # Check if reordering needed
    if all(a is b for a, b in zip(children, sorted_children)):
        return False

    # Rebuild child list
    for child in children:
        container.remove(child)
    container.extend(sorted_children)

    return True
