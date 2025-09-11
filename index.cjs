// CommonJS root entry that defers to ESM/CJS server
(async () => {
  const candidates = [
    './src/server.js',
    './src/index.js',
    './src/server.mjs',
    './src/index.mjs',
    './src/app.js'
  ];
  for (const rel of candidates) {
    try {
      await import(new URL(rel, import.meta.url).href);
      return;
    } catch (_) {}
  }
  console.error('[compat] Could not locate src/* entry to load.');
  process.exit(1);
})();
