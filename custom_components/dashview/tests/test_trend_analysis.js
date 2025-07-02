// Test file for TrendAnalysisManager functionality
class TrendAnalysisTests {
  constructor() {
    this.testResults = [];
  }

  log(message) {
    console.log(`[DashView] ${message}`);
  }

  assertEqual(actual, expected, message) {
    if (actual === expected) {
      this.log(`✓ ${message}`);
    } else {
      throw new Error(`❌ ${message}: Expected ${expected}, got ${actual}`);
    }
  }

  assert(condition, message) {
    if (condition) {
      this.log(`✓ ${message}`);
    } else {
      throw new Error(`❌ ${message}`);
    }
  }

  // Test trend calculation logic
  async testTrendCalculation() {
    const testName = 'Trend Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const { TrendAnalysisManager } = await import('/local/dashview/lib/ui/TrendAnalysisManager.js');
      
      // Mock panel and historical data manager
      const mockPanel = {
        _hass: null,
        _historicalDataManager: {
          supportsHistoricalData: () => true,
          fetchHistoricalData: (entityId, hours) => {
            // Generate mock data with an upward trend
            const data = [];
            const now = new Date();
            for (let i = hours; i >= 0; i--) {
              data.push({
                x: new Date(now.getTime() - i * 60 * 60 * 1000),
                y: 20 + i * 0.5 + Math.random() * 2 // Gradual increase with some noise
              });
            }
            return Promise.resolve(data);
          }
        }
      };

      const trendManager = new TrendAnalysisManager(mockPanel);
      
      // Test linear regression calculation
      const mockData = [
        { x: new Date('2024-01-01T10:00:00'), y: 20 },
        { x: new Date('2024-01-01T11:00:00'), y: 21 },
        { x: new Date('2024-01-01T12:00:00'), y: 22 },
        { x: new Date('2024-01-01T13:00:00'), y: 23 },
        { x: new Date('2024-01-01T14:00:00'), y: 24 }
      ];

      const regression = trendManager._calculateLinearRegression(mockData);
      this.assert(regression.slope > 0, 'Linear regression should detect positive slope');
      this.assert(regression.rSquared > 0.8, 'Linear regression should have high correlation for linear data');

      // Test trend calculation
      const trend = trendManager._calculateTrend(mockData, 'short');
      this.assertEqual(trend.direction, 'up', 'Should detect upward trend');
      this.assert(trend.changePercent > 0, 'Should have positive percentage change');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test pattern recognition
  async testPatternRecognition() {
    const testName = 'Pattern Recognition';
    this.log(`Running test: ${testName}`);

    try {
      const { TrendAnalysisManager } = await import('/local/dashview/lib/ui/TrendAnalysisManager.js');
      
      const mockPanel = {
        _hass: null,
        _historicalDataManager: {
          supportsHistoricalData: () => true,
          fetchHistoricalData: () => Promise.resolve([])
        }
      };

      const trendManager = new TrendAnalysisManager(mockPanel);
      
      // Test statistical calculations
      const mockData = [
        { x: new Date(), y: 20 },
        { x: new Date(), y: 22 },
        { x: new Date(), y: 24 },
        { x: new Date(), y: 26 },
        { x: new Date(), y: 28 }
      ];

      const stats = trendManager._calculateStatistics(mockData);
      this.assertEqual(stats.mean, 24, 'Should calculate correct mean');
      this.assertEqual(stats.median, 24, 'Should calculate correct median');
      this.assert(stats.stdDev > 0, 'Should calculate non-zero standard deviation');

      // Test pattern analysis with unusual data
      const recentData = Array(10).fill(0).map((_, i) => ({ 
        x: new Date(), 
        y: 30 + Math.random() * 2 // High values
      }));
      
      const baselineData = Array(50).fill(0).map((_, i) => ({ 
        x: new Date(), 
        y: 20 + Math.random() * 2 // Normal values
      }));

      const pattern = trendManager._analyzePattern(recentData, baselineData);
      this.assertEqual(pattern.type, 'unusual_level', 'Should detect unusual level pattern');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test trend indicator generation
  async testTrendIndicator() {
    const testName = 'Trend Indicator Generation';
    this.log(`Running test: ${testName}`);

    try {
      const { TrendAnalysisManager } = await import('/local/dashview/lib/ui/TrendAnalysisManager.js');
      
      const mockPanel = {
        _hass: null,
        _historicalDataManager: { supportsHistoricalData: () => true }
      };

      const trendManager = new TrendAnalysisManager(mockPanel);
      
      // Create mock trend data
      const mockTrendData = {
        shortTerm: {
          direction: 'up',
          changePercent: 15.5,
          confidence: 'high'
        }
      };

      const indicator = trendManager.getTrendIndicator(mockTrendData);
      this.assertEqual(indicator.icon, 'mdi:trending-up', 'Should return correct trending up icon');
      this.assert(indicator.text.includes('↗'), 'Should include up arrow in text');
      this.assert(indicator.text.includes('15.5'), 'Should include percentage in text');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting TrendAnalysisManager tests...');
    
    try {
      await this.testTrendCalculation();
      await this.testPatternRecognition();
      await this.testTrendIndicator();
      
      this.log('All TrendAnalysisManager tests passed!');
      return true;
    } catch (error) {
      console.error('[DashView] TrendAnalysisManager test failed:', error);
      return false;
    }
  }
}

// Export for use in test runner
export { TrendAnalysisTests };

// Run tests if this file is loaded directly
if (typeof window !== 'undefined') {
  window.DashViewTrendAnalysisTests = TrendAnalysisTests;
}