'use strict';
/*
 * OhMyChiikawa — desktop pet, main process.
 *
 * Creates a transparent, frameless, always-on-top window that hosts the pet,
 * and provides the "physical" behaviours that only the OS layer can do:
 *   - moving the window (dragging, walking)
 *   - click-through on transparent pixels
 *   - the right-click context menu
 *   - polling the global cursor so the pet can look at you
 *
 * Everything is local. No network access is used at any point.
 */

const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// ---------- encrypted image vault ----------
// Decrypt assets.pak once here in the main process (which has full Node access);
// the renderer pulls each image as a data: URL over IPC, so neither the
// filesystem nor the key is ever exposed to the (sandboxed) page. If the pak is
// absent (raw dev tree), ASSETS stays empty and the renderer falls back to file
// paths under src/images/.
const ASSETS = Object.create(null);
try {
  const vault = require('./asset-vault');
  const bundle = JSON.parse(vault.decrypt(fs.readFileSync(path.join(__dirname, 'assets.pak'))).toString('utf8'));
  for (const k in bundle) {
    const ext = k.split('.').pop().toLowerCase();
    const mime = ext === 'gif' ? 'image/gif' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
    ASSETS[k] = 'data:' + mime + ';base64,' + bundle[k];
  }
} catch (e) { /* no pak: dev tree uses raw files */ }
ipcMain.on('asset:get', (e, p) => { e.returnValue = ASSETS[p] || null; });

// ---------- launch options (CLI) ----------
function argValue(name, fallback) {
  const pre = '--' + name + '=';
  const hit = process.argv.find((a) => a.startsWith(pre));
  return hit ? hit.slice(pre.length) : fallback;
}
// Persisted preferences — remembers the last chosen pet across launches.
const PREFS_PATH = path.join(app.getPath('userData'), 'prefs.json');
function loadPrefs() { try { return JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8')); } catch (e) { return {}; } }
function savePrefs() { try { fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true }); fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs)); } catch (e) {} }
const prefs = loadPrefs();

// An explicit --pet on the CLI wins; otherwise restore the last chosen pet.
let currentPet = argValue('pet', null) || prefs.pet || 'usagi';   // switchable from the right-click menu
let lang = (prefs.lang === 'en') ? 'en' : 'zh';   // menu & speech language (switchable, remembered)
const t = (zh, en) => (lang === 'en' ? en : zh); // pick the current language's string
// Per-language character names for the menu (the main process has no pet registry).
const PET_LABELS = {
  usagi: { zh: '乌萨奇', en: 'Usagi' },
  chiikawa: { zh: '吉伊', en: 'Chiikawa' }
};
const ROLL_PETS = new Set(['usagi']);           // pets that have the hand-roll action
const PET_SPEED = { usagi: 3, chiikawa: 2 };    // walk speed px/tick (16ms); default 2
const petLabel = (id) => (PET_LABELS[id] ? PET_LABELS[id][lang] : id);
const SCALES = { small: 150, medium: 200, large: 270 }; // pet display height (px)
let scaleName = argValue('scale', 'medium');
if (!SCALES[scaleName]) scaleName = 'medium';

// ---------- runtime state ----------
let win = null;
const settings = { follow: true, wander: true, onTop: true };

let dragging = false;
let dragAnchor = { x: 0, y: 0 };
let winStart = { x: 0, y: 0 };

let walkTimer = null;    // active stroll stepper
let walkPlan = null;     // scheduler for next stroll
let lookTimer = null;    // cursor poll
let lastLook = { dx: 0, dy: 0 };

// ---------- window ----------
function createWindow() {
  win = new BrowserWindow({
    width: 240,
    height: 320,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    title: 'OhMyChiikawa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false // keep the pet animating while unfocused
    }
  });

  win.setMenu(null);
  applyOnTop();
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  try { win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch (e) {}

  // loadFile handles platform path differences (Windows backslashes etc.)
  win.loadFile(path.join(__dirname, 'index.html'), { query: { pet: currentPet, scale: scaleName, lang } });

  // start click-through; the renderer turns it off while the cursor is on the pet
  win.setIgnoreMouseEvents(true, { forward: true });

  win.on('closed', () => { win = null; });
}

