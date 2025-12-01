# Dashview Development Guide

## Prerequisites

- **Home Assistant** 2024.1.0 or newer
- **HACS** (Home Assistant Community Store) - for easy installation
- **Python** 3.11+ (HA requirement)
- **Modern Browser** with ES Module support

## Installation for Development

### Method 1: Direct Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mholzi/dashview.git
   ```

2. Create a symlink in your HA config:
   ```bash
   ln -s /path/to/dashview/custom_components/dashview \
         /path/to/homeassistant/config/custom_components/dashview
   ```

3. Restart Home Assistant

### Method 2: HACS Development

1. Add as custom repository in HACS
2. Install via HACS
3. Restart Home Assistant

## Project Structure

```
custom_components/dashview/
├── __init__.py           # Backend integration
├── config_flow.py        # Setup wizard
├── const.py              # Constants
├── manifest.json         # HA manifest
├── strings.json          # i18n
└── frontend/             # UI application
    ├── dashview-panel.js # Main entry
    └── ...               # Modules
```

## Development Workflow

### Frontend Development

The frontend uses **ES Modules** with no build step. Changes are reflected after browser refresh.

1. **Edit files** in `frontend/`
2. **Clear browser cache** (Cmd+Shift+R / Ctrl+Shift+R)
3. **Reload** the Dashview panel

**Version Cache Busting:**
Update `DASHVIEW_VERSION` in `dashview-panel.js` to force cache refresh:
```javascript
const DASHVIEW_VERSION = "1.9.12";  // Increment this
```

### Backend Development

1. **Edit Python files** in `custom_components/dashview/`
2. **Restart Home Assistant** (Settings → System → Restart)

### Debug Mode

Enable debug logging in `dashview-panel.js`:
```javascript
const DEBUG = true;  // Set to true for development
```

View logs in browser DevTools console.

## Architecture Patterns

### Component Pattern

All render functions follow this signature:
```javascript
/**
 * @param {Function} html - lit-html template function
 * @param {Object} options - Component options
 * @returns {TemplateResult}
 */
export function renderComponent(html, options) {
  return html`<div>...</div>`;
}
```

### Feature Pattern

Feature modules receive the panel instance:
```javascript
/**
 * @param {DashviewPanel} component - Panel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderFeature(component, html) {
  const { hass, _areas } = component;
  return html`<div>...</div>`;
}
```

### Store Pattern

Stores use singleton pattern with reactive updates:
```javascript
const store = getSettingsStore();
store.subscribe((key, value) => console.log(key, value));
store.set('weatherEntity', 'weather.home');
```

### Service Pattern

Services are singletons with factory functions:
```javascript
const service = getEntityDisplayService();
service.setEntityRegistry(entityRegistry);
const display = service.getDisplayInfo(entityId, state);
```

## Adding New Features

### 1. Create Feature Module

```javascript
// frontend/features/myfeature/index.js
export function renderMyFeature(component, html) {
  return html`
    <div class="my-feature">
      <!-- Feature content -->
    </div>
  `;
}
```

### 2. Add to Barrel Export

```javascript
// frontend/index.js
export { renderMyFeature } from './features/myfeature/index.js';
```

### 3. Import in Main Panel

```javascript
// dashview-panel.js
let myFeatureModule = null;
try {
  myFeatureModule = await import(`./features/myfeature/index.js?v=${VERSION}`);
} catch (e) { /* handle */ }
```

### 4. Add Styles

```javascript
// frontend/styles/index.js
// Add CSS for .my-feature class
```

## Adding UI Components

### 1. Create Component

```javascript
// frontend/components/controls/my-control.js
export function renderMyControl(html, { value, onChange }) {
  return html`
    <div class="my-control" @click=${onChange}>
      ${value}
    </div>
  `;
}
```

### 2. Export from Index

```javascript
// frontend/components/controls/index.js
export { renderMyControl } from './my-control.js';

// frontend/components/index.js
export { renderMyControl } from './controls/my-control.js';
```

## Working with Stores

### Settings Store (Persisted)

```javascript
import { getSettingsStore } from './stores/settings-store.js';

