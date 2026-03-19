"""mutx.dev CLI - Deploy and manage agents."""

from importlib.metadata import PackageNotFoundError, version


try:
    __version__ = version("mutx")
except PackageNotFoundError:
    __version__ = "0.2.0"
