/**
 * Admin Main Styles
 * Admin tab main styles - area cards, toggles, lights section, bulk actions
 */

export const mainStyles = `
  /* ==================== ADMIN TAB ==================== */
  .area-card {
    background: var(--dv-gray000);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px var(--dv-shadow-light));
  }

  .area-header {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .area-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--dv-gray800);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dv-gray000);
  }

  .area-icon.disabled {
    background: var(--dv-gray100);
    color: var(--dv-gray600);
  }

  .area-title {
    flex: 1;
  }

  .area-name {
    font-size: 1.2em;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .area-subtitle {
    font-size: 0.85em;
    color: var(--dv-gray600);
  }

  .area-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--dv-gray200);
    border: 1px solid var(--dv-gray400);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.3s ease, border-color 0.3s ease;
  }

  .toggle-switch.on {
    background: var(--dv-blue);
    border-color: var(--dv-blue);
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform var(--dv-transition-slow) ease;
  }

  .toggle-switch.on::after {
    transform: translateX(24px);
  }

  /* Small toggle variant */
  .toggle-switch.small {
    width: 36px;
    height: 18px;
    border-radius: 9px;
  }

  .toggle-switch.small::after {
    width: 14px;
    height: 14px;
    top: 2px;
    left: 2px;
  }

  .toggle-switch.small.on::after {
    transform: translateX(18px);
  }

  /* Entity item with extra toggle */
  .entity-item.with-extra-toggle {
    flex-wrap: wrap;
  }

  .entity-item-toggles {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .entity-item-extra-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: var(--dv-gray100);
    border-radius: 8px;
  }

  .extra-toggle-label {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
  }

  .expand-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray600);
    transition: transform var(--dv-transition-slow) ease;
  }

  .expand-icon.expanded {
    transform: rotate(180deg);
  }

  /* ==================== ROOM CONFIG SPACING ==================== */
  /* Gap between room header and search box */
  .entity-search-wrapper {
    margin-top: 16px;
    margin-bottom: 16px;
    padding: 0 16px;
  }

  .lights-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--dv-gray200);
  }

  .lights-title {
    font-size: 1em;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lights-title.collapsible {
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s ease;
  }

  .lights-title.collapsible:hover {
    opacity: 0.7;
  }

  .entity-section-chevron {
    --mdc-icon-size: 20px;
    transition: transform 200ms ease;
  }

  .entity-section-chevron.expanded {
    transform: rotate(180deg);
  }

  .entity-section-entities {
    overflow: hidden;
    transition: max-height 200ms ease, opacity 200ms ease;
  }

  .entity-section-entities.collapsed {
    max-height: 0;
    opacity: 0;
  }

  .entity-section-entities.expanded {
    max-height: 2000px;
    opacity: 1;
  }

  /* Bulk Action Buttons */
  .bulk-actions {
    display: flex;
    gap: 6px;
  }

  .bulk-action-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid var(--dv-gray400);
    background: transparent;
    color: var(--dv-gray600);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .bulk-action-btn:hover {
    background: var(--dv-gray200);
    border-color: var(--dv-gray500);
  }

  .bulk-action-btn:active {
    transform: scale(0.95);
  }

  .entity-expand-controls {
    display: flex;
    justify-content: flex-end;
    padding: 8px 16px 16px;
    margin-bottom: 0;
  }

  .entity-expand-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--dv-background);
    border: 1px solid var(--dv-gray200);
    border-radius: 6px;
    color: var(--dv-gray800);
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .entity-expand-button:hover {
    background: var(--dv-gray100);
    border-color: var(--dv-gray800);
  }

  .entity-expand-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .light-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--dv-background);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .light-item:last-child {
    margin-bottom: 0;
  }

  .light-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .light-info ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
  }

  .light-info.light-on ha-icon {
    color: var(--dv-yellow);
  }

  .light-name {
    color: var(--dv-gray800);
    font-size: 0.95em;
  }

  .light-state {
    font-size: 0.8em;
    color: var(--dv-gray600);
    margin-left: 4px;
  }

  .light-state.on {
    color: var(--dv-green);
  }

  .no-lights {
    color: var(--dv-gray600);
    font-style: italic;
    padding: 8px 0;
  }

  .section-title {
    font-size: 1.5em;
    font-weight: 500;
    color: var(--dv-gray800);
    margin: 0 0 24px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-title ha-icon {
    color: var(--dv-blue);
  }

  .no-selected-lights {
    text-align: center;
    padding: 32px;
    color: var(--dv-gray600);
  }

  .no-selected-lights ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    display: block;
  }

  /* ==================== UNIFIED ADMIN EMPTY STATE ==================== */
  .admin-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    min-height: 180px;
    background: var(--dv-gray100);
    border-radius: var(--dv-radius-md);
  }

  .admin-empty-state-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-gray400);
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .admin-empty-state-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--dv-gray700);
    margin: 0 0 8px;
  }

  .admin-empty-state-description {
    font-size: 0.875rem;
    color: var(--dv-gray500);
    margin: 0 0 8px;
    max-width: 280px;
    line-height: 1.4;
  }

  .admin-empty-state-hint {
    font-size: 0.75rem;
    color: var(--dv-gray400);
    font-style: italic;
    margin: 0;
    max-width: 280px;
  }
`;
