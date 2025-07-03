#!/usr/bin/env node

/**
 * Test garbage card urgent color styling
 * Validates that when garbage cards have urgent (red) background, 
 * icon and name colors use gray800 for better readability,
 * while other text elements still use gray000
 */

const fs = require('fs');
const path = require('path');

function testGarbageCardUrgentColors() {
    console.log('[DashView] Testing garbage card urgent color styling...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test 1: Check that garbage-urgent rules use gray800 for text colors
    const expectedUrgentRules = [
        '.garbage-urgent .garbage-type,\n.garbage-urgent .days-number {\n    color: var(--gray000);',
        '.garbage-card.garbage-urgent .garbage-card-name {\n    color: var(--gray800);',
        '.garbage-card.garbage-urgent .garbage-card-icon-cell i {\n    color: var(--gray800);',
        '.garbage-urgent .garbage-date,\n.garbage-urgent .days-label {\n    color: var(--gray000);'
    ];
    
    const missingRules = [];
    for (const rule of expectedUrgentRules) {
        if (!cssContent.includes(rule)) {
            missingRules.push(rule);
        }
    }
    
    if (missingRules.length > 0) {
        console.error(`❌ Missing or incorrect garbage-urgent color rules:`);
        missingRules.forEach(rule => console.error(`   ${rule}`));
        return false;
    }
    console.log('✅ Garbage-urgent icon and name colors use gray800 for better readability on red background');
    
    // Test 2: Verify no dark red colors remain for urgent garbage cards
    const forbiddenColors = ['#c0392b', '#a93226'];
    const forbiddenPatterns = forbiddenColors.map(color => 
        new RegExp(`\\.garbage-urgent.*color:\\s*${color.replace('#', '\\#')}`, 'g')
    );
    
    const foundForbiddenColors = [];
    for (const pattern of forbiddenPatterns) {
        const matches = cssContent.match(pattern);
        if (matches) {
            foundForbiddenColors.push(...matches);
        }
    }
    
    if (foundForbiddenColors.length > 0) {
        console.error(`❌ Found forbidden dark red colors in garbage-urgent rules:`);
        foundForbiddenColors.forEach(match => console.error(`   ${match}`));
        return false;
    }
    console.log('✅ No dark red colors found in garbage-urgent rules');
    
    // Test 3: Verify red background styling is preserved
    const requiredBackgroundRules = [
        '.garbage-card.garbage-urgent {\n    background: var(--red);',
        '.garbage-card.garbage-urgent .garbage-card-grid {\n    background-color: var(--red);'
    ];
    
    const missingBackgroundRules = [];
    for (const rule of requiredBackgroundRules) {
        if (!cssContent.includes(rule)) {
            missingBackgroundRules.push(rule);
        }
    }
    
    if (missingBackgroundRules.length > 0) {
        console.error(`❌ Missing garbage-urgent background rules:`);
        missingBackgroundRules.forEach(rule => console.error(`   ${rule}`));
        return false;
    }
    console.log('✅ Red background styling preserved for garbage-urgent');
    
    // Test 4: Verify CSS structure is valid (basic syntax check)
    const braceCount = (cssContent.match(/\{/g) || []).length - (cssContent.match(/\}/g) || []).length;
    if (braceCount !== 0) {
        console.error(`❌ CSS syntax error: unmatched braces (${braceCount})`);
        return false;
    }
    console.log('✅ CSS syntax is valid');
    
    return true;
}

// Run the test
if (require.main === module) {
    const success = testGarbageCardUrgentColors();
    process.exit(success ? 0 : 1);
}

module.exports = { testGarbageCardUrgentColors };