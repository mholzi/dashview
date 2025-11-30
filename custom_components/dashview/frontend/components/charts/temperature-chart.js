/**
 * Temperature Chart Component
 * Renders an SVG area chart for temperature history data
 */

/**
 * Render a temperature history chart as SVG
 * @param {Function} html - lit-html template function
 * @param {Array} history - Array of {time: number, value: number} objects
 * @param {Object} [options] - Chart options
 * @param {number} [options.width=280] - Chart width
 * @param {number} [options.height=95] - Chart height
 * @param {string} [options.gradientId='tempGradient'] - Unique ID for gradient
 * @param {string} [options.fillColor='var(--dv-gray800, #0f0f10)'] - Fill color
 * @returns {TemplateResult|string} SVG chart or empty string if insufficient data
 */
export function renderTemperatureChart(html, history, options = {}) {
  if (!history || history.length < 2) {
    return '';
  }

  const {
    width = 280,
    height = 95,
    gradientId = 'tempGradient',
    fillColor = 'var(--dv-gray800, #0f0f10)'
  } = options;

  // Downsample data points for smoother appearance (max ~50 points)
  let sampledHistory = history;
  if (history.length > 50) {
    const step = Math.ceil(history.length / 50);
    sampledHistory = history.filter((_, i) => i % step === 0 || i === history.length - 1);
  }

  // Calculate min/max for scaling
  const values = sampledHistory.map(h => h.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Add padding to range
  const padding = range * 0.1;
  const yMin = minVal - padding;
  const yMax = maxVal + padding;
  const yRange = yMax - yMin;

  const timeMin = sampledHistory[0].time;
  const timeMax = sampledHistory[sampledHistory.length - 1].time;
  const timeRange = timeMax - timeMin || 1;

  // Generate points array for smooth curve
  const pointsArray = sampledHistory.map(h => ({
    x: ((h.time - timeMin) / timeRange) * width,
    y: height - ((h.value - yMin) / yRange) * height
  }));

  // Create smooth bezier curve path
  let smoothPath = `M ${pointsArray[0].x.toFixed(1)} ${pointsArray[0].y.toFixed(1)}`;
  for (let i = 1; i < pointsArray.length; i++) {
    const prev = pointsArray[i - 1];
    const curr = pointsArray[i];
    const cpX = (prev.x + curr.x) / 2;
    smoothPath += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  // Create gradient fill path (area under curve)
  const fillPath = smoothPath + ` L ${width} ${height} L 0 ${height} Z`;

  return html`
    <svg class="temp-history-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: ${fillColor}; stop-opacity: 0.15" />
          <stop offset="100%" style="stop-color: ${fillColor}; stop-opacity: 0" />
        </linearGradient>
      </defs>
      <path d="${fillPath}" fill="url(#${gradientId})" />
    </svg>
  `;
}

/**
 * Process raw history data from Home Assistant
 * @param {Object} response - HA history response
 * @param {string} entityId - Entity ID to extract
 * @returns {Array} Array of {time: number, value: number} objects
 */
export function processHistoryData(response, entityId) {
  if (!response || !response[entityId]) return [];

  return response[entityId]
    .filter(item => item.s !== 'unavailable' && item.s !== 'unknown' && !isNaN(parseFloat(item.s)))
    .map(item => ({
      time: new Date(item.lu * 1000).getTime(),
      value: parseFloat(item.s)
    }));
}
