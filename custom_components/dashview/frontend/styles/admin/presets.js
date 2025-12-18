/**
 * Admin Presets Styles
 * Train departure config and media preset config styles
 */

export const presetsStyles = `
  /* ==================== TRAIN DEPARTURE CONFIG ==================== */
  .train-departure-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .train-departure-item {
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
  }

  .train-departure-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray100);
  }

  .train-departure-header ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .train-departure-info {
    flex: 1;
    min-width: 0;
  }

  .train-departure-name {
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .train-departure-entity {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .train-departure-config {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .train-config-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .train-config-row label {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
  }

  .train-config-row input {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
  }

  .train-config-row input:focus {
    outline: none;
    border-color: var(--dv-highlight);
  }

  .train-config-row input[type="number"] {
    width: 100px;
  }

  .train-config-row input[type="time"] {
    width: 120px;
  }

  .train-config-row select {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    width: 100%;
  }

  .train-config-row select:focus {
    outline: none;
    border-color: var(--dv-highlight);
  }

  .train-config-row-inline {
    display: flex;
    gap: 16px;
  }

  .train-config-row-inline .train-config-row {
    flex: 1;
  }

  /* ==================== MEDIA PRESET CONFIG (ADMIN) ==================== */
  .media-preset-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .media-preset-item {
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
  }

  .media-preset-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray100);
  }

  .media-preset-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dv-gray300);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    color: var(--dv-gray800);
    flex-shrink: 0;
  }

  .media-preset-info {
    flex: 1;
    min-width: 0;
  }

  .media-preset-name {
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-preset-uri {
    font-size: 12px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-preset-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .media-preset-config {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .media-preset-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .media-preset-row label {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-gray600);
  }

  .media-preset-row input {
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .media-preset-row input:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .media-preset-preview {
    margin-top: 8px;
    width: 64px;
    height: 64px;
    border-radius: var(--dv-radius-sm);
    overflow: hidden;
    background: var(--dv-gray300);
  }

  .media-preset-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
