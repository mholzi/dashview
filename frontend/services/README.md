# Services

Business logic services for DashView.

## Structure

```
services/
├── entity-display-service.js   # Entity display logic
├── room-data-service.js        # Room data aggregation
└── index.js                    # Barrel export
```

## Entity Display Service

Centralized logic for entity display (icons, labels, states).

```javascript
import { getEntityDisplayService } from './services/entity-display-service.js';

const service = getEntityDisplayService(hass);

// Get display info for any entity
const display = service.getEntityDisplay(entityId);
// { icon, label, state, cardClass, isActive }

// Type-specific getters
const motionDisplay = service.getMotionSensorDisplay(entityId);
const lightDisplay = service.getLightDisplay(entityId);
const coverDisplay = service.getCoverDisplay(entityId);
```

### Display Object

```javascript
{
  icon: 'mdi:lightbulb-on',      // MDI icon
  label: 'An (80%)',             // State label
  state: 'on',                   // Raw state
  cardClass: 'active-light',     // CSS class for styling
  isActive: true,                // Active state flag
  friendlyName: 'Living Room'    // Entity name
}
```

## Room Data Service

Aggregates data for rooms/areas.

```javascript
import { getRoomDataService } from './services/room-data-service.js';

const service = getRoomDataService(hass, entityRegistry);

// Get aggregated room data
const roomData = service.getRoomData(areaId);
// {
//   hasMotion, hasLightsOn,
//   temperature, humidity,
//   isActive, openWindows
// }

// Get specific data
const temp = service.getRoomTemperature(areaId);
const motion = service.getRoomMotionState(areaId);
```

## Service Pattern

Services are singletons created via factory functions:

```javascript
// Get or create service instance
const service = getEntityDisplayService(hass);

// Services cache their instances
// Subsequent calls return the same instance
```

## Usage Example

```javascript
import { getEntityDisplayService } from '../services/index.js';

function renderEntityCard(html, { hass, entityId }) {
  const displayService = getEntityDisplayService(hass);
  const display = displayService.getEntityDisplay(entityId);

  return html`
    <div class="entity-card ${display.cardClass}">
      <ha-icon icon="${display.icon}"></ha-icon>
      <span>${display.label}</span>
    </div>
  `;
}
```
