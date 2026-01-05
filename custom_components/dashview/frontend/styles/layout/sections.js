/**
 * Sections Styles
 * Room sections and room card grid layouts
 */

export const sectionsStyles = `
  /* ==================== RÄUME SECTION ==================== */
  .raeume-section {
    padding: 0;
    margin-bottom: 24px;
  }

  .raeume-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .raeume-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
    padding: 14px 0 15px 0;
  }

  .floor-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .floor-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 13px;
    border: none;
    border-radius: 50%;
    background: var(--dv-gray800);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    box-sizing: border-box;
  }

  .floor-tab ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray000);
  }

  .floor-tab:hover {
    opacity: 0.8;
  }

  .floor-tab.active {
    background: var(--dv-gradient-active);
  }

  .floor-tab.active ha-icon {
    color: var(--dv-gray000);
  }

  /* ==================== ROOM CARDS GRID ==================== */
  /*
   * Note: Room cards intentionally do NOT have interactive shadows (--dv-shadow-interactive).
   * These cards use tap-to-toggle with color change feedback (gradient backgrounds).
   * Interactive shadows are reserved for cards that reveal additional content on long-press
   * (floor overview slides, garbage slides, floor device cards).
   * See UX Design Specification: "toggle feedback via color change is sufficient"
   */
  .room-card {
    border-radius: var(--dv-radius-md);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-sizing: border-box;
    margin: 4px;
  }

  .room-card:hover {
    transform: scale(0.98);
  }

  .room-card.inactive {
    background: var(--dv-gray000);
  }

  .room-card.active-light {
    background: var(--active-light, linear-gradient(145deg, rgba(255,243,219,1) 0%, rgba(255,234,178,1) 100%));
  }

  .room-card.active-gradient {
    background: var(--dv-gradient-active);
  }

  /* Appliance status colors for small cards */
  .room-card.appliance-active {
    background: var(--dv-active-appliances);
  }

  .room-card.appliance-finished {
    background: var(--dv-active-appliances-done);
  }

  .room-card.appliance-error {
    background: var(--dv-red);
  }

  .room-card.appliance-unavailable {
    background: var(--dv-gray300);
    opacity: 0.6;
  }

  .room-card-icon {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .room-card.inactive .room-card-icon {
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .room-card.active-light .room-card-icon,
  .room-card.active-gradient .room-card-icon {
    background: var(--dv-white);
  }

  .room-card.appliance-active .room-card-icon,
  .room-card.appliance-finished .room-card-icon,
  .room-card.appliance-error .room-card-icon {
    background: var(--dv-gray800);
  }

  .room-card.appliance-unavailable .room-card-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .room-card.inactive .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-icon ha-icon,
  .room-card.active-gradient .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-icon ha-icon,
  .room-card.appliance-finished .room-card-icon ha-icon,
  .room-card.appliance-error .room-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  .room-card.appliance-unavailable .room-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .room-card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .room-card-label {
    font-weight: 300;
  }

  .room-card.inactive .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-label,
  .room-card.active-gradient .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-label,
  .room-card.appliance-finished .room-card-label,
  .room-card.appliance-error .room-card-label {
    color: var(--dv-gray000);
  }

  .room-card.appliance-unavailable .room-card-label {
    color: var(--dv-gray800);
  }

  .room-card-name {
    font-size: 14px;
    opacity: 0.7;
  }

  .room-card.inactive .room-card-name {
    color: var(--dv-gray800);
  }

  .room-card.active-light .room-card-name,
  .room-card.active-gradient .room-card-name {
    color: var(--dv-gray800);
  }

  .room-card.appliance-active .room-card-name,
  .room-card.appliance-finished .room-card-name,
  .room-card.appliance-error .room-card-name {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  .room-card.appliance-unavailable .room-card-name {
    color: var(--dv-gray800);
  }

  /* Small card layout (horizontal) */
  .room-card.small {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 4px 20px 4px 4px;
    height: calc(100% - 8px);
  }

  .room-card.small .room-card-icon {
    width: 50px;
    height: 50px;
  }

  .room-card.small .room-card-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .room-card.small .room-card-content {
    flex: 1;
  }

  .room-card.small .room-card-label {
    font-size: 16px;
    font-weight: 500;
  }

  /* Big card layout (vertical) */
  .room-card.big {
    padding: 20px;
    height: calc(100% - 8px);
  }

  .room-card.big .room-card-icon {
    align-self: flex-end;
    width: 58px;
    height: 58px;
    margin: -16px -16px 0 0;
  }

  .room-card.big .room-card-icon ha-icon {
    --mdc-icon-size: 30px;
  }

  .room-card.big .room-card-label {
    font-size: 1.5em;
  }
`;
