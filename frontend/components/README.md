# Components

Reusable UI components for DashView.

## Structure

```
components/
├── cards/          # Card components (entity cards, skeletons)
├── controls/       # Interactive controls (toggle, slider, swipeable)
├── layout/         # Layout components (pagination, chips, headers)
└── index.js        # Barrel export
```

## Usage

```javascript
import { renderPagination, createSwipeHandlers } from './components/index.js';

// Or import from specific module
import { renderEntityCard } from './components/cards/entity-card.js';
```

## Cards

| Component | Description |
|-----------|-------------|
| `renderEntityCard` | Renders an entity card with state, icon, and controls |
| `renderEntitySection` | Renders a section of entities with toggle switches |
| `renderSkeletonCard` | Loading placeholder for cards |
| `renderFloorOverviewSkeleton` | Loading placeholder for floor overview |
| `renderGarbageCardSkeleton` | Loading placeholder for garbage card |

## Controls

| Component | Description |
|-----------|-------------|
| `createSwipeHandlers` | Factory for touch/mouse swipe gesture handlers |
| `renderSwipeable` | Swipeable container component |
| `renderToggleSwitch` | On/off toggle switch |
| `renderSlider` | Numeric value slider |
| `renderSearchInput` | Search input with clear button |

## Layout

| Component | Description |
|-----------|-------------|
| `renderPagination` | Dot indicators for carousels |
| `renderFloorOverviewPagination` | Floor overview style pagination |
| `renderGarbagePagination` | Garbage card style pagination |
| `renderChip` | Small tag/badge component |
| `renderEmptyState` | Empty content messaging |
| `renderSectionHeader` | Section title with icon |

## Component Pattern

All render functions follow this pattern:

```javascript
/**
 * @param {Function} html - lit-html template function
 * @param {Object} options - Component options
 * @returns {TemplateResult} Rendered HTML
 */
export function renderComponent(html, options) {
  return html`...`;
}
```
