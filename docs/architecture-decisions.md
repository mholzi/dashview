# Dashview Architecture Decisions

**Author:** Markus
**Date:** 2025-12-01
**Version:** 1.0
**Type:** Brownfield Enhancement

---

## Executive Summary

This document extends the existing Dashview architecture (v0.0.8) with decisions for four new pillars: internationalization, testing infrastructure, feature expansion framework, and admin UX improvements. The existing architecture remains unchanged; this document adds new patterns and conventions for the enhancement work.

---

## Existing Architecture (Preserved)

The following architectural decisions from v0.0.8 remain in effect:

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Module System | Pure ES Modules | No build step, cache-busted via version |
| UI Framework | LitElement + lit-html 2.8.0 | HA compatibility |
| State Management | Three-store pattern | Settings (persisted), UIState (transient), Registry (cached) |
| Communication | WebSocket API | Real-time bidirectional with HA |
| Styling | CSS Custom Properties + Design Tokens | Theming support |
| Backend | Python 3.11+ | HA integration requirements |

---

## New Architectural Decisions

### Decision 1: Internationalization (i18n)

#### Translation File Format
**Decision:** JSON files
**Rationale:** Simple, widely supported, no build step required, easy to edit

#### Translation File Location
**Decision:** `frontend/locales/{lang}.json`
**Structure:**
```
frontend/
└── locales/
    ├── en.json      # English (default)
    ├── de.json      # German
    └── index.js     # Translation loader
```

#### Translation Key Convention
**Decision:** Dot-separated hierarchy
**Pattern:** `{category}.{subcategory}.{key}`
**Examples:**
```json
{
  "sensor": {
    "motion": {
      "on": "Motion detected",
      "off": "No motion"
    },
    "window": {
      "open": "Open",
      "closed": "Closed"
    }
  },
  "ui": {
    "tabs": {
      "home": "Home",
      "admin": "Admin"
    },
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    }
  },
  "rooms": {
    "title": "Rooms",
    "noRooms": "No rooms configured"
  }
}
```

#### Translation Function
**Decision:** Simple `t(key, params?)` function
**Location:** `frontend/utils/i18n.js`
**Implementation:**
```javascript
// Singleton translation service
let translations = {};
let currentLang = 'en';

export async function initI18n(lang = 'en') {
  currentLang = lang;
  const module = await import(`../locales/${lang}.json`, { assert: { type: 'json' } });
  translations = module.default;
}

export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value !== 'string') return key; // Fallback to key

  // Simple parameter replacement: {name} → params.name
  return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}

export function getCurrentLang() {
  return currentLang;
}
```

#### Language Detection
**Decision:** `hass.language` with fallback to `en`
**Implementation:** Initialize in `dashview-panel.js` when `hass` is set
```javascript
set hass(hass) {
  const lang = hass?.language?.split('-')[0] || 'en';
  if (lang !== getCurrentLang()) {
    initI18n(lang).then(() => this.requestUpdate());
  }
  // ... existing hass setter logic
}
```

#### Affected Files (String Extraction)
| File | String Count (Est.) |
|------|---------------------|
| `entity-display-service.js` | ~50 |
| `features/home/index.js` | ~30 |
| `features/admin/index.js` | ~40 |
| `features/weather/index.js` | ~20 |
| `features/popups/*.js` | ~30 |
| `constants/german-text.js` | ~20 (to be replaced) |
| **Total** | ~190 strings |

---

### Decision 2: Testing Infrastructure

#### Test Runner
**Decision:** Vitest
**Version:** Latest stable (^2.0.0)
**Rationale:**
- Native ESM support (matches our pure ES modules)
- Fast execution
- Jest-compatible API
- Built-in coverage reporting

#### Test File Location
**Decision:** Co-located with source files
**Pattern:** `{filename}.test.js` next to `{filename}.js`
**Example:**
```
frontend/
├── stores/
│   ├── settings-store.js
│   ├── settings-store.test.js    # ← Tests here
│   ├── ui-state-store.js
│   └── ui-state-store.test.js
├── services/
│   ├── entity-display-service.js
│   └── entity-display-service.test.js
```

