/**
 * Test to check for the entity loading issue
 * This test simulates the initialization sequence to check for race conditions
 */

// Mock DOM environment
const mockElement = (tagName) => ({
    tagName,
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    addEventListener: () => {}
});

global.document = {
    createElement: mockElement,
    body: mockElement('body')
};

global.fetch = () => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<div>test</div>')
});

global.window = {
    location: { hash: '#home' },
    addEventListener: () => {}
};

global.HTMLElement = class HTMLElement {
    constructor() {
        this.shadowRoot = null;
    }
    
    attachShadow() {
        this.shadowRoot = mockElement('shadow-root');
        return this.shadowRoot;
    }
};

// Import the DashviewPanel class
const fs = require('fs').promises;
const path = require('path');

async function testEntityLoadingSequence() {
    console.log('[Test] Testing entity loading sequence...');
    
    // Read and evaluate the dashview-panel.js file
    const panelCode = await fs.readFile(
        path.join(__dirname, 'custom_components/dashview/www/dashview-panel.js'), 
        'utf8'
    );
    
    // Execute the code to get the DashviewPanel class
    eval(panelCode);
    
    // Create a mock HASS object with entities
    const mockHass = {
        states: {
            'weather.forecast_home': {
                state: 'sunny',
                attributes: {
                    friendly_name: 'Home Forecast',
                    temperature: 22.5
                },
                forecast: [{ temperature: 23.0 }]
            },
            'person.markus': {
                state: 'home',
                attributes: {
                    entity_picture: null
                }
            },
            'sensor.dashview_configured_weather': {
                state: 'weather.forecast_home'
            }
        }
    };
    
    // Test Case 1: HASS set before content ready (simulating the race condition)
    console.log('\n[Test] Case 1: HASS set before content ready');
    const panel1 = new DashviewPanel();
    
    // Set hass before content is ready
    panel1.hass = mockHass;
    console.log('- HASS set, _contentReady:', panel1._contentReady);
    console.log('- _lastEntityStates size:', panel1._lastEntityStates.size);
    
    // Simulate content loading
    panel1._contentReady = true;
    panel1._handleHassUpdate();
    console.log('- After _handleHassUpdate, _lastEntityStates size:', panel1._lastEntityStates.size);
    
    // Test Case 2: HASS set after content ready (normal flow)
    console.log('\n[Test] Case 2: HASS set after content ready');
    const panel2 = new DashviewPanel();
    
    // Set content ready first
    panel2._contentReady = true;
    console.log('- Content ready, _lastEntityStates size:', panel2._lastEntityStates.size);
    
    // Set hass after content is ready
    panel2.hass = mockHass;
    console.log('- After setting HASS, _lastEntityStates size:', panel2._lastEntityStates.size);
    
    // Check if the first case has the issue
    const hasIssue = panel1._lastEntityStates.size === 0;
    console.log('\n[Test] Results:');
    console.log('- Race condition detected:', hasIssue);
    
    if (hasIssue) {
        console.log('🔴 Issue found: When HASS is set before content is ready, entities are not initially loaded into _lastEntityStates');
        console.log('   This means the first _checkEntityChanges() call may not detect the entities as changed');
    } else {
        console.log('✅ No issue detected');
    }
    
    return hasIssue;
}

// Run the test
testEntityLoadingSequence().then(hasIssue => {
    process.exit(hasIssue ? 1 : 0);
}).catch(error => {
    console.error('[Test] Error:', error);
    process.exit(1);
});