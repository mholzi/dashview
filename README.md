<p align="center">
  <img src="docs/images/logo.png" alt="Dashview Logo" width="120" />
</p>

<h1 align="center">Dashview</h1>

<p align="center">
  <strong>The Smart Dashboard That Finally Makes Home Assistant Accessible to Everyone</strong>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge" alt="HACS Custom"></a>
  <a href="https://github.com/mholzi/dashview/releases"><img src="https://img.shields.io/github/v/release/mholzi/dashview?style=for-the-badge&color=green" alt="GitHub Release"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-faq">FAQ</a>
</p>

---

## The Problem

You've spent countless hours setting up Home Assistant. Your smart home is powerful—but there's a problem:

**Your family won't use it.**

Why? Because traditional dashboards require:
- Hours of YAML configuration
- Manual updates when you add devices
- Technical knowledge to navigate
- Constant maintenance

**What if your dashboard could build itself?**

---

## The Solution

<p align="center">
  <img src="docs/images/hero-screenshot.png" alt="Dashview Hero Screenshot" width="800" />
</p>

**Dashview transforms your smart home into a dashboard anyone can use.**

It reads your existing Home Assistant data—Labels, Areas, and Floors—and automatically creates a beautiful, intuitive interface. No YAML. No manual configuration. No technical knowledge required.

**Install it. Open it. Done.**

---

## Why Dashview?

| Traditional Dashboards | Dashview |
|------------------------|----------|
| Hours of YAML configuration | Zero configuration |
| Manual card creation for each device | Automatic organization by room |
| Update cards when adding devices | New devices appear automatically |
| Only the tech person uses it | The whole family uses it |
| Breaks when you update | Updates load automatically |

---

## Quick Start

```bash
# 1. Install via HACS (add as custom repository)
# 2. Restart Home Assistant
# 3. Add the integration from Settings → Devices & Services
# 4. Open Dashview from your sidebar
# That's it. Your dashboard is ready.
```

**Time to first dashboard: Under 5 minutes.**

---

## Features

### Room-Based Control

Every room in your home becomes a beautiful, tappable card. One tap opens full control of everything in that room.

<p align="center">
  <img src="docs/images/room-cards.png" alt="Room Cards" width="600" />
</p>

- **Temperature at a glance** — See current temperature on every room card
- **Activity indicators** — Know which lights are on, which windows are open
- **One-tap access** — Full room control is always one tap away

---

### Complete Device Control

Control every device type from a single, unified interface.

<table>
<tr>
<td width="50%">

#### Lights
<img src="docs/images/lights-control.png" alt="Lights Control" width="300" />

- Individual brightness sliders
- Color temperature control
- "All Lights" quick toggle
- Grouped by room

</td>
<td width="50%">

#### Climate
<img src="docs/images/climate-control.png" alt="Climate Control" width="300" />

- Target vs. current temperature
- Heating/cooling mode indicators
- 24-hour temperature charts
- Multi-zone support

</td>
</tr>
<tr>
<td width="50%">

#### Covers & Blinds
<img src="docs/images/covers-control.png" alt="Covers Control" width="300" />

- Position sliders
- Open/Close/Stop buttons
- Roof window support
- Tilt control

</td>
<td width="50%">

#### Media Players
<img src="docs/images/media-control.png" alt="Media Control" width="300" />

- Now playing with album art
- Playback controls
- Volume adjustment
- Multi-room audio

</td>
</tr>
</table>

---

### Security at a Glance

Know the state of your home instantly.

<p align="center">
  <img src="docs/images/security-overview.png" alt="Security Overview" width="600" />
</p>

| Feature | What You See |
|---------|--------------|
| **Windows** | All open windows with time since opened |
| **Motion** | Recent activity throughout your home |
| **Water Leak** | Immediate alerts when moisture is detected |
| **Smoke Detectors** | Instant alerts if triggered |
| **Garage Doors** | Open/closed status at a glance |

---

### Weather Integration

Plan your day without leaving the dashboard.

<p align="center">
  <img src="docs/images/weather-popup.png" alt="Weather Popup" width="500" />
</p>

