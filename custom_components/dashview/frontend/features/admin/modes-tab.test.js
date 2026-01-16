/**
 * Modes Tab Tests
 * Tests for modes configuration UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modesTabStyles } from './modes-tab.js';

// Mock the shared module
vi.mock('./shared.js', () => ({
  t: (key, fallback) => fallback,
  createSectionHelpers: () => ({
    toggleSection: vi.fn(),
    isExpanded: () => true
  })
}));

// Mock stores
vi.mock('../../stores/index.js', () => ({
  getModeStore: vi.fn(() => ({
    modes: {
      default: {
        id: 'default',
        name: 'Default',
        deletable: false,
        settings: {}
      }
    },
    modesList: [{
      id: 'default',
      name: 'Default',
      deletable: false,
      settings: {}
    }],
    activeMode: 'default',
    load: vi.fn(),
    getMode: vi.fn((id) => ({
      id,
      name: 'Test Mode',
      deletable: true,
      settings: {}
    })),
    createMode: vi.fn(() => 'mode_123'),
    updateMode: vi.fn(),
    duplicateMode: vi.fn(() => 'mode_456'),
    deleteMode: vi.fn(() => true),
    activateMode: vi.fn(() => true),
    subscribe: vi.fn(() => () => {})
  }))
}));

describe('Modes Tab', () => {
  describe('modesTabStyles', () => {
    it('should export styles string', () => {
      expect(modesTabStyles).toBeDefined();
      expect(typeof modesTabStyles).toBe('string');
    });

    it('should contain modes tab container class', () => {
      expect(modesTabStyles).toContain('.dv-modes-tab');
    });

    it('should contain mode item class', () => {
      expect(modesTabStyles).toContain('.dv-mode-item');
    });

    it('should contain active mode styling', () => {
      expect(modesTabStyles).toContain('.dv-mode-item.active');
    });

    it('should contain mode editor dialog styles', () => {
      expect(modesTabStyles).toContain('.dv-mode-editor');
    });

    it('should contain mode editor overlay', () => {
      expect(modesTabStyles).toContain('.dv-mode-editor-overlay');
    });

    it('should contain create button styles', () => {
      expect(modesTabStyles).toContain('.dv-modes-create-btn');
    });

    it('should contain mode actions styles', () => {
      expect(modesTabStyles).toContain('.dv-mode-actions');
    });

    it('should contain mode badge styles', () => {
      expect(modesTabStyles).toContain('.dv-mode-badge');
    });

    it('should contain delete confirmation styles', () => {
      expect(modesTabStyles).toContain('.dv-mode-delete-confirm');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(modesTabStyles).toContain('--dv-');
    });

    it('should use HA CSS custom properties', () => {
      expect(modesTabStyles).toContain('--primary-color');
      expect(modesTabStyles).toContain('--card-background-color');
    });
  });
});
