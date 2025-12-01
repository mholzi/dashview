/**
 * Dashview Panel Styles
 * Extracted CSS styles for the dashview panel
 *
 * Color System:
 * - Uses CSS custom properties for theming
 * - Supports both light and dark modes via Home Assistant theme
 * - Custom gray scale: gray000 (lightest) to gray1000 (darkest)
 * - Gradient accents for active states
 */

export const dashviewStyles = `
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
    --dv-background: #f5f7fa;
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
    --dv-card-bg: var(--card-background-color);

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

    /* Z-Index Scale */
    --dv-z-dropdown: 100;
    --dv-z-sticky: 500;
    --dv-z-modal: 1000;
    --dv-z-popup: 9000;
    --dv-z-tooltip: 9500;
    --dv-z-max: 9999;

    /* Layout */
    display: block;
    background: var(--primary-background-color);
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
      --dv-background: #28282A;
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

      /* Shadow - lighter for dark mode */
      --dv-shadow-light: rgba(0, 0, 0, 0.3);
      --dv-shadow-medium: rgba(0, 0, 0, 0.4);
      --dv-shadow-heavy: rgba(0, 0, 0, 0.5);
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
    --dv-background: #28282A;
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
  }

  @media (max-width: 500px) {
    :host {
      max-width: 100%;
    }
  }

  /* ==================== TOP HEADER ==================== */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 8px;
    background: var(--primary-background-color);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .menu-button {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--dv-transition-normal) ease;
  }

  .menu-button:hover {
    background: var(--dv-gray200);
  }

  .menu-button ha-icon {
    --mdc-icon-size: 24px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .weather-widget {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--card-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .weather-widget:hover {
    background: var(--dv-gray200);
  }

  .weather-icon {
    --mdc-icon-size: 32px;
    color: var(--primary-color);
  }

  .weather-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .weather-condition {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    text-transform: capitalize;
  }

  .weather-temp {
    font-size: 1.25em;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .person-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--card-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: transform var(--dv-transition-normal) ease;
  }

  .person-avatar:hover {
    transform: scale(1.05);
  }

  .person-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .person-avatar ha-icon {
    --mdc-icon-size: 28px;
    color: var(--secondary-text-color);
  }

  .person-avatar.home {
    background: var(--success-color, #4caf50);
  }

  .person-avatar.home ha-icon {
    color: white;
  }

  /* ==================== ACTIVITY ICONS ROW ==================== */
  .activity-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 16px 16px 16px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .activity-row::-webkit-scrollbar {
    display: none;
  }

  .activity-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--card-background-color);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    padding: 13px;
    box-sizing: border-box;
  }

  .activity-chip:hover {
    transform: scale(1.1);
  }

  .activity-chip ha-icon {
    --mdc-icon-size: 22px;
    color: var(--secondary-text-color);
  }

  .activity-chip.floor-chip {
    background: var(--dv-gray800);
  }

  .activity-chip.floor-chip ha-icon {
    color: var(--dv-gray000);
  }

  .activity-chip.room-chip {
    background: var(--dv-gradient-active);
  }

  .activity-chip.room-chip ha-icon {
    color: var(--dv-gray000);
  }

  .activity-chip.room-motion-chip {
    background: var(--dv-gradient-active);
  }

  .activity-chip.room-motion-chip ha-icon {
    color: var(--dv-black);
  }

  .activity-chip.room-smoke-chip {
    background: var(--error-color, var(--dv-red));
    animation: pulse-danger 1s infinite;
  }

  .activity-chip.room-smoke-chip ha-icon {
    color: var(--dv-white);
  }

  .activity-chip.security-chip {
    background: var(--card-background-color);
  }

  .activity-chip.security-chip ha-icon {
    color: var(--secondary-text-color);
  }

  .activity-chip.security-chip.has-open {
    background: var(--dv-gradient-active);
  }

  .activity-chip.security-chip.has-open ha-icon {
    color: var(--dv-black);
  }

  @keyframes pulse-danger {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  /* ==================== SKELETON LOADING STATES ==================== */
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      var(--dv-gray100) 25%,
      var(--dv-gray200) 50%,
      var(--dv-gray100) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: var(--dv-radius-sm);
  }

  .skeleton-card {
    background: linear-gradient(
      90deg,
      var(--dv-gray000) 25%,
      var(--dv-gray100) 50%,
      var(--dv-gray000) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: var(--dv-radius-md);
  }

  .skeleton-text {
    height: 1em;
    margin: 4px 0;
  }

  .skeleton-text.large {
    height: 2em;
  }

  .skeleton-text.small {
    height: 0.75em;
    width: 60%;
  }

  .skeleton-icon {
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
  }

  .skeleton-room-card {
    height: 143px;
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 8px;
  }

  .skeleton-room-card .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .skeleton-room-card .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 4px;
  }

  /* Floor overview loading state */
  .floor-overview-card.loading {
    background: var(--dv-gray000);
  }

  .floor-overview-card.loading .skeleton-slide {
    min-width: 100%;
    height: 143px;
    padding: 8px;
    display: grid;
    grid-template-areas: "n i" "temp temp";
    grid-template-rows: 1fr min-content;
    grid-template-columns: min-content 1fr;
  }

  .floor-overview-card.loading .skeleton-name {
    grid-area: n;
    width: 80px;
    height: 20px;
    margin: 14px;
  }

  .floor-overview-card.loading .skeleton-icon {
    grid-area: i;
    justify-self: end;
  }

  .floor-overview-card.loading .skeleton-temp {
    grid-area: temp;
    width: 60px;
    height: 32px;
    margin: 0 0 6px 14px;
  }

  /* Garbage card loading state */
  .garbage-card.loading {
    background: var(--dv-gray000);
  }

  .garbage-card.loading .skeleton-slide {
    min-width: 100%;
    height: 143px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .garbage-card.loading .skeleton-icon {
    align-self: flex-end;
    margin: -6px -6px 0 0;
  }

  .garbage-card.loading .skeleton-label {
    width: 80px;
    height: 28px;
    margin-top: auto;
  }

  .garbage-card.loading .skeleton-name {
    width: 100px;
    height: 16px;
  }

  /* ==================== SHARED POPUP STYLES ==================== */
  .popup-overlay {
    position: fixed;
    top: 0;
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    animation: fadeIn 0.2s ease;
    padding-top: 80px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideDown {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .popup-container {
    background: var(--ha-card-background, var(--card-background-color));
    background-color: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 88%, transparent);
    border-radius: 42px 42px 0 0;
    width: 100%;
    max-width: 500px;
    height: 100%;
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    animation: slideUp 0.3s ease;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }

  .popup-container::-webkit-scrollbar {
    display: none;
  }

  .popup-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    position: sticky;
    top: 0;
    background: var(--ha-card-background, var(--card-background-color));
    z-index: 10;
    border-radius: 42px 42px 0 0;
  }

  .popup-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--success-color, var(--dv-green));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .popup-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-black);
  }

  .popup-title {
    flex: 1;
  }

  .popup-title h2 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .popup-title p {
    margin: 2px 0 0 0;
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }

  .popup-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color);
    transition: all var(--dv-transition-normal) ease;
  }

  .popup-close:hover {
    background: var(--dv-gray200);
  }

  .popup-close ha-icon {
    --mdc-icon-size: 24px;
  }

  .popup-content {
    padding: 0 12px 80px 12px;
  }

  .popup-chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 20px 12px 8px 12px;
    margin-bottom: 8px;
    overflow-x: auto;
  }

  .popup-chips-row::-webkit-scrollbar {
    display: none;
  }

  .popup-chip {
    display: flex;
    align-items: center;
    min-height: 42px;
    padding: 4px;
    border-radius: 12px;
    background: var(--dv-gradient-active);
    min-width: fit-content;
  }

  .popup-chip.inactive {
    background: var(--dv-gray000);
  }

  .popup-chip.smoke {
    background: var(--error-color, var(--dv-red));
  }

  .popup-chip-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: var(--dv-gray800);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .popup-chip-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray000);
  }

  .popup-chip-content {
    display: flex;
    flex-direction: column;
    padding-left: 6px;
    padding-right: 8px;
    gap: 1px;
  }

  .popup-chip-state {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray000);
    white-space: nowrap;
    line-height: 1.2;
  }

  .popup-chip-time {
    font-size: 11px;
    color: var(--dv-gray000);
    opacity: 0.7;
    white-space: nowrap;
    line-height: 1.2;
  }

  .popup-chip.inactive .popup-chip-state,
  .popup-chip.inactive .popup-chip-time {
    color: var(--dv-gray800);
  }

  .popup-chip.inactive .popup-chip-time {
    opacity: 0.6;
  }

  .popup-chip-name {
    font-size: 13px;
    color: var(--dv-gray000);
    white-space: nowrap;
    padding-left: 6px;
    padding-right: 6px;
  }

  .popup-chip.inactive .popup-chip-name {
    color: var(--dv-gray800);
  }

  /* ==================== POPUP SCENE BUTTONS ==================== */
  .popup-scene-buttons {
    display: flex;
    gap: 10px;
    margin: 12px 12px 16px 12px;
    justify-content: flex-start;
  }

  .popup-scene-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    width: 80px;
    height: 80px;
    padding: 10px 5px;
    background: var(--card-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    border: none;
    box-shadow: var(--ha-card-box-shadow, 0 2px 4px var(--dv-shadow-light));
    flex-shrink: 0;
  }

  .popup-scene-button:hover {
    transform: scale(1.05);
    background: var(--dv-gray200);
  }

  .popup-scene-button:active {
    transform: scale(0.95);
  }

  .popup-scene-button.active {
    background: var(--dv-gray800, var(--primary-color));
  }

  .popup-scene-button ha-icon {
    --mdc-icon-size: 22px;
    color: var(--primary-text-color);
    margin-bottom: 4px;
  }

  .popup-scene-button.active ha-icon,
  .popup-scene-button.active span {
    color: var(--dv-gray100, var(--text-primary-color, #fff));
  }

  .popup-scene-button span {
    font-size: 11px;
    color: var(--primary-text-color);
    text-align: center;
    white-space: normal;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    max-width: 70px;
  }

  /* ==================== POPUP NOTIFICATION SECTION ==================== */
  .popup-notification {
    display: grid;
    grid-template-areas:
      "icon title"
      "icon subtitle";
    grid-template-columns: min-content 1fr;
    gap: 0;
    margin: 5px 12px 20px 12px;
    padding: 0;
    background: none;
    box-shadow: none;
    border: none;
  }

  .popup-notification-icon {
    grid-area: icon;
    font-size: 60px;
    font-weight: 800;
    line-height: 1;
    padding-left: 80px;
    padding-right: 12px;
    text-align: right;
  }

  .popup-notification-title {
    grid-area: title;
    font-size: 20px;
    font-weight: 500;
    color: var(--primary-text-color);
    text-align: left;
    align-self: end;
    padding-bottom: 2px;
  }

  .popup-notification-subtitle {
    grid-area: subtitle;
    font-size: 14px;
    color: var(--primary-text-color);
    opacity: 0.7;
    text-align: left;
    align-self: start;
  }

  /* ==================== TRAIN DEPARTURES ==================== */
  .train-departures-section {
    margin: 0 0 16px 0;
    padding: 0;
  }

  .train-notification {
    margin: 4px;
  }

  .train-notification .popup-notification-title.delayed {
    color: var(--dv-red);
  }

  /* ==================== DWD WEATHER WARNINGS ==================== */
  .dwd-warnings {
    margin: 0 0 16px 0;
    padding: 0;
  }

  .dwd-warning {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin: 4px;
    background: var(--dv-yellow);
    border-radius: 12px;
  }

  .dwd-warning-content {
    flex: 1;
    min-width: 0;
  }

  .dwd-warning.level-0,
  .dwd-warning.level-1 {
    background: var(--dv-yellow);
  }

  .dwd-warning.level-2 {
    background: var(--dv-orange);
  }

  .dwd-warning.level-3,
  .dwd-warning.level-4 {
    background: var(--dv-red);
  }

  /* Ensure text is always readable on colored warning backgrounds */
  .dwd-warning .dwd-warning-title {
    color: var(--dv-warning-text);
  }

  .dwd-warning-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--dv-gray800);
  }

  .dwd-warning-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray000);
  }

  .dwd-warning-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  /* ==================== POPUP COVER SECTION ==================== */
  .popup-cover-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-cover-header {
    display: grid;
    grid-template-columns: 120px 1fr 50px;
    align-items: center;
    padding: 6px 12px 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-cover-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
    padding: 8px 14px;
    cursor: pointer;
  }

  .popup-cover-slider {
    position: relative;
    height: 8px;
    background: var(--dv-gray100);
    border-radius: 4px;
    cursor: pointer;
  }

  .popup-cover-slider-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--dv-gradient-active);
    border-radius: 4px;
    transition: width var(--dv-transition-normal) ease;
  }

  .popup-cover-slider-thumb {
    position: absolute;
    top: -5px;
    width: 18px;
    height: 18px;
    background: var(--dv-gradient-active);
    border-radius: 50%;
    margin-right: -4px;
    transition: left var(--dv-transition-normal) ease;
  }

  .popup-cover-position {
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    color: var(--dv-gray800, var(--primary-text-color));
    padding: 8px 0;
    cursor: pointer;
  }

  .popup-cover-content {
    padding: 18px 12px;
    display: none;
  }

  .popup-cover-content.expanded {
    display: block;
  }

  .popup-cover-presets {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 6px;
  }

  .popup-cover-preset {
    padding: 8px 14px;
    border: none;
    background: var(--dv-gray000);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-cover-preset:active {
    opacity: 0.7;
  }

  .popup-cover-item {
    display: grid;
    grid-template-columns: 120px 1fr 50px;
    align-items: center;
    min-height: 30px;
  }

  .popup-cover-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
    padding: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ==================== GENERIC EXPANDABLE SECTION ==================== */
  .popup-section-container {
    margin-bottom: 8px;
  }

  .popup-section-header {
    display: flex;
    align-items: center;
    padding: 3px 3px;
    cursor: pointer;
  }

  .popup-section-header ha-icon {
    width: 22px;
    padding-left: 12px;
    padding-right: 12px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-section-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
    flex: 1;
  }

  .popup-section-count {
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-section-content {
    display: none;
  }

  .popup-section-content.expanded {
    display: block;
  }

  /* ==================== POPUP THERMOSTAT SECTION ==================== */
  .popup-thermostat-section {
    margin: 0 12px 16px 12px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .popup-thermostat-section::-webkit-scrollbar {
    display: none;
  }

  /* Thermostat Swipe Container */
  .popup-thermostat-swipe {
    position: relative;
    overflow: hidden;
    padding-bottom: 20px;
  }

  .popup-thermostat-slides {
    display: flex;
    transition: transform var(--dv-transition-slow) ease;
  }

  .popup-thermostat-slide {
    min-width: 100%;
    box-sizing: border-box;
  }

  .popup-thermostat-pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .popup-thermostat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gray200);
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-thermostat-dot.active {
    background: var(--gray400);
  }

  .popup-thermostat-card {
    flex: 1 0 100%;
    min-width: 280px;
    height: 160px;
    background: var(--dv-gray200);
    border-radius: 12px;
    position: relative;
    padding: 6px;
    box-sizing: border-box;
    scroll-snap-align: start;
    display: grid;
    grid-template-areas:
      "content controls"
      "content controls";
    grid-template-columns: 1fr min-content;
    grid-template-rows: 65% 1fr;
    overflow: hidden;
  }

  /* When there are multiple thermostat cards, make them slightly smaller to hint scrolling */
  .popup-thermostat-section .popup-thermostat-card:not(:only-child) {
    flex: 0 0 calc(100% - 24px);
  }

  .popup-thermostat-chart {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 95px;
    z-index: 0;
    pointer-events: none;
  }

  .popup-thermostat-chart .temp-history-chart {
    width: 100%;
    height: 100%;
  }

  .popup-thermostat-content {
    grid-area: content;
    display: flex;
    flex-direction: column;
    z-index: 2;
    padding-top: 8px;
  }

  .popup-thermostat-controls {
    grid-area: controls;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    z-index: 2;
  }

  .popup-thermostat-temp {
    font-size: 2.6em;
    font-weight: 300;
    padding-left: 20px;
    color: var(--dv-gray800);
    margin-top: auto;
  }

  .popup-thermostat-temp-humidity {
    font-size: 14px;
  }

  .popup-thermostat-name {
    font-size: 14px;
    padding-left: 20px;
    color: var(--dv-gray800);
    padding-bottom: 8px;
  }

  .popup-thermostat-btn1 {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    z-index: 2;
    align-self: center;
  }

  .popup-thermostat-btn1.hidden {
    display: none;
  }

  .popup-thermostat-btn1 button {
    width: 38px;
    height: 38px;
    border: none;
    background: var(--dv-gray100);
    color: var(--dv-gray800);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-thermostat-btn1 button:first-child {
    border-radius: 50% 50% 0 0;
  }

  .popup-thermostat-btn1 button:last-child {
    border-radius: 0 0 50% 50%;
  }

  .popup-thermostat-btn1 button:nth-child(2) {
    border-radius: 0;
    font-size: 14px;
    font-weight: 500;
  }

  .popup-thermostat-btn1 button:hover {
    background: var(--dv-gray300);
  }

  .popup-thermostat-btn1 button ha-icon {
    --mdc-icon-size: 20px;
  }

  .popup-thermostat-btn2 {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    z-index: 2;
    align-self: center;
  }

  .popup-thermostat-btn2 button {
    width: 34px;
    height: 34px;
    border: none;
    background: var(--dv-gray100);
    color: var(--dv-gray800);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-thermostat-btn2 button:first-child {
    border-radius: 12px 0 0 12px;
  }

  .popup-thermostat-btn2 button:last-child {
    border-radius: 0 12px 12px 0;
  }

  .popup-thermostat-btn2 button.active {
    background: var(--dv-gradient-active);
    color: var(--dv-black);
  }

  .popup-thermostat-btn2 button:hover:not(.active) {
    background: var(--dv-gray300);
  }

  .popup-thermostat-btn2 button ha-icon {
    --mdc-icon-size: 20px;
  }

  /* ==================== POPUP TEMPERATURE SECTION (no climate) ==================== */
  .popup-temperature-section {
    margin: 8px;
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .popup-temperature-section::-webkit-scrollbar {
    display: none;
  }

  .popup-temperature-card {
    flex: 0 0 calc(100% - 16px);
    min-width: 280px;
    height: 160px;
    background: var(--card-background-color, var(--dv-gray200));
    border-radius: var(--ha-card-border-radius, 12px);
    position: relative;
    padding: 6px;
    box-sizing: border-box;
    scroll-snap-align: start;
    display: grid;
    grid-template-areas:
      "temp"
      "name";
    grid-template-columns: 1fr;
    grid-template-rows: 65% 1fr;
  }

  .popup-temperature-temp {
    grid-area: temp;
    justify-self: start;
    align-self: end;
    font-size: 2.6em;
    font-weight: 300;
    padding-left: 20px;
    z-index: 2;
    color: var(--dv-gray800);
  }

  .popup-temperature-humidity {
    font-size: 14px;
    font-weight: 400;
    margin-left: 4px;
  }

  .popup-temperature-name {
    grid-area: name;
    justify-self: start;
    align-self: start;
    font-size: 14px;
    padding-left: 20px;
    color: var(--dv-gray800);
  }

  /* ==================== POPUP LIGHT SECTION ==================== */
  .popup-light-section {
    margin: 8px 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-light-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-light-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-light-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
    flex: 1;
  }

  .popup-light-count {
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-light-content {
    padding: 10px 8px 8px 8px;
    margin-top: 10px;
    display: none;
  }

  .popup-light-content.expanded {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .popup-light-item {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
  }

  /* Slider fill - colored portion on the left based on brightness */
  .popup-light-slider-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 12px;
    transition: width 0.15s ease-out;
    pointer-events: none;
    z-index: 0;
  }

  /* Prevent transition during active drag */
  .popup-light-item.dragging .popup-light-slider-fill {
    transition: none;
  }

  .popup-light-item-header {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    height: 68px;
    padding: 4px 20px 4px 4px;
    cursor: pointer;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }

  .popup-light-item-header.on {
    background: var(--dv-gradient-light);
  }

  .popup-light-item-header.off {
    background: var(--dv-gray000);
  }

  /* When slider is active, make header transparent so slider-fill shows through */
  .popup-light-item.has-slider .popup-light-item-header.on {
    background: transparent !important;
  }

  /* Gray background on the item itself for unfilled portion (right side) */
  .popup-light-item.has-slider {
    background: var(--dv-gray300) !important;
  }

  /* Slider touch/click area - covers most of the card for easy interaction */
  .popup-light-slider-area {
    position: absolute;
    top: 0;
    left: 70px; /* Start after icon area */
    right: 0;
    bottom: 0;
    cursor: ew-resize;
    z-index: 2;
  }

  .popup-light-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    flex-shrink: 0;
    cursor: pointer;
  }

  .popup-light-item-header.on .popup-light-item-icon {
    background: var(--dv-white);
  }

  .popup-light-item-header.off .popup-light-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .popup-light-item-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .popup-light-item-header.on .popup-light-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-light-item-header.off .popup-light-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-light-item-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .popup-light-item-label {
    font-size: 16px;
    font-weight: 500;
  }

  .popup-light-item-header.on .popup-light-item-label {
    color: var(--dv-gray000);
  }

  .popup-light-item-header.off .popup-light-item-label {
    color: var(--dv-gray800);
  }

  .popup-light-item-name {
    font-size: 14px;
    opacity: 0.7;
  }

  .popup-light-item-header.on .popup-light-item-name {
    color: var(--dv-gray000);
  }

  .popup-light-item-header.off .popup-light-item-name {
    color: var(--dv-gray800);
  }

  .popup-light-brightness {
    font-weight: 400;
  }

  /* ==================== POPUP GARAGE SECTION ==================== */
  .popup-garage-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-garage-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-garage-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-garage-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-garage-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--dv-gray600);
    padding-right: 12px;
  }

  .popup-garage-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-garage-content.expanded {
    max-height: 500px;
  }

  .popup-garage-item {
    overflow: hidden;
  }

  .popup-garage-item-header {
    display: flex;
    align-items: center;
    padding: 4px 12px 4px 4px;
    gap: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-garage-item-header.open {
    background: var(--dv-gradient-active);
  }

  .popup-garage-item-header.closed {
    background: var(--dv-gray000);
  }

  .popup-garage-item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .popup-garage-item-header.open .popup-garage-item-icon {
    background: var(--dv-white);
  }

  .popup-garage-item-header.closed .popup-garage-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-garage-item-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .popup-garage-item-header.open .popup-garage-item-icon ha-icon {
    color: var(--dv-black);
  }

  .popup-garage-item-header.closed .popup-garage-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-garage-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .popup-garage-item-name {
    font-size: 14px;
    font-weight: 500;
  }

  .popup-garage-item-header.open .popup-garage-item-name {
    color: var(--dv-black);
  }

  .popup-garage-item-header.closed .popup-garage-item-name {
    color: var(--dv-gray800);
  }

  .popup-garage-item-last-changed {
    font-size: 12px;
    opacity: 0.7;
  }

  .popup-garage-item-header.open .popup-garage-item-last-changed {
    color: var(--dv-black);
  }

  .popup-garage-item-header.closed .popup-garage-item-last-changed {
    color: var(--dv-gray600);
  }

  .popup-garage-item-controls {
    display: flex;
    gap: 8px;
  }

  .popup-garage-control-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--dv-white);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--dv-transition-normal) ease;
  }

  .popup-garage-control-btn:active {
    transform: scale(0.95);
  }

  .popup-garage-control-btn ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray800);
  }

  /* ==================== POPUP TV SECTION ==================== */
  .popup-tv-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-tv-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
  }

  .popup-tv-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-tv-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-tv-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--dv-gray600);
    padding-right: 12px;
  }

  .popup-tv-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 8px 8px 8px;
  }

  .popup-tv-item {
    display: flex;
    align-items: center;
    padding: 4px 20px 4px 4px;
    height: 68px;
    gap: 12px;
    border-radius: 12px;
    cursor: pointer;
    box-sizing: border-box;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-tv-item.on {
    background: var(--dv-gradient-active);
  }

  .popup-tv-item.off {
    background: var(--dv-gray000);
  }

  .popup-tv-item:active {
    transform: scale(0.98);
  }

  .popup-tv-item-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .popup-tv-item.on .popup-tv-item-icon {
    background: var(--dv-white);
  }

  .popup-tv-item.off .popup-tv-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-tv-item-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .popup-tv-item.on .popup-tv-item-icon ha-icon {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-tv-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .popup-tv-item-name {
    font-size: 14px;
    font-weight: 500;
  }

  .popup-tv-item.on .popup-tv-item-name {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-name {
    color: var(--dv-gray800);
  }

  .popup-tv-item-state {
    font-size: 12px;
    opacity: 0.7;
  }

  .popup-tv-item.on .popup-tv-item-state {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-state {
    color: var(--dv-gray600);
  }

  /* ==================== POPUP LOCK SECTION ==================== */
  .popup-lock-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-lock-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
  }

  .popup-lock-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-lock-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-lock-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--dv-gray600);
    padding-right: 12px;
  }

  .popup-lock-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 4px;
  }

  .popup-lock-item {
    display: flex;
    align-items: center;
    padding: 8px 12px 8px 4px;
    gap: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-lock-item.unlocked {
    background: var(--dv-gradient-active);
  }

  .popup-lock-item.locked {
    background: var(--dv-gray000);
  }

  .popup-lock-item:active {
    transform: scale(0.98);
  }

  .popup-lock-item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .popup-lock-item.unlocked .popup-lock-item-icon {
    background: var(--dv-white);
  }

  .popup-lock-item.locked .popup-lock-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-lock-item-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .popup-lock-item.unlocked .popup-lock-item-icon ha-icon {
    color: var(--dv-black);
  }

  .popup-lock-item.locked .popup-lock-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-lock-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .popup-lock-item-name {
    font-size: 14px;
    font-weight: 500;
  }

  .popup-lock-item.unlocked .popup-lock-item-name {
    color: var(--dv-black);
  }

  .popup-lock-item.locked .popup-lock-item-name {
    color: var(--dv-gray800);
  }

  .popup-lock-item-state {
    font-size: 12px;
    opacity: 0.7;
  }

  .popup-lock-item.unlocked .popup-lock-item-state {
    color: var(--dv-black);
  }

  .popup-lock-item.locked .popup-lock-item-state {
    color: var(--dv-gray600);
  }

  /* ==================== POPUP DEVICES SECTION (sensor_big style) ==================== */
  .popup-devices-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-devices-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-devices-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800);
  }

  .popup-devices-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .popup-devices-count {
    margin-left: auto;
    font-size: 14px;
    color: var(--dv-gray600);
  }

  .popup-devices-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-devices-content.expanded {
    max-height: 1000px;
  }

  .popup-devices-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 0 8px 8px 8px;
  }

  /* Device card - sensor_big style */
  .popup-device-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
    height: 140px;
    background: var(--dv-gray300);
    border-radius: var(--dv-radius-md);
    transition: background var(--dv-transition-normal) ease;
    overflow: hidden;
  }

  .popup-device-card.active {
    background: var(--dv-active-appliances);
  }

  .popup-device-card.finished {
    background: var(--dv-active-appliances-done);
  }

  .popup-device-card.error {
    background: var(--dv-red);
  }

  .popup-device-card.unavailable {
    background: var(--dv-gray300);
    opacity: 0.6;
  }

  /* Icon in top-right corner */
  .popup-device-card-icon {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-device-card.active .popup-device-card-icon {
    background: var(--dv-gray800);
  }

  .popup-device-card.finished .popup-device-card-icon {
    background: var(--dv-gray800);
  }

  .popup-device-card.error .popup-device-card-icon {
    background: var(--dv-gray800);
  }

  .popup-device-card.unavailable .popup-device-card-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-device-card-icon ha-icon {
    --mdc-icon-size: 26px;
    color: var(--dv-gray800);
  }

  .popup-device-card.active .popup-device-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  .popup-device-card.finished .popup-device-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  .popup-device-card.error .popup-device-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  .popup-device-card.unavailable .popup-device-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  /* Status text - large */
  .popup-device-card-status {
    font-size: 1.4em;
    font-weight: 300;
    color: var(--dv-gray800);
    line-height: 1.2;
  }

  .popup-device-card.active .popup-device-card-status,
  .popup-device-card.finished .popup-device-card-status,
  .popup-device-card.error .popup-device-card-status {
    color: var(--dv-gray000);
  }

  .popup-device-card.unavailable .popup-device-card-status {
    color: var(--dv-gray800);
  }

  /* Remaining time */
  .popup-device-card-time {
    font-size: 1.1em;
    font-weight: 400;
    color: var(--dv-gray600);
    margin-top: 2px;
  }

  .popup-device-card.active .popup-device-card-time,
  .popup-device-card.finished .popup-device-card-time {
    color: var(--dv-gray000);
    opacity: 0.8;
  }

  /* Device name - smaller at bottom */
  .popup-device-card-name {
    font-size: 13px;
    color: var(--dv-gray600);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-device-card.active .popup-device-card-name,
  .popup-device-card.finished .popup-device-card-name,
  .popup-device-card.error .popup-device-card-name {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  .popup-device-card.unavailable .popup-device-card-name {
    color: var(--dv-gray600);
  }

  /* ==================== FLOOR DEVICE CARD (for floor cards grid) ==================== */
  .floor-device-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 10px;
    margin: 4px;
    height: calc(100% - 8px);
    background: var(--dv-gray300);
    border-radius: var(--dv-radius-md);
    transition: background var(--dv-transition-normal) ease;
    overflow: hidden;
  }

  .floor-device-card.big {
    height: calc(100% - 8px);
  }

  .floor-device-card.active {
    background: var(--dv-active-appliances);
  }

  .floor-device-card.finished {
    background: var(--dv-active-appliances-done);
  }

  .floor-device-card.error {
    background: var(--dv-red);
  }

  .floor-device-card.unavailable {
    background: var(--dv-gray300);
    opacity: 0.6;
  }

  /* Icon in top-right corner */
  .floor-device-card-icon {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .floor-device-card.big .floor-device-card-icon {
    width: 40px;
    height: 40px;
  }

  .floor-device-card.active .floor-device-card-icon,
  .floor-device-card.finished .floor-device-card-icon,
  .floor-device-card.error .floor-device-card-icon {
    background: var(--dv-gray800);
  }

  .floor-device-card-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-gray800);
  }

  .floor-device-card.big .floor-device-card-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .floor-device-card.active .floor-device-card-icon ha-icon,
  .floor-device-card.finished .floor-device-card-icon ha-icon,
  .floor-device-card.error .floor-device-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  /* Status text */
  .floor-device-card-status {
    font-size: 1.1em;
    font-weight: 300;
    color: var(--dv-gray800);
    line-height: 1.2;
  }

  .floor-device-card.big .floor-device-card-status {
    font-size: 1.3em;
  }

  .floor-device-card.active .floor-device-card-status,
  .floor-device-card.finished .floor-device-card-status,
  .floor-device-card.error .floor-device-card-status {
    color: var(--dv-gray000);
  }

  /* Remaining time */
  .floor-device-card-time {
    font-size: 0.9em;
    font-weight: 400;
    color: var(--dv-gray600);
    margin-top: 1px;
  }

  .floor-device-card.big .floor-device-card-time {
    font-size: 1em;
  }

  .floor-device-card.active .floor-device-card-time,
  .floor-device-card.finished .floor-device-card-time {
    color: var(--dv-gray000);
    opacity: 0.8;
  }

  /* Device name */
  .floor-device-card-name {
    font-size: 11px;
    color: var(--dv-gray600);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-device-card.big .floor-device-card-name {
    font-size: 13px;
    margin-top: 4px;
  }

  .floor-device-card.active .floor-device-card-name,
  .floor-device-card.finished .floor-device-card-name,
  .floor-device-card.error .floor-device-card-name {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  /* ==================== POPUP MEDIA PLAYER SECTION ==================== */
  .popup-media-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-media-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-media-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-media-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-media-count {
    margin-left: auto;
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-media-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-media-content.expanded {
    max-height: 1000px;
  }

  .popup-media-player {
    padding: 12px;
    background: var(--dv-gray000);
    margin: 4px;
    border-radius: 10px;
  }

  .popup-media-player-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin-bottom: 8px;
  }

  .popup-media-artwork-container {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .popup-media-artwork {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    object-fit: cover;
    background: var(--dv-gray300);
  }

  .popup-media-artwork-placeholder {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    background: var(--dv-gray300);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-media-artwork-placeholder ha-icon {
    --mdc-icon-size: 64px;
    color: var(--dv-gray500);
  }

  .popup-media-info {
    text-align: center;
    margin-bottom: 16px;
  }

  .popup-media-track-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-media-track-artist {
    font-size: 14px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Media Presets */
  .popup-media-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding: 0 4px;
  }

  .popup-media-preset-btn {
    flex: 1;
    min-width: 70px;
    max-width: 100px;
    padding: 10px 8px;
    border: none;
    border-radius: var(--dv-radius-md);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-media-preset-btn:hover {
    background: var(--dv-gray200);
  }

  .popup-media-preset-btn:active {
    transform: scale(0.95);
  }

  .popup-media-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .popup-media-control-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--dv-gray200);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--dv-transition-normal) ease;
  }

  .popup-media-control-btn:active {
    transform: scale(0.95);
  }

  .popup-media-control-btn ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray800);
  }

  .popup-media-control-btn.active {
    background: var(--primary-color, #03a9f4);
  }

  .popup-media-control-btn.active ha-icon {
    color: var(--dv-white);
  }

  .popup-media-play-btn {
    width: 56px;
    height: 56px;
    background: var(--dv-gradient-media);
  }

  .popup-media-play-btn ha-icon {
    --mdc-icon-size: 28px;
    color: var(--dv-black);
  }

  .popup-media-volume-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 8px;
  }

  .popup-media-volume-icon {
    width: 24px;
    display: flex;
    justify-content: center;
  }

  .popup-media-volume-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
  }

  .popup-media-volume-slider {
    flex: 1;
    height: 6px;
    background: var(--dv-gray300);
    border-radius: 3px;
    cursor: pointer;
    position: relative;
  }

  .popup-media-volume-fill {
    height: 100%;
    background: var(--dv-gradient-media-horizontal);
    border-radius: 3px;
    transition: width var(--dv-transition-fast) ease;
  }

  .popup-media-volume-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: var(--dv-white);
    border-radius: 50%;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
    transition: left var(--dv-transition-fast) ease;
  }

  .popup-media-volume-percent {
    width: 40px;
    text-align: right;
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .popup-media-idle {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }

  /* Media Playlist Buttons (Horizontal Scrolling) */
  .popup-media-playlists {
    margin-bottom: 16px;
    overflow: hidden;
  }

  .popup-media-playlists-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .popup-media-playlists-scroll::-webkit-scrollbar {
    display: none;
  }

  .popup-media-playlist-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    border: none;
    border-radius: var(--dv-radius-full);
    background: var(--dv-gray100);
    color: var(--dv-gray800);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    white-space: nowrap;
    overflow: hidden;
  }

  .popup-media-playlist-btn.has-image {
    padding: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray200);
  }

  .popup-media-playlist-btn:hover {
    background: var(--dv-gray200);
    transform: scale(1.05);
  }

  .popup-media-playlist-btn.has-image:hover {
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
  }

  .popup-media-playlist-btn:active {
    transform: scale(0.95);
    background: var(--dv-gradient-media);
  }

  .popup-media-playlist-btn.has-image:active {
    background: var(--dv-gray200);
  }

  .popup-media-playlist-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--dv-radius-sm);
  }

  .popup-media-playlist-name {
    display: block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ==================== MEDIA POPUP SPECIFIC ==================== */
  /* Media popup uses shared .popup-* styles, only media-specific content styles here */

  .media-popup-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .media-popup-tabs::-webkit-scrollbar {
    display: none;
  }

  .media-popup-tab {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    background: var(--dv-gray300);
    color: var(--dv-gray800);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--dv-transition-normal) ease;
    flex-shrink: 0;
  }

  .media-popup-tab.active {
    background: var(--dv-gradient-media);
    color: var(--dv-gray000);
  }

  .media-popup-empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--dv-gray600);
  }

  .media-popup-empty ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .media-popup-empty-text {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .media-popup-empty-subtext {
    font-size: 14px;
    opacity: 0.8;
  }

  /* ==================== BOTTOM TAB BAR ==================== */
  .bottom-tab-bar {
    position: fixed;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    box-sizing: border-box;
    pointer-events: none;
  }

  .bottom-tab-bar-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: calc(100% - 20px);
    max-width: 480px;
    background: var(--dv-gray800);
    padding: 10px;
    border-radius: 100px;
    pointer-events: auto;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--dv-gray000);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    transition: all var(--dv-transition-normal) ease;
  }

  .tab ha-icon {
    --mdc-icon-size: 24px;
  }

  .tab span {
    display: none;
  }

  .tab:hover {
    opacity: 0.7;
  }

  .tab.active {
    background: var(--dv-gradient-active);
    color: var(--dv-gray000);
  }

  .tab-content {
    padding: 16px;
    padding-bottom: calc(70px + 16px + env(safe-area-inset-bottom, 0px));
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ==================== RÄUME SECTION ==================== */
  .raeume-section {
    padding: 0;
    margin-bottom: 24px;
  }

  .raeume-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .raeume-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
    padding: 14px 0 15px 0;
  }

  .floor-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .floor-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 13px;
    border: none;
    border-radius: 50%;
    background: var(--dv-gray800);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    box-sizing: border-box;
  }

  .floor-tab ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray000);
  }

  .floor-tab:hover {
    opacity: 0.8;
  }

  .floor-tab.active {
    background: var(--dv-gradient-active);
  }

  .floor-tab.active ha-icon {
    color: var(--dv-gray000);
  }

  /* ==================== ROOM CARDS GRID ==================== */
  .room-card {
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-sizing: border-box;
    margin: 4px;
  }

  .room-card:hover {
    transform: scale(0.98);
  }

  .room-card.inactive {
    background: var(--dv-gray000);
  }

  .room-card.active-light {
    background: var(--active-light, linear-gradient(145deg, rgba(255,243,219,1) 0%, rgba(255,234,178,1) 100%));
  }

  .room-card.active-gradient {
    background: var(--dv-gradient-active);
  }

  /* Appliance status colors for small cards */
  .room-card.appliance-active {
    background: var(--dv-active-appliances);
  }

  .room-card.appliance-finished {
    background: var(--dv-active-appliances-done);
  }

  .room-card.appliance-error {
    background: var(--dv-red);
  }

  .room-card.appliance-unavailable {
    background: var(--dv-gray300);
    opacity: 0.6;
  }

  .room-card-icon {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .room-card.inactive .room-card-icon {
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .room-card.active-light .room-card-icon,
  .room-card.active-gradient .room-card-icon {
    background: var(--dv-white);
  }

  .room-card.appliance-active .room-card-icon,
  .room-card.appliance-finished .room-card-icon,
  .room-card.appliance-error .room-card-icon {
    background: var(--dv-gray800);
  }

  .room-card.appliance-unavailable .room-card-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .room-card.inactive .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-icon ha-icon,
  .room-card.active-gradient .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-icon ha-icon,
  .room-card.appliance-finished .room-card-icon ha-icon,
  .room-card.appliance-error .room-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  .room-card.appliance-unavailable .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .room-card-label {
    font-weight: 300;
  }

  .room-card.inactive .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-label,
  .room-card.active-gradient .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-label,
  .room-card.appliance-finished .room-card-label,
  .room-card.appliance-error .room-card-label {
    color: var(--dv-gray000);
  }

  .room-card.appliance-unavailable .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card-name {
    font-size: 14px;
    opacity: 0.7;
  }

  .room-card.inactive .room-card-name {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-name,
  .room-card.active-gradient .room-card-name {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-name,
  .room-card.appliance-finished .room-card-name,
  .room-card.appliance-error .room-card-name {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  .room-card.appliance-unavailable .room-card-name {
    color: var(--dv-gray800);
  }

  /* Small card layout (horizontal) */
  .room-card.small {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 4px 20px 4px 4px;
    height: calc(100% - 8px);
  }

  .room-card.small .room-card-icon {
    width: 50px;
    height: 50px;
  }

  .room-card.small .room-card-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .room-card.small .room-card-content {
    flex: 1;
  }

  .room-card.small .room-card-label {
    font-size: 16px;
    font-weight: 500;
  }

  /* Big card layout (vertical) */
  .room-card.big {
    padding: 20px;
    height: calc(100% - 8px);
  }

  .room-card.big .room-card-icon {
    align-self: flex-end;
    width: 58px;
    height: 58px;
    margin: -16px -16px 0 0;
  }

  .room-card.big .room-card-icon ha-icon {
    --mdc-icon-size: 30px;
  }

  .room-card.big .room-card-label {
    font-size: 1.5em;
  }

  /* ==================== SECURITY SECTION ==================== */
  .security-section {
    padding: 0 16px;
    margin-bottom: 24px;
  }

  .security-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .security-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
    padding: 14px 0 15px 0;
  }

  .security-tabs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .security-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 20px;
    background: var(--card-background-color);
    color: var(--secondary-text-color);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .security-tab ha-icon {
    --mdc-icon-size: 18px;
  }

  .security-tab:hover {
    background: var(--dv-gray200);
  }

  .security-tab.active {
    background: var(--dv-gradient-active);
    color: var(--dv-black);
  }

  .security-tab.active ha-icon {
    color: var(--dv-black);
  }

  .security-subsection-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
    padding: 12px 0 15px 0;
  }

  .security-entity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .security-entity-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 4px 20px 4px 4px;
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .security-entity-card.active {
    background: var(--dv-gradient-active);
  }

  .security-entity-card.inactive {
    background: var(--dv-gray000);
  }

  .security-entity-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .security-entity-card.active .security-entity-icon {
    background: var(--dv-white);
  }

  .security-entity-card.inactive .security-entity-icon {
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .security-entity-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .security-entity-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .security-entity-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .security-entity-card.active .security-entity-name {
    color: var(--dv-gray000);
  }

  .security-entity-card.inactive .security-entity-name {
    color: var(--dv-gray800);
  }

  .security-entity-last-changed {
    font-size: 14px;
    color: var(--dv-gray800);
    opacity: 0.7;
  }

  .security-entity-card.active .security-entity-last-changed {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  .security-entity-card.inactive .security-entity-last-changed {
    color: var(--dv-gray800);
  }

  .security-empty-state {
    padding: 20px;
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  /* ==================== BATTERY POPUP ==================== */
  .battery-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    gap: 12px;
  }

  .battery-empty-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .battery-empty-subtext {
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  .battery-header-info {
    padding: 8px 0 16px 0;
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  .battery-device-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .battery-device-card {
    display: grid;
    grid-template-columns: 40px 1fr 60px;
    grid-template-rows: auto auto;
    gap: 4px 12px;
    align-items: center;
    padding: 12px;
    background: var(--secondary-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .battery-device-card:hover {
    background: var(--primary-color);
  }

  .battery-device-card:hover .battery-device-name,
  .battery-device-card:hover .battery-device-level {
    color: var(--text-primary-color, #fff) !important;
  }

  .battery-device-icon {
    grid-row: span 2;
    display: flex;
    align-items: center;
    justify-content: center;
    --mdc-icon-size: 28px;
  }

  .battery-device-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .battery-device-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .battery-device-level {
    font-size: 13px;
    font-weight: 600;
  }

  .battery-device-bar {
    grid-column: 2 / 4;
    height: 4px;
    background: var(--divider-color, rgba(0,0,0,0.1));
    border-radius: 2px;
    overflow: hidden;
  }

  .battery-device-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width var(--dv-transition-slow) ease;
  }

  /* ==================== ADMIN SUB-TABS ==================== */
  .admin-sub-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }

  .admin-sub-tabs::-webkit-scrollbar {
    display: none;
  }

  .admin-sub-tab {
    padding: 8px 12px;
    cursor: pointer;
    border: none;
    background: var(--dv-gray200);
    color: var(--dv-gray800);
    font-size: 0.85em;
    font-weight: 500;
    border-radius: 8px;
    transition: all var(--dv-transition-normal) ease;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .admin-sub-tab:hover {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
  }

  .admin-sub-tab.active {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
  }

  .admin-sub-tab ha-icon {
    --mdc-icon-size: 16px;
  }

  /* ==================== LABEL MAPPING CONFIG ==================== */
  .label-mapping-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-mapping-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--card-background-color);
    border-radius: 12px;
    border: 1px solid var(--dv-gray300);
  }

  .label-mapping-category {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .label-mapping-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary-color, #fff);
    flex-shrink: 0;
  }

  .label-mapping-icon ha-icon {
    --mdc-icon-size: 24px;
  }

  .label-mapping-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .label-mapping-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .label-mapping-description {
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .label-mapping-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-mapping-selector select {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid var(--dv-gray400);
    border-radius: 8px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  .label-mapping-selector select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--rgb-primary-color), 0.2);
  }

  .label-mapping-current {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--primary-color);
    border-radius: 8px;
    color: var(--text-primary-color, #fff);
    font-size: 13px;
    font-weight: 500;
    border: 2px solid transparent;
  }

  .label-mapping-current ha-icon {
    --mdc-icon-size: 18px;
  }

  .label-mapping-empty {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--dv-gray200);
    border-radius: 8px;
    color: var(--dv-gray600);
    font-size: 13px;
    font-style: italic;
  }

  .label-mapping-empty ha-icon {
    --mdc-icon-size: 18px;
    opacity: 0.6;
  }

  .label-mapping-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    background: var(--card-background-color);
    border-radius: 12px;
    text-align: center;
    color: var(--dv-gray600);
  }

  .label-mapping-empty-state ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .label-mapping-empty-state h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .label-mapping-empty-state p {
    margin: 0;
    font-size: 14px;
  }

  .label-mapping-hint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: var(--info-color, #2196f3);
    background: rgba(33, 150, 243, 0.1);
    border-radius: 12px;
    margin-top: 16px;
    color: var(--primary-text-color);
  }

  .label-mapping-hint ha-icon {
    --mdc-icon-size: 20px;
    color: var(--info-color, #2196f3);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .label-mapping-hint p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }

  /* ==================== CARD CONFIG ==================== */
  .card-config-section {
    background: var(--dv-gray200);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .card-config-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;
  }

  .card-config-section-header:hover {
    background: var(--dv-gray300);
    border-radius: 12px;
  }

  .card-config-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin: 0;
  }

  .card-config-section-title ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray800);
  }

  .card-config-section-chevron {
    --mdc-icon-size: 24px;
    color: var(--dv-gray600);
    transition: transform var(--dv-transition-normal) ease;
  }

  .card-config-section-chevron.expanded {
    transform: rotate(180deg);
  }

  .card-config-section-content {
    padding: 0 20px 20px 20px;
    display: none;
  }

  .card-config-section-content.expanded {
    display: block;
  }

  .card-config-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--dv-gray300);
  }

  .card-config-row:last-child {
    border-bottom: none;
  }

  .card-config-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-config-label-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .card-config-label-subtitle {
    font-size: 13px;
    color: var(--dv-gray600);
  }

  .card-config-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-config-input input[type="number"] {
    width: 80px;
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: 8px;
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    text-align: center;
  }

  .card-config-input input[type="number"]:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .card-config-unit {
    font-size: 14px;
    color: var(--dv-gray600);
  }

  /* ==================== INFO TEXT CONFIG ==================== */
  .info-text-config-item {
    background: var(--dv-gray200);
    border-radius: 12px;
    margin-bottom: 8px;
  }

  .info-text-config-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
  }

  .info-text-config-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-gray800);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .info-text-config-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray000);
  }

  .info-text-config-label {
    flex: 1;
    min-width: 0;
  }

  .info-text-config-title {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .info-text-config-subtitle {
    display: block;
    font-size: 12px;
    color: var(--dv-gray600);
    margin-top: 2px;
  }

  .info-text-config-entities {
    padding: 0 16px 16px 16px;
    border-top: 1px solid var(--dv-gray300);
    margin-top: 0;
    padding-top: 12px;
  }

  .info-text-entity-row {
    margin-bottom: 12px;
  }

  .info-text-entity-row:last-child {
    margin-bottom: 0;
  }

  .info-text-entity-row label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 6px;
  }

  .info-text-entity-row select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
  }

  .info-text-entity-row select:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .info-text-threshold-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-text-threshold-input input {
    width: 80px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    text-align: center;
  }

  .info-text-threshold-input input:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .info-text-threshold-input span {
    font-size: 14px;
    color: var(--dv-gray600);
  }

  /* Info Text Search Styles */
  .info-text-search-container {
    position: relative;
  }

  .info-text-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .info-text-search-icon {
    position: absolute;
    left: 12px;
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    pointer-events: none;
  }

  .info-text-search-input {
    width: 100%;
    padding: 10px 36px 10px 40px;
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
  }

  .info-text-search-input:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .info-text-search-clear {
    position: absolute;
    right: 12px;
    --mdc-icon-size: 18px;
    color: var(--dv-gray600);
    cursor: pointer;
  }

  .info-text-search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: 8px;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .info-text-search-no-results {
    padding: 12px 16px;
    color: var(--dv-gray600);
    font-size: 14px;
    text-align: center;
  }

  .info-text-search-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background var(--dv-transition-fast) ease;
  }

  .info-text-search-suggestion:hover {
    background: var(--dv-gray200);
  }

  .info-text-search-suggestion ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .info-text-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .info-text-suggestion-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-text-suggestion-id {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-text-selected-entity {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--dv-gray200);
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
  }

  .info-text-selected-entity ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .info-text-selected-info {
    flex: 1;
    min-width: 0;
  }

  .info-text-selected-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-text-selected-id {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-text-selected-remove {
    --mdc-icon-size: 18px;
    color: var(--dv-gray600);
    cursor: pointer;
    flex-shrink: 0;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.15s ease;
  }

  .info-text-selected-remove:hover {
    background: var(--dv-gray300);
    color: var(--dv-red);
  }

  /* ==================== SCENE BUTTON CONFIG ==================== */
  .scene-buttons-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .scene-button-item {
    background: var(--dv-gray200);
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .scene-button-item.editing {
    border: 1px solid var(--dv-gray800);
  }

  .scene-button-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
  }

  .scene-button-item-header:hover {
    background: var(--dv-gray300);
  }

  .scene-button-item-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-gray800);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .scene-button-item-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray000);
  }

  .scene-button-item-info {
    flex: 1;
    min-width: 0;
  }

  .scene-button-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .scene-button-item-type {
    font-size: 12px;
    color: var(--dv-gray600);
    margin-top: 2px;
  }

  .scene-button-item-chevron {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    transition: transform var(--dv-transition-normal) ease;
  }

  .scene-button-item-chevron.expanded {
    transform: rotate(180deg);
  }

  .scene-button-item-config {
    padding: 0 16px 16px 16px;
    border-top: 1px solid var(--dv-gray300);
    padding-top: 12px;
  }

  .scene-button-config-row {
    margin-bottom: 12px;
  }

  .scene-button-config-row label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 6px;
  }

  .scene-button-config-row input,
  .scene-button-config-row select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    box-sizing: border-box;
  }

  .scene-button-config-row input:focus,
  .scene-button-config-row select:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .scene-button-entities-section {
    margin-top: 16px;
  }

  .scene-button-entities-section > label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 8px;
  }

  .scene-button-entities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .scene-button-entity-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--dv-gray000);
    border-radius: 16px;
    font-size: 13px;
    color: var(--dv-gray800);
  }

  .scene-button-entity-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-gray800);
  }

  .scene-button-entity-remove {
    --mdc-icon-size: 14px;
    color: var(--dv-gray600);
    cursor: pointer;
    margin-left: 2px;
  }

  .scene-button-entity-remove:hover {
    color: var(--dv-red);
  }

  .scene-button-search-container {
    position: relative;
  }

  .scene-button-search-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--dv-gray000);
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
  }

  .scene-button-search-wrapper:focus-within {
    border-color: var(--dv-gray800);
  }

  .scene-button-search-wrapper ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-gray600);
  }

  .scene-button-search-wrapper input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--dv-gray800);
    font-size: 14px;
    outline: none;
    padding: 0;
  }

  .scene-button-search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: 8px;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .scene-button-no-results {
    padding: 12px 16px;
    color: var(--dv-gray600);
    font-size: 14px;
    text-align: center;
  }

  .scene-button-search-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-fast) ease;
  }

  .scene-button-search-suggestion:hover {
    background: var(--dv-gray200);
  }

  .scene-button-search-suggestion ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .scene-button-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .scene-button-suggestion-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scene-button-suggestion-id {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scene-button-delete {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    flex-shrink: 0;
    transition: color var(--dv-transition-normal) ease;
  }

  .scene-button-delete:hover {
    color: var(--dv-red);
  }

  /* Icon Picker Styles */
  .icon-picker-row {
    position: relative;
  }

  .icon-picker-container {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }

  .icon-picker-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    min-width: 44px;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: 8px;
  }

  .icon-picker-preview ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray800);
  }

  .icon-picker-input-wrapper {
    flex: 1;
    position: relative;
  }

  .icon-picker-input-wrapper input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    box-sizing: border-box;
  }

  .icon-picker-input-wrapper input:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .icon-picker-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: 8px;
    margin-top: 4px;
    max-height: 280px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .icon-picker-no-results {
    padding: 12px 16px;
    color: var(--dv-gray600);
    font-size: 13px;
    text-align: center;
  }

  .icon-picker-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-fast) ease;
  }

  .icon-picker-suggestion:hover {
    background: var(--dv-gray200);
  }

  .icon-picker-suggestion ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .icon-picker-suggestion span {
    font-size: 13px;
    color: var(--dv-gray800);
    font-family: monospace;
  }

  .scene-button-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: var(--dv-gray200);
    border: 2px dashed var(--dv-gray400);
    border-radius: 12px;
    color: var(--dv-gray600);
    font-size: 14px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .scene-button-add:hover {
    border-color: var(--dv-gray800);
    color: var(--dv-gray800);
  }

  .scene-button-add ha-icon {
    --mdc-icon-size: 20px;
  }

  .scene-button-info-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--info-color, #2196f3);
    background: rgba(33, 150, 243, 0.15);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .scene-button-info-box ha-icon {
    --mdc-icon-size: 18px;
    color: var(--info-color, #2196f3);
    flex-shrink: 0;
  }

  .scene-button-info-box span {
    font-size: 13px;
    color: var(--primary-text-color);
  }

  /* ==================== CUSTOM LABELS CONFIG ==================== */
  .custom-labels-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
    color: var(--dv-gray600);
  }

  .custom-labels-empty ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .custom-labels-empty p {
    margin: 0;
    font-size: 14px;
  }

  .custom-labels-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .custom-label-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--dv-gray200);
    border-radius: 12px;
    transition: all 0.15s ease;
  }

  .custom-label-item.enabled {
    background: var(--dv-gray300);
  }

  .custom-label-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .custom-label-info ha-icon {
    --mdc-icon-size: 22px;
    flex-shrink: 0;
  }

  .custom-label-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .custom-label-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .custom-label-description {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ==================== CUSTOM ENTITY ITEMS ==================== */
  .custom-entity-item {
    background: var(--dv-gray100);
    border-radius: 8px;
    margin-bottom: 6px;
    overflow: hidden;
  }

  .custom-entity-item.enabled {
    background: var(--dv-gray200);
  }

  .custom-entity-item:last-child {
    margin-bottom: 0;
  }

  .custom-entity-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    cursor: pointer;
  }

  .custom-entity-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .custom-entity-info ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .custom-entity-item.enabled .custom-entity-info ha-icon {
    color: var(--dv-gray800);
  }

  .custom-entity-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .custom-entity-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-entity-state {
    font-size: 11px;
    color: var(--dv-gray600);
  }

  .custom-entity-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .custom-entity-expand {
    --mdc-icon-size: 20px;
    color: var(--dv-gray500);
    transition: transform 0.2s ease;
  }

  .custom-entity-expand.expanded {
    transform: rotate(180deg);
  }

  /* Child entities display */
  .custom-entity-children {
    padding: 0 12px 10px 42px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .custom-entity-child {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--dv-gray000);
    border-radius: 6px;
    font-size: 12px;
  }

  .custom-entity-child ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-gray500);
    flex-shrink: 0;
  }

  .custom-entity-child .child-name {
    flex: 1;
    color: var(--dv-gray700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-entity-child .child-state {
    color: var(--dv-gray500);
    font-size: 11px;
  }

  .custom-entity-child .child-remove {
    --mdc-icon-size: 16px;
    color: var(--dv-gray400);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .custom-entity-child .child-remove:hover {
    color: var(--dv-red);
    background: var(--dv-gray200);
  }

  /* Child entity picker */
  .custom-entity-child-picker {
    padding: 8px 12px 12px 42px;
    border-top: 1px solid var(--dv-gray200);
  }

  .child-picker-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .child-picker-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--dv-gray000);
    border-radius: 6px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .child-picker-option:hover {
    background: var(--dv-gray200);
  }

  .child-picker-option:last-child {
    margin-bottom: 0;
  }

  .child-picker-option ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-gray500);
    flex-shrink: 0;
  }

  .child-picker-name {
    flex: 1;
    font-size: 12px;
    color: var(--dv-gray700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .child-picker-state {
    font-size: 11px;
    color: var(--dv-gray500);
  }

  .child-picker-add {
    --mdc-icon-size: 18px;
    color: var(--dv-gray400);
    transition: color 0.15s ease;
  }

  .child-picker-option:hover .child-picker-add {
    color: var(--dv-green);
  }

  /* Custom label section in room config */
  .custom-label-section {
    border-left: 3px solid var(--dv-purple);
    padding-left: 12px;
  }

  /* ==================== OTHER ENTITIES SECTION ==================== */
  .other-entities-section {
    margin-top: 24px;
    padding: 0 16px;
  }

  .other-entities-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .other-entities-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0;
  }

  .other-entities-tabs {
    display: flex;
    gap: 4px;
    background: var(--dv-gray200);
    padding: 4px;
    border-radius: var(--dv-radius-md);
  }

  .other-entities-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: var(--dv-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--dv-gray600);
  }

  .other-entities-tab:hover {
    background: var(--dv-gray300);
  }

  .other-entities-tab.active {
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    box-shadow: 0 1px 3px var(--dv-shadow-light);
  }

  .other-entities-tab ha-icon {
    --mdc-icon-size: 20px;
  }

  .other-entities-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  /* Other Entity Card - similar to room-card big style */
  .other-entity-card {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-lg);
    padding: 12px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .other-entity-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--dv-shadow-light);
  }

  .other-entity-card.active-gradient {
    background: var(--dv-gradient-active);
  }

  .other-entity-card.active-light {
    background: var(--dv-gradient-light);
  }

  .other-entity-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: auto;
  }

  .other-entity-card-area {
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-gray600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .other-entity-card.active-gradient .other-entity-card-area,
  .other-entity-card.active-light .other-entity-card-area {
    color: var(--dv-gray700);
  }

  .other-entity-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-md);
  }

  .other-entity-card.active-gradient .other-entity-card-icon,
  .other-entity-card.active-light .other-entity-card-icon {
    background: rgba(255, 255, 255, 0.4);
  }

  .other-entity-card-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray700);
  }

  .other-entity-card.active-gradient .other-entity-card-icon ha-icon,
  .other-entity-card.active-light .other-entity-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .other-entity-card-content {
    margin-top: 8px;
  }

  .other-entity-card-state {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    line-height: 1.2;
  }

  .other-entity-card-name {
    font-size: 12px;
    color: var(--dv-gray600);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .other-entity-card.active-gradient .other-entity-card-name,
  .other-entity-card.active-light .other-entity-card-name {
    color: var(--dv-gray700);
  }

  /* Child entities display in card */
  .other-entity-card-children {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--dv-gray200);
  }

  .other-entity-card.active-gradient .other-entity-card-children,
  .other-entity-card.active-light .other-entity-card-children {
    border-top-color: rgba(0, 0, 0, 0.1);
  }

  .other-entity-child-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    font-size: 11px;
  }

  .other-entity-card.active-gradient .other-entity-child-item,
  .other-entity-card.active-light .other-entity-child-item {
    background: rgba(255, 255, 255, 0.4);
  }

  .other-entity-child-item ha-icon {
    --mdc-icon-size: 14px;
    color: var(--dv-gray600);
  }

  .other-entity-child-item .child-value {
    color: var(--dv-gray700);
    font-weight: 500;
  }

  /* ==================== FLOOR CARDS CONFIG ==================== */
  .floor-cards-config-section {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    padding: 16px;
    margin-bottom: 16px;
  }

  .floor-cards-config-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin-bottom: 16px;
  }

  .floor-cards-config-title ha-icon {
    --mdc-icon-size: var(--dv-icon-md);
    color: var(--dv-gray800);
  }

  .floor-cards-config-grid {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 76px 76px 76px 76px;
    grid-template-areas:
      "small1 big1"
      "big2 big1"
      "big2 small2"
      "small3 small4";
    gap: 0;
  }

  .floor-card-slot {
    border: 2px dashed var(--dv-gray300);
    border-radius: var(--dv-radius-md);
    margin: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    background: var(--dv-gray200);
    padding: 8px;
    box-sizing: border-box;
  }

  .floor-card-slot:hover {
    border-color: var(--dv-gray800);
    background: var(--dv-gray300);
  }

  .floor-card-slot.configured {
    border-style: solid;
    border-color: var(--dv-gray800);
    background: var(--dv-gray000);
  }

  .floor-card-slot.selected {
    border-color: var(--dv-blue);
    border-style: solid;
    background: color-mix(in srgb, var(--dv-blue) 10%, var(--dv-gray000));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--dv-blue) 30%, transparent);
  }

  .floor-card-slot.disabled {
    opacity: 0.6;
    cursor: default;
    pointer-events: none;
  }

  .floor-card-slot.small {
    height: calc(100% - 8px);
  }

  .floor-card-slot.big {
    height: calc(100% - 8px);
  }

  .floor-card-slot-label {
    font-size: 10px;
    color: var(--dv-gray600);
    text-align: center;
    margin-top: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .floor-card-slot-entity {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .floor-card-slot-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray600);
    margin-bottom: 4px;
  }

  .floor-card-slot.configured .floor-card-slot-icon {
    color: var(--dv-gray800);
  }

  .floor-card-entity-select {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
  }

  .floor-card-entity-select:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .floor-card-entity-selector {
    position: relative;
    width: 100%;
  }

  .floor-card-entity-config {
    margin-top: 16px;
    padding: 16px;
    background: var(--dv-gray100);
    border-radius: var(--dv-radius-md);
    border: 1px solid var(--dv-gray300);
  }

  .floor-card-entity-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .floor-card-entity-config-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .floor-card-entity-config-close {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color var(--dv-transition-normal) ease;
  }

  .floor-card-entity-config-close:hover {
    color: var(--dv-gray800);
  }

  .floor-card-entity-selector-button {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .floor-card-entity-selector-button:hover {
    border-color: var(--dv-gray800);
  }

  .floor-card-entity-selector-button ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    flex-shrink: 0;
  }

  .floor-card-entity-selector-text {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-card-entity-selector-name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-selector-id {
    font-size: 10px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-selector-chevron {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .floor-card-entity-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 250px;
    overflow-y: auto;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
    z-index: var(--dv-z-modal);
    margin-top: 4px;
  }

  .floor-card-entity-option {
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--dv-gray200);
    transition: background var(--dv-transition-fast) ease;
  }

  .floor-card-entity-option:last-child {
    border-bottom: none;
  }

  .floor-card-entity-option:hover {
    background: var(--dv-gray200);
  }

  .floor-card-entity-option.selected {
    background: var(--dv-gray200);
  }

  .floor-card-entity-option ha-icon {
    --mdc-icon-size: var(--dv-icon-md);
    flex-shrink: 0;
    color: var(--dv-gray800);
  }

  .floor-card-entity-option-text {
    flex: 1;
    overflow: hidden;
  }

  .floor-card-entity-option-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-option-id {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-option-clear {
    color: var(--dv-red);
  }

  .floor-card-entity-option-clear ha-icon {
    color: var(--dv-red);
  }

  /* Floor Overview Toggle in Admin */
  .floor-overview-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    margin-bottom: 12px;
  }

  .floor-overview-toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .floor-overview-toggle-label ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .floor-overview-toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-overview-toggle-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .floor-overview-toggle-subtitle {
    font-size: 12px;
    color: var(--dv-gray600);
  }

  /* Floor Overview Swipe Card */
  .floor-overview-card {
    position: relative;
    height: 147px;
    overflow: hidden;
    border-radius: var(--dv-radius-md);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .floor-overview-card:active {
    cursor: grabbing;
  }

  .floor-overview-slides {
    display: flex;
    height: 100%;
    transition: transform var(--dv-transition-slow) ease;
  }

  .floor-overview-slide {
    min-width: 100%;
    height: 143px;
    box-sizing: border-box;
    padding: 8px;
    display: grid;
    grid-template-areas: "n i" "temp temp";
    grid-template-rows: 1fr min-content;
    grid-template-columns: min-content 1fr;
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    cursor: pointer;
  }

  .floor-overview-slide-name {
    grid-area: n;
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
    padding: 14px;
    justify-self: start;
    align-self: start;
    text-align: left;
  }

  .floor-overview-slide-icon {
    grid-area: i;
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    align-self: start;
  }

  .floor-overview-slide:not(.active) .floor-overview-slide-icon {
    background: rgba(var(--dv-highlight-rgb), 0.05);
  }

  .floor-overview-slide.active .floor-overview-slide-icon {
    background: var(--dv-gradient-active);
  }

  /* Icon color: gray600 for inactive (visible on gray000 bg), gray000 for active (with gradient bg) */
  .floor-overview-slide:not(.active) .floor-overview-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray600);
  }

  .floor-overview-slide.active .floor-overview-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray000);
  }

  .floor-overview-slide-temp {
    grid-area: temp;
    font-size: 2.5em;
    line-height: 1em;
    font-weight: 300;
    color: var(--dv-gray800);
    padding: 0 0 6px 14px;
    justify-self: start;
  }

  .floor-overview-slide-temp-humidity {
    font-size: 0.3em;
    opacity: 0.7;
  }

  /* Unified pagination dots (used by floor overview and garbage cards) */
  .pagination,
  .floor-overview-pagination,
  .garbage-pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
  }

  .pagination-dot,
  .floor-overview-dot,
  .garbage-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dv-gray300);
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .pagination-dot.active,
  .floor-overview-dot.active,
  .garbage-dot.active {
    background: var(--dv-gray600);
  }

  /* ==================== GARBAGE CARD ==================== */
  .garbage-card {
    position: relative;
    height: 147px;
    overflow: hidden;
    border-radius: var(--dv-radius-md);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .garbage-card:active {
    cursor: grabbing;
  }

  .garbage-slides {
    display: flex;
    height: 100%;
    transition: transform var(--dv-transition-slow) ease;
  }

  .garbage-slide {
    min-width: 100%;
    height: 143px;
    box-sizing: border-box;
    padding: 20px;
    display: grid;
    grid-template-areas: "i" "label" "n";
    grid-template-rows: auto 1fr auto;
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    cursor: pointer;
  }

  .garbage-slide.urgent {
    background: var(--dv-red);
  }

  .garbage-slide.soon {
    background: var(--dv-green);
  }

  .garbage-slide-name {
    grid-area: n;
    font-size: 14px;
    font-weight: 400;
    color: var(--dv-gray800);
    opacity: 0.7;
    justify-self: start;
    align-self: end;
  }

  .garbage-slide.urgent .garbage-slide-name {
    color: var(--dv-white);
  }

  .garbage-slide.soon .garbage-slide-name {
    color: var(--dv-black);
  }

  .garbage-slide-icon {
    grid-area: i;
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    align-self: start;
    background: rgba(var(--dv-highlight-rgb), 0.08);
    margin: -6px -6px 0 0;
  }

  .garbage-slide.urgent .garbage-slide-icon,
  .garbage-slide.soon .garbage-slide-icon {
    background: var(--dv-gray800);
  }

  .garbage-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray800);
  }

  .garbage-slide.urgent .garbage-slide-icon ha-icon {
    color: var(--dv-white);
  }

  .garbage-slide.soon .garbage-slide-icon ha-icon {
    color: var(--dv-white);
  }

  .garbage-slide-label {
    grid-area: label;
    font-size: 1.5em;
    font-weight: 300;
    color: var(--dv-gray800);
    justify-self: start;
    align-self: end;
  }

  .garbage-slide.urgent .garbage-slide-label {
    color: var(--dv-white);
  }

  .garbage-slide.soon .garbage-slide-label {
    color: var(--dv-black);
  }

  /* Garbage pagination uses unified styles above */

  /* Garbage Admin Section */
  .garbage-config-section {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    padding: 16px;
    margin-bottom: 16px;
  }

  .garbage-sensor-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .garbage-sensor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
  }

  .garbage-sensor-item ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .garbage-sensor-info {
    flex: 1;
    min-width: 0;
  }

  .garbage-sensor-name {
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .garbage-sensor-entity {
    font-size: 12px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-floor-selector {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--dv-gray300);
  }

  .garbage-floor-selector label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--dv-gray800);
  }

  .garbage-floor-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .garbage-floor-btn {
    padding: 8px 16px;
    border-radius: var(--dv-radius-sm);
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    cursor: pointer;
    font-size: 14px;
    transition: all var(--dv-transition-normal) ease;
  }

  .garbage-floor-btn:hover {
    background: var(--dv-gray200);
  }

  .garbage-floor-btn.active {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
    border-color: var(--dv-gray800);
  }

  /* Garbage Search Styles */
  .garbage-search-container {
    position: relative;
    margin-bottom: 16px;
  }

  .garbage-search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    padding: 0 12px;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .garbage-search-input-wrapper:focus-within {
    border-color: var(--dv-gray800);
  }

  .garbage-search-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    margin-right: 8px;
  }

  .garbage-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 0;
    font-size: 13px;
    color: var(--dv-gray800);
    outline: none;
  }

  .garbage-search-input::placeholder {
    color: var(--dv-gray600);
  }

  .garbage-search-clear {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: background var(--dv-transition-normal) ease;
  }

  .garbage-search-clear:hover {
    background: var(--dv-gray300);
  }

  .garbage-search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--dv-z-dropdown);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
  }

  .garbage-search-suggestion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-fast) ease;
    border-bottom: 1px solid var(--dv-gray200);
  }

  .garbage-search-suggestion:last-child {
    border-bottom: none;
  }

  .garbage-search-suggestion:hover:not(.disabled) {
    background: var(--dv-gray200);
  }

  .garbage-search-suggestion.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .garbage-search-suggestion ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
  }

  .garbage-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .garbage-suggestion-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-suggestion-entity {
    font-size: 11px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-suggestion-add {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray800);
  }

  .garbage-suggestion-added {
    font-size: 11px;
    color: var(--dv-gray600);
    font-style: italic;
  }

  .garbage-search-no-results {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }

  .garbage-selected-sensors {
    margin-top: 16px;
  }

  .garbage-sensor-item.selected {
    background: var(--dv-gray200);
  }

  .garbage-sensor-remove {
    --mdc-icon-size: var(--dv-icon-md);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all var(--dv-transition-normal) ease;
  }

  .garbage-sensor-remove:hover {
    color: var(--dv-red);
    background: rgba(240, 169, 148, 0.2);
  }

  .garbage-empty-state {
    padding: 24px;
    text-align: center;
    color: var(--dv-gray600);
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
  }

  .garbage-empty-state ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .garbage-empty-hint {
    font-size: 12px;
    margin-top: 4px;
    opacity: 0.7;
  }

  /* ==================== TRAIN DEPARTURE CONFIG ==================== */
  .train-departure-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .train-departure-item {
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
  }

  .train-departure-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray100);
  }

  .train-departure-header ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .train-departure-info {
    flex: 1;
    min-width: 0;
  }

  .train-departure-name {
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .train-departure-entity {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .train-departure-config {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .train-config-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .train-config-row label {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
  }

  .train-config-row input {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
  }

  .train-config-row input:focus {
    outline: none;
    border-color: var(--dv-highlight);
  }

  .train-config-row input[type="number"] {
    width: 100px;
  }

  .train-config-row input[type="time"] {
    width: 120px;
  }

  .train-config-row select {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    width: 100%;
  }

  .train-config-row select:focus {
    outline: none;
    border-color: var(--dv-highlight);
  }

  .train-config-row-inline {
    display: flex;
    gap: 16px;
  }

  .train-config-row-inline .train-config-row {
    flex: 1;
  }

  /* ==================== MEDIA PRESET CONFIG (ADMIN) ==================== */
  .media-preset-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .media-preset-item {
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
  }

  .media-preset-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray100);
  }

  .media-preset-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dv-gray300);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .media-preset-info {
    flex: 1;
    min-width: 0;
  }

  .media-preset-name {
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-preset-uri {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-preset-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .media-preset-config {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .media-preset-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .media-preset-row label {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
  }

  .media-preset-row input {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .media-preset-row input:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .media-preset-preview {
    margin-top: 8px;
    width: 64px;
    height: 64px;
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
    background: var(--dv-gray300);
  }

  .media-preset-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ==================== ENTITY PICKER ==================== */
  .entity-picker {
    position: relative;
    width: 100%;
  }

  .entity-picker-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    padding: 0 12px;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .entity-picker-input-wrapper:focus-within {
    border-color: var(--dv-gray800);
  }

  .entity-picker-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    margin-right: 8px;
    flex-shrink: 0;
  }

  .entity-picker-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 0;
    font-size: 14px;
    color: var(--dv-gray800);
    outline: none;
    min-width: 0;
  }

  .entity-picker-input::placeholder {
    color: var(--dv-gray500);
  }

  .entity-picker-clear {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    margin-left: 4px;
    flex-shrink: 0;
    transition: color var(--dv-transition-normal) ease;
  }

  .entity-picker-clear:hover {
    color: var(--dv-gray800);
  }

  .entity-picker-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .entity-picker-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .entity-picker-suggestion:hover {
    background: var(--dv-gray200);
  }

  .entity-picker-suggestion.selected {
    background: var(--dv-gray200);
  }

  .entity-picker-suggestion ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .entity-picker-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .entity-picker-suggestion-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-picker-suggestion-entity {
    font-size: 11px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-picker-suggestion-check {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-green);
    flex-shrink: 0;
  }

  .entity-picker-no-results {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }

  /* ==================== ORDER CONFIG ==================== */
  .order-config-section {
    background: var(--card-background-color);
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .order-config-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;
  }

  .order-config-section-header:hover {
    background: var(--dv-gray200);
  }

  .order-config-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
  }

  .order-config-section-title ha-icon {
    --mdc-icon-size: 22px;
    color: var(--primary-color);
  }

  .order-config-section-chevron {
    --mdc-icon-size: 24px;
    color: var(--secondary-text-color);
    transition: transform var(--dv-transition-normal) ease;
  }

  .order-config-section-chevron.expanded {
    transform: rotate(180deg);
  }

  .order-config-section-content {
    padding: 0 20px 20px 20px;
    display: none;
  }

  .order-config-section-content.expanded {
    display: block;
  }

  .order-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .order-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--secondary-background-color);
    border-radius: 8px;
    transition: background var(--dv-transition-normal) ease;
  }

  .order-item:hover {
    background: var(--primary-background-color);
  }

  .order-item-index {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .order-item-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--card-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .order-item-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--primary-text-color);
  }

  .order-item-info {
    flex: 1;
    min-width: 0;
  }

  .order-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .order-item-subtitle {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .order-item-buttons {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .order-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--dv-transition-normal) ease;
  }

  .order-btn:hover:not(:disabled) {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  .order-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .order-btn ha-icon {
    --mdc-icon-size: 18px;
  }

  .order-floor-section {
    margin-bottom: 24px;
  }

  .order-floor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .order-floor-header ha-icon {
    --mdc-icon-size: 20px;
  }

  .order-floor-name {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
  }

  .order-rooms-list {
    padding-left: 16px;
    border-left: 2px solid var(--divider-color);
    margin-left: 20px;
  }

  .order-empty-state {
    text-align: center;
    padding: 32px;
    color: var(--secondary-text-color);
  }

  .order-empty-state ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  /* ==================== INFO HEADER ==================== */
  .info-header {
    text-align: center;
    margin-bottom: 24px;
    padding: 24px;
    background: var(--card-background-color);
    border-radius: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px var(--dv-shadow-light));
  }

  .info-header h1 {
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
    font-size: 2em;
    font-weight: 500;
  }

  .info-header .subtitle {
    color: var(--secondary-text-color);
    font-size: 1.1em;
    margin: 0;
  }

  .info-header .time {
    font-size: 2.5em;
    font-weight: 300;
    color: var(--primary-color);
    margin: 12px 0 0 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }

  .card {
    background: var(--card-background-color);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px var(--dv-shadow-light));
  }

  .card h2 {
    margin: 0 0 16px 0;
    color: var(--primary-text-color);
    font-size: 1.3em;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card h2 ha-icon {
    color: var(--primary-color);
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-item {
    text-align: center;
    padding: 16px;
    background: var(--primary-background-color);
    border-radius: 8px;
  }

  .stat-value {
    font-size: 2em;
    font-weight: 500;
    color: var(--primary-color);
  }

  .stat-label {
    font-size: 0.9em;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .entity-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .entity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--divider-color);
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
    border-radius: 8px;
    margin-bottom: 4px;
  }

  .entity-item:hover {
    background: var(--dv-gray200);
  }

  .entity-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .entity-item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .entity-item-info ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .entity-item-info.active ha-icon {
    color: var(--dv-highlight);
  }

  .entity-item-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }

  .entity-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-item-subtitle {
    font-size: 11px;
    color: var(--dv-gray500);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-item-state {
    font-size: 12px;
    color: var(--dv-gray600);
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--dv-gray200);
    flex-shrink: 0;
  }

  .entity-item-state.active {
    color: var(--dv-highlight);
    background: rgba(var(--dv-highlight-rgb), 0.15);
  }

  .entity-item .toggle-switch {
    flex-shrink: 0;
    margin-left: 12px;
  }

  .entity-name {
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .entity-state {
    color: var(--secondary-text-color);
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 16px;
    background: var(--secondary-background-color);
  }

  .entity-state.on {
    color: var(--text-primary-color, #fff);
    background: var(--success-color, #4caf50);
  }

  .entity-state.off {
    color: var(--secondary-text-color);
    background: var(--secondary-background-color);
  }

  /* Device config item (for appliances/devices section) */
  .device-config-item {
    background: var(--dv-gray100);
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .device-config-item:last-child {
    margin-bottom: 0;
  }

  .device-config-header {
    display: flex;
    align-items: center;
    padding: 12px;
    gap: 12px;
  }

  .device-config-item.enabled .device-config-header {
    background: rgba(var(--dv-highlight-rgb), 0.1);
  }

  .device-config-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .device-config-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray600);
  }

  .device-config-item.enabled .device-config-icon ha-icon {
    color: var(--dv-gray800);
  }

  .device-config-info {
    flex: 1;
    min-width: 0;
  }

  .device-config-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .device-config-subtitle {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .device-config-entities {
    padding: 8px 12px 12px 12px;
    background: var(--dv-gray200);
    border-top: 1px solid var(--dv-gray300);
  }

  .device-config-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .device-config-row:last-child {
    margin-bottom: 0;
  }

  .device-config-row label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 110px;
    font-size: 13px;
    color: var(--dv-gray700);
  }

  .device-config-row label ha-icon {
    color: var(--dv-gray600);
  }

  .device-config-row select {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--dv-gray400);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-white);
    font-size: 13px;
    color: var(--dv-gray800);
    cursor: pointer;
  }

  .device-config-row select:focus {
    outline: none;
    border-color: var(--dv-highlight);
  }

  .welcome-message {
    font-size: 1.1em;
    line-height: 1.6;
    color: var(--primary-text-color);
  }

  .welcome-message p {
    margin: 0 0 12px 0;
  }

  .welcome-message ul {
    margin: 12px 0;
    padding-left: 20px;
  }

  .welcome-message li {
    margin: 8px 0;
    color: var(--secondary-text-color);
  }

  /* ==================== ADMIN TAB ==================== */
  .area-card {
    background: var(--card-background-color);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px var(--dv-shadow-light));
  }

  .area-header {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .area-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary-color, #fff);
  }

  .area-icon.disabled {
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
  }

  .area-title {
    flex: 1;
  }

  .area-name {
    font-size: 1.2em;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .area-subtitle {
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }

  .area-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--secondary-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .toggle-switch.on {
    background: var(--primary-color);
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform var(--dv-transition-slow) ease;
  }

  .toggle-switch.on::after {
    transform: translateX(24px);
  }

  .expand-icon {
    --mdc-icon-size: 24px;
    color: var(--secondary-text-color);
    transition: transform var(--dv-transition-slow) ease;
  }

  .expand-icon.expanded {
    transform: rotate(180deg);
  }

  .lights-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }

  .lights-title {
    font-size: 1em;
    font-weight: 500;
    color: var(--secondary-text-color);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lights-title.collapsible {
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s ease;
  }

  .lights-title.collapsible:hover {
    opacity: 0.7;
  }

  .entity-section-chevron {
    --mdc-icon-size: 20px;
    transition: transform 200ms ease;
  }

  .entity-section-chevron.expanded {
    transform: rotate(180deg);
  }

  .entity-section-entities {
    overflow: hidden;
    transition: max-height 200ms ease, opacity 200ms ease;
  }

  .entity-section-entities.collapsed {
    max-height: 0;
    opacity: 0;
  }

  .entity-section-entities.expanded {
    max-height: 2000px;
    opacity: 1;
  }

  /* Bulk Action Buttons */
  .bulk-actions {
    display: flex;
    gap: 6px;
  }

  .bulk-action-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid var(--dv-gray400);
    background: transparent;
    color: var(--secondary-text-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .bulk-action-btn:hover {
    background: var(--dv-gray200);
    border-color: var(--dv-gray500);
  }

  .bulk-action-btn:active {
    transform: scale(0.95);
  }

  .entity-expand-controls {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px 12px;
    border-bottom: 1px solid var(--divider-color);
  }

  .entity-expand-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--primary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    color: var(--primary-text-color);
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .entity-expand-button:hover {
    background: var(--secondary-background-color);
    border-color: var(--primary-color);
  }

  .entity-expand-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .light-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--primary-background-color);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .light-item:last-child {
    margin-bottom: 0;
  }

  .light-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .light-info ha-icon {
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
  }

  .light-info.light-on ha-icon {
    color: var(--warning-color, #ff9800);
  }

  .light-name {
    color: var(--primary-text-color);
    font-size: 0.95em;
  }

  .light-state {
    font-size: 0.8em;
    color: var(--secondary-text-color);
    margin-left: 4px;
  }

  .light-state.on {
    color: var(--success-color, #4caf50);
  }

  .no-lights {
    color: var(--secondary-text-color);
    font-style: italic;
    padding: 8px 0;
  }

  .no-areas {
    text-align: center;
    padding: 48px;
    color: var(--secondary-text-color);
  }

  .section-title {
    font-size: 1.5em;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0 0 24px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-title ha-icon {
    color: var(--primary-color);
  }

  .no-selected-lights {
    text-align: center;
    padding: 32px;
    color: var(--secondary-text-color);
  }

  .no-selected-lights ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    display: block;
  }

  /* ==================== SCENE ROW ==================== */
  .scene-row {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    gap: 10px;
    padding: 16px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scene-row::-webkit-scrollbar {
    display: none;
  }

  .scene-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    width: 80px;
    height: 80px;
    padding: 10px 5px;
    background: var(--card-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    border: none;
    box-shadow: var(--ha-card-box-shadow, 0 2px 4px var(--dv-shadow-light));
    flex-shrink: 0;
  }

  .scene-button:hover {
    transform: scale(1.05);
    background: var(--dv-gray200);
  }

  .scene-button:active {
    transform: scale(0.95);
  }

  .scene-button.active {
    background: var(--dv-gray800, var(--primary-color));
  }

  .scene-button.active ha-icon,
  .scene-button.active .scene-name {
    color: var(--dv-gray100, var(--text-primary-color, #fff));
  }

  .scene-button ha-icon {
    --mdc-icon-size: 22px;
    color: var(--primary-text-color);
    margin-bottom: 4px;
  }

  .scene-button .scene-name {
    font-size: 11px;
    color: var(--primary-text-color);
    text-align: center;
    white-space: normal;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    max-width: 70px;
  }

  .scene-row-container {
    background: var(--primary-background-color);
  }

  .scene-row-title {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--secondary-text-color);
    padding: 8px 16px 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .scene-row-title ha-icon {
    --mdc-icon-size: 18px;
  }

  /* ==================== INFO TEXT ROW ==================== */
  .info-text-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 1px;
    padding: 8px 16px 16px 16px;
    font-size: 1.2em;
    line-height: 1.8em;
    color: var(--primary-text-color);
  }

  .info-text-row .text-segment {
    white-space: normal;
    overflow: visible;
    word-break: break-word;
  }

  .info-text-row .info-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    background: var(--dv-gray600);
    border-radius: 12px;
    color: var(--dv-gray000);
    margin: 0 2px;
    white-space: nowrap;
    line-height: inherit;
    font-size: inherit;
  }

  .info-text-row .info-badge.warning {
    background: var(--dv-red);
    color: var(--text-primary-color, #fff);
  }

  .info-text-row .info-badge.success {
    background: var(--dv-green);
    color: var(--dv-gray000);
  }

  .info-text-row .info-badge.clickable {
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.1s ease;
  }

  .info-text-row .info-badge.clickable:hover {
    opacity: 0.85;
  }

  .info-text-row .info-badge.clickable:active {
    transform: scale(0.97);
  }

  /* ==================== WEATHER POPUP SPECIFIC ==================== */
  /* Weather popup uses shared .popup-* styles, only weather-specific content styles here */

  .weather-current-card {
    background: var(--dv-popup-bg-color);
    border-radius: 24px;
    padding: 12px;
    margin-bottom: 16px;
    display: grid;
    grid-template-areas:
      "title icon"
      "temp icon"
      "condition icon";
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto auto;
    align-items: center;
  }

  .weather-current-title {
    grid-area: title;
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-left: 15px;
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .weather-current-temp {
    grid-area: temp;
    font-size: 45px;
    font-weight: bold;
    color: var(--dv-gray800, var(--primary-text-color));
    line-height: 1;
    margin-left: 15px;
  }

  .weather-current-condition {
    grid-area: condition;
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-left: 15px;
    margin-top: 8px;
    margin-bottom: 10px;
  }

  .weather-current-icon {
    grid-area: icon;
    width: 120px;
    height: 120px;
    margin-top: -10px;
    margin-bottom: -30px;
  }

  .weather-current-icon img {
    width: 100%;
    height: 100%;
  }

  .weather-hourly-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    margin: 16px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .weather-hourly-scroll::-webkit-scrollbar {
    display: none;
  }

  .weather-hourly-container {
    display: flex;
    gap: 8px;
  }

  .weather-hourly-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 16px;
    background: var(--dv-popup-bg-color);
    border-radius: 16px;
    min-width: 70px;
  }

  .weather-hourly-time {
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-bottom: 8px;
  }

  .weather-hourly-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
  }

  .weather-hourly-icon img {
    width: 100%;
    height: 100%;
  }

  .weather-hourly-temp {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .weather-forecast-swiper {
    margin: 16px 0;
  }

  .weather-forecast-card {
    background: var(--dv-popup-bg-color);
    border-radius: 24px;
    padding: 12px;
    display: grid;
    grid-template-areas:
      "title icon"
      "temp icon"
      "condition icon";
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto auto;
    align-items: center;
  }

  .weather-forecast-title {
    grid-area: title;
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-left: 15px;
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .weather-forecast-temp {
    grid-area: temp;
    font-size: 45px;
    font-weight: bold;
    color: var(--dv-gray800, var(--primary-text-color));
    line-height: 1;
    margin-left: 15px;
  }

  .weather-forecast-condition {
    grid-area: condition;
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-left: 15px;
    margin-top: 8px;
    margin-bottom: 10px;
  }

  .weather-forecast-icon {
    grid-area: icon;
    width: 120px;
    height: 120px;
    margin-top: -10px;
    margin-bottom: -30px;
  }

  .weather-forecast-icon img {
    width: 100%;
    height: 100%;
  }

  .weather-forecast-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .weather-forecast-tabs::-webkit-scrollbar {
    display: none;
  }

  .weather-forecast-tab {
    padding: 8px 16px;
    border-radius: 20px;
    background: var(--dv-popup-bg-color);
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--dv-gray800, var(--secondary-text-color));
    white-space: nowrap;
    transition: all var(--dv-transition-normal) ease;
  }

  .weather-forecast-tab.active {
    background: var(--primary-color);
    color: white;
  }

  .weather-radar-card {
    background: var(--dv-popup-bg-color);
    border-radius: 24px;
    padding: 12px;
    margin: 16px 0;
  }

  .weather-radar-title {
    font-size: 12px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-left: 15px;
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .weather-radar-iframe {
    width: 100%;
    height: 280px;
    border: none;
    border-radius: 8px;
  }

  .weather-hourly-wind {
    font-size: 11px;
    color: var(--dv-gray800, var(--secondary-text-color));
    margin-top: 4px;
  }

  .weather-hourly-rain {
    font-size: 11px;
    color: var(--dv-gray800, var(--secondary-text-color));
  }

  /* ==================== CHANGELOG POPUP STYLES ==================== */
  .changelog-popup {
    max-width: 420px;
    width: 90vw;
  }

  .changelog-content {
    padding: 0 20px 20px;
  }

  .changelog-version-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .changelog-version {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-primary, #667eea);
    background: rgba(102, 126, 234, 0.1);
    padding: 4px 12px;
    border-radius: 12px;
  }

  .changelog-date {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .changelog-page-indicator {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-align: center;
    margin-bottom: 8px;
  }

  .changelog-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0 0 4px 0;
    text-align: center;
  }

  .changelog-subtitle {
    font-size: 14px;
    color: var(--secondary-text-color);
    margin: 0 0 20px 0;
    text-align: center;
  }

  .changelog-changes {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .changelog-change-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
  }

  .changelog-change-item.feature {
    background: rgba(102, 126, 234, 0.1);
  }

  .changelog-change-item.improvement {
    background: rgba(76, 175, 80, 0.1);
  }

  .changelog-change-item.fix {
    background: rgba(255, 152, 0, 0.1);
  }

  .changelog-change-item.breaking {
    background: rgba(244, 67, 54, 0.1);
  }

  .changelog-change-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .changelog-change-item.feature .changelog-change-icon {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
  }

  .changelog-change-item.improvement .changelog-change-icon {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .changelog-change-item.fix .changelog-change-icon {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }

  .changelog-change-item.breaking .changelog-change-icon {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }

  .changelog-change-icon ha-icon {
    --mdc-icon-size: 18px;
  }

  .changelog-change-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .changelog-change-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
  }

  .changelog-change-description {
    font-size: 14px;
    color: var(--primary-text-color);
    line-height: 1.4;
  }

  .changelog-pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }

  .changelog-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dv-gray300, rgba(255, 255, 255, 0.2));
    transition: all 0.2s ease;
  }

  .changelog-dot.active {
    background: var(--dv-primary, #667eea);
    transform: scale(1.2);
  }

  .changelog-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .changelog-footer-spacer {
    flex: 1;
  }

  .changelog-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .changelog-button.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .changelog-button.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .changelog-button.primary:active {
    transform: translateY(0);
  }

  .changelog-button.secondary {
    background: transparent;
    color: var(--secondary-text-color);
    padding: 10px 16px;
  }

  .changelog-button.secondary:hover {
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
    color: var(--primary-text-color);
  }

  .changelog-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .changelog-loading,
  .changelog-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--secondary-text-color);
  }

  .changelog-loading ha-icon,
  .changelog-empty ha-icon {
    --mdc-icon-size: 32px;
  }

  .changelog-loading ha-icon.spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .changelog-raw-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--primary-text-color);
  }

  .changelog-raw-body p {
    margin: 8px 0;
  }

  .changelog-github-link {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 10px 14px;
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
    border-radius: 10px;
    color: var(--primary-text-color);
    text-decoration: none;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .changelog-github-link:hover {
    background: var(--dv-gray200, rgba(255, 255, 255, 0.1));
  }

  .changelog-github-link ha-icon {
    --mdc-icon-size: 18px;
  }
`;