- Current conditions with detailed metrics
- Hourly forecast
- Multi-day overview
- Weather alerts (DWD support for Germany)
- Pollen forecast (via [DWD Pollenflug](https://github.com/mampfes/hacs_dwd_pollenflug) integration)

---

### Floor Overview

Navigate multi-story homes with ease.

<p align="center">
  <img src="docs/images/floor-overview.png" alt="Floor Overview" width="600" />
</p>

- Swipe between floors
- Temperature overview per floor
- Quick access to all rooms on each level

---

### Beautiful, Fast UI

<p align="center">
  <img src="docs/images/ui-showcase.png" alt="UI Showcase" width="700" />
</p>

- **Native Web Components** — Lightweight, no bloat
- **Skeleton Loading** — Smooth transitions, no jarring content shifts
- **Haptic Feedback** — Tactile responses on touch devices
- **Dark Mode** — Automatic theme switching
- **Mobile First** — Touch-friendly, responsive design

---

## Screenshots

### Home Dashboard

<p align="center">
  <img src="docs/images/screenshot-home.png" alt="Home Dashboard" width="800" />
</p>

### Room Popup

<p align="center">
  <img src="docs/images/screenshot-room-popup.png" alt="Room Popup" width="400" />
</p>

### Admin Panel

<p align="center">
  <img src="docs/images/screenshot-admin.png" alt="Admin Panel" width="800" />
</p>

### Mobile View

<p align="center">
  <img src="docs/images/screenshot-mobile.png" alt="Mobile View" width="300" />
</p>

---

## Installation

### Option 1: HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Click the **⋮** menu → **Custom repositories**
3. Add: `https://github.com/mholzi/dashview`
4. Select category: **Integration**
5. Search for **"Dashview"** and install
6. **Restart Home Assistant**
7. Go to **Settings** → **Devices & Services** → **Add Integration** → **Dashview**

### Option 2: Manual Installation

1. Download the [latest release](https://github.com/mholzi/dashview/releases)
2. Copy `custom_components/dashview` to your `config/custom_components/` directory
3. Restart Home Assistant
4. Add the integration from Settings

---

## Setup Guide

### How Dashview Organizes Your Home

Dashview uses Home Assistant's native organization system:

```
Labels      →    What type of device is it?
Areas       →    Which room is it in?
Floors      →    Which floor is the room on?
```

### Step 1: Create Labels

Go to **Settings** → **Labels** and create labels for your device types:

| Label | For These Devices |
|-------|-------------------|
| `Lights` | All controllable lights |
| `Climate` | Thermostats, HVAC |
| `Covers` | Blinds, shutters, curtains |
| `Windows` | Window contact sensors |
| `Motion` | Motion/presence sensors |
| `Water Leak` | Water leak/moisture sensors |
| `Smoke` | Smoke/fire detectors |
| `Media` | Speakers, TVs |
| `Garage` | Garage door controls |

### Step 2: Assign Labels to Entities

For each entity:
1. **Settings** → **Devices & Services** → **Entities**
2. Click the entity → Add labels

### Step 3: Organize into Areas

Ensure entities are assigned to Areas (rooms):
- Via device settings, or
- Directly on the entity

### Step 4: Configure in Dashview

**New in v1.3.0:** The **Setup Wizard** launches automatically for new installations and guides you through the entire configuration process—label mapping, room visibility, and dashboard layout. Just follow the steps!

For manual configuration or to make changes later:
1. Open **Dashview** from sidebar
2. Click the **gear icon** to open the Admin panel
3. Map your labels to Dashview categories
4. Toggle entity visibility as needed

**That's it!** Your dashboard updates automatically as you add devices.

---

## Supported Devices

Dashview works with any Home Assistant entity in these domains:

| Domain | Features |
|--------|----------|
| `light` | Brightness, color, temperature |
| `climate` | Temperature control, modes |
| `cover` | Position, tilt, open/close |
| `binary_sensor` | Windows, motion, moisture, smoke |
| `sensor` | Temperature, humidity, battery |
| `media_player` | Playback, volume, queue |
| `switch` | On/off control |
| `scene` | One-tap activation |
| `script` | Custom actions |

---

## FAQ

<details>
<summary><strong>Why aren't my devices showing up?</strong></summary>

Ensure each entity has:
1. A **label** assigned that's mapped in Dashview settings
2. An **area** assigned (directly or via its device)
3. Is **enabled** in the Dashview admin panel

</details>

<details>
<summary><strong>Can I use this alongside my existing dashboard?</strong></summary>

Yes! Dashview runs as a separate panel in your sidebar. It doesn't replace or affect your existing Lovelace dashboards.

</details>

<details>
<summary><strong>Does this work on mobile?</strong></summary>

Absolutely. Dashview is fully responsive and touch-optimized. It works great in the Home Assistant companion app.

</details>

<details>
<summary><strong>How do I change the order of rooms?</strong></summary>

Open the Admin panel (gear icon) → **Layout** tab. You can reorder floors and rooms using drag-and-drop or the arrow buttons.

</details>

<details>
<summary><strong>Can I add custom scenes to rooms?</strong></summary>

Yes! In Dashview's admin panel, navigate to Scene Buttons and assign scenes or scripts to specific rooms.

</details>

<details>
<summary><strong>What Home Assistant version do I need?</strong></summary>

Home Assistant 2024.1.0 or newer (requires the Labels feature).

</details>

---

## Requirements

- Home Assistant **2024.1.0** or newer
- Labels feature (built into HA 2024.1+)
- Areas configured for your entities

---

## Contributing

We welcome contributions! Whether it's:

- Bug reports
- Feature requests
- Pull requests
- Documentation improvements

Please visit our [GitHub Issues](https://github.com/mholzi/dashview/issues) to get started.

---

## Support

- **Bug Reports**: [GitHub Issues](https://github.com/mholzi/dashview/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/mholzi/dashview/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mholzi/dashview/discussions)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with love for the Home Assistant community</strong>
</p>

<p align="center">
  <a href="https://github.com/mholzi/dashview">
    <img src="https://img.shields.io/github/stars/mholzi/dashview?style=social" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <sub>Made by <a href="https://github.com/mholzi">@mholzi</a></sub>
</p>
