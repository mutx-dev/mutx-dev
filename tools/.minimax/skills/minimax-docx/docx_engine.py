#!/usr/bin/env python3
"""
OpenXML Document Build System

Central command-line interface for document compilation and validation.

Usage:
    python docx_engine.py {doctor|render|audit|preview|order|residual|map-gate|map-apply|map-template} [options]

Design goals:
- Unified entry point for all document operations
- Automatic runtime detection with fallback provisioning
- Self-contained module path resolution
- Mandatory post-generation verification
"""

import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
import json
import copy
from collections import Counter
from html import unescape
from pathlib import Path
from typing import Any, List, Optional, Set, Tuple
import xml.etree.ElementTree as ET

SCRIPT_LOCATION = Path(__file__).parent.resolve()
DOCFORGE_CSPROJ = SCRIPT_LOCATION / "src" / "DocForge.csproj"
DEFAULT_DOTNET_MAJOR = 9

TEXT_PART_PATTERN = re.compile(
    r"<(?:(?:\w+):)?(?:t|instrText)\b[^>]*>(.*?)</(?:(?:\w+):)?(?:t|instrText)>",
    re.DOTALL,
)

RESIDUAL_PLACEHOLDER_PATTERNS = (
    r"\bXXX\b",
    r"\bTODO\b",
    r"\bTBD\b",
    r"\b(?:sample|example|template)\b",
    r"\[(?:company|company\s*name|date)\]",
    r"\[(?:\u516c\u53f8\u540d|\u65e5\u671f)\]",
    r"\u793a\u4f8b",
    r"\u6a21\u677f",
    r"\u4ec5\u4f9b\u53c2\u8003",
)

MAPPING_ACTIONS = {"replace", "delete", "insert"}
MAPPING_RESOLVED_STATUS = "resolved"
MAPPING_ALLOWED_STATUSES = {"resolved", "todo", "ambiguous", "blocked"}
MAPPING_SCHEMA_VERSION = "minimax-docx.map.v1"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
NSMAP = {"w": W_NS}
OOXML_NAMESPACE_PREFIXES = {
    "w": W_NS,
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "w14": "http://schemas.microsoft.com/office/word/2010/wordml",
    "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
}

sys.path.insert(0, str(SCRIPT_LOCATION))
from diagnostics.compiler import CompilerDiagnostics


def register_ooxml_namespaces() -> None:
    """Register stable namespace prefixes for XML serialization."""
    for prefix, uri in OOXML_NAMESPACE_PREFIXES.items():
        ET.register_namespace(prefix, uri)


register_ooxml_namespaces()


def resolve_project_home() -> Path:
    """Identify the active workspace directory.

    Returns the user's working directory or PROJECT_HOME environment variable.
    Build artifacts and outputs are placed here. Raises an error if this
    would resolve to the skill installation directory.
    """
    env_path = os.environ.get("PROJECT_HOME")
    home = Path(env_path) if env_path else Path.cwd()
    if home.resolve() == SCRIPT_LOCATION.resolve():
        raise RuntimeError(
            f"project_home resolved to the skill directory ({SCRIPT_LOCATION}). "
            "Run docx_engine.py from the user's working directory or set PROJECT_HOME."
        )
    return home


def resolve_staging_area() -> Path:
    """Return the path for intermediate build files."""
    return resolve_project_home() / ".docx_workspace"


def resolve_artifact_dir() -> Path:
    """Return the path for final document outputs."""
    return resolve_project_home() / "output"


def resolve_mapping_schema_path() -> Path:
    """Return canonical mapping schema path."""
    return SCRIPT_LOCATION / "schemas" / "mapping.schema.json"


def required_dotnet_major() -> int:
    """Infer required .NET SDK major version from DocForge target framework."""
    if not DOCFORGE_CSPROJ.exists():
        return DEFAULT_DOTNET_MAJOR

    try:
        content = DOCFORGE_CSPROJ.read_text(encoding="utf-8")
    except OSError:
        return DEFAULT_DOTNET_MAJOR

    match = re.search(
        r"<TargetFramework>\s*net(\d+)\.\d+\s*</TargetFramework>",
        content,
        flags=re.IGNORECASE,
    )
    if not match:
        return DEFAULT_DOTNET_MAJOR

    try:
        major = int(match.group(1))
    except ValueError:
        return DEFAULT_DOTNET_MAJOR

    return major if major > 0 else DEFAULT_DOTNET_MAJOR


def required_dotnet_channel() -> str:
    """Return dotnet-install channel string matching required major version."""
    return f"{required_dotnet_major()}.0"


def locate_dotnet_binary() -> Optional[Path]:
    """Scan common installation paths for the dotnet executable."""
    os_type = platform.system()
    search_paths = ["dotnet"]

    if os_type == "Windows":
        search_paths.extend([
            Path.home() / ".dotnet" / "dotnet.exe",
            Path(os.environ.get("ProgramFiles", "")) / "dotnet" / "dotnet.exe",
            Path(os.environ.get("ProgramFiles(x86)", "")) / "dotnet" / "dotnet.exe",
        ])
    else:
        search_paths.extend([
            Path.home() / ".dotnet" / "dotnet",
            Path("/usr/local/share/dotnet/dotnet"),
            Path("/usr/share/dotnet/dotnet"),
            Path("/opt/dotnet/dotnet"),
        ])

    for candidate in search_paths:
        if isinstance(candidate, str):
            found = shutil.which(candidate)
            if found:
                return Path(found)
        elif candidate.exists() and candidate.is_file():
            return candidate
    return None


def assess_runtime_health() -> Tuple[str, Optional[Path], Optional[str]]:
    """Check the state of the dotnet installation.

    Returns:
        Tuple of (status, binary_path, version_string) where status is one of:
        'ready', 'outdated', 'corrupted', or 'absent'
    """
    binary = locate_dotnet_binary()
    if not binary:
        return ("absent", None, None)

    try:
        proc = subprocess.run(
            [str(binary), "--version"],
            capture_output=True, text=True, timeout=10
        )
        if proc.returncode == 0:
            ver = proc.stdout.strip()
            try:
                major_ver = int(ver.split(".")[0])
                required_major = required_dotnet_major()
                return (
                    ("ready", binary, ver)
                    if major_ver >= required_major
                    else ("outdated", binary, ver)
                )
            except (ValueError, IndexError):
                return ("corrupted", binary, None)
        return ("corrupted", binary, None)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return ("corrupted", binary, None)


