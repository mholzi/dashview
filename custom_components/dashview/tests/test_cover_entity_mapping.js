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
        this.testAllCoverEntitiesTracked();
        this.testSpecialAupairCase();
        
        // Print results
        console.log('\n[DashView] Cover Entity Mapping Test Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✓' : '❌';
            console.log(`${status} ${result.name}`);
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
        const configPath = path.join(__dirname, '../www/config/house_setup.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        let mappingAccurate = true;
        
        for (const [yamlRoomName, expectedEntities] of Object.entries(this.originalMapping)) {
            const configRoomKey = this.roomNameMapping[yamlRoomName];
            const room = config.rooms[configRoomKey];
            
            if (!room || !room.covers) {
                mappingAccurate = false;
                console.log(`❌ Room ${configRoomKey} missing or has no covers`);
                break;
            }
            
            // Check if all expected entities are present
            for (const expectedEntity of expectedEntities) {
                if (!room.covers.includes(expectedEntity)) {
                    mappingAccurate = false;
                    console.log(`❌ Entity ${expectedEntity} missing from room ${configRoomKey}`);
                    break;
                }
            }
            
            if (!mappingAccurate) break;
        }
        
        this.testResults.push({
            name: 'Cover entity mapping matches original YAML specification',
            passed: mappingAccurate
        });
    }

    testAllCoverEntitiesTracked() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Get all unique cover entities from the original mapping
        const allCoverEntities = new Set();
        for (const entities of Object.values(this.originalMapping)) {
            entities.forEach(entity => allCoverEntities.add(entity));
        }
        
        let allEntitiesTracked = true;
        for (const entity of allCoverEntities) {
            if (!jsContent.includes(`'${entity}'`)) {
                allEntitiesTracked = false;
                console.log(`❌ Entity ${entity} not found in JavaScript tracking`);
                break;
            }
        }
        
        this.testResults.push({
            name: 'All cover entities are tracked in JavaScript',
            passed: allEntitiesTracked
        });
    }

    testSpecialAupairCase() {
        // Test the special Au-pair case where main control uses different entity
        const aupairHtmlPath = path.join(__dirname, '../www/aupair.html');
        const aupairHtmlContent = fs.readFileSync(aupairHtmlPath, 'utf8');
        
        // Check that main slider uses cover.rollo_aupair_2
        const hasCorrectMainEntity = aupairHtmlContent.includes('data-entity="cover.rollo_aupair_2"');
        
        this.testResults.push({
            name: 'Au-pair room uses correct main cover entity (cover.rollo_aupair_2)',
            passed: hasCorrectMainEntity
        });
    }
}

module.exports = CoverEntityMappingTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new CoverEntityMappingTests();
    testRunner.runAllTests();
}