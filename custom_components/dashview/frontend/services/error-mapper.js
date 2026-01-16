/**
 * Error Mapper Service
 * Translates technical errors to user-friendly messages using i18n
 *
 * Usage:
 *   import { mapError, ERROR_TYPES } from './error-mapper.js';
 *   const userMessage = mapError(error);
 */

import { t } from '../utils/i18n.js';

/**
 * Error type constants
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  PERMISSION: 'PERMISSION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  RATE_LIMIT: 'RATE_LIMIT',
  PHOTO_TOO_LARGE: 'PHOTO_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Error map with i18n keys and fallback messages
 * Each error type has:
 * - key: i18n translation key
 * - fallback: English fallback if translation not available
 * - guidance: Additional help text
 */
const ERROR_MAP = {
  [ERROR_TYPES.NETWORK]: {
    key: 'errors.network',
    fallback: 'Network error. Please check your connection.',
    guidance: 'errors.network_guidance',
    guidanceFallback: 'Check your internet connection and try again.',
  },
  [ERROR_TYPES.TIMEOUT]: {
    key: 'errors.timeout',
    fallback: 'Request timed out. Please try again.',
    guidance: 'errors.timeout_guidance',
    guidanceFallback: 'The server took too long to respond. Try again in a moment.',
  },
  [ERROR_TYPES.PERMISSION]: {
    key: 'errors.permission',
    fallback: 'You do not have permission for this action.',
    guidance: 'errors.permission_guidance',
    guidanceFallback: 'Contact your administrator if you need access.',
  },
  [ERROR_TYPES.VALIDATION]: {
    key: 'errors.validation',
    fallback: 'Invalid input. Please check your data.',
    guidance: 'errors.validation_guidance',
    guidanceFallback: 'Make sure all fields are filled in correctly.',
  },
  [ERROR_TYPES.NOT_FOUND]: {
    key: 'errors.not_found',
    fallback: 'The requested resource was not found.',
    guidance: 'errors.not_found_guidance',
    guidanceFallback: 'The item may have been deleted or moved.',
  },
  [ERROR_TYPES.SERVER]: {
    key: 'errors.server',
    fallback: 'Server error. Please try again later.',
    guidance: 'errors.server_guidance',
    guidanceFallback: 'This is a temporary issue. Try again in a few minutes.',
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    key: 'errors.rate_limit',
    fallback: 'Too many requests. Please wait a moment.',
    guidance: 'errors.rate_limit_guidance',
    guidanceFallback: 'Wait a few seconds before trying again.',
  },
  [ERROR_TYPES.PHOTO_TOO_LARGE]: {
    key: 'errors.photo_too_large',
    fallback: 'Photo too large. Maximum size is 5MB.',
    guidance: 'errors.photo_too_large_guidance',
    guidanceFallback: 'Resize your image or choose a smaller file.',
  },
  [ERROR_TYPES.INVALID_FILE_TYPE]: {
    key: 'errors.invalid_file_type',
    fallback: 'Invalid file type. Please use JPG, PNG, GIF, or WebP.',
    guidance: 'errors.invalid_file_type_guidance',
    guidanceFallback: 'Convert your image to a supported format.',
  },
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: {
    key: 'errors.service_unavailable',
    fallback: 'Service temporarily unavailable.',
    guidance: 'errors.service_unavailable_guidance',
    guidanceFallback: 'Home Assistant may be restarting. Please wait.',
  },
  [ERROR_TYPES.UNKNOWN]: {
    key: 'errors.unknown',
    fallback: 'Something went wrong. Please try again.',
    guidance: 'errors.unknown_guidance',
    guidanceFallback: 'If the problem persists, try refreshing the page.',
  },
};

/**
 * Detect error type from error object
 * @param {Error|{message?: string, status?: number, name?: string, code?: string}} error
 * @returns {string} Error type from ERROR_TYPES
 */