def provision_dotnet() -> Optional[Path]:
    """Download and install .NET SDK automatically.

    Returns:
        Path to the installed binary, or None on failure.
    """
    os_type = platform.system()
    channel = required_dotnet_channel()
    print("  Acquiring .NET SDK...")

    try:
        if os_type == "Windows":
            installer_url = "https://dot.net/v1/dotnet-install.ps1"
            target_dir = Path.home() / ".dotnet"

            powershell_script = f"""
            $ErrorActionPreference = 'Stop'
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $installer = Invoke-WebRequest -Uri '{installer_url}' -UseBasicParsing
            $execution = [scriptblock]::Create($installer.Content)
            & $execution -Channel {channel} -InstallDir '{target_dir}'
            """
            subprocess.run(
                ["powershell", "-Command", powershell_script],
                capture_output=True, text=True, timeout=300
            )
            binary = target_dir / "dotnet.exe"
        else:
            installer_url = "https://dot.net/v1/dotnet-install.sh"
            target_dir = Path.home() / ".dotnet"

            installer_path = Path(tempfile.gettempdir()) / "dotnet-bootstrap.sh"
            subprocess.run(
                ["curl", "-sSL", installer_url, "-o", str(installer_path)],
                check=True, timeout=60
            )
            installer_path.chmod(0o755)
            subprocess.run(
                [str(installer_path), "--channel", channel, "--install-dir", str(target_dir)],
                check=True, timeout=300
            )
            binary = target_dir / "dotnet"

        if binary.exists():
            verify = subprocess.run([str(binary), "--version"], capture_output=True, text=True)
            if verify.returncode == 0:
                print(f"  + Provisioned: {verify.stdout.strip()}")
                return binary

        print("  - Provisioning unsuccessful")
        print("    Reference: https://dotnet.microsoft.com/download")
        return None

    except Exception as exc:
        print(f"  - Provisioning failed: {exc}")
        print("    Reference: https://dotnet.microsoft.com/download")
        return None


def guarantee_dotnet() -> Path:
    """Ensure dotnet is available, installing if needed.

    Exits the process if installation fails.
    """
    status, binary, ver = assess_runtime_health()
    required_major = required_dotnet_major()

    if status == "ready":
        return binary
    elif status == "outdated":
        print(f"! Runtime {ver} is outdated (requires {required_major}+), upgrading...")
        result = provision_dotnet()
        if result:
            return result
        sys.exit(1)
    elif status == "corrupted":
        print("! Runtime installation corrupted, reinstalling...")
        dotnet_home = Path.home() / ".dotnet"
        if dotnet_home.exists():
            shutil.rmtree(dotnet_home, ignore_errors=True)
        result = provision_dotnet()
        if result:
            return result
        sys.exit(1)
    else:
        print("o Runtime not detected, installing...")
        result = provision_dotnet()
        if result:
            return result
        sys.exit(1)


def audit_python_dependencies() -> dict:
    """Check availability of external and optional runtime dependencies."""
    inventory = {}

    pandoc_binary = shutil.which("pandoc")
    if pandoc_binary:
        try:
            proc = subprocess.run(["pandoc", "--version"], capture_output=True, text=True, timeout=5)
            ver = proc.stdout.split("\n")[0].split()[-1] if proc.returncode == 0 else "?"
            inventory["pandoc"] = ("available", ver)
        except Exception:
            inventory["pandoc"] = ("available", "?")
    else:
        inventory["pandoc"] = ("optional", None)

    soffice_binary = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice_binary:
        inventory["libreoffice-soffice"] = ("available", Path(soffice_binary).name)
    else:
        inventory["libreoffice-soffice"] = ("missing", None)

    textutil_binary = shutil.which("textutil")
    if textutil_binary:
        # textutil is explicitly unsupported for template-driven normalization.
        inventory["textutil"] = ("unsupported", Path(textutil_binary).name)

    for pkg in ["playwright", "matplotlib", "PIL"]:
        try:
            __import__(pkg if pkg != "PIL" else "PIL.Image")
            inventory[pkg] = ("available", None)
        except ImportError:
            inventory[pkg] = ("optional", None)

    return inventory


def prepare_workspace():
    """Ensure workspace output directories exist."""
    staging = resolve_staging_area()
    output = resolve_artifact_dir()

    staging.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)


def execute_verification(document_path: Path, runtime: Path) -> bool:
    """Run the complete verification pipeline on a generated document."""
    from check.pipeline import ValidationPipeline
    from check.report import Gravity

    try:
        report = ValidationPipeline.standard().run(document_path)
        for issue in report.issues:
            prefix = {
                Gravity.BLOCKER: "!!",
                Gravity.WARNING: " !",
                Gravity.HINT: "  ",
            }.get(issue.gravity, "  ")
            print(f"  {prefix} [{issue.gravity.value}] {issue.location}: {issue.summary}")
        if report.has_blockers():
            return False
    except Exception as exc:
        print(f"Verification exception: {exc}")
        return False

    validator_dll = SCRIPT_LOCATION / "validator" / "DocxChecker.dll"
    if validator_dll.exists():
        try:
            proc = subprocess.run(
                [str(runtime), "--roll-forward", "LatestMajor", str(validator_dll), str(document_path)],
                capture_output=True, text=True
            )
            print(proc.stdout, end="")
            if proc.stderr:
                print(proc.stderr, end="", file=sys.stderr)
            if proc.returncode != 0:
                return False
        except Exception as exc:
            print(f"Schema validation exception: {exc}")
            return False

    return True


def extract_document_metrics(document_path: Path) -> dict:
    """Collect statistics about the document using pandoc."""
    metrics = {"characters": 0, "tokens": 0, "media_count": 0, "has_markup": False, "has_annotations": False}

    if not shutil.which("pandoc"):
        return metrics

    try:
        proc = subprocess.run(
            ["pandoc", str(document_path), "-t", "plain"],
            capture_output=True, text=True, timeout=30
        )
        if proc.returncode == 0:
            content = proc.stdout
            metrics["characters"] = len(content)
            metrics["tokens"] = len(content.split())

        with zipfile.ZipFile(document_path, 'r') as archive:
            entries = archive.namelist()
            metrics["media_count"] = sum(1 for e in entries if e.startswith("word/media/"))
            metrics["has_annotations"] = "word/comments.xml" in entries

            if "word/document.xml" in entries:
                doc_xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
                metrics["has_markup"] = "<w:ins" in doc_xml or "<w:del" in doc_xml
    except (subprocess.SubprocessError, zipfile.BadZipFile, OSError, UnicodeDecodeError):
        return metrics

    return metrics


def is_text_bearing_part(path: str) -> bool:
    """Return whether a DOCX part can contain user-visible text."""
    return (
        path == "word/document.xml"
        or path.startswith("word/header")
        or path.startswith("word/footer")
        or path == "word/comments.xml"
        or path == "word/footnotes.xml"
        or path == "word/endnotes.xml"
    )


def extract_visible_text(document_path: Path) -> str:
    """Extract visible text from common WordprocessingML text-bearing parts."""
    chunks: List[str] = []

    try:
        with zipfile.ZipFile(document_path, "r") as archive:
            for entry in sorted(archive.namelist()):
                if not is_text_bearing_part(entry):
                    continue
                xml_text = archive.read(entry).decode("utf-8", errors="ignore")
                chunks.extend(extract_text_nodes(xml_text))
    except zipfile.BadZipFile as exc:
        raise ValueError(f"Invalid .docx archive: {document_path}") from exc

    return "\n".join(chunks)


