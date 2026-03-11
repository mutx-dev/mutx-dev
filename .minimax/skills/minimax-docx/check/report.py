"""Validation report data structures for document quality assessment."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterator


class Gravity(Enum):
    """Severity classification for validation findings.

    BLOCKER: Critical issues that prevent document from opening correctly.
    WARNING: Problems that may cause rendering inconsistencies.
    HINT: Suggestions for best practices compliance.
    """
    BLOCKER = "blocker"
    WARNING = "warning"
    HINT = "hint"


@dataclass
class Issue:
    """Represents a single validation finding within a document.

    Attributes:
        gravity: The severity level of this finding.
        location: XPath or human-readable path to the problematic element.
        summary: Brief description of what was detected.
    """
    gravity: Gravity
    location: str
    summary: str


@dataclass
class ValidationReport:
    """Aggregates all findings from a validation pass.

    Provides convenience methods for adding issues at different severity
    levels and querying the collection.
    """
    issues: list[Issue] = field(default_factory=list)

    def blocker(self, location: str, summary: str) -> None:
        """Record a critical issue that blocks document usability."""
        self.issues.append(Issue(Gravity.BLOCKER, location, summary))

    def warning(self, location: str, summary: str) -> None:
        """Record a problem that may cause inconsistent rendering."""
        self.issues.append(Issue(Gravity.WARNING, location, summary))

    def hint(self, location: str, summary: str) -> None:
        """Record a best-practice suggestion."""
        self.issues.append(Issue(Gravity.HINT, location, summary))

    def has_blockers(self) -> bool:
        """Check if any critical issues were found."""
        return any(i.gravity == Gravity.BLOCKER for i in self.issues)

    def by_gravity(self, g: Gravity) -> Iterator[Issue]:
        """Iterate over issues matching the specified severity."""
        return (i for i in self.issues if i.gravity == g)

    def __len__(self) -> int:
        return len(self.issues)

    def __bool__(self) -> bool:
        return len(self.issues) > 0
