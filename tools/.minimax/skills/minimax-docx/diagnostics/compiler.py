"""
C# Compiler Diagnostic Analyzer

Parses Roslyn/MSBuild compiler output and generates actionable fix suggestions.
Understands the structure of C# diagnostic messages and provides contextual
guidance based on error semantics.

The analyzer categorizes errors by their diagnostic ID prefix and applies
pattern matching on message content to generate relevant suggestions.

See: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Iterator


class DiagnosticSeverity(Enum):
    """Compiler diagnostic severity levels from MSBuild."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class RoslynDiagnostic:
    """Represents a parsed compiler diagnostic entry.

    Attributes:
        id: Diagnostic identifier (e.g., "CS0246")
        severity: Error, warning, or informational
        message: The compiler's message text
        file_path: Source file where the issue occurred
        line: Line number in source file
        column: Column number in source file
    """
    id: str
    severity: DiagnosticSeverity
    message: str
    file_path: str = ""
    line: int = 0
    column: int = 0

    @property
    def category(self) -> str:
        """Derive error category from the diagnostic ID.

        C# diagnostic IDs follow numbering conventions:
        - CS0xxx: Core language and syntax errors
        - CS1xxx: Compiler processing errors
        - CS2xxx: Compiler warnings
        - CS7xxx: Language feature errors
        - CS8xxx: Nullable reference analysis
        """
        if not self.id.startswith("CS"):
            return "other"
        try:
            num = int(self.id[2:])
        except ValueError:
            return "other"

        if num < 1000:
            return "language"
        elif num < 2000:
            return "compilation"
        elif num < 3000:
            return "semantic"
        elif num < 8000:
            return "feature"
        else:
            return "nullable"


class DiagnosticParser:
    """Extracts diagnostic entries from MSBuild output text."""

    _MSBUILD_PATTERN = re.compile(
        r"^(?P<file>[^(]+)\((?P<line>\d+),(?P<col>\d+)\):\s*"
        r"(?P<sev>error|warning|info)\s+(?P<id>CS\d+):\s*(?P<msg>.+)$",
        re.MULTILINE
    )

    _SIMPLE_PATTERN = re.compile(
        r"^(?P<sev>error|warning|info)\s+(?P<id>CS\d+):\s*(?P<msg>.+)$",
        re.MULTILINE
    )

    def parse(self, output: str) -> Iterator[RoslynDiagnostic]:
        """Extract diagnostic entries from compiler output text.

        Args:
            output: Raw compiler output string

        Yields:
            RoslynDiagnostic instances for each found diagnostic
        """
        for m in self._MSBUILD_PATTERN.finditer(output):
            yield RoslynDiagnostic(
                id=m.group("id"),
                severity=DiagnosticSeverity(m.group("sev")),
                message=m.group("msg"),
                file_path=m.group("file"),
                line=int(m.group("line")),
                column=int(m.group("col")),
            )

        for m in self._SIMPLE_PATTERN.finditer(output):
            yield RoslynDiagnostic(
                id=m.group("id"),
                severity=DiagnosticSeverity(m.group("sev")),
                message=m.group("msg"),
            )


@dataclass
class FixSuggestion:
    """A proposed fix for a compiler diagnostic.

    Attributes:
        diagnostic_id: The compiler error code
        title: Brief description of the fix
        description: Detailed explanation
        code_action: Optional code snippet demonstrating the fix
    """
    diagnostic_id: str
    title: str
    description: str
    code_action: str | None = None


