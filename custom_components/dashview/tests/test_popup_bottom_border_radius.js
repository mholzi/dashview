// Test for popup bottom border radius requirement
// Validates that popup content has rounded top corners but no bottom border radius

const fs = require('fs');
const path = require('path');

class PopupBottomBorderRadiusTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing popup bottom border radius requirements...');
        this.testPopupContentBorderRadius();
        this.reportResults();
    }

    testPopupContentBorderRadius() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Find the popup-content CSS section
        const popupContentMatch = cssContent.match(/\.popup-content\s*{([^}]*)}/s);
        if (popupContentMatch) {
            const popupContentCss = popupContentMatch[1];
            
            // Test for correct border-radius pattern
            // Should have rounded top corners but not bottom corners
            // Pattern: border-radius: 30px 30px 0 0 (top-left, top-right, bottom-right, bottom-left)
            const hasBorderRadius = /border-radius:\s*([^;]+);/.exec(popupContentCss);
            
            if (hasBorderRadius) {
                const borderRadiusValue = hasBorderRadius[1].trim();
                
                // Check if it follows the pattern: 30px 30px 0 0 (or equivalent)
                // This pattern means: top-left=30px, top-right=30px, bottom-right=0, bottom-left=0
                const isCorrectPattern = 
                    /^30px\s+30px\s+0\s+0$/.test(borderRadiusValue) ||
                    /^30px\s+30px\s+0px\s+0px$/.test(borderRadiusValue);
                
                // Also check that it's NOT just "30px" (which would apply to all corners)
                const isAllCornersRounded = /^30px$/.test(borderRadiusValue);
                
                if (isCorrectPattern) {
                    this.testResults.push({ 
                        name: 'Popup content has correct border radius (top only)', 
                        passed: true 
                    });
                    console.log('✓ Popup content has rounded top corners and square bottom corners');
                } else if (isAllCornersRounded) {
                    this.testResults.push({ 
                        name: 'Popup content has correct border radius (top only)', 
                        passed: false 
                    });
                    console.log('❌ Popup content has rounded corners on all sides (should be top only)');
                    console.log(`  Current value: ${borderRadiusValue}`);
                    console.log('  Expected: 30px 30px 0 0 (top-left, top-right, bottom-right, bottom-left)');
                } else {
                    this.testResults.push({ 
                        name: 'Popup content has correct border radius (top only)', 
                        passed: false 
                    });
                    console.log('❌ Popup content has unexpected border-radius pattern');
                    console.log(`  Current value: ${borderRadiusValue}`);
                    console.log('  Expected: 30px 30px 0 0');
                }
            } else {
                this.testResults.push({ 
                    name: 'Popup content has correct border radius (top only)', 
                    passed: false 
                });
                console.log('❌ Popup content does not have border-radius property');
            }
        } else {
            this.testResults.push({ 
                name: 'Popup content has correct border radius (top only)', 
                passed: false 
            });
            console.log('❌ Could not find popup-content CSS section');
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
            console.log('🎉 All popup bottom border radius tests passed!');
        } else {
            console.log('❌ Some popup bottom border radius tests failed!');
            process.exit(1);
        }
    }
}

module.exports = PopupBottomBorderRadiusTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupBottomBorderRadiusTests();
    testRunner.runAllTests();
}