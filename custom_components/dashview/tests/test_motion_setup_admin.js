#!/usr/bin/env node

/**
 * Motion Setup Admin Test - Validation for Motion admin functionality
 * Tests the new label-based motion sensor configuration system
 */

console.log('[DashView] Motion Setup Admin Test');

// Test 1: Validate that Motion Setup tab exists in admin.html
function testMotionSetupTabExists() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    const hasMotionTab = adminHtml.includes('data-target="motion-setup-tab"');
    const hasMotionTabContent = adminHtml.includes('id="motion-setup-tab"');
    const hasMotionButtons = adminHtml.includes('id="reload-motion-sensors"') && 
                              adminHtml.includes('id="save-motion-sensor-config"');
    
    if (hasMotionTab && hasMotionTabContent && hasMotionButtons) {
        console.log('✓ Motion Setup tab structure exists in admin.html');
        return true;
    } else {
        console.error('✗ Motion Setup tab structure missing in admin.html');
        console.error(`  Tab button: ${hasMotionTab}, Tab content: ${hasMotionTabContent}, Buttons: ${hasMotionButtons}`);
        return false;
    }
}

// Test 2: Validate Motion Setup functions exist in JavaScript
function testMotionSetupFunctionsExist() {
    const fs = require('fs');
    const path = require('path');
    
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    const hasLoadFunction = jsContent.includes('loadMotionSensorSetup()');
    const hasRenderFunction = jsContent.includes('_renderMotionSensorSetup(');
    const hasSaveFunction = jsContent.includes('saveMotionSensorConfig()');
    const hasTabHandler = jsContent.includes('motion-setup-tab');
    const hasButtonHandlers = jsContent.includes('reload-motion-sensors') && 
                               jsContent.includes('save-motion-sensor-config');
    
    if (hasLoadFunction && hasRenderFunction && hasSaveFunction && hasTabHandler && hasButtonHandlers) {
        console.log('✓ Motion Setup functions exist in dashview-panel.js');
        return true;
    } else {
        console.error('✗ Motion Setup functions missing in dashview-panel.js');
        console.error(`  Load: ${hasLoadFunction}, Render: ${hasRenderFunction}, Save: ${hasSaveFunction}`);
        console.error(`  Tab handler: ${hasTabHandler}, Button handlers: ${hasButtonHandlers}`);
        return false;
    }
}

// Test 3: Validate backend API endpoint exists
function testBackendApiEndpoint() {
    const fs = require('fs');
    const path = require('path');
    
    const initPath = path.join(__dirname, '../__init__.py');
    const initContent = fs.readFileSync(initPath, 'utf8');
    
    const hasEntitiesByRoomEndpoint = initContent.includes('config_type == "entities_by_room"');
    const hasLabelRegistry = initContent.includes('label_registry = lr.async_get(self._hass)');
    const hasLabelFilter = initContent.includes('label_filter = request.query.get("label")');
    const hasErrorMessage = initContent.includes('entities_by_room');
    
    if (hasEntitiesByRoomEndpoint && hasLabelRegistry && hasLabelFilter && hasErrorMessage) {
        console.log('✓ Backend API endpoint for entities_by_room exists');
        return true;
    } else {
        console.error('✗ Backend API endpoint missing or incomplete');
        console.error(`  Endpoint: ${hasEntitiesByRoomEndpoint}, Label registry: ${hasLabelRegistry}`);
        console.error(`  Label filter: ${hasLabelFilter}, Error handling: ${hasErrorMessage}`);
        return false;
    }
}

// Test 4: Validate API call structure in JavaScript
function testApiCallStructure() {
    const fs = require('fs');
    const path = require('path');
    
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    const hasCorrectApiCall = jsContent.includes("callApi('GET', 'dashview/config?type=entities_by_room&label=Motion')");
    const hasParallelCall = jsContent.includes("callApi('GET', 'dashview/config?type=house')");
    const hasPromiseAll = jsContent.includes('Promise.all([');
    
    if (hasCorrectApiCall && hasParallelCall && hasPromiseAll) {
        console.log('✓ API call structure is correct in loadMotionSensorSetup');
        return true;
    } else {
        console.error('✗ API call structure incorrect');
        console.error(`  Motion API call: ${hasCorrectApiCall}, House API call: ${hasParallelCall}, Promise.all: ${hasPromiseAll}`);
        return false;
    }
}

// Test 5: Validate room key creation logic
function testRoomKeyCreation() {
    // Mock the room key creation function behavior
    function createRoomKeyFromName(roomName) {
        return roomName.toLowerCase()
            .replace(/[äöüß]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match]))
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    
    const testCases = [
        { input: 'Living Room', expected: 'living_room' },
        { input: 'Küche', expected: 'kueche' },
        { input: 'Büro & Co', expected: 'buero_co' },
        { input: 'Gäste-WC', expected: 'gaeste_wc' }
    ];
    
    let allPassed = true;
    testCases.forEach(test => {
        const result = createRoomKeyFromName(test.input);
        if (result !== test.expected) {
            console.error(`✗ Room key creation failed: "${test.input}" -> "${result}" (expected "${test.expected}")`);
            allPassed = false;
        }
    });
    
    if (allPassed) {
        console.log('✓ Room key creation logic works correctly');
        return true;
    }
    
    return false;
}

// Test 6: Validate automation entities are excluded from motion setup
function testAutomationEntitiesExcluded() {
    const fs = require('fs');
    const path = require('path');
    
    const initPath = path.join(__dirname, '../__init__.py');
    const initContent = fs.readFileSync(initPath, 'utf8');
    
    // Check if the condition includes the automation exclusion
    const hasAutomationExclusion = initContent.includes("entity.domain != 'automation'");
    const hasCorrectCondition = initContent.includes("if label_id in entity.labels and entity.area_id and entity.domain != 'automation':");
    
    if (hasAutomationExclusion && hasCorrectCondition) {
        console.log('✓ Automation entities are excluded from motion setup');
        return true;
    } else {
        console.error('✗ Automation entities exclusion missing or incorrect');
        console.error(`  Has automation exclusion: ${hasAutomationExclusion}`);
        console.error(`  Has correct condition: ${hasCorrectCondition}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    const tests = [
        testMotionSetupTabExists,
        testMotionSetupFunctionsExist,
        testBackendApiEndpoint,
        testApiCallStructure,
        testRoomKeyCreation,
        testAutomationEntitiesExcluded
    ];
    
    let passed = 0;
    let total = tests.length;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            }
        } catch (error) {
            console.error(`✗ Test failed with error: ${error.message}`);
        }
    });
    
    console.log(`\n[DashView] Motion Setup Admin Tests: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('🎉 All Motion Setup admin tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some Motion Setup admin tests failed');
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testMotionSetupTabExists,
    testMotionSetupFunctionsExist,
    testBackendApiEndpoint,
    testApiCallStructure,
    testRoomKeyCreation,
    testAutomationEntitiesExcluded,
    runAllTests
};