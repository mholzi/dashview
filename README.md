# dashview

A comprehensive Home Assistant dashboard component with Shadow DOM support and custom CSS theming.

## Features

- **Shadow DOM CSS Variables**: Custom CSS properties (like `--popupBG`, `--gray000`, `--active-big`) are automatically injected into the Shadow DOM to ensure proper theming and colors for all components including popups and dynamic elements.

- **Light/Dark Mode Support**: Automatic theme switching based on system preferences with full Shadow DOM compatibility.

- **Component Isolation**: Uses Shadow DOM for proper component encapsulation while maintaining access to custom CSS variables.

## Shadow DOM CSS Variable Support

The component automatically injects all custom CSS properties into its Shadow DOM to ensure consistent theming. This includes:

- Color variables (backgrounds, text colors, accent colors)
- Gradient definitions for active states
- Card styling properties
- Popup background colors

This resolves issues where popups and other elements would appear transparent or with incorrect colors due to Shadow DOM CSS isolation.

## Installation & Setup

### Installation
1. Install the DashView custom integration in your Home Assistant
2. Add the DashView panel to your dashboard

### Configuration
DashView provides a comprehensive admin interface accessible through the DashView panel. No manual configuration files are required.

#### Admin Interface Features
The admin interface (`/local/dashview/admin.html`) provides dedicated setup tabs for:

- **House Setup**: Configure rooms, floors, and general house structure
- **Motion Setup**: Assign motion sensors (labeled "Motion") to rooms
- **Cover Setup**: Select and assign cover entities (blinds, curtains, etc.) to rooms
- **Light Setup**: Select and assign light entities to rooms  
- **Window Setup**: Assign window sensors (labeled "Fenster") to rooms
- **Smoke Detector Setup**: Assign smoke detectors (labeled "Rauchmelder") to rooms
- **Vibration Setup**: Assign vibration sensors (labeled "Vibration") to rooms

#### Minimal Setup Required
1. **For Motion/Window/Smoke/Vibration Sensors**: Assign appropriate labels in Home Assistant (e.g., "Motion", "Fenster", "Rauchmelder", "Vibration")
2. **For Covers & Lights**: Simply assign entities to rooms in Home Assistant - no labels required
3. **Configure rooms**: Use the admin interface to select which entities should be included in DashView for each room

All configuration is stored in the integration's ConfigEntry and managed through the custom admin panel interface.