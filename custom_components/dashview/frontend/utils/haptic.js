/**
 * Haptic Feedback Utilities
 * Provides vibration feedback on supported devices
 *
 * Patterns (Story 10.4):
 * - tap/light: 10ms - Light tap for toggles, buttons
 * - medium: 20ms - Standard feedback
 * - heavy: 30ms - Strong feedback
 * - selection: [5,5,5] - Triple micro-pulse for selections
 * - success: [10,50,10] - Double tap for successful actions
 * - warning: [30,30,30] - Triple pulse for errors/warnings
 * - longPress: 25ms - Medium pulse when threshold reached
 */

/** @type {boolean} */
let _enabled = true;

/**
 * Check if haptic feedback is supported on this device
 * @returns {boolean}
 */
export function isHapticSupported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

/**
 * Enable or disable haptic feedback globally
 * @param {boolean} enabled - Whether to enable haptic feedback
 */
export function setHapticEnabled(enabled) {
  _enabled = enabled;
}

/**
 * Internal vibrate wrapper with error handling
 * @param {number|number[]} pattern - Vibration pattern
 * @returns {boolean} - Whether vibration was triggered
 * @private
 */
function _vibrate(pattern) {
  if (!_enabled) return false;
  if (!isHapticSupported()) return false;

  try {
    navigator.vibrate(pattern);
    return true;
  } catch (e) {
    // iOS Safari may throw if not in user gesture context
    // Desktop browsers may throw if permission denied
    console.debug('Haptic feedback unavailable:', e.message);
    return false;
  }
}

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback: 'light', 'medium', 'heavy', 'selection'
 */
export function triggerHaptic(type = 'light') {
  switch (type) {
    case 'light':
      _vibrate(10);
      break;
    case 'medium':
      _vibrate(20);
      break;
    case 'heavy':
      _vibrate(30);
      break;
    case 'selection':
      _vibrate([5, 5, 5]);
      break;
    default:
      _vibrate(10);
  }
}

/**
 * Trigger success haptic feedback
 * Double tap pattern for successful actions (scene activated, setting saved)
 */
export function hapticSuccess() {
  _vibrate([10, 50, 10]);
}

/**
 * Trigger warning/error haptic feedback
 * Triple pulse pattern to convey "attention needed"
 */
export function hapticWarning() {
  _vibrate([30, 30, 30]);
}

/**
 * Trigger long-press recognition haptic feedback
 * Medium pulse when long-press threshold is reached
 */
export function hapticLongPress() {
  _vibrate(25);
}
