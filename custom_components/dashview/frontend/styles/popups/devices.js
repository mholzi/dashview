/**
 * Devices Popup Styles
 * Popup device card grid styles (sensor_big style)
 */

export const devicesPopupStyles = `
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
    padding-right: 20px;
    margin-right: 10px;
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
`;
