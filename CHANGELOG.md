# Changelog

All notable changes to DashView will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.100]: https://github.com/mholzi/dashview/compare/v0.1.99...v0.1.100
[0.1.99]: https://github.com/mholzi/dashview/compare/v0.1.98...v0.1.99