def local_name(tag: str) -> str:
    """Return XML local name without namespace prefix."""
    if "}" in tag:
        return tag.rsplit("}", 1)[1]
    return tag


def extract_text_nodes(xml_text: str) -> List[str]:
    """Extract text from `<w:t>` and `<w:instrText>` nodes, namespace-agnostic."""
    values: List[str] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        for raw in TEXT_PART_PATTERN.findall(xml_text):
            value = unescape(raw).strip()
            if value:
                values.append(value)
        return values

    for node in root.iter():
        tag = node.tag
        if not isinstance(tag, str):
            continue
        if local_name(tag) not in {"t", "instrText"}:
            continue
        value = unescape((node.text or "")).strip()
        if value:
            values.append(value)
    return values


def detect_residual_placeholders(document_path: Path, allow_tokens: Optional[List[str]] = None) -> Counter:
    """Find unresolved placeholder/sample fragments in document text."""
    allowed = {token.strip().lower() for token in (allow_tokens or []) if token.strip()}
    findings: Counter = Counter()
    text = extract_visible_text(document_path)

    for pattern in RESIDUAL_PLACEHOLDER_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            token = match.group(0).strip()
            if not token:
                continue
            if token.lower() in allowed:
                continue
            findings[token] += 1

    return findings


def action_doctor():
    """Run environment diagnostics and automatic setup."""
    print("=== Environment Diagnostics ===")
    print()

    print("Paths:")
    print(f"  Skill root:    {SCRIPT_LOCATION}")
    in_skill_dir = False
    try:
        project_home = resolve_project_home()
        print(f"  Project home:  {project_home}")
        print(f"  Workspace:     {resolve_staging_area()}")
        print(f"  Output dir:    {resolve_artifact_dir()}")
    except RuntimeError:
        in_skill_dir = True
        print(f"  Project home:  (running from skill dir - set PROJECT_HOME or run from workspace)")
        print(f"  Workspace:     N/A")
        print(f"  Output dir:    N/A")
    print()

    print("Runtime:")
    status, binary, ver = assess_runtime_health()
    status_map = {"ready": "+", "outdated": "!", "corrupted": "-", "absent": "o"}
    print(f"  {status_map[status]} dotnet {ver or status}")
    print(f"  + python {platform.python_version()}")

    deps = audit_python_dependencies()
    missing_required: List[str] = []
    unsupported: List[str] = []
    for name, (state, ver) in deps.items():
        if state == "available":
            icon = "+"
        elif state == "optional":
            icon = "o"
        elif state == "unsupported":
            icon = "x"
            unsupported.append(name)
        else:
            icon = "-"
            missing_required.append(name)
        ver_str = f" {ver}" if ver else ""
        if state == "missing":
            suffix = " (required)"
        elif state == "optional":
            suffix = " (optional)"
        elif state == "unsupported":
            suffix = " (forbidden for template-driven conversion)"
        else:
            suffix = ""
        print(f"  {icon} {name}{ver_str}{suffix}")
    print()

    if "libreoffice-soffice" in missing_required:
        print("Dependency Gate:")
        print("  - libreoffice-soffice is required for template-driven .doc -> .docx normalization.")
        if "textutil" in unsupported:
            print("  - textutil is detected but cannot be used as a fallback.")
        print("  - Install LibreOffice and ensure `soffice` is on PATH.")
        print("    macOS: brew install --cask libreoffice")
        print("Not Ready.")
        sys.exit(1)

    needs_setup = status != "ready"

    if not in_skill_dir:
        if needs_setup:
            print("=== Provisioning Dependencies ===")
            runtime = guarantee_dotnet()
            ver_proc = subprocess.run([str(runtime), '--version'], capture_output=True, text=True)
            print(f"  + dotnet {ver_proc.stdout.strip()}")

            print()
            print("=== Preparing Workspace ===")
            prepare_workspace()
            print(f"  + {resolve_staging_area()}")
        else:
            staging = resolve_staging_area()
            if not staging.exists():
                print("=== Preparing Workspace ===")
                prepare_workspace()
                print(f"  + {staging}")
            else:
                print("Workspace:")
                print(f"  + {staging}")
                print(f"  + project {SCRIPT_LOCATION / 'src' / 'DocForge.csproj'}")

    print()
    print("Ready!")
    print(f"  Render: python {Path(__file__).name} render")
    print(f"  Preset: python {Path(__file__).name} render output.docx tech")
    print(f"  Template: dotnet run --project \"{SCRIPT_LOCATION / 'src' / 'DocForge.csproj'}\" -- from-template template.docx output.docx")
    print(f"  Mapping template: python {Path(__file__).name} map-template mapping.json --require R1,R2")
    print(f"  Residual gate: python {Path(__file__).name} residual output.docx")
    print(f"  Mapping gate: python {Path(__file__).name} map-gate mapping.json --require R1,R2")
    print(f"  Mapping schema: {resolve_mapping_schema_path()}")
    if not in_skill_dir:
        print(f"  Output: {resolve_artifact_dir()}/")


