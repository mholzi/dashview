#!/usr/bin/env node

/**
 * Admin Entity Search Test - Validation for entity search/filter functionality
 * Tests the new search functionality added to admin panel entity lists
 */

console.log('[DashView] Admin Entity Search Test');

// Test 1: Validate that search inputs exist in admin.html
function testSearchInputsExist() {
    const fs = require('fs');
    const path = require('path');
    
    const adminHtmlPath = path.join(__dirname, '../www/admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Expected search inputs and their targets
    const expectedSearchInputs = [
        { placeholder: 'Search motion sensors...', target: 'motion-sensors-by-room' },
        { placeholder: 'Search window sensors...', target: 'window-sensors-by-room' },
        { placeholder: 'Search smoke detectors...', target: 'smoke-detector-sensors-by-room' },
        { placeholder: 'Search vibration sensors...', target: 'vibration-sensors-by-room' },
        { placeholder: 'Search door sensors...', target: 'door-sensors-by-room' },
        { placeholder: 'Search temperature sensors...', target: 'temperatur-sensors-by-room' },
        { placeholder: 'Search humidity sensors...', target: 'humidity-sensors-by-room' },
        { placeholder: 'Search light entities...', target: 'lights-by-room' },
        { placeholder: 'Search cover entities...', target: 'covers-by-room' },
        { placeholder: 'Search media players...', target: 'media-player-assignment-list' },
        { placeholder: 'Search hoover entities...', target: 'hoover-entities-list' },
        { placeholder: 'Search mower entities...', target: 'mower-entities-list' },
        { placeholder: 'Search door entities...', target: 'other-door-entities-list' },
        { placeholder: 'Search garbage sensors...', target: 'garbage-sensors-list' }
    ];
    
    let allInputsFound = true;
    let foundCount = 0;
    
    expectedSearchInputs.forEach(input => {
        const searchPattern = `placeholder="${input.placeholder}".*data-target="${input.target}"`;
        const regex = new RegExp(searchPattern);
        
        if (adminHtml.match(regex)) {
            foundCount++;
        } else {
            console.error(`✗ Missing search input: ${input.placeholder} -> ${input.target}`);
            allInputsFound = false;
        }
    });
    
    if (allInputsFound) {
        console.log(`✓ All ${expectedSearchInputs.length} search inputs exist in admin.html`);
        return true;
    } else {
        console.error(`✗ Found ${foundCount}/${expectedSearchInputs.length} search inputs`);
        return false;
    }
}

// Test 2: Validate search functionality exists in AdminManager.js
function testSearchFunctionsExist() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    const requiredFunctions = [
        '_attachEntitySearchListener',
        '_filterEntityListDisplay',
        '_updateSearchResultCount'
    ];
    
    const requiredFeatures = [
        'entity-search-input',
        'addEventListener(\'input\'',
        'searchTerm.toLowerCase()',
        'item.style.display',
        'search-result-count'
    ];
    
    let allFunctionsFound = true;
    let allFeaturesFound = true;
    
    // Check for required functions
    requiredFunctions.forEach(func => {
        if (!adminManagerContent.includes(func)) {
            console.error(`✗ Missing function: ${func}`);
            allFunctionsFound = false;
        }
    });
    
    // Check for required features
    requiredFeatures.forEach(feature => {
        if (!adminManagerContent.includes(feature)) {
            console.error(`✗ Missing feature: ${feature}`);
            allFeaturesFound = false;
        }
    });
    
    if (allFunctionsFound && allFeaturesFound) {
        console.log('✓ Search functionality exists in AdminManager.js');
        return true;
    } else {
        console.error('✗ Search functionality incomplete in AdminManager.js');
        return false;
    }
}

// Test 3: Validate search integration with rendering methods
function testSearchIntegrationExists() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    const expectedIntegrations = [
        '_renderGenericSensorSetup.*_attachEntitySearchListener',
        '_renderMediaPlayerAssignments.*_attachEntitySearchListener',
        '_renderOtherEntities.*_attachEntitySearchListener',
        '_renderGarbageSensors.*_attachEntitySearchListener'
    ];
    
    let allIntegrationsFound = true;
    
    expectedIntegrations.forEach(integration => {
        const regex = new RegExp(integration, 's'); // 's' flag for dotall mode
        if (!adminManagerContent.match(regex)) {
            console.error(`✗ Missing integration: ${integration}`);
            allIntegrationsFound = false;
        }
    });
    
    if (allIntegrationsFound) {
        console.log('✓ Search integration exists in all rendering methods');
        return true;
    } else {
        console.error('✗ Search integration incomplete in rendering methods');
        return false;
    }
}

