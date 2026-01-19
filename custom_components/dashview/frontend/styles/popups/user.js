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
    border-color: var(--dv-green);
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
    color: var(--dv-gray800);
    margin-bottom: 4px;
  }

  .user-popup-entity-id {
    font-size: 13px;
    color: var(--dv-gray600);
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
    color: var(--dv-green);
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
    color: var(--dv-gray600);
  }

  /* ==================== USER POPUP HISTORY SECTION ==================== */
  /* Matches popup-light-section format from room popup */
  .user-popup-history-section {
    margin: 8px 12px 32px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .user-popup-history-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .user-popup-history-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .user-popup-history-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
    flex: 1;
  }

  .user-popup-history-count {
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .user-popup-history-content {
    padding: 10px 8px 8px 8px;
    margin-top: 10px;
    display: none;
  }

  .user-popup-history-content.expanded {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Zone section title - matches lights-popup-section-title */
  .user-popup-zone-section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin: 0;
    padding: 12px 0 8px 0;
  }

  .user-popup-zone-section-title:first-child {
    padding-top: 0;
  }

  /* Zone cards list */
  .user-popup-zone-list {
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
