import { defineConfig } from 'vitest/config';

export default defineConfig({
  // three.js alone is ~630 kB raw (the preload-helper chunk): the budget that matters is the gzipped JS `npm run perf`
  // checks (< 350 KB), so Vite's 500 kB raw notice is raised past it rather than read as a fault.
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  // Node's own web storage (on from Node 25) warns on every read without a file: off, as in a browser that blocks site
  // data (the flag exists on every Node vitest 5 runs on); the app's storage is guarded, and the booking tests bring
  // their own.
  test: { include: ['src/**/*.test.ts'], execArgv: ['--no-experimental-webstorage'] },
});
