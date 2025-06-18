// Test for cover card functionality
// Validates that cover cards are properly initialized and functional

const fs = require('fs');
const path = require('path');

class CoverCardTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('\n[DashView] Testing cover card functionality...');
        
        this.testCoverConfigurationAdded();
        this.testCoverHtmlFilesExist();
        this.testCoverCssStyles();
        this.testCoverJavaScriptFunctions();
        
        // Print results
        console.log('\n[DashView] Cover Card Test Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✓' : '❌';
            console.log(`${status} ${result.name}`);
        });
        
        const allPassed = this.testResults.every(result => result.passed);
        if (allPassed) {
            console.log('✅ All cover card tests passed!');
        } else {
            console.log('❌ Some cover card tests failed!');
        }
        
        return allPassed;
    }

    testCoverConfigurationAdded() {
        const configPath = path.join(__dirname, '../www/config/house_setup.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // Check that cover entities are added to rooms
        const roomsWithCovers = ['kids', 'kinderbad', 'flur', 'aupair', 'schlafzimmer'];
        let allRoomsHaveCovers = true;
        
        for (const roomKey of roomsWithCovers) {
            const room = config.rooms[roomKey];
            if (!room || !room.covers || room.covers.length === 0) {
                allRoomsHaveCovers = false;
                break;
            }
        }
        
        this.testResults.push({
            name: 'Cover entities added to room configuration',
            passed: allRoomsHaveCovers
        });
    }

    testCoverHtmlFilesExist() {
        const roomsWithCovers = ['kids', 'kinderbad', 'flur', 'aupair', 'schlafzimmer'];
        let allFilesExist = true;
        
        for (const roomKey of roomsWithCovers) {
            const htmlPath = path.join(__dirname, `../www/${roomKey}.html`);
            if (!fs.existsSync(htmlPath)) {
                allFilesExist = false;
                break;
            }
        }
        
        this.testResults.push({
            name: 'Cover HTML files exist for all rooms with covers',
            passed: allFilesExist
        });
    }

    testCoverCssStyles() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check for essential cover card CSS classes
        const requiredClasses = [
            '.covers-card',
            '.cover-card-header',
            '.cover-position-slider',
            '.slider',
            '.position-btn',
            '.cover-expanded-controls',
            '.individual-cover'
        ];
        
        let allClassesPresent = true;
        for (const className of requiredClasses) {
            if (!cssContent.includes(className)) {
                allClassesPresent = false;
                break;
            }
        }
        
        this.testResults.push({
            name: 'Cover card CSS styles are present',
            passed: allClassesPresent
        });
    }

    testCoverJavaScriptFunctions() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check for essential cover control functions
        const requiredFunctions = [
            'initializeCoverControls',
            'setCoverPosition',
            'updateCoverStates',
            'updateCoverControls'
        ];
        
        let allFunctionsPresent = true;
        for (const functionName of requiredFunctions) {
            if (!jsContent.includes(functionName)) {
                allFunctionsPresent = false;
                break;
            }
        }
        
        this.testResults.push({
            name: 'Cover control JavaScript functions are present',
            passed: allFunctionsPresent
        });
    }
}

module.exports = CoverCardTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new CoverCardTests();
    testRunner.runAllTests();
}