# Dashview - Product Requirements Document

**Author:** Markus
**Date:** 2025-12-01
**Version:** 1.0

---

## Executive Summary

Dashview transforms Home Assistant control from a technical exercise into an intuitive, room-centric experience. While HA's native Lovelace dashboard offers unlimited flexibility, it requires significant configuration expertise and often results in cluttered, domain-organized interfaces.

Dashview takes the opposite approach: **simplicity through constraints**. By leveraging HA's label system, users organize entities once, and Dashview presents them in a clean, touch-optimized, room-centric view that matches how people actually think about their homes.

**Version 0.0.8** established the core experience. **This PRD defines the next evolution**: internationalization, developer experience (testing), iterative feature expansion, and admin UX improvements.

### What Makes This Special

**The Dashview Trifecta:**

1. **Simplicity** - Label-based organization eliminates Lovelace's configuration complexity. Set up labels once in HA, and Dashview handles the rest.

2. **Speed** - A focused, touch-optimized interface designed for wall-mounted tablets and quick interactions. No endless scrolling or hunting for entities.

3. **Room-Centric Mental Model** - Organized by floors and rooms, matching how people naturally think about their home ("turn off the living room lights") rather than technical domains ("toggle light.living_room_ceiling").

---

## Project Classification

**Technical Type:** web_app (HA plugin variant)
**Domain:** general (smart home)
**Complexity:** low (standard software practices)

This is a **brownfield enhancement** project - evolving an existing v0.0.8 codebase rather than greenfield development.

**Technology Stack:**
- Backend: Python 3.11+ (Home Assistant integration)
- Frontend: JavaScript ES2020+ (LitElement, Web Components)
- Communication: WebSocket API
- No build step: Pure ES modules

---

## Success Criteria

### Pillar 1: Internationalization
- All UI strings externalized into translation system
- English (default) and German translations complete
- Language follows HA's configured language automatically
- No hardcoded strings remain in codebase

### Pillar 2: Testing Suite
- 80%+ code coverage on stores and services
- All tests run without Home Assistant installation
- Mock `hass` object with realistic fixture data
- CI pipeline passing on every commit
- Test execution under 60 seconds locally

### Pillar 3: Feature Expansion
- Feature backlog process established
- At least one new feature shipped using the process
- Clear story/epic structure for future development

### Pillar 4: Admin UX
- Pain points documented from usage analysis
- Quick wins identified and prioritized
- Measurable improvement in setup workflow

### Overall Success
- Users can install and configure Dashview in under 10 minutes
- English-speaking users have full-quality experience
- Contributors can run tests and develop features without HA setup

---

## Product Scope

### MVP - Minimum Viable Product

**Pillar 1: i18n Infrastructure**
- Translation key system (`t('key')` function)
- JSON-based translation files (en.json, de.json)
- Integration with `hass.language`
- All existing German strings extracted and translated to English
- German translations preserved with native quality

**Pillar 2: Testing Foundation**
- Mock `hass` object with configurable state
- Mock WebSocket API responses
- Fixture data (areas, floors, entities, devices, labels)
- Unit tests for all 3 stores (Settings, UIState, Registry)
- Unit tests for services (EntityDisplay, RoomData)
- Test runner configured (Vitest)
- CI pipeline (GitHub Actions)

**Pillar 3: Feature Framework**
- Documented process for adding features
- Story template established
- Backlog management approach defined

**Pillar 4: Admin UX Foundation**
- Current admin UX documented
- User feedback collection method
- Pain point prioritization

### Growth Features (Post-MVP)

**i18n Expansion**
- Admin setting to override HA language
- Additional languages (community-contributed)
- RTL language support preparation

**Testing Expansion**
- Component-level tests (render functions)
- Integration tests (store ↔ service ↔ component)
- E2E tests with Playwright
- Visual regression testing
- Standalone dev server with mock HA backend

**Feature Expansion**
- Features defined through iterative discovery
- Each feature as separate epic with stories

**Admin UX Improvements**
- Specific improvements based on documented pain points
- Streamlined setup wizard
- Better feedback on actions

### Vision (Future)

- Community translation portal
- 95%+ test coverage
- Storybook-style component documentation
- Feature-rich dashboard rivaling commercial solutions
- Polished, intuitive admin experience
- Plugin system for community extensions

---

## Functional Requirements

### Core Dashboard (Existing - v0.0.8)

- FR1: Users can view all rooms organized by floor
- FR2: Users can navigate between floors using tab interface
- FR3: Users can tap room cards to open room detail popup
- FR4: Users can control lights (toggle, brightness) from room popup
- FR5: Users can control covers (open, close, position) from room popup
- FR6: Users can control climate devices from room popup
- FR7: Users can view and control media players
- FR8: Users can view weather information and forecasts
- FR9: Users can view DWD weather warnings
- FR10: Users can view garbage collection schedule
- FR11: Users can trigger scene buttons (global and per-room)
- FR12: Users can view motion sensor status
- FR13: Users can view window/door sensor status
- FR14: Users can view smoke detector status
- FR15: Users can view lock status
- FR16: Users can long-press entities to open HA more-info dialog

