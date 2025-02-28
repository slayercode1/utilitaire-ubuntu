import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

/**
 * Liste des répertoires contenant les fichiers .desktop (applications installées)
 */
const desktopDirs: string[] = [
	"/usr/share/applications",
	"/usr/local/share/applications",
	"/var/lib/snapd/desktop/applications",
	path.join(process.env.HOME || "", ".local/share/applications"),
];

/**
 * Liste des répertoires où chercher les icônes
 */
const iconDirs: string[] = [
	"/usr/share/icons",
	"/usr/share/pixmaps",
	"/usr/local/share/icons",
	path.join(process.env.HOME || "", ".local/share/icons"),
	"/var/lib/snapd/desktop/icons",
];

/**
 * Extensions d'icônes courantes
 */
const iconExtensions: string[] = [".png", ".svg", ".xpm", ".ico"];

/**
 * Dossiers de tailles possibles pour les icônes dans les thèmes
 */
const sizeDirs: string[] = [
	"scalable",
	"48x48",
	"64x64",
	"128x128",
	"256x256",
	"32x32",
	"16x16",
];

// Cache pour les chemins d'icônes déjà trouvés
const iconPathCache = new Map<string, string>();

interface AppInfo {
	name: string;
	exec: string;
	iconPath: string;
}

/**
 * Récupère tous les fichiers .desktop dans les répertoires standards
 * Utilise une vérification synchrone d'existence avant de lire le répertoire
 */
async function getDesktopFiles(): Promise<string[]> {
	const desktopFiles: string[] = [];

	const dirPromises = desktopDirs
		.filter((dir) => existsSync(dir)) // Vérification synchrone d'abord
		.map(async (dir) => {
			try {
				const files = await fs.readdir(dir);
				return files
					.filter((file) => file.endsWith(".desktop"))
					.map((file) => path.join(dir, file));
			} catch {
				return [];
			}
		});

	const results = await Promise.all(dirPromises);
	results.forEach((files) => desktopFiles.push(...files));

	return desktopFiles;
}

/**
 * Vérifie l'existence d'un fichier de manière synchrone pour éviter des opérations async inutiles
 */
function fileExistsSync(filePath: string): boolean {
	try {
		return existsSync(filePath);
	} catch {
		return false;
	}
}

/**
 * Trouve le chemin complet d'une icône en recherchant dans les répertoires définis
 * Utilise un cache pour éviter de rechercher plusieurs fois la même icône
 */
async function findIconPath(iconName: string): Promise<string> {
	if (!iconName) return "";

	// Vérifier le cache d'abord
	if (iconPathCache.has(iconName)) {
		return iconPathCache.get(iconName)!;
	}

	// Si un chemin absolu est fourni, vérifier son existence de manière synchrone
	if (iconName.startsWith("/") && fileExistsSync(iconName)) {
		iconPathCache.set(iconName, iconName);
		return iconName;
	}

	// Chercher directement dans les dossiers d'icônes avec les extensions
	for (const dir of iconDirs) {
		if (!existsSync(dir)) continue;

		// Vérifier si le fichier existe avec extension
		for (const ext of iconExtensions) {
			const possiblePath = path.join(dir, `${iconName}${ext}`);
			if (fileExistsSync(possiblePath)) {
				iconPathCache.set(iconName, possiblePath);
				return possiblePath;
			}
		}
	}

	// Recherche plus approfondie seulement si nécessaire (approche plus lente)
	for (const dir of iconDirs) {
		if (!existsSync(dir)) continue;

		try {
			const themeDirs = await fs.readdir(dir);
			const themeSearchPromises = themeDirs.map(async (themeDir) => {
				const themeIconsPath = path.join(dir, themeDir);
				if (!fileExistsSync(themeIconsPath)) return null;

				const stats = await fs.stat(themeIconsPath).catch(() => null);
				if (!stats?.isDirectory()) return null;

				for (const sizeDir of sizeDirs) {
					const appsIconPath = path.join(themeIconsPath, sizeDir, "apps");
					if (!fileExistsSync(appsIconPath)) continue;

					for (const ext of iconExtensions) {
						const possiblePath = path.join(appsIconPath, `${iconName}${ext}`);
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
		} catch {}
	}

	// Mettre en cache le résultat négatif aussi
	iconPathCache.set(iconName, "");
	return "";
}

/**
 * Analyse le contenu d'un fichier .desktop et extrait les informations nécessaires
 * Utilise des expressions régulières précompilées
 */
const nameRegex = /^Name=(.+)$/m;
const execRegex = /^Exec=(.+)$/m;
const iconRegex = /^Icon=(.+)$/m;
const noDisplayRegex = /^NoDisplay=(.+)$/m;

async function parseDesktopFile(filePath: string): Promise<AppInfo | null> {
	try {
		const content = await fs.readFile(filePath, "utf-8");
		const nameMatch = content.match(nameRegex);
		const execMatch = content.match(execRegex);
		const iconMatch = content.match(iconRegex);
		const noDisplayMatch = content.match(noDisplayRegex);

		if (
			!nameMatch ||
			!execMatch ||
			(noDisplayMatch && noDisplayMatch[1].toLowerCase() === "true")
		) {
			return null;
		}

		const exec = execMatch[1].replace(/%[fFuU]/g, "").trim();
		const iconName = iconMatch ? iconMatch[1] : "";

		return {
			name: nameMatch[1],
			exec,
			iconPath: await findIconPath(iconName),
		};
	} catch {
		return null;
	}
}

/**
 * Récupère toutes les applications installées sur le système Linux avec des optimisations
 * @returns {Promise<AppInfo[]>} Liste des applications trouvées
 */
export async function findAllApplications(searchTerm = ""): Promise<AppInfo[]> {

	// Récupérer tous les fichiers .desktop
	const desktopFiles = await getDesktopFiles();

	// Analyser les fichiers en parallèle
	const applications = (
		await Promise.all(desktopFiles.map(parseDesktopFile))
	).filter(Boolean) as AppInfo[];

	// Filtrer et dédupliquer
	const appMap = new Map<string, AppInfo>();
	applications.forEach((app) => {
		const key = `${app.name}|${app.exec}`;
		if (
			!searchTerm ||
			app.name.toLowerCase().includes(searchTerm.toLowerCase())
		) {
			appMap.set(key, app);
		}
	});

	// Convertir en tableau et trier
	return Array.from(appMap.values()).sort((a, b) =>
		a.name.localeCompare(b.name),
	);
}
