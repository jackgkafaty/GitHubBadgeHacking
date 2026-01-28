const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Badge status
  getBadgeStatus: () => ipcRenderer.invoke('badge:getStatus'),
  
  // Configuration
  readConfig: () => ipcRenderer.invoke('badge:readConfig'),
  writeConfig: (config) => ipcRenderer.invoke('badge:writeConfig', config),
  
  // Firmware
  flashFirmware: (filePath) => ipcRenderer.invoke('badge:flashFirmware', filePath),
  selectFirmware: () => ipcRenderer.invoke('dialog:selectFirmware'),
  
  // Apps
  listApps: () => ipcRenderer.invoke('badge:listApps'),
  removeApp: (appName) => ipcRenderer.invoke('badge:removeApp', appName),
  installApp: (appName) => ipcRenderer.invoke('badge:installApp', appName),
  getAvailableApps: () => ipcRenderer.invoke('badge:getAvailableApps'),
  
  // UI Mods
  getAvailableMods: () => ipcRenderer.invoke('badge:getAvailableMods'),
  installMod: (modName) => ipcRenderer.invoke('badge:installMod', modName),
  restoreMod: (appName) => ipcRenderer.invoke('badge:restoreMod', appName),
  
  // Badge personal info (eInk display)
  readBadgeInfo: () => ipcRenderer.invoke('badge:readBadgeInfo'),
  writeBadgeInfo: (info) => ipcRenderer.invoke('badge:writeBadgeInfo', info),
  
  // Simulator
  simulatorCheckInstalled: () => ipcRenderer.invoke('simulator:checkInstalled'),
  simulatorSetup: () => ipcRenderer.invoke('simulator:setup'),
  simulatorCheckPython: () => ipcRenderer.invoke('simulator:checkPython'),
  simulatorCheckPygame: () => ipcRenderer.invoke('simulator:checkPygame'),
  simulatorInstallPygame: () => ipcRenderer.invoke('simulator:installPygame'),
  simulatorLaunch: (config, appPath) => ipcRenderer.invoke('simulator:launch', config, appPath),
  simulatorListApps: () => ipcRenderer.invoke('simulator:listApps'),
  simulatorOpenFolder: () => ipcRenderer.invoke('simulator:openFolder')
});
