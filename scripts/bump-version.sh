#!/usr/bin/env bash
# bump-version.sh — Update version in all locations from a single source
#
# Usage:
#   ./scripts/bump-version.sh 1.5.0-beta.19
#   npm run bump-version 1.5.0-beta.19
#
# Updates:
#   - custom_components/dashview/const.py           (VERSION)
#   - custom_components/dashview/manifest.json       ("version")
#   - custom_components/dashview/frontend/dashview-panel.js  (DASHVIEW_VERSION)
#   - custom_components/dashview/frontend/constants/changelog.js (CURRENT_VERSION)

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <new-version>"
  echo "Example: $0 1.5.0-beta.19"
  exit 1
fi

NEW_VERSION="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Bumping version to ${NEW_VERSION}..."

# 1. const.py
sed -i '' "s/^VERSION = \".*\"/VERSION = \"${NEW_VERSION}\"/" \
  "${ROOT}/custom_components/dashview/const.py"
echo "  ✓ const.py"

# 2. manifest.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"${NEW_VERSION}\"/" \
  "${ROOT}/custom_components/dashview/manifest.json"
echo "  ✓ manifest.json"

# 3. dashview-panel.js
sed -i '' "s/const DASHVIEW_VERSION = \".*\"/const DASHVIEW_VERSION = \"${NEW_VERSION}\"/" \
  "${ROOT}/custom_components/dashview/frontend/dashview-panel.js"
echo "  ✓ dashview-panel.js"

# 4. changelog.js
sed -i '' "s/export const CURRENT_VERSION = '.*'/export const CURRENT_VERSION = '${NEW_VERSION}'/" \
  "${ROOT}/custom_components/dashview/frontend/constants/changelog.js"
echo "  ✓ changelog.js"

# Verify all match
echo ""
echo "Verification:"
grep -n "VERSION" "${ROOT}/custom_components/dashview/const.py" | head -1
grep -n "version" "${ROOT}/custom_components/dashview/manifest.json" | grep -v "lockfile"
grep -n "DASHVIEW_VERSION" "${ROOT}/custom_components/dashview/frontend/dashview-panel.js" | head -1
grep -n "CURRENT_VERSION" "${ROOT}/custom_components/dashview/frontend/constants/changelog.js" | head -1

echo ""
echo "Done! All 4 files updated to ${NEW_VERSION}"
