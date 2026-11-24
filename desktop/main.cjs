const { app, BrowserWindow, Menu, ipcMain, shell, safeStorage, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { DEFAULT_SETTINGS, mergeSettings, encodeSettings, decodeSettings, backendEnvironment, canOpenExternal } = require('./lib.cjs');
const { resolveRuntimeDirectory } = require('./windows-runtime.cjs');

app.setName('Creator Studio');
app.setPath('userData', process.env.CREATOR_STUDIO_DATA_DIR
  ? path.resolve(process.env.CREATOR_STUDIO_DATA_DIR)
  : path.join(app.getPath('appData'), 'Creator Studio'));
const dataDirectory = app.getPath('userData');
const settingsFile = path.join(dataDirectory, 'settings.json');
const runtime = app.isPackaged ? process.resourcesPath : path.join(__dirname, '.runtime');
let mainWindow, preferences, backend, origin, settings = { ...DEFAULT_SETTINGS };
let quitting = false, restarting = false, busy = false;
let unreadableSettings = false;

async function saveSettings(next) {
  const record = await encodeSettings(next, safeStorage);
  fs.writeFileSync(`${settingsFile}.tmp`, JSON.stringify(record, null, 2), { mode: 0o600 });
  fs.renameSync(`${settingsFile}.tmp`, settingsFile);
  settings = next;
}

function assertSender(event, window) {
  if (!window || window.isDestroyed() || event.sender.id !== window.webContents.id
    || event.senderFrame !== window.webContents.mainFrame) throw new Error('Yêu cầu không hợp lệ.');
}

function secureWindow(window, isApp = false) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (canOpenExternal(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (isApp && origin && new URL(url).origin === origin) return;
    event.preventDefault();
    if (canOpenExternal(url)) void shell.openExternal(url);
  });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
}

function updateMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Ứng dụng', submenu: [
      { label: 'Cài đặt…', accelerator: 'CmdOrCtrl+,', enabled: !busy && !restarting, click: () => void openPreferences() },
      { label: 'Mở thư mục dữ liệu', click: () => void shell.openPath(dataDirectory) },
      { type: 'separator' }, { label: 'Thoát', role: 'quit' },
    ] },
    { label: 'Chỉnh sửa', submenu: [
      { label: 'Hoàn tác', role: 'undo' }, { label: 'Làm lại', role: 'redo' }, { type: 'separator' },
      { label: 'Cắt', role: 'cut' }, { label: 'Sao chép', role: 'copy' }, { label: 'Dán', role: 'paste' },
      { label: 'Chọn tất cả', role: 'selectAll' },
    ] },
    { label: 'Hiển thị', submenu: [
      { label: 'Phóng to', role: 'zoomIn' }, { label: 'Thu nhỏ', role: 'zoomOut' },
      { label: 'Cỡ chữ mặc định', role: 'resetZoom' }, { type: 'separator' },
      { label: 'Toàn màn hình', role: 'togglefullscreen' },
    ] },
  ]));
}

