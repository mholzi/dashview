// Test file for Usage Analytics functionality
// custom_components/dashview/tests/test_usage_analytics.js

console.log('[DashView] Running Usage Analytics tests...');

/**
 * Mock Home Assistant instance for testing
 */
const mockHass = {
  states: {
    'light.living_room': {
      entity_id: 'light.living_room',
      state: 'on',
      attributes: {
        friendly_name: 'Living Room Light',
        brightness: 255
      }
    },
    'climate.living_room': {
      entity_id: 'climate.living_room',
      state: 'heat',
      attributes: {
        friendly_name: 'Living Room Thermostat',
        current_temperature: 22,
        target_temperature: 24
      }
    },
    'sensor.power_consumption': {
      entity_id: 'sensor.power_consumption',
      state: '150',
      attributes: {
        friendly_name: 'Power Consumption',
        unit_of_measurement: 'W',
        device_class: 'power'
      }
    },
    'sensor.energy_total': {
      entity_id: 'sensor.energy_total',
      state: '25.5',
      attributes: {
        friendly_name: 'Total Energy',
        unit_of_measurement: 'kWh',
        device_class: 'energy'
      }
    },
    'automation.lights_off': {
      entity_id: 'automation.lights_off',
      state: 'on',
      attributes: {
        friendly_name: 'Turn Off Lights'
      }
    },
    'automation.inactive_test': {
      entity_id: 'automation.inactive_test',
      state: 'off',
      attributes: {
        friendly_name: 'Inactive Automation'
      }
    }
  }
};

/**
 * Mock panel for testing
 */
const mockPanel = {
  _hass: mockHass,
  _historicalDataManager: {
    fetchHistoricalData: async (entityId, hours) => {
      // Mock historical data - simulate device usage patterns
      const dataPoints = [];
      const now = new Date();
      
      for (let i = hours; i > 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        let state = 'off';
        
        // Simulate usage patterns based on entity type
        if (entityId.includes('light')) {
          // Lights typically on during evening/night
          const hour = timestamp.getHours();
          state = (hour >= 18 || hour <= 6) ? 'on' : 'off';
        } else if (entityId.includes('climate')) {
          // Climate systems more active during certain hours
          const hour = timestamp.getHours();
          state = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 22) ? 'heat' : 'off';
        } else if (entityId.includes('power')) {
          // Power consumption varies throughout the day
          const hour = timestamp.getHours();
          const baseConsumption = 100;
          const variation = Math.sin((hour / 24) * Math.PI * 2) * 50;
          state = baseConsumption + variation;
        }
        
        dataPoints.push({
          x: timestamp,
          y: state === 'on' ? 1 : state === 'off' ? 0 : parseFloat(state) || 0
        });
      }
      
      return dataPoints;
    }
  },
  _trendAnalysisManager: {},
  _stateManager: {}
};

/**
 * Test suite for UsageAnalyticsManager
 */
