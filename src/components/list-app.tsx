import { useState, useEffect, useRef } from "react";
import type { AppInfoWithIcon } from "../interfaces/app-info";
import { IconDefault } from '../assets/icon-default';

export function ListApp({
  apps,
  isLoading,
  status,
  handleLaunch,
  handleSearch,
  listHeightClass,
  searchOnGoogle,
  url
}: {
  apps: AppInfoWithIcon[];
  isLoading: boolean;
  status: string | null;
  handleLaunch: (app: AppInfoWithIcon) => void;
  handleSearch: (url: string) => void;
  listHeightClass: string;
  searchOnGoogle: boolean
  url: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
     

      if (event.key === "ArrowDown") {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % apps.length);
      } else if (event.key === "ArrowUp") {
        setSelectedIndex(
          (prevIndex) => (prevIndex - 1 + apps.length) % apps.length,
        );
      } else if (event.key === "Enter") {
        console.log('Enter key pressed');
        console.log('searchOnGoogle', searchOnGoogle);
        if (searchOnGoogle) {
          console.log('Launching Google search with URL:', url);
          handleSearch(url);
        } else {
          console.log('Launching app:', apps[selectedIndex].name);
          handleLaunch(apps[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [apps, selectedIndex, handleLaunch, handleSearch, searchOnGoogle, url]);

  // Sync scroll position with selected index
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        // Ensure the selected item is within the visible range by scrolling
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest", // Ensure it scrolls only when necessary
        });
      }
    }
  }, [selectedIndex]);

  return (
    <>
      {!isLoading && apps.length > 0 && (
        <ul
          ref={listRef}
          className={`divide-y divide-gray-200 overflow-auto no-scrollbar ${listHeightClass}`}
        >
          {apps.map((app, index) => (
            <li
              key={app.name}
              className={`flex items-center p-2 cursor-pointer ${selectedIndex === index ? "bg-blue-600" : ""
                }`}
              onClick={() => handleLaunch(app)}
            >
              <div className="flex-shrink-0 w-10 h-10 text-white flex items-center justify-center font-semibold">
                {
                  app.iconDataUrl ?

                    <img src={app.iconDataUrl as string} alt={app.name} />

                    :

                    <IconDefault />
                }
              </div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-white">{app.name}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!searchOnGoogle && !isLoading && status && (
        <div className="p-3 text-white rounded-md">{status}</div>
      )}

      {
        searchOnGoogle && (
          <div
            className="flex flex-col p-3 text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
            onClick={() => handleSearch(url)}
          >
            <div className="flex items-center gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div className="flex flex-col">
                <span>Rechercher sur Google</span>
                <span className="text-sm text-gray-200 truncate">{url}</span>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}
