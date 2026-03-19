"""MUTX Textual TUI."""

from cli.tui.app import MutxTUI


def run_tui() -> None:
    MutxTUI().run()


__all__ = ["MutxTUI", "run_tui"]