#### Mock Infrastructure Location
**Decision:** `frontend/__mocks__/` directory
**Structure:**
```
frontend/
├── __mocks__/
│   ├── hass.js              # Mock hass object factory
│   ├── websocket.js         # Mock WebSocket responses
│   └── lit.js               # Mock lit-html for unit tests
├── __fixtures__/
│   ├── areas.json           # Sample areas data
│   ├── entities.json        # Sample entity states
│   ├── devices.json         # Sample device registry
│   ├── labels.json          # Sample label registry
│   └── settings.json        # Sample settings
```

#### Mock Hass Object Design
**Decision:** Factory function with configurable state
**Location:** `frontend/__mocks__/hass.js`
```javascript
import areas from '../__fixtures__/areas.json';
import entities from '../__fixtures__/entities.json';

export function createMockHass(overrides = {}) {
  return {
    language: 'en',
    states: { ...defaultStates, ...overrides.states },
    callWS: vi.fn().mockImplementation(async ({ type }) => {
      switch (type) {
        case 'config/area_registry/list': return areas;
        case 'config/entity_registry/list': return entities.registry;
        case 'dashview/get_settings': return overrides.settings || {};
        case 'dashview/save_settings': return { success: true };
        default: return {};
      }
    }),
    callService: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

const defaultStates = {
  'light.living_room': { state: 'on', attributes: { brightness: 255, friendly_name: 'Living Room' } },
  'binary_sensor.motion_hall': { state: 'off', attributes: { friendly_name: 'Hall Motion' } },
  'sensor.temperature_living': { state: '21.5', attributes: { unit_of_measurement: '°C' } },
  // ... more default states
};
```

#### Test Configuration
**Decision:** `vitest.config.js` in project root
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['custom_components/dashview/frontend/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['custom_components/dashview/frontend/**/*.js'],
      exclude: ['**/__mocks__/**', '**/__fixtures__/**', '**/*.test.js']
    },
    globals: true
  }
});
```

#### Package.json Scripts
**Decision:** Add to root package.json (new file)
```json
{
  "name": "dashview",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "happy-dom": "^15.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0"
  }
}
```

#### CI Pipeline
**Decision:** GitHub Actions
**Location:** `.github/workflows/test.yml`
```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

#### Test Priority Order
| Priority | Module | Why |
|----------|--------|-----|
| 1 | `settings-store.js` | Core persistence, most complex |
| 2 | `ui-state-store.js` | Navigation state |
| 3 | `registry-store.js` | Data caching |
| 4 | `entity-display-service.js` | Business logic |
| 5 | `room-data-service.js` | Aggregation logic |
| 6 | `utils/*.js` | Helper functions |

---

### Decision 3: Project Structure Updates

#### New Directory Structure
```
dashview/
├── custom_components/dashview/
│   ├── __init__.py
│   ├── config_flow.py
│   ├── const.py
│   ├── manifest.json
│   ├── strings.json
│   └── frontend/
│       ├── dashview-panel.js
│       ├── index.js
│       │
│       ├── locales/                    # NEW: i18n
│       │   ├── en.json
│       │   ├── de.json
│       │   └── index.js
│       │
│       ├── __mocks__/                  # NEW: Test mocks
│       │   ├── hass.js
│       │   ├── websocket.js
│       │   └── lit.js
│       │
│       ├── __fixtures__/               # NEW: Test data
│       │   ├── areas.json
│       │   ├── entities.json
│       │   ├── devices.json
│       │   ├── labels.json
│       │   └── settings.json
│       │
│       ├── components/
│       │   └── *.js, *.test.js         # Tests co-located
│       ├── features/
│       │   └── *.js, *.test.js
│       ├── stores/
│       │   └── *.js, *.test.js
│       ├── services/
│       │   └── *.js, *.test.js
│       ├── utils/
│       │   ├── i18n.js                 # NEW: Translation utility
│       │   └── *.js, *.test.js
│       ├── styles/
│       └── constants/
│
├── .github/
│   └── workflows/
│       └── test.yml                    # NEW: CI pipeline
│
├── package.json                        # NEW: Node dependencies
├── vitest.config.js                    # NEW: Test config
├── .gitignore                          # UPDATE: Add node_modules
└── docs/
    └── *.md
```

#### .gitignore Updates
```gitignore
# Existing
.DS_Store
*.pyc
__pycache__/

# NEW: Node
node_modules/
coverage/
.vitest/
```

---

### Decision 4: Implementation Patterns

#### Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Translation keys | dot.separated.lowercase | `sensor.motion.on` |
| Test files | `{source}.test.js` | `settings-store.test.js` |
| Mock files | lowercase descriptive | `hass.js`, `websocket.js` |
| Fixture files | lowercase descriptive | `entities.json` |

#### Import Patterns

**Translations:**
```javascript
import { t, initI18n } from '../utils/i18n.js';

// In render
return html`<span>${t('sensor.motion.on')}</span>`;
```

**Tests:**
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockHass } from '../__mocks__/hass.js';
import { getSettingsStore } from './settings-store.js';
```

#### Error Handling in i18n
**Decision:** Return key as fallback, log warning in debug mode
```javascript
export function t(key, params = {}) {
  // ... lookup logic
  if (typeof value !== 'string') {
    if (DEBUG) console.warn(`Missing translation: ${key}`);
    return key;
  }
  // ...
}
```

#### Test Isolation Pattern
**Decision:** Reset stores between tests
```javascript
beforeEach(() => {
  // Reset singleton stores
  vi.resetModules();
});
```

---

## FR to Architecture Mapping

| FR Category | Architectural Component |
|-------------|------------------------|
| FR1-FR16 (Core Dashboard) | Existing architecture (unchanged) |
| FR17-FR24 (i18n) | `utils/i18n.js`, `locales/*.json` |
| FR25-FR35 (Admin) | `features/admin/` (existing) |
| FR36-FR42 (Testing) | `__mocks__/`, `__fixtures__/`, `*.test.js` |
| FR43-FR46 (Settings) | `stores/settings-store.js` (existing) |

---

## NFR to Architecture Mapping

| NFR | Architectural Support |
|-----|----------------------|
| NFR1-5 (Performance) | Existing architecture (unchanged) |
| NFR6-9 (Maintainability) | Testing infrastructure, co-located tests |
| NFR10-13 (Compatibility) | Existing architecture (unchanged) |
| NFR14-17 (Developer Experience) | Vitest, mocks, fixtures, CI |
| NFR18-20 (Security) | Existing architecture (unchanged) |

---

## Implementation Order

### Phase 1: Foundation
1. Add `package.json` and install dev dependencies
2. Create `vitest.config.js`
3. Create `__mocks__/hass.js` with basic mock
4. Create `__fixtures__/` with sample data
5. Write first test: `settings-store.test.js`
6. Set up GitHub Actions CI

### Phase 2: i18n
1. Create `utils/i18n.js` with `t()` function
2. Create `locales/en.json` (extract strings as you go)
3. Create `locales/de.json` (copy existing German strings)
4. Integrate `initI18n()` in `dashview-panel.js`
5. Replace hardcoded strings incrementally

### Phase 3: Test Coverage
1. Complete store tests (Settings, UIState, Registry)
2. Complete service tests (EntityDisplay, RoomData)
3. Add utility function tests
4. Reach 80% coverage target

### Phase 4: Admin UX (Future)
- Architectural changes TBD based on pain point analysis

---

## Architecture Decision Records (ADRs)

### ADR-001: JSON for Translations
**Status:** Accepted
**Context:** Need i18n without build step
**Decision:** JSON files loaded dynamically
**Consequences:** Simple, no tooling required, slightly larger payload

### ADR-002: Vitest over Jest
**Status:** Accepted
**Context:** Need test runner for pure ES modules
**Decision:** Vitest with happy-dom
**Consequences:** Native ESM, fast, modern API

### ADR-003: Co-located Tests
**Status:** Accepted
**Context:** Where to put test files
**Decision:** Tests next to source files
**Consequences:** Easy to find, clear ownership, no separate tree

### ADR-004: Factory Mock Pattern
**Status:** Accepted
**Context:** How to create mock hass objects
**Decision:** `createMockHass(overrides)` factory function
**Consequences:** Flexible, type-safe, easy to customize per test

---

## Summary

| Category | Decisions Made |
|----------|----------------|
| i18n | 6 (format, location, keys, function, detection, affected files) |
| Testing | 7 (runner, location, mocks, fixtures, config, CI, priority) |
| Structure | 4 (new dirs, gitignore, package.json, vitest config) |
| Patterns | 4 (naming, imports, errors, isolation) |
| **Total** | **21 architectural decisions** |

---

_This architecture document extends Dashview v0.0.8 for the four-pillar enhancement._

_Ready for implementation phase._
