# Dashview Architecture

## Executive Summary

Dashview is a **Home Assistant Custom Component** that provides a label-based dashboard for smart home control. It consists of a Python backend integration and a JavaScript frontend panel.

- **Type**: Home Assistant Custom Component (Extension/Plugin)
- **Version**: 0.0.8
- **Architecture Style**: Modular Component-Based with Reactive State
- **Communication**: WebSocket API

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Integration logic |
| Home Assistant Core | 2024.1.0+ | Platform framework |
| voluptuous | - | Schema validation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| JavaScript | ES2020+ | UI logic |
| LitElement | (via HA) | Web Component base |
| lit-html | 2.8.0 | Template rendering |
| Web Components | - | Custom elements |

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              HOME ASSISTANT                                 │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │ Entity States   │    │ Registry APIs   │    │ Storage API             │ │
│  │ (hass.states)   │    │ area/entity/    │    │ (dashview.settings)     │ │
│  │                 │    │ device/label    │    │                         │ │
│  └────────┬────────┘    └────────┬────────┘    └────────────┬────────────┘ │
│           │                      │                          │              │
└───────────┼──────────────────────┼──────────────────────────┼──────────────┘
            │                      │                          │
            │    WebSocket         │    WebSocket             │   WebSocket
            │    (real-time)       │    (on-demand)           │   (CRUD)
            │                      │                          │
┌───────────┼──────────────────────┼──────────────────────────┼──────────────┐
│           │                      │                          │              │
│  ┌────────▼────────────────────────────────────────────────▼────────────┐ │
│  │                         __init__.py (Backend)                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐ │ │
│  │  │ async_setup()   │  │ WebSocket API   │  │ async_setup_frontend()│ │ │
│  │  │ async_setup_    │  │ get_settings    │  │ Static path           │ │ │
│  │  │   entry()       │  │ save_settings   │  │ Panel registration    │ │ │
│  │  └─────────────────┘  └─────────────────┘  └───────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      dashview-panel.js (Frontend)                     │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                         STORES LAYER                             │ │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │ │ │
│  │  │  │ Settings    │  │ UIState     │  │ Registry                │  │ │ │
│  │  │  │ Store       │  │ Store       │  │ Store                   │  │ │ │
│  │  │  │ (Persisted) │  │ (Transient) │  │ (Cached)                │  │ │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                       SERVICES LAYER                             │ │ │
│  │  │  EntityDisplayService │ RoomDataService │ WeatherService        │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                       FEATURES LAYER                             │ │ │
│  │  │  home/ │ admin/ │ weather/ │ security/ │ popups/                │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                      COMPONENTS LAYER                            │ │ │
│  │  │  cards/ │ controls/ │ layout/ │ charts/                         │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                            DASHVIEW INTEGRATION                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Integration Lifecycle

```python
# 1. Component setup (called once)
async def async_setup(hass, config) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True

# 2. Config entry setup (per integration instance)
async def async_setup_entry(hass, entry) -> bool:
    # Initialize storage
    # Register WebSocket commands
    # Set up frontend panel
    return True

# 3. Unload
async def async_unload_entry(hass, entry) -> bool:
    return True
```

### WebSocket API

| Command | Type | Purpose |
|---------|------|---------|
| `dashview/get_settings` | Query | Load user settings |
| `dashview/save_settings` | Mutation | Persist user settings |

### Storage Schema

```python
{
    "enabledRooms": {"area_id": True/False, ...},
    "enabledLights": {"entity_id": True/False, ...},
    "enabledMotionSensors": {...},
    "enabledSmokeSensors": {...},
    "enabledCovers": {...},
    "enabledMediaPlayers": {...},
    "enabledGarages": {...},
    "enabledWindows": {...},
    "weatherEntity": "weather.home",
    "floorOrder": ["floor_1", "floor_2"],
    "roomOrder": {"floor_1": ["area_1", "area_2"]},
    "categoryLabels": {"light": "label_id", ...},
    "infoTextConfig": {...},
    "sceneButtons": [...],
    ...
}
```

## Frontend Architecture

### Module System

