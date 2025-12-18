/**
 * Top Header Styles
 * Navigation header with weather widget and person avatar
 */

export const headerStyles = `
  /* ==================== TOP HEADER ==================== */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 8px;
    background: var(--primary-background-color);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .menu-button {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--dv-transition-normal) ease;
  }

  .menu-button:hover {
    background: var(--dv-gray200);
  }

  .menu-button ha-icon {
    --mdc-icon-size: 24px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .weather-widget {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--card-background-color);
    border-radius: 12px;
    cursor: pointer;
    transition: background var(--dv-transition-normal) ease;
  }

  .weather-widget:hover {
    background: var(--dv-gray200);
  }

  .weather-icon {
    --mdc-icon-size: 32px;
    color: var(--primary-color);
  }

  .weather-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .weather-condition {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    text-transform: capitalize;
  }

  .weather-temp {
    font-size: 1.25em;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .person-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--card-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: transform var(--dv-transition-normal) ease;
  }

  .person-avatar:hover {
    transform: scale(1.05);
  }

  .person-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .person-avatar ha-icon {
    --mdc-icon-size: 28px;
    color: var(--secondary-text-color);
  }

  .person-avatar.home {
    background: var(--success-color, #4caf50);
  }

  .person-avatar.home ha-icon {
    color: white;
  }
`;
