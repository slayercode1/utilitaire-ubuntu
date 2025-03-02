import { app, powerSaveBlocker, globalShortcut, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } from "electron";
import * as path from "node:path";
import path__default from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import * as fs from "node:fs";
import { existsSync } from "node:fs";
import fs$1 from "node:fs/promises";
const desktopDirs = [
  "/usr/share/applications",
  "/usr/local/share/applications",
  "/var/lib/snapd/desktop/applications",
  path__default.join(process.env.HOME || "", ".local/share/applications")
];
const iconDirs = [
  "/usr/share/icons",
  "/usr/share/pixmaps",
  "/usr/local/share/icons",
  path__default.join(process.env.HOME || "", ".local/share/icons"),
  "/var/lib/snapd/desktop/icons"
];
const iconExtensions = [".png", ".svg", ".xpm", ".ico"];
const sizeDirs = [
  "scalable",
  "48x48",
  "64x64",
  "128x128",
  "256x256",
  "32x32",
  "16x16"
];
const iconPathCache = /* @__PURE__ */ new Map();
async function getDesktopFiles() {
  const desktopFiles = [];
  const dirPromises = desktopDirs.filter((dir) => existsSync(dir)).map(async (dir) => {
    try {
      const files = await fs$1.readdir(dir);
      return files.filter((file) => file.endsWith(".desktop")).map((file) => path__default.join(dir, file));
    } catch {
      return [];
    }
  });
  const results = await Promise.all(dirPromises);
  results.forEach((files) => desktopFiles.push(...files));
  return desktopFiles;
}
function fileExistsSync(filePath) {
  try {
    return existsSync(filePath);
  } catch {
    return false;
  }
}
async function findIconPath(iconName) {
  if (!iconName) return "";
  if (iconPathCache.has(iconName)) {
    return iconPathCache.get(iconName);
  }
  if (iconName.startsWith("/") && fileExistsSync(iconName)) {
    iconPathCache.set(iconName, iconName);
    return iconName;
  }
  for (const dir of iconDirs) {
    if (!existsSync(dir)) continue;
    for (const ext of iconExtensions) {
      const possiblePath = path__default.join(dir, `${iconName}${ext}`);
      if (fileExistsSync(possiblePath)) {
        iconPathCache.set(iconName, possiblePath);
        return possiblePath;
      }
    }
  }
  for (const dir of iconDirs) {
    if (!existsSync(dir)) continue;
    try {
      const themeDirs = await fs$1.readdir(dir);
      const themeSearchPromises = themeDirs.map(async (themeDir) => {
        const themeIconsPath = path__default.join(dir, themeDir);
        if (!fileExistsSync(themeIconsPath)) return null;
        const stats = await fs$1.stat(themeIconsPath).catch(() => null);
        if (!(stats == null ? void 0 : stats.isDirectory())) return null;
        for (const sizeDir of sizeDirs) {
          const appsIconPath = path__default.join(themeIconsPath, sizeDir, "apps");
          if (!fileExistsSync(appsIconPath)) continue;
          for (const ext of iconExtensions) {
            const possiblePath = path__default.join(appsIconPath, `${iconName}${ext}`);
            if (fileExistsSync(possiblePath)) {
              return possiblePath;
            }
          }
        }
        return null;
      });
      const results = await Promise.all(themeSearchPromises);
      const foundPath = results.find((p) => p !== null);
      if (foundPath) {
        iconPathCache.set(iconName, foundPath);
        return foundPath;
      }
    } catch {
    }
  }
  iconPathCache.set(iconName, "");
  return "";
}
const nameRegex = /^Name=(.+)$/m;
const execRegex = /^Exec=(.+)$/m;
const iconRegex = /^Icon=(.+)$/m;
const noDisplayRegex = /^NoDisplay=(.+)$/m;
async function parseDesktopFile(filePath) {
  try {
    const content = await fs$1.readFile(filePath, "utf-8");
    const nameMatch = content.match(nameRegex);
    const execMatch = content.match(execRegex);
    const iconMatch = content.match(iconRegex);
    const noDisplayMatch = content.match(noDisplayRegex);
    if (!nameMatch || !execMatch || noDisplayMatch && noDisplayMatch[1].toLowerCase() === "true") {
      return null;
    }
    const exec2 = execMatch[1].replace(/%[fFuU]/g, "").trim();
    const iconName = iconMatch ? iconMatch[1] : "";
    return {
      name: nameMatch[1],
      exec: exec2,
      iconPath: await findIconPath(iconName)
    };
  } catch {
    return null;
  }
}
async function findAllApplications(searchTerm = "") {
  const desktopFiles = await getDesktopFiles();
  const applications = (await Promise.all(desktopFiles.map(parseDesktopFile))).filter(Boolean);
  const appMap = /* @__PURE__ */ new Map();
  applications.forEach((app2) => {
    const key = `${app2.name}|${app2.exec}`;
    if (!searchTerm || app2.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      appMap.set(key, app2);
    }
  });
  return Array.from(appMap.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
}
function setAutoLaunch(enabled) {
  if (process.platform === "linux") {
    const appName = app.getName();
    const appPath = app.getPath("exe");
    const autostartDir = path.join(app.getPath("home"), ".config", "autostart");
    const autostartFile = path.join(autostartDir, `${appName}.desktop`);
    try {
      if (!fs.existsSync(autostartDir)) {
        fs.mkdirSync(autostartDir, { recursive: true });
      }
      if (enabled) {
        const desktopEntry = `[Desktop Entry]
  Type=Application
  Name=${appName}
  Exec=${appPath}
  Icon=${path.join(process.env.VITE_PUBLIC, "logo2.png")}
  Comment=Application lancée automatiquement
  X-GNOME-Autostart-enabled=true`;
        fs.writeFileSync(autostartFile, desktopEntry);
      }
    } catch (error) {
      console.error("Erreur lors de la configuration de l'autostart:", error);
    }
  }
}
const __dirname = path__default.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path__default.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path__default.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path__default.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path__default.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
if (!app.requestSingleInstanceLock()) {
  app.quit();
}
let win = null;
let blockerId;
let tray = null;
app.whenReady().then(() => {
  if (process.platform === "darwin") {
    app.dock.hide();
  }
  createTray();
  createWindow();
  setAutoLaunch(true);
  blockerId = powerSaveBlocker.start("prevent-app-suspension");
  globalShortcut.register("Alt+Space", () => {
    win == null ? void 0 : win.show();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
function createTray() {
  const iconPath = path__default.join(process.env.VITE_PUBLIC, "logo.png");
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Afficher",
      click: () => {
        win == null ? void 0 : win.show();
      }
    },
    {
      label: "Quitter",
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setToolTip("prog-finder");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (win) (win == null ? void 0 : win.isVisible()) ? win.hide() : win.show();
  });
}
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const x = Math.round((width - 700) / 2);
  const y = Math.round((height - 400) / 2);
  console.log(path__default.join(process.env.VITE_PUBLIC, "logo2.png"));
  win = new BrowserWindow({
    icon: path__default.join(process.env.VITE_PUBLIC, "logo2.png"),
    webPreferences: {
      preload: path__default.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      backgroundThrottling: false
    },
    width: 700,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    show: false,
    x,
    y,
    type: "toolbar"
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path__default.join(RENDERER_DIST, "index.html"));
  }
  if (win)
    win.on("hide", () => {
      if (win) win.setBounds({ width: 1, height: 1, x: -1e3, y: -1e3 });
      if (win) win.setOpacity(0);
    });
  win.on("show", () => {
    const { width: width2, height: height2 } = screen.getPrimaryDisplay().workAreaSize;
    if (win) win.setBounds({
      width: 700,
      height: 400,
      x: Math.round((width2 - 700) / 2),
      y: Math.round((height2 - 400) / 2)
    });
    if (win) win.setOpacity(1);
  });
  win.on("blur", () => {
    if (win) win.hide();
  });
  win.webContents.on("before-input-event", (_, input) => {
    if (input.key === "Escape") {
      if (win) win.hide();
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (blockerId !== void 0) powerSaveBlocker.stop(blockerId);
});
ipcMain.handle("get-installed-apps", async (_, searchTerm = "") => {
  try {
    return await findAllApplications(searchTerm);
  } catch (error) {
    console.error("Erreur lors de la recherche des applications:", error);
    return [];
  }
});
ipcMain.handle("launch-app", async (_, appInfo) => {
  return new Promise((resolve, reject) => {
    exec(`${appInfo.exec} &`, { detached: true, stdio: "ignore" }, (error) => {
      if (error) {
        console.error("Erreur lors du lancement de l'application:", error);
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
});
ipcMain.handle("get-app-icon", async (_, iconPath) => {
  try {
    if (!iconPath || !fs.existsSync(iconPath)) return null;
    const image = nativeImage.createFromPath(iconPath);
    return image.isEmpty() ? null : image.resize({ width: 48, height: 48 }).toDataURL();
  } catch (error) {
    console.error("Erreur lors du chargement de l'icône:", error);
    return null;
  }
});
ipcMain.on("open-link", (event, url) => {
  console.log("Opening link:", url);
  exec(`xdg-open ${url}`);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
