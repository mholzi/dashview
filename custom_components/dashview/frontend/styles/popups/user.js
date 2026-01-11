/**
 * User Popup Styles
 * Styles for profile card, status chip, and presence history
 * History cards match security-entity-card format
 */

export const userPopupStyles = `
  /* ==================== USER POPUP PROFILE CARD ==================== */
  .user-popup-profile-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 32px 16px;
    text-align: center;
  }

  /* Item 1: Avatar with status ring */
  .user-popup-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dv-gray200);
    border: 4px solid var(--dv-gray400);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 16px;
  }

  .user-popup-avatar.home {
    border-color: var(--success-color, var(--dv-green500));
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
  }

  .user-popup-avatar.away {
    border-color: var(--dv-gray400);
  }

  .user-popup-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-popup-avatar ha-icon {
    --mdc-icon-size: 64px;
    color: var(--dv-gray500);
  }

  /* Item 2: Name and entity ID */
  .user-popup-identity {
    margin-bottom: 16px;
  }

  .user-popup-name {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 4px;
  }

  .user-popup-entity-id {
    font-size: 13px;
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  /* Items 3+4: Status chip and time */
  .user-popup-status-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .user-popup-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .user-popup-status-chip.home {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
    color: var(--success-color, var(--dv-green600));
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .user-popup-status-chip.away {
    background: var(--dv-gray100);
    color: var(--dv-gray600);
    border: 1px solid var(--dv-gray300);
  }

  .user-popup-status-chip ha-icon {
    --mdc-icon-size: 20px;
  }

  .user-popup-status-time {
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  /* ==================== USER POPUP HISTORY SECTION ==================== */
  .user-popup-history-section {
    margin-top: 8px;
    border-top: 1px solid var(--dv-gray200);
    padding-top: 8px;
  }

  .user-popup-history-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    border-radius: 12px;
  }

  .user-popup-history-header:hover {
    background: var(--dv-gray100);
  }

  .user-popup-history-header ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray600);
    margin-right: 12px;
  }

  .user-popup-history-title {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .user-popup-history-count {
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  .user-popup-history-content {
    display: none;
    padding: 8px 0;
  }

  .user-popup-history-content.expanded {
    display: block;
  }

  .user-popup-history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* History card - matches security-entity-card exactly */
  .user-popup-history-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 4px 20px 4px 4px;
    border-radius: 12px;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
  }

  .user-popup-history-card.active {
    background: var(--dv-gradient-active);
  }

  .user-popup-history-card.inactive {
    background: var(--dv-gray000);
  }

  .user-popup-history-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-popup-history-card.active .user-popup-history-icon {
    background: var(--dv-white);
  }

  .user-popup-history-card.inactive .user-popup-history-icon {
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .user-popup-history-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .user-popup-history-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .user-popup-history-action {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .user-popup-history-card.active .user-popup-history-action {
    color: var(--dv-gray000);
  }

  .user-popup-history-card.inactive .user-popup-history-action {
    color: var(--dv-gray800);
  }

  .user-popup-history-time {
    font-size: 14px;
    color: var(--dv-gray800);
    opacity: 0.7;
  }

  .user-popup-history-card.active .user-popup-history-time {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  .user-popup-history-card.inactive .user-popup-history-time {
    color: var(--dv-gray800);
  }

  /* ==================== RESPONSIVE ADJUSTMENTS ==================== */
  @media (max-width: 400px) {
    .user-popup-avatar {
      width: 100px;
      height: 100px;
    }

    .user-popup-avatar ha-icon {
      --mdc-icon-size: 52px;
    }

    .user-popup-name {
      font-size: 22px;
    }

    .user-popup-status-chip {
      padding: 8px 16px;
      font-size: 14px;
    }
  }
`;
