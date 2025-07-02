// custom_components/dashview/www/lib/ui/UsageAnalyticsManager.js

/**
 * UsageAnalyticsManager
 * 
 * Provides comprehensive usage analytics and optimization recommendations.
 * Analyzes device usage patterns, energy consumption, and automation efficiency
 * to provide actionable optimization suggestions.
 */
export class UsageAnalyticsManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._historicalDataManager = panel._historicalDataManager;
    this._trendAnalysisManager = panel._trendAnalysisManager;
    this._stateManager = panel._stateManager;
    
    // Usage analytics cache
    this._usageDataCache = new Map();
    this._analysisCache = new Map();
    this._recommendationsCache = new Map();
    
    // Configuration
    this._config = {
      enabled: true,
      analysisIntervalHours: 24,    // How often to run full analysis
      dataRetentionDays: 30,        // How long to keep usage data
      minDataPointsForAnalysis: 10, // Minimum data points for meaningful analysis
      energyEntityPatterns: [       // Patterns to identify energy sensors
        'sensor.*power',
        'sensor.*energy',
        'sensor.*consumption'
      ],
      deviceCategories: {
        lighting: ['light'],
        climate: ['climate', 'fan', 'heater'],
        media: ['media_player', 'tv'],
        security: ['alarm_control_panel', 'lock', 'camera'],
        covers: ['cover', 'blind', 'shutter'],
        appliances: ['switch', 'vacuum', 'dishwasher', 'washer']
      }
    };
    
    // Usage patterns
    this._usagePatterns = {
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map()
    };
    
    // Recommendation types
    this._recommendationTypes = {
      ENERGY_SAVINGS: 'energy_savings',
      AUTOMATION_OPTIMIZATION: 'automation_optimization', 
      DEVICE_LIFECYCLE: 'device_lifecycle',
      USAGE_EFFICIENCY: 'usage_efficiency',
      MAINTENANCE: 'maintenance'
    };
    
    console.log('[DashView] UsageAnalyticsManager initialized');
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Initialize usage analytics for the dashboard
   */
  async initialize() {
    try {
      console.log('[DashView] Initializing usage analytics...');
      
      // Load existing usage data
      await this._loadUsageData();
      
      // Start periodic analysis
      this._startPeriodicAnalysis();
      
      console.log('[DashView] Usage analytics initialized successfully');
    } catch (error) {
      console.error('[DashView] Error initializing usage analytics:', error);
    }
  }

  /**
   * Analyze usage patterns for all devices
   * @returns {Object} Comprehensive usage analysis
   */
  async analyzeUsagePatterns() {
    try {
      console.log('[DashView] Starting usage pattern analysis...');
      
      const analysis = {
        timestamp: Date.now(),
        deviceUsage: {},
        energyAnalysis: {},
        automationEfficiency: {},
        recommendations: [],
        summary: {}
      };
      
      // Analyze device usage patterns
      analysis.deviceUsage = await this._analyzeDeviceUsage();
      
      // Analyze energy consumption patterns
      analysis.energyAnalysis = await this._analyzeEnergyConsumption();
      
      // Analyze automation efficiency
      analysis.automationEfficiency = await this._analyzeAutomationEfficiency();
      
      // Generate optimization recommendations
      analysis.recommendations = await this._generateRecommendations(analysis);
      
      // Create usage summary
      analysis.summary = this._createUsageSummary(analysis);
      
      // Cache the analysis
      this._analysisCache.set('latest', analysis);
      
      console.log('[DashView] Usage analysis completed:', analysis.summary);
      return analysis;
      
    } catch (error) {
      console.error('[DashView] Error analyzing usage patterns:', error);
      return { error: error.message, timestamp: Date.now() };
    }
  }

  /**
   * Analyze device usage patterns
   * @returns {Object} Device usage analysis
   */
  async _analyzeDeviceUsage() {
    const deviceAnalysis = {};
    const entities = this._hass ? Object.keys(this._hass.states) : [];
    
    for (const entityId of entities) {
      const entity = this._hass.states[entityId];
      const domain = entityId.split('.')[0];
      
      // Skip if not a controllable device
      if (!this._isControllableDevice(domain)) continue;
      
      try {
        // Get historical data for the device
        const historicalData = await this._getDeviceHistoricalData(entityId, 168); // 7 days
        
        if (historicalData && historicalData.length >= this._config.minDataPointsForAnalysis) {
          deviceAnalysis[entityId] = {
            domain,
            friendlyName: entity.attributes?.friendly_name || entityId,
            usagePattern: this._calculateUsagePattern(historicalData),
            efficiency: this._calculateDeviceEfficiency(historicalData, domain),
            optimization: this._identifyOptimizationOpportunities(historicalData, domain)
          };
        }
      } catch (error) {
        console.warn(`[DashView] Could not analyze usage for ${entityId}:`, error.message);
      }
    }
    
    return deviceAnalysis;
  }

  /**
   * Calculate usage pattern for a device
   * @param {Array} historicalData - Historical state data
   * @returns {Object} Usage pattern analysis
   */
  _calculateUsagePattern(historicalData) {
    const pattern = {
      totalUsageHours: 0,
      dailyAverageHours: 0,
      peakUsageHours: [],
      usageDistribution: {
        morning: 0,    // 6-12
        afternoon: 0,  // 12-18
        evening: 0,    // 18-24
        night: 0       // 0-6
      },
      weekdayPattern: new Array(7).fill(0), // Mon=0, Sun=6
      efficiencyScore: 0
    };
    
    let onTime = 0;
    let lastState = null;
    let lastTimestamp = null;
    
    const hourlyUsage = new Array(24).fill(0);
    const dailyUsage = new Array(7).fill(0);
    
    for (const dataPoint of historicalData) {
      const timestamp = new Date(dataPoint.x);
      const state = this._normalizeDeviceState(dataPoint.y);
      
      if (lastState !== null && lastTimestamp !== null) {
        const duration = (timestamp - lastTimestamp) / (1000 * 60 * 60); // hours
        
        if (lastState === 'on') {
          onTime += duration;
          
          // Track hourly and daily patterns
          const hour = lastTimestamp.getHours();
          const dayOfWeek = lastTimestamp.getDay();
          
          hourlyUsage[hour] += duration;
          dailyUsage[dayOfWeek] += duration;
          
          // Categorize by time period
          if (hour >= 6 && hour < 12) pattern.usageDistribution.morning += duration;
          else if (hour >= 12 && hour < 18) pattern.usageDistribution.afternoon += duration;
          else if (hour >= 18 && hour < 24) pattern.usageDistribution.evening += duration;
          else pattern.usageDistribution.night += duration;
        }
      }
      
      lastState = state;
      lastTimestamp = timestamp;
    }
    
    // Calculate metrics
    const totalHours = (historicalData[historicalData.length - 1].x - historicalData[0].x) / (1000 * 60 * 60);
    const days = totalHours / 24;
    
    pattern.totalUsageHours = onTime;
    pattern.dailyAverageHours = onTime / days;
    pattern.weekdayPattern = dailyUsage.map(usage => usage / (days / 7));
    
    // Find peak usage hours
    pattern.peakUsageHours = hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
      .map(item => item.hour);
    
    // Calculate efficiency score (0-100)
    const usageRatio = onTime / totalHours;
    pattern.efficiencyScore = Math.round((1 - Math.abs(usageRatio - 0.3)) * 100); // Optimal around 30% usage
    
    return pattern;
  }

  /**
   * Analyze energy consumption patterns
   * @returns {Object} Energy analysis
   */
  async _analyzeEnergyConsumption() {
    const energyAnalysis = {
      totalConsumption: 0,
      averageDailyConsumption: 0,
      peakConsumptionHours: [],
      consumptionByDevice: {},
      savingsOpportunities: [],
      efficiencyTrend: 'stable'
    };
    
    // Find energy monitoring entities
    const energyEntities = this._findEnergyEntities();
    
    for (const entityId of energyEntities) {
      try {
        const historicalData = await this._getDeviceHistoricalData(entityId, 168); // 7 days
        
        if (historicalData && historicalData.length > 0) {
          const consumption = this._analyzeEnergyEntity(entityId, historicalData);
          energyAnalysis.consumptionByDevice[entityId] = consumption;
          energyAnalysis.totalConsumption += consumption.total || 0;
        }
      } catch (error) {
        console.warn(`[DashView] Could not analyze energy for ${entityId}:`, error.message);
      }
    }
    
    // Calculate daily average
    energyAnalysis.averageDailyConsumption = energyAnalysis.totalConsumption / 7;
    
    // Identify savings opportunities
    energyAnalysis.savingsOpportunities = this._identifyEnergySavingsOpportunities(energyAnalysis);
    
    return energyAnalysis;
  }

  /**
   * Analyze automation efficiency
   * @returns {Object} Automation efficiency analysis
   */
  async _analyzeAutomationEfficiency() {
    const automationAnalysis = {
      totalAutomations: 0,
      activeAutomations: 0,
      efficiencyScore: 0,
      optimizationOpportunities: [],
      unusedDevices: [],
      overActiveDevices: []
    };
    
    // Analyze automation entities
    const automations = Object.keys(this._hass?.states || {})
      .filter(entityId => entityId.startsWith('automation.'));
    
    automationAnalysis.totalAutomations = automations.length;
    
    for (const automationId of automations) {
      const automation = this._hass.states[automationId];
      if (automation.state === 'on') {
        automationAnalysis.activeAutomations++;
      }
    }
    
    // Calculate efficiency score
    if (automationAnalysis.totalAutomations > 0) {
      automationAnalysis.efficiencyScore = Math.round(
        (automationAnalysis.activeAutomations / automationAnalysis.totalAutomations) * 100
      );
    }
    
    return automationAnalysis;
  }

  /**
   * Generate optimization recommendations
   * @param {Object} analysis - Complete usage analysis
   * @returns {Array} Array of recommendations
   */
  async _generateRecommendations(analysis) {
    const recommendations = [];
    
    // Energy savings recommendations
    recommendations.push(...this._generateEnergySavingsRecommendations(analysis.energyAnalysis));
    
    // Device usage optimization recommendations
    recommendations.push(...this._generateUsageOptimizationRecommendations(analysis.deviceUsage));
    
    // Automation efficiency recommendations
    recommendations.push(...this._generateAutomationRecommendations(analysis.automationEfficiency));
    
    // Sort by priority (highest impact first)
    return recommendations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Generate energy savings recommendations
   * @param {Object} energyAnalysis - Energy consumption analysis
   * @returns {Array} Energy saving recommendations
   */
  _generateEnergySavingsRecommendations(energyAnalysis) {
    const recommendations = [];
    
    // High consumption devices
    const highConsumptionDevices = Object.entries(energyAnalysis.consumptionByDevice)
      .filter(([_, data]) => data.total > energyAnalysis.averageDailyConsumption * 0.2)
      .map(([entityId, data]) => ({ entityId, ...data }));
    
    if (highConsumptionDevices.length > 0) {
      recommendations.push({
        id: 'high_energy_devices',
        type: this._recommendationTypes.ENERGY_SAVINGS,
        title: 'High Energy Consumption Devices',
        description: `${highConsumptionDevices.length} devices are consuming significant energy. Consider optimizing their usage schedules.`,
        impact: 'high',
        priority: 90,
        savings: {
          type: 'energy',
          estimated: '15-25%',
          period: 'monthly'
        },
        actions: highConsumptionDevices.map(device => ({
          type: 'schedule_optimization',
          deviceId: device.entityId,
          suggestion: 'Create automated schedules to reduce peak hour usage'
        }))
      });
    }
    
    // Off-peak usage opportunities
    if (energyAnalysis.peakConsumptionHours?.length > 0) {
      recommendations.push({
        id: 'off_peak_usage',
        type: this._recommendationTypes.ENERGY_SAVINGS,
        title: 'Off-Peak Usage Optimization',
        description: 'Shift energy-intensive activities to off-peak hours for cost savings.',
        impact: 'medium',
        priority: 70,
        savings: {
          type: 'cost',
          estimated: '10-20%',
          period: 'monthly'
        },
        actions: [{
          type: 'schedule_shift',
          suggestion: 'Schedule appliances to run during off-peak hours (typically 11 PM - 6 AM)'
        }]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate device usage optimization recommendations
   * @param {Object} deviceUsage - Device usage analysis
   * @returns {Array} Usage optimization recommendations
   */
  _generateUsageOptimizationRecommendations(deviceUsage) {
    const recommendations = [];
    
    // Underutilized devices
    const underutilizedDevices = Object.entries(deviceUsage)
      .filter(([_, data]) => data.usagePattern.dailyAverageHours < 1)
      .map(([entityId, data]) => ({ entityId, ...data }));
    
    if (underutilizedDevices.length > 0) {
      recommendations.push({
        id: 'underutilized_devices',
        type: this._recommendationTypes.USAGE_EFFICIENCY,
        title: 'Underutilized Devices',
        description: `${underutilizedDevices.length} devices are rarely used. Consider removing or repurposing them.`,
        impact: 'medium',
        priority: 60,
        actions: underutilizedDevices.map(device => ({
          type: 'device_review',
          deviceId: device.entityId,
          suggestion: 'Review if this device is still needed or properly configured'
        }))
      });
    }
    
    // Overactive devices
    const overactiveDevices = Object.entries(deviceUsage)
      .filter(([_, data]) => data.usagePattern.dailyAverageHours > 12)
      .map(([entityId, data]) => ({ entityId, ...data }));
    
    if (overactiveDevices.length > 0) {
      recommendations.push({
        id: 'overactive_devices',
        type: this._recommendationTypes.USAGE_EFFICIENCY,
        title: 'Overactive Devices',
        description: `${overactiveDevices.length} devices are active for extended periods. Consider automation to optimize usage.`,
        impact: 'high',
        priority: 80,
        actions: overactiveDevices.map(device => ({
          type: 'automation_creation',
          deviceId: device.entityId,
          suggestion: 'Create automations to turn off device when not needed'
        }))
      });
    }
    
    return recommendations;
  }

  /**
   * Generate automation efficiency recommendations
   * @param {Object} automationAnalysis - Automation analysis
   * @returns {Array} Automation recommendations
   */
  _generateAutomationRecommendations(automationAnalysis) {
    const recommendations = [];
    
    if (automationAnalysis.efficiencyScore < 70) {
      recommendations.push({
        id: 'automation_efficiency',
        type: this._recommendationTypes.AUTOMATION_OPTIMIZATION,
        title: 'Automation Efficiency',
        description: `Only ${automationAnalysis.efficiencyScore}% of your automations are active. Review and optimize inactive automations.`,
        impact: 'medium',
        priority: 65,
        actions: [{
          type: 'automation_review',
          suggestion: 'Review inactive automations and either fix or remove them'
        }]
      });
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  _isControllableDevice(domain) {
    const controllableDomains = ['light', 'switch', 'media_player', 'climate', 'fan', 'cover', 'lock'];
    return controllableDomains.includes(domain);
  }

  _normalizeDeviceState(state) {
    if (typeof state === 'string') {
      return ['on', 'open', 'playing', 'heating', 'cooling', 'auto'].includes(state.toLowerCase()) ? 'on' : 'off';
    }
    return state > 0 ? 'on' : 'off';
  }

  _findEnergyEntities() {
    const entities = Object.keys(this._hass?.states || {});
    return entities.filter(entityId => {
      const entity = this._hass.states[entityId];
      const deviceClass = entity.attributes?.device_class;
      const unitOfMeasurement = entity.attributes?.unit_of_measurement;
      
      return (
        deviceClass === 'energy' ||
        deviceClass === 'power' ||
        ['kWh', 'Wh', 'W', 'kW'].includes(unitOfMeasurement) ||
        this._config.energyEntityPatterns.some(pattern => 
          new RegExp(pattern, 'i').test(entityId)
        )
      );
    });
  }

  async _getDeviceHistoricalData(entityId, hours = 24) {
    if (this._historicalDataManager) {
      return await this._historicalDataManager.fetchHistoricalData(entityId, hours);
    }
    return null;
  }

  _analyzeEnergyEntity(entityId, historicalData) {
    const entity = this._hass.states[entityId];
    const unit = entity.attributes?.unit_of_measurement || '';
    
    // Calculate total consumption
    let total = 0;
    let peak = 0;
    let average = 0;
    
    const values = historicalData.map(point => point.y).filter(val => !isNaN(val));
    
    if (values.length > 0) {
      total = Math.max(...values) - Math.min(...values); // For cumulative energy sensors
      peak = Math.max(...values);
      average = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return {
      entityId,
      friendlyName: entity.attributes?.friendly_name || entityId,
      unit,
      total,
      peak,
      average,
      trend: this._calculateTrend(values)
    };
  }

  _calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  _identifyEnergySavingsOpportunities(energyAnalysis) {
    const opportunities = [];
    
    // High consumption devices
    Object.entries(energyAnalysis.consumptionByDevice).forEach(([entityId, data]) => {
      if (data.total > energyAnalysis.averageDailyConsumption * 0.15) {
        opportunities.push({
          type: 'high_consumption',
          entityId,
          potential: 'high',
          suggestion: 'Schedule optimization or replacement with more efficient model'
        });
      }
    });
    
    return opportunities;
  }

  _calculateDeviceEfficiency(historicalData, domain) {
    // Simple efficiency calculation based on usage patterns
    // This could be enhanced with more sophisticated algorithms
    
    const pattern = this._calculateUsagePattern(historicalData);
    let efficiency = 50; // Base efficiency
    
    // Adjust based on domain-specific factors
    switch (domain) {
      case 'light':
        // Lights should ideally be used during dark hours
        efficiency += (pattern.usageDistribution.evening + pattern.usageDistribution.night) * 2;
        break;
      case 'climate':
        // Climate devices should have moderate usage
        efficiency = Math.max(0, 100 - Math.abs(pattern.dailyAverageHours - 8) * 5);
        break;
      default:
        efficiency = pattern.efficiencyScore;
    }
    
    return Math.min(100, Math.max(0, Math.round(efficiency)));
  }

  _identifyOptimizationOpportunities(historicalData, domain) {
    const opportunities = [];
    const pattern = this._calculateUsagePattern(historicalData);
    
    if (pattern.dailyAverageHours > 16) {
      opportunities.push({
        type: 'overuse',
        suggestion: 'Consider automation to reduce usage time',
        priority: 'high'
      });
    }
    
    if (pattern.dailyAverageHours < 0.5) {
      opportunities.push({
        type: 'underuse',
        suggestion: 'Device may be unnecessary or misconfigured',
        priority: 'medium'
      });
    }
    
    return opportunities;
  }

  _createUsageSummary(analysis) {
    const summary = {
      totalDevicesAnalyzed: Object.keys(analysis.deviceUsage).length,
      energyEntitiesFound: Object.keys(analysis.energyAnalysis.consumptionByDevice).length,
      recommendationsGenerated: analysis.recommendations.length,
      highPriorityRecommendations: analysis.recommendations.filter(r => r.priority >= 80).length,
      potentialSavings: {
        energy: analysis.recommendations
          .filter(r => r.savings?.type === 'energy')
          .reduce((sum, r) => sum + (parseFloat(r.savings.estimated) || 0), 0),
        cost: analysis.recommendations
          .filter(r => r.savings?.type === 'cost')
          .reduce((sum, r) => sum + (parseFloat(r.savings.estimated) || 0), 0)
      }
    };
    
    return summary;
  }

  async _loadUsageData() {
    try {
      // Load usage data from backend
      const response = await fetch('/api/dashview/config?type=usage_analytics');
      if (response.ok) {
        const data = await response.json();
        this._usageDataCache.set('stored', data);
        console.log('[DashView] Loaded existing usage data');
      }
    } catch (error) {
      console.warn('[DashView] Could not load existing usage data:', error.message);
    }
  }

  _startPeriodicAnalysis() {
    // Run analysis every 24 hours
    setInterval(async () => {
      try {
        const analysis = await this.analyzeUsagePatterns();
        console.log('[DashView] Periodic usage analysis completed');
        
        // Store the analysis results
        this._saveAnalysisResults(analysis);
      } catch (error) {
        console.error('[DashView] Periodic analysis error:', error);
      }
    }, this._config.analysisIntervalHours * 60 * 60 * 1000);
  }

  async _saveAnalysisResults(analysis) {
    try {
      await fetch('/api/dashview/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'usage_analytics',
          config: analysis
        })
      });
    } catch (error) {
      console.warn('[DashView] Could not save analysis results:', error.message);
    }
  }

  /**
   * Get latest usage analysis
   * @returns {Object} Latest analysis results
   */
  getLatestAnalysis() {
    return this._analysisCache.get('latest') || null;
  }

  /**
   * Get recommendations by type
   * @param {string} type - Recommendation type
   * @returns {Array} Filtered recommendations
   */
  getRecommendationsByType(type) {
    const analysis = this.getLatestAnalysis();
    if (!analysis?.recommendations) return [];
    
    return analysis.recommendations.filter(r => r.type === type);
  }

  /**
   * Get high priority recommendations
   * @returns {Array} High priority recommendations
   */
  getHighPriorityRecommendations() {
    const analysis = this.getLatestAnalysis();
    if (!analysis?.recommendations) return [];
    
    return analysis.recommendations
      .filter(r => r.priority >= 80)
      .slice(0, 5); // Top 5 recommendations
  }
}