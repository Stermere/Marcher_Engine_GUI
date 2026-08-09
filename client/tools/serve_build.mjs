// Serve a production build the way GitHub Pages will.
//
// `npm start` runs the dev server, which serves from the site root and defaults
// to the Flask backend - useful, but not what gets deployed. This serves the
// real `npm run build` output, under the same /Marcher_Engine_GUI base path
// Pages uses, so the things that only break in production are actually
// exercised: the worker URL, the .wasm MIME type, and the tablebase fetches.
//
// No dependencies - Node's own http module is enough, and adding a static
// server to a project that does not otherwise need one is not worth it.
//
// Usage:
//   cd Marcher_Engine_GUI/client
//   bash ../../src/wasm/copy_to_gui.sh      # from the engine repo, once
//   CI=false PUBLIC_URL=/Marcher_Engine_GUI REACT_APP_ENGINE=wasm npm run build
//   node tools/serve_build.mjs
//
// then open the URL it prints.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'build');

function opt(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const PORT = parseInt(opt('--port', '5173'), 10);
// must match the PUBLIC_URL the build was made with, or the absolute asset
// paths baked into index.html will not resolve
const BASE = opt('--base', '/Marcher_Engine_GUI');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  // the one that matters: without this the browser refuses
  // instantiateStreaming and emscripten falls back to a slower path
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`no build at ${ROOT}\n\nBuild it first:\n`
    + `  CI=false PUBLIC_URL=${BASE} REACT_APP_ENGINE=wasm npm run build`);
  process.exit(1);
}

// a missing engine directory is the most likely reason for a blank page, so say
// so up front rather than letting it turn into a console error
const enginePath = path.join(ROOT, 'engine', 'marcher.wasm');
if (!fs.existsSync(enginePath)) {
  console.warn('WARNING: no engine/marcher.wasm in the build.\n'
    + '  Run  bash src/wasm/copy_to_gui.sh  in the engine repo, then rebuild.\n');
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (urlPath === BASE) {
    res.writeHead(302, { Location: BASE + '/' });
    res.end();
    return;
  }
  if (!urlPath.startsWith(BASE + '/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`nothing here. The site is served at ${BASE}/`);
    return;
  }
  urlPath = urlPath.slice(BASE.length);

  // resolve inside the build directory and refuse anything that escapes it
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  let target = filePath;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    const asIndex = path.join(filePath, 'index.html');
    // single page app: unknown paths fall back to index.html, the same thing
    // Pages does. A missing ASSET must still 404, or a bad engine URL would
    // silently return HTML and fail somewhere far away.
    if (fs.existsSync(asIndex)) target = asIndex;
    else if (path.extname(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found: ' + urlPath);
      return;
    } else target = path.join(ROOT, 'index.html');
  }

  const type = TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
  const body = fs.readFileSync(target);
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': body.length,
    // Pages does not set these, and neither should this - the engine is
    // single threaded and must work without cross origin isolation
    'Cache-Control': 'no-store',
  });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`serving ${path.relative(process.cwd(), ROOT)} at`);
  console.log(`\n    http://localhost:${PORT}${BASE}/\n`);
  console.log('Things worth checking, because only a browser can:');
  console.log('  * the board appears and you can play a move (the worker booted)');
  console.log('  * DevTools > Network shows marcher.wasm as application/wasm');
  console.log('  * db/*.bin slices stream in after load (wld first, then dtw)');
  console.log('  * the depth readout counts up during a "master" move');
  console.log('  * no "detached ArrayBuffer" errors in the console');
  console.log('\nCtrl-C to stop.');
});
