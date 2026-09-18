import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import * as XLSX from 'xlsx';
import http from 'http';

// Set Windows AppUserModelId for Taskbar icon grouping and display
app.setAppUserModelId('com.gpmsoftwares.gpmautomateeditor');

const windows = new Set<BrowserWindow>();

function getTargetWindow(event?: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent): BrowserWindow | null {
  if (event) {
    const fromSender = BrowserWindow.fromWebContents(event.sender);
    if (fromSender) return fromSender;
  }
  return BrowserWindow.getFocusedWindow() || (windows.size > 0 ? Array.from(windows)[0] : null);
}

function createWindow(): BrowserWindow {
  const iconPath = path.join(__dirname, '../public/icon.ico');
  const iconPngPath = path.join(__dirname, '../public/icon.png');

  const resolvedIcon = fs.existsSync(iconPath)
    ? iconPath
    : fs.existsSync(iconPngPath)
    ? iconPngPath
    : undefined;

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    frame: false, // Frameless custom desktop titlebar
    backgroundColor: '#f0f2f5',
    icon: resolvedIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'GPM Automate Editor v3.0.8-stable',
  });

  if (resolvedIcon) {
    win.setIcon(resolvedIcon);
  }

  // Tự động mở toàn màn hình (maximized) khi khởi chạy
  win.maximize();

  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    win.loadURL('http://localhost:5173');
  }

  windows.add(win);

  win.on('closed', () => {
    windows.delete(win);
  });

  return win;
}

// Window control handlers
ipcMain.on('window-minimize', (event) => {
  const win = getTargetWindow(event);
  win?.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = getTargetWindow(event);
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window-close', (event) => {
  const win = getTargetWindow(event);
  win?.close();
});

// App level window creation
ipcMain.handle('app:newWindow', () => {
  createWindow();
  return { success: true };
});

