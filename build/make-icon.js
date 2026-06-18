'use strict';
/*
 * make-icon.js — render the app icon SVG to build/icon.png (1024x1024) using the
 * Electron/Chromium runtime that's already installed (no extra rasteriser dep).
 * electron-builder then turns icon.png into the platform .icns/.ico automatically.
 *
 * Run via:  electron build/make-icon.js     (see `npm run icon`)
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SVG = path.join(__dirname, '..', 'src', 'images', 'mybuddy_icon_rounded.svg');
const OUT = path.join(__dirname, 'icon.png');
const SIZE = 1024;

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const svg = fs.readFileSync(SVG, 'utf8');
  const win = new BrowserWindow({
    width: SIZE, height: SIZE, show: false, frame: false, transparent: true,
    useContentSize: true, backgroundColor: '#00000000',
    webPreferences: { offscreen: false }
  });
  const html = '<!doctype html><html><body style="margin:0;padding:0;background:transparent">' + svg + '</body></html>';
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 350));            // let layout settle
  let img = await win.webContents.capturePage();
  const sz = img.getSize();
  if (sz.width !== SIZE || sz.height !== SIZE) img = img.resize({ width: SIZE, height: SIZE, quality: 'best' });
  fs.writeFileSync(OUT, img.toPNG());
  console.log('wrote ' + path.relative(process.cwd(), OUT) + ' (' + SIZE + 'x' + SIZE + ', ' + (fs.statSync(OUT).size / 1024 | 0) + ' KB)');
  app.quit();
}).catch((e) => { console.error(e); app.exit(1); });
