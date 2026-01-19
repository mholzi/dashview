/**
 * Shared Popup Styles
 * Common popup styles, scene buttons, notifications, and expandable sections
 */

export const sharedPopupStyles = `
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
    z-index: var(--dv-z-popup, 5);
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
    box-shadow: 0 -4px 20px var(--dv-shadow-heavy);
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
    color: var(--dv-gray800);
  }

  .popup-title p {
    margin: 2px 0 0 0;
    font-size: 0.85em;
    color: var(--dv-gray600);
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
    color: var(--dv-gray600);
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
    background: var(--dv-red);
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
    background: var(--dv-gray000);
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
    background: var(--dv-gray800);
  }

  .popup-scene-button ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
    margin-bottom: 4px;
  }

  .popup-scene-button.active ha-icon,
  .popup-scene-button.active span {
    color: var(--dv-gray000);
  }

  .popup-scene-button span {
    font-size: 11px;
    color: var(--dv-gray800);
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
    color: var(--dv-gray800);
    text-align: left;
    align-self: end;
    padding-bottom: 2px;
  }

  .popup-notification-subtitle {
    grid-area: subtitle;
    font-size: 14px;
    color: var(--dv-gray800);
    opacity: 0.7;
    text-align: left;
    align-self: start;
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
`;
