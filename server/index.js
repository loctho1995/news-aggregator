// ESM-compatible shim for legacy `node server/index.js`
// Works when package.json has `"type": "module"`
const tryImports = async () => {
  const candidates = [
    '../src/server.js',
    '../src/index.js',
    '../src/server.mjs',
    '../src/index.mjs',
    '../src/app.js'
  ];
  for (const rel of candidates) {
    try {
      await import(new URL(rel, import.meta.url).href);
      return;
    } catch (e) {
      // try next
    }
  }
  throw new Error('No ESM-loadable entry found under src/');
};

try {
  await tryImports();
} catch (err) {
  console.error('[compat] Failed to import src entry:', err);
  process.exit(1);
}
