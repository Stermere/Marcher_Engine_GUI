// The `app://` protocol the window loads from.
//
// Electron's default is file://, and from file:// Chromium blocks web workers
// as cross origin and refuses to fetch the tablebase slices, so the engine
// would never boot. Registering a standard, secure scheme makes the page behave
// like an ordinary web page while still reading everything off local disk.
//
// Shared by main.js and smoke.js so the thing under test is the thing that ships.

const { app, protocol } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

// packaged: main.js and the site sit together at the app root
// development: the site is the CRA build next door
const ROOT = app.isPackaged
  ? path.join(__dirname, 'client-build')
  : path.join(__dirname, '..', 'client', 'build');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  // without this the browser refuses instantiateStreaming and emscripten falls
  // back to a slower path
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// standard + secure so it counts as a real origin (workers, fetch, wasm);
// stream so the larger tablebase slices are not buffered whole
function registerScheme() {
  protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  }]);
}

async function serve(request) {
  const rel = decodeURIComponent(new URL(request.url).pathname);

  // resolve inside ROOT and refuse anything that climbs out of it
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) {
    return new Response('forbidden', { status: 403 });
  }

  try {
    // read through fs rather than fetching a file:// URL, because when packaged
    // this lives inside app.asar and only the patched fs can see in there
    const body = await fs.readFile(filePath);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': TYPES[path.extname(filePath).toLowerCase()]
                        || 'application/octet-stream',
      },
    });
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') {
      return new Response('not found: ' + rel, { status: 404 });
    }
    return new Response(String(e), { status: 500 });
  }
}

module.exports = { ROOT, registerScheme, serve };
