/**
 * Admin Tabs Styles
 * Admin sub-tabs navigation and header bar styles
 */

export const tabsStyles = `
  /* ==================== ADMIN SUB-TABS ==================== */

  /* Container for tabs and scroll indicators */
  .admin-sub-tabs-container {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .admin-sub-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .admin-sub-tabs::-webkit-scrollbar {
    display: none;
  }

  /* Scroll indicators - gradient overlays showing more tabs available */
  .admin-sub-tabs-indicator {
    position: absolute;
    top: 0;
    bottom: 16px; /* Match margin-bottom of tabs */
    width: 24px;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--dv-transition-fast) ease-out;
    z-index: 1;
  }

  .admin-sub-tabs-indicator.visible {
    opacity: 1;
  }

  .admin-sub-tabs-indicator-left {
    left: 0;
    background: linear-gradient(to right, var(--dv-popup-bg, var(--dv-gray000)) 0%, transparent 100%);
  }

  .admin-sub-tabs-indicator-right {
    right: 0;
    background: linear-gradient(to left, var(--dv-popup-bg, var(--dv-gray000)) 0%, transparent 100%);
  }

  /* Dark mode gradient colors - fallback to dark gray if --dv-popup-bg not defined */
  :host-context([data-theme="dark"]) .admin-sub-tabs-indicator-left,
  :host([dark]) .admin-sub-tabs-indicator-left {
    background: linear-gradient(to right, var(--dv-popup-bg, var(--dv-gray800)) 0%, transparent 100%);
  }

  :host-context([data-theme="dark"]) .admin-sub-tabs-indicator-right,
  :host([dark]) .admin-sub-tabs-indicator-right {
    background: linear-gradient(to left, var(--dv-popup-bg, var(--dv-gray800)) 0%, transparent 100%);
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

`;
