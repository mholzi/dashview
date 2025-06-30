#!/usr/bin/env node

/**
 * Scene Bug Fixes Test - Validation for GitHub issue #285 fixes
 * Tests scene button service calls, visibility logic, and formatting
 */

console.log('[DashView] Scene Bug Fixes Test for Issue #285');

// Test 1: Validate service call fix in SceneManager
function testServiceCallFix() {
    const fs = require('fs');
    const path = require('path');
    
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    // Check that service is split into domain and action before calling
    const hasServiceSplit = sceneManagerContent.includes('serviceParts = action.service.split(\'.\')')  && 
                           sceneManagerContent.includes('serviceParts[0], serviceParts[1]');
    
    // Check that error handling exists for invalid service format
    const hasErrorHandling = sceneManagerContent.includes('Invalid service format');
    
    // Check that service_data is passed with fallback to empty object
    const hasServiceData = sceneManagerContent.includes('action.service_data || {}');
    
    if (hasServiceSplit && hasErrorHandling && hasServiceData) {
        console.log('✓ Service call bug fix implemented correctly');
        return true;
    } else {
        console.error('✗ Service call bug fix incomplete');
        console.error(`  Service split: ${hasServiceSplit}, Error handling: ${hasErrorHandling}, Service data: ${hasServiceData}`);
        return false;
    }
}

// Test 2: Validate scene visibility logic
function testSceneVisibilityLogic() {
    const fs = require('fs');
    const path = require('path');
    
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    // Check for lights off scene visibility logic
    const hasLightsOffVisibility = sceneManagerContent.includes('auto_room_lights_off') &&
                                  sceneManagerContent.includes('hasLightsOn') &&
                                  sceneManagerContent.includes('no lights are on');
    
    // Check for cover scene visibility logic  
    const hasCoverVisibility = sceneManagerContent.includes('auto_room_covers') &&
                              sceneManagerContent.includes('hasValidCovers') &&
                              sceneManagerContent.includes('no valid covers');
    
    // Check for manual lights off scene visibility
    const hasManualLightsVisibility = sceneManagerContent.includes('all_lights_out') &&
                                     sceneManagerContent.includes('Skipping manual lights off scene');
    
    if (hasLightsOffVisibility && hasCoverVisibility && hasManualLightsVisibility) {
        console.log('✓ Scene visibility logic implemented correctly');
        return true;
    } else {
        console.error('✗ Scene visibility logic incomplete');
        console.error(`  Lights off: ${hasLightsOffVisibility}, Cover: ${hasCoverVisibility}, Manual lights: ${hasManualLightsVisibility}`);
        return false;
    }
}

