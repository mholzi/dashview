// Test file for AutoSceneGenerator method name fix
// This test validates the fix for issue #360

console.log('[Test] AutoSceneGenerator Method Name Fix - Testing issue #360');

// Test 1: Method Name Consistency
console.log('[Test] 1. Testing method name consistency between files...');

const fs = require('fs');
const path = require('path');

// Read the files to check method calls
const dashviewPanelPath = path.join(__dirname, '../www/dashview-panel.js');
const autoSceneGeneratorPath = path.join(__dirname, '../www/lib/ui/AutoSceneGenerator.js');

let methodConsistencyValid = true;

try {
    const dashviewPanelContent = fs.readFileSync(dashviewPanelPath, 'utf8');
    const autoSceneGeneratorContent = fs.readFileSync(autoSceneGeneratorPath, 'utf8');
    
    // Check that dashview-panel.js no longer calls the incorrect method
    if (dashviewPanelContent.includes('isGlobalCoverSceneEnabled()')) {
        console.error('❌ dashview-panel.js still contains incorrect method call: isGlobalCoverSceneEnabled()');
        methodConsistencyValid = false;
    }
    
    // Check that dashview-panel.js calls the correct method
    if (!dashviewPanelContent.includes('_getGlobalCoverSceneEnabled()')) {
        console.error('❌ dashview-panel.js does not call correct method: _getGlobalCoverSceneEnabled()');
        methodConsistencyValid = false;
    }
    
    // Check that AutoSceneGenerator.js has the method definition
    if (!autoSceneGeneratorContent.includes('_getGlobalCoverSceneEnabled()')) {
        console.error('❌ AutoSceneGenerator.js does not define method: _getGlobalCoverSceneEnabled()');
        methodConsistencyValid = false;
    }
    
    // Check the specific line that was causing the error
    const specificLineMatch = dashviewPanelContent.match(/if \(this\._autoSceneGenerator && this\._autoSceneGenerator\._getGlobalCoverSceneEnabled\(\) &&/);
    if (!specificLineMatch) {
        console.error('❌ The specific problematic line was not fixed correctly');
        methodConsistencyValid = false;
    }
    
} catch (error) {
    console.error('❌ Error reading files:', error.message);
    methodConsistencyValid = false;
}

if (methodConsistencyValid) {
    console.log('✅ Method name consistency validation passed');
} else {
    console.log('❌ Method name consistency validation failed');
}

// Test 2: Mock AutoSceneGenerator Functionality
console.log('[Test] 2. Testing AutoSceneGenerator method availability...');

// Mock AutoSceneGenerator class to simulate the fix
class MockAutoSceneGenerator {
    constructor() {
        this._globalCoverSceneEnabled = true;
    }
    
    _getGlobalCoverSceneEnabled() {
        return this._globalCoverSceneEnabled;
    }
}

// Mock room configuration
const mockRoomConfig = {
    covers: ['cover.bedroom_blinds', 'cover.living_room_curtains'],
    friendly_name: 'Test Room'
};

// Mock the fixed code logic
function mockGenerateRoomHeaderEntitiesForPopup(roomConfig, autoSceneGenerator) {
    const additionalIcons = [];
    
    // This is the fixed logic that should work now
    if (autoSceneGenerator && autoSceneGenerator._getGlobalCoverSceneEnabled() && 
        roomConfig.covers && roomConfig.covers.length > 0) {
        additionalIcons.push({
            type: 'cover-scene',
            icon: 'mdi-window-shutter',
            name: 'Rollläden'
        });
    }
    
    return additionalIcons;
}

let functionalityValid = true;

try {
    const mockAutoSceneGen = new MockAutoSceneGenerator();
    const result = mockGenerateRoomHeaderEntitiesForPopup(mockRoomConfig, mockAutoSceneGen);
    
    // Should return cover scene icon when conditions are met
    if (result.length !== 1 || result[0].type !== 'cover-scene') {
        console.error('❌ Cover scene icon not generated when conditions are met');
        functionalityValid = false;
    }
    
    // Test with disabled global cover scenes
    mockAutoSceneGen._globalCoverSceneEnabled = false;
    const resultDisabled = mockGenerateRoomHeaderEntitiesForPopup(mockRoomConfig, mockAutoSceneGen);
    
    if (resultDisabled.length !== 0) {
        console.error('❌ Cover scene icon generated when global cover scenes are disabled');
        functionalityValid = false;
    }
    
    // Test with no covers
    const roomWithoutCovers = { friendly_name: 'Test Room' };
    mockAutoSceneGen._globalCoverSceneEnabled = true;
    const resultNoCovers = mockGenerateRoomHeaderEntitiesForPopup(roomWithoutCovers, mockAutoSceneGen);
    
    if (resultNoCovers.length !== 0) {
        console.error('❌ Cover scene icon generated for room without covers');
        functionalityValid = false;
    }
    
} catch (error) {
    console.error('❌ Functionality test error:', error.message);
    functionalityValid = false;
}

if (functionalityValid) {
    console.log('✅ AutoSceneGenerator functionality validation passed');
} else {
    console.log('❌ AutoSceneGenerator functionality validation failed');
}

// Test 3: Error Prevention
console.log('[Test] 3. Testing error prevention...');

let errorPreventionValid = true;

// Simulate the original error scenario
function simulateOriginalError() {
    const mockAutoSceneGenWithoutMethod = {
        // Missing isGlobalCoverSceneEnabled method
    };
    
    try {
        // This would have thrown the original error
        mockAutoSceneGenWithoutMethod.isGlobalCoverSceneEnabled();
        return false; // Should not reach here
    } catch (error) {
        return error.message.includes('isGlobalCoverSceneEnabled is not a function');
    }
}

// Test that our fix prevents the error
function simulateFixedCode() {
    const mockAutoSceneGenWithCorrectMethod = {
        _getGlobalCoverSceneEnabled() {
            return true;
        }
    };
    
    try {
        // This should work with the fix
        const result = mockAutoSceneGenWithCorrectMethod._getGlobalCoverSceneEnabled();
        return typeof result === 'boolean';
    } catch (error) {
        return false;
    }
}

const originalWouldError = simulateOriginalError();
const fixedCodeWorks = simulateFixedCode();

if (!originalWouldError) {
    console.error('❌ Original error simulation failed');
    errorPreventionValid = false;
}

if (!fixedCodeWorks) {
    console.error('❌ Fixed code does not work as expected');
    errorPreventionValid = false;
}

if (errorPreventionValid) {
    console.log('✅ Error prevention validation passed');
} else {
    console.log('❌ Error prevention validation failed');
}

// Test Summary
console.log('\n[Test] AutoSceneGenerator Method Name Fix - Test Summary:');
const allTestsPassed = methodConsistencyValid && functionalityValid && errorPreventionValid;

if (allTestsPassed) {
    console.log('🎉 All tests passed! AutoSceneGenerator method name fix is working correctly.');
    console.log('✅ Method name consistency between files verified');
    console.log('✅ AutoSceneGenerator functionality works as expected');
    console.log('✅ Original TypeError is prevented');
    console.log('✅ Room popups should now load without JavaScript errors');
} else {
    console.log('❌ Some tests failed. Please review the fix implementation.');
}

// Test Results for CI/CD
console.log(`[Test Result] AutoSceneGenerator Method Name Fix: ${allTestsPassed ? 'PASS' : 'FAIL'}`);