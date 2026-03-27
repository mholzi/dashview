#!/usr/bin/env bash
# check-version.sh — Verify all version constants are in sync
#
# Usage:
#   ./scripts/check-version.sh
#   npm run check-version
#
# Exit code 0 = all versions match, 1 = drift detected
# Use in CI or as a pre-commit hook to prevent version drift.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Extract versions from each file
V_CONST=$(grep '^VERSION = ' "${ROOT}/custom_components/dashview/const.py" | sed 's/VERSION = "\(.*\)"/\1/')
V_MANIFEST=$(python3 -c "import json; print(json.load(open('${ROOT}/custom_components/dashview/manifest.json'))['version'])")
V_PANEL=$(grep 'const DASHVIEW_VERSION = ' "${ROOT}/custom_components/dashview/frontend/dashview-panel.js" | sed 's/.*const DASHVIEW_VERSION = "\(.*\)".*/\1/')
V_CHANGELOG=$(grep "export const CURRENT_VERSION = " "${ROOT}/custom_components/dashview/frontend/constants/changelog.js" | sed "s/.*CURRENT_VERSION = '\(.*\)'.*/\1/")

# Compare
ALL_MATCH=true
echo "Version check:"
echo "  const.py:         ${V_CONST}"
echo "  manifest.json:    ${V_MANIFEST}"
echo "  dashview-panel.js: ${V_PANEL}"
echo "  changelog.js:     ${V_CHANGELOG}"

if [ "${V_CONST}" != "${V_MANIFEST}" ] || [ "${V_CONST}" != "${V_PANEL}" ] || [ "${V_CONST}" != "${V_CHANGELOG}" ]; then
  echo ""
  echo "ERROR: Version mismatch detected!"
  echo "Run: npm run bump-version ${V_CONST}"
  exit 1
fi

echo ""
echo "All versions match: ${V_CONST}"
exit 0
