# Features

Feature modules containing view-specific rendering logic.

## Structure

```
features/
├── home/           # Home tab (rooms, floor overview, garbage)
├── admin/          # Admin configuration UI
├── weather/        # Weather display and forecasts
└── security/       # Security popups and alerts
```

## Home Feature

Renders the main home dashboard.

```javascript
import { renderHomeTab, renderFloorOverviewCard } from './features/home/index.js';
```

| Function | Description |
|----------|-------------|
| `renderHomeTab` | Main home tab container |
| `renderRaeumeSection` | Rooms section with floor tabs |
| `renderFloorOverviewCard` | Swipeable room overview card |
| `renderRoomCardsGrid` | Grid of entity cards |
| `renderGarbageCard` | Garbage pickup schedule card |
| `renderDwdWarnings` | DWD weather warnings |

## Admin Feature

Configuration interface for DashView settings.

```javascript
import { renderAdminTab, renderRoomConfig } from './features/admin/index.js';
```

| Function | Description |
|----------|-------------|
| `renderAdminTab` | Admin tab with sub-navigation |
| `renderRoomConfig` | Room enable/disable configuration |
| `renderFloorCardsConfig` | Floor card entity selection |
| `renderCardConfig` | Card settings (weather, garbage, etc.) |
| `renderOrderConfig` | Floor and room ordering |
| `renderAreaCard` | Individual area configuration card |

## Weather Feature

Weather display and forecasts.

```javascript
import { renderWeatherHeader, renderWeatherPopup } from './features/weather/index.js';
```

| Function | Description |
|----------|-------------|
| `renderWeatherHeader` | Compact weather summary for header |
| `renderWeatherPopup` | Full weather popup with forecasts |
| `renderDwdWarnings` | German weather service warnings |

## Security Feature

Security-related popups and displays.

```javascript
import { renderSecurityPopupContent } from './features/security/popups.js';
```

| Function | Description |
|----------|-------------|
| `renderSecurityPopupContent` | Windows, garages, motion sensors status |
| `renderBatteryPopupContent` | Low battery device alerts |

## Feature Pattern

All feature render functions receive the panel instance and html:

```javascript
/**
 * @param {DashviewPanel} component - The panel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Rendered HTML
 */
export function renderFeature(component, html) {
  return html`...`;
}
```
