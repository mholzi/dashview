// custom_components/dashview/www/lib/ui/TrendAnalysisManager.js

/**
 * TrendAnalysisManager
 * 
 * Provides trend analysis and pattern recognition for sensor data.
 * Calculates short-term and long-term trends, detects unusual patterns,
 * and provides visual indicators for entity cards.
 */
export class TrendAnalysisManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._historicalDataManager = panel._historicalDataManager;
    this._trendCache = new Map();
    this._patternCache = new Map();
    
    // Configuration defaults
    this._config = {
      enabled: true,
      shortTermHours: 2,     // Hours for short-term trend calculation
      longTermHours: 24,     // Hours for long-term trend calculation
      baselineHours: 168,    // Hours for baseline calculation (7 days)
      sensitivity: 'medium', // low, medium, high
      showPatterns: true,    // Show pattern alerts
      showIndicators: true,  // Show trend indicators
      minDataPoints: 5,      // Minimum data points required for trend calculation
      cacheTimeout: 300000   // 5 minutes cache timeout
    };
    
    // Load configuration from backend
    this._loadConfiguration();
    
    // Sensitivity thresholds
    this._thresholds = {
      low: { change: 10, deviation: 50 },
      medium: { change: 5, deviation: 30 },
      high: { change: 2, deviation: 15 }
    };
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Load configuration from backend
   */
  async _loadConfiguration() {
    try {
      // Add authentication header if hass is available
      const headers = {};
      if (this._hass && this._hass.auth && this._hass.auth.accessToken) {
        headers['Authorization'] = `Bearer ${this._hass.auth.accessToken}`;
      }
      
      const response = await fetch('/api/dashview/config?type=trend_analysis', {
        headers: headers
      });
      
      if (response.ok) {
        const config = await response.json();
        this._config = { ...this._config, ...config };
        console.log('[TrendAnalysisManager] Configuration loaded:', this._config);
      } else if (response.status === 401) {
        // Silently ignore authentication errors during initial load
        console.debug('[TrendAnalysisManager] Authentication pending, using default configuration');
      } else {
        console.warn('[TrendAnalysisManager] Configuration endpoint returned:', response.status);
      }
    } catch (error) {
      console.debug('[TrendAnalysisManager] Using default configuration');
    }
  }

  /**
   * Get trend data for an entity
   * @param {string} entityId - The entity ID
   * @returns {Promise<Object>} Trend data object
   */
  async getTrendData(entityId) {
    // Check if trends are disabled
    if (!this._config.enabled) {
      return null;
    }

    if (!this._historicalDataManager.supportsHistoricalData(entityId)) {
      return null;
    }

    // Check cache first
    const cacheKey = `trend_${entityId}`;
    const cachedData = this._trendCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this._config.cacheTimeout) {
      return cachedData.data;
    }

    try {
      // Fetch historical data for different time periods
      const [shortTermData, longTermData, baselineData] = await Promise.all([
        this._historicalDataManager.fetchHistoricalData(entityId, this._config.shortTermHours),
        this._historicalDataManager.fetchHistoricalData(entityId, this._config.longTermHours),
        this._historicalDataManager.fetchHistoricalData(entityId, this._config.baselineHours)
      ]);

      // Calculate trends
      const trendData = {
        entityId,
        shortTerm: this._calculateTrend(shortTermData, 'short'),
        longTerm: this._calculateTrend(longTermData, 'long'),
        pattern: this._config.showPatterns ? this._analyzePattern(longTermData, baselineData) : null,
        lastUpdated: Date.now()
      };

      // Cache the result
      this._trendCache.set(cacheKey, {
        data: trendData,
        timestamp: Date.now()
      });

      return trendData;
    } catch (error) {
      console.error(`[TrendAnalysisManager] Error getting trend data for ${entityId}:`, error);
      return null;
    }
  }

  /**
   * Calculate trend from historical data
   * @param {Array} data - Historical data points
   * @param {string} period - Time period ('short' or 'long')
   * @returns {Object} Trend calculation result
   */
  _calculateTrend(data, period) {
    if (!data || data.length < this._config.minDataPoints) {
      return {
        direction: 'stable',
        change: 0,
        changePercent: 0,
        confidence: 'low'
      };
    }

    // Sort data by time
    const sortedData = data.sort((a, b) => a.x - b.x);
    
    // Calculate linear regression for trend direction
    const regression = this._calculateLinearRegression(sortedData);
    
    // Calculate percentage change from start to end
    const startValue = sortedData[0].y;
    const endValue = sortedData[sortedData.length - 1].y;
    const change = endValue - startValue;
    const changePercent = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;
    
    // Determine trend direction and confidence
    const threshold = this._thresholds[this._config.sensitivity];
    let direction = 'stable';
    let confidence = 'low';
    
    if (Math.abs(changePercent) >= threshold.change) {
      direction = changePercent > 0 ? 'up' : 'down';
      confidence = Math.abs(regression.rSquared) > 0.7 ? 'high' : 
                   Math.abs(regression.rSquared) > 0.4 ? 'medium' : 'low';
    }

    return {
      direction,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      confidence,
      slope: regression.slope,
      rSquared: regression.rSquared,
      period
    };
  }

  /**
   * Calculate linear regression for trend analysis
   * @param {Array} data - Data points [{x: Date, y: number}]
   * @returns {Object} Regression results
   */
  _calculateLinearRegression(data) {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

    // Convert dates to numeric values (milliseconds)
    const points = data.map(point => ({
      x: point.x.getTime(),
      y: point.y
    }));

    // Calculate means
    const xMean = points.reduce((sum, p) => sum + p.x, 0) / n;
    const yMean = points.reduce((sum, p) => sum + p.y, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (const point of points) {
      const xDiff = point.x - xMean;
      const yDiff = point.y - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (const point of points) {
      const predicted = slope * point.x + intercept;
      totalSumSquares += Math.pow(point.y - yMean, 2);
      residualSumSquares += Math.pow(point.y - predicted, 2);
    }

    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, rSquared };
  }

  /**
   * Analyze patterns and detect anomalies
   * @param {Array} recentData - Recent data points 
   * @param {Array} baselineData - Baseline data for comparison
   * @returns {Object} Pattern analysis result
   */
  _analyzePattern(recentData, baselineData) {
    if (!recentData || !baselineData || 
        recentData.length < this._config.minDataPoints ||
        baselineData.length < this._config.minDataPoints) {
      return {
        type: 'normal',
        description: null,
        severity: 'low'
      };
    }

    // Calculate statistics for recent vs baseline periods
    const recentStats = this._calculateStatistics(recentData);
    const baselineStats = this._calculateStatistics(baselineData);
    
    // Compare averages
    const avgDifference = recentStats.mean - baselineStats.mean;
    const avgDifferencePercent = baselineStats.mean !== 0 ? 
      (avgDifference / Math.abs(baselineStats.mean)) * 100 : 0;
    
    // Compare variability
    const variabilityChange = recentStats.stdDev - baselineStats.stdDev;
    const variabilityChangePercent = baselineStats.stdDev !== 0 ?
      (variabilityChange / baselineStats.stdDev) * 100 : 0;

    // Detect pattern types
    const threshold = this._thresholds[this._config.sensitivity];
    
    if (Math.abs(avgDifferencePercent) >= threshold.deviation) {
      const direction = avgDifferencePercent > 0 ? 'higher' : 'lower';
      const severity = Math.abs(avgDifferencePercent) >= threshold.deviation * 2 ? 'high' : 'medium';
      
      return {
        type: 'unusual_level',
        description: `${Math.abs(avgDifferencePercent).toFixed(0)}% ${direction} than usual`,
        severity,
        value: avgDifferencePercent
      };
    }
    
    if (Math.abs(variabilityChangePercent) >= threshold.deviation) {
      const pattern = variabilityChangePercent > 0 ? 'more_volatile' : 'more_stable';
      const severity = Math.abs(variabilityChangePercent) >= threshold.deviation * 2 ? 'high' : 'medium';
      
      return {
        type: pattern,
        description: pattern === 'more_volatile' ? 
          'More variable than usual' : 'More stable than usual',
        severity,
        value: variabilityChangePercent
      };
    }

    return {
      type: 'normal',
      description: null,
      severity: 'low'
    };
  }

  /**
   * Calculate statistical measures for a dataset
   * @param {Array} data - Data points
   * @returns {Object} Statistical measures
   */
  _calculateStatistics(data) {
    if (!data || data.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }

    const values = data.map(point => point.y).sort((a, b) => a - b);
    const n = values.length;
    
    // Mean
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    
    // Median
    const median = n % 2 === 0 ? 
      (values[n/2 - 1] + values[n/2]) / 2 : 
      values[Math.floor(n/2)];
    
    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      median,
      stdDev,
      min: values[0],
      max: values[n-1],
      count: n
    };
  }

  /**
   * Get trend indicator for UI display
   * @param {Object} trendData - Trend data from getTrendData()
   * @returns {Object} UI indicator data
   */
  getTrendIndicator(trendData) {
    if (!trendData || !this._config.enabled || !this._config.showIndicators) {
      return null;
    }

    const trend = trendData.shortTerm;
    let icon = 'mdi:minus';
    let color = 'var(--secondary-text-color)';
    let text = '';

    switch (trend.direction) {
      case 'up':
        icon = 'mdi:trending-up';
        color = trend.confidence === 'high' ? '#4CAF50' : '#8BC34A';
        text = `↗ +${Math.abs(trend.changePercent).toFixed(1)}%`;
        break;
      case 'down':
        icon = 'mdi:trending-down';
        color = trend.confidence === 'high' ? '#F44336' : '#FF9800';
        text = `↘ -${Math.abs(trend.changePercent).toFixed(1)}%`;
        break;
      case 'stable':
      default:
        icon = 'mdi:trending-neutral';
        color = 'var(--secondary-text-color)';
        text = '→ stable';
        break;
    }

    return {
      icon,
      color,
      text,
      confidence: trend.confidence,
      change: trend.change,
      changePercent: trend.changePercent
    };
  }

  /**
   * Get pattern alert for UI display
   * @param {Object} trendData - Trend data from getTrendData()
   * @returns {Object|null} Pattern alert data
   */
  getPatternAlert(trendData) {
    if (!trendData || !this._config.enabled || !this._config.showPatterns || 
        !trendData.pattern || trendData.pattern.type === 'normal') {
      return null;
    }

    const pattern = trendData.pattern;
    let icon = 'mdi:information';
    let color = '#2196F3';

    switch (pattern.severity) {
      case 'high':
        icon = 'mdi:alert';
        color = '#F44336';
        break;
      case 'medium':
        icon = 'mdi:alert-outline';
        color = '#FF9800';
        break;
      case 'low':
      default:
        icon = 'mdi:information-outline';
        color = '#2196F3';
        break;
    }

    return {
      icon,
      color,
      description: pattern.description,
      severity: pattern.severity,
      type: pattern.type
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this._trendCache.clear();
    this._patternCache.clear();
    console.log('[TrendAnalysisManager] Caches cleared');
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this._config = { ...this._config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
    console.log('[TrendAnalysisManager] Configuration updated:', this._config);
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[TrendAnalysisManager] Disposing and cleaning up resources');
    this.clearCache();
    this._panel = null;
    this._hass = null;
    this._historicalDataManager = null;
  }
}