#!/usr/bin/env node

// CSS Color Variables Test
// This test validates that CSS custom properties are correctly defined and accessible

const fs = require('fs');
const path = require('path');

function testCSSVariables() {
    console.log('[DashView] Testing CSS color variables...');
    
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test 1: Check that gray color variables are defined
    const grayVariables = ['--gray000', '--gray100', '--gray200', '--gray400', '--gray500', '--gray800'];
    const missingVariables = [];
    
    for (const variable of grayVariables) {
        if (!cssContent.includes(variable + ':')) {
            missingVariables.push(variable);
        }
    }
    
    if (missingVariables.length > 0) {
        console.error(`❌ Missing gray variables: ${missingVariables.join(', ')}`);
        return false;
    }
    console.log('✅ All gray color variables are defined');
    
    // Test 2: Check that variables are used in CSS rules
    const variableUsage = ['var(--gray000)', 'var(--gray800)'];
    const unusedVariables = [];
    
    for (const usage of variableUsage) {
        if (!cssContent.includes(usage)) {
            unusedVariables.push(usage);
        }
    }
    
    if (unusedVariables.length > 0) {
        console.error(`❌ Unused variables: ${unusedVariables.join(', ')}`);
        return false;
    }
    console.log('✅ Gray color variables are being used in CSS');
    
    // Test 3: Check dark mode overrides exist
    const darkModePattern = /@media \(prefers-color-scheme: dark\)/;
    if (!darkModePattern.test(cssContent)) {
        console.error('❌ Dark mode CSS overrides not found');
        return false;
    }
    console.log('✅ Dark mode color overrides are present');
    
    // Test 4: Validate CSS syntax is correct (no unclosed braces)
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
    console.log('✅ CSS syntax is valid');
    
    // Test 5: Check specific color applications in critical components
    const criticalColorApplications = [
        'background: var(--gray800)',  // header buttons
        'color: var(--gray000)',       // header button text
        'background-color: var(--gray000)', // card backgrounds
        'color: var(--gray800)'        // primary text
    ];
    
    const missingApplications = [];
    for (const application of criticalColorApplications) {
        if (!cssContent.includes(application)) {
            missingApplications.push(application);
        }
    }
    
    if (missingApplications.length > 0) {
        console.error(`❌ Missing critical color applications: ${missingApplications.join(', ')}`);
        return false;
    }
    console.log('✅ Critical color applications are present');
    
    return true;
}

function testShadowDOMCompatibility() {
    console.log('[DashView] Testing Shadow DOM CSS compatibility...');
    
    // Test that :root selectors are present (these work in shadow DOM)
    const cssPath = path.join(__dirname, '../www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const rootSelectors = cssContent.match(/:root\s*{/g);
    if (!rootSelectors || rootSelectors.length < 2) {
        console.error('❌ Insufficient :root selectors found (expected at least 2 for light/dark mode)');
        return false;
    }
    console.log('✅ :root selectors are properly defined for shadow DOM');
    
    return true;
}

// Run tests
console.log('='.repeat(50));
console.log('CSS Color Variables Validation Test');
console.log('='.repeat(50));

let allTestsPassed = true;

if (!testCSSVariables()) {
    allTestsPassed = false;
}

if (!testShadowDOMCompatibility()) {
    allTestsPassed = false;
}

console.log('='.repeat(50));
if (allTestsPassed) {
    console.log('🎉 All CSS color tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some CSS color tests failed!');
    process.exit(1);
}