// File dialog handlers
ipcMain.handle('dialog:openFolder', async (event) => {
  const win = getTargetWindow(event);
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:openFile', async (event, options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => {
  const win = getTargetWindow(event);
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: options?.title || 'Select File',
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:saveFile', async (event, options?: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => {
  const win = getTargetWindow(event);
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: options?.title || 'Select File',
    defaultPath: options?.defaultPath,
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Save Project according to SKILL.md format: info.gpmsln + src.gscript
ipcMain.handle('fs:saveProject', async (_, projectData: any) => {
  try {
    const { folderPath, info, script } = projectData;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const infoPath = path.join(folderPath, 'info.gpmsln');
    const scriptPath = path.join(folderPath, 'src.gscript');

    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2), 'utf-8');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Read Project from disk
ipcMain.handle('fs:readProject', async (_, folderPath: string) => {
  try {
    const infoPath = path.join(folderPath, 'info.gpmsln');
    const scriptPath = path.join(folderPath, 'src.gscript');

    if (!fs.existsSync(infoPath) || !fs.existsSync(scriptPath)) {
      return { success: false, error: 'Not a valid GPM Automate project directory' };
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));

    return { success: true, project: { folderPath, info, script } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// File system actions for File & Folder automations
ipcMain.handle('fs:fileAction', async (_, req: { action: string; payload?: any }) => {
  try {
    const { action, payload } = req;
    if (action === 'exists') {
      const exists = fs.existsSync(payload.path) && fs.statSync(payload.path).isFile();
      return { success: true, exists };
    }
    if (action === 'copy') {
      const destDir = path.dirname(payload.dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(payload.src, payload.dest);
      return { success: true };
    }
    if (action === 'move') {
      const destDir = path.dirname(payload.dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(payload.src, payload.dest);
      return { success: true };
    }
    if (action === 'delete') {
      if (fs.existsSync(payload.path)) {
        fs.unlinkSync(payload.path);
      }
      return { success: true };
    }
    if (action === 'readText') {
      if (!fs.existsSync(payload.path)) {
        return { success: false, error: 'File does not exist' };
      }
      const text = fs.readFileSync(payload.path, 'utf-8');
      return { success: true, text };
    }
    if (action === 'readLines') {
      if (!fs.existsSync(payload.path)) {
        return { success: false, error: 'File does not exist' };
      }
      const raw = fs.readFileSync(payload.path, 'utf-8');
      const lines = raw.split(/\r?\n/);
      return { success: true, lines };
    }
    if (action === 'readRandomLine') {
      if (!fs.existsSync(payload.path)) {
        return { success: false, error: 'File does not exist' };
      }
      const raw = fs.readFileSync(payload.path, 'utf-8');
      const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
      const line = lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : '';
      return { success: true, line };
    }
    if (action === 'writeText') {
      const dir = path.dirname(payload.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(payload.path, payload.text ?? '', 'utf-8');
      return { success: true };
    }
    if (action === 'appendLine') {
      const dir = path.dirname(payload.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let appendText = payload.text ?? '';
      if (!appendText.endsWith('\r\n') && !appendText.endsWith('\n')) {
        appendText += '\r\n';
      }

      if (fs.existsSync(payload.path)) {
        const stat = fs.statSync(payload.path);
        if (stat.size > 0) {
          const fd = fs.openSync(payload.path, 'r');
          const buffer = Buffer.alloc(Math.min(2, stat.size));
          fs.readSync(fd, buffer, 0, buffer.length, stat.size - buffer.length);
          fs.closeSync(fd);
          const endStr = buffer.toString('utf-8');
          if (!endStr.endsWith('\n') && !endStr.endsWith('\r')) {
            appendText = '\r\n' + appendText;
          }
        }
      }

      fs.appendFileSync(payload.path, appendText, 'utf-8');
      return { success: true };
    }
    if (action === 'createEmptyExcel') {
      let target = payload.path;
      if (!target) return { success: false, error: 'File path is required' };
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        target = path.join(target, 'output.xlsx');
      } else if (!path.extname(target)) {
        target = target + '.xlsx';
      }
      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const b64 = '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';
      fs.writeFileSync(target, Buffer.from(b64, 'base64'));
      return { success: true, path: target };
    }

    const colToIdx = (colStr: string): number => {
      const trimmed = colStr.trim();
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        return Math.max(0, num - 1);
      }
      let cIdx = 0;
      const upper = trimmed.toUpperCase();
      for (let i = 0; i < upper.length; i++) {
        cIdx = cIdx * 26 + (upper.charCodeAt(i) - 64);
      }
      return Math.max(0, cIdx - 1);
    };

    if (action === 'readExcel') {
      if (!fs.existsSync(payload.path)) {
        return { success: false, error: 'Excel file does not exist' };
      }
      const wb = XLSX.readFile(payload.path);
      const sheetIdx = parseInt(payload.sheetIndex, 10) || 0;
      const sheetName = wb.SheetNames[sheetIdx] || wb.SheetNames[0];
      if (!sheetName || !wb.Sheets[sheetName]) {
        return { success: false, error: `Sheet index ${sheetIdx} does not exist` };
      }
      const ws = wb.Sheets[sheetName];
      const colIdx = colToIdx(String(payload.col || 'A'));
      const rowNum = parseInt(String(payload.row || '1'), 10) || 1;
      const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: rowNum - 1 });
      const cell = ws[cellAddress];
      const val = cell ? (cell.v !== undefined ? String(cell.v) : (cell.w || '')) : '';
      return { success: true, value: val };
    }
    if (action === 'writeExcel') {
      let wb: XLSX.WorkBook;
      if (fs.existsSync(payload.path)) {
        wb = XLSX.readFile(payload.path);
      } else {
        wb = XLSX.utils.book_new();
      }
      const sheetIdx = parseInt(payload.sheetIndex, 10) || 0;
      let sheetName = wb.SheetNames[sheetIdx];
      let ws: XLSX.WorkSheet;
      if (!sheetName || !wb.Sheets[sheetName]) {
        sheetName = `Sheet${sheetIdx + 1}`;
        ws = XLSX.utils.aoa_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } else {
        ws = wb.Sheets[sheetName];
      }
      const colIdx = colToIdx(String(payload.col || 'A'));
      const rowNum = parseInt(String(payload.row || '1'), 10) || 1;
      const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: rowNum - 1 });
      XLSX.utils.sheet_add_aoa(ws, [[payload.value ?? '']], { origin: cellAddress });
      const dir = path.dirname(payload.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      XLSX.writeFile(wb, payload.path);
      return { success: true };
    }
    if (action === 'appendExcel') {
      let wb: XLSX.WorkBook;
      if (fs.existsSync(payload.path)) {
        wb = XLSX.readFile(payload.path);
      } else {
        wb = XLSX.utils.book_new();
      }
      const sheetIdx = parseInt(payload.sheetIndex, 10) || 0;
      let sheetName = wb.SheetNames[sheetIdx];
      let ws: XLSX.WorkSheet;
      if (!sheetName || !wb.Sheets[sheetName]) {
        sheetName = `Sheet${sheetIdx + 1}`;
        ws = XLSX.utils.aoa_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } else {
        ws = wb.Sheets[sheetName];
      }
      const colIdx = colToIdx(String(payload.col || 'A'));
      let nextRow = 1;
      while (
        ws[XLSX.utils.encode_cell({ c: colIdx, r: nextRow - 1 })] &&
        String(ws[XLSX.utils.encode_cell({ c: colIdx, r: nextRow - 1 })].v ?? '').trim() !== ''
      ) {
        nextRow++;
      }
      const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: nextRow - 1 });
      XLSX.utils.sheet_add_aoa(ws, [[payload.value ?? '']], { origin: cellAddress });
      const dir = path.dirname(payload.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      XLSX.writeFile(wb, payload.path);
      return { success: true, row: nextRow };
    }
    if (action === 'folderExists') {
      const exists = fs.existsSync(payload.path) && fs.statSync(payload.path).isDirectory();
      return { success: true, exists };
    }
    if (action === 'createFolder') {
      if (!fs.existsSync(payload.path)) {
        fs.mkdirSync(payload.path, { recursive: true });
      }
      return { success: true };
    }
    if (action === 'moveFolder') {
      if (!fs.existsSync(payload.src)) {
        return { success: false, error: 'Source folder does not exist' };
      }
      const destDir = path.dirname(payload.dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(payload.src, payload.dest);
      return { success: true };
    }
    if (action === 'deleteFolder') {
      if (fs.existsSync(payload.path)) {
        fs.rmSync(payload.path, { recursive: true, force: true });
      }
      return { success: true };
    }
    if (action === 'folderGetFileList') {
      if (!fs.existsSync(payload.path)) {
        return { success: false, error: 'Folder does not exist' };
      }
      const getFilesRecursively = (dir: string): string[] => {
        let results: string[] = [];
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of list) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
          } else {
            results.push(fullPath);
          }
        }
        return results;
      };
      const files = getFilesRecursively(payload.path);
      return { success: true, files };
    }
    if (action === 'getClipboard') {
      const text = await clipboard.readText();
      return { success: true, text: typeof text === 'string' ? text : String(text ?? '') };
    }
    if (action === 'setClipboard') {
      await clipboard.writeText(payload.text ?? '');
      return { success: true };
    }
    if (action === 'httpRequest') {
      const { url, method, headers, data, timeout } = payload;
      if (!url) return { success: false, error: 'URL is required' };

      const headerObj: Record<string, string> = {};
      if (headers && typeof headers === 'string') {
        const lines = headers.split(/\r?\n/);
        for (const line of lines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const k = line.substring(0, colonIdx).trim();
            const v = line.substring(colonIdx + 1).trim();
            if (k) headerObj[k] = v;
          }
        }
      }

      const controller = new AbortController();
      const timeoutSec = parseFloat(timeout) || 60;
      const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

      try {
        const reqInit: any = {
          method: (method || 'GET').toUpperCase(),
          headers: headerObj,
          signal: controller.signal,
        };
        if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(reqInit.method)) {
          reqInit.body = data;
        }

        const resp = await fetch(url, reqInit);
        clearTimeout(timeoutId);
        const text = await resp.text();
        return { success: true, status: resp.status, statusText: resp.statusText, data: text };
      } catch (err: any) {
        clearTimeout(timeoutId);
        return { success: false, error: err.message || String(err) };
      }
    }
    if (action === 'httpDownload') {
      const { url, savePath, headers } = payload;
      if (!url) return { success: false, error: 'URL is required' };
      if (!savePath) return { success: false, error: 'Save Path is required' };

      const headerObj: Record<string, string> = {};
      if (headers && typeof headers === 'string') {
        const lines = headers.split(/\r?\n/);
        for (const line of lines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const k = line.substring(0, colonIdx).trim();
            const v = line.substring(colonIdx + 1).trim();
            if (k) headerObj[k] = v;
          }
        }
      }

      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const resp = await fetch(url, { method: 'GET', headers: headerObj });
      if (!resp.ok) {
        return { success: false, error: `HTTP ${resp.status} ${resp.statusText}` };
      }
      const arrayBuffer = await resp.arrayBuffer();
      fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
      return { success: true, status: resp.status };
    }
    if (action === 'imageToBase64') {
      const { path: imgPath } = payload;
      if (!imgPath || !fs.existsSync(imgPath)) {
        return { success: false, error: 'Image file does not exist' };
      }
      const ext = path.extname(imgPath).toLowerCase().replace('.', '');
      let mime = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'webp') mime = 'image/webp';
      else if (ext === 'gif') mime = 'image/gif';
      else if (ext === 'bmp') mime = 'image/bmp';
      else if (ext === 'svg') mime = 'image/svg+xml';

      const fileBuf = fs.readFileSync(imgPath);
      const b64 = `data:${mime};base64,${fileBuf.toString('base64')}`;
      return { success: true, base64: b64 };
    }
    return { success: false, error: `Unknown fs action: ${action}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Helper to find Chrome executable across standard installation locations
const findChromePath = (): string | null => {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const getAutomationProfileDir = () => {
  const dir = path.join(app.getPath('userData'), 'ChromeAutomationProfile');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
  return dir;
};

const launchChrome = (
  port: string | number = 43076,
  targetUrl: string = 'https://google.com',
  profileName: string = 'ChromeAutomationProfile',
  windowSize?: { width: number; height: number },
  scale?: number,
  proxy?: string
) => {
  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Google Chrome installation not found. Please install Google Chrome.');
  }

  const profileDir = path.join(app.getPath('userData'), profileName);
  if (!fs.existsSync(profileDir)) {
    try { fs.mkdirSync(profileDir, { recursive: true }); } catch (e) {}
  }

  const args = [
    targetUrl,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  if (proxy && proxy.trim()) {
    const cleanProxy = proxy.trim().replace(/^[a-z]+:\/\//i, '');
    const parts = cleanProxy.split(':');
    if (parts[0] && parts[1]) {
      args.push(`--proxy-server=http://${parts[0]}:${parts[1]}`);
    }
  }

  if (windowSize && windowSize.width && windowSize.height) {
    args.push(`--window-size=${windowSize.width},${windowSize.height}`);
  } else {
    args.push('--start-maximized');
  }

  if (scale && scale !== 100) {
    args.push(`--force-device-scale-factor=${scale / 100}`);
  }

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return { success: true, message: `Chrome started on port ${port}: ${targetUrl}` };
};

