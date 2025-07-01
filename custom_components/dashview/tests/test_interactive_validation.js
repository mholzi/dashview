// test_interactive_validation.js

import { ValidationUtils, ConfigHealthChecker } from '../www/lib/utils/validation-utils.js';

export function runInteractiveValidationTests() {
    console.log('[DashView] Running Interactive Validation Tests...');

    const results = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        details: []
    };

    // Mock HASS object
    const mockHass = {
        states: {
            'light.test_light': { entity_id: 'light.test_light', state: 'on' },
            'sensor.test_sensor': { entity_id: 'sensor.test_sensor', state: 'active' },
            'switch.test_switch': { entity_id: 'switch.test_switch', state: 'off' }
        }
    };

    // Mock StateManager
    const mockStateManager = {};

    // Mock ConfigManager
    const mockConfigManager = {
        getConfig: (type) => {
            if (type === 'house') {
                return Promise.resolve({
                    rooms: {
                        'living_room': {
                            name: 'Living Room',
                            room_lights: ['light.test_light', 'light.nonexistent'],
                            room_sensors: ['sensor.test_sensor']
                        },
                        'kitchen': {
                            name: 'Kitchen',
                            room_lights: ['light.kitchen_light']
                        }
                    },
                    floors: {
                        'ground_floor': {
                            name: 'Ground Floor',
                            rooms: ['living_room', 'nonexistent_room']
                        },
                        'empty_floor': {
                            name: 'Empty Floor',
                            rooms: []
                        }
                    },
                    scenes: {
                        'test_scene': {
                            name: 'Test Scene',
                            entities: {
                                'light.test_light': { state: 'on' },
                                'light.nonexistent': { state: 'off' }
                            }
                        }
                    }
                });
            }
            return Promise.resolve(null);
        }
    };

    const validationUtils = new ValidationUtils(mockHass, mockStateManager);
    const configHealthChecker = new ConfigHealthChecker(mockHass, mockConfigManager);

    // Test 1: Entity ID Format Validation
    testEntityIdValidation();
    
    // Test 2: Numeric Range Validation
    testNumericValidation();
    
    // Test 3: Required Field Validation
    testRequiredValidation();
    
    // Test 4: Unique Key Validation
    testUniqueKeyValidation();
    
    // Test 5: Configuration Health Check
    testConfigHealthCheck();
    
    // Test 6: Visual Feedback Application
    testVisualFeedback();
    
    // Test 7: Debouncing and Caching
    testDebouncingAndCaching();

    function addTest(name, testFunction) {
        results.totalTests++;
        try {
            const result = testFunction();
            if (result === true || (result && result.passed)) {
                results.passed++;
                results.details.push({ name, status: 'PASSED', message: result.message || 'Test passed' });
                console.log(`✓ ${name}`);
            } else {
                results.failed++;
                results.details.push({ name, status: 'FAILED', message: result.message || 'Test failed' });
                console.error(`✗ ${name}: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            results.failed++;
            results.details.push({ name, status: 'ERROR', message: error.message });
            console.error(`✗ ${name}: ${error.message}`);
        }
    }

    function testEntityIdValidation() {
        addTest('Valid Entity ID Format', () => {
            const result = validationUtils.validateEntityIdFormat('light.living_room_lamp');
            return result.valid === true;
        });

        addTest('Invalid Entity ID Format - No Domain', () => {
            const result = validationUtils.validateEntityIdFormat('living_room_lamp');
            return result.valid === false && result.message.includes('Format');
        });

        addTest('Invalid Entity ID Format - Special Characters', () => {
            const result = validationUtils.validateEntityIdFormat('light.living-room-lamp');
            return result.valid === false;
        });

        addTest('Empty Entity ID', () => {
            const result = validationUtils.validateEntityIdFormat('');
            return result.valid === false && result.message.includes('erforderlich');
        });
    }

    function testNumericValidation() {
        addTest('Valid Number in Range', () => {
            const result = validationUtils.validateNumericRange(50, 0, 100);
            return result.valid === true;
        });

        addTest('Number Below Minimum', () => {
            const result = validationUtils.validateNumericRange(-5, 0, 100);
            return result.valid === false && result.message.includes('mindestens');
        });

        addTest('Number Above Maximum', () => {
            const result = validationUtils.validateNumericRange(150, 0, 100);
            return result.valid === false && result.message.includes('höchstens');
        });

        addTest('Non-Numeric Value', () => {
            const result = validationUtils.validateNumericRange('abc', 0, 100);
            return result.valid === false && result.message.includes('Zahl');
        });
    }

    function testRequiredValidation() {
        addTest('Required Field with Value', () => {
            const result = validationUtils.validateRequired('test value');
            return result.valid === true;
        });

        addTest('Required Field Empty', () => {
            const result = validationUtils.validateRequired('');
            return result.valid === false && result.message.includes('erforderlich');
        });

        addTest('Required Field Null', () => {
            const result = validationUtils.validateRequired(null);
            return result.valid === false;
        });
    }

    function testUniqueKeyValidation() {
        const existingKeys = ['key1', 'key2', 'key3'];

        addTest('Unique Key Valid', () => {
            const result = validationUtils.validateUniqueKey('new_key', existingKeys);
            return result.valid === true;
        });

        addTest('Duplicate Key', () => {
            const result = validationUtils.validateUniqueKey('key1', existingKeys);
            return result.valid === false && result.message.includes('bereits verwendet');
        });

        addTest('Invalid Key Format', () => {
            const result = validationUtils.validateUniqueKey('invalid-key', existingKeys);
            return result.valid === false && result.message.includes('Kleinbuchstaben');
        });

        addTest('Current Key Exception', () => {
            const result = validationUtils.validateUniqueKey('key1', existingKeys, 'key1');
            return result.valid === true;
        });
    }

    function testConfigHealthCheck() {
        addTest('Health Check Execution', async () => {
            try {
                const healthReport = await configHealthChecker.performHealthCheck();
                
                // Should find issues in our mock data
                const hasUnassignedRoom = healthReport.issues.some(issue => 
                    issue.id.includes('unassigned_room_kitchen')
                );
                const hasMissingEntity = healthReport.issues.some(issue => 
                    issue.id.includes('missing_entity')
                );
                const hasEmptyFloor = healthReport.issues.some(issue => 
                    issue.id.includes('empty_floor')
                );
                
                return {
                    passed: healthReport.totalIssues > 0 && hasUnassignedRoom && hasMissingEntity && hasEmptyFloor,
                    message: `Found ${healthReport.totalIssues} issues as expected`
                };
            } catch (error) {
                return { passed: false, message: `Health check failed: ${error.message}` };
            }
        });
    }

    function testVisualFeedback() {
        // Create mock DOM elements
        const mockInput = {
            classList: {
                classes: [],
                add(className) { this.classes.push(className); },
                remove(className) { 
                    this.classes = this.classes.filter(c => c !== className); 
                },
                contains(className) { return this.classes.includes(className); }
            },
            parentNode: {
                querySelector: () => null,
                insertBefore: () => {},
                appendChild: () => {}
            }
        };

        addTest('Apply Error Feedback', () => {
            validationUtils.applyValidationFeedback(mockInput, { 
                valid: false, 
                message: 'Test error' 
            });
            return mockInput.classList.contains('validation-error');
        });

        addTest('Apply Success Feedback', () => {
            validationUtils.applyValidationFeedback(mockInput, { valid: true });
            return mockInput.classList.contains('validation-success');
        });
    }

    function testDebouncingAndCaching() {
        addTest('Validation Cache', () => {
            // Test that caching mechanism exists
            const cacheExists = validationUtils._validationCache instanceof Map;
            const timersExist = validationUtils._debounceTimers instanceof Map;
            
            return cacheExists && timersExist;
        });

        addTest('Cache Cleanup', () => {
            validationUtils.clearCache();
            return validationUtils._validationCache.size === 0;
        });
    }

    // Summary
    console.log(`\n[DashView] Interactive Validation Tests Complete:`);
    console.log(`Total: ${results.totalTests}, Passed: ${results.passed}, Failed: ${results.failed}`);
    
    if (results.failed > 0) {
        console.log('\nFailed tests:');
        results.details.filter(d => d.status !== 'PASSED').forEach(detail => {
            console.log(`- ${detail.name}: ${detail.message}`);
        });
    }

    return results;
}

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('admin')) {
    setTimeout(() => {
        runInteractiveValidationTests();
    }, 1000);
}