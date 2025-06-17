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