### Internationalization (New)

- FR17: System displays all UI text in user's preferred language
- FR18: System detects language from Home Assistant configuration
- FR19: System supports English as default language
- FR20: System supports German as secondary language
- FR21: All entity state labels are translated (On/Off, Open/Closed, etc.)
- FR22: All UI labels and buttons are translated
- FR23: All error messages are translated
- FR24: Date and time formatting follows locale conventions

### Admin Configuration (Existing + Enhanced)

- FR25: Administrators can enable/disable rooms per floor
- FR26: Administrators can configure floor card entity slots
- FR27: Administrators can reorder floors and rooms
- FR28: Administrators can map category labels to HA labels
- FR29: Administrators can select weather entity
- FR30: Administrators can select garbage collection sensors
- FR31: Administrators can configure info text items
- FR32: Administrators can configure scene buttons
- FR33: Administrators can upload custom person photos
- FR34: System provides feedback when settings are saved
- FR35: System validates configuration before saving

### Testing Infrastructure (New - Developer-Facing)

- FR36: Developers can run all tests without Home Assistant installed
- FR37: Developers can run tests with realistic mock data
- FR38: Test suite covers store initialization and state changes
- FR39: Test suite covers service business logic
- FR40: Test suite verifies WebSocket API interactions
- FR41: CI pipeline runs tests on every push/PR
- FR42: Test coverage reports are generated automatically

### Settings Persistence (Existing)

- FR43: User settings persist across browser sessions
- FR44: User settings sync via Home Assistant storage API
- FR45: Settings survive integration reload
- FR46: Settings can be exported/imported (future consideration)

---

## Non-Functional Requirements

### Performance

- NFR1: Initial panel load completes within 2 seconds
- NFR2: Room popup opens within 200ms of tap
- NFR3: Entity state updates reflect within 100ms of HA state change
- NFR4: Settings save completes within 500ms
- NFR5: No perceptible lag on touch interactions

### Maintainability

- NFR6: Codebase maintains pure ES modules (no build step)
- NFR7: All new code includes corresponding tests
- NFR8: Code follows existing patterns (stores, services, components)
- NFR9: Translation keys follow consistent naming convention

### Compatibility

- NFR10: Supports Home Assistant 2024.1.0 and newer
- NFR11: Supports modern browsers (Chrome, Firefox, Safari - last 2 versions)
- NFR12: Touch-optimized for tablet displays (7" - 12")
- NFR13: Responsive design adapts to different screen sizes

### Developer Experience

- NFR14: New developer can run tests within 5 minutes of clone
- NFR15: Test suite completes in under 60 seconds
- NFR16: Mock data is easily extensible for new test scenarios
- NFR17: Clear documentation for adding new features

### Security

- NFR18: Inherits Home Assistant authentication
- NFR19: No external API calls (local-only operation)
- NFR20: Settings stored securely via HA storage API

---

## UX Principles

### Visual Personality
- **Clean and focused** - No visual clutter, every element earns its place
- **Warm and residential** - Feels like a home controller, not enterprise software
- **Touch-first** - Large tap targets, swipe gestures, haptic feedback

### Interaction Patterns
- **Tap to act** - Single tap for primary action (toggle light)
- **Long-press to explore** - Long press opens HA more-info for power users
- **Swipe to navigate** - Carousel cards for floor overview, garbage
- **Progressive disclosure** - Simple view first, details on demand

### Key Interactions
- **Room card → Room popup** - Tap to dive into room control
- **Floor tabs** - Quick floor switching without scrolling
- **Scene buttons** - One-tap automation triggers
- **Admin toggle** - Easy switch between user/admin modes

### Design Constraints
- Maintain existing visual language (design tokens, gradients, spacing)
- No new dependencies (keep bundle size minimal)
- Respect HA theming where possible (light/dark mode)

---

## Reference Documents

| Document | Location | Description |
|----------|----------|-------------|
| Product Brief | `docs/product-brief-dashview-2025-12-01.md` | Strategic vision and pillars |
| Architecture | `docs/architecture.md` | System design and patterns |
| Component Inventory | `docs/component-inventory.md` | Stores, services, components catalog |
| Development Guide | `docs/development-guide.md` | Setup and workflow |

---

## PRD Summary

| Category | Count |
|----------|-------|
| Functional Requirements | 46 |
| Non-Functional Requirements | 20 |
| Pillars | 4 |
| MVP Deliverables | 4 major areas |

**Core Value:** Dashview delivers the trifecta of simplicity, speed, and room-centric design - making smart home control feel natural rather than technical.

---

_This PRD captures the evolution of Dashview from v0.0.8 to a professional, testable, multi-language Home Assistant dashboard._

_Created through collaborative discovery between Markus and AI facilitator._
