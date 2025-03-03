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
import {spawn } from "node:child_process";
import * as fs from "node:fs";
import { findAllApplications } from "./findApplication";
import { setAutoLaunch } from "./autolauch";
import { findFiles } from "./findFile";

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

let icon = path.join(process.env.VITE_PUBLIC, "logo.png")
if (process.platform === 'win32') {
  icon = path.join(process.env.VITE_PUBLIC,"generated", "icon.ico")
} else if (process.platform === 'darwin') {
  icon = path.join(process.env.VITE_PUBLIC,"generated", "icon.icns")
}


function createWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const x = Math.round((width - 700) / 2);
	const y = Math.round((height - 400) / 2);
	
	win = new BrowserWindow({
		icon,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: true,
			backgroundThrottling: false,
		},
		width: 600,
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
			width: 600,
			height: 400,
			x: Math.round((width - 600) / 2),
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
		const [apps, files] = await Promise.all([
			findAllApplications(searchTerm),
			findFiles(searchTerm),
		  ]);
		  return [...apps, ...files];
	} catch (error) {
		console.error("Erreur lors de la recherche des applications:", error);
		return [];
	}
});


ipcMain.handle("launch-app", async (_, appInfo) => {
    return new Promise((resolve, reject) => {
        const child = spawn(appInfo.exec, [], {
            detached: true,
            stdio: 'ignore',
            shell: true
        });

        child.unref(); // Permet au processus enfant de continuer à s'exécuter même si le processus parent se termine

        child.on('error', (error) => {
            console.error("Erreur lors du lancement de l'application:", error);
            reject(error);
        });

        child.on('spawn', () => {
            resolve(true);
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

ipcMain.on('open-link', (_, url) => {
    const child = spawn('xdg-open', [url], {
        detached: true,
        stdio: 'ignore',
        shell: true
    });

    child.unref(); // Permet au processus enfant de continuer à s'exécuter même si le processus parent se termine
});

// Pour ouvrir un fichier avec l'application appropriée
ipcMain.handle("open-file", async (_, filePath) => {
	return new Promise((resolve, reject) => {
	  try {

		const extension = path.extname(filePath).toLowerCase();
		let child: any;

		if (extension === '.jar') {
			child = spawn("java", ["-jar", filePath], {
				detached: true,
				stdio: "ignore",
				shell: true,
			});
	
			child.unref(); // Permet au processus enfant de
		} else if (['.jpg', '.jpeg', '.png',].includes(extension)) {

			console.log('opening image' + filePath)
			child = spawn("eog", [`"${filePath}"`], {
				detached: true,
				stdio: "ignore",
				shell: true,
			});
	
			child.unref(); // Permet au processus enfant de
		} else if (['.js', '.py', '.java', '.html', '.css', '.ts', '.jsx', '.tsx', '.sh'].includes(extension)) {
			try {
				// D'abord essayer VSCode
				child = spawn('code', [filePath], {
				  detached: true,
				  stdio: 'ignore'
				});
			  } catch {
				// Essayer d'autres éditeurs courants
				const editors = ['webstorm', 'gedit', 'kate', 'geany', 'atom', 'sublime_text'];
				for (const editor of editors) {
				  try {
					child = spawn(editor, [filePath], {
					  detached: true,
					  stdio: 'ignore'
					});
					break;
				  } catch (e) {
					continue;
				  }
				}
			  }
		} else {
			child = spawn("xdg-open", [filePath], {
				detached: true,
				stdio: "ignore",
				shell: true,
			});
		}
  
		child.unref(); // Permet au processus enfant de continuer à s'exécuter même si le processus parent se termine
  
		child.on("error", (error: any) => {
		  console.error("Erreur lors de l'ouverture du fichier:", error);
		  reject(error);
		});
  
		child.on("spawn", () => {
		  resolve(true);
		});
	  } catch (error) {
		console.error("Erreur lors de l'ouverture du fichier:", error);
		reject(error);
	  }
	});
  });