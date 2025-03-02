import { useEffect, useState, useCallback, useMemo } from "react";
import { InputSearch } from "../components/search-input";
import type { AppInfoWithIcon } from "../interfaces/app-info";
import { ListApp } from "../components/list-app";

function App() {
	const [apps, setApps] = useState<AppInfoWithIcon[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [status, setStatus] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [_, setIsFormulaDetected] = useState<boolean>(false);
	const [searchOnGoogle, setSearchOnGoogle] = useState<boolean>(false);
	const [url, setUrl] = useState<string>('');

	// Memoizing search logic to avoid unnecessary re-renders
	const debouncedSearch = useCallback(
		(() => {
			let timeout: NodeJS.Timeout | null = null;
			return (term: string) => {
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => searchApps(term), 300);
			};
		})(),
		[],
	);

	// Rechercher des applications
	const searchApps = useCallback(async (term: string) => {
		if (!term.trim()) {
			setApps([]);
			setStatus("");
			setSearchOnGoogle(false);
			setUrl('');
			return;
		}

		setIsLoading(true);
		setStatus("");

		try {
			const result = await (window.ipcRenderer as any).getInstalledApps(term);
			if (result.length > 0) {
				const sortedApps = result.sort(
					(a: AppInfoWithIcon, b: AppInfoWithIcon) =>
						a.name.localeCompare(b.name),
				);
				// Charger les icônes pour chaque application
				const appsWithIcons = await Promise.all(
					sortedApps.map(async (app: AppInfoWithIcon) => {
						let iconDataUrl = null;

						if (app.iconPath) {
							iconDataUrl = await (window.ipcRenderer as any).getAppIcon(app.iconPath);
						}

						return {
							...app,
							iconDataUrl,
						};
					}),
				);

				setApps(appsWithIcons);
				setStatus("");
			} else {
				setApps([]);
				// ✅ Utilisation de la version fonctionnelle pour s'assurer d'avoir la valeur actuelle
				setIsFormulaDetected((prev) => {
					if (!prev) {
						const url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
						setSearchOnGoogle(true);
						setUrl(url);
					} 
					
					return prev;
				});
			}
		} catch (error) {
			setStatus(
				"Une erreur est survenue lors de la recherche des applications",
			);
			setApps([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Lancer une application
	const handleLaunch = useCallback(async (app: AppInfoWithIcon) => {
		try {
			await (window.ipcRenderer as any).launchApp(app);
			setSearchTerm("");
			setSearchOnGoogle(false);
			setUrl('');
			setApps([]);
		} catch (error) {
			setStatus(`Impossible de lancer ${app.name}`);
		}
	}, []);

	// Effect pour gérer les changements de terme de recherche
	useEffect(() => {
		debouncedSearch(searchTerm);

		// Nettoyage du timeout lors du démontage
		return () => {
			debouncedSearch("");
		};
	}, [searchTerm, debouncedSearch]);

	// Memoizing the search input handler
	const handleSearch = useCallback((term: string) => {
		setSearchTerm(term);
	}, []);

	// Calculate list height based on items count - only recalculate when apps change
	const listHeightClass = useMemo(
		() => (apps.length > 10 ? "h-64" : "h-auto"),
		[apps.length],
	);

	const handleSearchOnGoogle = useCallback((url: string) => {
		
		(window.ipcRenderer as any).openLink(url)
		setSearchOnGoogle(false);
		setUrl('');
		setSearchTerm('');
	}, [])

	return (
		<div className="flex justify-center items-center bg-opacity-50">
			<div className="w-screen bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
				<InputSearch searchTerm={searchTerm} handleSearch={handleSearch} setIsFormulaDetected={setIsFormulaDetected} />

				<ListApp
					apps={apps}
					isLoading={isLoading}
					status={status}
					handleLaunch={handleLaunch}
					listHeightClass={listHeightClass}
					searchOnGoogle={searchOnGoogle}
					url={url}
					handleSearch={handleSearchOnGoogle}
				/>
			</div>
		</div>
	);
}

export default App;
