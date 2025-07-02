// Test for popup animation easing curves improvement
// Validates that popups use smooth cubic-bezier easing instead of basic "ease"

const fs = require('fs');
const path = require('path');

class PopupAnimationEasingTests {
    constructor() {
        this.testResults = [];
    }

    testMainPopupEasing() {
        console.log('[DashView] Testing main popup easing curves...');
        
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check main .popup transition
        const popupSection = cssContent.match(/\.popup\s*{[^}]*}/s);
        if (popupSection) {
            const sectionText = popupSection[0];
            
            // Should NOT use basic "ease" for opacity and visibility
            const hasBasicEase = /transition:\s*opacity[^;]*\bease\b[^;]*,\s*visibility[^;]*\bease\b/.test(sectionText);
            // Should use smooth cubic-bezier easing
            const hasSmoothEasing = /transition:\s*opacity[^;]*cubic-bezier\([^)]+\)[^;]*,\s*visibility[^;]*cubic-bezier\([^)]+\)/.test(sectionText);
            
            if (!hasBasicEase && hasSmoothEasing) {
                this.testResults.push({ name: 'Main popup uses smooth easing', passed: true });
                console.log('✓ Main popup uses smooth cubic-bezier easing');
            } else {
                this.testResults.push({ name: 'Main popup uses smooth easing', passed: false });
                console.log('❌ Main popup still uses basic "ease" transitions');
            }
        } else {
            this.testResults.push({ name: 'Main popup uses smooth easing', passed: false });
            console.log('❌ Could not find main popup CSS section');
        }
    }

    testPopupContentEasing() {
        console.log('[DashView] Testing popup content easing curves...');
        
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check .popup-content transition
        const popupContentSection = cssContent.match(/\.popup-content\s*{[^}]*}/s);
        if (popupContentSection) {
            const sectionText = popupContentSection[0];
            
            // Should use smooth cubic-bezier easing (not basic ease)
            const hasGoodEasing = /transition:\s*transform[^;]*cubic-bezier\([^)]+\)/.test(sectionText);
            // Should use a smooth, natural easing curve (not abrupt)
            const hasNaturalEasing = /cubic-bezier\(0\.[0-9]+,\s*0\.[0-9]+,\s*0\.[0-9]+,\s*[1-9]\.[0-9]+\)/.test(sectionText);
            
            if (hasGoodEasing) {
                this.testResults.push({ name: 'Popup content uses cubic-bezier easing', passed: true });
                console.log('✓ Popup content uses cubic-bezier easing');
                
                if (hasNaturalEasing) {
                    this.testResults.push({ name: 'Popup content uses natural easing curve', passed: true });
                    console.log('✓ Popup content uses natural easing curve with bounce');
                } else {
                    this.testResults.push({ name: 'Popup content uses natural easing curve', passed: false });
                    console.log('❌ Popup content easing could be more natural');
                }
            } else {
                this.testResults.push({ name: 'Popup content uses cubic-bezier easing', passed: false });
                console.log('❌ Popup content should use cubic-bezier easing');
            }
        } else {
            this.testResults.push({ name: 'Popup content uses cubic-bezier easing', passed: false });
            console.log('❌ Could not find popup content CSS section');
        }
    }

    testEntityPopupEasing() {
        console.log('[DashView] Testing entity popup easing curves...');
        
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check entity detail popup easing custom property
        const easingProperty = /--popup-animation-easing:\s*cubic-bezier\([^)]+\)/;
        const hasEntityEasing = easingProperty.test(cssContent);
        
        if (hasEntityEasing) {
            this.testResults.push({ name: 'Entity popup uses custom easing property', passed: true });
            console.log('✓ Entity popup uses custom cubic-bezier easing property');
            
            // Check if it's a smooth, natural curve
            const naturalEntityEasing = /--popup-animation-easing:\s*cubic-bezier\(0\.[0-9]+,\s*0\.[0-9]+,\s*0\.[0-9]+,\s*[1-9]\.[0-9]+\)/;
            if (naturalEntityEasing.test(cssContent)) {
                this.testResults.push({ name: 'Entity popup uses natural easing curve', passed: true });
                console.log('✓ Entity popup uses natural easing curve');
            } else {
                this.testResults.push({ name: 'Entity popup uses natural easing curve', passed: false });
                console.log('❌ Entity popup easing could be more natural');
            }
        } else {
            this.testResults.push({ name: 'Entity popup uses custom easing property', passed: false });
            console.log('❌ Entity popup should use smooth cubic-bezier easing');
        }
    }

    testBackdropEasing() {
        console.log('[DashView] Testing backdrop transition easing...');
        
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check backdrop-filter transition easing
        const backdropSection = /transition:\s*backdrop-filter[^;]*var\(--popup-animation-easing\)/.test(cssContent);
        
        if (backdropSection) {
            this.testResults.push({ name: 'Backdrop uses consistent easing', passed: true });
            console.log('✓ Backdrop transition uses consistent easing property');
        } else {
            this.testResults.push({ name: 'Backdrop uses consistent easing', passed: false });
            console.log('❌ Backdrop transition should use consistent easing');
        }
    }

    runAllTests() {
        console.log('[DashView] Testing popup animation easing improvements...');
        
        this.testMainPopupEasing();
        this.testPopupContentEasing();
        this.testEntityPopupEasing();
        this.testBackdropEasing();
        
        console.log('\n--- Animation Easing Test Results ---');
        this.testResults.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
        });
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\nSummary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests !== totalTests) {
            console.log('❌ Some popup animation easing tests failed!');
            process.exit(1);
        } else {
            console.log('✅ All popup animation easing tests passed!');
        }
    }
}

module.exports = PopupAnimationEasingTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupAnimationEasingTests();
    testRunner.runAllTests();
}