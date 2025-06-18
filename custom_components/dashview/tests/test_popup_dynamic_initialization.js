// Test for popup dynamic content initialization system
// Validates that the new component initializer registry and dispatcher work correctly

const fs = require('fs');
const path = require('path');

class PopupDynamicInitializationTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing popup dynamic content initialization...');
        this.testComponentInitializerRegistryExists();
        this.testDispatcherMethodExists();
        this.testReinitializePopupContentUpdated();
        this.testOldPatchLogicRemoved();
        this.reportResults();
    }

    testComponentInitializerRegistryExists() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the component initializer registry exists
        const hasRegistryProperty = /_componentInitializers\s*=\s*{/.test(jsContent);
        const hasWeatherCard = /weather-forecast-card.*updateWeatherComponents/.test(jsContent);
        const hasPollenCard = /pollen-card.*updatePollenCard/.test(jsContent);
        const hasCoversCard = /covers-card[\s\S]*?_initializeCoversCard/.test(jsContent);
        
        if (hasRegistryProperty && hasWeatherCard && hasPollenCard && hasCoversCard) {
            this.testResults.push({ name: 'Component Initializer Registry exists', passed: true });
            console.log('✓ Component Initializer Registry properly defined');
        } else {
            this.testResults.push({ name: 'Component Initializer Registry exists', passed: false });
            console.log('❌ Component Initializer Registry not properly defined');
            console.log(`  Registry property: ${hasRegistryProperty}, Weather: ${hasWeatherCard}, Pollen: ${hasPollenCard}, Covers: ${hasCoversCard}`);
        }
    }

    testDispatcherMethodExists() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the dispatcher method exists
        const hasDispatcherMethod = /_initializeDynamicContent\s*\(container\)/.test(jsContent);
        const hasForLoop = /for\s*\(\s*const\s*\[\s*selector\s*,\s*initializer\s*\]\s*of\s*Object\.entries\(this\._componentInitializers\)\)/.test(jsContent);
        const hasTryCatch = /try\s*{[\s\S]*initializer\(element\)[\s\S]*}\s*catch\s*\(error\)/.test(jsContent);
        
        if (hasDispatcherMethod && hasForLoop && hasTryCatch) {
            this.testResults.push({ name: 'Dynamic Content Dispatcher exists', passed: true });
            console.log('✓ Dynamic Content Dispatcher properly implemented');
        } else {
            this.testResults.push({ name: 'Dynamic Content Dispatcher exists', passed: false });
            console.log('❌ Dynamic Content Dispatcher not properly implemented');
        }
    }

    testReinitializePopupContentUpdated() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that reinitializePopupContent now uses the new dispatcher
        const hasNewDispatcherCall = /this\._initializeDynamicContent\(popup\)/.test(jsContent);
        
        // Check that the old _forceRefreshPopupEntities call is removed from reinitializePopupContent
        const reinitializeFunction = jsContent.match(/reinitializePopupContent\(popup\)\s*{[\s\S]*?}\s*(?=\n\s*\/\/|\n\s*_|\n\s*$)/);
        let oldCallRemoved = true;
        if (reinitializeFunction) {
            oldCallRemoved = !/_forceRefreshPopupEntities\(popup\)/.test(reinitializeFunction[0]);
        }
        
        if (hasNewDispatcherCall && oldCallRemoved) {
            this.testResults.push({ name: 'reinitializePopupContent updated', passed: true });
            console.log('✓ reinitializePopupContent now uses new dispatcher');
        } else {
            this.testResults.push({ name: 'reinitializePopupContent updated', passed: false });
            console.log('❌ reinitializePopupContent not properly updated');
        }
    }

    testOldPatchLogicRemoved() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the covers card initialization in createPopupFromTemplate is updated
        const createPopupFunction = jsContent.match(/createPopupFromTemplate\([\s\S]*?return popup;[\s\S]*?}/);
        let coversCardUpdated = false;
        if (createPopupFunction) {
            const functionText = createPopupFunction[0];
            // Should not have direct _initializeCoversCard call
            const hasDirectCall = /_initializeCoversCard\(popup,\s*popupType,\s*roomConfig\.covers\)/.test(functionText);
            // Should have comment about new dispatcher system
            const hasComment = /new dispatcher system will handle initialization/.test(functionText);
            coversCardUpdated = !hasDirectCall && hasComment;
        }
        
        if (coversCardUpdated) {
            this.testResults.push({ name: 'Old patch logic removed', passed: true });
            console.log('✓ Old patch logic properly removed from createPopupFromTemplate');
        } else {
            this.testResults.push({ name: 'Old patch logic removed', passed: false });
            console.log('❌ Old patch logic not properly removed');
            if (createPopupFunction) {
                const functionText = createPopupFunction[0];
                const hasDirectCall = /_initializeCoversCard\(popup,\s*popupType,\s*roomConfig\.covers\)/.test(functionText);
                const hasComment = /new dispatcher system will handle initialization/.test(functionText);
                console.log(`  Direct call found: ${hasDirectCall}, Comment found: ${hasComment}`);
            }
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
            console.log('🎉 All popup dynamic initialization tests passed!');
        } else {
            console.log('❌ Some popup dynamic initialization tests failed!');
            process.exit(1);
        }
    }
}

module.exports = PopupDynamicInitializationTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupDynamicInitializationTests();
    testRunner.runAllTests();
}