def action_render(target_name: Optional[str] = None, preset: str = "tech"):
    """Compile source and generate a validated document from a preset template."""
    preset = preset.lower()
    if preset not in {"tech", "academic"}:
        print(f"- Unsupported preset: {preset}")
        print("  Available presets: tech, academic")
        sys.exit(1)

    runtime = guarantee_dotnet()
    prepare_workspace()

    output_dir = resolve_artifact_dir()

    if target_name:
        target = Path(target_name)
        if not target.is_absolute():
            target = output_dir / target_name
    else:
        target = output_dir / "document.docx"

    target.parent.mkdir(parents=True, exist_ok=True)

    print(">> Compiling...")
    proj_file = SCRIPT_LOCATION / "src" / "DocForge.csproj"
    proc = subprocess.run(
        [str(runtime), "build", str(proj_file), "--verbosity", "quiet"],
        capture_output=True, text=True, cwd=str(SCRIPT_LOCATION)
    )

    if proc.returncode != 0:
        print("!! Compilation failed")
        print()
        diagnostics = CompilerDiagnostics()
        full_output = proc.stdout + proc.stderr
        for line in full_output.split("\n"):
            if "error CS" in line:
                print(f"  {line}")
                suggestions = diagnostics.analyze(line)
                for suggestion in suggestions:
                    print(f"    > Hint: {suggestion.message}")
        sys.exit(1)
    print("  + Compiled")

    print(">> Generating...")
    run_env = os.environ.copy()
    run_env.setdefault("DOTNET_ROLL_FORWARD", "LatestMajor")
    proc = subprocess.run(
        [
            str(runtime),
            "run",
            "--project",
            str(proj_file),
            "--no-build",
            "--",
            preset,
            str(target),
            str(resolve_artifact_dir()),
        ],
        capture_output=True,
        text=True,
        cwd=str(SCRIPT_LOCATION),
        env=run_env,
    )

    if proc.returncode != 0:
        print("!! Generation failed")
        if proc.stdout:
            print(proc.stdout)
        if proc.stderr:
            print(proc.stderr, file=sys.stderr)
        sys.exit(1)

    if not target.exists():
        print(f"!! Output missing: {target}")
        print("  Verify preset run arguments and project mode")
        sys.exit(1)
    print("  + Generated")

    print(">> Verifying...")
    if not execute_verification(target, runtime):
        print()
        print("!! VERIFICATION FAILED - Document saved but may be invalid")
        print("-" * 58)
        print(f"Document: {target}")
        print("The file may not render correctly in Word/WPS.")
        print()
        print("Potential causes:")
        print("  * Editing existing document: source may be non-conformant")
        print("  * Creating new document: review error messages above")
        print("-" * 58)
        sys.exit(1)

    metrics = extract_document_metrics(target)
    if metrics["characters"] > 0:
        media_note = "" if metrics["media_count"] > 0 else " - verify image embedding path"
        print(f"  >> {metrics['characters']} chars, {metrics['tokens']} words, {metrics['media_count']} images{media_note}")
        print(f"  >> Structural check passed. Content review: pandoc \"{target}\" -t plain")
        if metrics["has_markup"] or metrics["has_annotations"]:
            print("     Track changes detected - use --track-changes=all for review")

    print()
    print(f"+ Complete: {target}")


def action_audit(document_path: str):
    """Validate an existing document file."""
    runtime = guarantee_dotnet()

    path = Path(document_path)
    if not path.exists():
        print(f"- Not found: {path}")
        sys.exit(1)

    print(f">> Auditing: {path}")
    if execute_verification(path, runtime):
        print("+ Valid")
    else:
        sys.exit(1)


def action_preview(document_path: str):
    """Display document text content using pandoc."""
    path = Path(document_path)
    if not path.exists():
        print(f"- Not found: {path}")
        sys.exit(1)

    if not shutil.which("pandoc"):
        print("- pandoc not installed")
        print("  Install: brew install pandoc (macOS) or apt install pandoc (Linux)")
        sys.exit(1)

    print(f">> Preview: {path}")
    print("-" * 60)
    proc = subprocess.run(
        ["pandoc", str(path), "-t", "plain"],
        capture_output=True, text=True, timeout=30
    )
    if proc.returncode == 0:
        print(proc.stdout)
    else:
        print(f"- Preview failed: {proc.stderr}")
        sys.exit(1)


def action_order(container_name: Optional[str] = None, profile: str = "repair"):
    """Inspect layered assembly order for OOXML containers."""
    from spec.ooxml_order import (
        build_container_orders,
        explain_container,
        get_phase_plan,
        known_profiles,
    )

    profiles = known_profiles()
    if container_name in profiles and profile == "repair":
        profile = container_name
        container_name = None

    if profile not in profiles:
        print(f"- Unknown order profile: {profile}")
        print(f"  Available profiles: {', '.join(profiles)}")
        sys.exit(1)

    orders = build_container_orders(profile)
    if not container_name:
        print("Known containers:")
        for name in sorted(orders):
            print(f"  - {explain_container(name, profile=profile)}")
        return

    sequence = orders.get(container_name)
    if sequence is None:
        print(f"- Unknown container: {container_name}")
        print(f"  Available: {', '.join(sorted(orders))}")
        sys.exit(1)

    print(explain_container(container_name, profile=profile))
    phases = get_phase_plan(container_name, profile=profile) or ()
    for phase in phases:
        joined = ", ".join(phase.elements)
        print(f"  [{phase.level}:{phase.name}] {joined}")
    print("  [flattened]")
    for idx, elem in enumerate(sequence, start=1):
        print(f"    {idx:>2}. {elem}")


def action_residual(document_path: str, allow_tokens: Optional[List[str]] = None):
    """Check for unresolved placeholder/sample text in a DOCX."""
    path = Path(document_path)
    if not path.exists():
        print(f"- Not found: {path}")
        sys.exit(1)

    print(f">> Residual Placeholder Check: {path}")
    if allow_tokens:
        joined = ", ".join(token for token in allow_tokens if token.strip())
        if joined:
            print(f"   allowed literals: {joined}")

    try:
        findings = detect_residual_placeholders(path, allow_tokens=allow_tokens)
    except ValueError as exc:
        print(f"- {exc}")
        sys.exit(1)

    if not findings:
        print("+ Residual placeholder check passed")
        return

    print("!! Residual placeholder text detected:")
    for token, count in findings.most_common(30):
        print(f"  - {token!r}: {count} occurrence(s)")
    print("  Remove or explicitly allow these placeholders, then run residual check again.")
    sys.exit(1)


def parse_residual_args(argv: List[str]) -> Tuple[str, List[str]]:
    """Parse residual command options."""
    if len(argv) < 3:
        print("Usage: python docx_engine.py residual <document.docx> [--allow TOKEN]...")
        sys.exit(1)

    document_path = argv[2]
    allow_tokens: List[str] = []
    index = 3

    while index < len(argv):
        flag = argv[index]
        if flag == "--allow":
            if index + 1 >= len(argv):
                print("Usage: python docx_engine.py residual <document.docx> [--allow TOKEN]...")
                print("- Missing TOKEN after --allow")
                sys.exit(1)
            allow_tokens.append(argv[index + 1])
            index += 2
            continue

        print(f"- Unknown option for residual: {flag}")
        print("Usage: python docx_engine.py residual <document.docx> [--allow TOKEN]...")
        sys.exit(1)

    return document_path, allow_tokens


def split_requirement_ids(raw: str) -> List[str]:
    """Split comma-separated requirement IDs."""
    items: List[str] = []
    for token in raw.split(","):
        cleaned = token.strip()
        if cleaned:
            items.append(cleaned)
    return items


def build_mapping_template(required_ids: List[str], selector_kind: str) -> dict[str, Any]:
    """Build a mapping template document with one row per requirement."""
    rows: List[dict[str, Any]] = []
    requirements: List[dict[str, Any]] = []

    for index, req_id in enumerate(required_ids, 1):
        requirements.append(
            {
                "id": req_id,
                "required": True,
                "description": f"TODO: describe requirement {req_id}",
            }
        )
        rows.append(
            {
                "id": f"row-{index}",
                "action": "replace",
                "selector": f"{selector_kind}:<<locate target for {req_id}>>",
                "requirement_ids": [req_id],
                "target_value": f"<<target value for {req_id}>>",
                "status": "todo",
                "notes": "Set selector/target_value, then change status to resolved.",
            }
        )

    return {
        "schema_version": MAPPING_SCHEMA_VERSION,
        "required_requirement_ids": required_ids,
        "requirements": requirements,
        "rows": rows,
    }


