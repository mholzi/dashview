// Test for popup bottom positioning functionality
// Validates that popup content is positioned at the bottom of the screen

const fs = require('fs');
const path = require('path');

class PopupBottomPositioningTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing popup bottom positioning...');
        
        this.testCSSFlexboxPositioning();
        this.testPopupContentMarginRemoval();
        this.testPopupContentWidthHandling();
        this.reportResults();
    }

    testCSSFlexboxPositioning() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check if .popup uses flexbox with align-items: flex-end
        const popupFlexPattern = /\.popup\s*{[^}]*display:\s*flex[^}]*align-items:\s*flex-end[^}]*}/s;
        const hasFlexboxBottomAlignment = popupFlexPattern.test(cssContent);
        
        if (hasFlexboxBottomAlignment) {
            this.testResults.push({ name: 'Popup uses flexbox bottom alignment', passed: true });
            console.log('✓ Popup container uses flexbox with align-items: flex-end');
        } else {
            this.testResults.push({ name: 'Popup uses flexbox bottom alignment', passed: false });
            console.log('❌ Popup container missing flexbox bottom alignment');
        }
    }

    testPopupContentMarginRemoval() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup-content no longer uses centering margin
        const popupContentSection = cssContent.match(/\.popup-content\s*{[^}]*}/s);
        if (popupContentSection) {
            const sectionText = popupContentSection[0];
            
            // Should not have centering margin like "5% auto"
            const hasCenteringMargin = /margin:\s*\d+%\s+auto/.test(sectionText);
            // Should have margin: 0 or similar non-centering margin
            const hasNonCenteringMargin = /margin:\s*0/.test(sectionText);
            
            if (!hasCenteringMargin && hasNonCenteringMargin) {
                this.testResults.push({ name: 'Popup content margin updated for bottom positioning', passed: true });
                console.log('✓ Popup content margin updated to remove vertical centering');
            } else {
                this.testResults.push({ name: 'Popup content margin updated for bottom positioning', passed: false });
                console.log('❌ Popup content still uses centering margin');
            }
        } else {
            this.testResults.push({ name: 'Popup content margin updated for bottom positioning', passed: false });
            console.log('❌ Could not find popup-content CSS section');
        }
    }

    testPopupContentWidthHandling() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that popup-content has appropriate width handling for bottom positioning
        const popupContentSection = cssContent.match(/\.popup-content\s*{[^}]*}/s);
        if (popupContentSection) {
            const sectionText = popupContentSection[0];
            
            // Should have width constraints
            const hasMaxWidth = /max-width:\s*\d+px/.test(sectionText);
            const hasWidth = /width:\s*calc\(100%\s*-\s*\d+px\)/.test(sectionText);
            
            if (hasMaxWidth && hasWidth) {
                this.testResults.push({ name: 'Popup content width properly constrained', passed: true });
                console.log('✓ Popup content has proper width constraints for bottom positioning');
            } else {
                this.testResults.push({ name: 'Popup content width properly constrained', passed: false });
                console.log('❌ Popup content width constraints may be insufficient');
            }
        } else {
            this.testResults.push({ name: 'Popup content width properly constrained', passed: false });
            console.log('❌ Could not find popup-content CSS section');
        }
    }

    reportResults() {
        console.log('\n--- Test Results ---');
        let passed = 0;
        let total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.passed) passed++;
        });
        
        console.log(`\nSummary: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All popup bottom positioning tests passed!');
        } else {
            console.log('❌ Some popup bottom positioning tests failed!');
            process.exit(1);
        }
    }
}

module.exports = PopupBottomPositioningTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupBottomPositioningTests();
    testRunner.runAllTests();
}