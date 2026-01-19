/**
 * Activity Icons Row Styles
 * Horizontal scrolling activity indicators
 */

export const activityIconStyles = `
  /* ==================== ACTIVITY ICONS ROW ==================== */
  .activity-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 16px 16px 16px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .activity-row::-webkit-scrollbar {
    display: none;
  }

  .activity-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--dv-gray000);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    padding: 13px;
    box-sizing: border-box;
  }

  .activity-chip:hover {
    transform: scale(1.1);
  }

  .activity-chip ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray600);
  }

  .activity-chip.floor-chip {
    background: var(--dv-gray800);
  }

  .activity-chip.floor-chip ha-icon {
    color: var(--dv-gray000);
  }

  .activity-chip.room-chip {
    background: var(--dv-gradient-active);
  }

  .activity-chip.room-chip ha-icon {
    color: var(--dv-gray000);
  }

  .activity-chip.room-motion-chip {
    background: var(--dv-gradient-active);
  }

  .activity-chip.room-motion-chip ha-icon {
    color: var(--dv-black);
  }

  .activity-chip.room-smoke-chip {
    background: var(--dv-red);
    animation: pulse-danger 1s infinite;
  }

  .activity-chip.room-smoke-chip ha-icon {
    color: var(--dv-white);
  }

  .activity-chip.security-chip {
    background: var(--dv-gray000);
  }

  .activity-chip.security-chip ha-icon {
    color: var(--dv-gray600);
  }

  .activity-chip.security-chip.has-open {
    background: var(--dv-gradient-active);
  }

  .activity-chip.security-chip.has-open ha-icon {
    color: var(--dv-black);
  }

  @keyframes pulse-danger {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
`;
