/**
 * Water Popup Styles
 * Styles for the water leak sensor popup
 */

export const waterPopupStyles = `
  /* ==================== WATER POPUP STYLES ==================== */
  .water-popup-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--secondary-text-color);
  }

  .water-popup-empty ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .water-popup-empty-text {
    font-size: 14px;
    text-align: center;
  }

  .water-sensor-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .water-sensor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal, 0.2s) ease;
    box-shadow: var(--ha-card-box-shadow, 0 2px 4px var(--dv-shadow-light, rgba(0,0,0,0.1)));
  }

  .water-sensor-item:hover {
    background: var(--dv-gray200, rgba(0,0,0,0.05));
  }

  .water-sensor-item:active {
    transform: scale(0.98);
  }

  .water-sensor-item.wet {
    background: rgba(231, 76, 60, 0.1);
    border-left: 3px solid var(--dv-water-alert, #e74c3c);
  }

  .water-sensor-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--dv-gray200, rgba(0,0,0,0.05));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .water-sensor-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--primary-text-color);
  }

  .water-sensor-icon.alert {
    background: var(--dv-water-alert, #e74c3c);
    animation: waterPulse 1s infinite;
  }

  .water-sensor-icon.alert ha-icon {
    color: white;
  }

  .water-sensor-info {
    flex: 1;
    min-width: 0;
  }

  .water-sensor-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .water-sensor-area {
    font-size: 12px;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .water-sensor-state {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 12px;
    background: var(--success-color, #4CAF50);
    color: white;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .water-sensor-state.alert {
    background: var(--dv-water-alert, #e74c3c);
    animation: waterPulse 1s infinite;
  }

  @keyframes waterPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Water status alert in home info text */
  .water-status-alert {
    color: var(--dv-water-alert, #e74c3c);
    font-weight: bold;
    animation: waterPulse 1s infinite;
  }

  /* Water chip in room popup */
  .popup-chip.water-alert {
    background: var(--dv-water-alert, #e74c3c);
  }

  .popup-chip.water-alert .popup-chip-state,
  .popup-chip.water-alert .popup-chip-time {
    color: white;
  }
`;
