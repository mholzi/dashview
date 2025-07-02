# Manual Refresh Controls Implementation

## Overview

This implementation adds comprehensive manual refresh functionality to DashView, allowing users to instantly refresh data without waiting for the standard 5-minute polling intervals.

## Features

### 🔄 Manual Refresh Buttons
- **Header Refresh Button**: Located in the main weather button area
- **Popup Refresh Buttons**: Available in weather, security, and room popups
- **Visual Feedback**: Loading animations and disabled states during refresh

### 📱 Pull-to-Refresh Support
- **Mobile-Friendly**: Gesture-based refresh for touch devices
- **Visual Indicators**: Shows pull state and ready-to-refresh feedback
- **Threshold-Based**: Requires 80px pull distance to trigger

### ⚡ Performance Features
- **Throttling**: Minimum 1-second interval between manual refreshes
- **Selective Refresh**: Can refresh specific components or all data
- **Statistics Tracking**: Monitors refresh frequency and performance

## Technical Implementation

### RefreshManager Class
```javascript
// Core refresh coordination
const refreshManager = new RefreshManager(panel);

// Register component refresh callbacks
refreshManager.registerRefreshCallback('weather', async () => {
  await weatherManager.update();
});

// Execute manual refresh
await refreshManager.refreshData(['weather', 'security']);
```

### Component Integration
- **DashView Panel**: Central integration point with callback registration
- **Header Manager**: Main refresh button and event handling
- **Popup Manager**: Popup-specific refresh buttons and logic
- **State Manager**: Hooks into existing update mechanisms

### CSS Styling
- **Refresh Button**: Circular button with hover effects and animations
- **Loading States**: Spinning animation with opacity changes
- **Pull Indicators**: Floating indicators with state transitions

## Usage

### Manual Refresh
1. Click any refresh button (⟳) in the header or popups
2. Watch for loading animation during data fetch
3. Components update immediately with fresh data

### Pull-to-Refresh
1. Swipe down from the top of the main dashboard
2. Pull until "Release to refresh" appears
3. Release to trigger complete data refresh

### Targeted Refresh
- **Header Button**: Refreshes main dashboard, weather, and security
- **Weather Popup**: Refreshes only weather data and forecasts
- **Security Popup**: Refreshes only security sensors and status
- **Room Popups**: Refreshes only that room's entities

## Code Changes

### New Files
- `/lib/utils/RefreshManager.js` - Core refresh management class
- `/tests/test_manual_refresh.js` - Comprehensive test suite

### Modified Files
- `dashview-panel.js` - RefreshManager integration and callback setup
- `lib/ui/header-manager.js` - Main refresh button functionality
- `lib/ui/popup-manager.js` - Popup refresh button setup
- `style.css` - Refresh control styling and animations
- `templates/weather-button.html` - Added header refresh button
- `weather.html` - Added weather popup refresh button
- `security.html` - Added security popup refresh button

## Architecture Benefits

1. **Minimal Changes**: Leverages existing update mechanisms
2. **Component Isolation**: Each manager handles its own refresh logic
3. **Performance Optimized**: Throttling prevents excessive requests
4. **User Experience**: Immediate feedback with visual indicators
5. **Mobile Ready**: Touch gesture support for modern devices

## Future Enhancements

- **Background Refresh**: Optional automatic refresh intervals
- **Smart Refresh**: Only refresh components with stale data
- **Offline Support**: Queue refresh requests when offline
- **Analytics**: Detailed refresh usage metrics

## Testing

The implementation includes comprehensive tests covering:
- RefreshManager creation and configuration
- Refresh button functionality and event handling
- Pull-to-refresh gesture detection
- Throttling and performance optimization
- Visual feedback and state management

Run tests with: `node custom_components/dashview/tests/test_manual_refresh.js`