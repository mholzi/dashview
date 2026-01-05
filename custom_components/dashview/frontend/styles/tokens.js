/**
 * Design Tokens for Dashview
 *
 * Centralized design values that can be used in JavaScript.
 * These mirror the CSS custom properties in index.js (dashview-styles.js)
 *
 * Usage:
 *   import { SPACING, COLORS, RADIUS } from './styles/tokens.js';
 *   style="padding: ${SPACING.md}; border-radius: ${RADIUS.lg};"
 */

// Spacing scale
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
};

// Border radius scale
export const RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '100px',
};

// Icon sizes
export const ICON_SIZE = {
  xs: '14px',
  sm: '18px',
  md: '22px',
  lg: '24px',
  xl: '28px',
  '2xl': '32px',
  '3xl': '48px',
};

// Transition durations
export const TRANSITION = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s',
  press: '0.1s',
};

// Animation durations
export const ANIMATION = {
  press: '0.1s ease-out',
  expand: '0.2s ease-in-out',
  coach: '2s ease-in-out',
};

// Focus styles
export const FOCUS = {
  ring: 'var(--dv-focus-ring)',
};

// Overlay colors
export const OVERLAY = {
  bg: 'rgba(0, 0, 0, 0.7)',
};

// Z-index scale
export const Z_INDEX = {
  dropdown: 100,
  sticky: 500,
  modal: 1000,
  popup: 9000,
  tooltip: 9500,
  coach: 10000,
  max: 10001,
};

// Colors (CSS variable references)
// These should be used as var(--dv-[color]) in styles
export const COLORS = {
  // Gray scale
  gray000: 'var(--dv-gray000)',
  gray100: 'var(--dv-gray100)',
  gray200: 'var(--dv-gray200)',
  gray300: 'var(--dv-gray300)',
  gray400: 'var(--dv-gray400)',
  gray500: 'var(--dv-gray500)',
  gray600: 'var(--dv-gray600)',
  gray700: 'var(--dv-gray700)',
  gray800: 'var(--dv-gray800)',

  // Semantic
  black: 'var(--dv-black)',
  white: 'var(--dv-white)',
  background: 'var(--dv-background)',
  popupBg: 'var(--dv-popup-bg-color)',

  // Accents
  green: 'var(--dv-green)',
  purple: 'var(--dv-purple)',
  yellow: 'var(--dv-yellow)',
  red: 'var(--dv-red)',
  blue: 'var(--dv-blue)',
  blueDark: 'var(--dv-blue-dark)',
  orange: 'var(--dv-orange)',
  pink: 'var(--dv-pink)',
  lime: 'var(--dv-lime)',
};

// Gradients
export const GRADIENTS = {
  active: 'var(--dv-gradient-active)',
  light: 'var(--dv-gradient-light)',
  media: 'var(--dv-gradient-media)',
  mediaHorizontal: 'var(--dv-gradient-media-horizontal)',
};

// Shadows
export const SHADOWS = {
  light: 'var(--dv-shadow-light)',
  medium: 'var(--dv-shadow-medium)',
  heavy: 'var(--dv-shadow-heavy)',
  interactive: 'var(--dv-shadow-interactive)',
  pressed: 'var(--dv-shadow-pressed)',
};

// Card dimensions
export const CARD = {
  smallHeight: '76px',
  bigHeight: '152px',  // 2 * smallHeight
  overviewHeight: '147px',
};

// Common style mixins as template strings
export const MIXINS = {
  // Flex center
  flexCenter: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,

  // Absolute fill
  absoluteFill: `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  `,

  // Text ellipsis
  textEllipsis: `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,

  // No select
  noSelect: `
    user-select: none;
    -webkit-user-select: none;
  `,

  // Swipeable container
  swipeable: `
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  `,

  // Card base
  cardBase: `
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    padding: var(--dv-spacing-md, 12px);
  `,
};

// Export all as default for convenience
export default {
  SPACING,
  RADIUS,
  ICON_SIZE,
  TRANSITION,
  ANIMATION,
  FOCUS,
  OVERLAY,
  Z_INDEX,
  COLORS,
  GRADIENTS,
  SHADOWS,
  CARD,
  MIXINS,
};
