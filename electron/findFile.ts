import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

// Interface pour les informations des fichiers
export interface FileInfo {
  type: "file";
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: Date;
}

/**
 * Répertoires à explorer pour la recherche de fichiers
 * Ajouter/modifier selon vos besoins
 */
const directoriesToSearch: string[] = [
  path.join(process.env.HOME || "", "Documents"),
  path.join(process.env.HOME || "", "Downloads"),
  path.join(process.env.HOME || "", "Desktop"),
  path.join(process.env.HOME || "", "Pictures"),
  path.join(process.env.HOME || "", "Téléchargements"),
    path.join(process.env.HOME || "", "Bureau"),
    path.join(process.env.HOME || "", "Images"),
  // Ajoutez d'autres répertoires selon vos besoins
];

/**
 * Extensions de fichiers à rechercher
 * Vous pouvez modifier cette liste selon vos besoins
 */
const fileExtensionsToInclude: string[] = [
  ".jar",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
  ".sh",
  ".py",
  ".js",
  ".html",
  ".css",
];


/**
 * Vérifie si le fichier correspond à l'un des types d'extension souhaités
 */
function isIncludedFileType(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return fileExtensionsToInclude.includes(ext) || fileExtensionsToInclude.length === 0;
}

/**
 * Parcourt récursivement les répertoires pour trouver les fichiers
 */
async function scanDirectory(
  directory: string,
  searchTerm: string,
  maxDepth: number = 4, // Limite la profondeur de recherche
  currentDepth: number = 0,
  maxResults: number = 500, // Limite le nombre de résultats
  results: FileInfo[] = []
): Promise<FileInfo[]> {
  if (currentDepth > maxDepth || results.length >= maxResults) {
    return results;
  }

  if (!existsSync(directory)) {
    return results;
  }

  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      if (results.length >= maxResults) break;

      const filePath = path.join(directory, file);
      
      try {
        const stats = await fs.stat(filePath);

        // Si c'est un répertoire, continuer la recherche récursivement
        if (stats.isDirectory()) {
          // Ignore les répertoires cachés
          if (!file.startsWith(".")) {
            await scanDirectory(
              filePath,
              searchTerm,
              maxDepth,
              currentDepth + 1,
              maxResults,
              results
            );
          }
        } 
        // Si c'est un fichier et qu'il correspond aux critères
        else if (stats.isFile() && isIncludedFileType(file)) {
          // Si le terme de recherche est vide ou si le nom du fichier contient le terme
          if (!searchTerm || file.toLowerCase().includes(searchTerm.toLowerCase())) {
            const fileExt = path.extname(file).toLowerCase();
            results.push({
              type: "file",
              name: file,
              path: filePath,
              extension: fileExt,
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs de permission ou autres
        continue;
      }
    }
  } catch (error) {
    // Ignorer les erreurs de permission ou autres
    console.error(`Erreur lors de la lecture du répertoire ${directory}:`, error);
  }

  return results;
}

/**
 * Recherche des fichiers dans le système
 * @param {string} searchTerm - Terme de recherche (optionnel)
 * @returns {Promise<FileInfo[]>} - Liste des fichiers trouvés
 */
export async function findFiles(searchTerm: string = ""): Promise<FileInfo[]> {
  const allResults: FileInfo[] = [];
  const searchPromises = directoriesToSearch.map((directory) =>
    scanDirectory(directory, searchTerm)
  );

  const results = await Promise.all(searchPromises);
  results.forEach((fileList) => {
    allResults.push(...fileList);
  });

  // Trier les résultats par nom
  allResults.sort((a, b) => a.name.localeCompare(b.name));

//   console.log(`Trouvé ${allResults.length} fichiers correspondant à la recherche.`);
//   console.log(allResults);

  return allResults;
}