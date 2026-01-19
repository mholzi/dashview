/**
 * Entity Picker Styles
 * Autocomplete entity selection component
 */

export const entityPickerStyles = `
  /* ==================== ENTITY PICKER ==================== */
  .entity-picker {
    position: relative;
    width: 100%;
  }

  .entity-picker-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    padding: 0 12px;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .entity-picker-input-wrapper:focus-within {
    border-color: var(--dv-gray800);
  }

  .entity-picker-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    margin-right: 8px;
    flex-shrink: 0;
  }

  .entity-picker-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 0;
    font-size: 14px;
    color: var(--dv-gray800);
    outline: none;
    min-width: 0;
  }

  .entity-picker-input::placeholder {
    color: var(--dv-gray500);
  }

  .entity-picker-clear {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    margin-left: 4px;
    flex-shrink: 0;
    transition: color var(--dv-transition-normal) ease;
  }

  .entity-picker-clear:hover {
    color: var(--dv-gray800);
  }

  .entity-picker-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--dv-z-modal, 6);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
  }

  .entity-picker-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .entity-picker-suggestion:hover {
    background: var(--dv-gray200);
  }

  .entity-picker-suggestion.selected {
    background: var(--dv-gray200);
  }

  .entity-picker-suggestion ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .entity-picker-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .entity-picker-suggestion-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-picker-suggestion-entity {
    font-size: 11px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-picker-suggestion-check {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-green);
    flex-shrink: 0;
  }

  .entity-picker-no-results {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }
`;
