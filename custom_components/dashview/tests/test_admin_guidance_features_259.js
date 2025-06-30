#!/usr/bin/env node

/**
 * Admin Panel Guidance Features Test - Validation for GitHub issue #259 implementation
 * Tests tooltips, enhanced descriptions, and user onboarding improvements
 */

console.log('[DashView] Admin Panel Guidance Features Test for Issue #259');

// Test 1: Validate enhanced section descriptions exist
function testEnhancedSectionDescriptions() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Expected enhanced descriptions for major sections
    const expectedDescriptions = [
        {
            section: 'Manual Scene Buttons',
            keywords: ['custom scene buttons', 'room popups', 'entities', 'behaviors']
        },
        {
            section: 'Weather Entity',
            keywords: ['current conditions', 'forecasts', 'weather cards', 'automations']
        },
        {
            section: 'Floor Layout Editor',
            keywords: ['smart ranking', 'sensor state changes', 'importance', 'motion sensors']
        },
        {
            section: 'House Setup Configuration',
            keywords: ['JSON format', 'detailed control', 'modern approach', 'legacy']
        },
        {
            section: 'Media Player Presets',
            keywords: ['playlist shortcuts', 'quick-access buttons', 'Spotify', 'media sources']
        },
        {
            section: 'Room Maintenance',
            keywords: ['combined activity sensor', 'aggregate', 'presence detection']
        },
        {
            section: 'DWD Weather Warning',
            keywords: ['Deutscher Wetterdienst', 'German weather warnings', 'meteorological service']
        },
        {
            section: 'Garbage Collection Management',
            keywords: ['collection dates', 'German waste collection', 'adapted for other regions']
        }
    ];
    
    let allDescriptionsFound = true;
    let foundCount = 0;
    
    expectedDescriptions.forEach(desc => {
        const hasAllKeywords = desc.keywords.every(keyword => 
            adminHtml.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasAllKeywords) {
            foundCount++;
        } else {
            console.error(`✗ Missing enhanced description for ${desc.section}`);
            console.error(`  Missing keywords: ${desc.keywords.filter(kw => 
                !adminHtml.toLowerCase().includes(kw.toLowerCase())
            ).join(', ')}`);
            allDescriptionsFound = false;
        }
    });
    
    if (allDescriptionsFound) {
        console.log(`✓ All ${expectedDescriptions.length} enhanced section descriptions found`);
        return true;
    } else {
        console.error(`✗ Found ${foundCount}/${expectedDescriptions.length} enhanced descriptions`);
        return false;
    }
}

// Test 2: Validate tooltip attributes exist on complex input fields
function testTooltipAttributes() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Expected tooltip attributes for complex fields
    const expectedTooltips = [
        {
            field: 'new-scene-name',
            keywords: ['Friendly name', 'displayed', 'scene button']
        },
        {
            field: 'new-scene-id',
            keywords: ['Unique identifier', 'lowercase', 'underscores', 'unique across all scenes']
        },
        {
            field: 'new-scene-icon',
            keywords: ['Material Design Icon', 'mdi:icon-name', 'materialdesignicons.com']
        },
        {
            field: 'new-scene-type',
            keywords: ['Scene type', 'button behavior', 'styling', 'Cover for blinds']
        },
        {
            field: 'new-scene-entities',
            keywords: ['Home Assistant entity IDs', 'domain.entity_name', 'One entity per line']
        },
        {
            field: 'house-config',
            keywords: ['JSON format', 'room_key', 'friendly_name', 'combined_sensor']
        },
        {
            field: 'new-preset-name',
            keywords: ['Display name', 'preset button']
        },
        {
            field: 'new-preset-id',
            keywords: ['Media content identifier', 'spotify:playlist:', 'media-source://']
        },
        {
            field: 'new-garbage-sensor',
            keywords: ['Home Assistant sensor', 'collection date', 'date/datetime values']
        },
        {
            field: 'new-garbage-type',
            keywords: ['German waste types', 'Biomüll', 'organic', 'Gelber Sack']
        }
    ];
    
    let allTooltipsFound = true;
    let foundCount = 0;
    
    expectedTooltips.forEach(tooltip => {
        const fieldPattern = new RegExp(`id="${tooltip.field}"[^>]*data-tooltip="([^"]*)"`, 's');
        const match = adminHtml.match(fieldPattern);
        
        if (match) {
            const tooltipText = match[1];
            const hasRequiredKeywords = tooltip.keywords.some(keyword => 
                tooltipText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (hasRequiredKeywords) {
                foundCount++;
            } else {
                console.error(`✗ Tooltip for ${tooltip.field} missing required keywords`);
                console.error(`  Expected keywords: ${tooltip.keywords.join(', ')}`);
                console.error(`  Actual tooltip: "${tooltipText}"`);
                allTooltipsFound = false;
            }
        } else {
            console.error(`✗ Missing data-tooltip attribute for field: ${tooltip.field}`);
            allTooltipsFound = false;
        }
    });
    
    if (allTooltipsFound) {
        console.log(`✓ All ${expectedTooltips.length} tooltip attributes found with appropriate content`);
        return true;
    } else {
        console.error(`✗ Found ${foundCount}/${expectedTooltips.length} valid tooltips`);
        return false;
    }
}

