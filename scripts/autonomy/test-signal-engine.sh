#!/bin/bash
# Test the signal engine
cd /Users/fortune/MUTX
python3 -c "
import sys
sys.path.insert(0, 'scripts/autonomy')
# Test imports work
from pathlib import Path
import json, re, glob, time
from datetime import datetime
import subprocess

print('All imports OK')
print('REPO:', Path('.').resolve())
"