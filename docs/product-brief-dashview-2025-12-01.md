# Product Brief: Dashview

**Date:** 2025-12-01
**Author:** Markus
**Context:** Brownfield Enhancement (existing v0.0.8)

---

## Executive Summary

Dashview is evolving from a functional German-only dashboard (v0.0.8) to a professional, testable, multi-language Home Assistant integration.

**Four Strategic Pillars:**

1. **Internationalization** - English as default, German supported, extensible for future languages. Follows HA's language setting.

2. **Local Testing Suite** - Comprehensive test coverage (unit, integration, E2E) that runs without Home Assistant. Mock infrastructure, Vitest + Playwright, CI-ready.

3. **Feature Expansion** - Iterative feature discovery framework. Backlog-driven development with clear story/epic process.

4. **Admin UX Overhaul** - Identified for improvement, specific pain points to be documented through usage analysis.

**MVP Focus:** i18n infrastructure + EN/DE support, test foundation with mock hass, framework for ongoing development.

**Target:** Smart home enthusiasts wanting a focused, touch-optimized dashboard, and developers wanting to contribute with confidence.

---

## Core Vision

### Initial Vision

Dashview v0.0.8 is a functional Home Assistant custom dashboard with label-based entity organization, room-centric navigation, weather integration, garbage collection tracking, and media control.

The next evolution focuses on four strategic pillars:

1. **Internationalization** - Full localization support for German and English
2. **Developer Experience** - Comprehensive local testing without Home Assistant installation
3. **Feature Expansion** - New capabilities (to be defined through discovery)
4. **Admin UX Overhaul** - Improved usability of the configuration interface

---

## Pillar 1: Internationalization (i18n)

### Current State
- All UI strings hardcoded in German throughout the codebase
- German labels in `entity-display-service.js`, `german-text.js`, feature modules
- No localization infrastructure exists

### Requirements
- **Default Language**: English
- **Supported Languages**: English (EN), German (DE)
- **Language Detection**: Follow Home Assistant's configured language
- **Override Option**: Admin setting to force specific language (future consideration)
- **Extensibility**: Architecture should support additional languages later

### Implementation Approach
- Extract all hardcoded strings to translation files (JSON or JS modules)
- Create translation key system (e.g., `t('sensor.motion.on')` → "Motion" / "Bewegung")
- Integrate with HA's language setting via `hass.language`
- Maintain German quality (native speaker review)

---

## Pillar 2: Local Testing Suite

### Current State
- No test files exist in the codebase
- Frontend tightly coupled to `hass` object
- No mock infrastructure for HA APIs
- Development requires full HA installation

### Requirements
- **Unit Tests**: Components, stores, services, utilities
- **Integration Tests**: Module interactions, data flow
- **E2E Tests**: Full panel behavior, user flows
- **No HA Dependency**: All tests run locally without Home Assistant
- **CI-Ready**: Tests must run in automated pipelines

### Testing Strategy

#### Mock Infrastructure
- Create comprehensive `hass` mock object with fixture data
- Mock WebSocket API responses (`dashview/get_settings`, `dashview/save_settings`)
- Mock HA registry APIs (areas, entities, devices, labels)
- Fixture data representing realistic smart home setup

#### Test Layers
| Layer | Scope | Tool |
|-------|-------|------|
| Unit | Stores, services, utils, pure functions | Vitest |
| Component | Render functions, UI components | Vitest + happy-dom/jsdom |
| Integration | Store ↔ Service ↔ Component flows | Vitest |
| E2E | Full panel, user interactions | Playwright |

#### Dev Environment
- Standalone dev server with mock HA backend
- Hot reload for rapid iteration
- Storybook-style component isolation (optional)
- Visual regression testing capability

### Success Criteria
- 80%+ code coverage on critical paths (stores, services)
- All tests pass without HA installation
- Tests complete in <60 seconds locally
- CI pipeline integration ready

---

## Pillar 3: Feature Expansion

### Approach
Features will be defined incrementally through ongoing discovery and user feedback. This Product Brief establishes the framework; specific features will be added as separate stories/epics.

### Current Capabilities (v0.0.8)
- Room cards with floor navigation
- Weather integration (DWD warnings, forecasts)
- Garbage collection tracking
- Media player control
- Scene buttons (global + per-room)
- Entity support: lights, covers, climate, locks, binary sensors, sensors

### Feature Backlog (To Be Defined)
| Priority | Feature | Status |
|----------|---------|--------|
| TBD | _To be discovered iteratively_ | Backlog |

### Discovery Process
- Features added through brainstorming sessions
- User feedback from daily usage
- Gap analysis vs HA native UI
- Each feature gets its own story with acceptance criteria

---

## Pillar 4: Admin UX Overhaul

### Approach
Specific UX improvements will be defined through usage observation and feedback. This pillar acknowledges the admin area needs attention.

### Current Admin Capabilities
- Room enable/disable toggles
- Floor card configuration (entity slots)
- Floor/room ordering
- Category label mapping
- Weather entity selection
- Garbage sensor selection
- Info text configuration
- Scene button management

### Known Pain Points (To Be Documented)
| Area | Issue | Priority |
|------|-------|----------|
| TBD | _To be identified through usage analysis_ | TBD |

### Improvement Goals
- Intuitive navigation and information architecture
- Clear feedback on actions (save, validation)
- Streamlined setup workflow for new users
- Better discoverability of features
- Mobile-friendly admin experience

---

## Problem Statement

Dashview v0.0.8 is functional but limited by:
1. **Language barrier** - Hardcoded German strings exclude English-speaking users
2. **Development friction** - No tests, requires full HA installation to develop
3. **Stagnant features** - No framework for systematic feature expansion
4. **Admin complexity** - Configuration UX needs refinement

---

## Target Users

### Primary Users

**Smart Home Enthusiasts** using Home Assistant who want:
- A cleaner, more focused dashboard than Lovelace
- Label-based organization that matches how they think about their home
- Touch-optimized interface for wall-mounted tablets
- Both German and English language support

### Secondary Users

**Developers/Contributors** who want to:
- Contribute to the project with confidence (tests!)
- Develop features without full HA setup
- Understand the codebase quickly (documentation exists)

---

## MVP Scope

### Core Features (Immediate Priority)

| Pillar | MVP Deliverable |
|--------|-----------------|
| **i18n** | Translation infrastructure + EN/DE support |
| **Testing** | Mock hass + unit tests for stores/services |
| **Features** | Framework established, backlog ready |
| **Admin UX** | Pain points documented, quick wins identified |

### Out of Scope for MVP
- Additional languages beyond EN/DE
- Visual regression testing
- Complete admin redesign
- New entity types

### Future Vision
- Multi-language support (community translations)
- Full E2E test coverage with Playwright
- Feature-rich dashboard rivaling commercial solutions
- Polished, intuitive admin experience

---

## Technical Preferences

- **No build step** - Maintain pure ES modules approach
- **Vitest** for unit/integration testing
- **Playwright** for E2E testing
- **JSON-based** translation files (or JS modules)
- **Maintain HA patterns** - Follow HA frontend conventions where sensible

---

## Success Criteria

| Pillar | Success Metric |
|--------|----------------|
| i18n | All UI strings externalized, EN/DE complete |
| Testing | 80%+ coverage on stores/services, CI passing |
| Features | Backlog process working, first feature shipped |
| Admin UX | User feedback collected, improvements identified |

---

_This Product Brief captures the vision and requirements for Dashview v0.1.0+._

_Pillars 3 (Features) and 4 (Admin UX) will be refined through iterative discovery._

_Next: Create PRD with detailed requirements and Architecture decisions._
