// Desktop app: an Electron window around the exact same static build the web
// site serves. No engine work of its own - the WebAssembly build, the worker
// and the rules are all reused as-is.
//
// The upside over the web version: the endgame tablebase ships on disk, so
// there is nothing to download and the engine reaches full strength as soon as
// the window opens.

const { app, BrowserWindow, protocol, shell } = require('electron');
const { registerScheme, serve } = require('./serve');

registerScheme();

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 1000,
    minWidth: 480,
    minHeight: 640,
    backgroundColor: '#23421c',   // the easy-difficulty background, so opening
    show: false,                  // the app is not a white flash
    autoHideMenuBar: true,
    webPreferences: {
      // the renderer is a static site that talks to nothing but itself, so it
      // gets no Node access at all
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL('app://local/index.html');

  // the GitHub and rules links open in the real browser rather than replacing
  // the app with a page that has no way back
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.handle('app', serve);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
