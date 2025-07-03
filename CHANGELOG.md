# Changelog

All notable changes to DashView will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2025-07-03

### ✨ Major Features

#### 🏠 Enhanced Admin Section - Room-Based Entity Management (#471)
- **Complete admin panel overhaul**: Transformed device and sensor management from global, type-centric approach to intuitive, room-centric workflow
- **Instant persistence**: Individual entity checkbox changes and ignore actions save immediately to backend with visual feedback
- **New entity detection**: Automatic discovery and highlighting of newly added Home Assistant entities with confirmation workflow
- **Granular control**: Users can assign, unassign, ignore, or un-ignore entities individually per room
- **Room confirmation**: Dedicated "Confirm Room Setup" button to acknowledge new entities and maintain up-to-date dashboard
- **Enhanced UI**: Status badges (New!, Configured, Ignored), save indicators, and improved error handling
- **Backend API enhancements**: New granular endpoints for entity status updates and room confirmation

#### 🎯 Entity Detail Popup Actions (#468)
- **Integrated entity actions**: Added hide and favorite functionality directly in entity detail popups
- **Removed tab action menu**: Streamlined floor section by moving actions to more intuitive popup location
- **Enhanced user experience**: Direct access to entity management from detail views with immediate feedback

### 🐛 Bug Fixes

#### 🎵 Media Popup Styling (#467)
- **Fixed container gaps**: Ensured consistent 8px spacing between containers (except header)
- **Removed horizontal lines**: Eliminated unwanted separators between rooms and core media container
- **Added gray100 background**: Applied consistent background color to full core media container including presets
- **Enhanced tab styling**: Added comprehensive music popup styling for better visual consistency

### 🔧 Technical Improvements

#### Backend Enhancements
- **New API endpoints**: Added `entity_status_update` and `confirm_room_setup` for granular management
- **Enhanced entity discovery**: Room-specific entity queries with configuration status tracking
- **Persistent storage**: Added `ignored_entities` list per room with proper ConfigEntry persistence
- **Status tracking**: Comprehensive entity state management (configured, ignored, newly discovered)

#### Frontend Architecture
- **Instant persistence handlers**: Real-time processing of checkbox and ignore button interactions
- **Enhanced AdminManager**: Updated with async/await throughout for better error handling
- **Optimistic UI updates**: Immediate visual feedback with automatic rollback on API failures
- **Improved state management**: Better tracking of entity status and room configuration state

### 🔄 Migration Notes
- **Backward compatibility**: All existing room configurations remain fully compatible
- **Automatic initialization**: New `ignored_entities` structure automatically initialized for existing rooms
- **Enhanced API**: New endpoints are fully backward compatible with existing functionality
- **No breaking changes**: All previous admin functionality preserved while adding new capabilities

### 👥 Contributors
- @mholzi - Complete implementation of enhanced admin section, entity popup actions, and media popup fixes

**Full Changelog**: https://github.com/mholzi/dashview/compare/v0.5.12...v0.6.0

## [0.5.3] - 2024-07-01

### 🐛 Bug Fixes

#### Custom Cards Management (#348)
- **Fixed custom cards persistence**: Custom cards now properly persist across page refreshes and navigation
- **Added visibility toggle controls**: New checkbox control for showing/hiding custom cards in main dashboard  
- **Enhanced admin interface**: Improved custom card form with visibility state handling and better user feedback
- **Main dashboard integration**: Custom cards now properly respect visibility settings when rendering in info-text area
- **Form management**: Enhanced form clearing and editing with proper visibility state preservation
- **Backward compatibility**: Existing custom cards without explicit visibility setting default to visible

#### Configuration & Admin Panel (#347)
- **Fixed Configuration Summary auto-loading**: Configuration Summary now loads automatically when accessing admin tabs
- **Enhanced configuration metrics**: Added comprehensive configuration health metrics and entity statistics  
- **Improved admin experience**: Better status messages and real-time feedback throughout admin interface
- **Performance optimization**: Optimized configuration loading and display rendering for faster response times

