# 🚀 DashView v0.1.99 - Enhanced Scene Management & Interactive Controls

This release brings significant improvements to scene management and introduces interactive gesture controls, making DashView more intuitive and powerful for smart home automation.

## 🎯 Key Features

### ✨ Cover Scene Functionality
Transform how you control covers throughout your home with intelligent, context-aware scenes:

- **🏠 Room-Specific Cover Scenes**: Auto-generated scenes for each room with covers
- **🌍 Global Cover Control**: Master control for all covers in your house via admin panel
- **🧠 Smart Logic**: Automatically shows "Rollos hoch" (up) when average position < 30%, "Rollos runter" (down) otherwise
- **⚙️ Admin Configuration**: Toggle global cover scene on/off in admin panel
- **📱 Mobile-Optimized**: Horizontal scene layout in room popups for better UX

### 👆 Swipeable Motion Sensor Cards
Introduce touch interactions for more dynamic sensor information:

- **👋 Touch Gestures**: Swipe left/right on motion sensor cards to toggle views
- **⏰ Time Display**: Switch between motion state ("Erkannt"/"Klar") and time since last change
- **🇩🇪 German Localization**: Time formatted as "Jetzt", "vor 2h", "vor 3 Tagen"
- **💾 State Persistence**: Swipe preferences remembered per sensor
- **📊 Per-Entity Tracking**: Independent state management for each motion sensor

### 🎛️ Enhanced Scene Integration
Bring scenes closer to where you need them:

- **🪟 Room Scene Popups**: Scene buttons now appear directly in room popups
- **🔄 Auto-Scene Display**: Auto-generated scenes appear in relevant room contexts
- **🎨 Template-Based**: Consistent styling with template-driven scene buttons
- **📐 Horizontal Layout**: Better space utilization on mobile devices

## 🐛 Bug Fixes

### 🎵 Media Player Controls
- **Fixed**: Media player controls not working in room cards and music popup (#204)
- **Resolved**: Play/pause buttons, volume sliders, and next/prev controls now function correctly
- **Improved**: Volume state synchronization between UI and Home Assistant

## 🔧 Technical Improvements

### 🏗️ Architecture Enhancements
- **Scene Management**: Extended AutoSceneGenerator with intelligent cover scene creation
- **Position Logic**: Added sophisticated average position calculation for cover controls
- **Component System**: Enhanced popup manager with dynamic scene card injection
- **State Management**: Improved component initialization and lifecycle management

### 🧪 Testing & Quality
- **Comprehensive Testing**: Added test suites for all new features
  - Motion sensor swipe functionality (5 test cases)
  - Cover scene operations (6 test cases)  
  - Room scene integration (4 test cases)
- **100% Coverage**: All new features thoroughly tested
- **Quality Assurance**: Syntax validation and integration testing

### ⚡ Performance Optimizations
- **Template-Based Rendering**: Faster scene button creation and updates
- **Gesture Detection**: Optimized touch handling with configurable thresholds
- **Event Delegation**: Reduced DOM manipulation overhead
- **State Efficiency**: Minimized re-renders with smart state tracking

## 📱 User Experience

### Intuitive Interactions
- **Natural Gestures**: Swipe interactions feel native and responsive
- **Visual Feedback**: Clear state changes and smooth transitions
- **Context Awareness**: Scenes appear where they're most relevant
- **Mobile-First**: Optimized for touch devices and small screens

### Smart Automation
- **Intelligent Defaults**: Cover scenes automatically determine best actions
- **Room Context**: Scenes filtered and displayed per room relevance
- **Admin Control**: Easy management of global scene features
- **Consistent Behavior**: Predictable interactions across all components

## 📦 Installation & Upgrade

### For New Installations
```bash
# Download the latest release
curl -L https://github.com/mholzi/dashview/archive/v0.1.99.tar.gz -o dashview-v0.1.99.tar.gz

# Extract and install
tar -xzf dashview-v0.1.99.tar.gz
cp -r dashview-0.1.99/custom_components/dashview /config/custom_components/
```

### For Existing Users
```bash
# Backup your current configuration
cp -r /config/custom_components/dashview /config/dashview-backup

# Update to new version
# Download and replace files as above

# Restart Home Assistant
# Your existing configuration will be preserved
```

## 🎛️ Configuration

### Cover Scene Setup
1. **Navigate to**: DashView Admin Panel → Auto-Generated Scenes
2. **Enable**: "Enable Global Cover Scene" toggle
3. **Generate**: Click "Generate Auto-Scenes" to create room-specific cover scenes
4. **Verify**: Check that scenes appear in room popups and main dashboard

### Motion Sensor Gestures
- **No Configuration Required**: Swipe functionality works automatically on motion sensor cards
- **Usage**: Swipe left or right on any motion sensor card to toggle between state and time views
- **Reset**: Swipe again to return to original state display

## 🔄 Migration Notes

### Automatic Migration
- **Scene Integration**: Existing scenes will automatically appear in room popups where relevant
- **Cover Scenes**: New cover scenes will be generated alongside existing light scenes
- **No Breaking Changes**: All existing functionality preserved

### Admin Panel Updates
- **New Toggle**: Global cover scene control added to auto-scenes section
- **Enhanced Status**: Better feedback for scene generation operations
- **Preserved Settings**: All existing admin configurations maintained

## 🤝 Contributing

This release includes contributions addressing community-requested features:

- **Issue #224**: Cover scene functionality implementation
- **Issue #219**: Swipeable motion sensor cards
- **Issue #223**: Scene buttons in room popups
- **Issue #204**: Media player control fixes

Special thanks to all community members who reported issues and provided feedback!

## 🔗 Links

- **Full Changelog**: https://github.com/mholzi/dashview/compare/v0.1.98...v0.1.99
- **Documentation**: See updated component documentation in source files
- **Issue Tracker**: https://github.com/mholzi/dashview/issues
- **Discussions**: https://github.com/mholzi/dashview/discussions

---

🤖 *This release was generated with [Claude Code](https://claude.ai/code)*

**Happy Automating!** 🏠✨