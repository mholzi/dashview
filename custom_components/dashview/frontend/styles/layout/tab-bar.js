/**
 * Bottom Tab Bar Styles
 * Fixed navigation bar at bottom of screen
 */

export const tabBarStyles = `
  /* ==================== BOTTOM TAB BAR ==================== */
  .bottom-tab-bar {
    position: fixed;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9;
    box-sizing: border-box;
    pointer-events: none;
  }

  .bottom-tab-bar-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: calc(100% - 20px);
    max-width: 480px;
    background: var(--dv-gray800);
    padding: 10px;
    border-radius: 100px;
    pointer-events: auto;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--dv-gray000);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    transition: all var(--dv-transition-normal) ease;
  }

  .tab ha-icon {
    --mdc-icon-size: 24px;
  }

  .tab span {
    display: none;
  }

  .tab:hover {
    opacity: 0.7;
  }

  .tab.active {
    background: var(--dv-gradient-active);
    color: var(--dv-gray000);
  }

  .tab-content {
    padding: 16px;
    padding-bottom: calc(70px + 16px + env(safe-area-inset-bottom, 0px));
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ==================== VERSION FOOTER ==================== */
  .dashview-version {
    text-align: center;
    font-size: 10px;
    color: var(--dv-gray500);
    padding: 16px 0 calc(80px + env(safe-area-inset-bottom, 0px)) 0;
    opacity: 0.6;
  }
`;
