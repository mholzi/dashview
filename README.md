# DashView - Your Smart Home, Simplified.

DashView is a powerful and intuitive Home Assistant dashboard component designed to bring your smart home to life with a comprehensive, user-friendly interface. Built with a focus on modern design, seamless control, and deep integration, DashView provides an at-a-glance overview of your home, empowering you to manage devices, monitor sensors, and visualize data effortlessly.

Experience a dashboard that adapts to your needs, centralizing all your smart home controls in one elegant view.

## ✨ Key Features

* **Intuitive User Interface:** A clean, modern interface with customizable layouts and consistent design across all components, optimized for both mobile and tablet devices.
* **Customizable Layouts:** Design your dashboard with flexible grid-based layouts, allowing you to arrange sensor cards, room overviews, and information panels precisely how you want them.
* **Intelligent Sensor & Device Management:**
    * **Dynamic Sensor Cards:** Visualize motion, window, smoke, temperature, humidity, and other sensor states with dynamic icons and contextual information.
    * **Trend Indicators & Pattern Recognition:** Temperature and humidity sensors display intelligent trend indicators (↗ +5.2%, ↘ -3.1%) showing short-term changes, alongside pattern alerts for unusual activity (e.g., "25% higher than usual"). Fully configurable sensitivity levels and time periods allow you to customize the intelligence to your needs.
    * **Interactive Controls:** Easily control lights (including dimmable options), covers (blinds, shutters), and media players with intuitive sliders and buttons.
    * **Swipeable Cards:** Toggle between sensor state and time-since-last-change for motion, door, smoke, cover, and light entities with a simple swipe.
* **Advanced Integrations:**
    * **Multi-Calendar Support:** Integrate multiple Home Assistant calendar entities to display all your upcoming events in one unified view and on the main dashboard.
    * **Automated Scenes:** Generate "Lights Off" scenes for rooms with lights and a global "All Covers" scene with smart open/close logic.
    * **DWD Weather Warnings:** Display official German weather alerts directly on your dashboard.
    * **Person Management:** Configure person entities with linked device trackers, sensors, and calendars for personalized experiences.
* **Seamless Control:** Access detailed entity information and controls through dynamic pop-ups, providing granular management for individual devices.
* **Modern Design & Performance:**
    * **Shadow DOM Support:** Ensures robust component encapsulation and consistent theming across all elements.
    * **Light/Dark Mode:** Automatic theme switching based on your system preferences.
    * **Optimized Performance:** Efficient state management and asset loading ensure a smooth and responsive experience.

## 🚀 Getting Started

### Prerequisites

