/**
 * Weather Popup Styles
 * Weather forecasts, train departures, and DWD warnings
 */

export const weatherPopupStyles = `
  /* ==================== TRAIN DEPARTURES ==================== */
  .train-departures-section {
    margin: 0 0 24px 0;
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
    margin: 0 0 24px 0;
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

  /* ==================== WEATHER POPUP SPECIFIC ==================== */
  /* Weather popup uses shared .popup-* styles, only weather-specific content styles here */

  .weather-current-card {
    background: var(--dv-popup-bg-color);
    border-radius: 24px;
    padding: 12px;
    margin-bottom: 32px;
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
    margin: 32px 0;
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
    margin: 32px 0;
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
    margin-bottom: 10px;
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
    margin: 32px 0;
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
`;
