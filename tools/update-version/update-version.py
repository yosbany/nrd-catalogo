#!/usr/bin/env python3
"""
Actualiza version.json (sin tocar index.html).

Este proyecto no usa parámetros de versionado en URLs.
"""

import re
import sys
from pathlib import Path
from datetime import datetime


def update_version(project_name=None):
    version = int(datetime.now().timestamp() * 1000)

    script_dir = Path(__file__).parent.parent.parent
    if not project_name:
        project_name = script_dir.name

    import json
    version_path = script_dir / 'version.json'
    with open(version_path, 'w', encoding='utf-8') as f:
        json.dump({'v': version}, f)

    print(f"✅ {project_name}: Versión actualizada a {version}")


if __name__ == "__main__":
    project_name = sys.argv[1] if len(sys.argv) > 1 else None
    update_version(project_name)
