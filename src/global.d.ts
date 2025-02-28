import type { AppInfo } from "../electron/main";

declare global {
	interface Window {
		ipcRenderer: {
      getInstalledApps(term: string): Promise<AppInfo[]>;
      launchApp(app: AppInfo): Promise<void>;
      getAppIcon(iconPath: string): Promise<string | null>;
		};
	}
}
