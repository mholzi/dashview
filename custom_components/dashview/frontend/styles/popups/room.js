/**
 * Room Popup Styles
 * Cover, thermostat, temperature, light, garage, and lock controls
 */

export const roomPopupStyles = `

  /* ============================================
     Room Popup Suggestions Section
     ============================================ */

  .popup-suggestions-section {
    margin: 0 0 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .popup-suggestions-section .suggestion-banner {
    margin: 0 16px;
    padding: 10px 14px;
  }

  .popup-suggestions-section .suggestion-banner-title {
    font-size: 13px;
  }

  .popup-suggestions-section .suggestion-banner-desc {
    font-size: 11px;
  }

  .popup-suggestions-section .suggestion-action-btn {
    padding: 5px 12px;
    font-size: 11px;
  }

  .popup-suggestions-section .suggestion-dismiss-btn {
    width: 24px;
    height: 24px;
    min-width: 24px;
    font-size: 12px;
  }

  /* ==================== SKELETON LOADING STATES ==================== */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      var(--dv-gray200) 0%,
      var(--dv-gray100) 50%,
      var(--dv-gray200) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .popup-skeleton {
    padding: 12px;
  }

  .popup-skeleton-chips {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .popup-skeleton-chip {
    height: 40px;
    width: 100px;
    border-radius: 20px;
  }

  .popup-skeleton-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }

  .popup-skeleton-action {
    height: 44px;
    flex: 1;
    border-radius: 12px;
  }

  .popup-skeleton-section {
    background: var(--dv-gray200);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .popup-skeleton-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .popup-skeleton-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }

  .popup-skeleton-title {
    height: 18px;
    width: 80px;
    border-radius: 4px;
  }

  .popup-skeleton-count {
    height: 14px;
    width: 60px;
    border-radius: 4px;
    margin-left: auto;
  }

  .popup-skeleton-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .popup-skeleton-item {
    height: 68px;
    border-radius: 12px;
  }

  /* ==================== POPUP COVER SECTION ==================== */
  .popup-cover-section {
    margin: 0 12px 32px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-cover-header {
    display: grid;
    grid-template-columns: auto 1fr 50px;
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
    white-space: nowrap;
    cursor: pointer;
  }

  .popup-cover-slider {
    position: relative;
    height: 8px;
    background: var(--dv-gray100);
    border-radius: 4px;
    cursor: pointer;
    touch-action: none;
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

  /* During drag: use CSS variable to override inline styles, disable transitions */
  .popup-cover-slider.dragging .popup-cover-slider-fill {
    width: var(--drag-position) !important;
    transition: none !important;
  }

  .popup-cover-slider.dragging .popup-cover-slider-thumb {
    left: var(--drag-position) !important;
    transition: none !important;
  }

  .popup-cover-position {
    font-size: 14px;
    font-weight: 500;
    text-align: right;
    color: var(--dv-gray800, var(--primary-text-color));
    padding: 8px 0 8px 8px;
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
    margin-bottom: 12px;
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
    grid-template-columns: auto 1fr 50px;
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

  /* ==================== POPUP THERMOSTAT SECTION ==================== */
  .popup-thermostat-section {
    margin: 0 12px 32px 12px;
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
    margin-bottom: 32px;
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
    background: var(--dv-gray000);
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
    margin: 8px 12px 32px 12px;
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
    touch-action: none;
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
    margin: 0 12px 32px 12px;
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
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-garage-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-garage-content.expanded {
    max-height: 500px;
    padding: 10px 8px 8px 8px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .popup-garage-item {
    overflow: hidden;
    border-radius: 12px;
  }

  .popup-garage-item-header {
    display: flex;
    align-items: center;
    height: 46px;
    padding: 4px 12px 4px 4px;
    gap: 12px;
    cursor: pointer;
    box-sizing: border-box;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-garage-item-header.open {
    background: var(--dv-gradient-active);
  }

  .popup-garage-item-header.closed {
    background: var(--dv-gray000);
  }

  .popup-garage-item-icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .popup-garage-item-header.open .popup-garage-item-icon {
    background: var(--dv-white);
  }

  .popup-garage-item-header.closed .popup-garage-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-garage-item-icon ha-icon {
    --mdc-icon-size: 18px;
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
    width: 28px;
    height: 28px;
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
    --mdc-icon-size: 16px;
    color: var(--dv-gray800);
  }

  /* ==================== POPUP LOCK SECTION ==================== */
  .popup-lock-section {
    margin: 0 12px 32px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-lock-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
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
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-lock-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-lock-content.expanded {
    max-height: 500px;
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
`;
