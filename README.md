# DashView - Fully Configurable Home Assistant Dashboard

A comprehensive, fully customizable Home Assistant integration that provides an advanced dashboard with room-based organization, custom widgets, and administrative configuration capabilities.

## 🌟 Key Features

### Core Functionality
- **Room-Based Organization**: Organize your entities by rooms with custom icons and ordering
- **Multiple Dashboard Views**: Main, Rooms, Security, Media, and Admin views
- **Custom Widget System**: Native JS/HTML/CSS widgets replacing standard Home Assistant cards
- **Admin Configuration Panel**: Full administrative interface for dashboard customization
- **Real-Time Updates**: Live entity state updates and dashboard refresh capabilities
- **HACS Compatible**: Easy installation through Home Assistant Community Store

### Advanced Configuration
- **Entity Type Classification**: Classify entities by type (lights, sensors, vacuum/hoover, etc.)
- **CSS Customization**: Complete control over colors, fonts, border radius, and styling
- **Custom Entity Widgets**: Specialized widgets for different entity types (media players, climate, sensors)
- **Room Management**: Add, edit, delete, and reorder rooms with custom icons
- **Entity Assignment**: Assign entities to rooms and configure custom names/icons

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, modern interface with smooth animations and transitions
- **Admin-Only Features**: Administrative panel only visible to Home Assistant administrators
- **Multi-View Navigation**: Tab-based navigation between different dashboard views
- **Custom Styling**: Fully customizable appearance through CSS configuration

## 📦 Installation

### Via HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Integrations"
3. Click the "+" button and search for "DashView"
4. Download and install the integration
5. Restart Home Assistant
6. Go to Configuration → Integrations
7. Click "Add Integration" and search for "DashView"
8. Configure your dashboard settings
9. The DashView panel will appear in your sidebar

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/mholzi/dashview/releases)
2. Extract the files to your `custom_components/dashview/` directory
3. Restart Home Assistant
4. Go to Configuration → Integrations
5. Click "Add Integration" and search for "DashView"
6. Configure your dashboard settings
7. The DashView panel will appear in your sidebar

## 🚀 Getting Started

### Initial Configuration

1. **Install the Integration**: Follow the installation steps above
2. **Configure Basic Settings**: Set your dashboard title, enable admin panel, and choose theme color
3. **Access the Dashboard**: Click on "DashView" in your Home Assistant sidebar
4. **Admin Configuration**: If you're an administrator, access the Admin tab to configure rooms and entities

### Setting Up Rooms

1. Navigate to the **Admin** tab (administrators only)
2. In the **Room Management** section:
   - Enter a room name (e.g., "Living Room", "Kitchen")
   - Choose an icon (emoji or Material Design icon like `mdi:sofa`)
   - Set the display order (lower numbers appear first)
   - Click "Add/Update Room"

### Configuring Entities

1. In the **Entity Configuration** section:
   - Select a Home Assistant entity from the dropdown
   - Optionally set a custom name and icon
   - Choose or auto-detect the entity type
   - Assign the entity to a room
   - Click "Save Entity Config"

### Customizing Appearance

1. In the **CSS & Styling** section:
   - Adjust primary and secondary colors
   - Set background and text colors
   - Choose a font family
   - Adjust border radius for widgets
   - Click "Apply Styling" (requires page refresh)

## 🏠 Dashboard Views

### Main View
- Welcome message and feature overview
- System status and statistics
- Quick stats (session duration, last updated, active entities)

### Rooms View
- Grid layout of all configured rooms
- Each room shows assigned entities with their current states
- Interactive entity controls (toggle lights, view sensor data, etc.)
- Real-time state updates

### Security View
- Security entity status overview
- Camera feed integration
- Alarm and lock status monitoring

### Media View
- Media player controls
- Entertainment system management
- Volume controls and playback management

### Admin View (Administrators Only)
- Room management interface
- Entity configuration panel
- CSS customization controls
- Backup and restore functionality

## 🔧 Entity Types and Widgets

### Supported Entity Types

- **Lights**: Toggle controls with on/off states
- **Switches**: Toggle controls for various switches
- **Sensors**: Display sensor values with units
- **Binary Sensors**: Show binary state information
- **Climate**: Temperature controls with increase/decrease buttons
- **Media Players**: Playback controls, volume sliders, media information
- **Vacuum/Hoover**: Specialized controls for robotic vacuums
- **Locks**: Security controls for smart locks
- **Cameras**: Camera entity integration
- **Covers**: Window/blind controls

### Custom Widget Features

- **Interactive Controls**: Direct entity manipulation without opening separate dialogs
- **Real-Time Updates**: Automatic state synchronization with Home Assistant
- **Responsive Design**: Widgets adapt to different screen sizes
- **Custom Styling**: Widgets respect your CSS configuration
- **Type-Specific Icons**: Automatic icon selection based on entity type

## ⚙️ Configuration Options

### Dashboard Configuration
```yaml
dashboard_title: "My Smart Home"
enable_admin_panel: true
theme_color: "#667eea"
```

### Room Configuration (via Admin Panel)
- **Name**: Display name for the room
- **Icon**: Emoji or Material Design icon
- **Order**: Display order in the rooms grid
- **Entities**: List of assigned entities

### Entity Configuration (via Admin Panel)
- **Custom Name**: Override the default friendly name
- **Custom Icon**: Set a custom icon for the entity
- **Entity Type**: Classification for specialized widgets
- **Room Assignment**: Assign entity to a specific room

### CSS Configuration (via Admin Panel)
- **Primary Color**: Main accent color for the dashboard
- **Secondary Color**: Secondary accent color for gradients
- **Background Color**: Main background color
- **Text Color**: Primary text color
- **Font Family**: Typography selection
- **Border Radius**: Roundness of widget corners

## 🛠️ Development and Customization

### File Structure
```
custom_components/dashview/
├── __init__.py          # Main integration setup
├── config_flow.py       # Configuration flow
├── const.py            # Constants and default configuration
├── data_store.py       # Data storage and management
├── api.py              # API endpoints for admin functionality
├── widgets.py          # Custom widget definitions
├── admin_js.py         # Admin interface JavaScript
├── sensor.py           # Sensor platform
├── services.py         # Custom services
├── services.yaml       # Service definitions
├── manifest.json       # Integration manifest
└── translations/       # Localization files
    └── en.json
```

### API Endpoints

- **`/api/dashview/data`**: Dashboard data and entity states
- **`/api/dashview/admin`**: Administrative operations (admin-only)
- **`/dashview`**: Main dashboard interface

### Custom Services

- **`dashview.refresh_dashboard`**: Manually refresh dashboard data

## 🔄 Backup and Restore

### Exporting Configuration
1. Go to Admin → Backup & Restore
2. Click "Export Configuration"
3. Save the JSON file to your computer

### Importing Configuration
1. Go to Admin → Backup & Restore
2. Click "Import Configuration"
3. Select your saved JSON file
4. Confirm the import

## 📱 Mobile Support

DashView is fully responsive and works on mobile devices:
- Touch-friendly controls
- Optimized layouts for smaller screens
- Swipe navigation support
- Mobile-optimized widget sizing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a development branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/mholzi/dashview/issues)
- **Discussions**: Join the community discussion on [GitHub Discussions](https://github.com/mholzi/dashview/discussions)

## 🙏 Acknowledgments

- Home Assistant community for inspiration and support
- Contributors who helped improve this integration
- Beta testers who provided valuable feedback

---

**DashView v2.0.0** - Transform your Home Assistant experience with a fully configurable, room-based dashboard that puts you in complete control of your smart home interface.
