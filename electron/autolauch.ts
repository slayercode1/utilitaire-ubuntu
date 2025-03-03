import { app } from 'electron';
import * as fs from "node:fs";
import * as path from "node:path";

export function setAutoLaunch(enabled: boolean) {
    if (process.platform === 'linux') {
      const appName = app.getName();
      const appPath = app.getPath('exe');
      
      const autostartDir = path.join(app.getPath('home'), '.config', 'autostart');
      const autostartFile = path.join(autostartDir, `${appName}.desktop`);
      
      try {
        if (!fs.existsSync(autostartDir)) {
          fs.mkdirSync(autostartDir, { recursive: true });
        }
        
        if (enabled) {
          const desktopEntry = `[Desktop Entry]
  Type=Application
  Name=${appName}
  Exec=${appPath}
  Icon=${path.join(process.env.VITE_PUBLIC, "logo.png")}
  Comment=Application lancée automatiquement
  X-GNOME-Autostart-enabled=true`;
          
          fs.writeFileSync(autostartFile, desktopEntry);
        } else if (fs.existsSync(autostartFile)) {
          fs.unlinkSync(autostartFile);
        }
      } catch (error) {
        console.error('Erreur lors de la configuration de l\'autostart:', error);
      }
    }
  }