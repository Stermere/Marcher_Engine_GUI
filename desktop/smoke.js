// Load the desktop app headlessly and prove the engine actually starts.
//
// This is the first place the whole stack runs in a real Chromium: the app://
// protocol, the web worker, the WebAssembly module and the tablebase fetches.
// Node harnesses cannot cover any of that - they call the module directly and
// never construct a Worker - so without this the desktop build is only ever
// verified by someone looking at a window.
//
// Waiting for 64 board cells is the signal that matters. The board is rendered
// from the response to getBoard(), and in wasm mode that only resolves after
// the worker has booted, the module has instantiated and the engine has
// answered. Cells on screen means the whole chain worked.
//
// Run:  npx electron smoke.js

const { app, BrowserWindow, protocol } = require('electron');
const { registerScheme, serve } = require('./serve');

registerScheme();

const TIMEOUT_MS = 30000;

app.whenReady().then(async () => {
  // A build made with REACT_APP_ENGINE=http looks exactly like a desktop build
  // until it quietly tries to reach a Flask server that is not there, and the
  // only symptom is a board that never appears. Everything the page loads comes
  // through here, so noticing a request for /api/ costs one line and turns a
  // confusing timeout into the actual answer.
  let sawApiRequest = false;
  protocol.handle('app', (request) => {
    if (new URL(request.url).pathname.startsWith('/api/')) sawApiRequest = true;
    return serve(request);
  });

  const win = new BrowserWindow({
    show: false,
    width: 820,
    height: 1000,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  const failures = [];
  const check = (name, ok, detail) => {
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
    if (!ok) failures.push(name);
  };

  // surface renderer errors instead of letting them hide behind a timeout
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2) console.log(`  [renderer] ${message}`);
  });

  try {
    await win.loadURL('app://local/index.html');

    const result = await win.webContents.executeJavaScript(`(async () => {
      const out = {};

      // the wasm has to arrive as application/wasm or instantiateStreaming
      // refuses it
      const w = await fetch('./engine/marcher.wasm');
      out.wasmStatus = w.status;
      out.wasmType = w.headers.get('content-type');
      out.wasmBytes = (await w.arrayBuffer()).byteLength;

      // the tablebase index, and one slice through the same path the worker uses
      const m = await fetch('./engine/db/manifest.json');
      out.manifestStatus = m.status;
      const manifest = m.ok ? await m.json() : [];
      out.slices = manifest.length;
      if (manifest.length) {
        const s = await fetch('./engine/db/' + manifest[0].name);
        out.sliceOk = s.ok && (await s.arrayBuffer()).byteLength === manifest[0].bytes;
      }

      // a missing file must 404 rather than resolving to something
      out.missing404 = (await fetch('./engine/nope.wasm')).status;

      // the real signal: wait for the board the engine produced
      const deadline = Date.now() + ${TIMEOUT_MS - 5000};
      while (Date.now() < deadline) {
        if (document.querySelectorAll('.cell').length === 64) { out.cells = 64; break; }
        await new Promise((r) => setTimeout(r, 100));
      }
      out.cells = out.cells || document.querySelectorAll('.cell').length;
      return out;
    })()`);

    console.log();
    check('app:// serves the wasm', result.wasmStatus === 200, `${result.wasmBytes} bytes`);
    check('wasm content-type', result.wasmType === 'application/wasm', result.wasmType);
    check('tablebase manifest', result.manifestStatus === 200, `${result.slices} slices`);
    check('tablebase slice reads at full length', result.sliceOk !== false);
    check('missing file 404s', result.missing404 === 404, `got ${result.missing404}`);
    check('engine booted and rendered the board', result.cells === 64,
          `${result.cells} cells`);

    if (result.cells !== 64 && sawApiRequest) {
      console.log('\n  cause: this build asked for /api/ - it was made with '
                + 'REACT_APP_ENGINE=http and expects the Flask server.'
                + '\n  Rebuild the desktop one with:  cd ../client && npm run build');
    }
  } catch (e) {
    console.log(`\n  FAIL  ${e.message}`);
    failures.push('exception');
  }

  console.log();
  if (failures.length) {
    console.log(`FAIL: ${failures.length} check(s) failed: ${failures.join(', ')}`);
    app.exit(1);
  } else {
    console.log('PASS: the desktop app starts and the engine runs.');
    app.exit(0);
  }
});

setTimeout(() => {
  console.log('FAIL: timed out');
  app.exit(1);
}, TIMEOUT_MS).unref();
