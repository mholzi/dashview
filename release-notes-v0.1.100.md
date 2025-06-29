# 🐛 DashView v0.1.100 - Critical Bug Fixes & API Compliance

This patch release addresses critical compatibility issues with Home Assistant and fixes several UI/UX problems reported by users. This is a recommended update for all DashView users.

## 🚨 Critical Fixes

### ⚡ Weather API Compliance
**Fixed undocumented API usage that could break with future Home Assistant updates**

- **Removed**: Undocumented WebSocket API calls for weather data
- **Added**: Official `weather.get_forecasts` service integration  
- **Impact**: Ensures long-term compatibility with Home Assistant
- **Related**: GitHub issue #226

### 🧭 Navigation Improvements
**Streamlined navigation interface with better icon sizing**

- **Removed**: Unnecessary Home icon from navigation bar
- **Fixed**: Navigation button icons now properly display at 60px size
- **Resolved**: CSS inheritance conflicts causing smaller-than-intended icons
- **UX**: Cleaner, more focused navigation interface

## 🔧 Sensor & State Fixes

### 🚪 Door Sensor Consistency
**Unified door state handling for better user experience**

- **Updated**: 'unlocked' door state now treated same as 'closed'
- **Result**: Consistent visual representation across all door sensors
- **Icon**: Both states show `mdi:door-closed-lock` with "Abgeschlossen" label

### 🤖 Mower Sensor Accuracy
**Eliminated "None" error displays on properly functioning mowers**

- **Fixed**: Error handling logic to properly exclude "none" error values
- **Result**: Mower cards now show correct state ("Geparkt") instead of "None"
- **Logic**: Only displays actual errors, ignoring placeholder "none" values

## 🎨 UI/UX Enhancements

### 📐 Design Consistency
**Standardized styling across all card components**

- **Updated**: Consistent 12px border radius across all cards
- **Improved**: Layout formatting and code organization
- **Cleaned**: Removed legacy styling inconsistencies

### 🔍 Debug Infrastructure
**Enhanced troubleshooting capabilities for scene detection**

- **Added**: Comprehensive debug logging for scene detection in room popups
- **Benefits**: Easier identification of scene configuration issues
- **Target**: Admin users and developers debugging scene problems

## 📊 Technical Details

### 🏗️ Architecture Improvements
- Weather API calls now use documented Home Assistant services only
- Enhanced error handling in sensor state management
- Improved CSS specificity handling for icon sizing
- Better separation of concerns in component styling

### 🧪 Quality Assurance
- All fixes validated against Home Assistant 2024.12.x
- Comprehensive testing of weather API integration
- UI consistency verified across different device sizes
- No breaking changes to existing functionality

## 📥 Installation & Upgrade

### For Existing Users
```bash
# Backup current installation
cp -r /config/custom_components/dashview /config/dashview-backup-v0.1.99

# Download v0.1.100
wget https://github.com/mholzi/dashview/archive/v0.1.100.tar.gz

# Extract and replace
tar -xzf v0.1.100.tar.gz
cp -r dashview-0.1.100/custom_components/dashview /config/custom_components/

# Restart Home Assistant
# Your configuration will be preserved
```

### New Installations
```bash
# Clone repository
git clone https://github.com/mholzi/dashview.git
cd dashview

# Copy to Home Assistant
cp -r custom_components/dashview /config/custom_components/

# Restart Home Assistant and configure via UI
```

## 🔄 Migration Notes

### Automatic Updates
- **Weather Integration**: Existing weather cards will automatically use new API
- **Navigation**: Home icon removal is purely visual, no configuration needed
- **Sensors**: Door and mower state improvements apply automatically
- **No Breaking Changes**: All existing functionality preserved

### Configuration Impact
- **None Required**: All fixes are transparent to user configuration
- **Debug Logs**: New scene debug logs available in browser console
- **Performance**: Negligible impact, some operations may be slightly faster

## 🧪 Testing Recommendations

After upgrading, verify:

1. **Weather Cards**: Confirm weather data still loads correctly
2. **Navigation**: Check that navigation buttons appear at proper size
3. **Door Sensors**: Verify door states display consistently
4. **Mower Sensors**: Confirm mower cards show proper states (not "None")
5. **Scene Buttons**: Check scene detection in room popups (use browser console for debug info)

## 🆘 Troubleshooting

### Weather Data Issues
If weather cards don't load after upgrade:
1. Check Home Assistant logs for weather service errors
2. Verify weather entity is properly configured
3. Restart Home Assistant to refresh integrations

### Navigation Icon Issues
If navigation icons still appear small:
1. Clear browser cache and refresh DashView
2. Check browser developer tools for CSS conflicts
3. Verify browser supports CSS `!important` declarations

### Scene Detection Problems
If scenes don't appear in room popups:
1. Open browser developer console
2. Look for `[PopupManager]` and `[SceneManager]` debug messages
3. Verify scene configuration in DashView admin panel

## 🔗 Resources

- **Full Changelog**: [v0.1.99...v0.1.100](https://github.com/mholzi/dashview/compare/v0.1.99...v0.1.100)
- **Issue Tracker**: [GitHub Issues](https://github.com/mholzi/dashview/issues)
- **Documentation**: Updated inline documentation in source files
- **Community**: [GitHub Discussions](https://github.com/mholzi/dashview/discussions)

## 👥 Contributors

Special thanks to the community members who reported these issues and provided feedback for this release.

---

🤖 *Generated with [Claude Code](https://claude.ai/code)*

**Happy Home Automating!** 🏠✨