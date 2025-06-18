#!/usr/bin/env node

/**
 * Test for daily forecast initialization issue (Issue #147)
 * Validates that tabs work correctly and "no data" messages are shown
 * when dailyData is empty or unavailable
 */

// Mock DOM elements
class MockElement {
    constructor(tagName = 'div', attributes = {}) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.classList = new MockClassList();
        this.innerHTML = '';
        this.dataset = attributes.dataset || {};
        this.children = [];
        this.eventListeners = {};
    }

    querySelector(selector) {
        if (selector === '#daily-forecast-content') {
            if (!this._contentElement) {
                this._contentElement = new MockElement('div', { id: 'daily-forecast-content' });
            }
            return this._contentElement;
        }
        return null;
    }

    querySelectorAll(selector) {
        if (selector === '.forecast-tab') {
            if (!this._tabElements) {
                const tab0 = new MockElement('button', { 
                    class: 'forecast-tab active', 
                    dataset: { day: '0' } 
                });
                tab0.dataset.day = '0';
                
                const tab1 = new MockElement('button', { 
                    class: 'forecast-tab', 
                    dataset: { day: '1' } 
                });
                tab1.dataset.day = '1';
                
                const tab2 = new MockElement('button', { 
                    class: 'forecast-tab', 
                    dataset: { day: '2' } 
                });
                tab2.dataset.day = '2';
                
                this._tabElements = [tab0, tab1, tab2];
            }
            return this._tabElements;
        }
        return [];
    }

    addEventListener(event, handler) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(handler);
    }

    click() {
        if (this.eventListeners.click) {
            this.eventListeners.click.forEach(handler => {
                try {
                    handler();
                } catch (e) {
                    console.error('Error in click handler:', e);
                }
            });
        }
    }
}

class MockClassList {
    constructor() {
        this.classes = new Set();
    }

    add(className) {
        this.classes.add(className);
    }

    remove(className) {
        this.classes.delete(className);
    }

    toggle(className, force) {
        if (force !== undefined) {
            if (force) {
                this.classes.add(className);
            } else {
                this.classes.delete(className);
            }
        } else {
            if (this.classes.has(className)) {
                this.classes.delete(className);
            } else {
                this.classes.add(className);
            }
        }
        return this.classes.has(className);
    }

    contains(className) {
        return this.classes.has(className);
    }
}

// Mock DashView panel for testing
class MockDashViewPanel {
    constructor() {
        this.showDailyForecastCalled = false;
        this.showDailyForecastArgs = null;
    }

    showDailyForecast(container, dailyData, dayIndex) {
        this.showDailyForecastCalled = true;
        this.showDailyForecastArgs = { container, dailyData, dayIndex };
        
        if (!dailyData || dailyData.length <= dayIndex) {
            container.innerHTML = '<div>Keine Daten verfügbar</div>';
            return;
        }

        const dayForecast = dailyData[dayIndex];
        container.innerHTML = `<div class="daily-forecast">Day ${dayIndex} forecast</div>`;
    }

    translateWeatherCondition(condition) {
        const translations = {
            'sunny': 'Sonnig',
            'cloudy': 'Bewölkt',
            'rainy': 'Regnerisch'
        };
        return translations[condition] || condition;
    }

    // Current implementation (problematic)
    initializeDailyForecastOld(shadow, dailyData) {
        const tabs = shadow.querySelectorAll('.forecast-tab');
        const content = shadow.querySelector('#daily-forecast-content');
        
        if (!tabs.length || !content || !dailyData || dailyData.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to the clicked tab
                tab.classList.add('active');
                
                const dayIndex = parseInt(tab.dataset.day);
                this.showDailyForecast(content, dailyData, dayIndex);
            });
        });

        // Show today's forecast by default
        tabs[0].click();
    }

    // New implementation (fixed)
    initializeDailyForecastNew(shadow, dailyData) {
        const tabs = shadow.querySelectorAll('.forecast-tab');
        const content = shadow.querySelector('#daily-forecast-content');
        
        if (!tabs.length || !content) {
            console.error('[DashView] Daily forecast tabs or content container not found.');
            return;
        }

        // This function will be called by the event listeners and for the initial render.
        const updateForecastDisplay = (dayIndex) => {
            // First, update the active state on the tabs
            tabs.forEach(t => {
                t.classList.toggle('active', parseInt(t.dataset.day) === dayIndex);
            });

            // Now, render the content based on the selected day
            this.showDailyForecast(content, dailyData, dayIndex);
        };

        // Always attach click listeners so the tabs are interactive.
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const dayIndex = parseInt(tab.dataset.day);
                updateForecastDisplay(dayIndex);
            });
        });

        // Explicitly render the initial state for "Heute" (day 0)
        // This replaces the problematic tabs[0].click()
        updateForecastDisplay(0);
    }
}