def action_map_template(
    output_path: str,
    cli_required: Optional[Set[str]] = None,
    selector_kind: str = "text",
    overwrite: bool = False,
) -> None:
    """Generate mapping.json scaffold file for fill/patch tasks."""
    output = Path(output_path)
    required_ids = sorted(cli_required or set())
    if not required_ids:
        required_ids = ["R1"]

    if output.exists() and not overwrite:
        print(f"- Output already exists: {output}")
        print("  Use --overwrite to replace it.")
        sys.exit(1)

    template_doc = build_mapping_template(required_ids, selector_kind=selector_kind)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(template_doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"+ Mapping template created: {output}")
    print(f"  schema_version: {MAPPING_SCHEMA_VERSION}")
    print(f"  schema_file: {resolve_mapping_schema_path()}")
    print(f"  requirements: {len(required_ids)}")
    print(
        "  Next: fill selector/target_value, set status=resolved, then run "
        f"`python {Path(__file__).name} map-gate {output} --require {','.join(required_ids)}`"
    )


def collect_required_ids(mapping_doc: dict[str, Any], cli_required: Set[str]) -> Set[str]:
    """Collect required requirement IDs from mapping file and CLI."""
    required = set(cli_required)

    listed = mapping_doc.get("required_requirement_ids")
    if isinstance(listed, list):
        for item in listed:
            if isinstance(item, str) and item.strip():
                required.add(item.strip())

    requirements = mapping_doc.get("requirements")
    if isinstance(requirements, list):
        for req in requirements:
            if not isinstance(req, dict):
                continue
            req_id = req.get("id")
            is_required = req.get("required", True)
            if isinstance(req_id, str) and req_id.strip() and is_required:
                required.add(req_id.strip())

    return required


def load_mapping_doc(path: Path) -> dict[str, Any]:
    """Load mapping JSON document."""
    if not path.exists():
        raise ValueError(f"Not found: {path}")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"Invalid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("Mapping file must be a JSON object")

    return data


def check_mapping_schema_header(mapping_doc: dict[str, Any]) -> Tuple[List[str], List[str]]:
    """Validate top-level schema header fields."""
    errors: List[str] = []
    warnings: List[str] = []

    schema_version = mapping_doc.get("schema_version")
    if schema_version is None:
        warnings.append(
            f"missing `schema_version` (recommended: {MAPPING_SCHEMA_VERSION})"
        )
    elif not isinstance(schema_version, str) or not schema_version.strip():
        errors.append("`schema_version` must be a non-empty string")
    elif schema_version.strip() != MAPPING_SCHEMA_VERSION:
        errors.append(
            f"unsupported schema_version `{schema_version}` (expected `{MAPPING_SCHEMA_VERSION}`)"
        )

    if "rows" not in mapping_doc:
        errors.append("missing top-level `rows`")

    return errors, warnings


def evaluate_mapping_doc(mapping_doc: dict[str, Any], cli_required: Optional[Set[str]] = None) -> dict[str, Any]:
    """Evaluate mapping completeness and return normalized execution rows."""
    header_errors, header_warnings = check_mapping_schema_header(mapping_doc)
    if header_errors:
        return {
            "errors": header_errors,
            "warnings": header_warnings,
            "required_ids": set(),
            "rows_total": 0,
            "rows_resolved": 0,
            "covered_count": 0,
            "normalized_rows": [],
        }

    rows = mapping_doc.get("rows")
    if not isinstance(rows, list) or not rows:
        return {
            "errors": ["Mapping file must contain non-empty `rows` array"],
            "warnings": header_warnings,
            "required_ids": set(),
            "rows_total": 0,
            "rows_resolved": 0,
            "covered_count": 0,
            "normalized_rows": [],
        }

    required_ids = collect_required_ids(mapping_doc, cli_required or set())
    errors: List[str] = []
    warnings: List[str] = list(header_warnings)
    resolved_rows = 0
    covered_requirements: Set[str] = set()
    seen_row_ids: Set[str] = set()
    normalized_rows: List[dict[str, Any]] = []

    for index, row in enumerate(rows, 1):
        location = f"row[{index}]"
        row_errors = False

        if not isinstance(row, dict):
            errors.append(f"{location}: must be an object")
            continue

        row_id = row.get("id")
        if not isinstance(row_id, str) or not row_id.strip():
            errors.append(f"{location}: missing non-empty `id`")
            row_errors = True
            row_id = f"row-{index}"
        else:
            row_id = row_id.strip()
            if row_id in seen_row_ids:
                errors.append(f"{location}: duplicate id `{row_id}`")
                row_errors = True
            seen_row_ids.add(row_id)

        action_raw = row.get("action")
        if not isinstance(action_raw, str) or action_raw.strip().lower() not in MAPPING_ACTIONS:
            errors.append(f"{location}: action must be one of {sorted(MAPPING_ACTIONS)}")
            row_errors = True
            action = ""
        else:
            action = action_raw.strip().lower()

        selector = row.get("selector")
        if not isinstance(selector, str) or not selector.strip():
            errors.append(f"{location}: missing non-empty `selector`")
            row_errors = True
            selector = ""
        else:
            selector = selector.strip()

        status = row.get("status", MAPPING_RESOLVED_STATUS)
        if not isinstance(status, str):
            errors.append(f"{location}: `status` must be string")
            row_errors = True
            normalized_status = ""
        else:
            normalized_status = status.strip().lower()
            if normalized_status not in MAPPING_ALLOWED_STATUSES:
                errors.append(
                    f"{location}: unsupported status `{status}` "
                    f"(allowed: {sorted(MAPPING_ALLOWED_STATUSES)})"
                )
                row_errors = True
            elif normalized_status != MAPPING_RESOLVED_STATUS:
                errors.append(f"{location}: unresolved status `{status}` (must be `resolved`)")
                row_errors = True

        requirement_ids = row.get("requirement_ids")
        if not isinstance(requirement_ids, list) or not requirement_ids:
            errors.append(f"{location}: `requirement_ids` must be a non-empty list")
            row_errors = True
            valid_reqs: List[str] = []
        else:
            valid_reqs = []
            for req in requirement_ids:
                if isinstance(req, str) and req.strip():
                    valid_reqs.append(req.strip())
                else:
                    errors.append(f"{location}: requirement id must be non-empty string")
                    row_errors = True

        target_value = row.get("target_value")
        if action in {"replace", "insert"}:
            if not isinstance(target_value, str) or not target_value.strip():
                errors.append(f"{location}: `{action}` requires non-empty `target_value`")
                row_errors = True
            else:
                target_value = target_value
        else:
            target_value = target_value if isinstance(target_value, str) else ""

        if row_errors:
            continue

        resolved_rows += 1
        for req in valid_reqs:
            covered_requirements.add(req)

        normalized_rows.append(
            {
                "id": row_id,
                "action": action,
                "selector": selector,
                "requirement_ids": valid_reqs,
                "target_value": target_value,
            }
        )

    missing = sorted(req for req in required_ids if req not in covered_requirements)
    if missing:
        errors.append(
            "missing required requirements in resolved rows: " + ", ".join(missing)
        )

    if not required_ids:
        warnings.append("No required requirement IDs provided; gate only checked row completeness")

    return {
        "errors": errors,
        "warnings": warnings,
        "required_ids": required_ids,
        "rows_total": len(rows),
        "rows_resolved": resolved_rows,
        "covered_count": len(required_ids) - len(missing),
        "normalized_rows": normalized_rows,
    }


