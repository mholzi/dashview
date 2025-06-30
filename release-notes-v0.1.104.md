# Release Notes v0.1.104

## 🚀 What's New in v0.1.104

### ✨ New Features
- **Enhanced Weather Cards**: Completely redesigned weather cards with new grid-based layout featuring title, temperature, condition, and large weather icons positioned for better visibility and consistency

### 🔧 UI/UX Improvements
- **Sticky Popup Headers**: Popup headers now remain fixed at the top when scrolling through popup content, improving navigation and accessibility
- **Consistent Header Buttons**: Standardized header button formatting to match room and floor icon styles for visual consistency across the dashboard
- **Better Weather Display**: Weather cards now show temperature with 1 decimal precision and include precipitation information when available

### 🐛 Bug Fixes
- **Media Player Controls**: Fixed play, pause, next, and previous buttons not working in media player areas - controls now properly trigger Home Assistant entity changes
- **Garbage Card Display**: Corrected garbage card entity references to display actual sensor states instead of placeholder data

### 🎨 Visual Enhancements
- **Weather Cards**: 
  - Grid layout with title/temperature/condition on left, large icon (120x120px) on right
  - Temperature displays with 1 decimal precision (e.g., "23.1°C")
  - Precipitation information overlay when available
  - Consistent styling across current weather and forecast cards

- **Header Buttons**:
  - Updated from 32x32px to 42x42px (matching floor tabs)
  - Changed from circular to rounded rectangle design
  - Increased icon size from 20px to 28px
  - Unified color scheme with floor/room navigation elements

- **Popup Interface**:
  - Sticky headers with proper z-index layering
  - Smooth scrolling for popup body content
  - Improved visual hierarchy

### 🔧 Technical Improvements
- **Media Player Architecture**: Fixed event listener attachment scope to properly handle multiple media player cards in tabbed interfaces
- **Component Isolation**: Improved Shadow DOM isolation and CSS variable injection
- **Error Handling**: Enhanced debugging capabilities with comprehensive console logging for media player controls

### 📋 Migration Notes
This release maintains full backward compatibility. No configuration changes are required.

### 🚨 Breaking Changes
None in this release.

### 👥 Contributors
- Enhanced weather card layout implementation
- Media player control fixes and debugging improvements
- UI consistency improvements across navigation elements
- Popup interaction enhancements

---

**Full Changelog**: https://github.com/mholzi/dashview/compare/v0.1.103...v0.1.104