// Test class
class DailyForecastInitializationTests {
    constructor() {
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    assert(condition, message) {
        if (condition) {
            this.testsPassed++;
            console.log(`✓ ${message}`);
        } else {
            this.testsFailed++;
            console.error(`✗ ${message}`);
        }
    }

    // Test the old implementation behavior with no data
    testOldImplementationWithNoData() {
        console.log('\n  Testing old implementation with no data...');
        
        const panel = new MockDashViewPanel();
        const shadow = new MockElement();
        const dailyData = null; // No data available
        
        panel.initializeDailyForecastOld(shadow, dailyData);
        
        // Should NOT have called showDailyForecast because function exits early
        this.assert(!panel.showDailyForecastCalled, 'Old implementation should not call showDailyForecast with no data');
        
        // Check that tabs don't have event listeners attached
        const tabs = shadow.querySelectorAll('.forecast-tab');
        const firstTab = tabs[0];
        this.assert(!firstTab.eventListeners.click || firstTab.eventListeners.click.length === 0, 
                   'Old implementation should not attach event listeners with no data');
    }

    // Test the new implementation behavior with no data
    testNewImplementationWithNoData() {
        console.log('\n  Testing new implementation with no data...');
        
        const panel = new MockDashViewPanel();
        const shadow = new MockElement();
        const dailyData = null; // No data available
        
        panel.initializeDailyForecastNew(shadow, dailyData);
        
        // Should have called showDailyForecast even with no data
        this.assert(panel.showDailyForecastCalled, 'New implementation should call showDailyForecast even with no data');
        this.assert(panel.showDailyForecastArgs.dayIndex === 0, 'Should initialize with day 0');
        
        // Check that tabs have event listeners attached
        const tabs = shadow.querySelectorAll('.forecast-tab');
        const firstTab = tabs[0];
        this.assert(firstTab.eventListeners.click && firstTab.eventListeners.click.length > 0, 
                   'New implementation should attach event listeners even with no data');
    }

    // Test that "Keine Daten verfügbar" message is shown
    testNoDataMessage() {
        console.log('\n  Testing "Keine Daten verfügbar" message...');
        
        const panel = new MockDashViewPanel();
        const shadow = new MockElement();
        const dailyData = []; // Empty data array
        
        panel.initializeDailyForecastNew(shadow, dailyData);
        
        const content = shadow.querySelector('#daily-forecast-content');
        this.assert(content.innerHTML.includes('Keine Daten verfügbar'), 
                   'Should show "Keine Daten verfügbar" message when no data is available');
    }

    // Test that tabs work correctly with data
    testTabsWithData() {
        console.log('\n  Testing tabs functionality with data...');
        
        const panel = new MockDashViewPanel();
        const shadow = new MockElement();
        const dailyData = [
            { condition: 'sunny', temperature: 22, templow: 15 },
            { condition: 'cloudy', temperature: 18, templow: 12 },
            { condition: 'rainy', temperature: 16, templow: 10 }
        ];
        
        panel.initializeDailyForecastNew(shadow, dailyData);
        
        // Test clicking on second tab
        const tabs = shadow.querySelectorAll('.forecast-tab');
        const secondTab = tabs[1];
        
        // Reset the call tracking
        panel.showDailyForecastCalled = false;
        panel.showDailyForecastArgs = null;
        
        // Simulate click on second tab
        secondTab.click();
        
        this.assert(panel.showDailyForecastCalled, 'Clicking tab should call showDailyForecast');
        if (panel.showDailyForecastArgs) {
            this.assert(panel.showDailyForecastArgs.dayIndex === 1, 'Should call with correct day index');
        } else {
            this.assert(false, 'showDailyForecastArgs should not be null');
        }
        
        // Check that active class is toggled correctly
        this.assert(secondTab.classList.contains('active'), 'Clicked tab should have active class');
    }

    // Test the edge case with empty tabs
    testEdgeCaseNoTabs() {
        console.log('\n  Testing edge case with no tabs found...');
        
        const panel = new MockDashViewPanel();
        const shadow = {
            querySelectorAll: () => [], // No tabs found
            querySelector: () => new MockElement()
        };
        
        // Should not crash
        panel.initializeDailyForecastNew(shadow, []);
        this.assert(true, 'Should handle missing tabs gracefully');
    }

    runAllTests() {
        console.log('[DashView] Starting daily forecast initialization tests...');
        
        this.testOldImplementationWithNoData();
        this.testNewImplementationWithNoData();
        this.testNoDataMessage();
        this.testTabsWithData();
        this.testEdgeCaseNoTabs();
        
        console.log(`\n[DashView] Daily forecast initialization tests completed. Passed: ${this.testsPassed}, Failed: ${this.testsFailed}`);
        
        if (this.testsFailed === 0) {
            console.log('[DashView] All daily forecast initialization tests passed!');
            return true;
        } else {
            console.error('[DashView] Some daily forecast initialization tests failed!');
            return false;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new DailyForecastInitializationTests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = DailyForecastInitializationTests;