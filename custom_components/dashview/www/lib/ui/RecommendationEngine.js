// custom_components/dashview/www/lib/ui/RecommendationEngine.js

/**
 * RecommendationEngine
 * 
 * Generates actionable optimization recommendations based on usage analytics.
 * Provides specific suggestions for energy savings, automation improvements,
 * and device optimization with clear implementation steps.
 */
export class RecommendationEngine {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._usageAnalyticsManager = panel._usageAnalyticsManager;
    
    // Recommendation templates
    this._recommendationTemplates = {
      energy_savings: {
        high_consumption_device: {
          title: 'High Energy Consumer Detected',
          description: 'Device {deviceName} is consuming {consumption}% of your total energy. Consider optimization.',
          actions: [
            'Create schedule to turn off during peak hours',
            'Replace with energy-efficient alternative',
            'Add motion sensors for automatic control'
          ],
          savings: { min: 10, max: 30, unit: 'percent' }
        },
        standby_power: {
          title: 'Standby Power Optimization',
          description: 'Devices consuming power while inactive could save {savings}% energy.',
          actions: [
            'Use smart outlets to cut standby power',
            'Create automations to fully power down devices',
            'Group devices on power strips with scheduling'
          ],
          savings: { min: 5, max: 15, unit: 'percent' }
        },
        peak_hour_usage: {
          title: 'Peak Hour Usage Optimization',
          description: 'Shifting {deviceCount} devices from peak hours could reduce costs by {savings}%.',
          actions: [
            'Schedule high-consumption devices for off-peak hours',
            'Use delay timers for appliances',
            'Create time-based automation rules'
          ],
          savings: { min: 15, max: 25, unit: 'cost' }
        }
      },
      automation_optimization: {
        unused_automation: {
          title: 'Inactive Automation Detected',
          description: 'Automation "{automationName}" has been inactive for {days} days.',
          actions: [
            'Review automation conditions and triggers',
            'Update automation logic for current setup',
            'Remove if no longer needed'
          ],
          savings: { min: 0, max: 5, unit: 'efficiency' }
        },
        missing_automation: {
          title: 'Automation Opportunity',
          description: 'Device {deviceName} shows regular patterns that could be automated.',
          actions: [
            'Create schedule-based automation',
            'Add presence-detection triggers',
            'Implement scene-based controls'
          ],
          savings: { min: 10, max: 20, unit: 'convenience' }
        },
        inefficient_triggers: {
          title: 'Automation Trigger Optimization',
          description: 'Multiple automations could be combined for better efficiency.',
          actions: [
            'Merge similar automations',
            'Use single trigger for multiple actions',
            'Implement conditional logic improvements'
          ],
          savings: { min: 5, max: 15, unit: 'performance' }
        }
      },
      device_lifecycle: {
        maintenance_due: {
          title: 'Device Maintenance Recommended',
          description: 'Device {deviceName} shows signs of reduced efficiency.',
          actions: [
            'Schedule maintenance check',
            'Clean sensors and components',
            'Update device firmware'
          ],
          savings: { min: 5, max: 15, unit: 'reliability' }
        },
        replacement_recommended: {
          title: 'Device Replacement Opportunity',
          description: 'Device {deviceName} is {age} years old and energy-inefficient.',
          actions: [
            'Research energy-efficient alternatives',
            'Calculate return on investment',
            'Plan replacement timeline'
          ],
          savings: { min: 20, max: 40, unit: 'energy' }
        },
        underutilized_device: {
          title: 'Underutilized Device',
          description: 'Device {deviceName} is used only {usage}% of expected time.',
          actions: [
            'Relocate to more suitable room',
            'Repurpose for different use case',
            'Consider removal if unnecessary'
          ],
          savings: { min: 0, max: 10, unit: 'cost' }
        }
      },
      usage_efficiency: {
        inefficient_schedule: {
          title: 'Usage Schedule Optimization',
          description: 'Device {deviceName} usage pattern could be optimized.',
          actions: [
            'Adjust usage schedule to match occupancy',
            'Implement smart scheduling based on presence',
            'Create seasonal schedule adjustments'
          ],
          savings: { min: 10, max: 25, unit: 'efficiency' }
        },
        redundant_devices: {
          title: 'Redundant Device Usage',
          description: 'Multiple devices serve similar functions in {location}.',
          actions: [
            'Identify primary and backup devices',
            'Create intelligent switching logic',
            'Remove or repurpose redundant devices'
          ],
          savings: { min: 15, max: 30, unit: 'energy' }
        }
      }
    };
    
