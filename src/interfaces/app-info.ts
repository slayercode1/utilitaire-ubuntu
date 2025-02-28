import type { AppInfo } from "../../electron/main";

export interface AppInfoWithIcon extends AppInfo {
	iconDataUrl?: string | null;
}