class SuggestionEngine:
    """Generates fix suggestions based on diagnostic content.

    Analyzes message text patterns rather than relying on a static
    mapping from error codes to suggestions.
    """

    def suggest(self, diag: RoslynDiagnostic) -> FixSuggestion | None:
        """Create a fix suggestion for the given diagnostic.

        Args:
            diag: Parsed diagnostic entry

        Returns:
            FixSuggestion if applicable, otherwise None
        """
        handler = getattr(self, f"_suggest_{diag.category}", None)
        if handler:
            return handler(diag)
        return self._generic_suggestion(diag)

    def _suggest_language(self, diag: RoslynDiagnostic) -> FixSuggestion | None:
        """Handle basic language errors (CS0xxx)."""
        msg = diag.message.lower()

        if "type or namespace" in msg and "could not be found" in msg:
            type_match = re.search(r"'(\w+)'", diag.message)
            if type_match:
                type_name = type_match.group(1)
                ns = self._infer_namespace(type_name)
                if ns:
                    return FixSuggestion(
                        diagnostic_id=diag.id,
                        title=f"Add using directive for {type_name}",
                        description=f"The type '{type_name}' requires a using directive.",
                        code_action=f"using {ns};",
                    )

        if "cannot implicitly convert" in msg:
            if "string" in msg:
                return FixSuggestion(
                    diagnostic_id=diag.id,
                    title="Use StringValue wrapper",
                    description="OpenXML relationship IDs require StringValue type.",
                    code_action="new StringValue(yourId)",
                )

        return None

    def _suggest_compilation(self, diag: RoslynDiagnostic) -> FixSuggestion | None:
        """Handle compiler processing errors (CS1xxx)."""
        msg = diag.message.lower()

        if "unrecognized escape" in msg or "escape sequence" in msg:
            return FixSuggestion(
                diagnostic_id=diag.id,
                title="Use verbatim string",
                description="Backslashes in regular strings are escape characters.",
                code_action='@"your\\path"',
            )

        if "newline in constant" in msg:
            return FixSuggestion(
                diagnostic_id=diag.id,
                title="Use verbatim string for multiline",
                description="Regular strings cannot span multiple lines.",
                code_action='@"line1\nline2"',
            )

        return None

    def _suggest_feature(self, diag: RoslynDiagnostic) -> FixSuggestion | None:
        """Handle language feature and nullable errors (CS7xxx/CS8xxx)."""
        if "nullable" in diag.message.lower():
            return FixSuggestion(
                diagnostic_id=diag.id,
                title="Handle nullable value",
                description="Add null check or use null-forgiving operator.",
            )
        return None

    def _generic_suggestion(self, diag: RoslynDiagnostic) -> FixSuggestion:
        """Provide a fallback suggestion with documentation reference."""
        return FixSuggestion(
            diagnostic_id=diag.id,
            title=f"See documentation for {diag.id}",
            description=diag.message,
        )

    def _infer_namespace(self, type_name: str) -> str | None:
        """Guess the namespace for common OpenXML types."""
        if type_name in ("Body", "Paragraph", "Run", "Text", "Table",
                         "TableRow", "TableCell", "SectionProperties",
                         "ParagraphProperties", "RunProperties"):
            return "DocumentFormat.OpenXml.Wordprocessing"

        if type_name in ("WordprocessingDocument", "MainDocumentPart",
                         "StyleDefinitionsPart", "NumberingDefinitionsPart"):
            return "DocumentFormat.OpenXml.Packaging"

        if type_name in ("Drawing", "Inline", "Anchor"):
            return "DocumentFormat.OpenXml.Drawing.Wordprocessing"

        return None


class CompilerDiagnostics:
    """Primary interface for compiler output analysis.

    Combines parsing and suggestion generation into a single API.
    """

    def __init__(self):
        self._parser = DiagnosticParser()
        self._engine = SuggestionEngine()

    def analyze(self, compiler_output: str) -> list[FixSuggestion]:
        """Process compiler output and return fix suggestions.

        Deduplicates suggestions by diagnostic ID to avoid repetition.

        Args:
            compiler_output: Raw text from the compiler

        Returns:
            List of actionable suggestions
        """
        seen_ids: set[str] = set()
        suggestions: list[FixSuggestion] = []

        for diag in self._parser.parse(compiler_output):
            if diag.id in seen_ids:
                continue
            seen_ids.add(diag.id)

            suggestion = self._engine.suggest(diag)
            if suggestion:
                suggestions.append(suggestion)

        return suggestions

    def format_suggestions(self, suggestions: list[FixSuggestion]) -> str:
        """Render suggestions as human-readable text.

        Args:
            suggestions: List of suggestions to format

        Returns:
            Formatted string output
        """
        if not suggestions:
            return "No actionable suggestions."

        lines = []
        for s in suggestions:
            lines.append(f"[{s.diagnostic_id}] {s.title}")
            lines.append(f"  {s.description}")
            if s.code_action:
                lines.append(f"  Fix: {s.code_action}")
            lines.append("")

        return "\n".join(lines)
