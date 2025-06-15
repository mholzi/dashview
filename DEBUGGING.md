# DashView Debugging Guide

## Quick Fix for Black Screen Issue

If you're experiencing a black screen, the most likely cause was a JavaScript syntax error that has been fixed. Update to the latest version of DashView.

## Debug Mode

Enable detailed logging to troubleshoot issues:

```javascript
// In browser console:
localStorage.setItem('dashview_debug', 'true')
// Then reload the page
```

## Available Debug Tools

After loading the page, these tools are available in the browser console:

### Basic Diagnostics
```javascript
DashViewDebug.diagnose()        // Check for common issues
DashViewDebug.getStatus()       // Get component status
DashViewDebug.reload()          // Force reload panels
```

### Debug Mode Control
```javascript
DashViewDebug.enableDebug()     // Enable debug logging
DashViewDebug.disableDebug()    // Disable debug logging
```

## Common Issues and Solutions

### 1. Black Screen
- **Cause**: JavaScript syntax error or critical loading failure
- **Solution**: Check browser console for errors, update to latest version
- **Debug**: Use `DashViewDebug.diagnose()` to check file accessibility

### 2. Missing Components/Buttons
- **Cause**: Template files not loading or missing entities
- **Solution**: Check that all template files exist in `/local/dashview/templates/`
- **Debug**: Enable debug mode to see detailed loading logs

### 3. Weather/Person Info Not Updating
- **Cause**: Missing or incorrectly named Home Assistant entities
- **Solution**: Check entity names in Home Assistant
- **Debug**: Use `DashViewDebug.getStatus()` to see available weather entities

### 4. Configuration Issues
- **Cause**: Missing or malformed JSON config files
- **Solution**: Check `/local/dashview/config/` directory
- **Debug**: Enable debug mode to see configuration loading details

## File Structure Check

Ensure these files exist in your `/local/dashview/` directory:
```
/local/dashview/
├── dashview-panel.js       # Main component (required)
├── index.html             # Main layout (required)
├── style.css              # Styling (required)
├── templates/             # Component templates (required)
│   ├── header-buttons.html
│   ├── info-card.html
│   ├── kiosk-button.html
│   ├── person-button.html
│   ├── train-departure-card.html
│   └── weather-button.html
├── config/                # Configuration files (optional)
│   ├── floors.json
│   ├── rooms.json
│   └── music.json
└── test.html              # Test page (optional)
```

## Testing

Use the included test page to verify component functionality:
1. Navigate to `/local/dashview/test.html` in your browser
2. Use the debug controls to test functionality
3. Check console output for errors

## Browser Console Commands

Useful commands for debugging:

```javascript
// Get panel element
const panel = document.querySelector('dashview-panel');

// Check if panel exists
console.log('Panel found:', !!panel);

// Get debug status
console.log(panel?.getDebugStatus?.());

// Check HASS availability
console.log('HASS available:', !!panel?.hass);

// List all available entities
console.log('Available entities:', Object.keys(panel?.hass?.states || {}));
```

## Common Entity Requirements

DashView expects these entities (customize as needed):
- `weather.*` - Any weather entity (auto-detected)
- `person.markus` - Person entity (hardcoded, update in code)
- Various sensor entities for info cards (check code for specifics)

### Window Weather Notifications

For window weather notifications to work, ensure these entities exist:
- `binary_sensor.fenster_buero_contact` - Office window contact sensor
- `binary_sensor.fenster_schlafzimmer_contact` - Bedroom window contact sensor  
- `weather.dreieich` - Weather entity (or update entity name in config)
- `sensor.room_temperature` - Temperature sensor (configured in global_settings)
- `sensor.room_humidity` - Humidity sensor (configured in global_settings)

**Troubleshooting Window Weather Notifications:**
```javascript
// Enable debug mode and reload page
DashViewDebug.enableDebug()

// Check notification configuration and entity states
DashViewDebug.debugWindowWeatherNotifications()

// Test notification display functionality
DashViewDebug.testWindowWeatherNotifications()
```

## Getting Help

1. Enable debug mode: `DashViewDebug.enableDebug()`
2. Run diagnostics: `DashViewDebug.diagnose()`
3. Get status: `DashViewDebug.getStatus()`
4. Check browser console for detailed error messages
5. Include this information when reporting issues

## Version Information

Current version includes:
- ✅ Syntax error fixes
- ✅ Comprehensive error handling
- ✅ Debug logging system
- ✅ Startup integrity checks
- ✅ Recovery mechanisms
- ✅ Test environment