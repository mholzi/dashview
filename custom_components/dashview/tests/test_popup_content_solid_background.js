#!/usr/bin/env node

/**
 * DashView Popup Content Solid Background Test
 * Tests that popup content has solid background while backdrop remains blurred
 * Specifically tests the fix for issue #151 where popup content was see-through
 */

const fs = require('fs');
const path = require('path');

class PopupContentSolidBackgroundTest {
    constructor() {
        this.testCount = 0;
        this.passedTests = 0;
    }

    log(message) {
        console.log(`[PopupContentBGTest] ${message}`);
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

    runAllTests() {
        this.log('Running popup content solid background tests...');

        const styleContent = this.loadStylesheet();

        // Test 1: Check that .popup-content uses solid background (var(--background))
        this.test('Popup content should use solid background var(--background)', () => {
            const popupContentMatch = styleContent.match(/\.popup-content\s*{[^}]*background-color:\s*var\(--background\)[^}]*}/s);
            if (popupContentMatch) {
                this.log('Found .popup-content with solid background');
                return true;
            }
            return false;
        });

        // Test 2: Check that .popup-content does NOT use transparent background (var(--popupBG))
        this.test('Popup content should NOT use transparent background var(--popupBG)', () => {
            const popupContentMatch = styleContent.match(/\.popup-content\s*{[^}]*background-color:\s*var\(--popupBG\)[^}]*}/s);
            if (popupContentMatch) {
                this.log('Found .popup-content with transparent background (should be solid)');
                return false;
            }
            this.log('Confirmed .popup-content does not use transparent background');
            return true;
        });

        // Test 3: Check that .popup (backdrop) still uses transparent background
        this.test('Popup backdrop should still use transparent background var(--popupBG)', () => {
            const popupBackdropMatch = styleContent.match(/\.popup\s*{[^}]*background-color:\s*var\(--popupBG\)[^}]*}/s);
            if (popupBackdropMatch) {
                this.log('Confirmed .popup backdrop uses transparent background');
                return true;
            }
            return false;
        });

        // Test 4: Check that backdrop-filter is still present on .popup
        this.test('Popup backdrop should have backdrop-filter for blur effect', () => {
            const popupRuleMatch = styleContent.match(/\.popup\s*{[^}]*backdrop-filter:\s*blur\([^)]+\)[^}]*}/s);
            if (popupRuleMatch) {
                this.log('Confirmed .popup backdrop has blur effect');
                return true;
            }
            return false;
        });

        // Test 5: Verify the values of --background and --popupBG are different
        this.test('CSS variables --background and --popupBG should be different', () => {
            const backgroundMatch = styleContent.match(/--background:\s*([^;]+);/);
            const popupBGMatch = styleContent.match(/--popupBG:\s*([^;]+);/);
            
            if (!backgroundMatch || !popupBGMatch) {
                this.log('Could not find both CSS variables');
                return false;
            }
            
            const backgroundValue = backgroundMatch[1].trim();
            const popupBGValue = popupBGMatch[1].trim();
            
            this.log(`--background: ${backgroundValue}`);
            this.log(`--popupBG: ${popupBGValue}`);
            
            if (backgroundValue !== popupBGValue) {
                this.log('Confirmed CSS variables are different (background solid, popupBG transparent)');
                return true;
            } else {
                this.log('CSS variables are the same (this would cause the issue)');
                return false;
            }
        });

        // Summary
        this.log(`\nTest Results: ${this.passedTests}/${this.testCount} passed`);
        
        if (this.passedTests === this.testCount) {
            this.log('✅ All popup content solid background tests passed!');
            return true;
        } else {
            this.log('❌ Some popup content solid background tests failed!');
            return false;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupContentSolidBackgroundTest();
    const success = testRunner.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = PopupContentSolidBackgroundTest;