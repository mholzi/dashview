# Dashview Documentation

> **Version**: 0.0.8
> **Generated**: 2025-12-01
> **Scan Level**: Exhaustive

## Project Overview

**Dashview** is a Home Assistant Custom Component that provides a modern, label-based dashboard for smart home control. It features a Python backend integration and a JavaScript frontend panel built with LitElement.

### Key Features

- Label-based entity organization (use HA labels to categorize entities)
- Room-centric view with floor navigation
- Weather integration with DWD warnings
- Garbage collection tracking
- Media player control
- Scene buttons (global and per-room)
- Responsive design optimized for touch

### Quick Links

| Resource | Description |
|----------|-------------|
| [README](../README.md) | User documentation, installation, configuration |
| [GitHub](https://github.com/mholzi/dashview) | Source code repository |
| [Issues](https://github.com/mholzi/dashview/issues) | Bug reports and feature requests |

---

## Documentation Index

### Architecture & Design

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | System architecture, data flow, design patterns |
| [Source Tree Analysis](source-tree-analysis.md) | File structure, critical paths, dependencies |
| [Component Inventory](component-inventory.md) | Complete catalog of stores, services, components |

### Development

| Document | Description |
|----------|-------------|
| [Development Guide](development-guide.md) | Setup, workflow, patterns, troubleshooting |

### Existing Documentation

The project includes inline documentation in these locations:

| Document | Description |
|----------|-------------|
| [Frontend README](../custom_components/dashview/frontend/README.md) | Frontend architecture overview |
| [Components README](../custom_components/dashview/frontend/components/README.md) | UI components documentation |
| [Stores README](../custom_components/dashview/frontend/stores/README.md) | State management documentation |
| [Services README](../custom_components/dashview/frontend/services/README.md) | Business logic services |
| [Styles README](../custom_components/dashview/frontend/styles/README.md) | Design system documentation |
| [Utils README](../custom_components/dashview/frontend/utils/README.md) | Utility functions |
| [Constants README](../custom_components/dashview/frontend/constants/README.md) | Shared constants |
| [Features README](../custom_components/dashview/frontend/features/README.md) | Feature modules |

---

## Technology Stack Summary

| Layer | Technology | Description |
|-------|------------|-------------|
| **Backend** | Python 3.11+ | Home Assistant integration |
| **Frontend** | JavaScript ES2020 | LitElement-based UI |
| **UI Framework** | LitElement + lit-html | Web Components |
| **State** | Custom Stores | Reactive singleton pattern |
| **Communication** | WebSocket API | Real-time bidirectional |
| **Styling** | CSS Custom Properties | Design token system |

---

## Architecture Highlights

### Three-Store Pattern

| Store | Persistence | Purpose |
|-------|-------------|---------|
| **SettingsStore** | HA Storage (WebSocket) | User preferences, enabled entities |
| **UIStateStore** | Memory (transient) | Tabs, popups, carousel state |
| **RegistryStore** | Memory (cache) | HA areas, entities, labels |

### Module Structure

```
frontend/
├── components/     # Reusable UI (cards, controls, layout)
├── features/       # Feature modules (home, admin, weather)
├── stores/         # State management (settings, UI, registry)
├── services/       # Business logic (entity display, room data)
├── utils/          # Helpers (formatters, icons, haptic)
├── styles/         # Design tokens and base CSS
└── constants/      # Shared constants
```

### Key Design Decisions

1. **No Build Step** - Pure ES modules with dynamic imports
2. **Cache Busting** - Version-based URL parameters
3. **Singleton Services** - Factory functions for shared instances
4. **Label-Based** - Entities organized by HA labels, not domains
5. **Local Only** - No cloud dependencies (iot_class: local_push)

---

## File Statistics

| Category | Files | Description |
|----------|-------|-------------|
| Backend | 4 | Python integration code |
| Frontend Entry | 2 | Main panel and barrel export |
| Components | 12 | Reusable UI components |
| Features | 8 | Feature modules |
| Stores | 4 | State management |
| Services | 5 | Business logic |
| Utils | 7 | Helper functions |
| Styles | 3 | Design system |
| Constants | 4 | Shared constants |
| **Total** | **49** | Source files |

---

## Getting Started

### For Users

See [README.md](../README.md) for installation and configuration.

### For Developers

1. Read the [Development Guide](development-guide.md)
2. Review the [Architecture](architecture.md)
3. Explore the [Component Inventory](component-inventory.md)
4. Check inline README files for module-specific details

### Key Files to Understand

| File | Why Important |
|------|---------------|
| `__init__.py` | Backend entry point, WebSocket API |
| `dashview-panel.js` | Frontend entry, main LitElement class |
| `stores/settings-store.js` | User settings persistence |
| `services/entity-display-service.js` | Entity display logic |
| `features/home/index.js` | Main home tab rendering |

---

## Scan Report

This documentation was generated via exhaustive scan:

- **Scan Level**: Exhaustive (all source files read)
- **Files Analyzed**: 49 source files
- **Documentation Generated**: 5 new files
- **Existing Docs Referenced**: 9 inline README files

### Generated Files

1. `index.md` - This master index
2. `architecture.md` - System architecture
3. `source-tree-analysis.md` - File structure analysis
4. `component-inventory.md` - Component catalog
5. `development-guide.md` - Development workflow

---

*Documentation generated by BMAD Document Project workflow*
