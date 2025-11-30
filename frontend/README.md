# DashView Frontend

A modular LitElement-based dashboard for Home Assistant.

## Architecture

```
frontend/
├── index.js              # Barrel export (single import point)
├── dashview-panel.js     # Main panel component
├── dashview-styles.js    # Global styles
│
├── components/           # Reusable UI components
│   ├── cards/           # Entity cards, skeletons
│   ├── controls/        # Toggle, slider, swipeable
│   └── layout/          # Pagination, chips, headers
│
├── features/            # Feature modules
│   ├── home/           # Home tab rendering
│   ├── admin/          # Admin configuration UI
│   ├── weather/        # Weather display
│   └── security/       # Security popups
│
├── services/            # Business logic
│   ├── entity-display-service.js
│   └── room-data-service.js
│
├── stores/              # State management
│   ├── settings-store.js    # Persisted settings
│   ├── ui-state-store.js    # Transient UI state
│   └── registry-store.js    # HA registry cache
│
├── utils/               # Utility functions
│   ├── formatters.js   # Date/time formatting
│   ├── helpers.js      # General utilities
│   ├── haptic.js       # Haptic feedback
│   └── icons.js        # Icon mapping
│
├── styles/              # Design system
│   ├── tokens.js       # Design tokens
│   └── base.js         # Base styles
│
└── constants/           # Shared constants
    └── index.js        # Domains, states, configs
```

## Quick Start

### Single Import

```javascript
import {
  // Components
  renderPagination,
  createSwipeHandlers,
  renderEntityCard,

  // Features
  renderHomeTab,
  renderAdminTab,

  // Utils
  formatLastChanged,
  getWeatherIcon,

  // Constants
  ENTITY_CONFIGS,
  WEATHER_CONDITIONS,

  // Stores
  getSettingsStore

} from './index.js';
```

### Direct Imports

```javascript
// Components
import { createSwipeHandlers } from './components/controls/swipeable.js';

// Features
import { renderHomeTab } from './features/home/index.js';

// Utils
import { formatLastChanged } from './utils/formatters.js';
```

## Component Pattern

All render functions follow this pattern:

```javascript
/**
 * @param {Function} html - lit-html template function
 * @param {Object} options - Component options
 * @returns {TemplateResult} Rendered HTML
 */
export function renderComponent(html, options) {
  return html`<div>...</div>`;
}
```

## Feature Pattern

Feature modules receive the panel instance:

```javascript
/**
 * @param {DashviewPanel} component - Panel instance with hass, state, methods
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Rendered HTML
 */
export function renderFeature(component, html) {
  const { hass, _areas, _enabledRooms } = component;
  return html`<div>...</div>`;
}
```

## State Management

Three stores manage different state types:

| Store | Persistence | Purpose |
|-------|-------------|---------|
| `SettingsStore` | Home Assistant | User configuration |
| `UIStateStore` | None (transient) | UI state (tabs, popups) |
| `RegistryStore` | Memory cache | HA registry data |

## Design Tokens

```javascript
import { COLORS, SPACING, RADIUS } from './styles/tokens.js';

// Use in components
const style = `
  padding: ${SPACING.md};
  background: ${COLORS.gray000};
  border-radius: ${RADIUS.md};
`;
```

## CSS Custom Properties

All styles use CSS custom properties for theming:

```css
--dv-gray000 to --dv-gray800   /* Gray scale */
--dv-accent                     /* Accent color */
--dv-active-gradient           /* Active state gradient */
--dv-light-gradient            /* Light active gradient */
```

## Version

Current version: **1.4.0**

Version is used for cache busting dynamic imports.