function applyOnTop() {
  if (!win) return;
  win.setAlwaysOnTop(settings.onTop, 'floating');
}

// ---------- sizing & placement ----------
// Renderer measures the pet and asks for an exact window size (incl. motion
// headroom). We keep the pet's bottom-centre anchored so menu resizes feel
// stable, and place it bottom-right on first fit.
let placed = false;
function fitWindow(w, h) {
  if (!win) return;
  w = Math.max(60, Math.round(w));
  h = Math.max(60, Math.round(h));
  const cur = win.getBounds();
  const disp = screen.getDisplayNearestPoint({ x: cur.x + cur.width / 2, y: cur.y + cur.height / 2 });
  const area = disp.workArea;
  let x, y;
  if (!placed) {
    x = area.x + area.width - w - 24;
    y = area.y + area.height - h - 12;
    placed = true;
  } else {
    // keep bottom-centre fixed
    x = Math.round(cur.x + cur.width / 2 - w / 2);
    y = Math.round(cur.y + cur.height - h);
  }
  // keep on-screen
  x = Math.min(Math.max(x, area.x), area.x + area.width - w);
  y = Math.min(Math.max(y, area.y), area.y + area.height - h);
  win.setBounds({ x, y, width: w, height: h });
  if (!win.isVisible()) win.show();
}

// ---------- dragging ----------
ipcMain.on('drag:start', (_e, pos) => {
  dragging = true;
  dragAnchor = pos;
  const b = win.getBounds();
  winStart = { x: b.x, y: b.y };
  stopWalk();
});
ipcMain.on('drag:move', (_e, pos) => {
  if (!dragging || !win) return;
  win.setPosition(
    winStart.x + Math.round(pos.x - dragAnchor.x),
    winStart.y + Math.round(pos.y - dragAnchor.y)
  );
});
ipcMain.on('drag:end', () => { dragging = false; });

// ---------- click-through ----------
ipcMain.on('hit:ignore', (_e, ignore) => {
  if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true });
});

// ---------- renderer lifecycle ----------
ipcMain.on('pet:fit', (_e, size) => fitWindow(size.w, size.h));
ipcMain.on('pet:quit', () => app.quit());

// Swap the displayed pet by reloading the page with a new ?pet=. Cheap and robust:
// the renderer rebuilds all layers for the new artwork on load. The cursor-follow
// and wander timers live here in the main process, so they survive the reload.
function switchPet(id) {
  if (!win || id === currentPet || !PET_LABELS[id]) return;
  currentPet = id;
  prefs.pet = id; savePrefs();
  win.loadFile(path.join(__dirname, 'index.html'), { query: { pet: currentPet, scale: scaleName, lang } });
}

// Switch the menu / speech language. The menu rebuilds on next open; the renderer
// updates its speech lines live over IPC (no reload needed).
function setLang(l) {
  l = (l === 'en') ? 'en' : 'zh';
  if (l === lang) return;
  lang = l;
  prefs.lang = lang; savePrefs();
  if (win) win.webContents.send('pet:lang', lang);
}

