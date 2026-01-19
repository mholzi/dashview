/**
 * Changelog Popup Styles
 * Version changelog display popup
 */

export const changelogPopupStyles = `
  /* ==================== CHANGELOG POPUP STYLES ==================== */
  .changelog-popup {
    max-width: 420px;
    width: 90vw;
  }

  .changelog-content {
    padding: 0 20px 20px;
  }

  .changelog-version-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .changelog-version {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-primary, #667eea);
    background: rgba(102, 126, 234, 0.1);
    padding: 4px 12px;
    border-radius: 12px;
  }

  .changelog-date {
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .changelog-page-indicator {
    font-size: 12px;
    color: var(--dv-gray600);
    text-align: center;
    margin-bottom: 8px;
  }

  .changelog-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0 0 4px 0;
    text-align: center;
  }

  .changelog-subtitle {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0 0 20px 0;
    text-align: center;
  }

  .changelog-changes {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .changelog-change-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
  }

  .changelog-change-item.feature {
    background: rgba(102, 126, 234, 0.1);
  }

  .changelog-change-item.improvement {
    background: rgba(76, 175, 80, 0.1);
  }

  .changelog-change-item.fix {
    background: rgba(255, 152, 0, 0.1);
  }

  .changelog-change-item.breaking {
    background: rgba(244, 67, 54, 0.1);
  }

  .changelog-change-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .changelog-change-item.feature .changelog-change-icon {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
  }

  .changelog-change-item.improvement .changelog-change-icon {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .changelog-change-item.fix .changelog-change-icon {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }

  .changelog-change-item.breaking .changelog-change-icon {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }

  .changelog-change-icon ha-icon {
    --mdc-icon-size: 18px;
  }

  .changelog-change-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .changelog-change-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--dv-gray600);
  }

  .changelog-change-description {
    font-size: 14px;
    color: var(--dv-gray800);
    line-height: 1.4;
  }

  .changelog-pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }

  .changelog-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dv-gray300, rgba(255, 255, 255, 0.2));
    transition: all 0.2s ease;
  }

  .changelog-dot.active {
    background: var(--dv-primary, #667eea);
    transform: scale(1.2);
  }

  .changelog-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .changelog-footer-spacer {
    flex: 1;
  }

  .changelog-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .changelog-button.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .changelog-button.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .changelog-button.primary:active {
    transform: translateY(0);
  }

  .changelog-button.secondary {
    background: transparent;
    color: var(--dv-gray600);
    padding: 10px 16px;
  }

  .changelog-button.secondary:hover {
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
    color: var(--dv-gray800);
  }

  .changelog-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .changelog-loading,
  .changelog-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--dv-gray600);
  }

  .changelog-loading ha-icon,
  .changelog-empty ha-icon {
    --mdc-icon-size: 32px;
  }

  .changelog-loading ha-icon.spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .changelog-raw-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--dv-gray800);
  }

  .changelog-raw-body p {
    margin: 8px 0;
  }

  .changelog-github-link {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 10px 14px;
    background: var(--dv-gray100, rgba(255, 255, 255, 0.05));
    border-radius: 10px;
    color: var(--dv-gray800);
    text-decoration: none;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .changelog-github-link:hover {
    background: var(--dv-gray200, rgba(255, 255, 255, 0.1));
  }

  .changelog-github-link ha-icon {
    --mdc-icon-size: 18px;
  }
`;
