// One interface, two backends.
//
//   http  - the Flask server, exactly as this app has always worked. The board
//           is posted to /api/request_move and the server runs the turn logic
//           with the native engine.
//   wasm  - no server at all: the rules run in GameLoop.js on this thread and
//           the search runs in a worker.
//
// The default is deliberately asymmetric: `npm start` uses **http**, and only a
// production build uses wasm. Development stays pointed at the native engine,
// which is the one the Elo testing and data generation use, so the thing being
// developed against is the real engine. The deployed static site is the only
// place wasm is the default.
//
// The consequence to be aware of is that the wasm path is not what you see by
// default and can rot unnoticed. What catches that is src/wasm/verify_wasm.mjs
// in CI, not local use. To drive it by hand:
//
//     REACT_APP_ENGINE=wasm npm start
//
// (after copying a build into public/engine/ - see src/wasm/copy_to_gui.sh).

import { startingBoard } from './BoardOps.js';
import { newGame, requestMove } from './GameLoop.js';

const MODE = process.env.REACT_APP_ENGINE
          || (process.env.NODE_ENV === 'production' ? 'wasm' : 'http');

const PUBLIC_URL = process.env.PUBLIC_URL || '';

// ---------------------------------------------------------------------------
// http: the Flask server
// ---------------------------------------------------------------------------
class HttpEngine {
  constructor() {
    this.mode = 'http';
    this.onProgress = null;
    this.onStatus = null;
  }

  async getBoard() {
    const res = await fetch('/api/get_board');
    return res.json();
  }

  async requestMove(req) {
    const res = await fetch('/api/request_move', {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }

  terminate() {}
}

// ---------------------------------------------------------------------------
// wasm: the engine in a worker
// ---------------------------------------------------------------------------
class WasmEngine {
  constructor() {
    this.mode = 'wasm';
    this.onProgress = null;
    this.onStatus = null;
    this.simd = null;

    this.worker = new Worker(PUBLIC_URL + '/engine-worker.js');
    this.nextId = 1;
    this.pending = new Map();

    this.ready = new Promise((resolve, reject) => {
      this._resolveReady = resolve;
      this._rejectReady = reject;
    });

    this.worker.onmessage = (e) => this._onMessage(e.data);
    this.worker.onerror = (e) => this._rejectReady(new Error(e.message || 'worker failed'));
    this.worker.postMessage({ type: 'boot', publicUrl: PUBLIC_URL });
  }

  _onMessage(m) {
    switch (m.type) {
      case 'ready':
        this.simd = m.simd;
        this._resolveReady(m);
        if (this.onStatus) this.onStatus(m);
        break;
      case 'progress':
        // unsolicited, straight out of the engine's deepening loop
        if (this.onProgress) this.onProgress(m);
        break;
      case 'result': {
        const p = this.pending.get(m.id);
        if (p) { this.pending.delete(m.id); p.resolve(m); }
        break;
      }
      case 'error': {
        const p = this.pending.get(m.id);
        if (p) { this.pending.delete(m.id); p.reject(new Error(m.message)); }
        else this._rejectReady(new Error(m.message));
        break;
      }
      case 'dbLoaded':
      case 'dbSkipped':
        if (this.onStatus) this.onStatus(m);
        break;
      default:
        break;
    }
  }

  /** One search. The shape GameLoop.js expects. */
  search(args) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type: 'search', id, ...args });
    });
  }

  async getBoard() {
    await this.ready;
    return newGame(startingBoard());
  }

  async requestMove(req) {
    await this.ready;
    return requestMove(req, this);
  }

  terminate() {
    this.worker.terminate();
    for (const p of this.pending.values()) p.reject(new Error('engine terminated'));
    this.pending.clear();
  }
}

export function createEngine() {
  return MODE === 'wasm' ? new WasmEngine() : new HttpEngine();
}

export const ENGINE_MODE = MODE;
