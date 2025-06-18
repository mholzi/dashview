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
        this.testPopupBottomPositioning();
        this.testPopupScrollbarHidden();
        this.testPopupBlurBackground();
        this.reportResults();
    }

    testPopupWidthMatchesMainView() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup-content matches main view width constraints
        const popupContentSection = cssContent.match(/\.popup-content\s*{[^}]*}/s);
        if (popupContentSection) {
            const sectionText = popupContentSection[0];
            
            // Should have max-width constraint like main view (500px)
            const hasMaxWidth = /max-width:\s*500px/.test(sectionText);
            // Should have responsive width (calc(100% - 16px))
            const hasFullWidth = /width:\s*calc\(100%\s*-\s*16px\)/.test(sectionText);
            // Should be centered like main view
            const hasCentering = /margin:\s*0\s+auto/.test(sectionText);
            
            if (hasMaxWidth && hasFullWidth && hasCentering) {
                this.testResults.push({ name: 'Popup width matches main view', passed: true });
                console.log('✓ Popup width matches main view (max-width: 500px, centered)');
            } else {
                this.testResults.push({ name: 'Popup width matches main view', passed: false });
                console.log('❌ Popup width does not match main view requirements');
                console.log(`  - Max-width 500px: ${hasMaxWidth}`);
                console.log(`  - Responsive width: ${hasFullWidth}`);
                console.log(`  - Centered: ${hasCentering}`);
            }
        } else {
            this.testResults.push({ name: 'Popup width matches main view', passed: false });
            console.log('❌ Could not find popup-content CSS section');
        }
    }

    testPopupBottomPositioning() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup positions content at bottom
        const popupSection = cssContent.match(/\.popup\s*{[^}]*}/s);
        if (popupSection) {
            const sectionText = popupSection[0];
            
            // Should use flex-end for bottom alignment
            const hasBottomAlignment = /align-items:\s*flex-end/.test(sectionText);
            // Should NOT have padding-top since content is at bottom
            const hasNoPaddingTop = !/padding-top:\s*\d+px/.test(sectionText);
            
            if (hasBottomAlignment && hasNoPaddingTop) {
                this.testResults.push({ name: 'Popup positions content at bottom', passed: true });
                console.log('✓ Popup positions content at bottom of screen');
            } else {
                this.testResults.push({ name: 'Popup positions content at bottom', passed: false });
                console.log('❌ Popup does not position content at bottom');
            }
        } else {
            this.testResults.push({ name: 'Popup positions content at bottom', passed: false });
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