import { describe, it, expect, beforeEach, vi } from 'vitest';

// Tests for i18n utility
describe('i18n utility', () => {
  beforeEach(() => {
    // Reset i18n state for tests
    window.__dashviewI18n = {
      translations: {
        test: {
          greeting: 'Hello, {name}!',
          message: 'You have {count} messages',
          complex: '{user} sent {count} items to {recipient}',
          simple: 'Simple text without params'
        },
        some: {
          key: 'Some value'
        }
      },
      currentLang: 'en',
      initialized: true
    };
  });

  describe('t() function', () => {
    it('should return the key if translations not loaded', async () => {
      const { t } = await import('./i18n.js');
      expect(typeof t('some.key')).toBe('string');
    });
  });

  describe('getCurrentLang()', () => {
    it('should return default language', async () => {
      const { getCurrentLang } = await import('./i18n.js');
      expect(getCurrentLang()).toBe('en');
    });
  });

  describe('XSS Prevention (Story 7.1)', () => {
    describe('escapeHtml in parameter substitution', () => {
      it('should escape script tags in parameters (AC3)', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: '<script>alert("xss")</script>' });
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
        expect(result).toBe('Hello, &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;!');
      });

      it('should escape all 5 special HTML characters (AC2)', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: '<>&"\'' });
        expect(result).toBe('Hello, &lt;&gt;&amp;&quot;&#39;!');
      });

      it('should escape less-than character', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: 'a < b' });
        expect(result).toBe('Hello, a &lt; b!');
      });

      it('should escape greater-than character', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: 'a > b' });
        expect(result).toBe('Hello, a &gt; b!');
      });

      it('should escape ampersand character', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: 'A & B' });
        expect(result).toBe('Hello, A &amp; B!');
      });

      it('should escape double quote character', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: 'say "hello"' });
        expect(result).toBe('Hello, say &quot;hello&quot;!');
      });

      it('should escape single quote character', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: "it's" });
        expect(result).toBe('Hello, it&#39;s!');
      });

      it('should prevent attribute injection attacks (AC3)', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: '" onload="alert(\'xss\')"' });
        // The quotes should be escaped, preventing attribute breakout
        expect(result).not.toContain('" onload="'); // Raw quote should not appear
        expect(result).toContain('&quot;'); // Quotes should be escaped
        expect(result).toBe('Hello, &quot; onload=&quot;alert(&#39;xss&#39;)&quot;!');
      });

      it('should double-encode existing entities to prevent bypass (AC4)', async () => {
        const { t } = await import('./i18n.js');
        // Attacker tries to use pre-encoded entities to bypass
        const result = t('test.greeting', { name: '&lt;script&gt;' });
        expect(result).toBe('Hello, &amp;lt;script&amp;gt;!');
      });

      it('should handle multiple parameters with XSS attempts', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.complex', {
          user: '<script>',
          count: '5',
          recipient: '<img onerror=alert(1)>'
        });
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<img');
        expect(result).toContain('&lt;script&gt;');
        expect(result).toContain('&lt;img');
      });
    });

    describe('normal parameter substitution (AC5)', () => {
      it('should work with normal string parameters', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: 'World' });
        expect(result).toBe('Hello, World!');
      });

      it('should work with numeric parameters', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.message', { count: 42 });
        expect(result).toBe('You have 42 messages');
      });

      it('should work with zero', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.message', { count: 0 });
        expect(result).toBe('You have 0 messages');
      });

      it('should preserve unmatched placeholders', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', {});
        expect(result).toBe('Hello, {name}!');
      });

      it('should handle missing key gracefully', async () => {
        const { t } = await import('./i18n.js');
        const result = t('nonexistent.key');
        expect(result).toBe('nonexistent.key');
      });

      it('should return fallback for missing key', async () => {
        const { t } = await import('./i18n.js');
        const result = t('nonexistent.key', 'Fallback text');
        expect(result).toBe('Fallback text');
      });

      it('should work without parameters', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.simple');
        expect(result).toBe('Simple text without params');
      });
    });

    describe('edge cases', () => {
      it('should handle null parameter values', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: null });
        expect(result).toBe('Hello, null!');
      });

      it('should handle undefined parameter values', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: undefined });
        expect(result).toBe('Hello, undefined!');
      });

      it('should handle boolean parameter values', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: true });
        expect(result).toBe('Hello, true!');
      });

      it('should handle object parameter values by converting to string', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: { foo: 'bar' } });
        expect(result).toBe('Hello, [object Object]!');
      });

      it('should handle array parameter values', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: [1, 2, 3] });
        expect(result).toBe('Hello, 1,2,3!');
      });

      it('should handle Symbol parameter values gracefully', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: Symbol.for('test') });
        expect(result).toBe('Hello, test!');
      });

      it('should handle Symbol without description', async () => {
        const { t } = await import('./i18n.js');
        const result = t('test.greeting', { name: Symbol() });
        expect(result).toBe('Hello, Symbol!');
      });
    });
  });

  describe('escapeHtml export', () => {
    it('should be exported for reuse', async () => {
      const { escapeHtml } = await import('./i18n.js');
      expect(typeof escapeHtml).toBe('function');
    });

    it('should escape HTML characters directly', async () => {
      const { escapeHtml } = await import('./i18n.js');
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });
  });

  describe('Promise Rejection Prevention (Story 7.5)', () => {
    let originalFetch;

    beforeEach(async () => {
      // Reset i18n state before each test
      const { _resetI18nState } = await import('./i18n.js');
      _resetI18nState();
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    describe('fetchWithTimeout behavior (AC1)', () => {
      it('should use AbortController for timeout', async () => {
        // Mock fetch to verify AbortController signal is passed
        let receivedSignal = null;
        global.fetch = vi.fn((url, options) => {
          receivedSignal = options?.signal;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ test: 'value' })
          });
        });

        const { initI18n } = await import('./i18n.js');
        await initI18n('en');

        expect(global.fetch).toHaveBeenCalled();
        expect(receivedSignal).toBeInstanceOf(AbortSignal);
      });

      it('should handle timeout error gracefully (AC5)', async () => {
        // Mock fetch to simulate timeout via AbortError
        global.fetch = vi.fn(() => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        });

        const { initI18n, isI18nInitialized, t } = await import('./i18n.js');
        const result = await initI18n('en');

        // Should return false but not throw
        expect(result).toBe(false);
        // Should be initialized with fallback
        expect(isI18nInitialized()).toBe(true);
        // Should have fallback translations
        expect(t('common.ok')).toBe('OK');
      });
    });

    describe('retry limit (AC2)', () => {
      it('should retry up to 2 times per locale', async () => {
        let callCount = 0;
        global.fetch = vi.fn(() => {
          callCount++;
          return Promise.reject(new Error('Network error'));
        });

        const { initI18n } = await import('./i18n.js');
        await initI18n('en');

        // Should have attempted 2 times for 'en'
        expect(callCount).toBe(2);
      });

      it('should try English after non-English locale fails (AC2)', async () => {
        const calledUrls = [];
        global.fetch = vi.fn((url) => {
          calledUrls.push(url);
          return Promise.reject(new Error('Network error'));
        });

        const { initI18n } = await import('./i18n.js');
        await initI18n('de');

        // Should have tried de twice, then en twice
        expect(calledUrls.filter(u => u.includes('/de.json')).length).toBe(2);
        expect(calledUrls.filter(u => u.includes('/en.json')).length).toBe(2);
      });
    });

    describe('fallback translations (AC3, AC6)', () => {
      it('should use fallback translations when all fetches fail', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        const { initI18n, t, isI18nInitialized } = await import('./i18n.js');
        const result = await initI18n('en');

        expect(result).toBe(false);
        expect(isI18nInitialized()).toBe(true);
        // Should have fallback translations available
        expect(t('common.ok')).toBe('OK');
        expect(t('common.cancel')).toBe('Cancel');
        expect(t('error.loading')).toBe('Loading...');
        expect(t('status.on')).toBe('On');
      });

      it('should allow app to continue functioning with fallbacks (AC6)', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        const { initI18n, t, getCurrentLang } = await import('./i18n.js');
        await initI18n('de');

        // App should be functional
        expect(getCurrentLang()).toBe('en'); // Falls back to en
        expect(t('common.close')).toBe('Close');
        expect(t('nonexistent.key', 'Fallback')).toBe('Fallback');
      });
    });

    describe('error logging (AC4)', () => {
      it('should log timeout errors with context', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        global.fetch = vi.fn(() => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        });

        const { initI18n } = await import('./i18n.js');
        await initI18n('en');

        // Should have logged with timeout error type
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('timeout')
        );
      });

      it('should log network errors with context', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        global.fetch = vi.fn(() => Promise.reject(new Error('Network failure')));

        const { initI18n } = await import('./i18n.js');
        await initI18n('en');

        // Should have logged with network error type
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('network')
        );
      });

      it('should log attempt numbers', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        const { initI18n } = await import('./i18n.js');
        await initI18n('en');

        // Should have logged attempt numbers
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/attempt \d+\/\d+/)
        );
      });
    });

    describe('no unhandled rejections (AC5)', () => {
      it('should not throw on fetch failure', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        const { initI18n } = await import('./i18n.js');

        // Should not throw
        await expect(initI18n('en')).resolves.toBe(false);
      });

      it('should not throw on JSON parse error', async () => {
        global.fetch = vi.fn(() => Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        }));

        const { initI18n } = await import('./i18n.js');

        // Should not throw
        await expect(initI18n('en')).resolves.toBe(false);
      });

      it('should not throw on HTTP error', async () => {
        global.fetch = vi.fn(() => Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({})
        }));

        const { initI18n } = await import('./i18n.js');

        // Should not throw
        await expect(initI18n('en')).resolves.toBe(false);
      });
    });

    describe('normal operation (AC7)', () => {
      it('should work normally when fetch succeeds', async () => {
        global.fetch = vi.fn(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            greeting: 'Hello',
            nested: { key: 'Nested value' }
          })
        }));

        const { initI18n, t, isI18nInitialized, getCurrentLang } = await import('./i18n.js');
        const result = await initI18n('en');

        expect(result).toBe(true);
        expect(isI18nInitialized()).toBe(true);
        expect(getCurrentLang()).toBe('en');
        expect(t('greeting')).toBe('Hello');
        expect(t('nested.key')).toBe('Nested value');
      });

      it('should reset retry counter on success', async () => {
        let callCount = 0;
        global.fetch = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('First attempt fails'));
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ test: 'success' })
          });
        });

        const { initI18n, _resetI18nState } = await import('./i18n.js');

        // First init succeeds on second try
        const result1 = await initI18n('en');
        expect(result1).toBe(true);
        expect(callCount).toBe(2);

        // Reset and try again
        _resetI18nState();
        callCount = 0;

        global.fetch = vi.fn(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ test: 'success2' })
        }));

        // Should work fresh without carrying over retry state
        const result2 = await initI18n('en');
        expect(result2).toBe(true);
      });
    });
  });
});
