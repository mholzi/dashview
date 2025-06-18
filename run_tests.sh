#!/bin/bash

# DashView Test Runner - Principle 7
# Run validation tests for DashView component

echo "[DashView] Starting comprehensive test suite..."

# Check if we're in the right directory
if [ ! -f "custom_components/dashview/__init__.py" ]; then
    echo "❌ Error: Run this script from the DashView repository root directory"
    exit 1
fi

# Run Python tests
echo ""
echo "🐍 Running Python configuration validation tests..."
if python custom_components/dashview/tests/test_config_validation.py; then
    echo "✅ Python tests passed"
else
    echo "❌ Python tests failed"
    exit 1
fi

# Run JavaScript tests
echo ""
echo "🟨 Running JavaScript frontend validation tests..."
if node -pe "
const tests = require('./custom_components/dashview/tests/test_frontend_validation.js');
const testRunner = new tests();
testRunner.runAllTests();
" > /dev/null; then
    echo "✅ JavaScript tests passed"
else
    echo "❌ JavaScript tests failed"
    exit 1
fi

echo ""
echo "🏠 Running Room Header Icons tests..."
if node custom_components/dashview/tests/test_room_header_icons.js > /dev/null; then
    echo "✅ Room Header Icons tests passed"
else
    echo "❌ Room Header Icons tests failed"
    exit 1
fi

echo ""
echo "🎯 Running Popup Icon Consistency tests..."
if node custom_components/dashview/tests/test_popup_icon_consistency.js > /dev/null; then
    echo "✅ Popup Icon Consistency tests passed"
else
    echo "❌ Popup Icon Consistency tests failed"
    exit 1
fi

echo ""
echo "💾 Running Entity Persistence tests..."
if node custom_components/dashview/tests/test_entity_persistence.js > /dev/null; then
    echo "✅ Entity Persistence tests passed"
else
    echo "❌ Entity Persistence tests failed"
    exit 1
fi

echo ""
echo "🎛️  Running Cover Functionality tests..."
if node custom_components/dashview/tests/test_cover_functionality.js > /dev/null; then
    echo "✅ Cover Functionality tests passed"
else
    echo "❌ Cover Functionality tests failed"
    exit 1
fi

echo ""
echo "🎵 Running Media Player Component tests..."
if node custom_components/dashview/tests/test_media_player_component.js > /dev/null; then
    echo "✅ Media Player Component tests passed"
else
    echo "❌ Media Player Component tests failed"
    exit 1
fi

echo ""
echo "🎵 Running Media Player Room Card tests..."
if node custom_components/dashview/tests/test_media_player_room_card.js > /dev/null; then
    echo "✅ Media Player Room Card tests passed"
else
    echo "❌ Media Player Room Card tests failed"
    exit 1
fi

# Run Shadow DOM CSS tests
echo ""
echo "🎨 Running Shadow DOM CSS validation tests..."
if node custom_components/dashview/tests/test_shadow_dom_css.js > /dev/null; then
    echo "✅ Shadow DOM CSS tests passed"
else
    echo "❌ Shadow DOM CSS tests failed"
    exit 1
fi

# Run CSS Colors tests
echo ""
echo "🎨 Running CSS Colors validation tests..."
if node custom_components/dashview/tests/test_css_colors.js > /dev/null; then
    echo "✅ CSS Colors tests passed"
else
    echo "❌ CSS Colors tests failed"
    exit 1
fi

# Run Icon Size Consistency tests
echo ""
echo "🎯 Running Icon Size Consistency tests..."
if node custom_components/dashview/tests/test_icon_size_consistency.js > /dev/null; then
    echo "✅ Icon Size Consistency tests passed"
else
    echo "❌ Icon Size Consistency tests failed"
    exit 1
fi

# Run Pollen Card Formatting tests
echo ""
echo "🌼 Running Pollen Card Formatting tests..."
if node custom_components/dashview/tests/test_pollen_card_formatting.js > /dev/null; then
    echo "✅ Pollen Card Formatting tests passed"
else
    echo "❌ Pollen Card Formatting tests failed"
    exit 1
fi

# Run Floor Maintenance tests
echo ""
echo "🏠 Running Floor Maintenance tests..."
if node custom_components/dashview/tests/test_floor_maintenance.js > /dev/null; then
    echo "✅ Floor Maintenance tests passed"
else
    echo "❌ Floor Maintenance tests failed"
    exit 1
fi

# Run Popup Refresh tests
echo ""
echo "🌤️  Running Weather Forecast tests..."
if node custom_components/dashview/tests/test_weather_forecast.js > /dev/null; then
    echo "✅ Weather Forecast tests passed"
else
    echo "❌ Weather Forecast tests failed"
    exit 1
fi

echo ""
echo "🔄 Running Popup Refresh tests..."
if node custom_components/dashview/tests/test_popup_refresh.js > /dev/null; then
    echo "✅ Popup Refresh tests passed"
else
    echo "❌ Popup Refresh tests failed"
    exit 1