// Test 3: Validate tooltip JavaScript implementation exists
function testTooltipJavaScriptImplementation() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    const requiredMethods = [
        '_initializeTooltips',
        '_showTooltip',
        '_hideTooltip', 
        '_positionTooltip'
    ];
    
    const requiredFeatures = [
        'data-tooltip',
        'mouseenter',
        'mouseleave',
        'focus',
        'blur',
        'dashview-tooltip',
        'data-tooltip-initialized',
        'requestAnimationFrame',
        'getBoundingClientRect'
    ];
    
    let allMethodsFound = true;
    let allFeaturesFound = true;
    
    // Check for required methods
    requiredMethods.forEach(method => {
        if (!adminManagerContent.includes(method)) {
            console.error(`✗ Missing tooltip method: ${method}`);
            allMethodsFound = false;
        }
    });
    
    // Check for required features
    requiredFeatures.forEach(feature => {
        if (!adminManagerContent.includes(feature)) {
            console.error(`✗ Missing tooltip feature: ${feature}`);
            allFeaturesFound = false;
        }
    });
    
    // Check for tooltip initialization call
    const hasInitCall = adminManagerContent.includes('this._initializeTooltips()');
    
    if (allMethodsFound && allFeaturesFound && hasInitCall) {
        console.log('✓ Tooltip JavaScript implementation complete');
        return true;
    } else {
        console.error('✗ Tooltip JavaScript implementation incomplete');
        if (!hasInitCall) console.error('  Missing tooltip initialization call');
        return false;
    }
}

// Test 4: Validate tooltip CSS styling exists
function testTooltipCSSStyles() {
    const fs = require('fs');
    const path = require('path');
    
    const stylePath = path.join(__dirname, '../www/style.css');
    const styleContent = fs.readFileSync(stylePath, 'utf8');
    
    const requiredStyles = [
        '.dashview-tooltip',
        'position: absolute',
        'z-index: 9999',
        'animation: tooltipFadeIn',
        '@keyframes tooltipFadeIn',
        '.tooltip-below::before',
        '.dashview-tooltip::after',
        '.dark-mode .dashview-tooltip'
    ];
    
    let allStylesFound = true;
    
    requiredStyles.forEach(style => {
        if (!styleContent.includes(style)) {
            console.error(`✗ Missing CSS style: ${style}`);
            allStylesFound = false;
        }
    });
    
    // Check for proper CSS variable usage
    const usesCSSVars = styleContent.includes('var(--gray800)') && 
                       styleContent.includes('var(--gray000)') &&
                       styleContent.includes('var(--primary-font-family)');
    
    if (allStylesFound && usesCSSVars) {
        console.log('✓ Tooltip CSS styling complete with theme support');
        return true;
    } else {
        console.error('✗ Tooltip CSS styling incomplete');
        if (!usesCSSVars) console.error('  Missing proper CSS variable usage');
        return false;
    }
}

