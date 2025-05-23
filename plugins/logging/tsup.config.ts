import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/response-hook.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
});
