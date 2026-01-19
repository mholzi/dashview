/**
 * Color System Styles
 * Light and dark mode color palettes with CSS custom properties
 */

export const colorStyles = `
  /* ==================== COLOR SYSTEM ==================== */
  /*
   * Light Mode Color Palette (Default)
   * These colors are optimized for light backgrounds
   */
  :host {
    /* Gray Scale - Light Mode (matches mysmarthome theme) */
    --dv-gray000: #edeff2;  /* Lightest - inactive card backgrounds */
    --dv-gray100: #e9eaec;  /* Light - slider tracks, button backgrounds */
    --dv-gray200: #d6d7d9;  /* Section backgrounds, pagination */
    --dv-gray300: #b6b7b9;  /* Hover states, placeholders */
    --dv-gray400: #909193;  /* Medium - active pagination, slider tracks */
    --dv-gray500: #707173;  /* Placeholder icons */
    --dv-gray600: #494a4c;  /* Subtitles, count text */
    --dv-gray700: #313233;  /* Secondary text emphasis */
    --dv-gray800: #0f0f10;  /* Primary text on light, tab bar bg */

    /* Semantic Colors (matches mysmarthome theme) */
    --dv-black: #28282A;
    --dv-white: #f5f7fa;
    --dv-background: var(--primary-background-color, #f5f7fa);
    --dv-popup-bg-color: #fafbfc;

    /* Accent Colors - Light Mode */
    --dv-green: #c5e4ac;
    --dv-purple: #e3d4f6;
    --dv-yellow: #faedae;
    --dv-red: #f0a994;
    --dv-blue: #c8ddfa;
    --dv-blue-dark: #abcbf8;
    --dv-orange: #ffd1b1;
    --dv-pink: #eda7b2;
    --dv-lime: #e6f4ac;
    --dv-warning-text: #0f0f10;  /* Fixed dark text for warning cards */

    /* Popup/Card Backgrounds */
    --dv-popup-bg: var(--ha-card-background, var(--card-background-color));
    --dv-card-bg: var(--dv-gray000);

    /* Gradient Accents */
    --dv-gradient-active: linear-gradient(145deg, rgba(255,220,178,1) 0%, rgba(255,176,233,1) 60%, rgba(104,156,255,1) 150%);
    --dv-gradient-light: linear-gradient(145deg, rgba(255,245,200,1) 0%, rgba(255,225,130,1) 60%, rgba(255,200,90,1) 150%);
    --dv-gradient-media: linear-gradient(145deg, rgba(255,200,138,1) 0%, rgba(238,149,255,1) 100%);
    --dv-gradient-media-horizontal: linear-gradient(90deg, rgba(255,200,138,1) 0%, rgba(238,149,255,1) 100%);

    /* Appliance Active States - inherits from theme or uses fallback */
    --dv-active-appliances: var(--active-appliances, var(--dv-gradient-active));
    --dv-active-appliances-done: var(--active-appliances-done, var(--dv-orange));

    /* Highlight for transparent overlays (RGB values for rgba()) - matches mysmarthome theme */
    --dv-highlight-rgb: 40, 40, 42;

    /* Shadow */
    --dv-shadow-light: rgba(0, 0, 0, 0.1);
    --dv-shadow-medium: rgba(0, 0, 0, 0.15);
    --dv-shadow-heavy: rgba(0, 0, 0, 0.2);
    --dv-shadow-interactive: 0 2px 8px rgba(0, 0, 0, 0.12);
    --dv-shadow-pressed: 0 1px 3px rgba(0, 0, 0, 0.08);

    /* Animation */
    --dv-animation-press: 0.1s ease-out;
    --dv-animation-expand: 0.2s ease-in-out;
    --dv-animation-coach: 2s ease-in-out;

    /* Focus */
    --dv-focus-ring: 0 0 0 3px var(--dv-blue);

    /* Overlay */
    --dv-overlay-bg: rgba(0, 0, 0, 0.7);

    /* Border Radius Scale */
    --dv-radius-sm: 8px;
    --dv-radius-md: 12px;
    --dv-radius-lg: 16px;
    --dv-radius-xl: 20px;
    --dv-radius-full: 100px;

    /* Icon Size Scale */
    --dv-icon-xs: 14px;
    --dv-icon-sm: 18px;
    --dv-icon-md: 22px;
    --dv-icon-lg: 24px;
    --dv-icon-xl: 28px;
    --dv-icon-2xl: 32px;
    --dv-icon-3xl: 48px;

    /* Transition Durations */
    --dv-transition-fast: 0.15s;
    --dv-transition-normal: 0.2s;
    --dv-transition-slow: 0.3s;

    /* Z-Index Scale
     * Hierarchy designed to allow HA more-info dialog (z-index: 8) to appear above Dashview popups
     * Base content: 1-2
     * Dashview popups/modals: 3-6
     * HA more-info dialog: 8 (HA default from --dialog-z-index)
     * Tab bar: 9 (always visible above dialogs)
     * Coach marks: 10000+ (should always be on top)
     */
    --dv-z-dropdown: 3;
    --dv-z-sticky: 4;
    --dv-z-popup: 5;
    --dv-z-modal: 6;
    --dv-z-tooltip: 7;
    --dv-z-coach: 10000;
    --dv-z-max: 10001;

    /* Layout */
    display: block;
    background: var(--dv-background);
    min-height: 100vh;
    box-sizing: border-box;
    max-width: 500px;
    margin: 0 auto;
  }

  /*
   * Dark Mode Color Palette
   * Automatically applied when Home Assistant uses dark theme
   * Detected via prefers-color-scheme or HA's dark mode class
   */
  @media (prefers-color-scheme: dark) {
    :host {
      /* Gray Scale - Dark Mode (matches mysmarthome theme) */
      --dv-gray000: #3a3b3d;  /* Darkest - inactive card backgrounds */
      --dv-gray100: #353637;  /* Dark - slider tracks, button backgrounds */
      --dv-gray200: #404142;  /* Section backgrounds */
      --dv-gray300: #555658;  /* Hover states */
      --dv-gray400: #737476;  /* Medium */
      --dv-gray500: #939496;  /* Placeholder icons */
      --dv-gray600: #c8c9cb;  /* Subtitles, count text */
      --dv-gray700: #eff0f2;  /* Secondary text */
      --dv-gray800: #ffffff;  /* Primary text on dark */

      /* Semantic Colors - adjusted for dark mode */
      --dv-black: #ffffff;    /* Inverted for dark mode text */
      --dv-white: #28282A;    /* Inverted for dark mode backgrounds */
      --dv-background: var(--primary-background-color, #28282A);
      --dv-popup-bg-color: #28282A;

      /* Accent Colors - Dark Mode (matches mysmarthome theme) */
      --dv-green: #d2e7d6;
      --dv-purple: #d5c1ed;
      --dv-yellow: #fbf1be;
      --dv-red: #e7625f;
      --dv-blue: #abcbf8;
      --dv-blue-dark: #c8ddfa;
      --dv-orange: #ffba8a;
      --dv-pink: #f6b9c3;
      --dv-lime: #eaf6bc;

      /* Highlight for transparent overlays - matches mysmarthome dark theme */
      --dv-highlight-rgb: 250, 251, 252;

      /* Shadow - increased opacity for dark mode visibility */
      --dv-shadow-light: rgba(0, 0, 0, 0.3);
      --dv-shadow-medium: rgba(0, 0, 0, 0.4);
      --dv-shadow-heavy: rgba(0, 0, 0, 0.5);
      --dv-shadow-interactive: 0 2px 8px rgba(0, 0, 0, 0.25);
      --dv-shadow-pressed: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }

  /* Home Assistant dark theme detection via body class */
  :host-context(html.dark-mode),
  :host-context(body.dark-mode),
  :host-context([data-theme="dark"]) {
    /* Gray Scale - Dark Mode (matches mysmarthome theme) */
    --dv-gray000: #3a3b3d;
    --dv-gray100: #353637;
    --dv-gray200: #404142;
    --dv-gray300: #555658;
    --dv-gray400: #737476;
    --dv-gray500: #939496;
    --dv-gray600: #c8c9cb;
    --dv-gray700: #eff0f2;
    --dv-gray800: #ffffff;

    --dv-black: #ffffff;
    --dv-white: #28282A;
    --dv-background: var(--primary-background-color, #28282A);
    --dv-popup-bg-color: #28282A;

    /* Accent Colors - Dark Mode (matches mysmarthome theme) */
    --dv-green: #d2e7d6;
    --dv-purple: #d5c1ed;
    --dv-yellow: #fbf1be;
    --dv-red: #e7625f;
    --dv-blue: #abcbf8;
    --dv-blue-dark: #c8ddfa;
    --dv-orange: #ffba8a;
    --dv-pink: #f6b9c3;
    --dv-lime: #eaf6bc;

    --dv-highlight-rgb: 250, 251, 252;

    --dv-shadow-light: rgba(0, 0, 0, 0.3);
    --dv-shadow-medium: rgba(0, 0, 0, 0.4);
    --dv-shadow-heavy: rgba(0, 0, 0, 0.5);
    --dv-shadow-interactive: 0 2px 8px rgba(0, 0, 0, 0.25);
    --dv-shadow-pressed: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 500px) {
    :host {
      max-width: 100%;
    }
  }
`;