const store = getSettingsStore();

// Load from HA
await store.load();

// Get value
const weather = store.get('weatherEntity');

// Set value (auto-saves)
store.set('weatherEntity', 'weather.home');

// Toggle enabled entity
store.toggleEnabled('enabledLights', 'light.living_room');
```

### UI State Store (Transient)

```javascript
import { getUIStateStore } from './stores/ui-state-store.js';

const uiStore = getUIStateStore();

// Navigation
uiStore.setActiveTab('admin');
uiStore.openRoomPopup('area_id');
uiStore.closeAllPopups();

// Carousel
uiStore.setFloorOverviewIndex('floor_1', 2);
```

### Registry Store (Cached)

```javascript
import { getRegistryStore } from './stores/registry-store.js';

const registry = getRegistryStore();
registry.setHass(this.hass);

// Load data
await registry.loadAll();

// Access data
const areas = registry.areas;
const entities = registry.entityRegistry;
const labelIds = registry.labelIds;
```

## WebSocket API

### Get Settings

```javascript
const settings = await this.hass.callWS({
  type: 'dashview/get_settings'
});
```

### Save Settings

```javascript
await this.hass.callWS({
  type: 'dashview/save_settings',
  settings: { enabledRooms: {...}, ... }
});
```

### HA Registry APIs

```javascript
// Areas
const areas = await hass.callWS({ type: 'config/area_registry/list' });

// Floors
const floors = await hass.callWS({ type: 'config/floor_registry/list' });

// Entities
const entities = await hass.callWS({ type: 'config/entity_registry/list' });

// Devices
const devices = await hass.callWS({ type: 'config/device_registry/list' });

// Labels
const labels = await hass.callWS({ type: 'config/label_registry/list' });
```

## Design Tokens

Use design tokens for consistent styling:

```javascript
import { SPACING, COLORS, RADIUS } from './styles/tokens.js';

const style = `
  padding: ${SPACING.md};
  background: ${COLORS.gray000};
  border-radius: ${RADIUS.lg};
`;
```

### Available Tokens

| Category | Values |
|----------|--------|
| SPACING | xs, sm, md, lg, xl, 2xl, 3xl |
| RADIUS | sm, md, lg, xl, full |
| COLORS | gray000-800, green, purple, yellow, red, blue, orange |
| ICON_SIZE | xs, sm, md, lg, xl, 2xl, 3xl |
| Z_INDEX | dropdown, sticky, modal, popup, tooltip, max |

## CSS Custom Properties

All styles use CSS variables for theming:

```css
--dv-gray000 to --dv-gray800   /* Gray scale */
--dv-accent                     /* Accent color */
--dv-active-gradient           /* Active state gradient */
--dv-light-gradient            /* Light active gradient */
--dv-spacing-xs to --dv-spacing-3xl
--dv-radius-sm to --dv-radius-full
```

## Testing

### Manual Testing

1. Install integration in HA
2. Configure via Settings → Devices & Services → Dashview
3. Set up labels and areas in HA
4. Map labels in Dashview Admin

### Browser DevTools

- **Console**: Debug logs (enable `DEBUG = true`)
- **Network**: WebSocket messages
- **Application → Storage**: Check HA storage

## Deployment

### Version Bump

1. Update `const.py`:
   ```python
   VERSION = "0.0.9"
   ```

2. Update `manifest.json`:
   ```json
   "version": "0.0.9"
   ```

3. Update `DASHVIEW_VERSION` in `dashview-panel.js`

4. Update changelog in `frontend/constants/changelog.js`

### Release

1. Commit changes
2. Create git tag: `git tag v0.0.9`
3. Push with tags: `git push --tags`
4. HACS will detect new release

## Troubleshooting

### Panel Not Loading

1. Check HA logs for errors
2. Clear browser cache
3. Verify `manifest.json` dependencies
4. Check if static path is registered

### Settings Not Saving

1. Check WebSocket connection
2. Verify `Store` permissions
3. Check browser console for errors

### Styles Not Applied

1. Increment `DASHVIEW_VERSION`
2. Clear browser cache
3. Check CSS variable definitions