export function detectErrorType(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const message = (error.message || '').toLowerCase();
  const name = error.name || '';
  const status = error.status || error.statusCode;
  const code = error.code || '';

  // Timeout errors
  if (name === 'AbortError' || name === 'TimeoutError' ||
      message.includes('timeout') || message.includes('timed out') ||
      code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') {
    return ERROR_TYPES.TIMEOUT;
  }

  // Network errors
  if (name === 'TypeError' && (message.includes('fetch') || message.includes('network')) ||
      message.includes('network') || message.includes('failed to fetch') ||
      message.includes('connection') || code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' || code === 'ENETUNREACH') {
    return ERROR_TYPES.NETWORK;
  }

  // HTTP status-based errors
  if (status) {
    if (status === 401 || status === 403) return ERROR_TYPES.PERMISSION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status === 429) return ERROR_TYPES.RATE_LIMIT;
    if (status === 503) return ERROR_TYPES.SERVICE_UNAVAILABLE;
    if (status >= 500) return ERROR_TYPES.SERVER;
    if (status === 400 || status === 422) return ERROR_TYPES.VALIDATION;
  }

  // Message-based detection
  if (message.includes('permission') || message.includes('forbidden') ||
      message.includes('unauthorized') || message.includes('not allowed')) {
    return ERROR_TYPES.PERMISSION;
  }

  if (message.includes('not found') || message.includes('does not exist')) {
    return ERROR_TYPES.NOT_FOUND;
  }

  if (message.includes('too large') || message.includes('file size') ||
      message.includes('5mb') || message.includes('size limit')) {
    return ERROR_TYPES.PHOTO_TOO_LARGE;
  }

  if (message.includes('file type') || message.includes('invalid format') ||
      message.includes('unsupported') || message.includes('must be')) {
    return ERROR_TYPES.INVALID_FILE_TYPE;
  }

  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('required') || message.includes('missing')) {
    return ERROR_TYPES.VALIDATION;
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Map an error to a user-friendly message using i18n
 * Logs full technical details to console for debugging
 *
 * @param {Error|{message?: string, status?: number, name?: string}} error - The error to map
 * @param {Object} [options] - Mapping options
 * @param {boolean} [options.includeGuidance=false] - Include actionable guidance
 * @param {string} [options.context] - Context for logging (e.g., 'photo-upload')
 * @returns {string} User-friendly error message
 */
export function mapError(error, options = {}) {
  const { includeGuidance = false, context = 'unknown' } = options;

  // Log full technical details for debugging
  console.error(`[Dashview Error] Context: ${context}`, {
    name: error?.name,
    message: error?.message,
    status: error?.status,
    code: error?.code,
    stack: error?.stack,
  });

  const errorType = detectErrorType(error);
  const errorConfig = ERROR_MAP[errorType] || ERROR_MAP[ERROR_TYPES.UNKNOWN];

  // Get translated message with fallback
  let message = t(errorConfig.key, errorConfig.fallback);

  // Add guidance if requested
  if (includeGuidance && errorConfig.guidance) {
    const guidance = t(errorConfig.guidance, errorConfig.guidanceFallback);
    message = `${message} ${guidance}`;
  }

  return message;
}

/**
 * Get error details for displaying in UI
 * Returns both the message and the error type
 *
 * @param {Error|{message?: string, status?: number, name?: string}} error
 * @returns {{ type: string, message: string, guidance: string }}
 */
export function getErrorDetails(error) {
  const errorType = detectErrorType(error);
  const errorConfig = ERROR_MAP[errorType] || ERROR_MAP[ERROR_TYPES.UNKNOWN];

  return {
    type: errorType,
    message: t(errorConfig.key, errorConfig.fallback),
    guidance: t(errorConfig.guidance, errorConfig.guidanceFallback),
  };
}

/**
 * Check if an error is recoverable (user can retry)
 * @param {Error} error
 * @returns {boolean}
 */
export function isRecoverableError(error) {
  const errorType = detectErrorType(error);
  const recoverableTypes = [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SERVER,
    ERROR_TYPES.RATE_LIMIT,
    ERROR_TYPES.SERVICE_UNAVAILABLE,
  ];
  return recoverableTypes.includes(errorType);
}

export default {
  ERROR_TYPES,
  detectErrorType,
  mapError,
  getErrorDetails,
  isRecoverableError,
};
