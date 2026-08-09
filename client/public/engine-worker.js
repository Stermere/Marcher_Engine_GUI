/* eslint-disable no-undef */
// The engine, off the main thread.
//
// A search blocks its thread completely - it is a C loop with no yield points -
// so it cannot run on the UI thread without freezing the page for the whole
// think time. This worker owns the wasm module and answers one search per
// message. The rules and the turn logic stay on the main thread in
// src/engine/GameLoop.js; only the slow part lives here.
//
// This file is in public/ and is a CLASSIC worker, both deliberately:
//
//   * public/ is copied verbatim by Create React App and never enters the
//     webpack module graph. CRA 5 is webpack 5, where syncWebAssembly is gone
//     and asyncWebAssembly cannot be enabled without ejecting, so the surest
//     way to ship a .wasm through CRA is to keep it out of the bundler.
//   * a classic worker uses importScripts(), which is exactly what emcc's
//     -sMODULARIZE without EXPORT_ES6 produces (`var createMarcher` at worker
//     global scope). A module worker would pull this back into webpack and
//     reintroduce the problem it exists to avoid.

let Module = null;
let base = '';
let dbState = { wld: 0, dtw: 0, total: 0, maxPieces: 0 };

// Does this browser have wasm SIMD? The module body below is
// `i32.const 0; i8x16.splat; drop` - it validates only where SIMD128 exists.
// Inlined rather than pulled from wasm-feature-detect because this file is not
// bundled and cannot import anything.
function simdSupported() {
  try {
    return WebAssembly.validate(new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
      0x03, 0x02, 0x01, 0x00,
      0x0a, 0x09, 0x01, 0x07, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x1a, 0x0b,
    ]));
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// endgame tablebase
// ---------------------------------------------------------------------------
// Slices arrive as bytes we fetch and hand to the engine. The engine allocates
// the buffer and we fill it, rather than the other way round, so only one copy
// of a slice is ever alive - with 18MB of tablebase that is the difference
// between a 1.6MB transient and an 18MB one.
//
// Nothing here has to finish before the engine is usable. A slice that has not
// arrived is a null pointer inside the engine, probe_endgame_db misses it, and
// the search proceeds normally. So the worker reports ready as soon as the
// module is up and keeps loading in the background.
async function loadSlice(entry) {
  const res = await fetch(base + 'db/' + entry.name);
  if (!res.ok) return false;                       // a missing slice is not an error
  const bytes = new Uint8Array(await res.arrayBuffer());

  const ptr = Module._endgame_db_alloc_slice(
    entry.m1, entry.k1, entry.m2, entry.k2, entry.dtw ? 1 : 0, bytes.length);
  // refused: wrong length (a truncated download) or out of memory. Either way
  // the engine is better off without it than indexing into a partial slice.
  if (!ptr) return false;

  // HEAPU8 is re-read here every single time, never cached: with
  // ALLOW_MEMORY_GROWTH any allocation can detach the previous view, and the
  // alloc call directly above is exactly such an allocation.
  Module.HEAPU8.set(bytes, ptr);
  return true;
}

async function loadTablebase() {
  let manifest;
  try {
    const res = await fetch(base + 'db/manifest.json');
    if (!res.ok) throw new Error(String(res.status));
    manifest = await res.json();
  } catch (e) {
    // no tablebase shipped: entirely playable, just weaker in endings
    postMessage({ type: 'dbSkipped', reason: String(e) });
    return;
  }

  // Win/loss/draw first, smallest first. WLD is a fifth of the bytes and is
  // what makes an ending *known*; the distance tables only make the win
  // shorter. Within that, the 2 and 3 piece slices are a few hundred KB total,
  // so the useful part of the database is in place almost immediately.
  const order = manifest.slice().sort((a, b) => {
    if (!!a.dtw !== !!b.dtw) return a.dtw ? 1 : -1;
    const ta = a.m1 + a.k1 + a.m2 + a.k2;
    const tb = b.m1 + b.k1 + b.m2 + b.k2;
    if (ta !== tb) return ta - tb;
    return a.bytes - b.bytes;
  });
  dbState.total = order.length;

  for (const entry of order) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await loadSlice(entry);
    if (ok) {
      if (entry.dtw) dbState.dtw++; else dbState.wld++;
      dbState.maxPieces = Module._wasm_db_max_pieces();
    }
  }
  postMessage({ type: 'dbLoaded', ...dbState });
}

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------
async function boot(publicUrl) {
  base = (publicUrl || '') + '/engine/';
  const simd = simdSupported();
  importScripts(base + (simd ? 'marcher.js' : 'marcher-scalar.js'));
  Module = await createMarcher({ locateFile: (p) => base + p });

  postMessage({ type: 'ready', simd: Module._wasm_nnue_simd() });

  // not awaited: the engine plays fine while this is still arriving
  loadTablebase().catch((e) => postMessage({ type: 'dbSkipped', reason: String(e) }));
}

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'boot') {
      await boot(m.publicUrl);
      return;
    }

    if (m.type === 'search') {
      Module._wasm_search(m.p1, m.p2, m.p1k, m.p2k,
                          m.player, m.time, m.depth, m.forced);

      // built AFTER the call, never cached across calls - see the note in
      // loadSlice about detached views
      const ptr = Module._wasm_result_ptr();
      const r = Module.HEAP32.subarray(ptr >> 2, (ptr >> 2) + Module._wasm_result_fields());

      postMessage({
        type: 'result',
        id: m.id,
        from: r[0],
        to: r[1],
        eval: r[2],
        depth: r[3],
        maxPly: r[4],
        nodes: (r[6] >>> 0) * 4294967296 + (r[5] >>> 0),
      });
      return;
    }
  } catch (err) {
    postMessage({ type: 'error', id: m && m.id, message: String(err && err.stack || err) });
  }
};
