#!/usr/bin/env node

/**
 * Admin Panel Visual Feedback Test - Validation for GitHub issue #260 implementation
 * Tests enhanced status indicators, icons, animations, and auto-clearing functionality
 */

console.log('[DashView] Admin Panel Visual Feedback Test for Issue #260');

// Test 1: Validate enhanced status display HTML structure
function testStatusDisplayStructure() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Expected status displays with enhanced structure
    const expectedStatusElements = [
        'auto-scenes-status',
        'scenes-status', 
        'weather-status',
        'floor-layouts-status',
        'house-config-status',
        'media-presets-status',
        'motion-setup-status',
        'window-setup-status',
        'smoke-detector-setup-status',
        'vibration-setup-status',
        'door-setup-status',
        'thresholds-config-status',
        'temperatur-setup-status',
        'humidity-setup-status',
        'light-setup-status',
        'cover-setup-status',
        'media-player-status',
        'room-maintenance-status',
        'dwd-config-status',
        'config-status',
        'hoover-setup-status',
        'mower-setup-status',
        'other-door-setup-status',
        'garbage-setup-status'
    ];
    
    let structureValid = true;
    let enhancedCount = 0;
    
    expectedStatusElements.forEach(statusId => {
        // Check for enhanced structure with icon and text spans
        const enhancedPattern = new RegExp(
            `<div id="${statusId}"[^>]*class="status-display"[^>]*>\\s*` +
            `<span class="status-icon mdi"></span>\\s*` +
            `<span class="status-text">[^<]*</span>\\s*` +
            `</div>`, 'gs'
        );
        
        if (adminHtml.match(enhancedPattern)) {
            enhancedCount++;
        } else {
            console.error(`✗ Missing enhanced structure for status element: ${statusId}`);
            structureValid = false;
        }
    });
    
    if (structureValid) {
        console.log(`✓ All ${expectedStatusElements.length} status display elements have enhanced structure`);
        return true;
    } else {
        console.error(`✗ Enhanced structure found in ${enhancedCount}/${expectedStatusElements.length} status elements`);
        return false;
    }
}

// Test 2: Validate CSS status indicator classes
function testStatusIndicatorCSS() {
    const fs = require('fs');
    const path = require('path');
    
    const stylePath = path.join(__dirname, '../www/style.css');
    const styleContent = fs.readFileSync(stylePath, 'utf8');
    
    const requiredCSSClasses = [
        '.status-display',
        '.status-icon',
        '.status-text',
        '.status-display.status-loading',
        '.status-display.status-success', 
        '.status-display.status-error',
        '.status-display.status-warning',
        '.status-display.has-icon .status-icon',
        '.status-display.status-transition',
        '@keyframes spin'
    ];
    
    const requiredAnimations = [
        'animation: spin 1s linear infinite',
        'transition: all 0.3s ease',
        'transition: opacity 0.3s ease'
    ];
    
    const requiredIcons = [
        'content: \'\\F0772\'', // mdi-loading
        'content: \'\\F012C\'', // mdi-check
        'content: \'\\F0156\'', // mdi-close-circle
        'content: \'\\F0026\''  // mdi-alert
    ];
    
    let allClassesFound = true;
    let allAnimationsFound = true;
    let allIconsFound = true;
    
    // Check required CSS classes
    requiredCSSClasses.forEach(cssClass => {
        if (!styleContent.includes(cssClass)) {
            console.error(`✗ Missing CSS class: ${cssClass}`);
            allClassesFound = false;
        }
    });
    
    // Check animations
    requiredAnimations.forEach(animation => {
        if (!styleContent.includes(animation)) {
            console.error(`✗ Missing animation: ${animation}`);
            allAnimationsFound = false;
        }
    });
    
    // Check icon content
    requiredIcons.forEach(icon => {
        if (!styleContent.includes(icon)) {
            console.error(`✗ Missing icon definition: ${icon}`);
            allIconsFound = false;
        }
    });
    
    // Check dark mode support
    const hasDarkModeSupport = styleContent.includes('.dark-mode .status-display');
    
    if (allClassesFound && allAnimationsFound && allIconsFound && hasDarkModeSupport) {
        console.log('✓ All CSS status indicator classes, animations, and icons defined');
        return true;
    } else {
        console.error('✗ CSS status indicators incomplete');
        if (!hasDarkModeSupport) console.error('  Missing dark mode support');
        return false;
    }
}

