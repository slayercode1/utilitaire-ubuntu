import { app as c, powerSaveBlocker as R, globalShortcut as T, BrowserWindow as j, Tray as L, Menu as C, screen as b, ipcMain as E, nativeImage as O } from "electron";
import * as w from "node:path";
import a from "node:path";
import { fileURLToPath as F } from "node:url";
import { exec as V } from "node:child_process";
import * as d from "node:fs";
import { existsSync as m } from "node:fs";
import y from "node:fs/promises";
const U = [
  "/usr/share/applications",
  "/usr/local/share/applications",
  "/var/lib/snapd/desktop/applications",
  a.join(process.env.HOME || "", ".local/share/applications")
], D = [
  "/usr/share/icons",
  "/usr/share/pixmaps",
  "/usr/local/share/icons",
  a.join(process.env.HOME || "", ".local/share/icons"),
  "/var/lib/snapd/desktop/icons"
], v = [".png", ".svg", ".xpm", ".ico"], B = [
  "scalable",
  "48x48",
  "64x64",
  "128x128",
  "256x256",
  "32x32",
  "16x16"
], l = /* @__PURE__ */ new Map();
async function q() {
  const t = [], o = U.filter((n) => m(n)).map(async (n) => {
    try {
      return (await y.readdir(n)).filter((s) => s.endsWith(".desktop")).map((s) => a.join(n, s));
    } catch {
      return [];
    }
  });
  return (await Promise.all(o)).forEach((n) => t.push(...n)), t;
}
function h(t) {
  try {
    return m(t);
  } catch {
    return !1;
  }
}
async function z(t) {
  if (!t) return "";
  if (l.has(t))
    return l.get(t);
  if (t.startsWith("/") && h(t))
    return l.set(t, t), t;
  for (const o of D)
    if (m(o))
      for (const r of v) {
        const n = a.join(o, `${t}${r}`);
        if (h(n))
          return l.set(t, n), n;
      }
  for (const o of D)
    if (m(o))
      try {
        const n = (await y.readdir(o)).map(async (p) => {
          const u = a.join(o, p);
          if (!h(u)) return null;
          const g = await y.stat(u).catch(() => null);
          if (!(g != null && g.isDirectory())) return null;
          for (const S of B) {
            const k = a.join(u, S, "apps");
            if (h(k))
              for (const $ of v) {
                const _ = a.join(k, `${t}${$}`);
                if (h(_))
                  return _;
              }
          }
          return null;
        }), s = (await Promise.all(n)).find((p) => p !== null);
        if (s)
          return l.set(t, s), s;
      } catch {
      }
  return l.set(t, ""), "";
}
const W = /^Name=(.+)$/m, H = /^Exec=(.+)$/m, G = /^Icon=(.+)$/m, Q = /^NoDisplay=(.+)$/m;
async function X(t) {
  try {
    const o = await y.readFile(t, "utf-8"), r = o.match(W), n = o.match(H), i = o.match(G), s = o.match(Q);
    if (!r || !n || s && s[1].toLowerCase() === "true")
      return null;
    const p = n[1].replace(/%[fFuU]/g, "").trim(), u = i ? i[1] : "";
    return {
      name: r[1],
      exec: p,
      iconPath: await z(u)
    };
  } catch {
    return null;
  }
}
async function J(t = "") {
  const o = await q(), r = (await Promise.all(o.map(X))).filter(Boolean), n = /* @__PURE__ */ new Map();
  return r.forEach((i) => {
    const s = `${i.name}|${i.exec}`;
    (!t || i.name.toLowerCase().includes(t.toLowerCase())) && n.set(s, i);
  }), Array.from(n.values()).sort(
    (i, s) => i.name.localeCompare(s.name)
  );
}
function K(t) {
  if (process.platform === "linux") {
    const o = c.getName(), r = c.getPath("exe"), n = w.join(c.getPath("home"), ".config", "autostart"), i = w.join(n, `${o}.desktop`);
    try {
      if (d.existsSync(n) || d.mkdirSync(n, { recursive: !0 }), t) {
        const s = `[Desktop Entry]
  Type=Application
  Name=${o}
  Exec=${r}
  Icon=${w.join(process.env.VITE_PUBLIC, "logo2.png")}
  Comment=Application lancée automatiquement
  X-GNOME-Autostart-enabled=true`;
        d.writeFileSync(i, s);
      }
    } catch (s) {
      console.error("Erreur lors de la configuration de l'autostart:", s);
    }
  }
}
const M = a.dirname(F(import.meta.url));
process.env.APP_ROOT = a.join(M, "..");
const x = process.env.VITE_DEV_SERVER_URL, se = a.join(process.env.APP_ROOT, "dist-electron"), A = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = x ? a.join(process.env.APP_ROOT, "public") : A;
c.requestSingleInstanceLock() || c.quit();
let e = null, P, f = null;
c.whenReady().then(() => {
  process.platform === "darwin" && c.dock.hide(), Y(), I(), K(!0), P = R.start("prevent-app-suspension"), T.register("Alt+Space", () => {
    e == null || e.show();
  }), c.on("activate", () => {
    j.getAllWindows().length === 0 && I();
  });
});
function Y() {
  const t = a.join(process.env.VITE_PUBLIC, "logo.png");
  f = new L(t);
  const o = C.buildFromTemplate([
    {
      label: "Afficher",
      click: () => {
        e == null || e.show();
      }
    },
    {
      label: "Quitter",
      click: () => {
        c.quit();
      }
    }
  ]);
  f.setToolTip("prog-finder"), f.setContextMenu(o), f.on("click", () => {
    e && (e != null && e.isVisible() ? e.hide() : e.show());
  });
}
function I() {
  const { width: t, height: o } = b.getPrimaryDisplay().workAreaSize, r = Math.round((t - 700) / 2), n = Math.round((o - 400) / 2);
  e = new j({
    icon: a.join(process.env.VITE_PUBLIC, "logo2.png"),
    webPreferences: {
      preload: a.join(M, "preload.mjs"),
      nodeIntegration: !0,
      backgroundThrottling: !1
    },
    width: 700,
    height: 400,
    frame: !1,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    resizable: !1,
    transparent: !0,
    show: !1,
    x: r,
    y: n,
    type: "toolbar"
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), x ? e.loadURL(x) : e.loadFile(a.join(A, "index.html")), e && e.on("hide", () => {
    e && e.setBounds({ width: 1, height: 1, x: -1e3, y: -1e3 }), e && e.setOpacity(0);
  }), e.on("show", () => {
    const { width: i, height: s } = b.getPrimaryDisplay().workAreaSize;
    e && e.setBounds({
      width: 700,
      height: 400,
      x: Math.round((i - 700) / 2),
      y: Math.round((s - 400) / 2)
    }), e && e.setOpacity(1);
  }), e.on("blur", () => {
    e && e.hide();
  }), e.webContents.on("before-input-event", (i, s) => {
    s.key === "Escape" && e && e.hide();
  });
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), e = null);
});
c.on("will-quit", () => {
  T.unregisterAll(), P !== void 0 && R.stop(P);
});
E.handle("get-installed-apps", async (t, o = "") => {
  try {
    return await J(o);
  } catch (r) {
    return console.error("Erreur lors de la recherche des applications:", r), [];
  }
});
E.handle("launch-app", async (t, o) => new Promise((r, n) => {
  V(`${o.exec} &`, (i) => {
    i ? (console.error("Erreur lors du lancement de l'application:", i), n(i)) : r(!0);
  });
}));
E.handle("get-app-icon", async (t, o) => {
  try {
    if (!o || !d.existsSync(o)) return null;
    const r = O.createFromPath(o);
    return r.isEmpty() ? null : r.resize({ width: 48, height: 48 }).toDataURL();
  } catch (r) {
    return console.error("Erreur lors du chargement de l'icône:", r), null;
  }
});
export {
  se as MAIN_DIST,
  A as RENDERER_DIST,
  x as VITE_DEV_SERVER_URL
};
