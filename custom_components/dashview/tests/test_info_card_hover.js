#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Test class for validating info card hover behavior changes
 */
class InfoCardHoverTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Running Info Card Hover tests...');
        
        this.testSectionHoverRemoved();
        this.testBadgeHoverAdded();
        this.testCSSValidation();
        
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;
        
        if (passedTests === totalTests) {
            console.log(`✅ All Info Card Hover tests passed (${passedTests}/${totalTests})`);
            return true;
        } else {
            console.log(`❌ Some Info Card Hover tests failed (${passedTests}/${totalTests})`);
            this.testResults.filter(result => !result.passed).forEach(result => {
                console.log(`  ❌ ${result.name}: ${result.error}`);
            });
            return false;
        }
    }

    testSectionHoverRemoved() {
        const testName = 'Section Hover Effects Removed';
        try {
            const cssPath = path.join(__dirname, '../www/style.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check that section-level hover effects are removed
            const hasSectionHover = cssContent.includes('.info-section.motion-section:hover') ||
                                    cssContent.includes('.info-section.windows-section:hover') ||
                                    cssContent.includes('.info-section.dryer-section:hover');
            
            if (!hasSectionHover) {
                this.testResults.push({ name: testName, passed: true });
                console.log(`✓ ${testName}: Section-level hover effects successfully removed`);
            } else {
                this.testResults.push({ 
                    name: testName, 
                    passed: false, 
                    error: 'Section-level hover effects still present' 
                });
            }
        } catch (error) {
            this.testResults.push({ 
                name: testName, 
                passed: false, 
                error: `Test failed: ${error.message}` 
            });
        }
    }

    testBadgeHoverAdded() {
        const testName = 'Badge Hover Effects Added';
        try {
            const cssPath = path.join(__dirname, '../www/style.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check that badge-level hover effects are present for clickable sections
            const hasBadgeHover = cssContent.includes('.info-section.motion-section .info-badge:hover') &&
                                  cssContent.includes('.info-section.windows-section .info-badge:hover') &&
                                  cssContent.includes('.info-section.dryer-section .info-badge:hover');
            
            if (hasBadgeHover) {
                this.testResults.push({ name: testName, passed: true });
                console.log(`✓ ${testName}: Badge-level hover effects successfully added`);
            } else {
                this.testResults.push({ 
                    name: testName, 
                    passed: false, 
                    error: 'Badge-level hover effects not found for all clickable sections' 
                });
            }
        } catch (error) {
            this.testResults.push({ 
                name: testName, 
                passed: false, 
                error: `Test failed: ${error.message}` 
            });
        }
    }

    testCSSValidation() {
        const testName = 'CSS Syntax Validation';
        try {
            const cssPath = path.join(__dirname, '../www/style.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Basic CSS syntax validation
            let braceCount = 0;
            const lines = cssContent.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                braceCount += openBraces - closeBraces;
                
                if (braceCount < 0) {
                    throw new Error(`CSS syntax error at line ${i + 1}: extra closing brace`);
                }
            }
            
            if (braceCount !== 0) {
                throw new Error(`CSS syntax error: ${braceCount} unmatched opening braces`);
            }
            
            this.testResults.push({ name: testName, passed: true });
            console.log(`✓ ${testName}: CSS syntax is valid after changes`);
            
        } catch (error) {
            this.testResults.push({ 
                name: testName, 
                passed: false, 
                error: error.message 
            });
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tests = new InfoCardHoverTests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = InfoCardHoverTests;