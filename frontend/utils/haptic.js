/**
 * Haptic Feedback Utilities
 * Provides vibration feedback on supported devices
 */

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback: 'light', 'medium', 'heavy', 'selection'
 */
export function triggerHaptic(type = 'light') {
  if (!navigator.vibrate) return;

  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'heavy':
      navigator.vibrate(30);
      break;
    case 'selection':
      navigator.vibrate([5, 5, 5]);
      break;
    default:
      navigator.vibrate(10);
  }
}