function freePort(preferred) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => preferred ? resolve(freePort(0)) : reject(error));
    server.listen(preferred, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function choosePort() {
  const file = path.join(dataDirectory, 'server-port.txt');
  let preferred = 18761;
  if (fs.existsSync(file)) {
    const stored = Number(fs.readFileSync(file, 'utf8'));
    if (Number.isInteger(stored) && stored >= 1024 && stored <= 65535) preferred = stored;
  }
  const port = await freePort(preferred);
  fs.writeFileSync(file, String(port));
  return port;
}

async function stopBackend() {
  const child = backend;
  if (!child) return;
  if (child.exitCode !== null || child.signalCode) { backend = null; return; }
  const exited = new Promise((resolve) => child.once('exit', resolve));
  try { await fetch(`${origin}/actuator/shutdown`, { method: 'POST', signal: AbortSignal.timeout(3000) }); } catch { /* It may still be starting. */ }
  let timer;
  await Promise.race([exited, new Promise((resolve) => { timer = setTimeout(resolve, 9000); })]);
  clearTimeout(timer);
  if (child.exitCode === null && !child.signalCode) {
    child.kill();
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
  }
  if (backend === child) backend = null;
}

async function startBackend() {
  const port = await choosePort();
  origin = `http://127.0.0.1:${port}`;
  const resolvedRuntime = resolveRuntimeDirectory(runtime, app.getPath('temp'));
  const java = path.join(resolvedRuntime, 'java', 'bin', 'java.exe');
  const jar = path.join(runtime, 'backend.jar');
  if (!fs.existsSync(java) || !fs.existsSync(jar)) throw new Error('Thiếu thành phần ứng dụng. Hãy giải nén lại toàn bộ tệp ZIP.');
  fs.mkdirSync(path.join(dataDirectory, 'data'), { recursive: true });
  fs.mkdirSync(path.join(dataDirectory, 'logs'), { recursive: true });
  const logFile = path.join(dataDirectory, 'logs', 'backend.log');
  if (fs.existsSync(logFile) && fs.statSync(logFile).size > 5 * 1024 * 1024) {
    fs.renameSync(logFile, `${logFile}.previous`);
  }
  const log = fs.createWriteStream(logFile, { flags: 'a' });
  // The Windows Java launcher can lose characters outside the system code page in
  // absolute JAR arguments. Resolve the ASCII filename from its native working directory.
  const child = spawn(java, ['-Xmx512m', '-jar', 'backend.jar', `--server.port=${port}`,
    '--spring.config.import=', `--application.desktop.origin=${origin}`], {
    cwd: resolvedRuntime, env: backendEnvironment(process.env, settings, dataDirectory), windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  backend = child;
  let spawnError;
  // Provider error URLs may contain credentials; scrub complete lines before writing logs.
  const secrets = [settings.geminiKey, settings.rapidApiKey].filter(Boolean);
  for (const stream of [child.stdout, child.stderr]) {
    let pending = '';
    const redact = (value) => secrets.reduce((line, key) => line.replaceAll(key, '[redacted]'), value);
    stream.on('data', (chunk) => {
      pending += chunk.toString();
      const lines = pending.split('\n');
      pending = lines.pop();
      for (const line of lines) log.write(`${redact(line)}\n`);
    });
    stream.on('end', () => { if (pending) log.write(redact(pending)); });
  }
  child.once('error', (error) => { spawnError = error; log.end(); });
  child.once('close', () => {
    log.end();
    if (backend === child && !quitting && !restarting) {
      dialog.showErrorBox('Creator Studio đã dừng', 'Không thể duy trì dịch vụ cục bộ. Hãy mở lại ứng dụng. Nhật ký nằm trong thư mục dữ liệu.');
      app.quit();
    }
  });
  for (let attempt = 0; attempt < 180; attempt++) {
    if (spawnError || child.exitCode !== null) throw new Error('Không thể khởi động dịch vụ cục bộ. Kiểm tra nhật ký trong thư mục dữ liệu.');
    if (quitting) return;
    try {
      const response = await fetch(`${origin}/actuator/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).status === 'UP') {
        await mainWindow.loadURL(origin);
        if (!mainWindow.isVisible()) mainWindow.show();
        return;
      }
    } catch { /* Wait for Spring Boot. */ }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('Khởi động mất quá nhiều thời gian. Hãy mở lại ứng dụng và kiểm tra nhật ký trong thư mục dữ liệu.');
}

async function openPreferences(firstRun = false) {
  if (quitting || busy || restarting) return;
  if (preferences && !preferences.isDestroyed()) { preferences.focus(); return; }
  preferences = new BrowserWindow({
    title: 'Cài đặt · Creator Studio', parent: mainWindow, modal: true,
    width: 680, height: 790, minWidth: 560, minHeight: 640, backgroundColor: '#ffffff', show: false,
    autoHideMenuBar: true, icon: path.join(__dirname, 'resources', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'settings-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  preferences.firstRun = firstRun;
  preferences.on('close', (event) => { if (restarting && !quitting) event.preventDefault(); });
  preferences.setMenu(null);
  secureWindow(preferences);
  preferences.once('ready-to-show', () => preferences?.show());
  const closed = new Promise((resolve) => preferences.once('closed', () => { preferences = null; resolve(); }));
  await preferences.loadFile(path.join(__dirname, 'ui', 'preferences.html'));
  await closed;
  if (firstRun && !fs.existsSync(settingsFile) && !quitting) await saveSettings(settings);
}

ipcMain.handle('desktop:settings', async (event) => { assertSender(event, mainWindow); await openPreferences(); });
ipcMain.handle('desktop:busy', (event, value) => {
  assertSender(event, mainWindow);
  if (typeof value !== 'boolean') throw new Error('Trạng thái không hợp lệ.');
  busy = value; updateMenu();
});
ipcMain.handle('settings:load', (event) => {
  assertSender(event, preferences);
  return { model: settings.model, geminiConfigured: Boolean(settings.geminiKey), rapidApiConfigured: Boolean(settings.rapidApiKey), firstRun: preferences.firstRun };
});
ipcMain.handle('settings:folder', (event) => { assertSender(event, preferences); return shell.openPath(dataDirectory); });
ipcMain.handle('settings:close', (event) => { assertSender(event, preferences); preferences.close(); });
ipcMain.handle('settings:save', async (event, input) => {
  assertSender(event, preferences);
  if (busy || restarting) return { error: 'Chờ tác vụ đang chạy hoàn tất rồi lưu cài đặt.' };
  try {
    await saveSettings(mergeSettings(input, settings));
    if (backend) {
      restarting = true; updateMenu();
      await mainWindow.loadFile(path.join(__dirname, 'ui', 'loading.html'));
      await stopBackend();
      await startBackend();
    }
    return { ok: true };
  } catch (error) { return { error: error.message }; }
  finally { restarting = false; updateMenu(); }
});

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', (event) => {
    if (quitting) return;
    event.preventDefault(); quitting = true;
    void stopBackend().finally(() => app.quit());
  });
  app.whenReady().then(async () => {
    fs.mkdirSync(dataDirectory, { recursive: true });
    if (fs.existsSync(settingsFile)) {
      try { settings = await decodeSettings(JSON.parse(fs.readFileSync(settingsFile, 'utf8')), safeStorage); }
      catch {
        unreadableSettings = true;
        dialog.showMessageBoxSync({ type: 'warning', title: 'Nhập lại khóa API', message: 'Không đọc được cài đặt đã mã hóa trên tài khoản Windows này. Dữ liệu kịch bản vẫn được giữ. Hãy nhập lại khóa trong Cài đặt.' });
      }
    }
    mainWindow = new BrowserWindow({
      title: 'Creator Studio', width: 1440, height: 1000, minWidth: 820, minHeight: 640,
      backgroundColor: '#f6f7f8', show: false, icon: path.join(__dirname, 'resources', 'icon.png'),
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    secureWindow(mainWindow, true);
    const session = mainWindow.webContents.session;
    session.setPermissionRequestHandler((_webContents, permission, callback) => callback(permission === 'clipboard-sanitized-write'));
    session.webRequest.onHeadersReceived((details, callback) => {
      if (origin && details.url.startsWith(`${origin}/`)) {
        callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'"] } });
      } else callback({});
    });
    updateMenu();
    mainWindow.once('ready-to-show', () => mainWindow.show());
    await mainWindow.loadFile(path.join(__dirname, 'ui', 'loading.html'));
    if (!fs.existsSync(settingsFile) || unreadableSettings) await openPreferences(true);
    if (!quitting) await startBackend();
  }).catch(async (error) => {
    dialog.showErrorBox('Không thể mở Creator Studio', error.message);
    app.quit();
  });
}
