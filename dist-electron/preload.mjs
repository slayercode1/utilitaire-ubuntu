"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // Obtenir les applications installées
  getInstalledApps: (searchTerm = "") => electron.ipcRenderer.invoke("get-installed-apps", searchTerm),
  // Lancer une application
  launchApp: (appInfo) => electron.ipcRenderer.invoke("launch-app", appInfo),
  getAppIcon: (iconPath) => electron.ipcRenderer.invoke("get-app-icon", iconPath),
  openLink: (url) => electron.ipcRenderer.send("open-link", url),
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath)
});
