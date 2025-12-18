/**
 * Admin Entities Styles
 * Custom entity items and other entities section styles
 */

export const entitiesStyles = `
  /* ==================== CUSTOM ENTITY ITEMS ==================== */
  .custom-entity-item {
    background: var(--dv-gray100);
    border-radius: 8px;
    margin-bottom: 6px;
    overflow: hidden;
  }

  .custom-entity-item.enabled {
    background: var(--dv-gray200);
  }

  .custom-entity-item:last-child {
    margin-bottom: 0;
  }

  .custom-entity-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    cursor: pointer;
  }

  .custom-entity-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .custom-entity-info ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .custom-entity-item.enabled .custom-entity-info ha-icon {
    color: var(--dv-gray800);
  }

  .custom-entity-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .custom-entity-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-entity-state {
    font-size: 11px;
    color: var(--dv-gray600);
  }

  .custom-entity-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .custom-entity-expand {
    --mdc-icon-size: 20px;
    color: var(--dv-gray500);
    transition: transform 0.2s ease;
  }

  .custom-entity-expand.expanded {
    transform: rotate(180deg);
  }

  /* Child entities display */
  .custom-entity-children {
    padding: 0 12px 10px 42px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .custom-entity-child {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--dv-gray000);
    border-radius: 6px;
    font-size: 12px;
  }

  .custom-entity-child ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-gray500);
    flex-shrink: 0;
  }

  .custom-entity-child .child-name {
    flex: 1;
    color: var(--dv-gray700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-entity-child .child-state {
    color: var(--dv-gray500);
    font-size: 11px;
  }

  .custom-entity-child .child-remove {
    --mdc-icon-size: 16px;
    color: var(--dv-gray400);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .custom-entity-child .child-remove:hover {
    color: var(--dv-red);
    background: var(--dv-gray200);
  }

  /* Child entity picker */
  .custom-entity-child-picker {
    padding: 8px 12px 12px 42px;
    border-top: 1px solid var(--dv-gray200);
  }

  .child-picker-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .child-picker-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--dv-gray000);
    border-radius: 6px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .child-picker-option:hover {
    background: var(--dv-gray200);
  }

  .child-picker-option:last-child {
    margin-bottom: 0;
  }

  .child-picker-option ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-gray500);
    flex-shrink: 0;
  }

  .child-picker-name {
    flex: 1;
    font-size: 12px;
    color: var(--dv-gray700);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .child-picker-state {
    font-size: 11px;
    color: var(--dv-gray500);
  }

  .child-picker-add {
    --mdc-icon-size: 18px;
    color: var(--dv-gray400);
    transition: color 0.15s ease;
  }

  .child-picker-option:hover .child-picker-add {
    color: var(--dv-green);
  }

  /* Custom label section in room config */
  .custom-label-section {
    border-left: 3px solid var(--dv-purple);
    padding-left: 12px;
  }

  /* ==================== OTHER ENTITIES SECTION ==================== */
  .other-entities-section {
    margin-top: 24px;
    padding: 0 16px;
  }

  .other-entities-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .other-entities-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0;
  }

  .other-entities-tabs {
    display: flex;
    gap: 4px;
    background: var(--dv-gray200);
    padding: 4px;
    border-radius: var(--dv-radius-md);
  }

  .other-entities-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: var(--dv-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--dv-gray600);
  }

  .other-entities-tab:hover {
    background: var(--dv-gray300);
  }

  .other-entities-tab.active {
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    box-shadow: 0 1px 3px var(--dv-shadow-light);
  }

  .other-entities-tab ha-icon {
    --mdc-icon-size: 20px;
  }

  .other-entities-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  /* Other Entity Card - similar to room-card big style */
  .other-entity-card {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-lg);
    padding: 12px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .other-entity-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--dv-shadow-light);
  }

  .other-entity-card.active-gradient {
    background: var(--dv-gradient-active);
  }

  .other-entity-card.active-light {
    background: var(--dv-gradient-light);
  }

  .other-entity-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: auto;
  }

  .other-entity-card-area {
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-gray600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .other-entity-card.active-gradient .other-entity-card-area,
  .other-entity-card.active-light .other-entity-card-area {
    color: var(--dv-gray700);
  }

  .other-entity-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-md);
  }

  .other-entity-card.active-gradient .other-entity-card-icon,
  .other-entity-card.active-light .other-entity-card-icon {
    background: rgba(255, 255, 255, 0.4);
  }

  .other-entity-card-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-gray700);
  }

  .other-entity-card.active-gradient .other-entity-card-icon ha-icon,
  .other-entity-card.active-light .other-entity-card-icon ha-icon {
    color: var(--dv-gray800);
  }

  .other-entity-card-content {
    margin-top: 8px;
  }

  .other-entity-card-state {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    line-height: 1.2;
  }

  .other-entity-card-name {
    font-size: 12px;
    color: var(--dv-gray600);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .other-entity-card.active-gradient .other-entity-card-name,
  .other-entity-card.active-light .other-entity-card-name {
    color: var(--dv-gray700);
  }

  /* Child entities display in card */
  .other-entity-card-children {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--dv-gray200);
  }

  .other-entity-card.active-gradient .other-entity-card-children,
  .other-entity-card.active-light .other-entity-card-children {
    border-top-color: rgba(0, 0, 0, 0.1);
  }

  .other-entity-child-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    font-size: 11px;
  }

  .other-entity-card.active-gradient .other-entity-child-item,
  .other-entity-card.active-light .other-entity-child-item {
    background: rgba(255, 255, 255, 0.4);
  }

  .other-entity-child-item ha-icon {
    --mdc-icon-size: 14px;
    color: var(--dv-gray600);
  }

  .other-entity-child-item .child-value {
    color: var(--dv-gray700);
    font-weight: 500;
  }
`;
