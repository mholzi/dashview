// custom_components/dashview/www/lib/ui/HistoricalDataManager.js

import { LoadingUtils } from '../utils/loading-utils.js';

export class HistoricalDataManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._dataCache = new Map();
    this._chartInstances = new Map();
    
    // Chart.js configuration defaults
    this._chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(0, 0, 0, 0.8)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          type: 'time',
          display: true,
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 5,
            color: 'var(--secondary-text-color)'
          }
        },
        y: {
          display: true,
          grid: {
            color: 'rgba(128, 128, 128, 0.2)'
          },
          ticks: {
            maxTicksLimit: 5,
            color: 'var(--secondary-text-color)'
          }
        }
      },
      elements: {
        line: {
          tension: 0.2,
          borderWidth: 2
        },
        point: {
          radius: 0,
          hoverRadius: 4
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Check if entity supports historical data graphs
   * @param {string} entityId - The entity ID
   * @returns {boolean} Whether historical data is supported
   */
  supportsHistoricalData(entityId) {
    if (!entityId || !this._hass?.states[entityId]) {
      return false;
    }

    const entity = this._hass.states[entityId];
    const domain = entityId.split('.')[0];
    
    // Only support numerical sensors
    if (domain !== 'sensor') {
      return false;
    }
    
    // Check if the state is numeric
    const state = parseFloat(entity.state);
    if (isNaN(state)) {
      return false;
    }
    
    // Exclude certain device classes that don't benefit from graphs
    const excludedClasses = [
      'enum', 'timestamp', 'date', 'duration', 
      'data_rate', 'data_size', 'frequency'
    ];
    
    const deviceClass = entity.attributes?.device_class;
    if (deviceClass && excludedClasses.includes(deviceClass)) {
      return false;
    }
    
    return true;
  }

  /**
   * Fetch historical data from Home Assistant
   * @param {string} entityId - The entity ID
   * @param {number} hours - Hours of history to fetch (default: 24)
   * @param {HTMLElement} loadingContainer - Optional container to show loading state
   * @returns {Promise<Array>} Historical data points
   */
  async fetchHistoricalData(entityId, hours = 24, loadingContainer = null) {
    console.log(`[HistoricalDataManager] Fetching ${hours}h of data for ${entityId}`);
    
    // Check cache first
    const cacheKey = `${entityId}_${hours}h`;
    const cachedData = this._dataCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 300000) { // 5 min cache
      console.log('[HistoricalDataManager] Using cached data');
      return cachedData.data;
    }
    
    // Show loading state if container provided
    if (loadingContainer) {
      LoadingUtils.showLoading(loadingContainer, 'Fetching historical data...', 'small');
    }
    
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
      
      const url = `/api/history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`History API request failed: ${response.status} ${response.statusText}`);
      }
      
      const historyData = await response.json();
      
      if (!historyData || !historyData[0] || !Array.isArray(historyData[0])) {
        console.warn('[HistoricalDataManager] No historical data available for', entityId);
        return [];
      }
      
      // Process and resample data
      const processedData = this._processHistoricalData(historyData[0]);
      
      // Cache the result
      this._dataCache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      console.log(`[HistoricalDataManager] Fetched ${processedData.length} data points`);
      return processedData;
      
    } catch (error) {
      console.error('[HistoricalDataManager] Error fetching historical data:', error);
      throw error;
    } finally {
      // Hide loading state
      if (loadingContainer) {
        LoadingUtils.hideLoading(loadingContainer);
      }
    }
  }

  /**
   * Process and resample historical data for optimal performance
   * @param {Array} rawData - Raw data from Home Assistant
   * @returns {Array} Processed data points
   */
  _processHistoricalData(rawData) {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    const dataPoints = [];
    
    for (const point of rawData) {
      const value = parseFloat(point.state);
      if (!isNaN(value)) {
        dataPoints.push({
          x: new Date(point.last_updated),
          y: value
        });
      }
    }
    
    // Sort by time
    dataPoints.sort((a, b) => a.x - b.x);
    
    // Resample if we have too many points
    if (dataPoints.length > 200) {
      return this._resampleData(dataPoints, 200);
    }
    
    return dataPoints;
  }

  /**
   * Resample data to reduce number of points
   * @param {Array} data - Original data points
   * @param {number} targetPoints - Target number of points
   * @returns {Array} Resampled data
   */
  _resampleData(data, targetPoints) {
    if (data.length <= targetPoints) {
      return data;
    }
    
    const step = Math.floor(data.length / targetPoints);
    const resampled = [];
    
    for (let i = 0; i < data.length; i += step) {
      resampled.push(data[i]);
    }
    
    // Always include the last point
    if (resampled[resampled.length - 1] !== data[data.length - 1]) {
      resampled.push(data[data.length - 1]);
    }
    
    return resampled;
  }

  /**
   * Create a chart in the specified container
   * @param {HTMLElement} container - Container element
   * @param {string} entityId - Entity ID
   * @param {Array} data - Historical data points
   * @returns {Promise<void>}
   */
  async createChart(container, entityId, data) {
    console.log(`[HistoricalDataManager] Creating chart for ${entityId}`);
    
    // Clean up existing chart
    this.destroyChart(entityId);
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.height = '200px';
    canvas.style.width = '100%';
    container.appendChild(canvas);
    
    // Get entity information for chart configuration
    const entity = this._hass.states[entityId];
    const unit = entity?.attributes?.unit_of_measurement || '';
    const friendlyName = entity?.attributes?.friendly_name || entityId;
    
    // Determine chart color based on entity type
    const color = this._getChartColor(entity);
    
    // Create chart configuration
    const config = {
      type: 'line',
      data: {
        datasets: [{
          label: friendlyName,
          data: data,
          borderColor: color,
          backgroundColor: color + '20', // 20% opacity
          fill: true
        }]
      },
      options: {
        ...this._chartDefaults,
        scales: {
          ...this._chartDefaults.scales,
          y: {
            ...this._chartDefaults.scales.y,
            title: {
              display: !!unit,
              text: unit,
              color: 'var(--secondary-text-color)'
            }
          }
        },
        plugins: {
          ...this._chartDefaults.plugins,
          tooltip: {
            ...this._chartDefaults.plugins.tooltip,
            callbacks: {
              label: function(context) {
                return `${context.parsed.y}${unit ? ' ' + unit : ''}`;
              },
              title: function(context) {
                return new Date(context[0].parsed.x).toLocaleString();
              }
            }
          }
        }
      }
    };
    
    // Create chart instance
    const chart = new Chart(canvas.getContext('2d'), config);
    this._chartInstances.set(entityId, chart);
    
    console.log(`[HistoricalDataManager] Chart created for ${entityId}`);
  }

  /**
   * Get appropriate color for chart based on entity type
   * @param {Object} entity - Entity state object
   * @returns {string} Color string
   */
  _getChartColor(entity) {
    const deviceClass = entity?.attributes?.device_class;
    
    const colorMap = {
      'temperature': '#FF6B6B',
      'humidity': '#4ECDC4',
      'pressure': '#45B7D1',
      'power': '#96CEB4',
      'energy': '#FECA57',
      'battery': '#5F27CD',
      'illuminance': '#FD79A8',
      'voltage': '#6C5CE7',
      'current': '#A29BFE'
    };
    
    return colorMap[deviceClass] || '#74B9FF';
  }

  /**
   * Destroy chart instance
   * @param {string} entityId - Entity ID
   */
  destroyChart(entityId) {
    const chart = this._chartInstances.get(entityId);
    if (chart) {
      chart.destroy();
      this._chartInstances.delete(entityId);
    }
  }

  /**
   * Clear all caches and destroy all charts
   */
  dispose() {
    console.log('[HistoricalDataManager] Disposing and cleaning up resources');
    
    // Destroy all chart instances
    for (const [entityId, chart] of this._chartInstances) {
      chart.destroy();
    }
    this._chartInstances.clear();
    
    // Clear data cache
    this._dataCache.clear();
    
    // Clear references
    this._panel = null;
    this._hass = null;
  }
}