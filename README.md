# Marcher Engine GUI

The web app for the [Marcher checkers engine](https://github.com/Stermere/Checkers-Engine).

**[Play here](https://stermere.github.io/Marcher_Engine_GUI/)**

It is a static site. The engine is compiled to WebAssembly and runs in a web
worker on your machine — there is no backend, and no move ever leaves the
browser. The engine plays at about -50 Elo against Kingsrow 1.19e at 0.5s
per move. (both engines configured to use a single thread and a 64 MB transposition table)

## Running it

```bash
git clone https://github.com/Stermere/Marcher_Engine_GUI
cd Marcher_Engine_GUI/client
npm install
npm start
```

`npm start` talks to the **Flask server**, not WebAssembly — development stays
pointed at the native engine, which is the one the engine repo tests and tunes
against. Start it in another terminal:

```bash
cd flask-server
python -m venv venv && venv\Scripts\activate
python -m pip install -r requirments.txt
python server.py
```

To run the browser engine instead, build it in the engine repo, copy it in with
`bash src/wasm/copy_to_gui.sh`, then:

```bash
REACT_APP_ENGINE=wasm npm start
```

## Desktop app

An Electron wrapper around the same static build, for offline play. The endgame
tablebase ships inside it, so there is nothing to download and the engine is at
full strength the moment the window opens.

```bash
cd client && npm run build      # relative paths, wasm engine
cd ../desktop && npm install
npm start                       # run it
npm run smoke                   # headless check that the engine actually boots
npm run dist                    # installer in desktop/dist (~82 MB)
```

`electron-builder` targets NSIS on Windows, DMG on macOS and AppImage on Linux;
each has to be built on its own platform. The `LICENSE` is bundled into the
packaged app, which is what MIT asks for when you ship a binary.

> If Electron exits with `Cannot read properties of undefined (reading 'isPackaged')`,
> your shell has `ELECTRON_RUN_AS_NODE=1` set, which makes Electron behave as
> plain Node. Run with `env -u ELECTRON_RUN_AS_NODE npm start`.

## Testing

```bash
python tools/gen_boardops_trace.py --games 1000
node tools/diff_boardops.mjs      # JS rules must match the Python rules exactly
node tools/play_wasm_game.mjs     # full games against the real engine
node tools/serve_build.mjs        # serve a production build the way Pages does
```

`src/engine/BoardOps.js` is a hand port of `flask-server/BoardOpperations.py`,
so `diff_boardops.mjs` replays thousands of real games through both and demands
the same answer at every node. Run it after touching the rules.

## Deploying

Pushing to `main` builds and publishes to GitHub Pages
(`.github/workflows/pages.yml`). The WebAssembly engine and the endgame
tablebase are pulled from the engine repo's release assets at build time, so
they are never committed here.

## License

MIT — see [LICENSE](LICENSE). The engine itself is MIT too, in
[the engine repo](https://github.com/Stermere/Checkers-Engine).
