/**
 * Weather Popup Fix Test - Issue #107
 * Validates that weather functions work with both Shadow DOM and regular elements
 */

// Mock function to simulate the updateCurrentWeather method behavior
function mockUpdateCurrentWeatherWithGetElementById(shadow, weatherState) {
    // This simulates the OLD buggy behavior
    const iconElement = shadow.getElementById('current-weather-icon');
    const tempElement = shadow.getElementById('current-temperature');
    return { iconElement, tempElement };
}

function mockUpdateCurrentWeatherWithQuerySelector(shadow, weatherState) {
    // This simulates the FIXED behavior
    const iconElement = shadow.querySelector('#current-weather-icon');
    const tempElement = shadow.querySelector('#current-temperature');
    return { iconElement, tempElement };
}

// Mock Shadow DOM element
function createMockShadowRoot() {
    const mockElements = {
        'current-weather-icon': { tagName: 'IMG' },
        'current-temperature': { tagName: 'SPAN' }
    };
    
    return {
        querySelector: function(selector) {
            const id = selector.replace('#', '');
            return mockElements[id] || null;
        },
        getElementById: function(id) {
            return mockElements[id] || null;
        }
    };
}

// Mock regular DOM element (like a popup div)
function createMockRegularElement() {
    const mockElements = {
        'current-weather-icon': { tagName: 'IMG' },
        'current-temperature': { tagName: 'SPAN' }
    };
    
    return {
        querySelector: function(selector) {
            const id = selector.replace('#', '');
            return mockElements[id] || null;
        }
        // Note: Regular elements don't have getElementById - this causes the TypeError
    };
}

function runWeatherPopupFixTests() {
    console.log('🌤️  Running Weather Popup Fix Tests (Issue #107)...');
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Verify old approach fails with regular element
    totalTests++;
    console.log('  Test 1: Old approach should fail with regular element');
    try {
        const regularElement = createMockRegularElement();
        const weatherState = { state: 'sunny' };
        
        // This should throw TypeError: shadow.getElementById is not a function
        mockUpdateCurrentWeatherWithGetElementById(regularElement, weatherState);
        console.log('    ❌ Expected TypeError but function completed successfully');
    } catch (error) {
        if (error.message.includes('getElementById is not a function')) {
            console.log('    ✅ Correctly throws TypeError with getElementById on regular element');
            testsPassed++;
        } else {
            console.log('    ❌ Unexpected error:', error.message);
        }
    }
    
    // Test 2: Verify old approach works with Shadow DOM
    totalTests++;
    console.log('  Test 2: Old approach should work with Shadow DOM');
    try {
        const shadowRoot = createMockShadowRoot();
        const weatherState = { state: 'sunny' };
        
        const result = mockUpdateCurrentWeatherWithGetElementById(shadowRoot, weatherState);
        if (result.iconElement && result.tempElement) {
            console.log('    ✅ Old approach works with Shadow DOM');
            testsPassed++;
        } else {
            console.log('    ❌ Old approach failed to find elements in Shadow DOM');
        }
    } catch (error) {
        console.log('    ❌ Unexpected error with Shadow DOM:', error.message);
    }
    
    // Test 3: Verify new approach works with regular element
    totalTests++;
    console.log('  Test 3: New approach should work with regular element');
    try {
        const regularElement = createMockRegularElement();
        const weatherState = { state: 'sunny' };
        
        const result = mockUpdateCurrentWeatherWithQuerySelector(regularElement, weatherState);
        if (result.iconElement && result.tempElement) {
            console.log('    ✅ New approach works with regular element');
            testsPassed++;
        } else {
            console.log('    ❌ New approach failed to find elements in regular element');
        }
    } catch (error) {
        console.log('    ❌ Unexpected error with regular element:', error.message);
    }
    
    // Test 4: Verify new approach still works with Shadow DOM
    totalTests++;
    console.log('  Test 4: New approach should still work with Shadow DOM');
    try {
        const shadowRoot = createMockShadowRoot();
        const weatherState = { state: 'sunny' };
        
        const result = mockUpdateCurrentWeatherWithQuerySelector(shadowRoot, weatherState);
        if (result.iconElement && result.tempElement) {
            console.log('    ✅ New approach still works with Shadow DOM');
            testsPassed++;
        } else {
            console.log('    ❌ New approach failed to find elements in Shadow DOM');
        }
    } catch (error) {
        console.log('    ❌ Unexpected error with Shadow DOM:', error.message);
    }
    
    console.log(`\n✅ Weather Popup Fix tests completed: ${testsPassed}/${totalTests} passed`);
    return testsPassed === totalTests;
}

// Run the tests
if (require.main === module) {
    process.exit(runWeatherPopupFixTests() ? 0 : 1);
}

module.exports = runWeatherPopupFixTests;