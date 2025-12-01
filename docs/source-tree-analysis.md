# Dashview Source Tree Analysis

## Project Structure Overview

```
dashview/
├── custom_components/dashview/     # Main integration (HOME ASSISTANT CUSTOM COMPONENT)
│   │
│   ├── __init__.py                 # 🔵 ENTRY POINT - Integration setup, WebSocket API
│   ├── config_flow.py              # Configuration flow for HA setup wizard
│   ├── const.py                    # Constants (DOMAIN, VERSION, URLs)
│   ├── manifest.json               # HA manifest (dependencies, version)
│   ├── strings.json                # Localization strings
│   │
│   └── frontend/                   # 🟢 FRONTEND APPLICATION
│       │
│       ├── dashview-panel.js       # 🔵 ENTRY POINT - Main LitElement panel (~42k tokens)
│       ├── index.js                # Barrel export (single import point)
│       │
│       ├── components/             # Reusable UI Components
│       │   ├── index.js
│       │   ├── cards/              # Card components
│       │   │   ├── entity-card.js      # Entity display card
│       │   │   ├── entity-item.js      # Entity list item
│       │   │   └── skeleton.js         # Loading skeletons
│       │   ├── controls/           # Interactive controls
│       │   │   ├── swipeable.js        # Touch/mouse swipe handling
│       │   │   ├── toggle-switch.js    # On/off toggle
│       │   │   ├── slider.js           # Value slider
│       │   │   ├── light-slider.js     # Light brightness slider
│       │   │   ├── search-input.js     # Search with clear button
│       │   │   └── entity-picker.js    # Entity selection dropdown
│       │   ├── layout/             # Layout components
│       │   │   ├── pagination.js       # Carousel dot indicators
│       │   │   ├── chip.js             # Tag/badge component
│       │   │   ├── empty-state.js      # Empty content message
│       │   │   ├── section-header.js   # Section titles
│       │   │   ├── popup-header.js     # Popup headers
│       │   │   └── activity-indicators.js
│       │   └── charts/             # Data visualization
│       │       └── temperature-chart.js
│       │
│       ├── features/               # Feature Modules
│       │   ├── home/               # Home tab
│       │   │   ├── index.js            # Room cards, floor overview, garbage
│       │   │   └── room-cards-grid.js
│       │   ├── admin/              # Admin configuration
│       │   │   └── index.js            # Settings UI, label mapping
│       │   ├── weather/            # Weather display
│       │   │   └── index.js            # Weather header, popup, forecasts
│       │   ├── security/           # Security features
│       │   │   └── popups.js           # Security & battery popups
│       │   └── popups/             # Modal popups
│       │       ├── room-popup.js       # Room detail popup
│       │       ├── weather-popup.js    # Weather detail popup
│       │       ├── media-popup.js      # Media player popup
│       │       └── changelog-popup.js  # Version changelog
│       │
│       ├── stores/                 # State Management
│       │   ├── index.js                # Store connector mixin
│       │   ├── settings-store.js       # 🔴 PERSISTED - User settings via WebSocket
│       │   ├── ui-state-store.js       # 🟡 TRANSIENT - UI state (tabs, popups)
│       │   └── registry-store.js       # 🟡 CACHED - HA registry data
│       │
│       ├── services/               # Business Logic
│       │   ├── index.js
│       │   ├── entity-display-service.js   # Icon/label/state display logic
│       │   ├── room-data-service.js        # Room data aggregation
│       │   ├── weather-service.js          # Weather data handling
│       │   └── status-service.js           # Status indicators
│       │
│       ├── utils/                  # Utility Functions
│       │   ├── index.js
│       │   ├── formatters.js           # Date/time formatting
│       │   ├── helpers.js              # General utilities
│       │   ├── entity-helpers.js       # Entity utility functions
│       │   ├── haptic.js               # Haptic feedback
│       │   ├── icons.js                # Icon mapping
│       │   └── entities.js             # Entity filtering
│       │
│       ├── styles/                 # Design System
│       │   ├── index.js                # Combined styles export
│       │   ├── tokens.js               # Design tokens (SPACING, COLORS, RADIUS)
│       │   └── base.js                 # Base CSS styles
│       │
│       └── constants/              # Shared Constants
│           ├── index.js                # Main constants export
│           ├── naming.js               # Entity naming conventions
│           ├── german-text.js          # German translations
│           └── changelog.js            # Version changelog data
│
├── README.md                       # User documentation
├── LICENSE                         # MIT License
├── hacs.json                       # HACS configuration
├── .gitignore
│
└── docs/                           # Generated documentation (this folder)
    └── ...
```

