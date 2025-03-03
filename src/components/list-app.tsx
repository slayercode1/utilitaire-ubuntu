import { useState, useEffect, useRef } from "react";
import { IconDefault } from '../assets/icon-default';
import { FileIcon } from "../assets/FileIcon";

// Étendre l'interface pour inclure les fichiers
export interface ItemInfo {
  type: "app" | "file";
  name: string;
  path?: string;       // Pour les fichiers
  exec?: string;       // Pour les apps
  extension?: string;  // Pour les fichiers
  mimeType?: string;   // Pour les fichiers
  iconDataUrl?: string;
}

export function ListApp({
  items,
  isLoading,
  status,
  handleLaunch,
  handleSearch,
  listHeightClass,
  searchOnGoogle,
  url
}: {
  items: ItemInfo[];
  isLoading: boolean;
  status: string | null;
  handleLaunch: (item: ItemInfo) => void;
  handleSearch: (url: string) => void;
  listHeightClass: string;
  searchOnGoogle: boolean;
  url: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % items.length);
      } else if (event.key === "ArrowUp") {
        setSelectedIndex(
          (prevIndex) => (prevIndex - 1 + items.length) % items.length,
        );
      } else if (event.key === "Enter") {
        if (searchOnGoogle) {
          handleSearch(url);
        } else if (items.length > 0) {
          handleLaunch(items[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, handleLaunch, handleSearch, searchOnGoogle, url]);

  // Sync scroll position with selected index
  useEffect(() => {
    if (listRef.current && items.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        // Ensure the selected item is within the visible range by scrolling
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest", // Ensure it scrolls only when necessary
        });
      }
    }
  }, [selectedIndex, items.length]);

  // Fonction pour obtenir l'icône appropriée selon le type d'élément
  const getIcon = (item: ItemInfo) => {
    if (item.iconDataUrl) {
      return <img src={item.iconDataUrl} alt={item.name} />;
    } else if (item.type === "file") {
      return <FileIcon extension={item.extension || ""} />;
    } else {
      return <IconDefault />;
    }
  };

  // Fonction pour obtenir le sous-texte approprié
  const getSubtext = (item: ItemInfo) => {
    if (item.type === "app") {
      return item.exec;
    } else {
      return item.path;
    }
  };

  return (
    <>
      {!isLoading && items.length > 0 && (
        <ul
          ref={listRef}
          className={`divide-y divide-gray-200 overflow-auto no-scrollbar ${listHeightClass}`}
        >
          {items.map((item, index) => (
            <li
              key={`${item.type}-${item.name}-${index}`}
              className={`flex items-center p-2 cursor-pointer ${
                selectedIndex === index ? "bg-blue-600" : ""
              }`}
              onClick={() => handleLaunch(item)}
            >
              <div className="flex-shrink-0 w-10 h-10 text-white flex items-center justify-center font-semibold">
                {getIcon(item)}
              </div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-sm text-gray-200 truncate">{getSubtext(item)}</div>
              </div>
              {item.type === "file" && (
                <div className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 ml-2">
                  {item.extension?.slice(1).toUpperCase()}
                </div>
              )}
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