def print_mapping_gate_summary(result: dict[str, Any]) -> None:
    """Print mapping gate summary."""
    print(f"   rows: total={result['rows_total']}, resolved={result['rows_resolved']}")
    required_ids = result["required_ids"]
    if required_ids:
        print(f"   required requirements: {len(required_ids)}, covered={result['covered_count']}")
    for warning in result["warnings"]:
        print(f" ! {warning}")


def action_map_gate(mapping_path: str, cli_required: Optional[Set[str]] = None):
    """Validate whether a mapping table is complete enough for fill-mode execution."""
    path = Path(mapping_path)
    print(f">> Mapping Completeness Gate: {path}")

    try:
        mapping_doc = load_mapping_doc(path)
    except ValueError as exc:
        print(f"- {exc}")
        sys.exit(1)

    result = evaluate_mapping_doc(mapping_doc, cli_required=cli_required)
    print_mapping_gate_summary(result)

    if result["errors"]:
        print("!! Mapping gate failed:")
        for err in result["errors"]:
            print(f"  - {err}")
        print("  Fill-mode is blocked. Complete the mapping table or switch to template-apply rebuild mode.")
        sys.exit(1)

    print("+ Mapping gate passed")


def build_parent_map(root: ET.Element) -> dict[ET.Element, ET.Element]:
    """Build child-to-parent map for tree operations."""
    return {child: parent for parent in root.iter() for child in parent}


def paragraph_text(paragraph: ET.Element) -> str:
    """Extract concatenated text from a paragraph."""
    return "".join(node.text or "" for node in paragraph.findall(".//w:t", NSMAP))


def paragraph_style_id(paragraph: ET.Element) -> str:
    """Extract paragraph style id, if any."""
    ppr = paragraph.find("w:pPr", NSMAP)
    if ppr is None:
        return ""
    pstyle = ppr.find("w:pStyle", NSMAP)
    if pstyle is None:
        return ""
    return pstyle.get(f"{{{W_NS}}}val") or pstyle.get("val") or ""


def copy_paragraph_style(source: ET.Element, target: ET.Element) -> None:
    """Copy paragraph property block from source to target."""
    ppr = source.find("w:pPr", NSMAP)
    if ppr is not None:
        target.append(copy.deepcopy(ppr))


def make_text_run(text: str) -> ET.Element:
    """Create a plain run with text."""
    run = ET.Element(f"{{{W_NS}}}r")
    t = ET.SubElement(run, f"{{{W_NS}}}t")
    if text.startswith(" ") or text.endswith(" "):
        t.set(f"{{{XML_NS}}}space", "preserve")
    t.text = text
    return run


def replace_paragraph_content(paragraph: ET.Element, text: str) -> None:
    """Replace paragraph payload while preserving pPr."""
    ppr = paragraph.find("w:pPr", NSMAP)
    for child in list(paragraph):
        if ppr is not None and child is ppr:
            continue
        paragraph.remove(child)
    paragraph.append(make_text_run(text))


def find_ancestor_paragraph(node: ET.Element, parent_map: dict[ET.Element, ET.Element]) -> Optional[ET.Element]:
    """Ascend to nearest paragraph ancestor."""
    cursor: Optional[ET.Element] = node
    while cursor is not None:
        if cursor.tag == f"{{{W_NS}}}p":
            return cursor
        cursor = parent_map.get(cursor)
    return None


def resolve_selector_to_paragraph(root: ET.Element, selector: str) -> ET.Element:
    """Resolve a selector string to a unique paragraph element."""
    parent_map = build_parent_map(root)
    paragraphs = root.findall(".//w:p", NSMAP)
    prefix, _, payload = selector.partition(":")
    payload = payload.strip()

    if prefix == "text":
        matches = [p for p in paragraphs if payload and payload in paragraph_text(p)]
        if not matches:
            raise ValueError(f"selector `{selector}` matched no paragraph")
        if len(matches) > 1:
            raise ValueError(f"selector `{selector}` matched {len(matches)} paragraphs")
        return matches[0]

    if prefix == "bookmark":
        bookmarks = [
            node
            for node in root.findall(".//w:bookmarkStart", NSMAP)
            if (node.get(f"{{{W_NS}}}name") or node.get("name") or "") == payload
        ]
        if not bookmarks:
            raise ValueError(f"selector `{selector}` matched no bookmark")
        if len(bookmarks) > 1:
            raise ValueError(f"selector `{selector}` matched {len(bookmarks)} bookmarks")
        paragraph = find_ancestor_paragraph(bookmarks[0], parent_map)
        if paragraph is None:
            raise ValueError(f"selector `{selector}` has no paragraph ancestor")
        return paragraph

    if prefix == "xpath":
        nodes = root.findall(payload, NSMAP)
        if not nodes:
            raise ValueError(f"selector `{selector}` matched no node")
        if len(nodes) > 1:
            raise ValueError(f"selector `{selector}` matched {len(nodes)} nodes")
        paragraph = find_ancestor_paragraph(nodes[0], parent_map)
        if paragraph is None:
            raise ValueError(f"selector `{selector}` has no paragraph ancestor")
        return paragraph

    raise ValueError(
        f"selector `{selector}` unsupported; use text:, bookmark:, or xpath:"
    )


def delete_paragraph(root: ET.Element, paragraph: ET.Element) -> None:
    """Delete a paragraph from its parent."""
    parent_map = build_parent_map(root)
    parent = parent_map.get(paragraph)
    if parent is None:
        raise ValueError("target paragraph has no parent")
    parent.remove(paragraph)


def insert_paragraph_after(root: ET.Element, paragraph: ET.Element, text: str) -> None:
    """Insert a paragraph after target paragraph."""
    parent_map = build_parent_map(root)
    parent = parent_map.get(paragraph)
    if parent is None:
        raise ValueError("target paragraph has no parent")

    new_paragraph = ET.Element(f"{{{W_NS}}}p")
    copy_paragraph_style(paragraph, new_paragraph)
    new_paragraph.append(make_text_run(text))

    siblings = list(parent)
    idx = siblings.index(paragraph)
    parent.insert(idx + 1, new_paragraph)


