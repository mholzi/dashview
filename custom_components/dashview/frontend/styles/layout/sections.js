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

  .room-card.appliance-unavailable,
  .room-card.unavailable {
    background: var(--dv-gray300);
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

  .room-card.appliance-unavailable .room-card-icon,
  .room-card.unavailable .room-card-icon {
    background: var(--dv-red);
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

  .room-card.appliance-unavailable .room-card-icon ha-icon,
  .room-card.unavailable .room-card-icon ha-icon {
    color: var(--dv-gray000);
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

  .room-card.appliance-unavailable .room-card-label,
  .room-card.unavailable .room-card-label {
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

  .room-card.appliance-unavailable .room-card-name,
  .room-card.unavailable .room-card-name {
    color: var(--dv-gray800);
  }

  /* Small card layout (horizontal) */
  .room-card.small {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
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

  /* Unavailable badge - small alert icon in top right corner */
  .room-card {
    position: relative;
  }

  .room-card-unavailable-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--dv-gray600);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    line-height: 0;
  }

  .room-card-unavailable-badge ha-icon {
    --mdc-icon-size: 12px;
    color: var(--dv-gray000);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .room-card.small .room-card-unavailable-badge {
    top: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
  }

  .room-card.small .room-card-unavailable-badge ha-icon {
    --mdc-icon-size: 10px;
  }

  /* ==================== FLOOR LIGHT CARD (with slider) ==================== */
  .floor-light-card {
    position: relative;
    border-radius: var(--dv-radius-md);
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    overflow: hidden;
    box-sizing: border-box;
    margin: 4px;
    background: var(--dv-gray000);
  }

  .floor-light-card:hover {
    transform: scale(0.98);
  }

  .floor-light-card.on {
    background: var(--active-light, linear-gradient(145deg, rgba(255,243,219,1) 0%, rgba(255,234,178,1) 100%));
  }

  .floor-light-card.off {
    background: var(--dv-gray000);
  }

  .floor-light-card.has-slider {
    background: var(--dv-gray000);
  }

  /* Slider fill background */
  .floor-light-slider-fill {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-radius: var(--dv-radius-md);
    pointer-events: none;
    transition: width var(--dv-transition-fast) ease;
    z-index: 0;
  }

  .floor-light-card.dragging .floor-light-slider-fill {
    transition: none;
  }

  /* Header contains icon and content */
  .floor-light-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  /* Small card layout (horizontal) */
  .floor-light-card.small {
    height: calc(100% - 8px);
  }

  .floor-light-card.small .floor-light-header {
    flex-direction: row;
    gap: 12px;
    padding: 4px 20px 4px 4px;
  }

  .floor-light-card.small .floor-light-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .floor-light-card.small.on .floor-light-icon {
    background: var(--dv-white);
  }

  .floor-light-card.small .floor-light-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray800);
  }

  .floor-light-card.small .floor-light-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-light-card.small .floor-light-label {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .floor-light-card.small .floor-light-name {
    font-size: 14px;
    opacity: 0.7;
    color: var(--dv-gray800);
  }

  /* Big card layout (vertical) */
  .floor-light-card.big {
    height: calc(100% - 8px);
  }

  .floor-light-card.big .floor-light-header {
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
  }

  .floor-light-card.big .floor-light-icon {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: flex-end;
    margin: -16px -16px 0 0;
    background: rgba(var(--dv-highlight-rgb), 0.08);
  }

  .floor-light-card.big.on .floor-light-icon {
    background: var(--dv-white);
  }

  .floor-light-card.big .floor-light-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray800);
  }

  .floor-light-card.big .floor-light-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-light-card.big .floor-light-label {
    font-size: 1.5em;
    font-weight: 300;
    color: var(--dv-gray800);
  }

  .floor-light-card.big .floor-light-name {
    font-size: 14px;
    opacity: 0.7;
    color: var(--dv-gray800);
  }

  /* Slider area - invisible touch target at bottom of card */
  .floor-light-slider-area {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    z-index: 2;
    cursor: ew-resize;
  }

  .floor-light-card.small .floor-light-slider-area {
    height: 100%;
  }
`;
