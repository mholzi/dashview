/**
 * Admin Floor Cards Styles
 * Floor cards configuration grid and slot styles
 */

export const floorCardsStyles = `
  /* ==================== FLOOR CARDS CONFIG ==================== */
  .floor-cards-config-section {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    padding: 16px;
    margin-bottom: 16px;
  }

  .floor-cards-config-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin-bottom: 16px;
  }

  .floor-cards-config-title ha-icon {
    --mdc-icon-size: var(--dv-icon-md);
    color: var(--dv-gray800);
  }

  .floor-cards-config-layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .floor-cards-config-layout .floor-cards-config-grid {
    flex: 1;
    min-width: 250px;
  }

  .floor-cards-config-layout floor-card-preview {
    flex-shrink: 0;
    align-self: flex-start;
  }

  @media (max-width: 600px) {
    .floor-cards-config-layout {
      flex-direction: column;
    }

    .floor-cards-config-layout floor-card-preview {
      margin-top: 16px;
    }
  }

  .floor-cards-config-grid {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 76px 76px 76px 76px;
    grid-template-areas:
      "small1 big1"
      "big2 big1"
      "big2 small2"
      "small3 small4";
    gap: 0;
  }

  .floor-card-slot {
    border: 2px dashed var(--dv-gray300);
    border-radius: var(--dv-radius-md);
    margin: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    background: var(--dv-gray200);
    padding: 8px;
    box-sizing: border-box;
  }

  .floor-card-slot:hover {
    border-color: var(--dv-gray800);
    background: var(--dv-gray300);
  }

  .floor-card-slot.configured {
    border-style: solid;
    border-color: var(--dv-gray800);
    background: var(--dv-gray000);
  }

  .floor-card-slot.selected {
    border-color: var(--dv-blue);
    border-style: solid;
    background: color-mix(in srgb, var(--dv-blue) 10%, var(--dv-gray000));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--dv-blue) 30%, transparent);
  }

  .floor-card-slot.disabled {
    opacity: 0.6;
    cursor: default;
    pointer-events: none;
  }

  .floor-card-slot.small {
    height: calc(100% - 8px);
  }

  .floor-card-slot.big {
    height: calc(100% - 8px);
  }

  .floor-card-slot-label {
    font-size: 10px;
    color: var(--dv-gray600);
    text-align: center;
    margin-top: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .floor-card-slot-entity {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .floor-card-slot-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray600);
    margin-bottom: 4px;
  }

  .floor-card-slot.configured .floor-card-slot-icon {
    color: var(--dv-gray800);
  }

  .floor-card-entity-select {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
  }

  .floor-card-entity-select:focus {
    outline: none;
    border-color: var(--dv-gray800);
  }

  .floor-card-entity-selector {
    position: relative;
    width: 100%;
  }

  .floor-card-entity-config {
    margin-top: 16px;
    padding: 16px;
    background: var(--dv-gray100);
    border-radius: var(--dv-radius-md);
    border: 1px solid var(--dv-gray300);
  }

  .floor-card-entity-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .floor-card-entity-config-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .floor-card-entity-config-close {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color var(--dv-transition-normal) ease;
  }

  .floor-card-entity-config-close:hover {
    color: var(--dv-gray800);
  }

  .floor-card-entity-selector-button {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .floor-card-entity-selector-button:hover {
    border-color: var(--dv-gray800);
  }

  .floor-card-entity-selector-button ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    flex-shrink: 0;
  }

  .floor-card-entity-selector-text {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-card-entity-selector-name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-selector-id {
    font-size: 10px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-selector-chevron {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    flex-shrink: 0;
  }

  .floor-card-entity-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 250px;
    overflow-y: auto;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
    z-index: var(--dv-z-modal);
    margin-top: 4px;
  }

  .floor-card-entity-option {
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--dv-gray200);
    transition: background var(--dv-transition-fast) ease;
  }

  .floor-card-entity-option:last-child {
    border-bottom: none;
  }

  .floor-card-entity-option:hover {
    background: var(--dv-gray200);
  }

  .floor-card-entity-option.selected {
    background: var(--dv-gray200);
  }

  .floor-card-entity-option ha-icon {
    --mdc-icon-size: var(--dv-icon-md);
    flex-shrink: 0;
    color: var(--dv-gray800);
  }

  .floor-card-entity-option-text {
    flex: 1;
    overflow: hidden;
  }

  .floor-card-entity-option-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-option-id {
    font-size: 11px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-card-entity-option-clear {
    color: var(--dv-red);
  }

  .floor-card-entity-option-clear ha-icon {
    color: var(--dv-red);
  }

  /* Floor Overview Toggle in Admin */
  .floor-overview-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
    margin-bottom: 12px;
  }

  .floor-overview-toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .floor-overview-toggle-label ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .floor-overview-toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .floor-overview-toggle-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .floor-overview-toggle-subtitle {
    font-size: 12px;
    color: var(--dv-gray600);
  }

  /* Floor Overview Swipe Card */
  .floor-overview-card {
    position: relative;
    height: 147px;
    overflow: clip;
    border-radius: var(--dv-radius-md);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .floor-overview-card:active {
    cursor: grabbing;
  }

  .floor-overview-slides {
    display: flex;
    height: 100%;
    transition: transform var(--dv-transition-slow) ease;
  }

  .floor-overview-slide {
    min-width: 100%;
    height: 143px;
    box-sizing: border-box;
    padding: 8px;
    display: grid;
    grid-template-areas: "n i" "temp temp";
    grid-template-rows: 1fr min-content;
    grid-template-columns: min-content 1fr;
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    cursor: pointer;
    /*
     * Interactive shadow always visible for discoverability (touch-first design).
     * Shadow indicates this card supports long-press to reveal room popup.
     * On press, shadow reduces and card scales for tactile feedback.
     */
    box-shadow: var(--dv-shadow-interactive);
    transition: box-shadow var(--dv-animation-press), transform var(--dv-animation-press);
  }

  /* Pressed state for tactile feedback on long-press */
  .floor-overview-slide:active {
    box-shadow: var(--dv-shadow-pressed);
    transform: scale(0.98);
  }

  /* Keyboard accessibility - visible focus indicator */
  .floor-overview-slide:focus-visible {
    outline: 2px solid var(--dv-blue);
    outline-offset: 2px;
  }

  /* Last slide should be full width - no peek beyond the last card */
  .floor-overview-slide:last-child {
    min-width: 100%;
  }

  .floor-overview-slide-name {
    grid-area: n;
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800);
    padding: 14px;
    justify-self: start;
    align-self: start;
    text-align: left;
  }

  .floor-overview-slide-icon {
    grid-area: i;
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    align-self: start;
  }

  .floor-overview-slide:not(.active) .floor-overview-slide-icon {
    background: rgba(var(--dv-highlight-rgb), 0.05);
  }

  .floor-overview-slide.active .floor-overview-slide-icon {
    background: var(--dv-gradient-active);
  }

  /* Icon color: gray600 for inactive (visible on gray000 bg), gray000 for active (with gradient bg) */
  .floor-overview-slide:not(.active) .floor-overview-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray600);
  }

  .floor-overview-slide.active .floor-overview-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray000);
  }

  .floor-overview-slide-temp {
    grid-area: temp;
    font-size: 2.5em;
    line-height: 1em;
    font-weight: 300;
    color: var(--dv-gray800);
    padding: 0 0 6px 14px;
    justify-self: start;
  }

  .floor-overview-slide-temp-humidity {
    font-size: 0.3em;
    opacity: 0.7;
  }

  /* Unified pagination dots (used by floor overview and garbage cards) */
  .pagination,
  .floor-overview-pagination,
  .garbage-pagination {
    display: flex;
    justify-content: center;
    /* Gap accounts for touch target size to prevent overlap:
       Each dot has 44px touch width, so gap should separate them clearly */
    gap: 4px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    /* Ensure 44px touch target height */
    min-height: 44px;
    align-items: center;
    padding: 0 16px;
  }

  .pagination-dot,
  .floor-overview-dot,
  .garbage-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dv-gray400);
    border: none;
    margin: 0;
    /* Touch target padding: (10px - 6px) / 2 = 2px */
    padding: 2px;
    cursor: pointer;
    opacity: 0.6;
    transform: scale(1);
    /* Separate transitions: transform/opacity fast, background slightly slower */
    transition: transform var(--dv-transition-fast) ease-out,
                opacity var(--dv-transition-fast) ease-out,
                background var(--dv-transition-normal) ease;
    /* Visual rendering only the 8px dot */
    background-clip: content-box;
    box-sizing: content-box;
  }

  .pagination-dot.active,
  .floor-overview-dot.active,
  .garbage-dot.active {
    background: var(--dv-gray700);
    opacity: 1;
    transform: scale(1.2);
  }

  /* Dark mode adjustments for better visibility */
  @media (prefers-color-scheme: dark) {
    .pagination-dot,
    .floor-overview-dot,
    .garbage-dot {
      background: var(--dv-gray500);
      opacity: 0.6;
    }

    .pagination-dot.active,
    .floor-overview-dot.active,
    .garbage-dot.active {
      background: var(--dv-gray300);
      opacity: 1;
    }
  }

  :host-context(html.dark-mode) .pagination-dot,
  :host-context(body.dark-mode) .pagination-dot,
  :host-context([data-theme="dark"]) .pagination-dot,
  :host-context(html.dark-mode) .floor-overview-dot,
  :host-context(body.dark-mode) .floor-overview-dot,
  :host-context([data-theme="dark"]) .floor-overview-dot,
  :host-context(html.dark-mode) .garbage-dot,
  :host-context(body.dark-mode) .garbage-dot,
  :host-context([data-theme="dark"]) .garbage-dot {
    background: var(--dv-gray500);
    opacity: 0.6;
  }

  :host-context(html.dark-mode) .pagination-dot.active,
  :host-context(body.dark-mode) .pagination-dot.active,
  :host-context([data-theme="dark"]) .pagination-dot.active,
  :host-context(html.dark-mode) .floor-overview-dot.active,
  :host-context(body.dark-mode) .floor-overview-dot.active,
  :host-context([data-theme="dark"]) .floor-overview-dot.active,
  :host-context(html.dark-mode) .garbage-dot.active,
  :host-context(body.dark-mode) .garbage-dot.active,
  :host-context([data-theme="dark"]) .garbage-dot.active {
    background: var(--dv-gray300);
    opacity: 1;
  }
`;
