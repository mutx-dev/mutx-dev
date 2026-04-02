#!/usr/bin/env python3
"""Launch wrapper - prevents the daemon from forking itself when run via launchd."""
from pathlib import Path
import os, sys

# If launched by launchd, don't fork - launchd manages the process
launchd = os.environ.get("LAUNCHD_SOCKET")

if not launchd:
    pid = os.fork()
    if pid:
        sys.exit(0)  # parent exits

# Child (or launchd-managed) continues
os.setsid()

# Add scripts/autonomy to path for the import
sys.path.insert(0, "/Users/fortune/MUTX/scripts/autonomy")
try:
    from mutx_autonomous_daemon import main_loop
    main_loop()
except ImportError as e:
    # Fallback: import with hyphen → underscore workaround
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "mutx_autonomous_daemon",
        "/Users/fortune/MUTX/scripts/autonomy/mutx-autonomous-daemon.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main_loop()