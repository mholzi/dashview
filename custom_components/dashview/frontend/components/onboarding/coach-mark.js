/**
 * Coach Mark Component
 * One-time tutorial overlay explaining gestures for first-run education
 *
 * Usage:
 *   import { renderCoachMark, shouldShowCoachMark, dismissCoachMark } from './components/onboarding/index.js';
 *
 *   if (shouldShowCoachMark()) {
 *     return html`${renderCoachMark(html, () => { dismissCoachMark(); this.requestUpdate(); })}`;
 *   }
 */

const ONBOARDED_KEY = 'dashview_onboarded';

/**
 * Check if coach mark should be shown
 * @returns {boolean} True if user has not been onboarded yet
 */
export function shouldShowCoachMark() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) !== 'true';
  } catch {
    // localStorage may be unavailable (incognito, etc.)
    return false;
  }
}

/**
 * Dismiss the coach mark and set localStorage flag
 */
export function dismissCoachMark() {
  try {
    localStorage.setItem(ONBOARDED_KEY, 'true');
  } catch {
    // localStorage may be unavailable
    console.warn('DashView: Could not save onboarding state to localStorage');
  }
}

/**
 * Render the coach mark overlay with gesture hints
 * @param {Object} panel - The panel instance (unused but follows project convention)
 * @param {Function} html - lit-html template function
 * @param {Function} onDismiss - Callback when coach mark is dismissed
 * @returns {TemplateResult} Coach mark overlay HTML
 */
export function renderCoachMark(panel, html, onDismiss) {
  const handleDismiss = (e) => {
    // Add fade-out animation before dismissing
    const overlay = e.target.closest('.coach-mark-overlay') || e.currentTarget.closest('.coach-mark-overlay');
    if (overlay) {
      overlay.classList.add('dismissing');
      setTimeout(() => {
        dismissCoachMark();
        if (onDismiss) {
          onDismiss();
        }
      }, 200);
    } else {
      dismissCoachMark();
      if (onDismiss) {
        onDismiss();
      }
    }
  };

  const handleBackdropClick = (e) => {
    // Only dismiss if clicking the backdrop itself, not the card
    if (e.target.classList.contains('coach-mark-overlay')) {
      handleDismiss(e);
    }
  };

  return html`
    <div class="coach-mark-overlay" @click=${handleBackdropClick}>
      <div class="coach-mark-card">
        <div class="coach-hint">
          <div class="gesture-icon swipe-animation">
            <!-- Finger swipe icon (mdi:gesture-swipe-horizontal) -->
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M10.76,8.69A0.76,0.76 0 0,0 10,9.45V20.9C10,21.6 10.88,21.91 11.32,21.36L13.5,18.62L17.17,19.69C17.67,19.83 18.17,19.56 18.32,19.06L19.77,14.58C19.91,14.08 19.64,13.58 19.14,13.44L15.47,12.36L15.47,9.45C15.47,8.96 15.07,8.56 14.58,8.56C14.29,8.56 14,8.69 13.82,8.93L10.76,8.69M2.5,6L6.66,4.04L9.77,8.03L10.55,8.03L14.33,11L14.33,12L9.5,11L9.5,18L7.5,18L7.5,11L4.5,11L2.5,6Z"/>
            </svg>
            <div class="swipe-finger"></div>
          </div>
          <span class="coach-hint-text">Swipe to navigate rooms</span>
        </div>

        <div class="coach-hint">
          <div class="gesture-icon press-animation">
            <!-- Finger tap hold icon (mdi:gesture-tap-hold) -->
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M10.76,8.69A0.76,0.76 0 0,0 10,9.45V20.9C10,21.6 10.88,21.91 11.32,21.36L13.5,18.62L17.17,19.69C17.67,19.83 18.17,19.56 18.32,19.06L19.77,14.58C19.91,14.08 19.64,13.58 19.14,13.44L15.47,12.36L15.47,9.45C15.47,8.96 15.07,8.56 14.58,8.56C14.29,8.56 14,8.69 13.82,8.93L10.76,8.69M9,3A3,3 0 0,1 12,6A3,3 0 0,1 9,9A3,3 0 0,1 6,6A3,3 0 0,1 9,3Z"/>
            </svg>
            <div class="press-indicator"></div>
          </div>
          <span class="coach-hint-text">Long-press for room details</span>
        </div>

        <button class="coach-dismiss" @click=${handleDismiss} aria-label="Dismiss tutorial">Got it</button>
      </div>
    </div>
  `;
}
