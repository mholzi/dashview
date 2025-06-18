#!/usr/bin/env node

// Pollen Card Formatting Test
// This test validates that pollen cards have correct height and font color formatting

const fs = require('fs');
const path = require('path');

function testPollenCardHeight() {
    console.log('[DashView] Testing pollen card height...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test that .pollen-button has height: 62px
    const pollenButtonRule = cssContent.match(/\.pollen-button\s*{[^}]*}/s);
    if (!pollenButtonRule) {
        console.error('❌ .pollen-button CSS rule not found');
        return false;
    }
    
    const buttonRuleText = pollenButtonRule[0];
    if (!buttonRuleText.includes('height: 62px')) {
        console.error('❌ .pollen-button does not have height: 62px');
        return false;
    }
    
    console.log('✅ Pollen buttons have correct height of 62px');
    return true;
}

function testPollenCardFontColor() {
    console.log('[DashView] Testing pollen card font colors...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test that .pollen-button uses var(--gray000) color
    const pollenButtonRule = cssContent.match(/\.pollen-button\s*{[^}]*}/s);
    if (!pollenButtonRule) {
        console.error('❌ .pollen-button CSS rule not found');
        return false;
    }
    
    const buttonRuleText = pollenButtonRule[0];
    if (!buttonRuleText.includes('color: var(--gray000)')) {
        console.error('❌ .pollen-button does not use color: var(--gray000)');
        return false;
    }
    
    // Test that .pollen-name uses var(--gray000) color
    const pollenNameRule = cssContent.match(/\.pollen-name\s*{[^}]*}/s);
    if (!pollenNameRule) {
        console.error('❌ .pollen-name CSS rule not found');
        return false;
    }
    
    const nameRuleText = pollenNameRule[0];
    if (!nameRuleText.includes('color: var(--gray000)')) {
        console.error('❌ .pollen-name does not use color: var(--gray000)');
        return false;
    }
    
    // Test that .pollen-state uses var(--gray000) color
    const pollenStateRule = cssContent.match(/\.pollen-state\s*{[^}]*}/s);
    if (!pollenStateRule) {
        console.error('❌ .pollen-state CSS rule not found');
        return false;
    }
    
    const stateRuleText = pollenStateRule[0];
    if (!stateRuleText.includes('color: var(--gray000)')) {
        console.error('❌ .pollen-state does not use color: var(--gray000)');
        return false;
    }
    
    console.log('✅ All pollen card elements use correct gray000 color');
    return true;
}

function testCSSIntegrity() {
    console.log('[DashView] Testing CSS integrity after pollen card changes...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Validate CSS syntax is still correct
    let braceCount = 0;
    const lines = cssContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        if (braceCount < 0) {
            console.error(`❌ CSS syntax error at line ${i + 1}: extra closing brace`);
            return false;
        }
    }
    
    if (braceCount !== 0) {
        console.error(`❌ CSS syntax error: ${braceCount} unmatched opening braces`);
        return false;
    }
    
    console.log('✅ CSS syntax is still valid after pollen card changes');
    return true;
}

// Run tests
console.log('='.repeat(50));
console.log('Pollen Card Formatting Validation Test');
console.log('='.repeat(50));

let allTestsPassed = true;

if (!testPollenCardHeight()) {
    allTestsPassed = false;
}

if (!testPollenCardFontColor()) {
    allTestsPassed = false;
}

if (!testCSSIntegrity()) {
    allTestsPassed = false;
}

console.log('='.repeat(50));
if (allTestsPassed) {
    console.log('🎉 All pollen card formatting tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some pollen card formatting tests failed!');
    process.exit(1);
}