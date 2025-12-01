# Dashview Component Inventory

## Overview

This document catalogs all UI components, services, and stores in the Dashview frontend.

## Stores

### SettingsStore

**Location**: `stores/settings-store.js`
**Type**: Persisted (WebSocket → HA Storage)

| Property | Type | Description |
|----------|------|-------------|
| `enabledRooms` | `Object<string, boolean>` | Enabled room areas |
| `enabledLights` | `Object<string, boolean>` | Enabled light entities |
| `enabledMotionSensors` | `Object<string, boolean>` | Enabled motion sensors |
| `enabledSmokeSensors` | `Object<string, boolean>` | Enabled smoke sensors |
| `enabledCovers` | `Object<string, boolean>` | Enabled cover entities |
| `enabledMediaPlayers` | `Object<string, boolean>` | Enabled media players |
| `enabledGarages` | `Object<string, boolean>` | Enabled garage doors |
| `enabledWindows` | `Object<string, boolean>` | Enabled window sensors |
| `enabledVibrationSensors` | `Object<string, boolean>` | Enabled vibration sensors |
| `enabledTemperatureSensors` | `Object<string, boolean>` | Enabled temp sensors |
| `enabledHumiditySensors` | `Object<string, boolean>` | Enabled humidity sensors |
| `enabledClimates` | `Object<string, boolean>` | Enabled thermostats |
| `enabledTVs` | `Object<string, boolean>` | Enabled TV entities |
| `enabledLocks` | `Object<string, boolean>` | Enabled lock entities |
| `weatherEntity` | `string` | Main weather entity ID |
| `floorOrder` | `string[]` | Floor display order |
| `roomOrder` | `Object<string, string[]>` | Room order per floor |
| `floorCardConfig` | `Object` | Floor card slot configuration |
| `garbageSensors` | `string[]` | Garbage collection sensors |
| `infoTextConfig` | `Object` | Header status item config |
| `sceneButtons` | `SceneButton[]` | Global scene buttons |
| `roomSceneButtons` | `Object<string, SceneButton[]>` | Per-room scenes |
| `categoryLabels` | `Object<string, string>` | Label ID mappings |
| `userPhotos` | `Object<string, string>` | Custom person photos |

**Methods**:
- `load()` - Load from HA
- `save()` - Save to HA (debounced)
- `saveNow()` - Immediate save
- `get(key)` - Get setting
- `set(key, value)` - Set and save
- `toggleEnabled(mapKey, entityId)` - Toggle entity
- `subscribe(listener)` - Subscribe to changes

---

### UIStateStore

**Location**: `stores/ui-state-store.js`
**Type**: Transient (Memory only)

| Property | Type | Description |
|----------|------|-------------|
| `activeTab` | `string` | Current main tab |
| `activeFloorTab` | `string` | Current floor tab |
| `activeSecurityTab` | `string` | Security popup tab |
| `adminSubTab` | `string` | Admin section tab |
| `popupRoom` | `string\|null` | Open room popup area_id |
| `weatherPopupOpen` | `boolean` | Weather popup state |
| `securityPopupOpen` | `boolean` | Security popup state |
| `batteryPopupOpen` | `boolean` | Battery popup state |
| `mediaPopupOpen` | `boolean` | Media popup state |
| `floorOverviewIndex` | `Object<string, number>` | Carousel indices |
| `garbageCardIndex` | `number` | Garbage card index |
| `expandedAreas` | `Object<string, boolean>` | Expanded sections |
| `motionDetected` | `boolean` | Motion state |

**Methods**:
- `setActiveTab(tab)` - Set main tab
- `openRoomPopup(areaId)` - Open room popup
- `closeRoomPopup()` - Close room popup
- `closeAllPopups()` - Close all popups
- `toggle(key)` - Toggle boolean
- `subscribe(listener)` - Subscribe to changes

---

### RegistryStore

**Location**: `stores/registry-store.js`
**Type**: Cached (Memory)

| Property | Type | Description |
|----------|------|-------------|
| `areas` | `Area[]` | HA areas |
| `floors` | `Floor[]` | HA floors |
| `entityRegistry` | `Entity[]` | Entity registry |
| `deviceRegistry` | `Device[]` | Device registry |
| `labels` | `Label[]` | Label registry |
| `labelIds` | `Object<string, string>` | Resolved label IDs |
| `scenes` | `Scene[]` | Available scenes |
| `weatherForecasts` | `Forecast[]` | Daily forecasts |
| `weatherHourlyForecasts` | `Forecast[]` | Hourly forecasts |