def execute_mapping_rows(root: ET.Element, rows: List[dict[str, Any]]) -> List[str]:
    """Execute normalized mapping rows and return operation summaries."""
    summaries: List[str] = []

    for row in rows:
        row_id = row["id"]
        action = row["action"]
        selector = row["selector"]
        target_value = row["target_value"]

        paragraph = resolve_selector_to_paragraph(root, selector)
        before = paragraph_text(paragraph)
        style_id = paragraph_style_id(paragraph) or "default"

        if action == "replace":
            replace_paragraph_content(paragraph, target_value)
            summaries.append(
                f"{row_id}: replace on `{selector}` (style={style_id}) text `{before[:60]}` -> `{target_value[:60]}`"
            )
        elif action == "delete":
            delete_paragraph(root, paragraph)
            summaries.append(
                f"{row_id}: delete on `{selector}` removed paragraph `{before[:60]}`"
            )
        elif action == "insert":
            insert_paragraph_after(root, paragraph, target_value)
            summaries.append(
                f"{row_id}: insert after `{selector}` (style={style_id}) text `{target_value[:60]}`"
            )
        else:
            raise ValueError(f"Unsupported action `{action}`")

    return summaries


def repack_docx(extract_dir: Path, output_path: Path) -> None:
    """Pack extracted OOXML directory into DOCX with stable part ordering."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    files: List[Tuple[Path, str]] = []
    for file_path in extract_dir.rglob("*"):
        if file_path.is_file():
            arcname = str(file_path.relative_to(extract_dir))
            files.append((file_path, arcname))

    def sort_key(item: Tuple[Path, str]) -> Tuple[int, str]:
        _, name = item
        if name == "[Content_Types].xml":
            return (0, name)
        if name.startswith("_rels/"):
            return (1, name)
        if name.startswith("word/_rels/"):
            return (2, name)
        return (3, name)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path, arcname in sorted(files, key=sort_key):
            archive.write(file_path, arcname)


def action_map_apply(
    input_docx: str,
    mapping_path: str,
    output_docx: str,
    cli_required: Optional[Set[str]] = None,
    dry_run: bool = False,
    allow_tokens: Optional[List[str]] = None,
):
    """Apply mapping table operations to a template-derived DOCX."""
    input_path = Path(input_docx)
    output_path = Path(output_docx)
    mapping_file = Path(mapping_path)

    if not input_path.exists():
        print(f"- Input not found: {input_path}")
        sys.exit(1)

    print(f">> Mapping Apply: input={input_path}, mapping={mapping_file}")

    try:
        mapping_doc = load_mapping_doc(mapping_file)
    except ValueError as exc:
        print(f"- {exc}")
        sys.exit(1)

    result = evaluate_mapping_doc(mapping_doc, cli_required=cli_required)
    print_mapping_gate_summary(result)
    if result["errors"]:
        print("!! Mapping gate failed:")
        for err in result["errors"]:
            print(f"  - {err}")
        print("  Apply is blocked. Complete mapping or switch to template-apply rebuild mode.")
        sys.exit(1)

    rows = result["normalized_rows"]

    with tempfile.TemporaryDirectory(prefix="docx_map_apply_") as tmp:
        extract_dir = Path(tmp) / "unpacked"
        with zipfile.ZipFile(input_path, "r") as archive:
            archive.extractall(extract_dir)

        doc_path = extract_dir / "word" / "document.xml"
        if not doc_path.exists():
            print("- Invalid DOCX: missing word/document.xml")
            sys.exit(1)

        tree = ET.parse(doc_path)
        root = tree.getroot()

        try:
            summaries = execute_mapping_rows(root, rows)
        except ValueError as exc:
            print(f"!! Mapping apply failed: {exc}")
            sys.exit(1)

        print(f"   operations executed: {len(summaries)}")
        for line in summaries[:30]:
            print(f"  - {line}")
        if len(summaries) > 30:
            print(f"  ... ({len(summaries) - 30} more)")

        if dry_run:
            print("+ Dry-run passed (no output written)")
            return

        register_ooxml_namespaces()
        tree.write(doc_path, encoding="utf-8", xml_declaration=True)
        repack_docx(extract_dir, output_path)

    print(f"+ Mapping apply wrote: {output_path}")

    runtime = guarantee_dotnet()
    print(">> Post gates: audit")
    if not execute_verification(output_path, runtime):
        print("!! Post gate failed: audit")
        sys.exit(1)

    print(">> Post gates: residual")
    residual_findings = detect_residual_placeholders(output_path, allow_tokens=allow_tokens)
    if residual_findings:
        print("!! Post gate failed: residual placeholders detected")
        for token, count in residual_findings.most_common(20):
            print(f"  - {token!r}: {count} occurrence(s)")
        sys.exit(1)

    print("+ Post gates passed")


def parse_map_gate_args(argv: List[str]) -> Tuple[str, Set[str]]:
    """Parse map-gate command options."""
    if len(argv) < 3:
        print("Usage: python docx_engine.py map-gate <mapping.json> [--require ID[,ID...]]...")
        sys.exit(1)

    mapping_path = argv[2]
    required_ids: Set[str] = set()
    index = 3

    while index < len(argv):
        flag = argv[index]
        if flag == "--require":
            if index + 1 >= len(argv):
                print("Usage: python docx_engine.py map-gate <mapping.json> [--require ID[,ID...]]...")
                print("- Missing value after --require")
                sys.exit(1)
            for req in split_requirement_ids(argv[index + 1]):
                required_ids.add(req)
            index += 2
            continue

        print(f"- Unknown option for map-gate: {flag}")
        print("Usage: python docx_engine.py map-gate <mapping.json> [--require ID[,ID...]]...")
        sys.exit(1)

    return mapping_path, required_ids


def parse_map_apply_args(argv: List[str]) -> Tuple[str, str, str, Set[str], bool, List[str]]:
    """Parse map-apply command options."""
    if len(argv) < 5:
        print(
            "Usage: python docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> "
            "[--require ID[,ID...]]... [--dry-run] [--allow TOKEN]..."
        )
        sys.exit(1)

    input_docx = argv[2]
    mapping_path = argv[3]
    output_docx = argv[4]
    required_ids: Set[str] = set()
    dry_run = False
    allow_tokens: List[str] = []

    index = 5
    while index < len(argv):
        flag = argv[index]
        if flag == "--require":
            if index + 1 >= len(argv):
                print(
                    "Usage: python docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> "
                    "[--require ID[,ID...]]... [--dry-run] [--allow TOKEN]..."
                )
                print("- Missing value after --require")
                sys.exit(1)
            for req in split_requirement_ids(argv[index + 1]):
                required_ids.add(req)
            index += 2
            continue

        if flag == "--dry-run":
            dry_run = True
            index += 1
            continue

        if flag == "--allow":
            if index + 1 >= len(argv):
                print(
                    "Usage: python docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> "
                    "[--require ID[,ID...]]... [--dry-run] [--allow TOKEN]..."
                )
                print("- Missing TOKEN after --allow")
                sys.exit(1)
            allow_tokens.append(argv[index + 1])
            index += 2
            continue

        print(f"- Unknown option for map-apply: {flag}")
        print(
            "Usage: python docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> "
            "[--require ID[,ID...]]... [--dry-run] [--allow TOKEN]..."
        )
        sys.exit(1)

    return input_docx, mapping_path, output_docx, required_ids, dry_run, allow_tokens


def parse_map_template_args(argv: List[str]) -> Tuple[str, Set[str], str, bool]:
    """Parse map-template command options."""
    if len(argv) < 3:
        print(
            "Usage: python docx_engine.py map-template <mapping.json> "
            "[--require ID[,ID...]]... [--selector-kind text|bookmark|xpath] [--overwrite]"
        )
        sys.exit(1)

    output_path = argv[2]
    required_ids: Set[str] = set()
    selector_kind = "text"
    overwrite = False

    index = 3
    while index < len(argv):
        flag = argv[index]
        if flag == "--require":
            if index + 1 >= len(argv):
                print(
                    "Usage: python docx_engine.py map-template <mapping.json> "
                    "[--require ID[,ID...]]... [--selector-kind text|bookmark|xpath] [--overwrite]"
                )
                print("- Missing value after --require")
                sys.exit(1)
            for req in split_requirement_ids(argv[index + 1]):
                required_ids.add(req)
            index += 2
            continue

        if flag == "--selector-kind":
            if index + 1 >= len(argv):
                print(
                    "Usage: python docx_engine.py map-template <mapping.json> "
                    "[--require ID[,ID...]]... [--selector-kind text|bookmark|xpath] [--overwrite]"
                )
                print("- Missing value after --selector-kind")
                sys.exit(1)
            selector_kind = argv[index + 1].strip().lower()
            if selector_kind not in {"text", "bookmark", "xpath"}:
                print(f"- Unsupported --selector-kind: {selector_kind}")
                print("  Allowed: text, bookmark, xpath")
                sys.exit(1)
            index += 2
            continue

        if flag == "--overwrite":
            overwrite = True
            index += 1
            continue

        print(f"- Unknown option for map-template: {flag}")
        print(
            "Usage: python docx_engine.py map-template <mapping.json> "
            "[--require ID[,ID...]]... [--selector-kind text|bookmark|xpath] [--overwrite]"
        )
        sys.exit(1)

    return output_path, required_ids, selector_kind, overwrite


def show_usage():
    """Print command reference."""
    staging = resolve_staging_area()
    output = resolve_artifact_dir()

    usage = f"""