// Check IP / Proxy before opening profile
ipcMain.handle('automation:checkIp', async (_, options?: { proxy?: string; timeoutMs?: number }) => {
  const timeoutMs = options?.timeoutMs || 5000;
  const proxy = options?.proxy?.trim();

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: any) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish({ success: false, error: 'Connection timed out (Proxy/Network unreachable)' });
    }, timeoutMs);

    if (proxy) {
      try {
        const cleanProxy = proxy.replace(/^[a-z]+:\/\//i, '');
        const parts = cleanProxy.split(':');
        const proxyHost = parts[0];
        const proxyPort = parseInt(parts[1], 10) || 8080;
        const proxyUser = parts[2];
        const proxyPass = parts[3];

        const headers: Record<string, string> = {
          'Host': 'ip-api.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };
        if (proxyUser && proxyPass) {
          headers['Proxy-Authorization'] = `Basic ${Buffer.from(`${proxyUser}:${proxyPass}`).toString('base64')}`;
        }

        const req = http.request({
          host: proxyHost,
          port: proxyPort,
          path: 'http://ip-api.com/json',
          method: 'GET',
          headers,
          timeout: timeoutMs,
        }, (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            clearTimeout(timer);
            try {
              const json = JSON.parse(data);
              if (json.status === 'success' || json.query) {
                finish({
                  success: true,
                  ip: json.query || json.ip,
                  country: json.country || json.countryCode || '',
                  city: json.city || '',
                  isp: json.isp || '',
                });
              } else {
                finish({ success: false, error: json.message || 'Proxy returned invalid status' });
              }
            } catch {
              finish({ success: false, error: 'Invalid response through proxy' });
            }
          });
        });

        req.on('error', (err) => {
          clearTimeout(timer);
          finish({ success: false, error: `Proxy connection error: ${err.message}` });
        });
        req.end();
      } catch (err: any) {
        clearTimeout(timer);
        finish({ success: false, error: `Invalid proxy format: ${err.message}` });
      }
    } else {
      const req = http.get('http://ip-api.com/json', { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const json = JSON.parse(data);
            if (json.status === 'success' || json.query) {
              finish({
                success: true,
                ip: json.query || json.ip,
                country: json.country || json.countryCode || '',
                city: json.city || '',
                isp: json.isp || '',
              });
            } else {
              finish({ success: false, error: json.message || 'Failed to retrieve IP' });
            }
          } catch {
            finish({ success: false, error: 'Failed to parse IP response' });
          }
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        finish({ success: false, error: `Network error: ${err.message}` });
      });
    }
  });
});