// Test 4: Validate CSS styling for search inputs
function testSearchStylingExists() {
    const fs = require('fs');
    const path = require('path');
    
    const stylePath = path.join(__dirname, '../www/style.css');
    const styleContent = fs.readFileSync(stylePath, 'utf8');
    
    const requiredStyles = [
        '.entity-search-input',
        '.search-result-count',
        'placeholder',
        'border-color.*primary-color'
    ];
    
    let allStylesFound = true;
    
    requiredStyles.forEach(style => {
        const regex = new RegExp(style);
        if (!styleContent.match(regex)) {
            console.error(`✗ Missing CSS style: ${style}`);
            allStylesFound = false;
        }
    });
    
    if (allStylesFound) {
        console.log('✓ Search input styling exists in style.css');
        return true;
    } else {
        console.error('✗ Search input styling incomplete in style.css');
        return false;
    }
}

// Test 5: Case-insensitive search validation
function testCaseInsensitiveSearch() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check for case-insensitive search implementation
    const hasCaseInsensitive = adminManagerContent.includes('toLowerCase()') &&
                              adminManagerContent.includes('searchTerm.toLowerCase().trim()');
    
    if (hasCaseInsensitive) {
        console.log('✓ Case-insensitive search implementation found');
        return true;
    } else {
        console.error('✗ Case-insensitive search implementation missing');
        return false;
    }
}

// Test 6: Real-time filtering validation
function testRealTimeFiltering() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check for input event listener for real-time filtering
    const hasInputListener = adminManagerContent.includes("addEventListener('input'") &&
                            adminManagerContent.includes('_filterEntityListDisplay');
    
    const hasDisplayToggling = adminManagerContent.includes("item.style.display = isMatch ? '' : 'none'");
    
    if (hasInputListener && hasDisplayToggling) {
        console.log('✓ Real-time filtering implementation found');
        return true;
    } else {
        console.error('✗ Real-time filtering implementation missing');
        return false;
    }
}

// Test 7: Entity ID and friendly name search validation
function testEntitySearchScope() {
    const fs = require('fs');
    const path = require('path');
    
    const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Check that search covers both entity IDs and friendly names
    const searchesEntityId = adminManagerContent.includes('entityIdText') ||
                            adminManagerContent.includes('entity-id');
    const searchesFriendlyName = adminManagerContent.includes('labelText') ||
                               adminManagerContent.includes('nameText') ||
                               adminManagerContent.includes('checkbox-label');
    
    if (searchesEntityId && searchesFriendlyName) {
        console.log('✓ Search covers both entity IDs and friendly names');
        return true;
    } else {
        console.error('✗ Search scope incomplete - missing entity ID or friendly name search');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('='.repeat(60));
    console.log('Running Admin Entity Search Tests...');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Search Inputs Exist', func: testSearchInputsExist },
        { name: 'Search Functions Exist', func: testSearchFunctionsExist },
        { name: 'Search Integration Exists', func: testSearchIntegrationExists },
        { name: 'Search Styling Exists', func: testSearchStylingExists },
        { name: 'Case-Insensitive Search', func: testCaseInsensitiveSearch },
        { name: 'Real-Time Filtering', func: testRealTimeFiltering },
        { name: 'Entity Search Scope', func: testEntitySearchScope }
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
        console.log('✅ All Admin Entity Search tests PASSED!');
        process.exit(0);
    } else {
        console.log('❌ Some Admin Entity Search tests FAILED!');
        process.exit(1);
    }
}

// Execute tests if run directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testSearchInputsExist,
    testSearchFunctionsExist,
    testSearchIntegrationExists,
    testSearchStylingExists,
    testCaseInsensitiveSearch,
    testRealTimeFiltering,
    testEntitySearchScope,
    runAllTests
};