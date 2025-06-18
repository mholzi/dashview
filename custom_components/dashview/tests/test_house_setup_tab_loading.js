// Test for house setup tab automatic configuration loading
// Validates that the house-setup-tab triggers loadAdminConfiguration when clicked

const fs = require('fs');
const path = require('path');

class HouseSetupTabLoadingTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing house setup tab automatic loading...');
        this.testHouseSetupTabConditionExists();
        this.testAllTabConditionsPresent();
        this.reportResults();
    }

    testHouseSetupTabConditionExists() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check for house-setup-tab condition that calls loadAdminConfiguration
        const hasHouseSetupCondition = /if\s*\(\s*targetId\s*===\s*['"`]house-setup-tab['"`]\s*\)\s*{[\s\S]*?setTimeout\(\s*\(\s*\)\s*=>\s*this\.loadAdminConfiguration\(\)\s*,\s*100\s*\)/.test(jsContent);
        
        if (hasHouseSetupCondition) {
            this.testResults.push({ name: 'House setup tab condition exists', passed: true });
            console.log('✓ House setup tab condition properly calls loadAdminConfiguration');
        } else {
            this.testResults.push({ name: 'House setup tab condition exists', passed: false });
            console.log('❌ House setup tab condition missing or incorrect');
            console.log('Expected: if (targetId === \'house-setup-tab\') { setTimeout(() => this.loadAdminConfiguration(), 100); }');
        }
    }

    testAllTabConditionsPresent() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check for all expected tab conditions
        const hasHeaderButtonsTab = /if\s*\(\s*targetId\s*===\s*['"`]header-buttons-tab['"`]\s*\)/.test(jsContent);
        const hasFloorMaintenanceTab = /if\s*\(\s*targetId\s*===\s*['"`]floor-maintenance-tab['"`]\s*\)/.test(jsContent);
        const hasWeatherTab = /if\s*\(\s*targetId\s*===\s*['"`]weather-tab['"`]\s*\)/.test(jsContent);
        const hasHouseSetupTab = /if\s*\(\s*targetId\s*===\s*['"`]house-setup-tab['"`]\s*\)/.test(jsContent);
        
        const allTabsPresent = hasHeaderButtonsTab && hasFloorMaintenanceTab && hasWeatherTab && hasHouseSetupTab;
        
        if (allTabsPresent) {
            this.testResults.push({ name: 'All tab conditions present', passed: true });
            console.log('✓ All admin panel tab conditions are present');
        } else {
            this.testResults.push({ name: 'All tab conditions present', passed: false });
            console.log('❌ Missing tab conditions:');
            if (!hasHeaderButtonsTab) console.log('  - header-buttons-tab');
            if (!hasFloorMaintenanceTab) console.log('  - floor-maintenance-tab');
            if (!hasWeatherTab) console.log('  - weather-tab');
            if (!hasHouseSetupTab) console.log('  - house-setup-tab');
        }
    }

    reportResults() {
        const passedTests = this.testResults.filter(test => test.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] House Setup Tab Loading Tests: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All house setup tab loading tests passed!');
        } else {
            console.log('❌ Some house setup tab loading tests failed!');
            process.exit(1);
        }
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const testRunner = new HouseSetupTabLoadingTests();
    testRunner.runAllTests();
}

module.exports = HouseSetupTabLoadingTests;