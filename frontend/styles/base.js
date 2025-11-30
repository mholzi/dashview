/**
 * Base Styles
 * Core host and typography styles for Dashview
 *
 * This file contains foundational styles that should be applied to the :host element.
 * It extracts the core layout, typography, and theme detection from the main styles.
 */

export const hostStyles = `
  /* Layout */
  display: block;
  background: var(--primary-background-color);
  min-height: 100vh;
  box-sizing: border-box;
  max-width: 500px;
  margin: 0 auto;
`;

export const typographyStyles = `
  /* Typography */
  .title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0;
  }

  .subtitle {
    font-size: 0.875rem;
    color: var(--dv-gray600);
    margin: 0;
  }

  .label {
    font-size: 0.75rem;
    color: var(--dv-gray500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const resetStyles = `
  /* Reset */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }

  button:focus {
    outline: none;
  }
`;

export const utilityStyles = `
  /* Utility Classes */
  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .no-select {
    user-select: none;
    -webkit-user-select: none;
  }

  .swipeable {
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .swipeable:active {
    cursor: grabbing;
  }

  .hidden {
    display: none !important;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;

// Combined base styles export
export const baseStyles = `
  :host {
    ${hostStyles}
  }

  ${resetStyles}
  ${typographyStyles}
  ${utilityStyles}
`;

export default baseStyles;
