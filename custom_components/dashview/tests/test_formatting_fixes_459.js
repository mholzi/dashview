#!/usr/bin/env node

/**
 * Test formatting fixes for issue #459
 * Tests the three specific formatting improvements:
 * 1. Garbage card urgent colors should use gray800 for better readability
 * 2. Sensor small cards should have 3px gap between text and label
 * 3. Security popup header buttons should not be partially hidden
 */

const fs = require('fs');
const path = require('path');

function testFormattingFixes() {
    console.log('[DashView] Testing formatting fixes for issue #459...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    let allTestsPassed = true;

    // Test 1: Garbage card urgent colors should use gray800
    console.log('\n1. Testing garbage card urgent colors...');
    const expectedGarbageUrgentRules = [
        '.garbage-card.garbage-urgent .garbage-card-name {\n    color: var(--gray800);',
        '.garbage-card.garbage-urgent .garbage-card-icon-cell i {\n    color: var(--gray800);'
    ];
    
    for (const rule of expectedGarbageUrgentRules) {
        if (!cssContent.includes(rule)) {
            console.error(`❌ Missing garbage-urgent gray800 rule: ${rule}`);
            allTestsPassed = false;
        } else {
            console.log(`✅ Found garbage-urgent gray800 rule`);
        }
    }
    
    // Ensure we don't still have gray000 for urgent states
    const forbiddenGarbageRules = [
        '.garbage-card.garbage-urgent .garbage-card-name {\n    color: var(--gray000);',
        '.garbage-card.garbage-urgent .garbage-card-icon-cell i {\n    color: var(--gray000);'
    ];
    
    for (const rule of forbiddenGarbageRules) {
        if (cssContent.includes(rule)) {
            console.error(`❌ Found forbidden gray000 rule: ${rule}`);
            allTestsPassed = false;
        } else {
            console.log(`✅ No forbidden gray000 rules found`);
        }
    }

    // Test 2: Sensor small cards should have gap between text and label
    console.log('\n2. Testing sensor small card spacing...');
    const expectedSpacingRules = [
        '.sensor-small-grid {\n    display: grid;\n    height: 100%;\n    grid-template-areas:\n        "icon label"\n        "icon name";\n    grid-template-columns: 56px 1fr;\n    grid-template-rows: 1fr 1fr;\n    align-items: center;\n    gap: 3px 0;\n}'
    ];
    
    for (const rule of expectedSpacingRules) {
        if (!cssContent.includes(rule)) {
            console.error(`❌ Missing sensor spacing rule with gap: 3px 0`);
            allTestsPassed = false;
        } else {
            console.log(`✅ Found sensor spacing rule with 3px gap`);
        }
    }

    // Test 3: Security popup header should have proper height/overflow handling
    console.log('\n3. Testing security popup header container...');
    const expectedSecurityHeaderRules = [
        '.header-entities-container {\n    display: flex;\n    justify-content: flex-start;\n    align-items: center;\n    gap: 8px;\n    overflow-x: auto;\n    scrollbar-width: none;\n    -ms-overflow-style: none;\n    min-height: 50px;\n}'
    ];
    
    for (const rule of expectedSecurityHeaderRules) {
        if (!cssContent.includes(rule)) {
            console.error(`❌ Missing security header container rule with min-height`);
            allTestsPassed = false;
        } else {
            console.log(`✅ Found security header container rule with proper height`);
        }
    }

    // Test 4: Basic CSS syntax validation
    console.log('\n4. Testing CSS syntax...');
    const braceCount = (cssContent.match(/\{/g) || []).length - (cssContent.match(/\}/g) || []).length;
    if (braceCount !== 0) {
        console.error(`❌ CSS syntax error: unmatched braces (${braceCount})`);
        allTestsPassed = false;
    } else {
        console.log('✅ CSS syntax is valid');
    }

    if (allTestsPassed) {
        console.log('\n🎉 All formatting fixes for issue #459 are correctly implemented!');
    } else {
        console.log('\n❌ Some formatting fixes are missing or incorrect.');
    }

    return allTestsPassed;
}

// Run the test
if (require.main === module) {
    const success = testFormattingFixes();
    process.exit(success ? 0 : 1);
}

module.exports = { testFormattingFixes };