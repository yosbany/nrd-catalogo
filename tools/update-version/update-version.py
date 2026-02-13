#!/usr/bin/env python3
"""
Actualiza los parámetros de versión en index.html para cache busting
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

    html_path = script_dir / 'index.html'
    if not html_path.exists():
        print(f"❌ Error: {html_path} no encontrado")
        return

    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove existing version parameters
    html = re.sub(r'\?v=\d+', '', html)

    # Add version to CSS
    html = re.sub(
        r'(<link[^>]*href=["\'])(assets/styles/styles\.css)(["\'][^>]*>)',
        rf'\1\2?v={version}\3',
        html
    )

    # Add version to icon refs
    html = re.sub(
        r'(<link[^>]*href=["\'])(assets/icons/icon-192\.png)(["\'][^>]*>)',
        rf'\1\2?v={version}\3',
        html
    )

    # Add version to CATALOG_CACHE_VERSION (for dynamic asset URLs)
    html = re.sub(
        r"window\.CATALOG_CACHE_VERSION = '\d+';",
        f"window.CATALOG_CACHE_VERSION = '{version}';",
        html
    )

    # Add version to local script sources (modules, views, app.js, cart.js, catalog-config)
    for pattern in [
        r'(<script[^>]*src=["\'])(modules/storage\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(modules/cart\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(modules/catalog-config\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/home/home\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/catalog/catalog\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/product-detail/product-detail\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/cart/cart\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/checkout/checkout\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(views/success/success\.js)(["\'][^>]*>)',
        r'(<script[^>]*src=["\'])(app\.js)(["\'][^>]*>)',
    ]:
        html = re.sub(pattern, rf'\1\2?v={version}\3', html)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    import json
    version_path = script_dir / 'version.json'
    with open(version_path, 'w', encoding='utf-8') as f:
        json.dump({'v': version}, f)

    print(f"✅ {project_name}: Versión actualizada a {version}")


if __name__ == "__main__":
    project_name = sys.argv[1] if len(sys.argv) > 1 else None
    update_version(project_name)