The frontend uses **ES Modules** with dynamic imports and cache busting:

```javascript
// Dynamic import with version
const module = await import(`./features/home/index.js?v=${VERSION}`);
```

### State Management

Three singleton stores manage different state types:

| Store | Persistence | Scope | Key Data |
|-------|-------------|-------|----------|
| **SettingsStore** | HA Storage (WebSocket) | Global | User preferences, enabled entities, mappings |
| **UIStateStore** | Memory | Session | Active tab, open popups, carousel indices |
| **RegistryStore** | Memory Cache | Session | Areas, floors, entities, devices, labels |

### Store Interface

```typescript
interface Store<T> {
  get(key: string): any;
  set(key: string, value: any): void;
  subscribe(listener: (key, value) => void): () => void;
  all: T;
}
```

### Service Pattern

Services encapsulate business logic and are singletons:

```javascript
// Factory function returns singleton
const service = getEntityDisplayService();

// Configure
service.setEntityRegistry(registry);
service.setLabelIds(labelIds);

// Use
const displayInfo = service.getDisplayInfo(entityId, state);
```

### Component Hierarchy

```
DashviewPanel (LitElement)
├── WeatherHeader
├── TabBar
├── HomeTab
│   ├── DwdWarnings
│   ├── RaeumeSection
│   │   ├── FloorTabs
│   │   └── RoomCardsGrid
│   │       ├── FloorOverviewCard
│   │       ├── GarbageCard
│   │       └── EntityCard(s)
│   └── OtherEntitiesSection
├── AdminTab
│   ├── RoomConfig
│   ├── CardConfig
│   └── OrderConfig
├── RoomPopup
│   ├── LightSection
│   ├── CoverSection
│   ├── ClimateSection
│   └── MediaSection
├── WeatherPopup
├── SecurityPopup
├── MediaPopup
└── ChangelogPopup
```

## Design Patterns

### 1. Reactive Stores

Stores use a publish-subscribe pattern:

```javascript
class Store {
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners(key, value) {
    this._listeners.forEach(fn => fn(key, value));
  }
}
```

### 2. Render Functions

Stateless render functions for UI components:

```javascript
export function renderComponent(html, { prop1, prop2 }) {
  return html`<div>${prop1}</div>`;
}
```

### 3. Factory Pattern

Singleton services via factory functions:

```javascript
let instance = null;
export function getService() {
  if (!instance) instance = new Service();
  return instance;
}
```

### 4. Gesture Handling

Swipe handlers with element dataset state:

```javascript
const handlers = createSwipeHandlers(
  () => goNext(),
  () => goPrev()
);
// State stored in element.dataset to persist across renders
```

## Data Flow

### Settings Load

```
1. DashviewPanel.connectedCallback()
2. → settingsStore.load()
3. → hass.callWS({ type: 'dashview/get_settings' })
4. → __init__.py:websocket_get_settings()
5. → Return stored settings
6. → Store notifies listeners
7. → Panel re-renders
```

### Entity State Update

```
1. HA entity state changes
2. → hass.states updated (reactive)
3. → DashviewPanel.set hass() called
4. → requestUpdate() triggers re-render
5. → EntityDisplayService.getDisplayInfo()
6. → UI reflects new state
```

### Settings Save

```
1. User changes setting
2. → settingsStore.set(key, value)
3. → Debounced save (500ms)
4. → hass.callWS({ type: 'dashview/save_settings' })
5. → __init__.py:websocket_save_settings()
6. → Store.async_save()
```

## Security Considerations

- **No External Dependencies**: Frontend loads lit from CDN only
- **Local Only**: IoT class is `local_push` (no cloud)
- **HA Auth**: Inherits HA authentication
- **No Sensitive Data**: Only entity preferences stored

## Performance Optimizations

1. **Dynamic Imports**: Modules loaded on-demand
2. **Cache Busting**: Version-based URL params
3. **Debounced Saves**: Settings saved after 500ms idle
4. **Skeleton Loading**: Immediate UI feedback
5. **Singleton Services**: Avoid recreation overhead
6. **CSS Variables**: Theme changes without re-render
