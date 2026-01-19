/**
 * Admin Order Styles
 * Order configuration, info header, grid/card/stat styles, entity list, and device config styles
 */

export const orderStyles = `
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
    color: var(--dv-gray800);
    margin: 0;
  }

  .order-config-section-title ha-icon {
    --mdc-icon-size: 22px;
    color: var(--primary-color);
  }

  .order-config-section-chevron {
    --mdc-icon-size: 24px;
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
  }

  .order-item-info {
    flex: 1;
    min-width: 0;
  }

  .order-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .order-item-subtitle {
    font-size: 12px;
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
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

  /* Sortable list drag-and-drop styles */
  .sortable-handle {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    border-radius: 6px;
    background: var(--card-background-color);
    color: var(--dv-gray600);
    transition: all var(--dv-transition-normal) ease;
    flex-shrink: 0;
  }

  .sortable-handle:hover {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  .sortable-handle:active {
    cursor: grabbing;
  }

  .sortable-handle ha-icon {
    --mdc-icon-size: 18px;
  }

  /* Ghost element (placeholder) during drag */
  .sortable-ghost {
    opacity: 0.4;
    background: var(--primary-color) !important;
  }

  /* Currently dragged element */
  .sortable-chosen {
    box-shadow: 0 4px 12px var(--dv-shadow-heavy);
    transform: scale(1.02);
  }

  /* Element being dragged over */
  .sortable-drag {
    opacity: 1;
  }

  /* Sortable item base styling */
  .sortable-item {
    touch-action: none;
  }

  /* Section header hint for drag-and-drop */
  .section-header-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--dv-gray600);
    padding: 4px 8px;
    margin-bottom: 8px;
    opacity: 0.7;
  }

  .section-header-hint ha-icon {
    --mdc-icon-size: 14px;
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
    color: var(--dv-gray800);
    font-size: 2em;
    font-weight: 500;
  }

  .info-header .subtitle {
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
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
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .entity-state {
    color: var(--dv-gray600);
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
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
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
    color: var(--dv-gray600);
  }
`;
