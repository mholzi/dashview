# Dashview

**A beautiful, label-based dashboard for Home Assistant that automatically organizes your smart home by rooms and areas.**

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/mholzi/dashview)](https://github.com/mholzi/dashview/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Smart Dashboard That Understands Your Home

**Stop manually configuring dashboard cards for every device.** Dashview uses Home Assistant's native **Labels**, **Areas**, and **Floors** to automatically build a stunning, intuitive dashboard. Simply label your entities, assign them to areas, and Dashview does the rest.

### How It Works

1. **Create Labels** in Home Assistant (e.g., "Lights", "Climate", "Windows")
2. **Assign Labels** to your entities
3. **Organize entities into Areas** (Kitchen, Living Room, Bedroom, etc.)
4. **Map your Labels** in Dashview's admin panel
5. **Done!** Your dashboard automatically populates with room cards, controls, and status indicators

No YAML. No card configurations. No manual updates when you add new devices.

---

## Features

### Room-Based Navigation
- **Automatic Room Cards** - Each area becomes a tappable card showing temperature, active lights, and quick status
- **Floor Overview** - Swipe through floors to see temperature across your home
- **Smart Room Popups** - Tap any room for full control of all devices in that area

### Comprehensive Device Control

| Category | Features |
|----------|----------|
| **Lights** | Individual dimmer sliders, color temperature, "All Lights" quick toggle |
| **Climate** | Thermostat controls, current vs. target temperature, heating/cooling status |
| **Covers & Blinds** | Position sliders, open/close/stop controls, roof window support |
| **Media Players** | Now playing info, playback controls, volume adjustment |
| **Garage Doors** | Status indicators, open/close controls |
| **Appliances** | Power monitoring, on/off controls |

### Security at a Glance
- **Window Status** - See all open/closed windows with time-since-last-change
- **Motion Sensors** - Track recent motion activity throughout your home
- **Smoke Detectors** - Instant alerts for any triggered detectors
- **Garage Doors** - Quick view of all garage door states

### Weather Integration
- **Current Conditions** - Temperature, humidity, wind speed, pressure
- **Hourly Forecast** - Plan your day with detailed hourly predictions
- **DWD Weather Warnings** - German weather service alerts (if configured)

### Smart Status Chips
Each room popup displays intelligent status chips:
- Motion detected (with time ago)
- Windows open/closed
- Smoke detector status
- Climate mode indicators

### Beautiful, Fast UI
- **Native Web Components** - Lightweight, no external dependencies
- **Skeleton Loading** - Smooth loading states, no jarring content shifts
- **Haptic Feedback** - Tactile responses on supported devices
- **Dark Mode Ready** - Follows your Home Assistant theme
- **Mobile Optimized** - Touch-friendly controls, swipe gestures

---

## Screenshots

*Coming soon*

---

## Installation

### HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Click the **three dots** in the top right corner
3. Select **Custom repositories**
4. Add this repository URL:
   ```
   https://github.com/mholzi/dashview
   ```
5. Select category: **Integration**
6. Click **Add**
7. Search for **"Dashview"** and click **Install**
8. **Restart Home Assistant**

### Manual Installation

1. Download the [latest release](https://github.com/mholzi/dashview/releases)
2. Extract and copy the `custom_components/dashview` folder to your Home Assistant `config/custom_components/` directory
3. Restart Home Assistant

---

## Configuration

### Step 1: Add the Integration

1. Go to **Settings** → **Devices & Services**
2. Click **+ Add Integration**
3. Search for **"Dashview"**
4. Click to install

Dashview will appear in your sidebar automatically.

### Step 2: Set Up Your Labels

In Home Assistant, create labels for your entity categories. Go to **Settings** → **Labels** and create labels like:

| Suggested Label | Purpose |
|-----------------|---------|
| `Lights` | All controllable lights |
| `Climate` | Thermostats and HVAC |
| `Covers` | Blinds, shutters, curtains |
| `Windows` | Window contact sensors |
| `Motion` | Motion/presence sensors |
| `Smoke` | Smoke/fire detectors |
| `Media` | Speakers, TVs, media players |
| `Garage` | Garage door controls |
| `Temperature` | Temperature sensors |
| `Humidity` | Humidity sensors |

### Step 3: Label Your Entities

Assign the labels you created to your entities:
1. Go to **Settings** → **Devices & Services** → **Entities**
2. Click on an entity
3. Add the appropriate label(s)

### Step 4: Organize into Areas

Ensure your entities are assigned to Areas:
1. Entities can be assigned to areas via their device, or directly
2. Each area represents a "room" in Dashview
3. Areas can be assigned to Floors for floor-based navigation

### Step 5: Map Labels in Dashview

1. Open **Dashview** from the sidebar
2. Click the **gear icon** to open Admin settings
3. In the **Label Mapping** section, map your Home Assistant labels to Dashview categories
4. Configure which entities are enabled/disabled per category

---

## Supported Entity Types

Dashview intelligently handles these entity domains:

- `light` - Full brightness and color control
- `climate` - Thermostat and HVAC control
- `cover` - Blinds, shutters, garage doors
- `binary_sensor` - Windows, motion, smoke detectors
- `sensor` - Temperature, humidity, battery levels
- `media_player` - Speakers, TVs, streaming devices
- `switch` - Appliances, smart plugs
- `scene` - Quick scene activation buttons
- `script` - Custom automation triggers

---

## Customization

### Scene Buttons

Add custom scene buttons to any room:
1. Open Admin settings
2. Navigate to **Scene Buttons**
3. Assign scenes or scripts to specific rooms
4. They appear as quick-action buttons in room popups

### Entity Visibility

Fine-tune which entities appear:
1. Open Admin settings
2. Each category shows all matching entities
3. Toggle visibility per entity
4. Hidden entities won't appear in the dashboard

### Weather Entity

Configure your weather provider:
1. Open Admin settings
2. Select your weather entity from the dropdown
3. Weather data appears in the header and weather popup

---

## Requirements

- Home Assistant 2024.1.0 or newer
- Labels feature (introduced in HA 2024.x)
- Areas configured for your entities

---

## FAQ

**Q: Why don't my devices show up?**
A: Ensure entities have:
1. A label assigned that's mapped in Dashview admin
2. An area assigned (directly or via device)
3. Are enabled in the Dashview admin panel

**Q: Can I use this alongside my existing dashboard?**
A: Dashview runs as a separate panel in the sidebar, so it doesn't replace or interfere with your existing Lovelace dashboards.

**Q: Does this work on mobile?**
A: Yes! Dashview is fully responsive and touch-optimized.

**Q: How do I change the order of rooms?**
A: Room order follows Home Assistant's area ordering. Reorder areas in HA to change Dashview's display order.

---

## Support

- **Issues & Bug Reports**: [GitHub Issues](https://github.com/mholzi/dashview/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/mholzi/dashview/issues)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with love for the Home Assistant community.
