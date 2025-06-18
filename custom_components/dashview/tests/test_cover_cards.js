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
        this.testNonHardcodedImplementation();
        
        // Print results
        console.log('\n[DashView] Cover Card Test Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✓' : '❌';
            console.log(`${status} ${result.name}`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }
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
        try {
            const configPath = path.join(__dirname, '../www/config/house_setup.json');
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);
            
            // Check that cover entities are added to rooms
            const roomsWithCovers = ['kids', 'kinderbad', 'flur', 'aupair', 'schlafzimmer'];
            let allRoomsHaveCovers = true;
            let errors = [];
            
            for (const roomKey of roomsWithCovers) {
                const room = config.rooms[roomKey];
                if (!room || !room.covers || room.covers.length === 0) {
                    allRoomsHaveCovers = false;
                    errors.push(`Room ${roomKey} missing covers`);
                }
            }
            
            this.testResults.push({
                name: 'Cover entities added to room configuration',
                passed: allRoomsHaveCovers,
                error: errors.length > 0 ? errors.join('; ') : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover entities added to room configuration',
                passed: false,
                error: error.message
            });
        }
    }

    testCoverHtmlFilesExist() {
        try {
            const roomsWithCovers = ['kids', 'kinderbad', 'flur', 'aupair', 'schlafzimmer'];
            let allFilesExist = true;
            let errors = [];
            
            for (const roomKey of roomsWithCovers) {
                const htmlPath = path.join(__dirname, `../www/${roomKey}.html`);
                if (!fs.existsSync(htmlPath)) {
                    allFilesExist = false;
                    errors.push(`HTML file missing for ${roomKey}`);
                } else {
                    // Verify the file contains cover card markup
                    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                    if (!htmlContent.includes('covers-card')) {
                        allFilesExist = false;
                        errors.push(`HTML file for ${roomKey} missing cover card markup`);
                    }
                }
            }
            
            this.testResults.push({
                name: 'Cover HTML files exist for all rooms with covers',
                passed: allFilesExist,
                error: errors.length > 0 ? errors.join('; ') : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover HTML files exist for all rooms with covers',
                passed: false,
                error: error.message
            });
        }
    }

    testCoverCssStyles() {
        try {
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
            let missingClasses = [];
            
            for (const className of requiredClasses) {
                if (!cssContent.includes(className)) {
                    allClassesPresent = false;
                    missingClasses.push(className);
                }
            }
            
            this.testResults.push({
                name: 'Cover card CSS styles are present',
                passed: allClassesPresent,
                error: missingClasses.length > 0 ? `Missing classes: ${missingClasses.join(', ')}` : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover card CSS styles are present',
                passed: false,
                error: error.message
            });
        }
    }

    testCoverJavaScriptFunctions() {
        try {
            const jsPath = path.join(__dirname, '../www/dashview-panel.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for essential cover control functions
            const requiredFunctions = [
                'initializeCoverControls',
                'setCoverPosition',
                'updateCoverStates',
                'updateCoverControls',
                '_getAllCoverEntities'
            ];
            
            let allFunctionsPresent = true;
            let missingFunctions = [];
            
            for (const functionName of requiredFunctions) {
                if (!jsContent.includes(functionName)) {
                    allFunctionsPresent = false;
                    missingFunctions.push(functionName);
                }
            }
            
            this.testResults.push({
                name: 'Cover control JavaScript functions are present',
                passed: allFunctionsPresent,
                error: missingFunctions.length > 0 ? `Missing functions: ${missingFunctions.join(', ')}` : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover control JavaScript functions are present',
                passed: false,
                error: error.message
            });
        }
    }

    testNonHardcodedImplementation() {
        try {
            const jsPath = path.join(__dirname, '../www/dashview-panel.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Ensure cover entities are NOT hardcoded in entitiesToWatch
            const hasHardcodedCoverEntities = jsContent.includes('cover.rollo_jan_philipp_3') &&
                                            jsContent.includes('entitiesToWatch = [');
            
            // Ensure proper configuration-based loading
            const hasConfigurationBasedLoading = jsContent.includes('_getAllCoverEntities()') &&
                                                jsContent.includes('coverEntities.forEach(entityId');
            
            const isProperlyImplemented = !hasHardcodedCoverEntities && hasConfigurationBasedLoading;
            
            let error = null;
            if (hasHardcodedCoverEntities) {
                error = 'Cover entities are hardcoded in entitiesToWatch array';
            } else if (!hasConfigurationBasedLoading) {
                error = 'Configuration-based entity loading not properly implemented';
            }
            
            this.testResults.push({
                name: 'Cover entities are loaded from configuration (not hardcoded)',
                passed: isProperlyImplemented,
                error: error
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover entities are loaded from configuration (not hardcoded)',
                passed: false,
                error: error.message
            });
        }
    }
}

module.exports = CoverCardTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new CoverCardTests();
    testRunner.runAllTests();
}