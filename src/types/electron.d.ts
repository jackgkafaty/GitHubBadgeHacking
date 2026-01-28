export interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

export interface BadgePersonalInfo {
  firstName: string
  lastName: string
  title: string
  pronouns: string
  handle: string
  company: string
}

export interface AppInfo {
  name: string
  hasIcon: boolean
}

export interface SimulatorAppInfo {
  name: string
  path: string
  hasIcon: boolean
}

export interface BadgeStatus {
  connected: boolean
  path: string | null
  mode: 'disk' | 'bootsel' | 'disconnected'
}

export interface SimulatorStatus {
  installed: boolean
  path: string
  simulatorScript?: string
}

export interface PythonStatus {
  installed: boolean
  version: string | null
  compatible: boolean
}

export interface ElectronAPI {
  getBadgeStatus: () => Promise<BadgeStatus>
  readConfig: () => Promise<{ success: boolean; config?: BadgeConfig; error?: string }>
  writeConfig: (config: BadgeConfig) => Promise<{ success: boolean; error?: string }>
  flashFirmware: (filePath: string) => Promise<{ success: boolean; message?: string; error?: string }>
  selectFirmware: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>
  listApps: () => Promise<{ success: boolean; apps?: AppInfo[]; error?: string }>
  removeApp: (appName: string) => Promise<{ success: boolean; message?: string; error?: string }>
  installApp: (appName: string) => Promise<{ success: boolean; message?: string; error?: string }>
  getAvailableApps: () => Promise<{ success: boolean; apps?: AppInfo[]; error?: string }>
  readBadgeInfo: () => Promise<{ success: boolean; info?: BadgePersonalInfo; error?: string }>
  writeBadgeInfo: (info: BadgePersonalInfo) => Promise<{ success: boolean; error?: string }>
  
  // Simulator APIs
  simulatorCheckInstalled: () => Promise<SimulatorStatus>
  simulatorSetup: () => Promise<{ success: boolean; message?: string; error?: string }>
  simulatorCheckPython: () => Promise<PythonStatus>
  simulatorCheckPygame: () => Promise<{ installed: boolean }>
  simulatorInstallPygame: () => Promise<{ success: boolean; error?: string }>
  simulatorLaunch: (config: BadgeConfig, appPath?: string) => Promise<{ success: boolean; message?: string; pid?: number; error?: string }>
  simulatorListApps: () => Promise<{ success: boolean; apps?: SimulatorAppInfo[]; error?: string }>
  simulatorOpenFolder: () => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
