"""mutx.dev CLI - Deploy and manage agents."""

from importlib.metadata import PackageNotFoundError, version


try:
    __version__ = version("mutx-cli")
except PackageNotFoundError:
    __version__ = "0.2.1"
