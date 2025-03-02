import { ipcRenderer, contextBridge } from 'electron'
import type { AppInfo } from './main'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
    
  // Obtenir les applications installées
  getInstalledApps: (searchTerm = '') => 
    ipcRenderer.invoke('get-installed-apps', searchTerm),
  
  // Lancer une application
  launchApp: (appInfo: AppInfo) => 
    ipcRenderer.invoke('launch-app', appInfo),

  getAppIcon: (iconPath: string) => ipcRenderer.invoke('get-app-icon', iconPath),

  openLink: (url: string) => ipcRenderer.send('open-link', url)
})