#### Weather System (#346)
- **Enhanced weather chart error handling**: Implemented robust error handling for weather forecast chart failures
- **Added table fallback**: Automatic fallback to table display when chart rendering fails due to data issues
- **Improved user experience**: Better error messages and graceful degradation for weather data problems
- **Chart.js integration**: Proper error boundary handling for Chart.js component failures

#### Room Management (#345)  
- **Fixed door entity console errors**: Resolved console errors from door entities that were blocking room popup functionality
- **Enhanced entity validation**: Improved entity data validation to prevent UI blocking errors and crashes
- **Improved popup stability**: Room popups now load reliably even with problematic entity configurations
- **Better error recovery**: Enhanced error handling to maintain UI functionality when individual entities fail

#### Entity Display & Localization (#341, #342)
- **Corrected door state labels**: Fixed door entity labels to use 'Zu' for unlocked state (proper German localization)
- **Fixed mower entity display**: Added missing name field in mower entity display data preventing proper rendering
- **Improved label consistency**: Enhanced entity label consistency and proper state representation across dashboard
- **German localization**: Better German language support for entity states and labels

#### Authentication & API Integration (#339)
- **Resolved calendar authentication**: Fixed HTTP 401 authentication errors affecting calendar integration and event loading
- **Enhanced API reliability**: Improved API error handling and retry mechanisms for better service integration  
- **Better session management**: Enhanced authentication session handling and token refresh capabilities
- **Service integration**: Improved integration with Home Assistant's calendar and authentication services

#### Admin Interface Improvements
- **Added missing event handlers**: Fixed Room Configuration Overview configure buttons that were not responding to clicks
- **Enhanced form validation**: Improved input validation across admin forms with better error messages
- **Better user feedback**: Enhanced status messages and error reporting throughout admin interface
- **Stability improvements**: Better error handling to prevent admin interface crashes

### 🔧 Technical Improvements

#### Testing & Quality Assurance
- **Comprehensive test suites**: Added extensive test coverage for custom cards (7 test cases), weather components, and door entities
- **Error handling validation**: Implemented test cases for error scenarios and edge cases to prevent regressions
- **Integration testing**: Added tests for component interaction and data flow validation
- **Code quality**: Enhanced error handling and logging throughout codebase

#### Data Structure Enhancements
- **Extended custom card schema**: Custom card objects now include `visible` property for granular display control
- **Maintained backward compatibility**: Existing custom cards without visibility setting automatically default to visible
- **Improved entity validation**: Enhanced entity data structure validation and error handling
- **Better state management**: Improved component state management and data persistence

#### User Interface & Experience
- **Enhanced admin feedback**: Improved status messages and user feedback throughout admin interface
- **Better error display**: More informative error messages with actionable guidance for users
- **Form validation improvements**: Strengthened input validation with clear, helpful error messages
- **Visual consistency**: Improved visual feedback and status indicators across admin interface

#### Performance & Security
- **Optimized configuration loading**: Enhanced configuration loading with better caching and error handling
- **Memory management**: Improved component lifecycle management and memory usage optimization
- **Enhanced security**: Strengthened input validation and API security throughout application
- **Error boundary handling**: Better error isolation to prevent cascading failures

### 🧪 Testing

- **Custom Cards**: 7 comprehensive test cases covering persistence, visibility, validation, and integration
- **Weather Components**: Error handling and fallback mechanism testing  
- **Door Entities**: Entity validation and error handling test coverage
- **Admin Interface**: Form validation and user feedback testing
- **Integration Tests**: Component interaction and data flow validation

### 📦 Migration Guide

For users upgrading from v0.5.2:

1. **Custom Cards**: Existing custom cards will automatically default to visible. Use the new visibility toggle in admin panel to control display.
2. **Configuration**: No configuration changes required - all improvements are backward compatible.
3. **Performance**: Clear browser cache after updating for optimal performance.
4. **Restart Recommendation**: Restart Home Assistant after updating for best stability.

### 🎯 Impact

