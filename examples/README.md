# DashView Customization Examples

This directory contains examples of how to customize and extend DashView for your specific needs.

## Basic Customization

DashView is designed to be easily customizable. The main dashboard HTML/CSS/JS is embedded in the `__init__.py` file, but you can extend it in several ways:

### 1. Custom CSS Styling

You can modify the CSS styles in the `__init__.py` file to change the appearance of your dashboard.

### 2. Adding New Widgets

Create new widget components by adding HTML elements and corresponding JavaScript functionality.

### 3. Integrating with Home Assistant Entities

Use Home Assistant's WebSocket API to fetch and display entity states in your dashboard.

## Example: Custom Weather Widget

Here's an example of how you might add a weather widget to your dashboard:

```javascript
// Add this to the dashboard JavaScript
async function fetchWeatherData() {
    try {
        // This would connect to Home Assistant's WebSocket API
        // to fetch weather entity data
        const response = await fetch('/api/states/weather.home');
        const data = await response.json();
        updateWeatherWidget(data);
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
    }
}

function updateWeatherWidget(weatherData) {
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget && weatherData) {
        weatherWidget.innerHTML = `
            <h3>🌤️ Weather</h3>
            <div class="weather-info">
                <p>Temperature: ${weatherData.attributes.temperature}°C</p>
                <p>Condition: ${weatherData.state}</p>
                <p>Humidity: ${weatherData.attributes.humidity}%</p>
            </div>
        `;
    }
}
```

## Advanced Customization

For more advanced customization, you can:

1. Create custom sensor entities in `sensor.py`
2. Add custom services in `services.py`
3. Implement WebSocket communication for real-time updates
4. Create custom panels for different dashboard views

## Contributing

If you create useful widgets or customizations, consider contributing them back to the project!