/**
 * Error Messages Utility
 * Centralized error message mapping for user-friendly error display
 *
 * Usage:
 *   import { mapPhotoError, PHOTO_ERRORS } from './error-messages.js';
 *   const userMessage = mapPhotoError(error);
 */

/**
 * Photo-related error messages
 * @type {Object<string, string>}
 */
export const PHOTO_ERRORS = {
  VALIDATION: 'Invalid file. Please use JPG, PNG, GIF, or WebP (max 5MB)',
  NETWORK: 'Network error. Please check your connection.',
  PERMISSION: 'You do not have permission to perform this action.',
  TIMEOUT: 'Operation timed out. Please try again.',
  SERVER: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred.'
};

/**
 * Maps technical errors to user-friendly messages for photo operations.
 * Logs full technical details to console for debugging.
 *
 * @param {Error|{message?: string, status?: number, name?: string}} error - The error to map
 * @returns {string} User-friendly error message
 */
export function mapPhotoError(error) {
  // Log full technical details for debugging
  console.warn('[Photo Error]', error);

  if (!error) {
    return PHOTO_ERRORS.UNKNOWN;
  }

  const message = error.message?.toLowerCase() || '';
  const status = error.status;

  // Check for timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return PHOTO_ERRORS.TIMEOUT;
  }

  // Check for network errors
  if (message.includes('network') || message.includes('fetch') || error.name === 'TypeError') {
    return PHOTO_ERRORS.NETWORK;
  }

  // Check for permission errors (403 status)
  if (status === 403) {
    return PHOTO_ERRORS.PERMISSION;
  }

  // Check for server errors (5xx status)
  if (status >= 500 && status < 600) {
    return PHOTO_ERRORS.SERVER;
  }

  // Check for validation errors
  if (message.includes('invalid file') || message.includes('validation') ||
      message.includes('file type') || message.includes('file size') ||
      message.includes('too large')) {
    return PHOTO_ERRORS.VALIDATION;
  }

  return PHOTO_ERRORS.UNKNOWN;
}