// Launch Chrome directly with remote debugging port
ipcMain.handle('automation:launchBrowser', async (_, options?: {
  port?: string | number;
  url?: string;
  profileName?: string;
  windowSize?: { width: number; height: number };
  scale?: number;
  proxy?: string;
}) => {
  try {
    const port = options?.port || 43076;
    const url = options?.url || 'https://google.com';
    const profile = options?.profileName || `ChromeProfile_${port}`;
    return launchChrome(port, url, profile, options?.windowSize, options?.scale, options?.proxy);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Launch multiple Chrome instances for multi-threading
ipcMain.handle('automation:launchMultiThreads', async (_, req: {
  threads: Array<{ id: number; port: number; name: string; url?: string; proxy?: string }>;
  windowSize?: { width: number; height: number };
  scale?: number;
}) => {
  try {
    const results = [];
    for (const t of req.threads) {
      const res = launchChrome(
        t.port,
        t.url || 'https://google.com',
        `ChromeProfile_Thread_${t.id}_${t.port}`,
        req.windowSize,
        req.scale,
        t.proxy
      );
      results.push({ ...t, success: res.success });
      await new Promise(r => setTimeout(r, 450));
    }
    return { success: true, threads: results };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Automation Runner: Launch Chrome with automation flags and remote debugging port
ipcMain.handle('automation:run', async (_, projectData: any) => {
  try {
    let targetUrl = 'https://google.com';
    const script = projectData?.script;

    if (script) {
      const scanForUrl = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.type === 39 && n.raw_input) {
            try {
              const parsed = typeof n.raw_input === 'string' ? JSON.parse(n.raw_input) : n.raw_input;
              const urlItem = parsed.find((p: any) => p.Key === 'URL');
              if (urlItem && urlItem.Value && urlItem.Value.startsWith('http')) {
                targetUrl = urlItem.Value;
                return;
              }
            } catch (e) {}
          }
          if (n.nodes && Array.isArray(n.nodes)) {
            scanForUrl(n.nodes);
          }
        }
      };

      scanForUrl(script.before_init?.nodes || []);
      scanForUrl(script.main_logic?.nodes || []);
      scanForUrl(script.after_quit?.nodes || []);
    }

    return launchChrome(43076, targetUrl);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Test Chrome Debugging Port
ipcMain.handle('automation:testPort', async (_, port: string | number) => {
  try {
    const http = await import('http');
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/json/version`, { timeout: 2500 }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              success: true,
              data: parsed,
              webSocketUrl: parsed.webSocketDebuggerUrl,
            });
          } catch (e: any) {
            resolve({
              success: false,
              error: `Invalid response from http://127.0.0.1:${port}`,
            });
          }
        });
      });
      req.on('error', () => {
        resolve({
          success: false,
          error: `Failed to fetch browser webSocket url from http://127.0.0.1:${port}.`,
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: `Failed to fetch browser webSocket url from http://127.0.0.1:${port}.`,
        });
      });
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// CDP Browser Controller via Remote Debugging Port (Node.js level, no CORS restrictions)
ipcMain.handle('automation:cdpAction', async (_, req: { port: string | number; action: string; payload?: any }) => {
  const { port, action, payload } = req;
  const http = await import('http');

  const httpGet = (urlStr: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const r = http.get(urlStr, { timeout: 3500 }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
        });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });
  };

  const httpPut = (urlStr: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const u = new URL(urlStr);
      const r = http.request({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'PUT',
        timeout: 3500,
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
        });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
      r.end();
    });
  };

  let nextId = 100;
  const sendWs = (wsUrl: string, method: string, params: any = {}): Promise<any> => {
    return new Promise((resolve) => {
      try {
        const reqId = ++nextId;
        const normalizedWsUrl = wsUrl.replace('//localhost:', '//127.0.0.1:');
        const ws = new WebSocket(normalizedWsUrl);
        const timer = setTimeout(() => {
          try { ws.close(); } catch (e) {}
          resolve({ success: false, error: 'WebSocket timeout' });
        }, 5000);

        ws.onopen = () => {
          ws.send(JSON.stringify({ id: reqId, method, params }));
        };
        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data.toString());
            // Wait for matching response ID
            if (data && data.id === reqId) {
              clearTimeout(timer);
              try { ws.close(); } catch (e) {}
              if (data.error) {
                resolve({ success: false, error: data.error.message || JSON.stringify(data.error) });
              } else {
                resolve({ success: true, result: data.result });
              }
            }
          } catch (e) {
            // Ignore non-json or unrelated notifications
          }
        };
        ws.onerror = (err) => {
          clearTimeout(timer);
          try { ws.close(); } catch (e) {}
          resolve({ success: false, error: String(err) });
        };
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  };

  const getPageTarget = async () => {
    const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
    if (Array.isArray(list)) {
      const page = list.find((t: any) => t.type === 'page');
      return page || list[0];
    }
    return null;
  };

  try {
    if (action === 'initVirtualMouse') {
      const page = await getPageTarget();
      if (!page || !page.webSocketDebuggerUrl) {
        return { success: false, error: 'No active Chrome page found.' };
      }
      const script = payload?.script || '';
      if (script) {
        await sendWs(page.webSocketDebuggerUrl, 'Page.addScriptToEvaluateOnNewDocument', {
          source: script,
        }).catch(() => {});
        await sendWs(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
          expression: script,
          returnByValue: true,
        }).catch(() => {});
      }
      return { success: true };
    }

    if (action === 'evaluate') {
      const expression = payload?.expression || '';
      const page = await getPageTarget();
      if (!page || !page.webSocketDebuggerUrl) {
        return { success: false, error: 'No active Chrome page found.' };
      }
      const wsRes = await sendWs(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (!wsRes.success) {
        return { success: false, error: wsRes.error || 'Evaluation failed' };
      }
      const cdpRes = wsRes.result;
      if (cdpRes?.exceptionDetails) {
        const desc = cdpRes.exceptionDetails.exception?.description || cdpRes.exceptionDetails.text || 'JavaScript Exception';
        return { success: false, error: desc };
      }
      return { success: true, value: cdpRes?.result?.value };
    }

    if (action === 'clickCoordinates') {
      const { x, y } = payload || {};
      const page = await getPageTarget();
      if (!page || !page.webSocketDebuggerUrl) {
        return { success: false, error: 'No active Chrome page found.' };
      }
      const posX = parseFloat(x) || 0;
      const posY = parseFloat(y) || 0;

      await sendWs(page.webSocketDebuggerUrl, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: posX,
        y: posY,
        button: 'left',
        clickCount: 1,
      });
      await sendWs(page.webSocketDebuggerUrl, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: posX,
        y: posY,
        button: 'left',
        clickCount: 1,
      });

      return { success: true, x: posX, y: posY };
    }

    if (action === 'newTab') {
      const url = payload?.url ? `?${encodeURIComponent(payload.url)}` : '';
      const tab = await httpPut(`http://127.0.0.1:${port}/json/new${url}`);
      return { success: true, tab };
    }

    if (action === 'closeTab') {
      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const page = list.find((t: any) => t.type === 'page');
        if (page && page.id) {
          await httpGet(`http://127.0.0.1:${port}/json/close/${page.id}`);
          return { success: true };
        }
      }
      return { success: false, error: 'No active tab found to close' };
    }

    if (action === 'closeAllTab') {
      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const pages = list.filter((t: any) => t.type === 'page');
        if (pages.length > 1) {
          for (let i = 1; i < pages.length; i++) {
            try {
              await httpGet(`http://127.0.0.1:${port}/json/close/${pages[i].id}`);
            } catch (e) {}
          }
        }
        if (pages[0]?.id) {
          await httpGet(`http://127.0.0.1:${port}/json/activate/${pages[0].id}`);
        }
      }
      return { success: true };
    }

    if (action === 'activeTab') {
      const { mode, target } = payload || {};
      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const pages = list.filter((t: any) => t.type === 'page');
        let targetTab = null;
        if (mode?.toLowerCase().includes('prefix')) {
          targetTab = pages.find((t: any) => t.url && t.url.startsWith(target));
        } else {
          const idx = parseInt(target, 10) || 0;
          targetTab = pages[idx] || pages[0];
        }
        if (targetTab && targetTab.id) {
          await httpGet(`http://127.0.0.1:${port}/json/activate/${targetTab.id}`);
          return { success: true, tab: targetTab };
        }
      }
      return { success: false, error: 'Target tab not found' };
    }

    if (action === 'goToUrl') {
      let url = (payload?.url || '').trim();
      if (!url || url === 'https://') {
        url = 'https://google.com';
      } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:') && !url.startsWith('chrome://')) {
        url = `https://${url}`;
      }

      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const page = list.find((t: any) => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          const wsRes = await sendWs(page.webSocketDebuggerUrl, 'Page.navigate', { url });
          return wsRes.success ? wsRes : { success: true };
        }
      }
      await httpPut(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`);
      return { success: true };
    }

    if (action === 'reload') {
      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const page = list.find((t: any) => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          await sendWs(page.webSocketDebuggerUrl, 'Page.reload');
          return { success: true };
        }
      }
    }

    if (action === 'backUrl') {
      const list = await httpGet(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(list)) {
        const page = list.find((t: any) => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          await sendWs(page.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: 'window.history.back()' });
          return { success: true };
        }
      }
    }

    return { success: false, error: 'Unknown action' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running. Quitting this process will trigger
  // 'second-instance' in the first process, which opens a new window seamlessly
  // without disk cache locks or errors.
  app.quit();
} else {
  app.on('second-instance', () => {
    // When the user opens the application again (e.g. running Chay_Phan_Mem.bat),
    // create and focus a new window!
    const newWin = createWindow();
    if (newWin) {
      if (newWin.isMinimized()) newWin.restore();
      newWin.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (windows.size === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
