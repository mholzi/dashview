# dashview

A comprehensive Home Assistant dashboard component with Shadow DOM support and custom CSS theming.

## Features

- **Shadow DOM CSS Variables**: Custom CSS properties (like `--popupBG`, `--gray000`, `--active-big`) are automatically injected into the Shadow DOM to ensure proper theming and colors for all components including popups and dynamic elements.

- **Light/Dark Mode Support**: Automatic theme switching based on system preferences with full Shadow DOM compatibility.

- **Component Isolation**: Uses Shadow DOM for proper component encapsulation while maintaining access to custom CSS variables.


- **Clean Music Interface**: The Music Tab provides a streamlined interface with media controls and cover art display without redundant room name headers.
- **Case-Insensitive Label Matching**: Entity discovery by labels (motion, window, smoke, vibration sensors) works with any capitalization in your Home Assistant labels. You can use "Motion", "motion", "MOTION", etc. - the system will find all matching entities regardless of case.

## Entity Label Configuration

The dashboard automatically discovers entities based on labels assigned in Home Assistant. Label matching is fully case-insensitive, so you can use any capitalization style you prefer:

- **Motion sensors**: Labels like "Motion", "motion", "MOTION", "bewegung", etc.
- **Window sensors**: Labels like "Fenster", "fenster", "Window", "window", etc.
- **Smoke detectors**: Labels like "Rauchmelder", "rauchmelder", "Smoke", "smoke", etc.
- **Vibration sensors**: Labels like "Vibration", "vibration", "VIBRATION", etc.

This provides flexibility when setting up your Home Assistant entities while ensuring consistent discovery and functionality.

## Shadow DOM CSS Variable Support

The component automatically injects all custom CSS properties into its Shadow DOM to ensure consistent theming. This includes:

- Color variables (backgrounds, text colors, accent colors)
- Gradient definitions for active states
- Card styling properties
- Popup background colors

