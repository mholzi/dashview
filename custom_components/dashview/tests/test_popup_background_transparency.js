#!/usr/bin/env node

/**
 * DashView Popup Background Transparency Test
 * Tests that popup background is properly transparent to show blurred content behind
 */

const fs = require('fs');
const path = require('path');

class PopupBackgroundTransparencyTest {
    constructor() {
        this.testCount = 0;
        this.passedTests = 0;
    }

    log(message) {
        console.log(`[PopupBGTest] ${message}`);
    }

    test(description, testFn) {
        this.testCount++;
        try {
            if (testFn()) {
                this.passedTests++;
                this.log(`✓ ${description}`);
                return true;
            } else {
                this.log(`✗ ${description}`);
                return false;
            }
        } catch (error) {
            this.log(`✗ ${description} - Error: ${error.message}`);
            return false;
        }
    }

    loadStylesheet() {
        const stylePath = path.join(__dirname, '..', 'www', 'style.css');
        if (!fs.existsSync(stylePath)) {
            throw new Error('style.css not found');
        }
        return fs.readFileSync(stylePath, 'utf8');
    }

    loadJavaScript() {
        const jsPath = path.join(__dirname, '..', 'www', 'dashview-panel.js');
        if (!fs.existsSync(jsPath)) {
            throw new Error('dashview-panel.js not found');
        }
        return fs.readFileSync(jsPath, 'utf8');
    }

    runAllTests() {
        this.log('Running popup background transparency tests...');

        const styleContent = this.loadStylesheet();
        const jsContent = this.loadJavaScript();

        // Test 1: Check that light mode popupBG is transparent
        this.test('Light mode --popupBG should be transparent (rgba)', () => {
            const lightModeMatch = styleContent.match(/--popupBG:\s*([^;]+);/);
            if (!lightModeMatch) return false;
            
            const popupBgValue = lightModeMatch[1].trim();
            this.log(`Found light mode --popupBG: ${popupBgValue}`);
            
            // Should be rgba with alpha < 1.0
            return popupBgValue.includes('rgba') && !popupBgValue.includes('1)');
        });

        // Test 2: Check that dark mode popupBG is transparent
        this.test('Dark mode --popupBG should be transparent (rgba)', () => {
            // Extract dark mode section
            const darkModeSection = styleContent.match(/@media \(prefers-color-scheme: dark\)\s*{[^}]*{([^}]*)}/);
            if (!darkModeSection) return false;
            
            const darkModeContent = darkModeSection[1];
            const darkModeMatch = darkModeContent.match(/--popupBG:\s*([^;]+);/);
            if (!darkModeMatch) return false;
            
            const popupBgValue = darkModeMatch[1].trim();
            this.log(`Found dark mode --popupBG: ${popupBgValue}`);
            
            // Should be rgba with alpha < 1.0
            return popupBgValue.includes('rgba') && !popupBgValue.includes('1)');
        });

        // Test 3: Check JavaScript CSS variables match
        this.test('JavaScript light mode --popupBG should be transparent', () => {
            const jsLightModeMatch = jsContent.match(/--popupBG:\s*([^;]+);/);
            if (!jsLightModeMatch) return false;
            
            const jsPopupBgValue = jsLightModeMatch[1].trim();
            this.log(`Found JS light mode --popupBG: ${jsPopupBgValue}`);
            
            return jsPopupBgValue.includes('rgba') && !jsPopupBgValue.includes('1)');
        });

        // Test 4: Check JavaScript dark mode CSS variables match
        this.test('JavaScript dark mode --popupBG should be transparent', () => {
            // Look for the dark mode media query in the JavaScript
            const jsDarkModeMatch = jsContent.match(/@media \(prefers-color-scheme: dark\)[^}]*{[^}]*--popupBG:\s*([^;]+);/);
            if (!jsDarkModeMatch) return false;
            
            const jsPopupBgValue = jsDarkModeMatch[1].trim();
            this.log(`Found JS dark mode --popupBG: ${jsPopupBgValue}`);
            
            return jsPopupBgValue.includes('rgba') && !jsPopupBgValue.includes('1)');
        });

        // Test 5: Check that backdrop-filter is still present
        this.test('Popup should have backdrop-filter for blur effect', () => {
            const popupRuleMatch = styleContent.match(/\.popup\s*{[^}]*backdrop-filter:\s*blur\([^)]+\)/);
            return popupRuleMatch !== null;
        });

        // Test 6: Check that alpha values are reasonable (not too transparent)
        this.test('Alpha values should be reasonable (0.1-0.5)', () => {
            const lightModeMatch = styleContent.match(/--popupBG:\s*rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([^)]+)\)/);
            if (!lightModeMatch) return false;
            
            const alpha = parseFloat(lightModeMatch[1]);
            this.log(`Light mode alpha: ${alpha}`);
            
            return alpha >= 0.1 && alpha <= 0.5;
        });

        // Test 7: Verify consistency between CSS and JS
        this.test('CSS and JS should have consistent --popupBG values', () => {
            const cssLightMatch = styleContent.match(/--popupBG:\s*([^;]+);/);
            const jsLightMatch = jsContent.match(/--popupBG:\s*([^;]+);/);
            
            if (!cssLightMatch || !jsLightMatch) return false;
            
            const cssValue = cssLightMatch[1].trim();
            const jsValue = jsLightMatch[1].trim();
            
            this.log(`CSS value: ${cssValue}, JS value: ${jsValue}`);
            
            return cssValue === jsValue;
        });

        // Summary
        this.log(`\nTest Results: ${this.passedTests}/${this.testCount} passed`);
        
        if (this.passedTests === this.testCount) {
            this.log('✅ All popup background transparency tests passed!');
            return true;
        } else {
            this.log('❌ Some popup background transparency tests failed!');
            return false;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupBackgroundTransparencyTest();
    const success = testRunner.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = PopupBackgroundTransparencyTest;