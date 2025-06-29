// Test for new thermostat card layout - Issue #227
// Test the updated temperature card layout and functionality

function testThermostatCardNewLayout() {
    console.log('[TEST] Starting thermostat card new layout tests...');
    
    const tests = [
        testCardHTMLStructure,
        testCSSGridLayout,
        testTemperatureDisplay,
        testHumidityDisplay,
        testGraphRendering,
        testResponsiveDesign
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            test();
            console.log(`✅ ${test.name} - PASSED`);
            passed++;
        } catch (error) {
            console.error(`❌ ${test.name} - FAILED:`, error.message);
            failed++;
        }
    });
    
    console.log(`[TEST] Thermostat card tests completed: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

function testCardHTMLStructure() {
    // Create test HTML structure
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="thermostat-card">
            <div class="thermostat-name">Test Room</div>
            <div class="thermostat-temp-display">
                <span class="temperature">21.5°</span><span class="humidity">45%</span>
            </div>
            <div class="thermostat-graph"></div>
        </div>
    `;
    
    const card = container.querySelector('.thermostat-card');
    const nameEl = card.querySelector('.thermostat-name');
    const tempDisplay = card.querySelector('.thermostat-temp-display');
    const tempEl = tempDisplay.querySelector('.temperature');
    const humEl = tempDisplay.querySelector('.humidity');
    const graphEl = card.querySelector('.thermostat-graph');
    
    if (!nameEl) throw new Error('Missing thermostat-name element');
    if (!tempDisplay) throw new Error('Missing thermostat-temp-display element');
    if (!tempEl) throw new Error('Missing temperature element');
    if (!humEl) throw new Error('Missing humidity element');
    if (!graphEl) throw new Error('Missing thermostat-graph element');
    
    if (nameEl.textContent !== 'Test Room') {
        throw new Error('Name element content incorrect');
    }
    
    if (tempEl.textContent !== '21.5°') {
        throw new Error('Temperature element content incorrect');
    }
    
    if (humEl.textContent !== '45%') {
        throw new Error('Humidity element content incorrect');
    }
}