**Methods**:
- `loadAreas()` - Fetch areas/floors
- `loadEntities()` - Fetch entities/devices/labels
- `loadAll()` - Fetch all registries
- `getAreasForFloor(floorId)` - Filter areas
- `getEntitiesForAreaByLabel(areaId, labelId)` - Filter entities
- `subscribe(listener)` - Subscribe to changes

---

## Services

### EntityDisplayService

**Location**: `services/entity-display-service.js`

Provides display information (icons, labels, CSS classes) for entities.

| Method | Returns | Description |
|--------|---------|-------------|
| `setEntityRegistry(registry)` | void | Set entity registry |
| `setLabelIds(labelIds)` | void | Set label ID mappings |
| `getDisplayInfo(entityId, state)` | DisplayInfo | Get entity display |
| `hasLabel(entityId, labelType)` | boolean | Check entity label |

**DisplayInfo Object**:
```javascript
{
  icon: 'mdi:lightbulb',
  labelText: 'An (80%)',
  cardClass: 'active-light',
  friendlyName: 'Living Room Light',
  state: {...},
  entityId: 'light.living_room'
}
```

**Supported Entity Types**:
- `light` - Brightness, on/off
- `cover` - Position, open/closed
- `climate` - Temperature, HVAC action
- `lock` - Lock state
- `binary_sensor` - Motion, window, garage, smoke, vibration
- `sensor` - Temperature, humidity, power, etc.

---

### RoomDataService

**Location**: `services/room-data-service.js`

Aggregates room/area data from entities.

| Method | Returns | Description |
|--------|---------|-------------|
| `getRoomData(areaId)` | RoomData | Aggregated room state |
| `getRoomTemperature(areaId)` | number | Room temperature |
| `getRoomMotionState(areaId)` | boolean | Motion detected |

**RoomData Object**:
```javascript
{
  hasMotion: boolean,
  hasLightsOn: boolean,
  temperature: number,
  humidity: number,
  isActive: boolean,
  openWindows: number
}
```

---

## Components

### Controls

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `renderSwipeable` | `swipeable.js` | `onSwipeLeft, onSwipeRight, content` | Swipeable container |
| `createSwipeHandlers` | `swipeable.js` | `onSwipeLeft, onSwipeRight, threshold` | Swipe handler factory |
| `renderToggleSwitch` | `toggle-switch.js` | `checked, onChange` | On/off toggle |
| `renderSlider` | `slider.js` | `value, min, max, onChange` | Value slider |
| `renderLightSlider` | `light-slider.js` | `entityId, brightness, onBrightnessChange` | Light brightness |
| `renderSearchInput` | `search-input.js` | `value, onChange, onClear, placeholder` | Search with clear |
| `renderEntityPicker` | `entity-picker.js` | `entities, selectedId, onSelect` | Entity dropdown |

### Cards

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `renderEntityCard` | `entity-card.js` | `entityId, displayInfo, onClick` | Entity display card |
| `renderEntitySection` | `entity-item.js` | `entities, onToggle` | Entity list section |
| `renderSkeletonCard` | `skeleton.js` | `isBig` | Loading skeleton |
| `renderFloorOverviewSkeleton` | `skeleton.js` | - | Floor overview skeleton |
| `renderGarbageCardSkeleton` | `skeleton.js` | - | Garbage card skeleton |
| `renderRoomCardSkeleton` | `skeleton.js` | `isBig` | Room card skeleton |

### Layout

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `renderPagination` | `pagination.js` | `total, current, onSelect` | Dot indicators |
| `renderFloorOverviewPagination` | `pagination.js` | `total, current, onSelect` | Floor pagination |
| `renderGarbagePagination` | `pagination.js` | `total, current, onSelect` | Garbage pagination |
| `renderChip` | `chip.js` | `label, icon, onClick` | Tag/badge |
| `renderEmptyState` | `empty-state.js` | `message, icon` | Empty content |
| `renderSectionHeader` | `section-header.js` | `title, icon` | Section title |
| `renderPopupHeader` | `popup-header.js` | `title, onClose` | Popup header |
| `renderActivityIndicators` | `activity-indicators.js` | `items` | Status indicators |

