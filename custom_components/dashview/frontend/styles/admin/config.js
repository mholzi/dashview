/**
 * Admin Config Styles
 * Label mapping, card config, info text config, and custom labels config styles
 */

export const configStyles = `
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
`;