## Critical Paths

### Entry Points

| File | Purpose | Called By |
|------|---------|-----------|
| `__init__.py` | Integration setup, WebSocket API registration | Home Assistant |
| `dashview-panel.js` | Main UI panel, module loading | HA Frontend via panel_custom |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOME ASSISTANT                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Entity      │  │ Area/Floor  │  │ WebSocket API           │  │
│  │ States      │  │ Registries  │  │ dashview/get_settings   │  │
│  │             │  │             │  │ dashview/save_settings  │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
└─────────┼────────────────┼─────────────────────┼─────────────────┘
          │                │                     │
          ▼                ▼                     ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     DASHVIEW FRONTEND                        │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │                    STORES                             │   │
    │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │   │
    │  │  │ Settings    │ │ UIState     │ │ Registry        │ │   │
    │  │  │ (Persisted) │ │ (Transient) │ │ (Cached)        │ │   │
    │  │  └──────┬──────┘ └──────┬──────┘ └────────┬────────┘ │   │
    │  └─────────┼───────────────┼─────────────────┼──────────┘   │
    │            │               │                 │               │
    │            ▼               ▼                 ▼               │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │                   SERVICES                            │   │
    │  │  EntityDisplayService │ RoomDataService │ WeatherSvc  │   │
    │  └──────────────────────────────────────────────────────┘   │
    │            │                                                 │
    │            ▼                                                 │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │                FEATURES & COMPONENTS                  │   │
    │  │  Home │ Admin │ Weather │ Security │ Popups          │   │
    │  │       Cards │ Controls │ Layout │ Charts             │   │
    │  └──────────────────────────────────────────────────────┘   │
    │            │                                                 │
    │            ▼                                                 │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │              dashview-panel.js (Main Panel)           │   │
    │  └──────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────┘
```

## File Counts by Category

| Category | Files | Lines (Est.) |
|----------|-------|--------------|
| Backend (Python) | 4 | ~200 |
| Frontend Entry | 2 | ~1,500 |
| Components | 12 | ~1,200 |
| Features | 8 | ~2,000 |
| Stores | 4 | ~1,100 |
| Services | 5 | ~800 |
| Utils | 7 | ~600 |
| Styles | 3 | ~400 |
| Constants | 4 | ~300 |
| **Total** | **49** | **~8,100** |

## Module Dependencies

```
dashview-panel.js
├── styles/index.js
├── utils/index.js
├── constants/index.js
├── features/admin/index.js
├── features/security/popups.js
├── features/home/index.js
├── features/popups/room-popup.js
├── features/popups/weather-popup.js
├── features/popups/media-popup.js
├── features/popups/changelog-popup.js
├── stores/settings-store.js
├── stores/ui-state-store.js
└── stores/registry-store.js
```

## Integration Points

| Integration | Type | Location |
|-------------|------|----------|
| Home Assistant Frontend | Panel Custom | `__init__.py:async_setup_frontend()` |
| WebSocket API | Custom Commands | `__init__.py:websocket_*` |
| HA Storage | Persistent Store | `__init__.py:Store()` |
| Entity States | Real-time | `hass.states` |
| Area/Floor Registry | WebSocket | `config/area_registry/list` |
| Entity Registry | WebSocket | `config/entity_registry/list` |
| Device Registry | WebSocket | `config/device_registry/list` |
| Label Registry | WebSocket | `config/label_registry/list` |
