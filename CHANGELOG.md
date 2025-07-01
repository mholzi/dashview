# Changelog

All notable changes to DashView will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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