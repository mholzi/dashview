# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DashView is a Home Assistant custom integration that provides a comprehensive dashboard component with Shadow DOM support and custom CSS theming. It uses a component-based architecture with vanilla JavaScript and integrates deeply with Home Assistant's ecosystem.

## Technology Stack

- **Backend**: Python 3 (Home Assistant Integration)
- **Frontend**: Vanilla JavaScript (ES6+) with Web Components and Shadow DOM
- **Architecture**: Component-based modular design with centralized state management
- **No Build Process**: Uses native ES6 modules, no npm/build tools required

## Common Development Commands

### Testing
```bash
# Run comprehensive test suite (48+ tests)
./run_tests.sh

# Run simplified tests
./simple_test.sh

# Tests cover: config validation, frontend functionality, component isolation, 
# icon consistency, performance, security, and code quality
```

### Code Validation
```bash
# Python syntax validation
python -m py_compile custom_components/dashview/*.py

# JavaScript syntax validation  
node -c custom_components/dashview/www/dashview-panel.js

# Security checks
grep -r "innerHTML\|outerHTML" custom_components/dashview/www/
grep -r "eval\|Function" custom_components/dashview/www/
```

## Architecture Overview

### Backend Structure (`/custom_components/dashview/`)
- **Single API Endpoint**: `/api/dashview/config` handles all configuration operations
- **ConfigEntry Storage**: All persistent data stored in Home Assistant's ConfigEntry system
- **Registry Integration**: Automatic synchronization with HA floor, area, and entity registries
- **No External Dependencies**: Pure Python with no additional requirements

### Frontend Structure (`/www/`)
- **Main Panel**: `dashview-panel.js` - Core web component with Shadow DOM
- **State Management**: `lib/state-manager.js` - Centralized entity state management
- **Configuration**: `lib/config-manager.js` - Configuration data management
- **UI Managers**: 12 specialized managers in `/lib/ui/` directory for different components

### Key Frontend Components
- **AdminManager.js**: Admin panel functionality
- **FloorManager.js**: Floor/room layout management  
- **popup-manager.js**: Modal popup handling
- **weather-components.js**: Weather display and forecasts
- **security-components.js**: Security system integration
- **light-card.js**, **thermostat-card.js**, **media-player-card.js**: Device controls

## Core Architecture Principles

### 1. Centralized Data Persistence
- ALL configuration must use the `/api/dashview/config` endpoint
- NO direct file access to `/www/config/` or `.storage` directories
- ConfigEntry is the single source of truth for all settings

### 2. Shadow DOM with CSS Variable Injection
- Components use Shadow DOM for isolation
- Custom CSS properties automatically injected for theming
- Proper light/dark mode support throughout

### 3. Efficient State Management
- Use StateManager for granular entity subscriptions
- Components only update when their dependencies change
- NO monolithic re-renders of entire interface

### 4. Component-Based Architecture
- Reusable, testable components with clear separation of concerns
- Generic functions instead of duplicate code patterns
- Template-based UI generation

### 5. Error Handling and Debugging
- All console logs prefixed with `[DashView]`  
- Comprehensive try-catch blocks with user-friendly error messages
- DashViewDebug toolkit available in browser console

## Configuration System

### API Endpoints
**GET** `/api/dashview/config?type=<config_type>`
- `house` - House/room configuration
- `available_media_players` - Media player entities
- `entities_by_room` - Room-filtered entities  
- `weather_entity` - Weather configuration
- `integrations` - Integration settings

**POST** `/api/dashview/config`
- Save house configuration
- Update entity statistics
- Save integration settings

### Admin Panel
- Custom admin UI at `/local/dashview/admin.html`
- Maintains local state during editing
- Pessimistic UI updates - changes only reflected after backend confirmation
- NO standard Home Assistant options flow

## Entity Discovery

### Label-Based Discovery (Case-Insensitive)
- **Motion sensors**: "Motion", "motion", "MOTION", "bewegung"
- **Window sensors**: "Fenster", "fenster", "Window", "window"  
- **Smoke detectors**: "Rauchmelder", "smoke", "Smoke"
- **Vibration sensors**: "Vibration", "vibration"

## Performance Guidelines

- Initial load time target: < 2 seconds
- Component updates: < 100ms
- Memory growth: < 10MB per hour
- Use requestAnimationFrame for batched updates
- Lazy load non-critical components

## Security Requirements

- Validate and sanitize all user inputs
- Use proper MDI icon classes (avoid innerHTML injection)
- No eval() or Function() constructor usage
- Secure API communication with authentication

## Code Standards

### Naming Conventions
- **Classes/Components**: PascalCase (`DashViewComponent`)
- **Functions/Variables**: camelCase (`updateWeatherSection`)
- **CSS Classes**: kebab-case (`weather-card`)
- **Constants**: UPPER_CASE (`STORE_CONFIG_TYPES`)

### File Organization
- Components in logical groups by functionality
- Clear module boundaries and dependencies
- Consistent directory structure

### MDI Icons
- Use MDI consistently: `<i class="mdi mdi-icon-name"></i>`
- Weather cards exception: Use SVG icons from `/local/weather_icons/`
- Include fallback definitions for critical icons

## Testing Strategy

- 48+ individual test files covering all major functionality
- Component isolation testing
- Performance validation  
- Security checks
- Configuration validation
- Icon consistency verification

## Development Workflow

1. Use existing patterns and components when possible
2. Follow the 12 core principles from `copolit_instruction.md`
3. Run test suite before committing changes
4. Validate no direct file access patterns introduced
5. Ensure proper error handling and debugging support
6. Test admin panel state stability during hass updates