// Test 5: Validate accessibility features
function testAccessibilityFeatures() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check for keyboard accessibility
    const hasKeyboardSupport = adminManagerContent.includes("addEventListener('focus'") &&
                              adminManagerContent.includes("addEventListener('blur'");
    
    // Check for proper ARIA considerations
    const hasProperHandling = adminManagerContent.includes('pointer-events: none') || 
                             adminManagerContent.includes('role=') ||
                             adminManagerContent.includes('aria-');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Check that tooltips don't interfere with form functionality
    const preservesFormFunctionality = !adminHtml.includes('onclick="') || 
                                      adminHtml.includes('data-tooltip');
    
    if (hasKeyboardSupport && preservesFormFunctionality) {
        console.log('✓ Accessibility features implemented');
        return true;
    } else {
        console.error('✗ Accessibility features incomplete');
        if (!hasKeyboardSupport) console.error('  Missing keyboard navigation support');
        if (!preservesFormFunctionality) console.error('  May interfere with form functionality');
        return false;
    }
}

// Test 6: Validate user guidance completeness
function testUserGuidanceCompleteness() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Check for DashView-specific concept explanations
    const conceptExplanations = [
        'combined activity sensor',
        'auto-generated scenes',
        'JSON format',
        'Material Design Icon',
        'Home Assistant entity IDs',
        'domain.entity_name'
    ];
    
    let explanationsFound = 0;
    conceptExplanations.forEach(concept => {
        if (adminHtml.toLowerCase().includes(concept.toLowerCase())) {
            explanationsFound++;
        }
    });
    
    // Check for examples and format guidance
    const hasExamples = adminHtml.includes('e.g.,') && 
                       adminHtml.includes('Format:') &&
                       adminHtml.includes('Examples:');
    
    // Check for error prevention guidance
    const hasErrorPrevention = adminHtml.includes('unique') &&
                              adminHtml.includes('required') &&
                              adminHtml.includes('case sensitivity');
    
    const completenessScore = explanationsFound / conceptExplanations.length;
    
    if (completenessScore >= 0.8 && hasExamples) {
        console.log(`✓ User guidance comprehensive (${Math.round(completenessScore * 100)}% concept coverage)`);
        return true;
    } else {
        console.error(`✗ User guidance incomplete (${Math.round(completenessScore * 100)}% concept coverage)`);
        if (!hasExamples) console.error('  Missing sufficient examples');
        if (!hasErrorPrevention) console.error('  Limited error prevention guidance');
        return false;
    }
}

// Test 7: Validate tooltip positioning and overflow handling
function testTooltipPositioning() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check for positioning logic
    const hasPositioning = adminManagerContent.includes('getBoundingClientRect') &&
                          adminManagerContent.includes('adjustedLeft') &&
                          adminManagerContent.includes('adjustedTop');
    
    // Check for overflow handling
    const hasOverflowHandling = adminManagerContent.includes('containerRect.width') &&
                               adminManagerContent.includes('tooltip-below');
    
    // Check for responsive positioning
    const hasResponsivePositioning = adminManagerContent.includes('requestAnimationFrame') &&
                                    adminManagerContent.includes('tooltipRect');
    
    if (hasPositioning && hasOverflowHandling && hasResponsivePositioning) {
        console.log('✓ Tooltip positioning handles edge cases and overflow');
        return true;
    } else {
        console.error('✗ Tooltip positioning incomplete');
        if (!hasPositioning) console.error('  Missing basic positioning logic');
        if (!hasOverflowHandling) console.error('  Missing overflow handling');
        if (!hasResponsivePositioning) console.error('  Missing responsive positioning');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('='.repeat(60));
    console.log('Running Admin Panel Guidance Features Tests...');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Enhanced Section Descriptions', func: testEnhancedSectionDescriptions },
        { name: 'Tooltip Attributes', func: testTooltipAttributes },
        { name: 'Tooltip JavaScript Implementation', func: testTooltipJavaScriptImplementation },
        { name: 'Tooltip CSS Styles', func: testTooltipCSSStyles },
        { name: 'Accessibility Features', func: testAccessibilityFeatures },
        { name: 'User Guidance Completeness', func: testUserGuidanceCompleteness },
        { name: 'Tooltip Positioning', func: testTooltipPositioning }
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
        console.log('✅ All Admin Panel Guidance Features tests PASSED!');
        process.exit(0);
    } else {
        console.log('❌ Some Admin Panel Guidance Features tests FAILED!');
        process.exit(1);
    }
}

// Execute tests if run directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testEnhancedSectionDescriptions,
    testTooltipAttributes,
    testTooltipJavaScriptImplementation,
    testTooltipCSSStyles,
    testAccessibilityFeatures,
    testUserGuidanceCompleteness,
    testTooltipPositioning,
    runAllTests
};