// Test for updated popup behavior requirements
// Validates that popups match main view width, have 80px top margin, and hide scrollbars

const fs = require('fs');
const path = require('path');

class PopupBehaviorTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing popup behavior requirements...');
        this.testPopupWidthMatchesMainView();
        this.testPopupTopMargin();
        this.testPopupScrollbarHidden();
        this.testPopupBlurBackground();
        this.reportResults();
    }

    testPopupWidthMatchesMainView() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup-content no longer has max-width constraint
        const popupContentSection = cssContent.match(/\.popup-content\s*{[^}]*}/s);
        if (popupContentSection) {
            const sectionText = popupContentSection[0];
            
            // Should not have max-width constraint
            const hasMaxWidth = /max-width:\s*\d+px/.test(sectionText);
            // Should have width that matches main view (calc(100% - 16px))
            const hasFullWidth = /width:\s*calc\(100%\s*-\s*16px\)/.test(sectionText);
            
            if (!hasMaxWidth && hasFullWidth) {
                this.testResults.push({ name: 'Popup width matches main view', passed: true });
                console.log('✓ Popup width matches main view (no max-width constraint)');
            } else {
                this.testResults.push({ name: 'Popup width matches main view', passed: false });
                console.log('❌ Popup width does not match main view requirements');
            }
        } else {
            this.testResults.push({ name: 'Popup width matches main view', passed: false });
            console.log('❌ Could not find popup-content CSS section');
        }
    }

    testPopupTopMargin() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup has 80px top margin
        const popupSection = cssContent.match(/\.popup\s*{[^}]*}/s);
        if (popupSection) {
            const sectionText = popupSection[0];
            
            // Should have padding-top: 80px
            const hasTopMargin = /padding-top:\s*80px/.test(sectionText);
            // Should use flex-start for alignment
            const hasFlexStart = /align-items:\s*flex-start/.test(sectionText);
            
            if (hasTopMargin && hasFlexStart) {
                this.testResults.push({ name: 'Popup has 80px top margin', passed: true });
                console.log('✓ Popup has 80px top margin');
            } else {
                this.testResults.push({ name: 'Popup has 80px top margin', passed: false });
                console.log('❌ Popup does not have 80px top margin');
            }
        } else {
            this.testResults.push({ name: 'Popup has 80px top margin', passed: false });
            console.log('❌ Could not find popup CSS section');
        }
    }

    testPopupScrollbarHidden() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup-content has scrollbar hiding styles
        const hasScrollbarWidth = /scrollbar-width:\s*none/.test(cssContent);
        const hasMsOverflowStyle = /-ms-overflow-style:\s*none/.test(cssContent);
        const hasWebkitScrollbar = /\.popup-content::-webkit-scrollbar\s*{\s*display:\s*none/.test(cssContent);
        
        if (hasScrollbarWidth && hasMsOverflowStyle && hasWebkitScrollbar) {
            this.testResults.push({ name: 'Popup scrollbars are hidden', passed: true });
            console.log('✓ Popup scrollbars are hidden while allowing scrolling');
        } else {
            this.testResults.push({ name: 'Popup scrollbars are hidden', passed: false });
            console.log('❌ Popup scrollbars are not properly hidden');
        }
    }

    testPopupBlurBackground() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup has blur background
        const popupSection = cssContent.match(/\.popup\s*{[^}]*}/s);
        if (popupSection) {
            const sectionText = popupSection[0];
            
            // Should have backdrop-filter: blur
            const hasBlur = /backdrop-filter:\s*blur\(\d+px\)/.test(sectionText);
            // Should have popupBG background
            const hasPopupBG = /background-color:\s*var\(--popupBG\)/.test(sectionText);
            
            if (hasBlur && hasPopupBG) {
                this.testResults.push({ name: 'Popup has blur background', passed: true });
                console.log('✓ Popup has blur background with popupBG');
            } else {
                this.testResults.push({ name: 'Popup has blur background', passed: false });
                console.log('❌ Popup blur background not properly configured');
            }
        } else {
            this.testResults.push({ name: 'Popup has blur background', passed: false });
            console.log('❌ Could not find popup CSS section');
        }
    }

    reportResults() {
        console.log('\n--- Test Results ---');
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
        });

        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\nSummary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All popup behavior tests passed!');
        } else {
            console.log('❌ Some popup behavior tests failed!');
            process.exit(1);
        }
    }
}

module.exports = PopupBehaviorTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupBehaviorTests();
    testRunner.runAllTests();
}