/**
 * Card Styles
 * Floor device cards and garbage collection cards
 */

export const cardStyles = `
  /* ==================== FLOOR DEVICE CARD (for floor cards grid) ==================== */
  .floor-device-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 10px;
    margin: 4px;
    height: calc(100% - 8px);
    background: var(--dv-gray300);
    border-radius: var(--dv-radius-md);
    transition: box-shadow var(--dv-animation-press), transform var(--dv-animation-press);
    overflow: hidden;
    /*
     * Interactive shadow always visible for discoverability (touch-first design).
     * Shadow indicates this card supports long-press to reveal details.
     */
    box-shadow: var(--dv-shadow-interactive);
  }

  /* Pressed state for tactile feedback on long-press */
  .floor-device-card:active:not(.unavailable) {
    box-shadow: var(--dv-shadow-pressed);
    transform: scale(0.98);
  }

  /* Keyboard accessibility - visible focus indicator */
  .floor-device-card:focus-visible:not(.unavailable) {
    outline: 2px solid var(--dv-blue);
    outline-offset: 2px;
  }

  .floor-device-card.big {
    height: calc(100% - 8px);
  }

  .floor-device-card.active {
    background: var(--dv-active-appliances);
  }

  .floor-device-card.finished {
    background: var(--dv-active-appliances-done);
  }

  .floor-device-card.error {
    background: var(--dv-red);
  }

  .floor-device-card.unavailable {
    background: var(--dv-gray300);
    /* Unavailable cards are not interactive - no shadow */
    box-shadow: none;
  }

  /* Icon in top-right corner */
  .floor-device-card-icon {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .floor-device-card.big .floor-device-card-icon {
    width: 40px;
    height: 40px;
  }

  .floor-device-card.active .floor-device-card-icon,
  .floor-device-card.finished .floor-device-card-icon,
  .floor-device-card.error .floor-device-card-icon {
    background: var(--dv-gray800);
  }

  .floor-device-card-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-gray800);
  }

  .floor-device-card.big .floor-device-card-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .floor-device-card.active .floor-device-card-icon ha-icon,
  .floor-device-card.finished .floor-device-card-icon ha-icon,
  .floor-device-card.error .floor-device-card-icon ha-icon {
    color: var(--dv-gray000);
  }

  /* Status text */
  .floor-device-card-status {
    font-size: 1.1em;
    font-weight: 300;
    color: var(--dv-gray800);
    line-height: 1.2;
  }

  .floor-device-card.big .floor-device-card-status {
    font-size: 1.3em;
  }

  .floor-device-card.active .floor-device-card-status,
  .floor-device-card.finished .floor-device-card-status,
  .floor-device-card.error .floor-device-card-status {
    color: var(--dv-gray000);
  }

  /* Remaining time */
  .floor-device-card-time {
    font-size: 0.9em;
    font-weight: 400;
    color: var(--dv-gray600);
    margin-top: 1px;
  }

  .floor-device-card.big .floor-device-card-time {
    font-size: 1em;
  }

  .floor-device-card.active .floor-device-card-time,
  .floor-device-card.finished .floor-device-card-time {
    color: var(--dv-gray000);
    opacity: 0.8;
  }

  /* Device name */
  .floor-device-card-name {
    font-size: 11px;
    color: var(--dv-gray600);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .floor-device-card.big .floor-device-card-name {
    font-size: 13px;
    margin-top: 4px;
  }

  .floor-device-card.active .floor-device-card-name,
  .floor-device-card.finished .floor-device-card-name,
  .floor-device-card.error .floor-device-card-name {
    color: var(--dv-gray000);
    opacity: 0.7;
  }

  /* ==================== GARBAGE CARD ==================== */
  .garbage-card {
    position: relative;
    height: 147px;
    overflow: clip;
    border-radius: var(--dv-radius-md);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .garbage-card:active {
    cursor: grabbing;
  }

  .garbage-slides {
    display: flex;
    height: 100%;
    transition: transform var(--dv-transition-slow) ease;
  }

  .garbage-slide {
    min-width: 100%;
    height: 143px;
    box-sizing: border-box;
    padding: 20px;
    display: grid;
    grid-template-areas: "i" "label" "n";
    grid-template-rows: auto 1fr auto;
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    cursor: pointer;
    /*
     * Interactive shadow always visible for discoverability (touch-first design).
     * Shadow indicates this card supports long-press to reveal details.
     */
    box-shadow: var(--dv-shadow-interactive);
    transition: box-shadow var(--dv-animation-press), transform var(--dv-animation-press);
  }

  /* Pressed state for tactile feedback on long-press */
  .garbage-slide:active {
    box-shadow: var(--dv-shadow-pressed);
    transform: scale(0.98);
  }

  /* Keyboard accessibility - visible focus indicator */
  .garbage-slide:focus-visible {
    outline: 2px solid var(--dv-blue);
    outline-offset: 2px;
  }

  /* Last slide should be full width - no peek beyond the last card */
  .garbage-slide:last-child {
    min-width: 100%;
  }

  .garbage-slide.urgent {
    background: var(--dv-red);
  }

  .garbage-slide.soon {
    background: var(--dv-green);
  }

  /* Today (after 9am) and Tomorrow: accent text color */
  .garbage-slide.today .garbage-slide-label,
  .garbage-slide.today .garbage-slide-name,
  .garbage-slide.soon .garbage-slide-label,
  .garbage-slide.soon .garbage-slide-name {
    color: var(--dv-blue);
  }

  .garbage-slide-name {
    grid-area: n;
    font-size: 14px;
    font-weight: 400;
    color: var(--dv-gray800);
    opacity: 0.7;
    justify-self: start;
    align-self: end;
  }

  .garbage-slide.urgent .garbage-slide-name {
    color: var(--dv-white);
  }

  .garbage-slide-icon {
    grid-area: i;
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    align-self: start;
    background: rgba(var(--dv-highlight-rgb), 0.08);
    margin: -6px -6px 0 0;
  }

  .garbage-slide.urgent .garbage-slide-icon {
    background: var(--dv-gray800);
  }

  .garbage-slide.soon .garbage-slide-icon {
    background: var(--dv-gray000);
  }

  .garbage-slide-icon ha-icon {
    --mdc-icon-size: 30px;
    color: var(--dv-gray800);
  }

  .garbage-slide.urgent .garbage-slide-icon ha-icon {
    color: var(--dv-white);
  }

  .garbage-slide.soon .garbage-slide-icon ha-icon {
    color: var(--dv-gray800);
  }

  .garbage-slide-label {
    grid-area: label;
    font-size: 1.5em;
    font-weight: 300;
    color: var(--dv-gray800);
    justify-self: start;
    align-self: end;
  }

  .garbage-slide.urgent .garbage-slide-label {
    color: var(--dv-white);
  }

  /* Garbage pagination uses unified styles above */

  /* Garbage Admin Section */
  .garbage-config-section {
    background: var(--dv-gray000);
    border-radius: var(--dv-radius-md);
    padding: 16px;
    margin-bottom: 16px;
  }

  .garbage-sensor-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .garbage-sensor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dv-gray200);
    border-radius: var(--dv-radius-sm);
  }

  .garbage-sensor-item ha-icon {
    --mdc-icon-size: var(--dv-icon-lg);
    color: var(--dv-gray800);
  }

  .garbage-sensor-info {
    flex: 1;
    min-width: 0;
  }

  .garbage-sensor-name {
    font-weight: 500;
    color: var(--dv-gray800);
  }

  .garbage-sensor-entity {
    font-size: 12px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-floor-selector {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--dv-gray300);
  }

  .garbage-floor-selector label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--dv-gray800);
  }

  .garbage-floor-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .garbage-floor-btn {
    padding: 8px 16px;
    border-radius: var(--dv-radius-sm);
    border: 1px solid var(--dv-gray300);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    cursor: pointer;
    font-size: 14px;
    transition: all var(--dv-transition-normal) ease;
  }

  .garbage-floor-btn:hover {
    background: var(--dv-gray200);
  }

  .garbage-floor-btn.active {
    background: var(--dv-gray800);
    color: var(--dv-gray000);
    border-color: var(--dv-gray800);
  }

  /* Garbage Search Styles */
  .garbage-search-container {
    position: relative;
    margin-bottom: 16px;
  }

  .garbage-search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    padding: 0 12px;
    transition: border-color var(--dv-transition-normal) ease;
  }

  .garbage-search-input-wrapper:focus-within {
    border-color: var(--dv-gray800);
  }

  .garbage-search-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    margin-right: 8px;
  }

  .garbage-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 0;
    font-size: 13px;
    color: var(--dv-gray800);
    outline: none;
  }

  .garbage-search-input::placeholder {
    color: var(--dv-gray600);
  }

  .garbage-search-clear {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: background var(--dv-transition-normal) ease;
  }

  .garbage-search-clear:hover {
    background: var(--dv-gray300);
  }

  .garbage-search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--dv-gray000);
    border: 1px solid var(--dv-gray300);
    border-radius: var(--dv-radius-sm);
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--dv-z-dropdown);
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
  }

  .garbage-search-suggestion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background var(--dv-transition-fast) ease;
    border-bottom: 1px solid var(--dv-gray200);
  }

  .garbage-search-suggestion:last-child {
    border-bottom: none;
  }

  .garbage-search-suggestion:hover:not(.disabled) {
    background: var(--dv-gray200);
  }

  .garbage-search-suggestion.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .garbage-search-suggestion ha-icon {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray600);
  }

  .garbage-suggestion-info {
    flex: 1;
    min-width: 0;
  }

  .garbage-suggestion-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-gray800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-suggestion-entity {
    font-size: 11px;
    color: var(--dv-gray600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .garbage-suggestion-add {
    --mdc-icon-size: var(--dv-icon-sm);
    color: var(--dv-gray800);
  }

  .garbage-suggestion-added {
    font-size: 11px;
    color: var(--dv-gray600);
    font-style: italic;
  }

  .garbage-search-no-results {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }

  .garbage-selected-sensors {
    margin-top: 16px;
  }

  .garbage-sensor-item.selected {
    background: var(--dv-gray200);
  }

  .garbage-sensor-remove {
    --mdc-icon-size: var(--dv-icon-md);
    color: var(--dv-gray600);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all var(--dv-transition-normal) ease;
  }

  .garbage-sensor-remove:hover {
    color: var(--dv-red);
    background: rgba(240, 169, 148, 0.2);
  }

`;
