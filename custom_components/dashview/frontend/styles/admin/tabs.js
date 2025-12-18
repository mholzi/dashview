/**
 * Admin Tabs Styles
 * Admin sub-tabs navigation and header bar styles
 */

export const tabsStyles = `
  /* ==================== ADMIN SUB-TABS ==================== */
  .admin-sub-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }

  .admin-sub-tabs::-webkit-scrollbar {
    display: none;
  }

  .admin-sub-tab {
    padding: 8px 12px;
    cursor: pointer;
    border: none;
    background: var(--dv-gray200);
    color: var(--dv-gray800);
    font-size: 0.85em;
    font-weight: 500;
    border-radius: 8px;
    transition: all var(--dv-transition-normal) ease;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .admin-sub-tab:hover {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
  }

  .admin-sub-tab.active {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
  }

  .admin-sub-tab ha-icon {
    --mdc-icon-size: 16px;
  }

  /* ==================== ADMIN HEADER BAR ==================== */
  .admin-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 16px;
  }

  .undo-redo-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 0 12px;
    flex-shrink: 0;
  }

  .undo-redo-controls .icon-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 4px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    border: none;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    font-size: 0.85em;
    font-weight: 500;
  }

  .undo-redo-controls .icon-button:hover:not(:disabled) {
    opacity: 0.9;
    transform: scale(1.05);
  }

  .undo-redo-controls .icon-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .undo-redo-controls .icon-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .undo-redo-controls .icon-button .count {
    font-size: 0.9em;
    opacity: 0.9;
  }
`;
