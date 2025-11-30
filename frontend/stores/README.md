# Stores

State management for DashView using a simple reactive store pattern.

## Structure

```
stores/
├── settings-store.js   # Persisted user settings
├── ui-state-store.js   # Transient UI state
├── registry-store.js   # Home Assistant registry cache
└── index.js            # Barrel export with StoreConnector mixin
```

## Store Types

### Settings Store (Persisted)

User configuration saved to Home Assistant storage.

```javascript
import { getSettingsStore } from './stores/settings-store.js';

const store = getSettingsStore();
store.subscribe((state) => console.log('Settings changed:', state));

// State includes:
// - enabledRooms, enabledLights, enabledSensors
// - floorOrder, roomOrder
// - weatherEntity, garbageSensors
// - thresholds, infoTextConfig
```

### UI State Store (Transient)

Temporary UI state, resets on page reload.

```javascript
import { getUIStateStore } from './stores/ui-state-store.js';

const store = getUIStateStore();

// State includes:
// - activeTab, adminSubTab
// - expandedAreas, popupRoom
// - searchQuery, floorOverviewIndex
```

### Registry Store (Cached)

Home Assistant registry data cache.

```javascript
import { getRegistryStore } from './stores/registry-store.js';

const store = getRegistryStore();

// State includes:
// - areas, floors, devices
// - entityRegistry, labels
```

## Usage with LitElement

```javascript
import { StoreConnector, storeProperty } from './stores/index.js';

class MyComponent extends StoreConnector(LitElement) {
  static get properties() {
    return {
      settings: storeProperty('settings'),
      uiState: storeProperty('ui')
    };
  }
}
```

## Store Pattern

All stores follow this interface:

```javascript
const store = {
  getState(),           // Get current state
  setState(partial),    // Update state (shallow merge)
  subscribe(callback),  // Subscribe to changes (returns unsubscribe fn)
  reset()               // Reset to initial state
};
```
