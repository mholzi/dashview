#!/usr/bin/env node

// Simple test to validate the inline CSS approach
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing inline CSS approach...\n');

// Read the dashview-panel.js file
const panelJSPath = path.join(__dirname, 'custom_components', 'dashview', 'www', 'dashview-panel.js');
const panelJS = fs.readFileSync(panelJSPath, 'utf8');

// Test 1: Check if old link creation approach is removed
console.log('Test 1: Checking if old link creation approach is removed...');
const hasOldApproach = panelJS.includes('createElement(\'link\')') && panelJS.includes('rel = \'stylesheet\'');
if (hasOldApproach) {
  console.log('❌ FAIL: Old link creation approach still present');
} else {
  console.log('✅ PASS: Old link creation approach removed');
}

// Test 2: Check if new loadStylesheetsInline method exists
console.log('\nTest 2: Checking if new loadStylesheetsInline method exists...');
const hasNewMethod = panelJS.includes('loadStylesheetsInline');
if (hasNewMethod) {
  console.log('✅ PASS: loadStylesheetsInline method found');
} else {
  console.log('❌ FAIL: loadStylesheetsInline method not found');
}

// Test 3: Check if the method is called in loadContent
console.log('\nTest 3: Checking if loadStylesheetsInline is called...');
const isMethodCalled = panelJS.includes('await this.loadStylesheetsInline(shadow)');
if (isMethodCalled) {
  console.log('✅ PASS: loadStylesheetsInline is called in loadContent');
} else {
  console.log('❌ FAIL: loadStylesheetsInline is not called');
}

// Test 4: Check if method creates style elements
console.log('\nTest 4: Checking if method creates style elements...');
const createsStyleElements = panelJS.includes('createElement(\'style\')') && panelJS.includes('textContent = cssText');
if (createsStyleElements) {
  console.log('✅ PASS: Method creates style elements with CSS content');
} else {
  console.log('❌ FAIL: Method does not create style elements properly');
}

// Test 5: Check if all required stylesheets are included
console.log('\nTest 5: Checking if all required stylesheets are configured...');
const hasGoogleFonts = panelJS.includes('Google Fonts') && panelJS.includes('fonts.googleapis.com');
const hasMDI = panelJS.includes('Material Design Icons') && panelJS.includes('materialdesignicons');
const hasMainCSS = panelJS.includes('Main Stylesheet') && panelJS.includes('/local/dashview/style.css');

if (hasGoogleFonts && hasMDI && hasMainCSS) {
  console.log('✅ PASS: All required stylesheets configured (Google Fonts, MDI, Main CSS)');
} else {
  console.log('❌ FAIL: Missing stylesheet configurations');
  console.log(`  - Google Fonts: ${hasGoogleFonts ? '✅' : '❌'}`);
  console.log(`  - Material Design Icons: ${hasMDI ? '✅' : '❌'}`);
  console.log(`  - Main CSS: ${hasMainCSS ? '✅' : '❌'}`);
}

// Test 6: Check if error handling is present
console.log('\nTest 6: Checking if error handling is present...');
const hasErrorHandling = panelJS.includes('try {') && panelJS.includes('catch (error)') && panelJS.includes('fallback');
if (hasErrorHandling) {
  console.log('✅ PASS: Error handling and fallback styles present');
} else {
  console.log('❌ FAIL: Missing error handling or fallback styles');
}

// Test 7: Check if index.html has been cleaned up
console.log('\nTest 7: Checking if index.html duplicate links removed...');
const indexHTMLPath = path.join(__dirname, 'custom_components', 'dashview', 'www', 'index.html');
const indexHTML = fs.readFileSync(indexHTMLPath, 'utf8');
const hasDuplicateMDI = indexHTML.includes('materialdesignicons');

if (!hasDuplicateMDI) {
  console.log('✅ PASS: Duplicate Material Design Icons link removed from index.html');
} else {
  console.log('❌ FAIL: Duplicate Material Design Icons link still in index.html');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));

const tests = [
  !hasOldApproach,
  hasNewMethod,
  isMethodCalled,
  createsStyleElements,
  (hasGoogleFonts && hasMDI && hasMainCSS),
  hasErrorHandling,
  !hasDuplicateMDI
];

const passedTests = tests.filter(t => t).length;
const totalTests = tests.length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! The inline CSS approach is properly implemented.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}