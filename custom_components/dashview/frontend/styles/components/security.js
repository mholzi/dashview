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
`;