    // Recommendation priorities
    this._priorities = {
      CRITICAL: 100,
      HIGH: 80,
      MEDIUM: 60,
      LOW: 40,
      INFO: 20
    };
    
    console.log('[DashView] RecommendationEngine initialized');
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Generate comprehensive recommendations based on usage analysis
   * @param {Object} usageAnalysis - Usage analysis data
   * @returns {Array} Array of recommendation objects
   */
  generateRecommendations(usageAnalysis) {
    const recommendations = [];
    
    try {
      // Energy optimization recommendations
      recommendations.push(...this._generateEnergyRecommendations(usageAnalysis));
      
      // Automation optimization recommendations
      recommendations.push(...this._generateAutomationRecommendations(usageAnalysis));
      
      // Device lifecycle recommendations
      recommendations.push(...this._generateLifecycleRecommendations(usageAnalysis));
      
      // Usage efficiency recommendations
      recommendations.push(...this._generateUsageEfficiencyRecommendations(usageAnalysis));
      
      // Sort by priority and potential impact
      return this._prioritizeRecommendations(recommendations);
      
    } catch (error) {
      console.error('[DashView] Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate energy optimization recommendations
   * @param {Object} usageAnalysis - Usage analysis data
   * @returns {Array} Energy recommendations
   */
  _generateEnergyRecommendations(usageAnalysis) {
    const recommendations = [];
    const { energyAnalysis, deviceUsage } = usageAnalysis;
    
    // High consumption devices
    Object.entries(energyAnalysis.consumptionByDevice || {}).forEach(([entityId, data]) => {
      const consumptionPercentage = (data.total / energyAnalysis.totalConsumption) * 100;
      
      if (consumptionPercentage > 20) {
        const device = this._hass?.states[entityId];
        const deviceName = device?.attributes?.friendly_name || entityId;
        
        recommendations.push({
          id: `energy_high_consumption_${entityId}`,
          type: 'energy_savings',
          category: 'high_consumption_device',
          title: 'High Energy Consumer Detected',
          description: `Device "${deviceName}" is consuming ${Math.round(consumptionPercentage)}% of your total energy. Consider optimization.`,
          priority: this._priorities.HIGH,
          impact: 'high',
          device: {
            entityId,
            name: deviceName,
            domain: entityId.split('.')[0]
          },
          savings: {
            type: 'energy',
            estimated: `${Math.round(consumptionPercentage * 0.3)}-${Math.round(consumptionPercentage * 0.5)}%`,
            period: 'monthly'
          },
          actions: this._generateEnergyActions(entityId, data),
          implementation: {
            difficulty: 'medium',
            timeRequired: '30-60 minutes',
            tools: ['Home Assistant automations', 'Smart scheduling']
          }
        });
      }
    });
    
    // Peak hour usage optimization
    if (energyAnalysis.peakConsumptionHours?.length > 0) {
      const devicesInPeakHours = this._findDevicesActiveDuringPeakHours(deviceUsage, energyAnalysis.peakConsumptionHours);
      
      if (devicesInPeakHours.length > 0) {
        recommendations.push({
          id: 'energy_peak_hour_optimization',
          type: 'energy_savings',
          category: 'peak_hour_usage',
          title: 'Peak Hour Usage Optimization',
          description: `${devicesInPeakHours.length} devices are active during peak energy cost hours. Shifting usage could reduce costs by 15-25%.`,
          priority: this._priorities.MEDIUM,
          impact: 'medium',
          affectedDevices: devicesInPeakHours,
          savings: {
            type: 'cost',
            estimated: '15-25%',
            period: 'monthly'
          },
          actions: [
            {
              type: 'schedule_optimization',
              description: 'Create time-based schedules to avoid peak hours',
              devices: devicesInPeakHours.map(d => d.entityId)
            },
            {
              type: 'delayed_start',
              description: 'Implement delayed start for non-essential devices',
              priority: 'high'
            }
          ],
          implementation: {
            difficulty: 'easy',
            timeRequired: '15-30 minutes',
            tools: ['Home Assistant scheduler', 'Node-RED (optional)']
          }
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Generate automation optimization recommendations
   * @param {Object} usageAnalysis - Usage analysis data
   * @returns {Array} Automation recommendations
   */
  _generateAutomationRecommendations(usageAnalysis) {
    const recommendations = [];
    const { automationEfficiency, deviceUsage } = usageAnalysis;
    
    // Inactive automations
    if (automationEfficiency.efficiencyScore < 80) {
      recommendations.push({
        id: 'automation_efficiency_low',
        type: 'automation_optimization',
        category: 'inefficient_triggers',
        title: 'Automation Efficiency Improvement',
        description: `Only ${automationEfficiency.efficiencyScore}% of your automations are active. Review and optimize inactive automations.`,
        priority: this._priorities.MEDIUM,
        impact: 'medium',
        savings: {
          type: 'efficiency',
          estimated: '10-20%',
          period: 'ongoing'
        },
        actions: [
          {
            type: 'automation_audit',
            description: 'Review all inactive automations',
            priority: 'high'
          },
          {
            type: 'condition_optimization',
            description: 'Update automation conditions for current setup',
            priority: 'medium'
          },
          {
            type: 'cleanup',
            description: 'Remove outdated or redundant automations',
            priority: 'low'
          }
        ],
        implementation: {
          difficulty: 'medium',
          timeRequired: '45-90 minutes',
          tools: ['Home Assistant automation editor']
        }
      });
    }
    
    // Missing automation opportunities
    const automationOpportunities = this._identifyAutomationOpportunities(deviceUsage);
    automationOpportunities.forEach(opportunity => {
      recommendations.push({
        id: `automation_opportunity_${opportunity.entityId}`,
        type: 'automation_optimization',
        category: 'missing_automation',
        title: 'Automation Opportunity Detected',
        description: `Device "${opportunity.deviceName}" shows regular usage patterns that could be automated.`,
        priority: this._priorities.MEDIUM,
        impact: 'medium',
        device: opportunity,
        savings: {
          type: 'convenience',
          estimated: 'High',
          period: 'daily'
        },
        actions: [
          {
            type: 'schedule_automation',
            description: `Create ${opportunity.patternType} automation`,
            pattern: opportunity.pattern
          }
        ],
        implementation: {
          difficulty: 'easy',
          timeRequired: '15-30 minutes',
          tools: ['Home Assistant automation editor']
        }
      });
    });
    
    return recommendations;
  }

  /**
   * Generate device lifecycle recommendations
   * @param {Object} usageAnalysis - Usage analysis data
   * @returns {Array} Lifecycle recommendations
   */
  _generateLifecycleRecommendations(usageAnalysis) {
    const recommendations = [];
    const { deviceUsage } = usageAnalysis;
    
    // Underutilized devices
    Object.entries(deviceUsage).forEach(([entityId, data]) => {
      if (data.usagePattern.dailyAverageHours < 0.5) {
        const device = this._hass?.states[entityId];
        const deviceName = device?.attributes?.friendly_name || entityId;
        
        recommendations.push({
          id: `lifecycle_underutilized_${entityId}`,
          type: 'device_lifecycle',
          category: 'underutilized_device',
          title: 'Underutilized Device',
          description: `Device "${deviceName}" is used only ${Math.round(data.usagePattern.dailyAverageHours * 100) / 100} hours per day. Consider relocation or removal.`,
          priority: this._priorities.LOW,
          impact: 'low',
          device: {
            entityId,
            name: deviceName,
            usage: data.usagePattern.dailyAverageHours
          },
          savings: {
            type: 'cost',
            estimated: '5-10%',
            period: 'monthly'
          },
          actions: [
            {
              type: 'relocation',
              description: 'Move to a more suitable location'
            },
            {
              type: 'repurpose',
              description: 'Find alternative use case'
            },
            {
              type: 'removal',
              description: 'Remove if truly unnecessary'
            }
          ],
          implementation: {
            difficulty: 'easy',
            timeRequired: '10-20 minutes',
            tools: ['Physical relocation']
          }
        });
      }
    });
    
    // Devices with poor efficiency scores
    Object.entries(deviceUsage).forEach(([entityId, data]) => {
      if (data.efficiency < 40) {
        const device = this._hass?.states[entityId];
        const deviceName = device?.attributes?.friendly_name || entityId;
        
        recommendations.push({
          id: `lifecycle_inefficient_${entityId}`,
          type: 'device_lifecycle',
          category: 'maintenance_due',
          title: 'Device Efficiency Concern',
          description: `Device "${deviceName}" has an efficiency score of ${data.efficiency}%. Consider maintenance or replacement.`,
          priority: this._priorities.MEDIUM,
          impact: 'medium',
          device: {
            entityId,
            name: deviceName,
            efficiency: data.efficiency
          },
          savings: {
            type: 'reliability',
            estimated: '10-20%',
            period: 'ongoing'
          },
          actions: [
            {
              type: 'maintenance',
              description: 'Schedule device maintenance check'
            },
            {
              type: 'configuration_review',
              description: 'Review device configuration and settings'
            },
            {
              type: 'replacement_evaluation',
              description: 'Evaluate replacement with more efficient model'
            }
          ],
          implementation: {
            difficulty: 'medium',
            timeRequired: '30-60 minutes',
            tools: ['Device manual', 'Maintenance supplies']
          }
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate usage efficiency recommendations
   * @param {Object} usageAnalysis - Usage analysis data
   * @returns {Array} Usage efficiency recommendations
   */
  _generateUsageEfficiencyRecommendations(usageAnalysis) {
    const recommendations = [];
    const { deviceUsage } = usageAnalysis;
    
    // Devices with inefficient usage patterns
    Object.entries(deviceUsage).forEach(([entityId, data]) => {
      const pattern = data.usagePattern;
      
      // Check for 24/7 usage (potentially inefficient)
      if (pattern.dailyAverageHours > 20) {
        const device = this._hass?.states[entityId];
        const deviceName = device?.attributes?.friendly_name || entityId;
        
        recommendations.push({
          id: `efficiency_always_on_${entityId}`,
          type: 'usage_efficiency',
          category: 'inefficient_schedule',
          title: 'Always-On Device Detected',
          description: `Device "${deviceName}" is active ${Math.round(pattern.dailyAverageHours)} hours per day. Consider scheduling optimization.`,
          priority: this._priorities.HIGH,
          impact: 'high',
          device: {
            entityId,
            name: deviceName,
            currentUsage: pattern.dailyAverageHours
          },
          savings: {
            type: 'energy',
            estimated: '20-40%',
            period: 'monthly'
          },
          actions: [
            {
              type: 'schedule_creation',
              description: 'Create smart schedule based on occupancy'
            },
            {
              type: 'presence_automation',
              description: 'Add presence detection for automatic control'
            },
            {
              type: 'usage_review',
              description: 'Review if constant operation is necessary'
            }
          ],
          implementation: {
            difficulty: 'medium',
            timeRequired: '30-45 minutes',
            tools: ['Presence sensors', 'Home Assistant automations']
          }
        });
      }
      
      // Check for unusual usage patterns
      if (this._isUnusualUsagePattern(pattern)) {
        const device = this._hass?.states[entityId];
        const deviceName = device?.attributes?.friendly_name || entityId;
        
        recommendations.push({
          id: `efficiency_unusual_pattern_${entityId}`,
          type: 'usage_efficiency',
          category: 'inefficient_schedule',
          title: 'Unusual Usage Pattern',
          description: `Device "${deviceName}" has an unusual usage pattern that could be optimized.`,
          priority: this._priorities.LOW,
          impact: 'low',
          device: {
            entityId,
            name: deviceName,
            pattern: this._describeUsagePattern(pattern)
          },
          savings: {
            type: 'efficiency',
            estimated: '5-15%',
            period: 'ongoing'
          },
          actions: [
            {
              type: 'pattern_analysis',
              description: 'Analyze current usage pattern'
            },
            {
              type: 'schedule_optimization',
              description: 'Optimize schedule for better efficiency'
            }
          ],
          implementation: {
            difficulty: 'easy',
            timeRequired: '15-30 minutes',
            tools: ['Usage analytics', 'Schedule planner']
          }
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate specific actions for energy optimization
   * @param {string} entityId - Device entity ID
   * @param {Object} energyData - Energy consumption data
   * @returns {Array} Array of action objects
   */
  _generateEnergyActions(entityId, energyData) {
    const actions = [];
    const domain = entityId.split('.')[0];
    
    // Domain-specific actions
    switch (domain) {
      case 'light':
        actions.push(
          {
            type: 'motion_automation',
            description: 'Add motion sensors for automatic on/off control',
            priority: 'high'
          },
          {
            type: 'schedule_dimming',
            description: 'Create dimming schedules for different times of day',
            priority: 'medium'
          }
        );
        break;
      
      case 'climate':
        actions.push(
          {
            type: 'smart_scheduling',
            description: 'Create temperature schedules based on occupancy',
            priority: 'high'
          },
          {
            type: 'zone_control',
            description: 'Implement room-by-room temperature control',
            priority: 'medium'
          }
        );
        break;
      
      case 'media_player':
        actions.push(
          {
            type: 'auto_standby',
            description: 'Automatically enter standby mode when inactive',
            priority: 'high'
          },
          {
            type: 'presence_control',
            description: 'Turn off when no one is present',
            priority: 'medium'
          }
        );
        break;
      
      default:
        actions.push(
          {
            type: 'schedule_optimization',
            description: 'Create optimized usage schedule',
            priority: 'medium'
          }
        );
    }
    
    return actions;
  }

  /**
   * Find devices active during peak hours
   * @param {Object} deviceUsage - Device usage data
   * @param {Array} peakHours - Peak hour array
   * @returns {Array} Devices active during peak hours
   */
  _findDevicesActiveDuringPeakHours(deviceUsage, peakHours) {
    const devicesInPeakHours = [];
    
    Object.entries(deviceUsage).forEach(([entityId, data]) => {
      const pattern = data.usagePattern;
      const peakUsage = pattern.peakUsageHours.some(hour => peakHours.includes(hour));
      
      if (peakUsage) {
        const device = this._hass?.states[entityId];
        devicesInPeakHours.push({
          entityId,
          name: device?.attributes?.friendly_name || entityId,
          domain: entityId.split('.')[0],
          peakHours: pattern.peakUsageHours.filter(hour => peakHours.includes(hour))
        });
      }
    });
    
    return devicesInPeakHours;
  }

  /**
   * Identify automation opportunities
   * @param {Object} deviceUsage - Device usage data
   * @returns {Array} Automation opportunities
   */
  _identifyAutomationOpportunities(deviceUsage) {
    const opportunities = [];
    
    Object.entries(deviceUsage).forEach(([entityId, data]) => {
      const pattern = data.usagePattern;
      const device = this._hass?.states[entityId];
      const deviceName = device?.attributes?.friendly_name || entityId;
      
      // Check for regular daily patterns
      if (this._hasRegularDailyPattern(pattern)) {
        opportunities.push({
          entityId,
          deviceName,
          patternType: 'schedule',
          pattern: {
            type: 'daily',
            hours: pattern.peakUsageHours,
            description: `Regular usage around ${pattern.peakUsageHours.join(', ')}:00`
          },
          confidence: 'high'
        });
      }
      
      // Check for presence-based patterns
      if (this._hasPresenceBasedPattern(pattern)) {
        opportunities.push({
          entityId,
          deviceName,
          patternType: 'presence',
          pattern: {
            type: 'occupancy',
            distribution: pattern.usageDistribution,
            description: 'Usage correlates with typical occupancy patterns'
          },
          confidence: 'medium'
        });
      }
    });
    
    return opportunities;
  }

  /**
   * Check if device has regular daily pattern
   * @param {Object} pattern - Usage pattern data
   * @returns {boolean} True if regular pattern exists
   */
  _hasRegularDailyPattern(pattern) {
    const peakHours = pattern.peakUsageHours;
    
    // Check if peak hours are consistent (within 2-hour window)
    if (peakHours.length >= 2) {
      const hourRange = Math.max(...peakHours) - Math.min(...peakHours);
      return hourRange <= 4; // Peak usage within 4-hour window
    }
    
    return false;
  }

  /**
   * Check if device has presence-based pattern
   * @param {Object} pattern - Usage pattern data
   * @returns {boolean} True if presence-based pattern exists
   */
  _hasPresenceBasedPattern(pattern) {
    const dist = pattern.usageDistribution;
    
    // Check if usage is primarily during typical occupancy hours (morning/evening)
    const awakeTimeUsage = dist.morning + dist.evening;
    const totalUsage = Object.values(dist).reduce((sum, val) => sum + val, 0);
    
    return totalUsage > 0 && (awakeTimeUsage / totalUsage) > 0.7;
  }

  /**
   * Check if usage pattern is unusual
   * @param {Object} pattern - Usage pattern data
   * @returns {boolean} True if pattern is unusual
   */
  _isUnusualUsagePattern(pattern) {
    // Check for heavy night usage (potentially inefficient)
    const dist = pattern.usageDistribution;
    const totalUsage = Object.values(dist).reduce((sum, val) => sum + val, 0);
    
    if (totalUsage > 0) {
      const nightUsagePercentage = (dist.night / totalUsage) * 100;
      return nightUsagePercentage > 50; // More than 50% night usage is unusual
    }
    
    return false;
  }

  /**
   * Describe usage pattern in human-readable format
   * @param {Object} pattern - Usage pattern data
   * @returns {string} Human-readable pattern description
   */
  _describeUsagePattern(pattern) {
    const dist = pattern.usageDistribution;
    const totalUsage = Object.values(dist).reduce((sum, val) => sum + val, 0);
    
    if (totalUsage === 0) return 'No usage detected';
    
    const percentages = Object.fromEntries(
      Object.entries(dist).map(([period, usage]) => [period, Math.round((usage / totalUsage) * 100)])
    );
    
    const primaryPeriod = Object.entries(percentages)
      .sort((a, b) => b[1] - a[1])[0];
    
    return `Primary usage during ${primaryPeriod[0]} (${primaryPeriod[1]}%)`;
  }

  /**
   * Prioritize recommendations by impact and ease of implementation
   * @param {Array} recommendations - Array of recommendations
   * @returns {Array} Sorted recommendations
   */
  _prioritizeRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      // Primary sort by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Secondary sort by estimated savings
      const aSavings = this._extractSavingsValue(a.savings?.estimated);
      const bSavings = this._extractSavingsValue(b.savings?.estimated);
      
      return bSavings - aSavings;
    });
  }

  /**
   * Extract numeric value from savings estimate
   * @param {string} estimate - Savings estimate string
   * @returns {number} Numeric savings value
   */
  _extractSavingsValue(estimate) {
    if (!estimate || typeof estimate !== 'string') return 0;
    
    const match = estimate.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get recommendations by category
   * @param {Array} recommendations - All recommendations
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered recommendations
   */
  getRecommendationsByCategory(recommendations, category) {
    return recommendations.filter(rec => rec.category === category);
  }

  /**
   * Get high-impact recommendations
   * @param {Array} recommendations - All recommendations
   * @returns {Array} High-impact recommendations
   */
  getHighImpactRecommendations(recommendations) {
    return recommendations.filter(rec => rec.impact === 'high');
  }

  /**
   * Get easy-to-implement recommendations
   * @param {Array} recommendations - All recommendations
   * @returns {Array} Easy recommendations
   */
  getEasyImplementationRecommendations(recommendations) {
    return recommendations.filter(rec => rec.implementation?.difficulty === 'easy');
  }
}