# Styles

Design system and styling for DashView.

## Structure

```
styles/
├── tokens.js    # Design tokens (colors, spacing, shadows)
├── base.js      # Base styles (host, typography, resets)
└── index.js     # Main styles export
```

## Design Tokens

JavaScript constants for consistent styling.

```javascript
import { COLORS, SPACING, RADIUS, SHADOWS } from './styles/tokens.js';

// Colors
COLORS.gray000    // "#FFFFFF"
COLORS.gray800    // "#1a1a1a"
COLORS.accent     // "#4A90D9"

// Spacing
SPACING.xs        // "4px"
SPACING.sm        // "8px"
SPACING.md        // "16px"
SPACING.lg        // "24px"

// Radius
RADIUS.sm         // "8px"
RADIUS.md         // "12px"
RADIUS.lg         // "16px"

// Shadows
SHADOWS.sm        // "0 1px 2px rgba(0,0,0,0.05)"
SHADOWS.md        // "0 4px 6px rgba(0,0,0,0.1)"
```

## CSS Custom Properties

The main styles define CSS custom properties:

```css
:host {
  /* Gray scale */
  --dv-gray000: #FFFFFF;
  --dv-gray100: #F5F5F5;
  --dv-gray200: #E5E5E5;
  --dv-gray300: #D4D4D4;
  --dv-gray400: #A3A3A3;
  --dv-gray500: #737373;
  --dv-gray600: #525252;
  --dv-gray700: #404040;
  --dv-gray800: #262626;

  /* Semantic colors */
  --dv-black: #000000;
  --dv-white: #FFFFFF;
  --dv-background: var(--dv-gray100);
  --dv-accent: #4A90D9;

  /* Gradients */
  --dv-active-gradient: linear-gradient(135deg, #FFB347, #FF6B6B);
  --dv-light-gradient: linear-gradient(135deg, #FFE082, #FFB347);
}
```

## Base Styles

Common styles for typography, resets, and utilities.

```javascript
import { baseStyles, hostStyles, typographyStyles } from './styles/base.js';
```

## Usage in Components

```javascript
import { COLORS, SPACING } from '../styles/tokens.js';

const cardStyle = `
  padding: ${SPACING.md};
  background: ${COLORS.gray000};
  border-radius: ${RADIUS.md};
`;
```
