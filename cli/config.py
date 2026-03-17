"""CLI Configuration - backwards compatibility re-export.

This module is deprecated. Use mutx.services instead.
"""

# Re-export from new location for backwards compatibility
from mutx.services.base import CLIConfig, get_client

__all__ = ["CLIConfig", "get_client"]
