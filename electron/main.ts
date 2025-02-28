import {
	app,
	BrowserWindow,
	globalShortcut,
	ipcMain,
	Menu,
	nativeImage,
	powerSaveBlocker,
	screen,
	Tray,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import * as fs from "node:fs";
import { findAllApplications } from "./findApplication";
import { setAutoLaunch } from "./autolauch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public")
	: RENDERER_DIST;

// Interface pour les informations des applications
export interface AppInfo {
	name: string;
	exec: string;
	iconPath?: string;
}

// Empêcher les instances multiples de l'application
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

let win: BrowserWindow | null = null;
let blockerId: number | undefined;
let tray: Tray | null = null;

app.whenReady().then(() => {
	if (process.platform === "darwin") {
		app.dock.hide();
	}
	createTray();

	createWindow();
	setAutoLaunch(true);
	blockerId = powerSaveBlocker.start("prevent-app-suspension");

	globalShortcut.register("Alt+Space", () => {
		win?.show();
	});

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

function createTray() {
	const iconPath = path.join(process.env.VITE_PUBLIC, "logo.png") // Remplace avec ton icône
	tray = new Tray(iconPath);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Afficher",
			click: () => {
				win?.show();
			},
		},
		{
			label: "Quitter",
			click: () => {
				app.quit();
			},
		},
	]);

	tray.setToolTip("prog-finder");
	tray.setContextMenu(contextMenu);

	tray.on("click", () => {
		if (win) win?.isVisible() ? win.hide() : win.show();
	});
}


function createWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const x = Math.round((width - 700) / 2);
	const y = Math.round((height - 400) / 2);
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, "logo2.png"),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: true,
			backgroundThrottling: false,
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
		type: "toolbar",
	});

	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
 
	if (win)

	win.on("hide", () => {
		if (win) win.setBounds({ width: 1, height: 1, x: -1000, y: -1000 });
		if (win) win.setOpacity(0);
	});

	win.on("show", () => {
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		if (win) win.setBounds({
			width: 700,
			height: 400,
			x: Math.round((width - 700) / 2),
			y: Math.round((height - 400) / 2),
		});
		if (win) win.setOpacity(1);
	});

	win.on("blur", () => {if (win) win.hide()});

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
	if (blockerId !== undefined) powerSaveBlocker.stop(blockerId);
});

ipcMain.handle("get-installed-apps", async (_, searchTerm = "") => {
	try {
		return await findAllApplications(searchTerm);
	} catch (error) {
		console.error("Erreur lors de la recherche des applications:", error);
		return [];
	}
});

ipcMain.handle("launch-app", async (_, appInfo: AppInfo) => {
	return new Promise((resolve, reject) => {
		exec(`${appInfo.exec} &`, (error) => {
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
		return image.isEmpty()
			? null
			: image.resize({ width: 48, height: 48 }).toDataURL();
	} catch (error) {
		console.error("Erreur lors du chargement de l'icône:", error);
		return null;
	}
});



  