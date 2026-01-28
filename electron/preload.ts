import { contextBridge, ipcRenderer } from 'electron'

// Types
export interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

export interface BadgeInfo {
  connected: boolean
  path: string | null
  mode: 'disk' | 'bootsel' | 'disconnected'
}

export interface BadgePersonalInfo {
  event: string
  firstName: string
  lastName: string
  company: string
  title: string
  pronouns: string
  handle: string
}

export interface AppInfo {
  name: string
  hasIcon: boolean
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Badge status
  getBadgeStatus: (): Promise<BadgeInfo> => ipcRenderer.invoke('badge:getStatus'),
  
  // Configuration
  readConfig: (): Promise<{ success: boolean; config?: BadgeConfig; error?: string }> => 
    ipcRenderer.invoke('badge:readConfig'),
  writeConfig: (config: BadgeConfig): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('badge:writeConfig', config),
  
  // Firmware
  flashFirmware: (filePath: string): Promise<{ success: boolean; message?: string; error?: string }> => 
    ipcRenderer.invoke('badge:flashFirmware', filePath),
  selectFirmware: (): Promise<{ success: boolean; filePath?: string; canceled?: boolean }> => 
    ipcRenderer.invoke('dialog:selectFirmware'),
  
  // Apps
  listApps: (): Promise<{ success: boolean; apps?: AppInfo[]; error?: string }> => 
    ipcRenderer.invoke('badge:listApps'),
  
  // Badge personal info (eInk)
  readBadgeInfo: (): Promise<{ success: boolean; info?: BadgePersonalInfo; error?: string }> => 
    ipcRenderer.invoke('badge:readBadgeInfo'),
  writeBadgeInfo: (info: BadgePersonalInfo): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('badge:writeBadgeInfo', info)
})

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      getBadgeStatus: () => Promise<BadgeInfo>
      readConfig: () => Promise<{ success: boolean; config?: BadgeConfig; error?: string }>
      writeConfig: (config: BadgeConfig) => Promise<{ success: boolean; error?: string }>
      flashFirmware: (filePath: string) => Promise<{ success: boolean; message?: string; error?: string }>
      selectFirmware: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>
      listApps: () => Promise<{ success: boolean; apps?: AppInfo[]; error?: string }>
      readBadgeInfo: () => Promise<{ success: boolean; info?: BadgePersonalInfo; error?: string }>
      writeBadgeInfo: (info: BadgePersonalInfo) => Promise<{ success: boolean; error?: string }>
    }
  }
}
