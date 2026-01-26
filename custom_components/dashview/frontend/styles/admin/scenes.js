/**
 * Admin Scenes Styles
 * Scene button config, scene row, and info text row styles
 */

export const scenesStyles = `
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
    z-index: var(--dv-z-modal, 6);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
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
    z-index: var(--dv-z-modal, 6);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
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
    background: rgba(33, 150, 243, 0.15);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .scene-button-info-box ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-blue);
    flex-shrink: 0;
  }

  .scene-button-info-box span {
    font-size: 13px;
    color: var(--dv-gray800);
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
    background: var(--dv-gray000);
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
    background: var(--dv-gray800);
  }

  .scene-button.active ha-icon,
  .scene-button.active .scene-name {
    color: var(--dv-gray000);
  }

  .scene-button ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
    margin-bottom: 4px;
  }

  .scene-button .scene-name {
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

  .scene-row-container {
    background: var(--dv-background);
  }

  .scene-row-title {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--dv-gray600);
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
    color: var(--dv-gray800);
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
    color: var(--dv-gray000);
  }

  .info-text-row .info-badge.critical {
    background: var(--error-color, #dc2626);
    color: white;
    animation: pulse-critical 2s infinite;
  }

  @keyframes pulse-critical {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
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

  /* Dismiss button for warning alerts */
  .info-text-row .info-badge-dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    padding: 6px;
    min-width: 24px;
    min-height: 24px;
    border-radius: 50%;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.15s ease, background 0.15s ease;
    vertical-align: middle;
    box-sizing: border-box;
  }

  .info-text-row .info-badge-dismiss:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.15);
  }

  .info-text-row .info-badge.warning .info-badge-dismiss:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .info-text-row .info-badge.critical .info-badge-dismiss:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  /* Dismissed alerts indicator */
  .info-text-row .info-badge.dismissed-indicator {
    background: var(--dv-gray500);
    color: var(--dv-gray000);
    gap: 4px;
  }

  /* Touch devices - always visible dismiss button */
  @media (hover: none) {
    .info-text-row .info-badge-dismiss {
      opacity: 0.8;
    }
  }
`;