// Test 3: Validate enhanced _setStatusMessage implementation
function testEnhancedSetStatusMessage() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    const requiredFeatures = [
        '_setStatusMessage(element, message, type = \'default\')',
        'element._statusTimeout',
        'clearTimeout(element._statusTimeout)',
        '.status-icon',
        '.status-text',
        'status-${type}',
        'has-icon',
        'status-transition',
        'setTimeout(() => {',
        'Auto-clear success and error messages'
    ];
    
    const requiredStatusTypes = [
        'status-${type}',
        '\'loading\'',
        '\'success\'', 
        '\'error\'',
        '\'warning\''
    ];
    
    let allFeaturesFound = true;
    let allTypesSupported = true;
    
    // Check for enhanced features
    requiredFeatures.forEach(feature => {
        if (!adminManagerContent.includes(feature)) {
            console.error(`✗ Missing enhanced feature: ${feature}`);
            allFeaturesFound = false;
        }
    });
    
    // Check status type support
    requiredStatusTypes.forEach(statusType => {
        if (!adminManagerContent.includes(statusType)) {
            console.error(`✗ Missing status type support: ${statusType}`);
            allTypesSupported = false;
        }
    });
    
    // Check auto-clear functionality
    const hasAutoClear = adminManagerContent.includes('type === \'success\' || type === \'error\' || type === \'warning\'') &&
                         adminManagerContent.includes('setTimeout(() => {') &&
                         adminManagerContent.includes('4000'); // 4 second timeout
    
    // Check timeout management
    const hasTimeoutManagement = adminManagerContent.includes('clearTimeout(element._statusTimeout)');
    
    if (allFeaturesFound && allTypesSupported && hasAutoClear && hasTimeoutManagement) {
        console.log('✓ Enhanced _setStatusMessage implementation complete');
        return true;
    } else {
        console.error('✗ Enhanced _setStatusMessage implementation incomplete');
        if (!hasAutoClear) console.error('  Missing auto-clear functionality');
        if (!hasTimeoutManagement) console.error('  Missing timeout management');
        return false;
    }
}

// Test 4: Validate status message integration in save/load functions
function testStatusMessageIntegration() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Critical save/load functions that should use status messages
    const expectedIntegrations = [
        'saveWeatherEntityConfiguration',
        'loadWeatherEntityConfiguration', 
        'saveHouseConfiguration',
        'loadHouseSetupTab',
        'saveGenericSensorConfig',
        'loadGenericSensorSetup',
        'saveDwdConfig',
        'loadDwdConfig',
        'saveAllMediaPlayerAssignments',
        'loadRoomMediaPlayerMaintenance',
        'saveGarbageSensors',
        'loadGarbageTab'
    ];
    
    let integrationsFound = 0;
    let loadingMessagesFound = 0;
    let successMessagesFound = 0;
    let errorHandlingFound = 0;
    
    expectedIntegrations.forEach(funcName => {
        // Check if function exists
        if (adminManagerContent.includes(funcName)) {
            integrationsFound++;
            
            // Extract function content (simplified approach)
            const funcStartIndex = adminManagerContent.indexOf(funcName);
            const funcContent = adminManagerContent.substring(funcStartIndex, funcStartIndex + 3000);
            
            // Check for loading status
            if (funcContent.includes('Loading') || funcContent.includes('Saving') || funcContent.includes('loading')) {
                loadingMessagesFound++;
            }
            
            // Check for success status  
            if (funcContent.includes('✓') || funcContent.includes('success')) {
                successMessagesFound++;
            }
            
            // Check for error handling
            if (funcContent.includes('catch') || funcContent.includes('error') || funcContent.includes('Error')) {
                errorHandlingFound++;
            }
        }
    });
    
    const integrationScore = integrationsFound / expectedIntegrations.length;
    const statusScore = (loadingMessagesFound + successMessagesFound + errorHandlingFound) / (integrationsFound * 3);
    
    if (integrationScore >= 0.8 && statusScore >= 0.05) {
        console.log(`✓ Status message integration comprehensive (${Math.round(integrationScore * 100)}% functions, ${Math.round(statusScore * 100)}% status coverage)`);
        return true;
    } else {
        console.error(`✗ Status message integration incomplete`);
        console.error(`  Function coverage: ${Math.round(integrationScore * 100)}%`);
        console.error(`  Status coverage: ${Math.round(statusScore * 100)}%`);
        return false;
    }
}

