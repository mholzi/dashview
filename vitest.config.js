import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for DOM simulation
    environment: 'happy-dom',

    // Enable globals (describe, it, expect without imports)
    globals: true,

    // Test file patterns
    include: ['custom_components/dashview/frontend/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '**/*.test.js',
        '**/test/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/coverage/**'
      ]
    },

    // Reporter for CI-friendly output
    reporters: ['default'],

    // Faster test execution
    isolate: true,

    // Watch mode settings
    watchExclude: ['node_modules/**', 'coverage/**']
  }
});
