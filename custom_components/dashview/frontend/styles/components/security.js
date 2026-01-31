/**
 * Security Styles
 * Security section and battery popup styles
 */

export const securityStyles = `
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
    color: var(--dv-gray800);
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
    background: var(--dv-gray000);
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
    margin: 0;
    padding: 12px 0 15px 0;
  }

  .security-entity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .security-garage-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 8px 8px 8px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
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
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
  }

  .battery-empty-subtext {
    font-size: 14px;
    color: var(--dv-gray600);
  }

  .battery-header-info {
    padding: 8px 0 16px 0;
    font-size: 14px;
    color: var(--dv-gray600);
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
    background: var(--dv-gray100);
    border-radius: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .battery-device-card:hover {
    background: var(--dv-gray800);
  }

  .battery-device-card:hover .battery-device-name,
  .battery-device-card:hover .battery-device-level {
    color: var(--dv-gray000) !important;
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
    color: var(--dv-gray800);
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
    background: var(--dv-gray200);
    border-radius: 2px;
    overflow: hidden;
  }

  .battery-device-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width var(--dv-transition-slow) ease;
  }

  /* ==================== LIGHTS POPUP ==================== */
  .lights-popup-section-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin: 0;
    padding: 12px 0 15px 0;
  }

  .lights-popup-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .lights-popup-card {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 20px 4px 4px;
    min-height: 58px;
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    overflow: hidden;
    background: var(--dv-gray000);
  }

  .lights-popup-card.on {
    background: var(--active-light, linear-gradient(145deg, rgba(255,243,219,1) 0%, rgba(255,234,178,1) 100%));
  }

  .lights-popup-card.off {
    background: var(--dv-gray000);
  }

  .lights-popup-card.has-slider {
    background: var(--dv-gray000);
  }

  /* Slider fill background */
  .lights-popup-slider-fill {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    transition: width var(--dv-transition-fast) ease;
    z-index: 0;
  }

  .lights-popup-card.dragging .lights-popup-slider-fill {
    transition: none;
  }

  /* Header contains icon and content */
  .lights-popup-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 100%;
  }

  .lights-popup-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .lights-popup-card.on .lights-popup-icon {
    background: var(--dv-white);
  }

  .lights-popup-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .lights-popup-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .lights-popup-label {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .lights-popup-label-time {
    font-weight: 400;
    opacity: 0.7;
  }

  .lights-popup-name {
    font-size: 14px;
    color: var(--dv-gray800);
    opacity: 0.7;
  }

  /* Slider area - invisible touch target */
  .lights-popup-slider-area {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    z-index: 2;
    cursor: ew-resize;
    touch-action: none;
  }

  .lights-popup-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    gap: 12px;
  }

  .lights-popup-empty-text {
    font-size: 14px;
    color: var(--dv-gray600);
  }

  /* ==================== COVERS POPUP ==================== */
  .covers-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    gap: 12px;
    color: var(--dv-gray600);
  }

  .covers-empty-state ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.5;
  }

  .covers-popup-summary {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 8px 16px 16px;
    font-size: 14px;
  }

  .covers-popup-count.open {
    color: var(--dv-blue, #42a5f5);
    font-weight: 500;
  }

  .covers-popup-count.closed {
    color: var(--dv-gray600);
  }

  .covers-popup-separator {
    color: var(--dv-gray400);
  }

  .covers-popup-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .covers-popup-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    background: var(--dv-gray200);
    color: var(--dv-gray800);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .covers-popup-action-btn:hover {
    background: var(--dv-gray300);
  }

  .covers-popup-action-btn:active {
    transform: scale(0.98);
  }

  .covers-popup-action-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  .covers-popup-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .covers-popup-card {
    background: var(--dv-gray100);
    border-radius: 12px;
    overflow: hidden;
    transition: all var(--dv-transition-normal) ease;
  }

  .covers-popup-card.open {
    background: var(--dv-gradient-cover, linear-gradient(135deg, rgba(144, 202, 249, 0.3) 0%, rgba(66, 165, 245, 0.3) 100%));
  }

  .covers-popup-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
  }

  .covers-popup-header:active {
    transform: scale(0.98);
  }

  .covers-popup-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--dv-white);
  }

  .covers-popup-card.closed .covers-popup-icon {
    background: var(--dv-gray200);
  }

  .covers-popup-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .covers-popup-card.open .covers-popup-icon ha-icon {
    color: var(--dv-blue, #42a5f5);
  }

  .covers-popup-content {
    flex: 1;
  }

  .covers-popup-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .covers-popup-position {
    font-size: 13px;
    color: var(--dv-gray600);
  }

  .covers-popup-card.open .covers-popup-position {
    color: var(--dv-blue, #42a5f5);
  }

  .covers-popup-slider {
    padding: 0 12px 12px;
  }

  .covers-popup-slider input[type="range"] {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--dv-gray300);
    border-radius: 3px;
    outline: none;
    touch-action: none;
  }

  .covers-popup-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--dv-white);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
  }

  .covers-popup-slider input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: var(--dv-white);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
  }

  /* ==================== TVS POPUP ==================== */
  .tvs-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    gap: 12px;
    color: var(--dv-gray600);
  }

  .tvs-empty-state ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.5;
  }

  .tvs-popup-summary {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 8px 16px 16px;
    font-size: 14px;
  }

  .tvs-popup-count.on {
    color: var(--dv-green, #66bb6a);
    font-weight: 500;
  }

  .tvs-popup-count.off {
    color: var(--dv-gray600);
  }

  .tvs-popup-separator {
    color: var(--dv-gray400);
  }

  .tvs-popup-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .tvs-popup-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    background: var(--dv-gray200);
    color: var(--dv-gray800);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .tvs-popup-action-btn:hover {
    background: var(--dv-gray300);
  }

  .tvs-popup-action-btn:active {
    transform: scale(0.98);
  }

  .tvs-popup-action-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  .tvs-popup-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .tvs-popup-card {
    background: var(--dv-gray100);
    border-radius: 12px;
    overflow: hidden;
    transition: all var(--dv-transition-normal) ease;
  }

  .tvs-popup-card.on {
    background: var(--dv-gradient-tv, linear-gradient(135deg, rgba(186, 104, 200, 0.3) 0%, rgba(149, 117, 205, 0.3) 100%));
  }

  .tvs-popup-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
  }

  .tvs-popup-header:active {
    transform: scale(0.98);
  }

  .tvs-popup-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--dv-white);
    overflow: hidden;
  }

  .tvs-popup-card.off .tvs-popup-icon {
    background: var(--dv-gray200);
  }

  .tvs-popup-icon.has-image {
    border-radius: 8px;
  }

  .tvs-popup-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tvs-popup-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .tvs-popup-card.on .tvs-popup-icon ha-icon {
    color: var(--dv-purple, #9c27b0);
  }

  .tvs-popup-content {
    flex: 1;
  }

  .tvs-popup-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .tvs-popup-name {
    font-size: 13px;
    color: var(--dv-gray600);
  }

  .tvs-popup-card.on .tvs-popup-name {
    color: var(--dv-purple, #9c27b0);
    opacity: 0.8;
  }

  .tvs-popup-volume {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px 12px;
  }

  .tvs-popup-volume ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-gray600);
  }

  .tvs-popup-volume input[type="range"] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--dv-gray300);
    border-radius: 3px;
    outline: none;
  }

  .tvs-popup-volume input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--dv-white);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
  }

  .tvs-popup-volume input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--dv-white);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
  }

  .tvs-popup-volume-text {
    min-width: 40px;
    text-align: right;
    font-size: 13px;
    color: var(--dv-gray600);
  }

  /* ==================== ALARM CONTROL PANEL ==================== */

  /* State banner */
  .alarm-state-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px;
    margin-bottom: 20px;
    border-radius: 12px;
    background: var(--dv-gray100);
    transition: background 0.3s ease;
  }

  /* Color-coded state backgrounds */
  .alarm-state-display.alarm-disarmed {
    background: var(--dv-green);
  }

  .alarm-state-display.alarm-armed-home {
    background: var(--dv-orange);
  }

  .alarm-state-display.alarm-armed-away {
    background: var(--dv-red);
  }

  .alarm-state-display.alarm-triggered {
    background: var(--dv-red);
    animation: alarm-flash 0.8s ease-in-out infinite;
  }

  .alarm-state-display.alarm-pending {
    background: var(--dv-yellow);
  }

  @keyframes alarm-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .alarm-state-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
  }

  .alarm-state-display.alarm-disarmed .alarm-state-icon,
  .alarm-state-display.alarm-armed-home .alarm-state-icon,
  .alarm-state-display.alarm-armed-away .alarm-state-icon,
  .alarm-state-display.alarm-triggered .alarm-state-icon,
  .alarm-state-display.alarm-pending .alarm-state-icon {
    background: rgba(255, 255, 255, 0.35);
  }

  .alarm-state-icon ha-icon {
    --mdc-icon-size: 28px;
    color: var(--dv-fixed-dark);
  }

  .alarm-state-info {
    flex: 1;
  }

  .alarm-state-name {
    font-size: 14px;
    color: var(--dv-fixed-dark);
    opacity: 0.7;
    margin-bottom: 2px;
  }

  .alarm-state-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-fixed-dark);
  }

  /* Arm/Disarm Controls */
  .alarm-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .alarm-mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 8px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .alarm-mode-btn:active {
    transform: scale(0.95);
  }

  .alarm-mode-btn ha-icon {
    --mdc-icon-size: 28px;
  }

  .alarm-mode-btn span {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }

  .alarm-mode-home {
    background: var(--dv-orange);
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-home ha-icon {
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-away {
    background: var(--dv-red);
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-away ha-icon {
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-night {
    background: var(--dv-purple);
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-night ha-icon {
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-disarm {
    background: var(--dv-green);
    color: var(--dv-fixed-dark);
  }

  .alarm-mode-disarm ha-icon {
    color: var(--dv-fixed-dark);
  }

  /* PIN Code Entry */
  .alarm-pin-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0 20px;
  }

  .alarm-pin-display {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding: 12px;
  }

  .alarm-pin-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--dv-gray400);
    transition: all 0.15s ease;
  }

  .alarm-pin-dot.filled {
    background: var(--dv-gray800);
    border-color: var(--dv-gray800);
  }

  .alarm-pin-pad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 260px;
    width: 100%;
  }

  .alarm-pin-key {
    width: 100%;
    aspect-ratio: 1.4;
    border-radius: 12px;
    border: none;
    background: var(--dv-gray100);
    color: var(--dv-gray800);
    font-size: 22px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .alarm-pin-key:active {
    background: var(--dv-gray300);
    transform: scale(0.95);
  }

  .alarm-pin-key ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .alarm-pin-cancel {
    background: var(--dv-red);
  }

  .alarm-pin-cancel ha-icon {
    color: var(--dv-fixed-dark);
  }

  .alarm-pin-cancel:active {
    background: var(--dv-red);
    opacity: 0.8;
  }

  .alarm-pin-backspace {
    background: var(--dv-gray200);
  }

  .alarm-pin-submit {
    width: 100%;
    max-width: 260px;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: var(--dv-gray800);
    color: var(--dv-gray000);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .alarm-pin-submit:active {
    transform: scale(0.98);
  }

  .alarm-pin-submit.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Open Sensors */
  .alarm-open-sensors {
    margin-top: 4px;
  }

  .alarm-open-sensors-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0 0 10px;
  }

  .alarm-open-sensors-title ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-red);
  }

  .alarm-open-sensors-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .alarm-open-sensor-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--dv-gray100);
    border-radius: 8px;
    font-size: 14px;
    color: var(--dv-gray800);
  }

  .alarm-open-sensor-item ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-yellow);
  }
`;