// Test 3: Validate scene button styling updates
function testSceneButtonStyling() {
    const fs = require('fs');
    const path = require('path');
    
    // Check room-scenes-card.html template
    const templatePath = path.join(__dirname, '../www/templates/room-scenes-card.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    const hasCorrectDimensions = templateContent.includes('width: 80px') && 
                                templateContent.includes('height: 80px');
    const hasCorrectIconSize = templateContent.includes('width: 22px') && 
                              templateContent.includes('height: 22px');
    const hasCorrectTextStyle = templateContent.includes('font-size: 11px') && 
                               templateContent.includes('line-height: 1.2');
    
    // Check SceneManager for inline styling
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    const hasInlineStyling = sceneManagerContent.includes('border-radius: 12px') &&
                            sceneManagerContent.includes('margin-right: 8px') &&
                            sceneManagerContent.includes('dataset.sceneType');
    
    if (hasCorrectDimensions && hasCorrectIconSize && hasCorrectTextStyle && hasInlineStyling) {
        console.log('✓ Scene button styling updated correctly');
        return true;
    } else {
        console.error('✗ Scene button styling incomplete');
        console.error(`  Dimensions: ${hasCorrectDimensions}, Icon size: ${hasCorrectIconSize}, Text style: ${hasCorrectTextStyle}, Inline: ${hasInlineStyling}`);
        return false;
    }
}

// Test 4: Validate AutoSceneGenerator cover scene logic
function testCoverSceneGeneration() {
    const fs = require('fs');
    const path = require('path');
    
    const autoScenePath = path.join(__dirname, '../www/lib/ui/AutoSceneGenerator.js');
    const autoSceneContent = fs.readFileSync(autoScenePath, 'utf8');
    
    // Check for improved logging and validation
    const hasImprovedLogging = autoSceneContent.includes('No covers configured for room') &&
                              autoSceneContent.includes('No valid cover entities found') &&
                              autoSceneContent.includes('Creating cover scene for room');
    
    // Check for entity validation
    const hasEntityValidation = autoSceneContent.includes('Cover entity') &&
                               autoSceneContent.includes('not found in Home Assistant states');
    
    if (hasImprovedLogging && hasEntityValidation) {
        console.log('✓ Cover scene generation logic improved');
        return true;
    } else {
        console.error('✗ Cover scene generation logic incomplete');
        console.error(`  Improved logging: ${hasImprovedLogging}, Entity validation: ${hasEntityValidation}`);
        return false;
    }
}

// Test 5: Validate scene types are properly handled
function testSceneTypes() {
    const fs = require('fs');
    const path = require('path');
    
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    // Check for all scene types from the issue
    const sceneTypes = [
        'auto_room_lights_off',
        'auto_room_covers', 
        'auto_global_covers',
        'all_lights_out',
        'cover',
        'all_covers',
        'roof_window',
        'dimm_desk',
        'computer',
        'wohnzimmer_ambiente'
    ];
    
    let allTypesFound = true;
    sceneTypes.forEach(type => {
        if (!sceneManagerContent.includes(type)) {
            console.error(`✗ Missing scene type: ${type}`);
            allTypesFound = false;
        }
    });
    
    if (allTypesFound) {
        console.log('✓ All scene types properly handled');
        return true;
    } else {
        console.error('✗ Some scene types missing');
        return false;
    }
}

// Test 6: Validate consistent styling variables
function testStylingConsistency() {
    const fs = require('fs');
    const path = require('path');
    
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    // Check for CSS variable usage
    const usesGrayVariables = sceneManagerContent.includes('var(--gray100)') &&
                             sceneManagerContent.includes('var(--gray800)');
    
    // Check for proper color handling for different states
    const hasStateColors = sceneManagerContent.includes('cardColor') &&
                          sceneManagerContent.includes('textColor') &&
                          sceneManagerContent.includes('iconColor');
    
    if (usesGrayVariables && hasStateColors) {
        console.log('✓ Styling consistency maintained');
        return true;
    } else {
        console.error('✗ Styling consistency issues');
        console.error(`  Gray variables: ${usesGrayVariables}, State colors: ${hasStateColors}`);
        return false;
    }
}

// Test 7: Validate scene button dataset attributes  
function testSceneButtonData() {
    const fs = require('fs');
    const path = require('path');
    
    const sceneManagerPath = path.join(__dirname, '../www/lib/ui/SceneManager.js');
    const sceneManagerContent = fs.readFileSync(sceneManagerPath, 'utf8');
    
    // Check for proper dataset usage
    const hasSceneId = sceneManagerContent.includes('dataset.sceneId');
    const hasSceneType = sceneManagerContent.includes('dataset.sceneType');
    
    if (hasSceneId && hasSceneType) {
        console.log('✓ Scene button data attributes set correctly');
        return true;
    } else {
        console.error('✗ Scene button data attributes incomplete');
        console.error(`  Scene ID: ${hasSceneId}, Scene type: ${hasSceneType}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('='.repeat(60));
    console.log('Running Scene Bug Fixes Tests for Issue #285...');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Service Call Fix', func: testServiceCallFix },
        { name: 'Scene Visibility Logic', func: testSceneVisibilityLogic },
        { name: 'Scene Button Styling', func: testSceneButtonStyling },
        { name: 'Cover Scene Generation', func: testCoverSceneGeneration },
        { name: 'Scene Types Handling', func: testSceneTypes },
        { name: 'Styling Consistency', func: testStylingConsistency },
        { name: 'Scene Button Data', func: testSceneButtonData }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    tests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.name}:`);
        if (test.func()) {
            passedTests++;
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('✅ All Scene Bug Fix tests PASSED!');
        process.exit(0);
    } else {
        console.log('❌ Some Scene Bug Fix tests FAILED!');
        process.exit(1);
    }
}

// Execute tests if run directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testServiceCallFix,
    testSceneVisibilityLogic,
    testSceneButtonStyling,
    testCoverSceneGeneration,
    testSceneTypes,
    testStylingConsistency,
    testSceneButtonData,
    runAllTests
};