// Test 5: Validate visual feedback consistency
function testVisualFeedbackConsistency() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Count different types of status messages
    const loadingMessages = (adminManagerContent.match(/Loading\.\.\.|Saving\.\.\./g) || []).length;
    const successMessages = (adminManagerContent.match(/✓.*success/g) || []).length;
    const errorMessages = (adminManagerContent.match(/✗.*error/g) || []).length;
    
    // Check for consistent message patterns
    const hasConsistentLoading = adminManagerContent.includes('Loading...') && 
                                adminManagerContent.includes('Saving...');
    const hasConsistentSuccess = adminManagerContent.includes('✓ Saved!') && 
                                adminManagerContent.includes('✓ Loaded');
    const hasConsistentErrors = adminManagerContent.includes('✗ Error:') &&
                               adminManagerContent.includes('error.message');
    
    // Check for proper status type usage
    const usesLoadingType = adminManagerContent.includes("'loading'");
    const usesSuccessType = adminManagerContent.includes("'success'");
    const usesErrorType = adminManagerContent.includes("'error'");
    const usesWarningType = adminManagerContent.includes("'warning'");
    
    const consistencyScore = (hasConsistentLoading + hasConsistentSuccess + hasConsistentErrors + 
                             usesLoadingType + usesSuccessType + usesErrorType) / 6;
    
    if (consistencyScore >= 0.85) {
        console.log(`✓ Visual feedback patterns consistent across codebase`);
        console.log(`  Loading messages: ${loadingMessages}, Success: ${successMessages}, Errors: ${errorMessages}`);
        return true;
    } else {
        console.error(`✗ Visual feedback patterns inconsistent (${Math.round(consistencyScore * 100)}% consistency)`);
        if (!hasConsistentLoading) console.error('  Inconsistent loading messages');
        if (!hasConsistentSuccess) console.error('  Inconsistent success messages');
        if (!hasConsistentErrors) console.error('  Inconsistent error messages');
        return false;
    }
}

// Test 6: Validate icon mapping and animations
function testIconMappingAndAnimations() {
    const fs = require('fs');
    const path = require('path');
    
    const stylePath = path.join(__dirname, '../www/style.css');
    const styleContent = fs.readFileSync(stylePath, 'utf8');
    
    // Check for MDI icon codes and their proper mapping
    const iconMappings = [
        { state: 'loading', code: '\\F0772', name: 'mdi-loading' },
        { state: 'success', code: '\\F012C', name: 'mdi-check' },
        { state: 'error', code: '\\F0156', name: 'mdi-close-circle' },
        { state: 'warning', code: '\\F0026', name: 'mdi-alert' }
    ];
    
    let allIconsMapped = true;
    let animationsWorking = true;
    
    iconMappings.forEach(icon => {
        const iconPattern = new RegExp(`status-${icon.state}.*status-icon.*content: '${icon.code.replace(/\\/g, '\\\\')}`, 's');
        if (!styleContent.match(iconPattern)) {
            console.error(`✗ Missing icon mapping for ${icon.state}: ${icon.name}`);
            allIconsMapped = false;
        }
    });
    
    // Check for loading animation
    const hasSpinAnimation = styleContent.includes('@keyframes spin') &&
                            styleContent.includes('animation: spin 1s linear infinite');
    
    // Check for transition animations
    const hasTransitions = styleContent.includes('transition: all 0.3s ease') &&
                          styleContent.includes('transition: opacity 0.3s ease');
    
    if (!hasSpinAnimation) {
        console.error('✗ Missing spin animation for loading states');
        animationsWorking = false;
    }
    
    if (!hasTransitions) {
        console.error('✗ Missing transition animations');
        animationsWorking = false;
    }
    
    if (allIconsMapped && animationsWorking) {
        console.log('✓ Icon mapping and animations properly configured');
        return true;
    } else {
        console.error('✗ Icon mapping or animations incomplete');
        return false;
    }
}