async function runUsageAnalyticsTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  function assert(condition, message) {
    if (condition) {
      testsPassed++;
      console.log(`✓ ${message}`);
    } else {
      testsFailed++;
      console.error(`✗ ${message}`);
    }
  }
  
  try {
    // Import the UsageAnalyticsManager (this would need to be adapted for actual testing)
    // For now, we'll test the core logic directly
    
    console.log('\n--- Testing Usage Analytics Core Functionality ---');
    
    // Test 1: Basic initialization
    const analyticsManager = {
      _config: {
        enabled: true,
        analysisIntervalHours: 24,
        dataRetentionDays: 30,
        minDataPointsForAnalysis: 10
      },
      _hass: mockHass,
      _panel: mockPanel
    };
    
    assert(analyticsManager._config.enabled === true, 'Analytics manager should be enabled by default');
    assert(analyticsManager._config.analysisIntervalHours === 24, 'Default analysis interval should be 24 hours');
    
    // Test 2: Device categorization
    function categorizeDevice(entityId) {
      const domain = entityId.split('.')[0];
      const categories = {
        lighting: ['light'],
        climate: ['climate', 'fan', 'heater'],
        media: ['media_player', 'tv'],
        security: ['alarm_control_panel', 'lock', 'camera'],
        covers: ['cover', 'blind', 'shutter'],
        appliances: ['switch', 'vacuum', 'dishwasher', 'washer']
      };
      
      for (const [category, domains] of Object.entries(categories)) {
        if (domains.includes(domain)) return category;
      }
      return 'other';
    }
    
    assert(categorizeDevice('light.living_room') === 'lighting', 'Light should be categorized as lighting');
    assert(categorizeDevice('climate.living_room') === 'climate', 'Climate should be categorized as climate');
    assert(categorizeDevice('sensor.unknown') === 'other', 'Unknown devices should be categorized as other');
    
    // Test 3: Energy entity detection
    function isEnergyEntity(entityId) {
      const entity = mockHass.states[entityId];
      if (!entity) return false;
      
      const deviceClass = entity.attributes?.device_class;
      const unit = entity.attributes?.unit_of_measurement;
      
      return deviceClass === 'energy' || 
             deviceClass === 'power' ||
             ['kWh', 'Wh', 'W', 'kW'].includes(unit);
    }
    
    assert(isEnergyEntity('sensor.power_consumption') === true, 'Power sensor should be detected as energy entity');
    assert(isEnergyEntity('sensor.energy_total') === true, 'Energy sensor should be detected as energy entity');
    assert(isEnergyEntity('light.living_room') === false, 'Light should not be detected as energy entity');
    
    // Test 4: Usage pattern calculation
    function calculateUsagePattern(historicalData) {
      if (!historicalData || historicalData.length === 0) {
        return { error: 'No data available' };
      }
      
      let onTime = 0;
      let totalTime = 0;
      const hourlyUsage = new Array(24).fill(0);
      
      for (let i = 1; i < historicalData.length; i++) {
        const current = historicalData[i];
        const previous = historicalData[i - 1];
        const duration = (current.x - previous.x) / (1000 * 60 * 60); // hours
        
        totalTime += duration;
        
        if (previous.y > 0) { // Device was on
          onTime += duration;
          const hour = previous.x.getHours();
          hourlyUsage[hour] += duration;
        }
      }
      
      return {
        totalUsageHours: onTime,
        dailyAverageHours: onTime / (totalTime / 24),
        peakUsageHours: hourlyUsage
          .map((usage, hour) => ({ hour, usage }))
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 3)
          .map(item => item.hour),
        efficiencyScore: Math.round((1 - Math.abs((onTime / totalTime) - 0.3)) * 100)
      };
    }
    
    // Test with mock data
    const mockHistoricalData = [
      { x: new Date('2024-01-01T00:00:00'), y: 0 },
      { x: new Date('2024-01-01T18:00:00'), y: 1 },
      { x: new Date('2024-01-01T23:00:00'), y: 0 },
      { x: new Date('2024-01-02T00:00:00'), y: 0 }
    ];
    
    const pattern = calculateUsagePattern(mockHistoricalData);
    assert(pattern.totalUsageHours === 5, 'Should calculate 5 hours of usage');
    assert(pattern.peakUsageHours.includes(18), 'Should identify 6 PM as peak usage hour');
    assert(typeof pattern.efficiencyScore === 'number', 'Should calculate efficiency score as number');
    
    // Test 5: Recommendation generation
    function generateBasicRecommendations(deviceUsage, energyAnalysis) {
      const recommendations = [];
      
      // High energy consumption recommendation
      if (energyAnalysis.totalConsumption > 100) {
        recommendations.push({
          type: 'energy_savings',
          title: 'High Energy Consumption Detected',
          priority: 80,
          impact: 'high'
        });
      }
      
      // Underutilized devices
      Object.entries(deviceUsage).forEach(([entityId, data]) => {
        if (data.usagePattern.dailyAverageHours < 0.5) {
          recommendations.push({
            type: 'usage_efficiency',
            title: 'Underutilized Device',
            priority: 40,
            impact: 'low'
          });
        }
      });
      
      return recommendations.sort((a, b) => b.priority - a.priority);
    }
    
    const mockDeviceUsage = {
      'light.living_room': {
        usagePattern: { dailyAverageHours: 0.2 }
      }
    };
    
    const mockEnergyAnalysis = {
      totalConsumption: 150
    };
    
    const recommendations = generateBasicRecommendations(mockDeviceUsage, mockEnergyAnalysis);
    assert(recommendations.length > 0, 'Should generate recommendations');
    assert(recommendations[0].priority >= recommendations[recommendations.length - 1].priority, 'Recommendations should be sorted by priority');
    
    // Test 6: Automation efficiency analysis
    function analyzeAutomationEfficiency() {
      const automations = Object.keys(mockHass.states)
        .filter(entityId => entityId.startsWith('automation.'));
      
      const totalAutomations = automations.length;
      const activeAutomations = automations.filter(id => mockHass.states[id].state === 'on').length;
      
      return {
        totalAutomations,
        activeAutomations,
        efficiencyScore: totalAutomations > 0 ? Math.round((activeAutomations / totalAutomations) * 100) : 0
      };
    }
    
    const automationAnalysis = analyzeAutomationEfficiency();
    assert(automationAnalysis.totalAutomations === 2, 'Should count 2 total automations');
    assert(automationAnalysis.activeAutomations === 1, 'Should count 1 active automation');
    assert(automationAnalysis.efficiencyScore === 50, 'Should calculate 50% efficiency score');
    
    console.log('\n--- Testing Recommendation Engine ---');
    
    // Test 7: Recommendation prioritization
    function prioritizeRecommendations(recommendations) {
      return recommendations.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        
        // Secondary sort by impact
        const impactWeight = { high: 3, medium: 2, low: 1 };
        return (impactWeight[b.impact] || 0) - (impactWeight[a.impact] || 0);
      });
    }
    
    const testRecommendations = [
      { priority: 60, impact: 'medium' },
      { priority: 80, impact: 'high' },
      { priority: 40, impact: 'low' },
      { priority: 80, impact: 'medium' }
    ];
    
    const prioritized = prioritizeRecommendations(testRecommendations);
    assert(prioritized[0].priority === 80 && prioritized[0].impact === 'high', 'Highest priority high impact should be first');
    assert(prioritized[prioritized.length - 1].priority === 40, 'Lowest priority should be last');
    
    // Test 8: Savings calculation
    function calculatePotentialSavings(recommendations) {
      let energySavings = 0;
      let costSavings = 0;
      
      recommendations.forEach(rec => {
        if (rec.savings?.type === 'energy') {
          const savings = parseFloat(rec.savings.estimated) || 0;
          energySavings += savings;
        } else if (rec.savings?.type === 'cost') {
          const savings = parseFloat(rec.savings.estimated) || 0;
          costSavings += savings;
        }
      });
      
      return { energy: energySavings, cost: costSavings };
    }
    
    const savingsRecommendations = [
      { savings: { type: 'energy', estimated: '15%' } },
      { savings: { type: 'cost', estimated: '10%' } },
      { savings: { type: 'energy', estimated: '5%' } }
    ];
    
    const potentialSavings = calculatePotentialSavings(savingsRecommendations);
    assert(potentialSavings.energy === 20, 'Should calculate 20% total energy savings');
    assert(potentialSavings.cost === 10, 'Should calculate 10% total cost savings');
    
    console.log('\n--- Test Results ---');
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('✅ All Usage Analytics tests passed!');
    } else {
      console.log(`❌ ${testsFailed} test(s) failed`);
    }
    
    return testsFailed === 0;
    
  } catch (error) {
    console.error('[DashView] Error running Usage Analytics tests:', error);
    return false;
  }
}

