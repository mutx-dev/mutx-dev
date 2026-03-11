"""Document validation framework for OOXML compliance checking."""

from .report import Gravity, Issue, ValidationReport
from .detectors import (
    ScanContext,
    GridConsistencyDetector,
    AspectRatioDetector,
    AnnotationLinkDetector,
    BookmarkIntegrityDetector,
    DrawingIdUniquenessDetector,
    HyperlinkValidityDetector,
    TocImplementationDetector,
)
from .pipeline import ValidationPipeline, validate_document

__all__ = [
    "Gravity",
    "Issue",
    "ValidationReport",
    "ScanContext",
    "GridConsistencyDetector",
    "AspectRatioDetector",
    "AnnotationLinkDetector",
    "BookmarkIntegrityDetector",
    "DrawingIdUniquenessDetector",
    "HyperlinkValidityDetector",
    "TocImplementationDetector",
    "ValidationPipeline",
    "validate_document",
]