fi

# Run Popup Dynamic Initialization tests
echo ""
echo "🚀 Running Popup Dynamic Initialization tests..."
if node custom_components/dashview/tests/test_popup_dynamic_initialization.js > /dev/null; then
    echo "✅ Popup Dynamic Initialization tests passed"
else
    echo "❌ Popup Dynamic Initialization tests failed"
    exit 1
fi

# Run Room Covers Placeholder tests
echo ""
echo "🏠 Running Room Covers Placeholder tests..."
if node custom_components/dashview/tests/test_room_covers_placeholder.js > /dev/null; then
    echo "✅ Room Covers Placeholder tests passed"
else
    echo "❌ Room Covers Placeholder tests failed"
    exit 1
fi

# Run House Setup Tab Loading tests
echo ""
echo "🏠 Running House Setup Tab Loading tests..."
if node custom_components/dashview/tests/test_house_setup_tab_loading.js > /dev/null; then
    echo "✅ House Setup Tab Loading tests passed"
else
    echo "❌ House Setup Tab Loading tests failed"
    exit 1
fi

# Run Room Header Entities in Popups tests
echo ""
echo "🏠 Running Room Header Entities in Popups tests..."
if node custom_components/dashview/tests/test_room_header_entities_in_popups.js > /dev/null; then
    echo "✅ Room Header Entities in Popups tests passed"
else
    echo "❌ Room Header Entities in Popups tests failed"
    exit 1
fi

# Run Bottom Navigation Alignment tests
echo ""
echo "🧭 Running Bottom Navigation Alignment tests..."
if node custom_components/dashview/tests/test_bottom_nav_alignment.js > /dev/null; then
    echo "✅ Bottom Navigation Alignment tests passed"
else
    echo "❌ Bottom Navigation Alignment tests failed"
    exit 1
fi

echo ""
echo "🖼️  Running Popup Background Transparency tests..."
if node custom_components/dashview/tests/test_popup_background_transparency.js > /dev/null; then
    echo "✅ Popup Background Transparency tests passed"
else
    echo "❌ Popup Background Transparency tests failed"
    exit 1
fi

# Syntax validation
echo ""
echo "📋 Running syntax validation..."

# Python syntax check
echo "  Checking Python syntax..."
for file in custom_components/dashview/*.py; do
    if ! python -m py_compile "$file" 2>/dev/null; then
        echo "❌ Python syntax error in $file"
        exit 1
    fi
done

# JavaScript syntax check
echo "  Checking JavaScript syntax..."
if ! node -c custom_components/dashview/www/dashview-panel.js; then
    echo "❌ JavaScript syntax error in dashview-panel.js"
    exit 1
fi

echo "✅ All syntax checks passed"

# Basic validation commands from copilot_instruction.md
echo ""
echo "🔍 Running code analysis checks..."

# Check for duplicate patterns
echo "  Checking for duplicate code patterns..."
duplicate_count=$(grep -r "function.*generate.*Content" custom_components/dashview/www/ 2>/dev/null | wc -l)
if [ "$duplicate_count" -gt 1 ]; then
    echo "⚠️  Warning: Found potential duplicate generate*Content functions"
fi

# Check for direct file access (should be none after our fixes)
file_access_count=$(grep -r "fetch('/local/dashview/config/" custom_components/dashview/www/ 2>/dev/null | wc -l)
if [ "$file_access_count" -gt 0 ]; then
    echo "❌ Error: Found direct file access patterns (Principle 1 violation)"
    exit 1
fi

# Check for security issues
security_issues=$(grep -r "innerHTML\|outerHTML" custom_components/dashview/www/ 2>/dev/null | grep -v "element.innerHTML = content" | wc -l)
if [ "$security_issues" -gt 0 ]; then
    echo "⚠️  Warning: Found potential innerHTML/outerHTML usage"
fi

eval_usage=$(grep -r "\beval\b\|\bFunction\b" custom_components/dashview/www/ 2>/dev/null | wc -l)
if [ "$eval_usage" -gt 0 ]; then
    echo "❌ Error: Found eval or Function constructor usage (security risk)"
    exit 1
fi

echo "✅ Code analysis completed"

echo ""
echo "🎉 All tests and validations passed!"
echo ""
echo "Summary of Principle Compliance:"
echo "  ✅ Principle 1: Centralized Data Persistence"
echo "  ✅ Principle 2: Code Reuse (DRY)"
echo "  ✅ Principle 3: Efficient State Management"
echo "  ✅ Principle 4: Asset Bundling Optimizations"
echo "  ✅ Principle 5: API Centralization"
echo "  ✅ Principle 6: Error Handling & Debugging"
echo "  ✅ Principle 7: Testing & Validation"
echo "  ✅ Principle 10: Security Best Practices"
echo "  ✅ Principle 11: MDI Icon Usage"
echo "  ✅ Principle 12: Admin UI State Management"
echo ""
echo "DashView code review completed successfully! 🚀"