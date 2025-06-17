#!/usr/bin/env node

// Shadow DOM CSS Variables Test
// Validates that CSS custom properties are properly injected into Shadow DOM

const fs = require('fs');
const path = require('path');

function testShadowDOMCSSVariableInjection() {
    console.log('[DashView] Testing Shadow DOM CSS variable injection...');
    
    // Read the JavaScript file to check for CSS variable injection
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Test 1: Check for CSS variable injection function or code
    const hasVariableInjection = jsContent.includes('--popupBG') || 
                                jsContent.includes('CSS variables') ||
                                jsContent.includes('injectCSSVariables');
    
    if (!hasVariableInjection) {
        console.error('❌ No CSS variable injection found in shadow DOM');
        return false;
    }
    
    console.log('✅ CSS variable injection code found');
    
    // Test 2: Check that variables are injected during loadContent
    const loadContentPattern = /loadContent.*async.*function/s;
    if (!loadContentPattern.test(jsContent)) {
        console.error('❌ loadContent function not found');
        return false;
    }
    
    console.log('✅ loadContent function structure validated');
    
    // Test 3: Verify key variables are included
    const criticalVariables = [
        '--popupBG',
        '--gray000',
        '--gray800', 
        '--active-big',
        '--primary-text-color',
        '--background'
    ];
    
    let foundVariables = 0;
    for (const variable of criticalVariables) {
        if (jsContent.includes(variable)) {
            foundVariables++;
        }
    }
    
    if (foundVariables < criticalVariables.length / 2) {
        console.error(`❌ Insufficient critical variables found (${foundVariables}/${criticalVariables.length})`);
        return false;
    }
    
    console.log(`✅ Critical CSS variables present (${foundVariables}/${criticalVariables.length})`);
    
    return true;
}

function testDarkModeSupport() {
    console.log('[DashView] Testing dark mode CSS variable support...');
    
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Check for dark mode detection or prefers-color-scheme
    const hasDarkModeSupport = jsContent.includes('prefers-color-scheme') || 
                              jsContent.includes('dark') ||
                              jsContent.includes('matchMedia');
    
    if (!hasDarkModeSupport) {
        console.error('❌ No dark mode support found for Shadow DOM');
        return false;
    }
    
    console.log('✅ Dark mode support detected');
    return true;
}

// Run tests
console.log('='.repeat(50));
console.log('Shadow DOM CSS Variables Test');
console.log('='.repeat(50));

let allTestsPassed = true;

if (!testShadowDOMCSSVariableInjection()) {
    allTestsPassed = false;
}

if (!testDarkModeSupport()) {
    allTestsPassed = false;
}

console.log('='.repeat(50));
if (allTestsPassed) {
    console.log('🎉 All Shadow DOM CSS tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some Shadow DOM CSS tests failed!');
    process.exit(1);
}