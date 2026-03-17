"""
OOXML namespace constants as defined by ECMA-376 5th Edition.

These URIs are standardized identifiers for XML namespaces used in Office Open XML documents.
Reference: ECMA-376 Part 1, Annex A
"""

from xml.etree import ElementTree as ET

# ECMA-376 Part 1, Annex A.1 - WordprocessingML namespaces
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# ECMA-376 Part 1, Annex A.4 - DrawingML namespaces
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture"

# ECMA-376 Part 2 - Open Packaging Conventions
PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

# Markup Compatibility namespace
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"

# Office Math ML namespace - ECMA-376 Part 1, Section 22
M = "http://schemas.openxmlformats.org/officeDocument/2006/math"

# Microsoft Word extensions (ISO/IEC 29500:2012 extensions)
W14 = "http://schemas.microsoft.com/office/word/2010/wordml"
W15 = "http://schemas.microsoft.com/office/word/2012/wordml"

# Legacy VML namespace
VML = "urn:schemas-microsoft-com:vml"
OFFICE = "urn:schemas-microsoft-com:office:office"

# Namespace prefix registry for serialization
_NS_PREFIXES = {
    "w": W,
    "r": R,
    "wp": WP,
    "a": A,
    "pic": PIC,
    "mc": MC,
    "m": M,
    "w14": W14,
    "w15": W15,
    "v": VML,
    "o": OFFICE,
}

_registered = False


def ensure_prefixes() -> None:
    """Register namespace prefixes with ElementTree for clean serialization."""
    global _registered
    if _registered:
        return
    for prefix, uri in _NS_PREFIXES.items():
        ET.register_namespace(prefix, uri)
    _registered = True


def clark(local: str, ns: str = W) -> str:
    """Build Clark notation tag: {namespace}localname."""
    ensure_prefixes()
    return f"{{{ns}}}{local}"
