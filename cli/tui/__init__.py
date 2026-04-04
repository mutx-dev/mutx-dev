"""MUTX Textual TUI."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from cli.tui.app import MutxTUI


def run_tui() -> None:
    from cli.tui.app import MutxTUI

    MutxTUI().run()


def __getattr__(name: str):
    if name == "MutxTUI":
        from cli.tui.app import MutxTUI

        return MutxTUI
    raise AttributeError(name)


__all__ = ["MutxTUI", "run_tui"]
