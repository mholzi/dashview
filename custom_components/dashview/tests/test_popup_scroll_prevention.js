// Test for popup scroll prevention functionality
// Validates that body scrolling is prevented when popups are active

class PopupScrollPreventionTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Running popup scroll prevention tests...');
        
        try {
            this.testCSSRuleExists();
            this.testJavaScriptContainsScrollPrevention();
            this.reportResults();
        } catch (error) {
            console.error('[DashView] Test execution failed:', error);
            throw error;
        }
    }

    testCSSRuleExists() {
        const fs = require('fs');
        const path = require('path');
        
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check if the popup-open body class rule exists
        const hasPopupOpenRule = cssContent.includes('body.popup-open') && 
                                 cssContent.includes('overflow: hidden');
        
        if (hasPopupOpenRule) {
            this.testResults.push({ name: 'CSS popup-open rule exists', passed: true });
            console.log('✓ CSS rule for body.popup-open exists');
        } else {
            this.testResults.push({ name: 'CSS popup-open rule exists', passed: false });
            console.log('❌ CSS rule for body.popup-open is missing');
        }
    }

    testJavaScriptContainsScrollPrevention() {
        const fs = require('fs');
        const path = require('path');
        
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check if JavaScript adds the popup-open class
        const hasAddClass = jsContent.includes("document.body.classList.add('popup-open')");
        const hasRemoveClass = jsContent.includes("document.body.classList.remove('popup-open')");
        
        if (hasAddClass && hasRemoveClass) {
            this.testResults.push({ name: 'JavaScript scroll prevention logic exists', passed: true });
            console.log('✓ JavaScript contains scroll prevention logic');
        } else {
            this.testResults.push({ name: 'JavaScript scroll prevention logic exists', passed: false });
            console.log('❌ JavaScript scroll prevention logic is missing');
            if (!hasAddClass) console.log('  - Missing: document.body.classList.add("popup-open")');
            if (!hasRemoveClass) console.log('  - Missing: document.body.classList.remove("popup-open")');
        }
    }

    reportResults() {
        const passedTests = this.testResults.filter(test => test.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`[DashView] Popup scroll prevention tests: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('[DashView] ✅ All popup scroll prevention tests passed!');
        } else {
            console.log('[DashView] ❌ Some popup scroll prevention tests failed');
            throw new Error('Popup scroll prevention tests failed');
        }
    }
}

module.exports = PopupScrollPreventionTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupScrollPreventionTests();
    testRunner.runAllTests();
}