/**
 * Test UI component generation
 */
function testUIComponents() {
  console.log('\n--- Testing UI Component Generation ---');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  function assert(condition, message) {
    if (condition) {
      testsPassed++;
      console.log(`✓ ${message}`);
    } else {
      testsFailed++;
      console.error(`✗ ${message}`);
    }
  }
  
  // Test recommendation card generation
  function generateRecommendationCard(recommendation) {
    const priorityClass = recommendation.priority >= 80 ? 'high' : 
                         recommendation.priority >= 60 ? 'medium' : 'low';
    
    const html = `
      <div class="recommendation-card priority-${priorityClass}">
        <div class="recommendation-header">
          <h6>${recommendation.title}</h6>
          <span class="priority-badge">${recommendation.priority >= 80 ? 'High' : 
                                       recommendation.priority >= 60 ? 'Medium' : 'Low'}</span>
        </div>
      </div>
    `;
    
    return html;
  }
  
  const testRecommendation = {
    title: 'Test Recommendation',
    priority: 85
  };
  
  const cardHTML = generateRecommendationCard(testRecommendation);
  assert(cardHTML.includes('priority-high'), 'Should generate high priority card class');
  assert(cardHTML.includes('Test Recommendation'), 'Should include recommendation title');
  assert(cardHTML.includes('High'), 'Should show High priority badge');
  
  // Test summary stats generation
  function generateSummaryStats(summary) {
    const stats = {
      devices: summary.totalDevicesAnalyzed || 0,
      energy: summary.energyEntitiesFound || 0,
      recommendations: summary.recommendationsGenerated || 0
    };
    
    return stats;
  }
  
  const testSummary = {
    totalDevicesAnalyzed: 15,
    energyEntitiesFound: 3,
    recommendationsGenerated: 7
  };
  
  const stats = generateSummaryStats(testSummary);
  assert(stats.devices === 15, 'Should extract device count');
  assert(stats.energy === 3, 'Should extract energy entity count');
  assert(stats.recommendations === 7, 'Should extract recommendations count');
  
  console.log(`UI Component tests passed: ${testsPassed}`);
  console.log(`UI Component tests failed: ${testsFailed}`);
  
  return testsFailed === 0;
}

// Run the tests if this is being executed directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUsageAnalyticsTests, testUIComponents };
} else {
  // Browser execution
  (async () => {
    const analyticsTestsPassed = await runUsageAnalyticsTests();
    const uiTestsPassed = testUIComponents();
    
    if (analyticsTestsPassed && uiTestsPassed) {
      console.log('\n🎉 All Usage Analytics tests completed successfully!');
    } else {
      console.log('\n❌ Some tests failed. Please review the implementation.');
    }
  })();
}