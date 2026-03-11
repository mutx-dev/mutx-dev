"""Validation pipeline orchestrating multiple detectors."""

from pathlib import Path
from tempfile import TemporaryDirectory
import zipfile

from .report import ValidationReport
from .detectors import (
    Detector,
    ScanContext,
    GridConsistencyDetector,
    AspectRatioDetector,
    AnnotationLinkDetector,
    BookmarkIntegrityDetector,
    DrawingIdUniquenessDetector,
    HyperlinkValidityDetector,
    TocImplementationDetector,
)


class ValidationPipeline:
    """Coordinates execution of multiple validation detectors.

    Detectors can be added, disabled, or re-enabled dynamically.
    The pipeline handles document extraction and context setup.
    """

    def __init__(self):
        self._detectors: list[Detector] = []
        self._disabled: set[str] = set()

    def add(self, detector: Detector) -> "ValidationPipeline":
        """Register a detector for execution."""
        self._detectors.append(detector)
        return self

    def skip(self, name: str) -> "ValidationPipeline":
        """Disable a detector by name."""
        self._disabled.add(name)
        return self

    def enable(self, name: str) -> "ValidationPipeline":
        """Re-enable a previously disabled detector."""
        self._disabled.discard(name)
        return self

    def run(self, docx_path: Path) -> ValidationReport:
        """Execute all enabled detectors against the document.

        Args:
            docx_path: Path to the .docx file to validate.

        Returns:
            ValidationReport containing all findings.
        """
        docx_path = Path(docx_path)
        if not docx_path.exists():
            raise FileNotFoundError(f"Document not found: {docx_path}")

        report = ValidationReport()

        with TemporaryDirectory() as tmp:
            extract_dir = Path(tmp) / "unpacked"

            try:
                with zipfile.ZipFile(docx_path, "r") as zf:
                    zf.extractall(extract_dir)
            except zipfile.BadZipFile:
                report.blocker("archive", "File is not a valid ZIP archive")
                return report

            ctx = ScanContext(extract_dir, report)

            for detector in self._detectors:
                if detector.name in self._disabled:
                    continue
                try:
                    detector.scan(ctx)
                except Exception as e:
                    report.warning(
                        f"detector/{detector.name}",
                        f"Detector failed: {type(e).__name__}: {e}"
                    )

        return report

    @classmethod
    def standard(cls) -> "ValidationPipeline":
        """Create a pipeline with all built-in detectors registered."""
        return (
            cls()
            .add(GridConsistencyDetector())
            .add(AspectRatioDetector())
            .add(AnnotationLinkDetector())
            .add(BookmarkIntegrityDetector())
            .add(DrawingIdUniquenessDetector())
            .add(HyperlinkValidityDetector())
            .add(TocImplementationDetector())
        )


def validate_document(docx_path: Path) -> ValidationReport:
    """Convenience function to run standard validation.

    Args:
        docx_path: Path to the document to validate.

    Returns:
        ValidationReport with all findings.
    """
    return ValidationPipeline.standard().run(docx_path)