Usage: python docx_engine.py <command> [options]

IMPORTANT: Run from the user's working directory, not the skill directory.
  .docx_workspace/ and output/ are created under cwd.

Commands:
  doctor          Environment diagnostics and auto-setup
  render [name] [preset]   Build, execute, validate preset document (default preset: tech)
  audit FILE      Validate existing document
  preview FILE    Quick content preview (requires pandoc)
  order [name] [profile]  Show OOXML layered order (profiles: minimal/repair/compat/strict)
  residual FILE [--allow TOKEN]...  Check unresolved placeholder/sample text
  map-template OUTPUT [--require ID[,ID...]]... [--selector-kind text|bookmark|xpath] [--overwrite]
                Generate mapping.json scaffold (schema-aligned)
  map-gate FILE [--require ID[,ID...]]...  Validate mapping completeness for fill-mode
  map-apply INPUT MAPPING OUTPUT [--require ID[,ID...]]... [--dry-run] [--allow TOKEN]...
                Execute deterministic fill/patch operations after map-gate checks

Paths:
  Skill:     {SCRIPT_LOCATION}
  Workspace: {staging}
  Output:    {output}  (final deliverables)

Creation Workflow:
  1. python docx_engine.py doctor
  2. python docx_engine.py render report.docx tech

Modification Workflow:
  1. Analyze requirements
  2. python docx_engine.py render modified.docx academic

Template-Driven Workflow (when user provides a template):
  1. Keep the template as source of truth (no preset structure injection)
  2. Run: dotnet run --project "{SCRIPT_LOCATION / 'src' / 'DocForge.csproj'}" -- from-template template.docx output.docx
  3. Run: python docx_engine.py audit output.docx
  4. Run: python docx_engine.py residual output.docx
  5. Run: python docx_engine.py map-template mapping.json --require R1,R2
  6. Fill mapping rows, then: python docx_engine.py map-gate mapping.json --require R1,R2
  7. Run: python docx_engine.py map-apply output.docx mapping.json output_filled.docx --require R1,R2
"""
    print(usage.strip())


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help", "help"):
        show_usage()
        sys.exit(0)

    command = sys.argv[1]

    if command == "doctor":
        action_doctor()
    elif command == "render":
        target = sys.argv[2] if len(sys.argv) > 2 else None
        preset = sys.argv[3] if len(sys.argv) > 3 else "tech"
        action_render(target, preset)
    elif command == "audit":
        if len(sys.argv) < 3:
            print("Usage: python docx_engine.py audit <document.docx>")
            sys.exit(1)
        action_audit(sys.argv[2])
    elif command == "preview":
        if len(sys.argv) < 3:
            print("Usage: python docx_engine.py preview <document.docx>")
            sys.exit(1)
        action_preview(sys.argv[2])
    elif command == "order":
        action_order(
            container_name=sys.argv[2] if len(sys.argv) > 2 else None,
            profile=sys.argv[3] if len(sys.argv) > 3 else "repair",
        )
    elif command == "residual":
        path, allow_tokens = parse_residual_args(sys.argv)
        action_residual(path, allow_tokens=allow_tokens)
    elif command == "map-gate":
        mapping_path, required_ids = parse_map_gate_args(sys.argv)
        action_map_gate(mapping_path, cli_required=required_ids)
    elif command == "map-template":
        output_path, required_ids, selector_kind, overwrite = parse_map_template_args(sys.argv)
        action_map_template(
            output_path=output_path,
            cli_required=required_ids,
            selector_kind=selector_kind,
            overwrite=overwrite,
        )
    elif command == "map-apply":
        input_docx, mapping_path, output_docx, required_ids, dry_run, allow_tokens = parse_map_apply_args(sys.argv)
        action_map_apply(
            input_docx=input_docx,
            mapping_path=mapping_path,
            output_docx=output_docx,
            cli_required=required_ids,
            dry_run=dry_run,
            allow_tokens=allow_tokens,
        )
    else:
        print(f"Unknown command: {command}")
        print("Run 'python docx_engine.py help' for reference")
        sys.exit(1)


if __name__ == "__main__":
    main()