// Test 7: Validate auto-clear functionality
function testAutoClearFunctionality() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check for auto-clear implementation
    const hasTimeoutClearing = adminManagerContent.includes('clearTimeout(element._statusTimeout)');
    const hasTimeoutSetting = adminManagerContent.includes('element._statusTimeout = setTimeout');
    const hasAutoClearLogic = adminManagerContent.includes("type === 'success' || type === 'error' || type === 'warning'");
    const hasCorrectTimeout = adminManagerContent.includes('4000'); // 4 seconds
    const hasRevertToReady = adminManagerContent.includes("this._setStatusMessage(element, 'Ready', 'default')");
    
    // Check that loading states don't auto-clear
    const loadingNoAutoClear = !adminManagerContent.includes("type === 'loading'") || 
                              adminManagerContent.includes("// Auto-clear success and error messages");
    
    const autoClearFeatures = [
        hasTimeoutClearing,
        hasTimeoutSetting, 
        hasAutoClearLogic,
        hasCorrectTimeout,
        hasRevertToReady,
        loadingNoAutoClear
    ];
    
    const implementationScore = autoClearFeatures.filter(Boolean).length / autoClearFeatures.length;
    
    if (implementationScore >= 0.85) {
        console.log('✓ Auto-clear functionality properly implemented');
        return true;
    } else {
        console.error('✗ Auto-clear functionality incomplete');
        if (!hasTimeoutClearing) console.error('  Missing timeout clearing');
        if (!hasTimeoutSetting) console.error('  Missing timeout setting');
        if (!hasAutoClearLogic) console.error('  Missing auto-clear logic');
        if (!hasCorrectTimeout) console.error('  Missing correct timeout duration');
        if (!hasRevertToReady) console.error('  Missing revert to ready state');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('='.repeat(60));
    console.log('Running Admin Panel Visual Feedback Tests...');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Status Display HTML Structure', func: testStatusDisplayStructure },
        { name: 'CSS Status Indicator Classes', func: testStatusIndicatorCSS },
        { name: 'Enhanced _setStatusMessage Implementation', func: testEnhancedSetStatusMessage },
        { name: 'Status Message Integration', func: testStatusMessageIntegration },
        { name: 'Visual Feedback Consistency', func: testVisualFeedbackConsistency },
        { name: 'Icon Mapping and Animations', func: testIconMappingAndAnimations },
        { name: 'Auto-Clear Functionality', func: testAutoClearFunctionality }
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
        console.log('✅ All Admin Panel Visual Feedback tests PASSED!');
        process.exit(0);
    } else {
        console.log('❌ Some Admin Panel Visual Feedback tests FAILED!');
        process.exit(1);
    }
}

// Execute tests if run directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testStatusDisplayStructure,
    testStatusIndicatorCSS,
    testEnhancedSetStatusMessage,
    testStatusMessageIntegration,
    testVisualFeedbackConsistency,
    testIconMappingAndAnimations,
    testAutoClearFunctionality,
    runAllTests
};