- **8 GitHub issues resolved**: #339, #341, #342, #345, #346, #347, #348 plus additional improvements
- **Enhanced stability**: Significantly improved error handling and component reliability
- **Better user experience**: More intuitive admin interface with immediate feedback
- **Comprehensive testing**: Added 15+ new test cases ensuring feature stability

**Full Changelog**: https://github.com/mholzi/dashview/compare/v0.5.2...v0.5.3

## [0.5.1] - 2025-07-01

### 🐛 Bug Fixes

- **Calendar Error Handling** - Improved calendar error handling and diagnostics (#335)
  - Enhanced backend error validation with entity existence checks
  - Structured error responses with error type categorization (`entity_not_found`, `service_call_failed`)
  - Detailed frontend error messages replacing generic "Fehler beim Laden der Termine"
  - User-friendly error guidance directing to Admin → Calendar configuration
  - Retry functionality for failed calendar requests
  - Enhanced debug logging with `[DashView]` prefixes for better troubleshooting
  - Graceful handling of partial calendar failures (some work, others don't)

### 🔧 Technical Improvements

- **Error Diagnostics** - Comprehensive error reporting and debugging capabilities
  - Backend entity validation before Home Assistant service calls
  - Frontend error categorization with specific user guidance
  - Enhanced console logging for developer debugging
  - Structured API responses for better error handling

## [0.5.0] - 2025-07-01

### 🚀 Major New Features

- **Interactive Configuration Validation** - Comprehensive real-time validation system for admin interface (#312)
  - Real-time input validation with entity ID format checking and existence verification
  - Numeric range validation with min/max constraints and clear error messages
  - Required field validation with comprehensive empty value detection
  - Unique key validation to prevent duplicate room/floor keys
  - Debounced validation with intelligent 500ms debouncing to prevent API spam
  - Smart caching with 30-second cache for entity existence checks
  - Visual feedback system with red/green borders and inline error messages
  - Loading states with animated spinners during async validation
  - Toast notifications for user-friendly action feedback
  - Full dark/light mode theme support for all validation states

- **Configuration Health Monitoring** - Automated configuration issue detection and resolution (#312)
  - Comprehensive health checks detecting 6 types of configuration issues:
    - Rooms not assigned to floors
    - Missing entity references
    - Empty floors without assigned rooms
    - Invalid room references
    - Broken scene entities
    - Missing weather/integration entities
  - New "Config Health" admin tab with interactive issue dashboard
  - Color-coded issue categorization (errors vs warnings)
  - Summary statistics with at-a-glance health overview
  - Automated fix system with one-click repairs
  - Bulk "Fix All" functionality for reparable issues
  - Safe automated operations for removing missing entities and orphaned configs
  - Real-time progress feedback during fix application
  - Clear success/failure messaging with confirmation

- **Weather Forecast Trend Graphs** - Advanced weather visualization with Chart.js integration (#318)
  - Interactive forecast graphs in weather popup with 400+ lines of functionality
  - Hourly and daily forecast view toggle with smooth transitions
  - Temperature, precipitation, and weather condition trending
  - German localization for all weather controls and labels
  - Chart.js integration with proper resource management and cleanup
  - Responsive design scaling for different screen sizes
  - Real-time data updates from Home Assistant's weather.get_forecasts service
  - Memory leak prevention with proper component disposal

- **Custom YAML Cards Integration** - Add custom Home Assistant Lovelace cards directly to DashView layouts (#327)
  - Complete admin panel for managing custom cards with YAML input
  - Support for markdown, entity, button, and picture card types
  - Lightweight YAML parser for common Lovelace card patterns
  - Real-time entity state updates with StateManager integration
  - Custom card slot type in floor layout editor
  - Comprehensive error handling and user feedback
  - Template support for entity states (e.g., `{{ states('sensor.temperature') }}`)
  - Seamless integration with DashView theming and responsive design

### 🏗️ Technical Improvements

- **Backend API Enhancement**
  - New API endpoints: `GET /api/dashview/config?type=config_health` for health check reports
  - New API endpoint: `POST /api/dashview/config` with `type=config_health_fix` for applying fixes
  - 6 comprehensive health check methods for room, entity, floor, scene, weather, and integration validation
  - 6 automated fix methods for safe removal and cleanup operations
  - 320+ lines of robust backend validation logic
  - Added `custom_cards` configuration type to DashViewConfigView
  - Extended POST/GET endpoints for custom card CRUD operations
  - Proper ConfigEntry storage for persistent custom card configurations

- **Frontend Architecture**
  - New ValidationUtils class with 740+ lines of comprehensive validation logic
  - Enhanced AdminManager with 340+ lines of validation integration
  - New Config Health tab with interactive health monitoring interface
  - Comprehensive styling with 200+ lines of validation-specific CSS
  - Toast notification system for non-intrusive user feedback
  - New SimpleYamlParser utility for client-side YAML processing
  - Enhanced FloorManager with custom card rendering capabilities
  - Extended AdminManager with comprehensive custom card management
  - Updated layout editor to support custom card slot assignment

- **Testing and Quality Assurance**
  - 48+ validation tests across frontend and backend
  - Comprehensive error handling with user-friendly messages
  - Performance optimization with caching and debouncing strategies
  - Extensive code documentation and JSDoc coverage

- **Styling and UX**
  - Custom card CSS styling with error states and placeholders
  - Consistent theming across all custom card types
  - Responsive design for both big and small layout slots
  - Enhanced visual feedback for validation states
  - Improved user experience with immediate feedback and automated problem resolution

## [0.4.0] - 2025-07-01

### 🚀 Added

- **Enhanced Entity Picker Component** - Unified EntityPicker with advanced filtering and bulk actions (#311)
  - Real-time search across entity IDs and friendly names
  - Advanced filtering by domain, area, and device class
  - Multi-selection with checkboxes and bulk operations
  - Keyboard navigation and accessibility features
  - Comprehensive test suite with 21 test cases

- **Historical Data Graphs** - Interactive entity popups with historical data visualization (#314)
  - Chart.js integration for time-series data visualization
  - 24-hour historical data display for supported entities
  - Responsive design with proper error handling
  - Support for sensor, binary_sensor, and numeric entity types

- **Configurable Calendar Display** - Enhanced calendar management system (#313)
  - Configurable display range (1, 3, 7, 14, 30 days)
  - Calendar event color-coding by source calendar
  - Smart navigation with dynamic step sizes
  - Enhanced admin panel with color picker integration

- **Person Card Integration** - Main dashboard person management (#297)
  - Person card display in floor sections
  - Device tracker integration for presence detection
  - Configurable person entities with custom icons
  - Template-based rendering with caching

### 🎨 Enhanced

- **Sensor Card Display Improvements** - German localization and visual differentiation (#320)
  - German text translations for all entity states (on→An, off→Aus, etc.)
  - Type-specific CSS classes for visual differentiation
  - Enhanced icon support with domain-based mapping
  - 128+ new CSS rules for entity type-specific styling
  - Colored borders and gradients for better visual hierarchy

### 🔧 Fixed

- **Calendar API Authentication** - Replaced raw fetch with authenticated API calls (#310)
  - Proper Home Assistant authentication integration
  - Fixed calendar management in admin panel
  - Improved error handling for API requests

- **Person Card Review Improvements** - Code quality enhancements
  - Addressed Gemini Code Assist review comments
  - Improved error handling and validation
  - Better template loading with fallback mechanisms

### 🏗️ Technical Improvements

- **Code Organization**
  - Enhanced FloorManager with helper methods for better maintainability
  - Improved EntityDetailManager with content strategy pattern
  - Better separation of concerns across UI managers
  - Added comprehensive German translation system

- **Enhanced CSS System**
  - Entity type-specific styling with visual differentiation
  - Support for warning/error states with appropriate colors
  - Enhanced color system with gradients and borders
  - Improved responsive design consistency

- **Testing Infrastructure**
  - Comprehensive test suite for EntityPicker component
  - Validation tests for configuration and functionality
  - Security checks and code quality validations

### 📊 Performance

- **Optimized Rendering**
  - Template caching for person cards
  - Efficient entity type detection and display data calculation
  - Reduced DOM manipulation with better state management
  - Lazy loading for non-critical components

### 🔒 Security

- **Enhanced Input Validation**
  - Proper sanitization of user inputs
  - Secure API communication with authentication
  - No eval() or Function() constructor usage
  - MDI icon class validation to prevent injection

### 🌐 Internationalization

- **German Language Support**
  - Complete German translations for entity states
  - German entity type names (climate→Klima, switch→Schalter)
  - Localized error messages and status indicators
  - Consistent German text throughout the interface

### 🎯 User Experience

- **Visual Enhancements**
  - Better entity type differentiation through colors and icons
  - Improved calendar navigation with smart step sizes
  - Enhanced admin panel with real-time validation
  - More intuitive person card management

- **Accessibility Improvements**
  - Keyboard navigation support for EntityPicker
  - Better contrast ratios with enhanced color system
  - Screen reader friendly entity state descriptions
  - Proper ARIA labels and semantic HTML

### 📱 Compatibility

- **Home Assistant Integration**
  - Compatible with Home Assistant 2024.1+
  - Proper integration with area, device, and entity registries
  - Support for latest Home Assistant authentication methods
  - Calendar integration with Home Assistant calendar entities

### 🔄 Migration Notes

For users upgrading from v0.3.x:

1. **Calendar Configuration**: Existing calendar configurations will be preserved. New color-coding and display range features are opt-in.

2. **Entity Display**: Sensor cards will now show German text by default. This improves localization but may affect custom styling that depends on English text.

3. **Person Cards**: Person card functionality requires configuration through the admin panel. Existing person entities will need to be configured.

4. **Historical Data**: Historical data graphs are automatically available for supported entity types in entity detail popups.

### 👥 Contributors

- @mholzi - Primary development and feature implementation
- Community feedback and testing from GitHub issues and discussions

**Full Changelog**: https://github.com/mholzi/dashview/compare/v0.3.1...v0.4.0

---

## [0.3.1] - 2025-01-08

### Fixed
- Minor bug fixes and stability improvements
- Updated dependencies for security patches

## [0.3.0] - 2025-01-07

### 🚀 New Features

- **Entity Detail Popups**: Complete entity detail popup system with container architecture, content orchestration, and comprehensive styling (#290, #291, #292)
  - Generic popup container system with template loading and lifecycle management
  - Intelligent entity content orchestration with type-specific strategies
  - Advanced animations with GPU acceleration and responsive design
  - Full accessibility features including ARIA attributes and keyboard navigation
  - Long-tap gesture integration for triggering entity detail popups

- **Calendar Integration**: Multi-calendar support for enhanced event management (#268)
  - Support for multiple calendar entities in dashboard
  - Integrated calendar event display and filtering
  - Upcoming events card for main dashboard (#269)

- **Time Utilities**: Generalized time difference calculation system (#265)
  - Centralized time formatting with multiple language support
  - Consistent time display across all components
  - Support for short, long, and English time formats

### 🔧 Improvements

- **Code Architecture**: Enhanced component organization and maintainability (#266)
  - Decomposed card display logic into type-specific functions
  - Improved separation of concerns for better code maintainability
  - Cleaner component interfaces and reduced code duplication

### 🎨 Enhanced User Experience

- **Responsive Design**: Mobile-first approach with comprehensive breakpoint support
  - Mobile (320px+), tablet (768px+), and desktop (1024px+) optimized layouts
  - Advanced CSS animations with reduced motion support
  - Elegant shadows, backdrop blur effects, and smooth transitions

- **Accessibility**: Full accessibility compliance
  - ARIA attributes and semantic HTML structure
  - Focus management and keyboard navigation (Escape/Tab support)
  - Screen reader compatibility and proper heading hierarchy

### 🧪 Testing

- Comprehensive test coverage for upcoming events functionality
- Performance validation across multiple device types
- Cross-browser compatibility testing

### 🔧 Technical Details

**New Components:**
- `EntityDetailManager.js` - Content orchestration for entity popups
- `UpcomingEventsManager.js` - Calendar events management
- `entity-detail-popup-container.html` - Reusable popup template
- `upcoming-events-card.html` - Events display template

**Enhanced Components:**
- `PopupManager.js` - Extended with accessibility and entity detail support
- `FloorManager.js` - Integrated gesture detection for popup triggering
- `AdminManager.js` - Additional configuration management
- `style.css` - Comprehensive popup styling system

### 📦 Dependencies

- No additional external dependencies
- Maintains compatibility with Home Assistant 2023.x+
- Pure vanilla JavaScript with ES6+ features

### 🔄 Migration Guide

This release is fully backward compatible. No migration steps required.

### 👥 Contributors

Special thanks to all contributors who made this release possible through issue reports, testing, and feedback.

**Full Changelog**: https://github.com/mholzi/dashview/compare/v0.2.0...v0.3.0

## [0.2.0] - 2024-06-30

### Added

- **Long-Tap Gesture Detection System** (#289)
  - Comprehensive gesture detection infrastructure for entity details popup foundation
  - Cross-device compatibility supporting both touch (mobile) and mouse (desktop) inputs
  - Configurable parameters: 500ms duration with 10px movement tolerance
  - Visual feedback system with CSS transitions during gesture detection
  - Smart context menu prevention for mobile devices
  - Foundation for upcoming Entity Details Popup features (#290-292)

- **GestureDetector Utility Class**
  - Robust, reusable gesture detection with comprehensive event handling
  - WeakMap-based state management for efficient memory usage
  - Proper cleanup and disposal methods to prevent memory leaks
  - Support for multiple callback types: onTap, onLongTap, onLongTapStart, onLongTapCancel

- **Enhanced FloorManager Integration**
  - Seamless integration with existing sensor card infrastructure
  - Backward compatibility preservation - all existing click functionality maintained
  - Smart event handling preventing conflicts with motion sensor swipe functionality
  - Memory leak prevention with proper dispose() method implementation

### Changed

- **Code Quality Improvements**
  - Replaced hardcoded gesture values with named constants (LONG_TAP_DURATION, LONG_TAP_TOLERANCE)
  - Enhanced maintainability with centralized configuration values
  - Improved code organization with proper separation of concerns

- **Test Suite Overhaul**
  - Complete rewrite of gesture detection tests with assertion-based validation
  - Eliminated brittle string-based file content checks
  - Implemented behavioral testing that verifies actual functionality
  - Added comprehensive cross-device compatibility testing
  - Enhanced error handling and reporting in test execution

### Fixed

- **Memory Management**
  - Added proper dispose() method to FloorManager for resource cleanup
  - Implemented comprehensive event listener cleanup in GestureDetector
  - Prevented memory leaks through proper state management

- **Test Infrastructure**
  - Removed non-functional console.log-based tests
  - Fixed brittle test implementations that relied on string matching
  - Improved test reliability with proper assertion methods

### Technical Details

- **Event Handling**: touchstart, touchmove, touchend, touchcancel for mobile; mousedown, mousemove, mouseup, mouseleave for desktop
- **Performance**: Minimal overhead with event listeners only on interactive elements
- **Visual Feedback**: Subtle scale (0.98x) and opacity (0.9) changes during detection; more pronounced feedback (0.95x scale, 0.8 opacity) during long-press
- **Dark Mode**: Proper styling adjustments for both light and dark themes

### Breaking Changes

None. This release maintains full backward compatibility with all existing functionality.

### Migration Guide

No migration required. This release is fully backward compatible.

## [0.1.106] - 2024-06-30

### Fixed

- **Critical JavaScript Syntax Error** (#282)
  - Fixed "Identifier 'swipeableTypes' has already been declared" error in FloorManager.js
  - Resolved duplicate const declarations that were breaking the component
  - Moved swipeableTypes to class property `this._swipeableTypes` for better organization
  - Eliminated 5 duplicate array declarations throughout the file
  - Improved code maintainability with centralized swipeable entity type definition

### Added

- **Consolidated Admin Settings** (#281)
  - Streamlined admin interface with consolidated settings tabs
  - Improved user experience with simplified navigation
  - Enhanced admin panel organization for better workflow

### Technical Improvements

- **Code Organization**: Centralized swipeable entity types as class property
- **Performance**: Eliminated repeated array creation in methods
- **Maintainability**: Single source of truth for swipeable entity configuration
- **Error Prevention**: Proper variable scoping prevents future declaration conflicts

## [0.1.105] - 2024-06-30

### Fixed

- **Auto-Generated Scene Buttons** (#223, #279)
  - Fixed issue where "All lights out" scenes were not appearing in room popups
  - Added proper initialization flow for auto-scene generation in main panel
  - Auto-scenes are now generated and merged with configuration after managers are initialized
  - Scene buttons now display correctly in room popups for rooms with lights

- **Header Icon Updates** (#234, #274)
  - Fixed header icons not updating automatically when entity states change
  - Added setHass() method to HeaderManager for real-time state updates
  - Header icons now reflect current entity states immediately

- **Weather Card Improvements** (#248, #271)
  - Updated weather card styling with 12px border-radius for consistency
  - Reduced weather card height by 20% for better proportions
  - Scaled down icon sizes and font sizes proportionally (120px → 96px icons)
  - Enhanced visual consistency across weather components

- **Hourly Weather Forecast** (#255, #272)
  - Fixed text and icon alignment in hourly forecast cards
  - Changed asymmetric padding (12px 24px 12px 0px) to symmetric (12px)
  - Removed redundant inline styles from JavaScript for cleaner code
  - Content now properly centers within forecast cards

- **Multiple UI Formatting Issues** (#256, #273)
  - Added 12px gap between elements in room popups for better spacing
  - Added 18px border-radius to garbage container for visual consistency
  - Extended swipeable functionality to door, smoke, cover, and light entities
  - Improved overall UI consistency and user experience

- **Hoover/Vacuum States** (#252, #254)
  - Added missing Dreame Mova 30 vacuum states with German descriptions:
    - `docking`: "Zur Ladestation"
    - `returning`: "Rückkehr zur Station" 
    - `cleaning`: "Reinigung"
    - `idle`: "Bereit"
    - `paused`: "Pausiert"
    - `error`: "Fehler"
  - Updated hourly forecast format to match specified template requirements

- **Container Styling** (#253)
  - Removed unwanted border-radius and padding from garbage card container
  - Improved visual consistency with other card components

- **Entity State Handling**
  - Improved mower entity error handling to exclude "none" error attributes
  - Enhanced door entity state handling with dynamic icons and German translations
  - Better garbage card and sensor formatting alignment with room card blueprint

### Technical Improvements

- Enhanced AutoSceneGenerator integration in main application flow
- Improved component initialization sequence for better reliability
- Better CSS consistency across weather components
- Enhanced entity state management and error handling
- Improved component-based architecture with proper state synchronization

### Performance

- Optimized scene generation and configuration merging
- Reduced redundant style calculations in weather components
- Improved entity state update efficiency
- Better component lifecycle management

## [0.1.101] - 2024-12-29

### Added

- **Enhanced Temperature Card Layout**: Complete redesign of temperature cards in room popups with CSS Grid layout
  - Large, prominent temperature display (2.6em font)
  - Improved visual hierarchy with temperature at top, room name at bottom
  - Enhanced graph rendering with smooth curves and better scaling
  - Better responsive design for mobile devices

- **Simplified Scene Management**: Streamlined admin interface for auto-generated scenes
  - Single global toggle for "Lights Off" scenes across all rooms
  - Automatic scene generation based on rooms with lights
  - Removed complex per-room configuration interface
  - Cleaner, more intuitive admin experience

### Enhanced

- **Improved Graph Visualization**: Better temperature history rendering with smooth curves
- **Responsive Design**: Temperature cards now use CSS Grid for better layout control
- **Admin Interface**: Simplified scene configuration with just two toggles and save button

### Technical Improvements

- CSS Grid implementation for temperature card layout
- Enhanced AutoSceneGenerator with light_scenes_enabled flag
- Improved graph rendering algorithms with better padding and scaling
- Comprehensive test coverage for new features

## [0.1.100] - 2024-12-29

### Fixed

- **Weather API Compliance**: Removed undocumented WebSocket API usage and updated to use official `weather.get_forecasts` service for better Home Assistant compatibility
- **Navigation Interface**: Removed unnecessary Home icon from navigation bar for cleaner interface
- **Icon Sizing**: Fixed navigation button icons appearing smaller than intended (60px) with CSS `!important` override
- **Door Sensors**: Updated door sensor handling to treat 'unlocked' state same as 'closed' for consistent behavior
- **Mower Sensors**: Improved mower sensor error handling to properly exclude "none" values and display correct states
- **Debug Logging**: Added comprehensive debug logging for scene detection in room popups to aid troubleshooting
- **Card Styling**: Updated card styling for consistent 12px border radius across components
- **Code Cleanup**: Improved layout formatting and removed old release notes files

### Technical Improvements

- Enhanced weather forecast fetching to use only documented Home Assistant APIs
- Improved sensor state management and error handling
- Better CSS specificity handling for icon sizing
- More consistent UI styling and layout formatting

## [0.1.99] - 2025-01-01

### Added

- **Cover Scene Functionality** (#224)
  - Room-specific auto-generated cover scenes for each room with covers
  - Global cover scene to control all covers in the house
  - Smart positioning logic using 30% threshold for open/close decisions
  - Admin panel toggle for global cover scene configuration
  - Horizontal scene layout in room popups for better UX
  - Dynamic scene names: "Rollos hoch/runter" and "Alle Rollos hoch/runter"

- **Swipeable Motion Sensor Cards** (#219)
  - Touch/swipe gesture support for motion sensor cards
  - Toggle between motion state display and time since last change
  - German time formatting: "Jetzt", "vor 2h", "vor 3 Tagen"
  - Per-entity state tracking with persistent swipe states
  - Comprehensive test coverage for swipe functionality

- **Room Scene Integration** (#223)
  - Scene buttons now appear in room popups
  - Auto-generated scenes display in appropriate room contexts
  - Template-based scene button rendering
  - Horizontal scene alignment for better mobile experience

### Fixed

- **Media Player Controls** (#204)
  - Fixed media player controls not working in room cards and music popup
  - Removed early return check that prevented event handler initialization
  - Play/pause, volume sliders, and next/prev buttons now work correctly
  - Volume control state synchronization improvements

### Technical Improvements

- **Scene Management System**
  - Extended AutoSceneGenerator with cover scene creation methods
  - Enhanced SceneManager with position calculation logic
  - Added room scene filtering and rendering capabilities
  - Improved scene button interaction handling

- **Component Architecture** 
  - Added room-scenes-card template for consistent UI
  - Enhanced popup manager with scene card injection
  - Improved component initialization and state management
  - Better separation of concerns between managers

- **Testing Coverage**
  - Added comprehensive test suites for new features
  - Motion sensor swipe tests (5 test cases)
  - Cover scene functionality tests (6 test cases)
  - Room scene button tests (4 test cases)
  - All new features have 100% test coverage

### Performance

- Optimized scene rendering with template-based approach
- Improved gesture detection with configurable thresholds
- Efficient state management for swipe interactions
- Reduced DOM manipulation through better event delegation

### Documentation

- Updated component documentation with new scene functionality
- Added inline code documentation for new methods
- Enhanced README with feature descriptions
- Comprehensive test documentation

## Previous Releases

See [GitHub Releases](https://github.com/mholzi/dashview/releases) for older release notes.

[0.1.106]: https://github.com/mholzi/dashview/compare/v0.1.105...v0.1.106
[0.1.105]: https://github.com/mholzi/dashview/compare/v0.1.104...v0.1.105
[0.1.101]: https://github.com/mholzi/dashview/compare/v0.1.100...v0.1.101
[0.1.100]: https://github.com/mholzi/dashview/compare/v0.1.99...v0.1.100
[0.1.99]: https://github.com/mholzi/dashview/compare/v0.1.98...v0.1.99