### Charts

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `renderTemperatureChart` | `temperature-chart.js` | `history, entityId` | Temperature graph |

---

## Features

### Home

| Function | File | Description |
|----------|------|-------------|
| `renderHomeTab` | `index.js` | Main home tab container |
| `renderRaeumeSection` | `index.js` | Rooms section with floor tabs |
| `renderRoomCardsGrid` | `index.js` | Room card grid layout |
| `renderFloorOverviewCard` | `index.js` | Swipeable room overview |
| `renderGarbageCard` | `index.js` | Waste collection card |
| `renderDwdWarnings` | `index.js` | Weather warnings |
| `renderTrainDepartures` | `index.js` | Train schedule |
| `renderOtherEntitiesSection` | `index.js` | Custom label entities |

### Admin

| Function | File | Description |
|----------|------|-------------|
| `renderAdminTab` | `index.js` | Admin settings container |
| `renderRoomConfig` | `index.js` | Room enable/disable |
| `renderCardConfig` | `index.js` | Floor card configuration |
| `renderOrderConfig` | `index.js` | Floor/room ordering |
| `renderLabelMapping` | `index.js` | Category label mapping |
| `renderAreaCard` | `index.js` | Area configuration card |

### Weather

| Function | File | Description |
|----------|------|-------------|
| `renderWeatherHeader` | `index.js` | Header weather display |
| `renderWeatherPopup` | `index.js` | Full weather popup |
| `getWeatherIcon` | `index.js` | Weather condition icon |
| `translateWeatherCondition` | `index.js` | German translation |

### Security

| Function | File | Description |
|----------|------|-------------|
| `renderSecurityPopupContent` | `popups.js` | Security status popup |
| `renderBatteryPopupContent` | `popups.js` | Low battery popup |

### Popups

| Function | File | Description |
|----------|------|-------------|
| `renderRoomPopup` | `room-popup.js` | Room detail popup |
| `renderWeatherPopup` | `weather-popup.js` | Weather detail popup |
| `renderMediaPopup` | `media-popup.js` | Media player popup |
| `renderChangelogPopup` | `changelog-popup.js` | Version changelog |

---

## Utilities

| Function | File | Description |
|----------|------|-------------|
| `formatLastChanged` | `formatters.js` | Format entity last_changed |
| `formatTime` | `formatters.js` | Format time string |
| `formatDate` | `formatters.js` | Format date string |
| `triggerHaptic` | `haptic.js` | Trigger haptic feedback |
| `getFloorIcon` | `icons.js` | Get floor icon |
| `getAreaIcon` | `icons.js` | Get area icon |
| `getWeatherIcon` | `icons.js` | Get weather icon |
| `getFriendlyName` | `helpers.js` | Get entity friendly name |
| `openMoreInfo` | `helpers.js` | Open HA more-info dialog |
| `toggleLight` | `helpers.js` | Toggle light entity |

---

## Constants

| Export | File | Description |
|--------|------|-------------|
| `DOMAINS` | `index.js` | Entity domain constants |
| `STATES` | `index.js` | State value constants |
| `ICONS` | `index.js` | Default icons |
| `ENTITY_CONFIGS` | `index.js` | Entity type configurations |
| `WEATHER_CONDITIONS` | `index.js` | Weather condition map |
| `WEATHER_ICONS` | `index.js` | Weather icons |
| `THRESHOLDS` | `index.js` | Various thresholds |

---

## Design Tokens

| Export | File | Values |
|--------|------|--------|
| `SPACING` | `tokens.js` | xs(4), sm(8), md(12), lg(16), xl(20), 2xl(24), 3xl(32) |
| `RADIUS` | `tokens.js` | sm(8), md(12), lg(16), xl(20), full(100) |
| `COLORS` | `tokens.js` | gray000-800, green, purple, yellow, red, blue, orange |
| `ICON_SIZE` | `tokens.js` | xs(14), sm(18), md(22), lg(24), xl(28), 2xl(32), 3xl(48) |
| `SHADOWS` | `tokens.js` | light, medium, heavy |
| `GRADIENTS` | `tokens.js` | active, light, media |
| `Z_INDEX` | `tokens.js` | dropdown(100), modal(1000), popup(9000) |
| `MIXINS` | `tokens.js` | flexCenter, absoluteFill, textEllipsis |
