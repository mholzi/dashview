# Constants

Shared constants and configuration for DashView.

## Structure

```
constants/
├── index.js     # Main constants (domains, states, icons, entity configs)
└── naming.js    # Label and category naming conventions
```

## Usage

```javascript
import { DOMAINS, ENTITY_CONFIGS, WEATHER_CONDITIONS } from './constants/index.js';
```

## Entity Domains

```javascript
DOMAINS.LIGHT           // "light"
DOMAINS.COVER           // "cover"
DOMAINS.CLIMATE         // "climate"
DOMAINS.BINARY_SENSOR   // "binary_sensor"
DOMAINS.SENSOR          // "sensor"
DOMAINS.MEDIA_PLAYER    // "media_player"
```

## Entity States

```javascript
STATES.ON       // "on"
STATES.OFF      // "off"
STATES.OPEN     // "open"
STATES.CLOSED   // "closed"
STATES.PLAYING  // "playing"
```

## Entity Configurations

Pre-configured entity type settings for the admin interface.

```javascript
ENTITY_CONFIGS.lights = {
  icon: 'mdi:lightbulb',
  title: 'Lights',
  activeLabel: 'on',
  getIcon: (entity) => entity.state === 'on' ? 'mdi:lightbulb-on' : 'mdi:lightbulb',
  getState: (entity) => entity.state,
  isActive: (entity) => entity.state === 'on'
};

// Available configs:
// lights, motionSensors, smokeSensors, covers, roofWindows,
// garages, windows, vibrationSensors, temperatureSensors,
// humiditySensors, climates, mediaPlayers
```

## Weather

```javascript
WEATHER_CONDITIONS = {
  'clear-night': 'Klare Nacht',
  'cloudy': 'Bewölkt',
  'fog': 'Nebel',
  'hail': 'Hagel',
  'lightning': 'Gewitter',
  'partlycloudy': 'Teilweise bewölkt',
  'pouring': 'Starkregen',
  'rainy': 'Regen',
  'snowy': 'Schnee',
  'sunny': 'Sonnig',
  'windy': 'Windig',
  // ...
};

WEATHER_ICONS = {
  'sunny': 'mdi:weather-sunny',
  'cloudy': 'mdi:weather-cloudy',
  'rainy': 'mdi:weather-rainy',
  // ...
};
```

## Icons

```javascript
ICONS.MOTION_ON   // "mdi:motion-sensor"
ICONS.MOTION_OFF  // "mdi:motion-sensor-off"
ICONS.WINDOW_OPEN // "mdi:window-open"
ICONS.LIGHT_ON    // "mdi:lightbulb-on"
// ...
```
