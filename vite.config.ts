import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the project under /<repo-name>/. Override with VITE_BASE if needed.
  base: process.env.VITE_BASE ?? '/IdleSF/',
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