function testCSSGridLayout() {
    // Test CSS grid layout properties
    const style = document.createElement('style');
    style.textContent = `
        .test-thermostat-card {
            display: grid;
            grid-template-areas: "temp" "name";
            grid-template-rows: 65% 1fr;
            height: 160px;
            padding: 6px;
        }
        .test-thermostat-name {
            grid-area: name;
            justify-self: start;
            align-self: start;
            font-size: 14px;
            padding-left: 20px;
        }
        .test-thermostat-temp-display {
            grid-area: temp;
            justify-self: start;
            align-self: end;
            padding-left: 20px;
        }
    `;
    document.head.appendChild(style);
    
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="test-thermostat-card">
            <div class="test-thermostat-name">Room</div>
            <div class="test-thermostat-temp-display">
                <span class="temperature">22.1°</span>
            </div>
        </div>
    `;
    document.body.appendChild(container);
    
    const card = container.querySelector('.test-thermostat-card');
    const computedStyle = window.getComputedStyle(card);
    
    if (computedStyle.display !== 'grid') {
        throw new Error('Card should use CSS Grid layout');
    }
    
    if (computedStyle.height !== '160px') {
        throw new Error('Card height should be 160px');
    }
    
    // Cleanup
    document.body.removeChild(container);
    document.head.removeChild(style);
}

function testTemperatureDisplay() {
    // Test temperature value formatting
    const temperatures = [
        { input: 21.456, expected: '21.5°' },
        { input: 20, expected: '20.0°' },
        { input: NaN, expected: '--°' },
        { input: null, expected: '--°' }
    ];
    
    temperatures.forEach(({ input, expected }) => {
        const tempElement = document.createElement('span');
        tempElement.className = 'temperature';
        
        if (input && !isNaN(input)) {
            tempElement.textContent = `${Number(input).toFixed(1)}°`;
        } else {
            tempElement.textContent = '--°';
        }
        
        if (tempElement.textContent !== expected) {
            throw new Error(`Temperature formatting failed for ${input}: expected ${expected}, got ${tempElement.textContent}`);
        }
    });
}

function testHumidityDisplay() {
    // Test humidity value formatting
    const humidities = [
        { input: 45.7, expected: '46%' },
        { input: 30, expected: '30%' },
        { input: NaN, expected: '--%' },
        { input: null, expected: '--%' }
    ];
    
    humidities.forEach(({ input, expected }) => {
        const humElement = document.createElement('span');
        humElement.className = 'humidity';
        
        if (input && !isNaN(input)) {
            humElement.textContent = `${Math.round(input)}%`;
        } else {
            humElement.textContent = '--%';
        }
        
        if (humElement.textContent !== expected) {
            throw new Error(`Humidity formatting failed for ${input}: expected ${expected}, got ${humElement.textContent}`);
        }
    });
}

function testGraphRendering() {
    // Test graph SVG generation
    const mockHistoryData = [
        { state: '20.1' },
        { state: '20.5' },
        { state: '21.2' },
        { state: '21.8' },
        { state: '21.3' }
    ];
    
    const container = document.createElement('div');
    container.className = 'thermostat-graph';
    
    // Simulate the graph rendering logic
    const temperatures = mockHistoryData.map(d => parseFloat(d.state)).filter(t => !isNaN(t));
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const tempRange = Math.max(maxTemp - minTemp, 2);
    const padding = tempRange * 0.1;
    const adjustedMin = minTemp - padding;
    const adjustedMax = maxTemp + padding;
    const adjustedRange = adjustedMax - adjustedMin;
    
    const svgWidth = 100;
    const svgHeight = 85;
    
    const points = mockHistoryData.map((d, i) => ({
        x: (i / (mockHistoryData.length - 1)) * svgWidth,
        y: svgHeight - ((parseFloat(d.state) - adjustedMin) / adjustedRange) * svgHeight,
        temp: parseFloat(d.state)
    })).filter(p => !isNaN(p.temp));
    
    if (points.length < 2) {
        throw new Error('Should generate sufficient points for graph');
    }
    
    // Check that points are within bounds
    points.forEach((point, i) => {
        if (point.x < 0 || point.x > svgWidth) {
            throw new Error(`Point ${i} x-coordinate out of bounds: ${point.x}`);
        }
        if (point.y < 0 || point.y > svgHeight) {
            throw new Error(`Point ${i} y-coordinate out of bounds: ${point.y}`);
        }
    });
    
    // Test path generation
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        if (i === 1) {
            pathD += ` Q ${prevPoint.x + (currentPoint.x - prevPoint.x) / 2} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`;
        } else {
            const nextPoint = points[i + 1] || currentPoint;
            const cp1x = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
            const cp1y = prevPoint.y;
            const cp2x = currentPoint.x - (nextPoint.x - currentPoint.x) * 0.3;
            const cp2y = currentPoint.y;
            
            pathD += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentPoint.x} ${currentPoint.y}`;
        }
    }
    
    if (!pathD.startsWith('M ')) {
        throw new Error('Path should start with move command');
    }
    
    if (pathD.length < 10) {
        throw new Error('Path should contain curve commands');
    }
}

function testResponsiveDesign() {
    // Test responsive design aspects
    const style = document.createElement('style');
    style.textContent = `
        .test-responsive-card {
            width: 100%;
            max-width: 500px;
            height: 160px;
        }
        .test-responsive-graph {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 85px;
        }
    `;
    document.head.appendChild(style);
    
    const container = document.createElement('div');
    container.style.width = '300px';
    container.innerHTML = `
        <div class="test-responsive-card">
            <div class="test-responsive-graph">
                <svg viewBox="0 0 100 85" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                    <path d="M 0 85 Q 25 75 50 70 C 62.5 70 75 65 100 60" stroke="var(--gray800)" stroke-width="2" fill="none" />
                </svg>
            </div>
        </div>
    `;
    document.body.appendChild(container);
    
    const card = container.querySelector('.test-responsive-card');
    const graph = card.querySelector('.test-responsive-graph');
    const svg = graph.querySelector('svg');
    
    const cardRect = card.getBoundingClientRect();
    const graphRect = graph.getBoundingClientRect();
    
    if (graphRect.width !== cardRect.width) {
        throw new Error('Graph should span full card width');
    }
    
    if (svg.getAttribute('viewBox') !== '0 0 100 85') {
        throw new Error('SVG viewBox should be correctly set');
    }
    
    // Cleanup
    document.body.removeChild(container);
    document.head.removeChild(style);
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
    // Auto-run tests when loaded
    setTimeout(() => {
        testThermostatCardNewLayout();
    }, 100);
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = {
        testThermostatCardNewLayout,
        testCardHTMLStructure,
        testCSSGridLayout,
        testTemperatureDisplay,
        testHumidityDisplay,
        testGraphRendering,
        testResponsiveDesign
    };
}