// ---------- context menu ----------
ipcMain.on('menu:open', () => {
  if (!win) return;
  const tmpl = [
    { label: petLabel(currentPet), enabled: false },
    { type: 'separator' },
    {
      label: t('角色', 'Character'),
      submenu: Object.keys(PET_LABELS).map((id) => ({
        label: petLabel(id), type: 'radio', checked: currentPet === id,
        click: () => switchPet(id)
      }))
    },
    {
      label: t('语言', 'Language'),
      submenu: [
        { label: '中文', type: 'radio', checked: lang === 'zh', click: () => setLang('zh') },
        { label: 'English', type: 'radio', checked: lang === 'en', click: () => setLang('en') }
      ]
    },
    { type: 'separator' },
    {
      label: t('跟随鼠标', 'Follow cursor'), type: 'checkbox', checked: settings.follow,
      click: () => { settings.follow = !settings.follow; if (settings.follow) startLook(); else stopLook(); }
    },
    {
      label: t('四处走动', 'Wander'), type: 'checkbox', checked: settings.wander,
      click: () => { settings.wander = !settings.wander; if (settings.wander) scheduleWalk(); else stopWalk(); }
    },
    {
      label: t('总在最前', 'Always on top'), type: 'checkbox', checked: settings.onTop,
      click: () => { settings.onTop = !settings.onTop; applyOnTop(); }
    },
    { type: 'separator' },
    {
      label: t('大小', 'Size'),
      submenu: ['small', 'medium', 'large'].map((s) => ({
        label: { small: t('小', 'Small'), medium: t('中', 'Medium'), large: t('大', 'Large') }[s],
        type: 'radio', checked: scaleName === s,
        click: () => { scaleName = s; if (win) win.webContents.send('scale:set', SCALES[s]); }
      }))
    },
    { label: t('跳一下', 'Hop'), click: () => win && win.webContents.send('pet:react', 'hop') },
    ...(ROLL_PETS.has(currentPet)
      ? [{ label: t('转手', 'Roll hands'), click: () => win && win.webContents.send('pet:react', 'roll') }]
      : []),
    { type: 'separator' },
    { label: t('退出', 'Quit') + ' ' + petLabel(currentPet), click: () => app.quit() }
  ];
  Menu.buildFromTemplate(tmpl).popup({ window: win });
});

// ---------- cursor follow ----------
function startLook() {
  stopLook();
  lookTimer = setInterval(() => {
    if (!win || dragging || !settings.follow) return;
    const c = screen.getCursorScreenPoint();
    const b = win.getBounds();
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height * 0.42; // around the face
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const dx = clamp((c.x - cx) / 360);
    const dy = clamp((c.y - cy) / 360);
    if (Math.abs(dx - lastLook.dx) > 0.03 || Math.abs(dy - lastLook.dy) > 0.03) {
      lastLook = { dx, dy };
      win.webContents.send('pet:look', { dx, dy });
    }
  }, 80);
}
function stopLook() { if (lookTimer) { clearInterval(lookTimer); lookTimer = null; } }

// ---------- wander / edge-walk ----------
function scheduleWalk() {
  clearTimeout(walkPlan);
  if (!settings.wander) return;
  const delay = 6000 + Math.random() * 9000;
  walkPlan = setTimeout(startWalk, delay);
}
function startWalk() {
  if (!win || dragging || !settings.wander) { scheduleWalk(); return; }
  const b = win.getBounds();
  const area = screen.getDisplayNearestPoint({ x: b.x + b.width / 2, y: b.y + b.height / 2 }).workArea;
  // Prefer a direction that actually has room, so the pet doesn't "run" in place
  // against a screen edge (which made it look like only one direction animated).
  const roomLeft = b.x - area.x;
  const roomRight = (area.x + area.width - b.width) - b.x;
  let dir = Math.random() < 0.5 ? -1 : 1;
  if (dir === 1 && roomRight < 60) dir = -1;
  else if (dir === -1 && roomLeft < 60) dir = 1;
  const distance = 80 + Math.random() * 220;
  let targetX = b.x + dir * distance;
  targetX = Math.min(Math.max(targetX, area.x), area.x + area.width - b.width);
  const realDir = targetX >= b.x ? 1 : -1;
  win.webContents.send('pet:walk', { dir: realDir });
  const speed = PET_SPEED[currentPet] || 2; // usagi runs faster (it has a real run cycle)
  clearInterval(walkTimer);
  walkTimer = setInterval(() => {
    if (!win || dragging) { stopWalk(); return; }
    const cur = win.getBounds();
    const remaining = targetX - cur.x;
    if (Math.abs(remaining) <= speed) { stopWalk(); return; }
    win.setPosition(Math.round(cur.x + Math.sign(remaining) * speed), cur.y);
  }, 16);
}
function stopWalk() {
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null; }
  if (win) win.webContents.send('pet:walk-stop');
  scheduleWalk();
}

// ---------- app lifecycle ----------
app.on('window-all-closed', () => app.quit());
app.whenReady().then(() => {
  createWindow();
  win.webContents.once('did-finish-load', () => {
    if (settings.follow) startLook();
    scheduleWalk();
  });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
