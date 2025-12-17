import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const outputDir = 'custom_components/dashview/frontend/dist';

/**
 * Custom plugin to generate asset-manifest.json with content hash mapping
 */
function assetManifest() {
  return {
    name: 'asset-manifest',
    generateBundle(options, bundle) {
      const manifest = {};

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          // Use the chunk name (without hash) as the key
          // Map to the actual hashed output filename
          const originalName = `${chunk.name}.js`;
          manifest[originalName] = fileName;
        }
      }

      // Emit the manifest as an asset
      this.emitFile({
        type: 'asset',
        fileName: 'asset-manifest.json',
        source: JSON.stringify(manifest, null, 2)
      });
    }
  };
}

export default {
  input: 'custom_components/dashview/frontend/dashview-panel.js',

  output: {
    dir: outputDir,
    format: 'es',
    // Content hash in filename for cache busting
    entryFileNames: '[name].[hash].js',
    chunkFileNames: '[name].[hash].js',
    // Inline dynamic imports into single bundle for simpler cache invalidation
    inlineDynamicImports: true
  },

  plugins: [
    // Resolve node_modules imports
    nodeResolve({
      browser: true
    }),

    // Convert CommonJS modules to ES modules
    commonjs(),

    // Minify for production
    terser({
      format: {
        comments: false
      }
    }),

    // Generate asset manifest
    assetManifest()
  ],

  // External dependencies provided by Home Assistant
  // LitElement and lit are loaded from HA's global scope, not bundled
  external: [
    /^lit/,
    /^@lit/
  ],

  // Suppress circular dependency warnings for internal modules
  onwarn(warning, warn) {
    // Ignore circular dependency warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
};
