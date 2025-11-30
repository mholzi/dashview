# Utilities

Helper functions and utilities used throughout DashView.

## Structure

```
utils/
├── formatters.js     # Date/time/state formatting
├── helpers.js        # General utilities (sort, clamp, debounce)
├── haptic.js         # Haptic feedback API
├── icons.js          # Icon mapping and weather icons
├── entities.js       # Entity listing and counting
├── entity-helpers.js # Entity manipulation helpers
└── index.js          # Barrel export
```

## Usage

```javascript
import { formatLastChanged, getFloorIcon, triggerHaptic } from './utils/index.js';
```

## Formatters

```javascript
import { formatLastChanged, formatTime, formatDate } from './utils/formatters.js';

formatLastChanged('2024-01-15T10:30:00Z'); // "vor 5 Min."
formatTime(new Date());                     // "10:30"
formatDate(new Date());                     // "15. Jan"
```

## Helpers

```javascript
import { sortByCustomOrder, clamp, debounce, deepMerge } from './utils/helpers.js';

clamp(150, 0, 100);           // 100
debounce(fn, 300);            // Debounced function
sortByCustomOrder(items, order, getId, fallback);
```

## Icons

```javascript
import { getFloorIcon, getAreaIcon, getWeatherIcon } from './utils/icons.js';

getFloorIcon(floor);          // "mdi:home-floor-1"
getAreaIcon(area);            // "mdi:sofa"
getWeatherIcon('sunny');      // "mdi:weather-sunny"
translateWeatherCondition('cloudy'); // "Bewölkt"
```

## Haptic

```javascript
import { triggerHaptic } from './utils/haptic.js';

triggerHaptic('light');       // Light vibration
triggerHaptic('selection');   // Selection feedback
triggerHaptic('success');     // Success feedback
```

## Entity Helpers

```javascript
import { mapLightEntity, mapCoverEntity } from './utils/entity-helpers.js';

const light = mapLightEntity(hass, entityId, areaId);
// { entity_id, name, state, brightness, enabled, ... }
```