* A running Home Assistant instance.
* [HACS (Home Assistant Community Store)](https://hacs.xyz/) (recommended for easy installation and updates).

### Installation

#### Recommended: Via HACS

1.  Open HACS in your Home Assistant instance.
2.  Navigate to "Integrations" and click the `+ EXPLORE & ADD REPOSITORIES` button.
3.  Search for "DashView" and select it.
4.  Click "Download" and choose the latest version.
5.  Restart Home Assistant (Settings > System > Restart).
6.  Once Home Assistant restarts, go to Settings > Devices & Services > Integrations, click `+ ADD INTEGRATION`.
7.  Search for "DashView" and follow the on-screen prompts.
    * You will be directed to the custom admin panel for detailed configuration.

#### Manual Installation

1.  Download the latest release of DashView from the [GitHub Releases page](https://github.com/mholzi/dashview/releases).
2.  Extract the `dashview` folder from the downloaded archive.
3.  Place the `dashview` folder into your Home Assistant's `custom_components` directory (e.g., `/config/custom_components/`).
4.  Restart Home Assistant (Settings > System > Restart).
5.  Once Home Assistant restarts, go to Settings > Devices & Services > Integrations, click `+ ADD INTEGRATION`.
6.  Search for "DashView" and follow the on-screen prompts.

## 🛠️ Configuration: Tailor Your DashView

DashView features a comprehensive custom admin panel to manage all aspects of your dashboard. This panel allows you to configure rooms, assign entities, set up layouts, and much more.

### Accessing the Admin Panel

After installation, you can access the DashView Admin Panel directly via the Home Assistant UI:

1.  Go to **Settings** > **Devices & Services** > **Integrations**.
2.  Find the "DashView" integration and click "CONFIGURE" (or the three dots `...` and then "Options").
3.  This will redirect you to the custom admin panel.

### Admin Panel Overview

The admin panel is organized into various tabs to help you configure your smart home dashboard step-by-step:

#### House Setup: Define Rooms & Floors

This is the core of your DashView configuration, allowing you to define the physical structure of your home.

* **Synchronize with Home Assistant:** DashView automatically syncs with Home Assistant's Area and Floor registries. Any rooms or floors you define in Home Assistant will automatically appear here.
* **Friendly Names & Icons:** Assign user-friendly names and Material Design Icons (`mdi:icon-name`) to your rooms and floors.
* **Entity Assignments:** Assign lights, covers, media players, and various "header entities" (motion, windows, smoke, etc.) directly to your rooms. This ensures devices appear in the correct room popups and are tracked for floor-level activity.
* **Floor Layout Editor:** Visually define the layout of small sensor cards for each floor. Choose between:
    * `Auto`: DashView intelligently ranks and displays the most relevant sensors based on activity and importance.
    * `Pinned`: Always show a specific sensor in that slot.
    * `Empty`: Keep the slot blank.
    * `Room Swiper`: Display a carousel of room overview cards.
    * `Garbage`: Display a carousel of upcoming garbage collection dates.
* **Floor Ordering:** Reorder your floors by adjusting their "level" in the editor, which determines their display order in the floor tabs.

#### Sensor Management: Fine-tune Your Sensors

Assign and manage various sensor types for comprehensive home monitoring. DashView automatically discovers entities based on labels you assign in Home Assistant, with **case-insensitive matching** for flexibility.

* **Motion Sensors:** Configure motion sensors (labeled "Motion", "bewegung", etc.) to track activity in rooms.
* **Window Sensors:** Assign window sensors (labeled "Fenster", "Window", etc.) to monitor open/closed states.
* **Smoke Detectors:** Link smoke detectors (labeled "Rauchmelder", "Smoke", etc.) for safety monitoring.
* **Vibration Sensors:** Integrate vibration sensors (labeled "Vibration", etc.) for security or anomaly detection.
* **Door Sensors:** Assign door sensors (labeled "Door", etc.) for access monitoring.
* **Temperature & Humidity Sensors:** Assign these sensors to rooms for monitoring and intelligent trend analysis.
* **Global Thresholds:** Set global temperature and humidity thresholds to receive alerts when values exceed your limits.

##### Smart Trend Analysis & Pattern Recognition

DashView's intelligent trend analysis system automatically monitors your temperature and humidity sensors, providing actionable insights:

* **Real-time Trend Indicators:** Room cards and sensor displays show visual trend arrows and percentage changes:
  * ↗ +2.5% (increasing trend with green color)
  * ↘ -1.8% (decreasing trend with red/orange color) 
  * → stable (neutral trend with gray color)

* **Pattern Recognition:** Detects unusual activity patterns by comparing recent data against historical baselines:
  * "25% higher than usual" - alerts for significant deviations
  * "More volatile than usual" - detects increased variability
  * Configurable sensitivity levels (low/medium/high)

* **Multiple Time Horizons:** 
  * Short-term trends (2 hours) for immediate changes
  * Long-term trends (24 hours) for daily patterns
  * Baseline analysis (7 days) for anomaly detection

* **Configuration Options:**
  * Enable/disable trend indicators and pattern alerts
  * Adjust sensitivity thresholds
  * Customize time periods for trend calculation
  * Toggle individual features (indicators, patterns, etc.)

* **Performance Optimized:** Intelligent caching and minimal API calls ensure smooth operation without impacting Home Assistant performance.

#### Device Management: Lights, Covers & Media Players

Manage the core interactive devices in your smart home.

* **Light Setup:** Assign light entities (individual lights or light groups) to rooms.
* **Cover Setup:** Assign cover entities (blinds, shutters, garage doors) to rooms.
* **Media Player Management:** Assign media players (speakers, TVs) to specific rooms. Each room can have multiple players.
* **Media Player Presets:** Create custom shortcuts for your favorite playlists or media sources (e.g., Spotify playlists, local music files) that appear as quick-access buttons in your media player controls.

#### Scene Management: Automate Your Home

Simplify scene control with an intuitive interface.

* **Auto-Generated Scenes:** Enable a single toggle to automatically generate "Lights Off" scenes for every room containing lights. Similarly, activate a global toggle for an "All Covers" scene that controls all covers in your house. These scenes intelligently appear when relevant (e.g., "Lights Off" only shows if some lights are on).
* **Manual Scene Buttons:** Create custom scene buttons that trigger Home Assistant services or scripts. Configure their names, unique IDs, icons, types, and the entities they control.

#### Other Entities: Hoover, Mower, Custom Doors

Add specialized entities that might not fit standard categories.

* **Hoover Entities:** Link robotic vacuum cleaners to rooms for status display.
* **Mower Entities:** Integrate robotic lawn mowers for status display.
* **Custom Door Entities:** Manually add specific door/gate sensors if not automatically categorized.

#### Garbage Collection: Never Miss a Bin Day

Configure sensors that track upcoming garbage collection dates for display in your floor area.

* Assign specific sensor entities for different waste types (e.g., "Biomüll", "Hausmüll", "Gelber Sack") and display their next collection dates with appropriate icons.

#### Integrations: DWD Weather Warnings

* **DWD Weather Warning:** Select your DWD (Deutscher Wetterdienst) warning level sensor to display official German weather warnings in your dashboard.

#### Trend Analysis Configuration

Configure the intelligent trend analysis system for your temperature and humidity sensors:

* **Enable/Disable Features:** Toggle trend indicators and pattern recognition on or off
* **Sensitivity Levels:** Choose from three sensitivity levels:
  * **Low:** Only detect significant changes (10%+ for trends, 50%+ for patterns)
  * **Medium:** Balanced detection (5%+ for trends, 30%+ for patterns) - *Default*
  * **High:** Detect subtle changes (2%+ for trends, 15%+ for patterns)
* **Time Periods:** Customize analysis time horizons:
  * Short-term trend analysis (default: 2 hours)
  * Long-term trend analysis (default: 24 hours)
  * Baseline comparison period (default: 7 days)
* **Display Options:** Control what information is shown:
  * Show trend indicators (arrows and percentages)
  * Show pattern alerts (unusual activity notifications)
  * Tooltip details and confidence levels

All trend analysis configuration is accessible through the admin panel's integrations section.

#### Calendar Integration: Your Schedule at a Glance

* **Link Calendars:** Select which Home Assistant calendar entities you want to display. Events from all linked calendars will be merged and presented chronologically.
* **Upcoming Events Card:** A dedicated card on your main dashboard displays your next few upcoming events.

#### Person Management: Personalize Your Dashboard

* **Configure Persons:** Add and configure Home Assistant person entities.
* **Link Related Entities:** Associate device trackers, other sensors, and calendars with each person to personalize their status and information display.
* **Custom Modes:** Define custom "modes" for each person (e.g., "Working," "Away," "Sleeping") that can trigger specific Home Assistant services or scripts.

## 🏃 Usage: Daily Interaction

### Navigating the Dashboard

* **Floor Tabs:** At the top of your dashboard, navigate between different floors of your home.
* **Header Buttons:** Quick-access buttons at the top display activity (e.g., motion detected, open windows) in active rooms or playing media players.
* **Bottom Navigation:** Access core features like Security, Calendar, Music, and Admin via the fixed navigation bar at the bottom of the screen.
* **Pop-ups:** Clicking on most interactive elements will open a dynamic pop-up with more detailed information and controls.

### Controlling Devices

* **Room Pop-ups:** Click on any room or sensor card to open its dedicated pop-up. Here, you'll find controls for lights, covers, media players, and other assigned devices.
* **Light Control:** Toggle lights on/off, and for dimmable lights, adjust brightness with intuitive sliders.
* **Cover Control:** Open, close, or set a specific position (0-100%) for your covers.
* **Media Playback:** Control media players with play/pause, skip, and volume controls. Access your configured media presets with a single tap.
* **Long-Tap for Details:** Long-press on any sensor or device card to open a detailed entity information pop-up, showing its current state and all attributes.

### Viewing Information

* **Weather:** View current weather conditions, hourly forecasts, and daily forecasts in the Weather pop-up. Also see pollen forecasts and DWD warnings.
* **Security:** Monitor all security-related sensors (windows, motion, smoke, vibration) in the Security pop-up.
* **Info Card:** The main dashboard "Info Card" provides a concise summary of key home statuses, such as last motion detected, number of open windows, and appliance states.
* **Upcoming Events Card:** See a quick overview of your next few calendar events directly on the main dashboard.

## 🆘 Troubleshooting & Support

If you encounter any issues, please check the following:

1.  **Home Assistant Logs:** Look for any errors related to "DashView" in your Home Assistant logs.
2.  **Browser Console:** Open your browser's developer tools (F12 or right-click > Inspect) and check the "Console" tab for any JavaScript errors. Look for messages prefixed with `[DashView]`.
3.  **Clear Browser Cache:** Often, frontend issues can be resolved by clearing your browser cache and refreshing the DashView page.
4.  **Admin Panel Status:** Check the status messages in the DashView Admin Panel for any configuration loading or saving errors.
5.  **GitHub Issues:** If the problem persists, please check the [DashView GitHub Issue Tracker](https://github.com/mholzi/dashview/issues) for similar issues or create a new one.

## 🤝 Contribution

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please feel free to open an issue or submit a pull request on our [GitHub repository](https://github.com/mholzi/dashview).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
