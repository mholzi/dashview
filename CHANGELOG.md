# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.22] - 2025-12-02

### Fixed
- **SortableJS Module Loading**: Bundled SortableJS locally to fix module resolution errors in Home Assistant
  - Changed from CDN import to local vendor copy
  - Fixes "Module name does not resolve to a valid URL" error
  - Works offline and respects Content Security Policy

## [0.0.21] - 2025-12-02

### Added - Epic 7: Admin Interaction Polish (13 points)

#### Drag-and-Drop Reordering
- **Sortable List Component** (`<sortable-list>`): New reusable Web Component wrapper for SortableJS enabling drag-and-drop functionality throughout the admin panel
- **Floor/Room Drag-and-Drop**: Floors and rooms can now be reordered via drag-and-drop in the Layout Tab with visual feedback (ghost, placeholder)
- **Media Playlist Drag-and-Drop**: Media presets in the Status Tab now support drag-and-drop reordering
- All drag-and-drop operations integrate with Epic 6's undo/redo system (Ctrl+Z to revert)
- Arrow buttons preserved as accessibility fallback for keyboard users
- Full touch device support (iOS, Android)

#### Floor Card Live Preview
- **Floor Card Preview Component** (`<floor-card-preview>`): New real-time preview component showing floor card slot assignments in the Layout Tab
- Preview updates instantly as slot configurations change
- Shows entity icons, names, and current states (on/off/unavailable)
- Scaled to 50-60% for optimal admin panel fit

#### Technical Details
- SortableJS v1.15.6 integrated (core module ~10KB gzipped)
- Vanilla HTMLElement components with Shadow DOM for lightweight isolation
- Comprehensive unit test coverage (100+ new test cases)
- i18n support for English and German

### Changed
- Layout Tab now uses drag handles (`mdi:drag-horizontal`) alongside existing arrow buttons
- Floor card configuration section includes side-by-side preview panel

## [0.0.20] - 2025-12-01

### Added - Epic 6: Admin Change Management (17 points)
- Undo/redo system with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- Undo/redo UI controls in admin panel header
- Draft mode for complex form changes
- Confirmation dialogs for destructive actions
- Change tracking architecture in SettingsStore

## [0.0.18] - 2025-12-01

### Added - Epic 5: Admin UX Quick Wins (15 points)
- Collapsible entity type sections
- Entity search within room configuration
- Manual MDI icon entry
- Select all/none for entity bulk operations
- Admin panel i18n (English, German)

## [0.0.17] - 2025-11-30

### Added
- Admin panel internationalization infrastructure
- Various UX improvements

## [0.0.16] and earlier

See git history for earlier changes.
