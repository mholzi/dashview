/**
 * Error Messages Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapPhotoError, PHOTO_ERRORS } from './error-messages.js';

describe('error-messages', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('PHOTO_ERRORS', () => {
    it('contains all required error types', () => {
      expect(PHOTO_ERRORS.VALIDATION).toBeDefined();
      expect(PHOTO_ERRORS.NETWORK).toBeDefined();
      expect(PHOTO_ERRORS.PERMISSION).toBeDefined();
      expect(PHOTO_ERRORS.TIMEOUT).toBeDefined();
      expect(PHOTO_ERRORS.SERVER).toBeDefined();
      expect(PHOTO_ERRORS.UNKNOWN).toBeDefined();
    });

    it('has user-friendly validation message', () => {
      expect(PHOTO_ERRORS.VALIDATION).toContain('JPG');
      expect(PHOTO_ERRORS.VALIDATION).toContain('PNG');
      expect(PHOTO_ERRORS.VALIDATION).toContain('5MB');
    });

    it('has user-friendly network message', () => {
      expect(PHOTO_ERRORS.NETWORK).toContain('connection');
    });

    it('has user-friendly permission message', () => {
      expect(PHOTO_ERRORS.PERMISSION).toContain('permission');
    });

    it('has user-friendly timeout message', () => {
      expect(PHOTO_ERRORS.TIMEOUT).toContain('timed out');
    });

    it('has user-friendly server message', () => {
      expect(PHOTO_ERRORS.SERVER).toContain('Server error');
    });
  });

  describe('mapPhotoError', () => {
    it('logs error to console for debugging', () => {
      const error = new Error('test error');
      mapPhotoError(error);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Photo Error]', error);
    });

    it('returns UNKNOWN for null error', () => {
      expect(mapPhotoError(null)).toBe(PHOTO_ERRORS.UNKNOWN);
    });

    it('returns UNKNOWN for undefined error', () => {
      expect(mapPhotoError(undefined)).toBe(PHOTO_ERRORS.UNKNOWN);
    });

    it('returns TIMEOUT for timeout errors', () => {
      expect(mapPhotoError({ message: 'Request timeout' })).toBe(PHOTO_ERRORS.TIMEOUT);
      expect(mapPhotoError({ message: 'Operation timed out' })).toBe(PHOTO_ERRORS.TIMEOUT);
      expect(mapPhotoError({ message: 'TIMEOUT error occurred' })).toBe(PHOTO_ERRORS.TIMEOUT);
    });

    it('returns NETWORK for network errors', () => {
      expect(mapPhotoError({ message: 'Network error' })).toBe(PHOTO_ERRORS.NETWORK);
      expect(mapPhotoError({ message: 'Failed to fetch' })).toBe(PHOTO_ERRORS.NETWORK);
      expect(mapPhotoError({ name: 'TypeError' })).toBe(PHOTO_ERRORS.NETWORK);
    });

    it('returns PERMISSION for 403 status', () => {
      expect(mapPhotoError({ status: 403 })).toBe(PHOTO_ERRORS.PERMISSION);
      expect(mapPhotoError({ status: 403, message: 'Forbidden' })).toBe(PHOTO_ERRORS.PERMISSION);
    });

    it('returns SERVER for 5xx status codes', () => {
      expect(mapPhotoError({ status: 500 })).toBe(PHOTO_ERRORS.SERVER);
      expect(mapPhotoError({ status: 502 })).toBe(PHOTO_ERRORS.SERVER);
      expect(mapPhotoError({ status: 503 })).toBe(PHOTO_ERRORS.SERVER);
      expect(mapPhotoError({ status: 599 })).toBe(PHOTO_ERRORS.SERVER);
    });

    it('does not return SERVER for non-5xx status codes', () => {
      expect(mapPhotoError({ status: 400 })).not.toBe(PHOTO_ERRORS.SERVER);
      expect(mapPhotoError({ status: 404 })).not.toBe(PHOTO_ERRORS.SERVER);
      expect(mapPhotoError({ status: 600 })).not.toBe(PHOTO_ERRORS.SERVER);
    });

    it('returns VALIDATION for validation errors', () => {
      expect(mapPhotoError({ message: 'Invalid file type' })).toBe(PHOTO_ERRORS.VALIDATION);
      expect(mapPhotoError({ message: 'Validation failed' })).toBe(PHOTO_ERRORS.VALIDATION);
      expect(mapPhotoError({ message: 'File type not allowed' })).toBe(PHOTO_ERRORS.VALIDATION);
      expect(mapPhotoError({ message: 'File size too large' })).toBe(PHOTO_ERRORS.VALIDATION);
    });

    it('returns UNKNOWN for unrecognized errors', () => {
      expect(mapPhotoError({ message: 'Something went wrong' })).toBe(PHOTO_ERRORS.UNKNOWN);
      expect(mapPhotoError(new Error('Random error'))).toBe(PHOTO_ERRORS.UNKNOWN);
      expect(mapPhotoError({ status: 400 })).toBe(PHOTO_ERRORS.UNKNOWN);
    });

    it('handles errors without message property', () => {
      expect(mapPhotoError({})).toBe(PHOTO_ERRORS.UNKNOWN);
      expect(mapPhotoError({ status: 500 })).toBe(PHOTO_ERRORS.SERVER);
    });

    it('is case-insensitive for message matching', () => {
      expect(mapPhotoError({ message: 'TIMEOUT' })).toBe(PHOTO_ERRORS.TIMEOUT);
      expect(mapPhotoError({ message: 'Timeout' })).toBe(PHOTO_ERRORS.TIMEOUT);
      expect(mapPhotoError({ message: 'Network Error' })).toBe(PHOTO_ERRORS.NETWORK);
    });

    it('prioritizes timeout over other error types', () => {
      // Timeout should be detected first even if other conditions match
      expect(mapPhotoError({ message: 'timeout', status: 500 })).toBe(PHOTO_ERRORS.TIMEOUT);
    });
  });
});
