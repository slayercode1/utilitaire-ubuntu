import { useState, useEffect } from "react";
import type { AppInfoWithIcon } from "../interfaces/app-info";

export function ListApp({
	apps,
	isLoading,
	status,
	handleLaunch,
	listHeightClass,
}: {
	apps: AppInfoWithIcon[];
	isLoading: boolean;
	status: string | null;
	handleLaunch: (app: AppInfoWithIcon) => void;
	listHeightClass: string;
}) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (apps.length === 0) return;

			if (event.key === "ArrowDown") {
				setSelectedIndex((prevIndex) => (prevIndex + 1) % apps.length);
			} else if (event.key === "ArrowUp") {
				setSelectedIndex(
					(prevIndex) => (prevIndex - 1 + apps.length) % apps.length,
				);
			} else if (event.key === "Enter") {
				handleLaunch(apps[selectedIndex]);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [apps, selectedIndex, handleLaunch]);

	return (
		<>
			{!isLoading && apps.length > 0 && (
				<ul
					className={`divide-y divide-gray-200 overflow-auto no-scrollbar ${listHeightClass}`}
				>
					{apps.map((app, index) => (
						<li
							key={app.name}
							className={`flex items-center p-2 cursor-pointer ${
								selectedIndex === index ? "bg-blue-600" : ""
							}`}
							onKeyUp={(event) => {
								if (event.key === "Enter") {
                  console.log('enter')
									handleLaunch(app);
								}
							}}
						>
							<div className="flex-shrink-0 w-10 h-10 text-white flex items-center justify-center font-semibold">
								<img src={app.iconDataUrl as string} alt={app.name} />
							</div>
							<div className="ml-4 flex-1">
								<div className="font-medium text-white">{app.name}</div>
							</div>
						</li>
					))}
				</ul>
			)}

			{!isLoading && status && (
				<div className="p-3 text-white rounded-md">{status}</div>
			)}
		</>
	);
}
