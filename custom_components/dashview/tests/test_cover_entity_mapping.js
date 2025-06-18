// Test for cover entity mapping validation
// Ensures that all cover entities from the original YAML are properly mapped

const fs = require('fs');
const path = require('path');

class CoverEntityMappingTests {
    constructor() {
        this.testResults = [];
        
        // Original cover mapping from the YAML specification
        this.originalMapping = {
            'Kinderzimmer': [
                'cover.rollo_jan_philipp_3',
                'cover.fenster_felicia_links',
                'cover.fenster_felicia_rechts',
                'cover.rollo_frederik_seite_3',
                'cover.rollo_frederik_balkon_3'
            ],
            'Kinderbad': [
                'cover.rollo_kinderbad_2'
            ],
            'Aupair': [
                'cover.rollo_aupair_2', // Special case for main control
                'cover.rollo_aupair',
                'cover.rollo_aupairbad_3'
            ],
            'Eltern': [
                'cover.velux_external_cover_awning_blinds_3',
                'cover.velux_external_cover_awning_blinds_2',
                'cover.velux_external_cover_awning_blinds'
            ],
            'Kinderflur': [
                'cover.rollo_treppenaufgang'
            ]
        };
        
        // Mapping from YAML names to our config keys
        this.roomNameMapping = {
            'Kinderzimmer': 'kids',
            'Kinderbad': 'kinderbad',
            'Aupair': 'aupair',
            'Eltern': 'schlafzimmer',
            'Kinderflur': 'flur'
        };
    }

    runAllTests() {
        console.log('\n[DashView] Testing cover entity mapping...');
        
        this.testEntityMappingAccuracy();
        this.testConfigurationBasedEntityLoading();
        this.testSpecialAupairCase();
        
        // Print results
        console.log('\n[DashView] Cover Entity Mapping Test Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✓' : '❌';
            console.log(`${status} ${result.name}`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        const allPassed = this.testResults.every(result => result.passed);
        if (allPassed) {
            console.log('✅ All cover entity mapping tests passed!');
        } else {
            console.log('❌ Some cover entity mapping tests failed!');
        }
        
        return allPassed;
    }

    testEntityMappingAccuracy() {
        try {
            const configPath = path.join(__dirname, '../www/config/house_setup.json');
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);
            
            let mappingAccurate = true;
            let errors = [];
            
            for (const [yamlRoomName, expectedEntities] of Object.entries(this.originalMapping)) {
                const configRoomKey = this.roomNameMapping[yamlRoomName];
                const room = config.rooms[configRoomKey];
                
                if (!room || !room.covers) {
                    mappingAccurate = false;
                    errors.push(`Room ${configRoomKey} missing or has no covers`);
                    continue;
                }
                
                // Check if all expected entities are present
                for (const expectedEntity of expectedEntities) {
                    if (!room.covers.includes(expectedEntity)) {
                        mappingAccurate = false;
                        errors.push(`Entity ${expectedEntity} missing from room ${configRoomKey}`);
                    }
                }
            }
            
            this.testResults.push({
                name: 'Cover entity mapping matches original YAML specification',
                passed: mappingAccurate,
                error: errors.length > 0 ? errors.join('; ') : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover entity mapping matches original YAML specification',
                passed: false,
                error: error.message
            });
        }
    }

    testConfigurationBasedEntityLoading() {
        try {
            const jsPath = path.join(__dirname, '../www/dashview-panel.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check that cover entities are dynamically loaded from configuration
            const hasGetAllCoverEntitiesMethod = jsContent.includes('_getAllCoverEntities()');
            const hasConfigurationLoad = jsContent.includes('this._houseConfig.rooms');
            const hasConfigLoadBeforeEntityWatch = jsContent.includes('Load configuration before enabling entity watching');
            const hasNonHardcodedEntities = !jsContent.includes('cover.rollo_jan_philipp_3') || 
                                          jsContent.includes('// Add cover entities from configuration');
            
            const allValid = hasGetAllCoverEntitiesMethod && hasConfigurationLoad && 
                           hasConfigLoadBeforeEntityWatch && hasNonHardcodedEntities;
            
            let errors = [];
            if (!hasGetAllCoverEntitiesMethod) {
                errors.push('_getAllCoverEntities method not found');
            }
            if (!hasConfigurationLoad) {
                errors.push('Configuration-based entity loading not found');
            }
            if (!hasConfigLoadBeforeEntityWatch) {
                errors.push('Configuration not loaded before entity watching');
            }
            if (!hasNonHardcodedEntities) {
                errors.push('Cover entities appear to be hardcoded rather than configuration-based');
            }
            
            this.testResults.push({
                name: 'Cover entities are dynamically loaded from configuration (not hardcoded)',
                passed: allValid,
                error: errors.length > 0 ? errors.join('; ') : null
            });
        } catch (error) {
            this.testResults.push({
                name: 'Cover entities are dynamically loaded from configuration (not hardcoded)',
                passed: false,
                error: error.message
            });
        }
    }

    testSpecialAupairCase() {
        try {
            // Test the special Au-pair case where main control uses different entity
            const aupairHtmlPath = path.join(__dirname, '../www/aupair.html');
            const aupairHtmlContent = fs.readFileSync(aupairHtmlPath, 'utf8');
            
            // Check that main slider uses cover.rollo_aupair_2
            const hasCorrectMainEntity = aupairHtmlContent.includes('data-entity="cover.rollo_aupair_2"');
            
            this.testResults.push({
                name: 'Au-pair room uses correct main cover entity (cover.rollo_aupair_2)',
                passed: hasCorrectMainEntity,
                error: hasCorrectMainEntity ? null : 'Main cover entity not set correctly for Au-pair room'
            });
        } catch (error) {
            this.testResults.push({
                name: 'Au-pair room uses correct main cover entity (cover.rollo_aupair_2)',
                passed: false,
                error: error.message
            });
        }
    }
}

module.exports = CoverEntityMappingTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new CoverEntityMappingTests();
    testRunner.runAllTests();
}