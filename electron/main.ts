import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, dirname } from 'path'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Badge file operations
interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

interface BadgeInfo {
  connected: boolean
  path: string | null
  mode: 'disk' | 'bootsel' | 'disconnected'
}

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  // Use the CommonJS preload file directly (not the vite-built one)
  const preloadPath = process.env.VITE_DEV_SERVER_URL 
    ? join(__dirname, '../electron/preload.cjs')
    : join(__dirname, 'preload.cjs')
    
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0d1117',
    show: false
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers

// Find badge mount path (macOS/Linux: look for BADGER or RP2350 volume)
function findBadgePath(): BadgeInfo {
  const platform = process.platform
  let volumePaths: string[] = []

  if (platform === 'darwin') {
    volumePaths = ['/Volumes/BADGER', '/Volumes/RP2350']
  } else if (platform === 'linux') {
    const mediaUser = `/media/${process.env.USER}`
    volumePaths = [
      `${mediaUser}/BADGER`,
      `${mediaUser}/RP2350`,
      '/mnt/BADGER',
      '/mnt/RP2350'
    ]
  } else if (platform === 'win32') {
    // Check common drive letters
    for (const letter of ['D', 'E', 'F', 'G', 'H']) {
      volumePaths.push(`${letter}:\\`)
    }
  }

  for (const volPath of volumePaths) {
    if (fs.existsSync(volPath)) {
      // Check if it's disk mode (has secrets.py, main.py, or apps folder) or bootsel (RP2350)
      const isBootsel = volPath.includes('RP2350')
      const hasSecrets = fs.existsSync(path.join(volPath, 'secrets.py'))
      const hasMain = fs.existsSync(path.join(volPath, 'main.py'))
      const hasApps = fs.existsSync(path.join(volPath, 'apps'))
      const isDiskMode = hasSecrets || hasMain || hasApps
      
      if (isDiskMode || isBootsel) {
        return {
          connected: true,
          path: volPath,
          mode: isBootsel ? 'bootsel' : 'disk'
        }
      }
    }
  }

  return { connected: false, path: null, mode: 'disconnected' }
}

// Get badge connection status
ipcMain.handle('badge:getStatus', async () => {
  return findBadgePath()
})

// Read secrets.py from badge
ipcMain.handle('badge:readConfig', async () => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  const secretsPath = path.join(badgeInfo.path, 'secrets.py')
  
  if (!fs.existsSync(secretsPath)) {
    // Return default config if secrets.py doesn't exist
    return {
      success: true,
      config: {
        WIFI_SSID: '',
        WIFI_PASSWORD: '',
        GITHUB_USERNAME: '',
        GITHUB_TOKEN: '',
        WEATHER_LOCATION: null,
        WLED_IP: ''
      }
    }
  }

  try {
    const content = fs.readFileSync(secretsPath, 'utf-8')
    const config: BadgeConfig = {
      WIFI_SSID: '',
      WIFI_PASSWORD: '',
      GITHUB_USERNAME: '',
      GITHUB_TOKEN: '',
      WEATHER_LOCATION: null,
      WLED_IP: ''
    }

    // Parse Python file
    const lines = content.split('\n')
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*["'](.*)["']/)
      if (match) {
        const [, key, value] = match
        if (key in config) {
          (config as unknown as Record<string, string>)[key] = value
        }
      }
    }

    return { success: true, config }
  } catch (error) {
    return { success: false, error: `Failed to read config: ${error}` }
  }
})

// Helper to escape Python string values
function escapePythonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t')   // Escape tabs
}

// Write secrets.py to badge
ipcMain.handle('badge:writeConfig', async (_, config: BadgeConfig) => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  const secretsPath = path.join(badgeInfo.path, 'secrets.py')
  
  // Escape all values for Python string safety
  const wifiSsid = escapePythonString(config.WIFI_SSID || '')
  const wifiPassword = escapePythonString(config.WIFI_PASSWORD || '')
  const githubUsername = escapePythonString(config.GITHUB_USERNAME || '')
  const githubToken = escapePythonString(config.GITHUB_TOKEN || '')
  const weatherLocation = config.WEATHER_LOCATION ? escapePythonString(config.WEATHER_LOCATION) : ''
  const wledIp = config.WLED_IP ? escapePythonString(config.WLED_IP) : ''
  
  // Build clean Python file - using Unix line endings (LF)
  const lines = [
    '# Badge Configuration',
    '# Generated by GitHub Badge Customizer',
    '',
    '# WiFi Settings (2.4GHz network required)',
    `WIFI_SSID = "${wifiSsid}"`,
    `WIFI_PASSWORD = "${wifiPassword}"`,
    '',
    '# GitHub Settings',
    `GITHUB_USERNAME = "${githubUsername}"`,
    `GITHUB_TOKEN = "${githubToken}"`,
    '',
    '# Optional Settings',
    weatherLocation ? `WEATHER_LOCATION = "${weatherLocation}"` : 'WEATHER_LOCATION = None',
    wledIp ? `WLED_IP = "${wledIp}"` : 'WLED_IP = None',
    '' // Trailing newline
  ]
  
  const content = lines.join('\n')

  try {
    // Write with explicit UTF-8 encoding and Unix line endings
    fs.writeFileSync(secretsPath, content, { encoding: 'utf-8' })
    
    // Sync to ensure the file is flushed to the volume
    // This is important for USB mass storage devices
    try {
      const fd = fs.openSync(secretsPath, 'r')
      fs.fsyncSync(fd)
      fs.closeSync(fd)
    } catch {
      // fsync might not be supported on all filesystems, that's ok
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: `Failed to write config: ${error}` }
  }
})

// Flash firmware (.uf2 file) - use async streaming to prevent UI blocking
ipcMain.handle('badge:flashFirmware', async (_, filePath: string) => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'bootsel' || !badgeInfo.path) {
    return { 
      success: false, 
      error: 'Badge must be in BOOTSEL mode to flash firmware. Hold HOME + press RESET, then release HOME when RP2350 drive appears.' 
    }
  }

  try {
    const fileName = path.basename(filePath)
    const destPath = path.join(badgeInfo.path, fileName)
    
    // Use promises-based fs for async copy to prevent UI blocking
    const fsPromises = fs.promises
    
    // Read the firmware file
    const firmwareData = await fsPromises.readFile(filePath)
    
    // Write to the badge volume
    await fsPromises.writeFile(destPath, firmwareData)
    
    // Note: The badge will automatically reboot after receiving the UF2 file
    // The volume will unmount, which is expected behavior
    
    return { 
      success: true, 
      message: 'Firmware uploaded! Badge will reboot automatically. The RP2350 drive will disappear - this is normal.' 
    }
  } catch (error) {
    // Check if the error is because the volume disappeared (badge rebooted)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('ENOENT') || errorMessage.includes('EBUSY') || errorMessage.includes('ENODEV')) {
      return { 
        success: true, 
        message: 'Firmware upload initiated. Badge is rebooting - this is expected!' 
      }
    }
    return { success: false, error: `Failed to flash firmware: ${errorMessage}` }
  }
})

// Select firmware file dialog
ipcMain.handle('dialog:selectFirmware', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Firmware File',
    filters: [
      { name: 'UF2 Firmware', extensions: ['uf2'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true }
  }

  return { success: true, filePath: result.filePaths[0] }
})

// List apps on badge
ipcMain.handle('badge:listApps', async () => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  // Check both system/apps and apps directories
  const systemAppsPath = path.join(badgeInfo.path, 'system', 'apps')
  const userAppsPath = path.join(badgeInfo.path, 'apps')
  
  const allApps: { name: string; hasIcon: boolean }[] = []
  
  // Helper to scan app directory
  const scanAppsDir = (appsPath: string) => {
    if (!fs.existsSync(appsPath)) return
    
    try {
      const entries = fs.readdirSync(appsPath, { withFileTypes: true })
      entries
        .filter(entry => entry.isDirectory())
        .filter(entry => {
          const initPath = path.join(appsPath, entry.name, '__init__.py')
          return fs.existsSync(initPath)
        })
        .forEach(entry => {
          // Avoid duplicates
          if (!allApps.some(a => a.name === entry.name)) {
            allApps.push({
              name: entry.name,
              hasIcon: fs.existsSync(path.join(appsPath, entry.name, 'icon.png'))
            })
          }
        })
    } catch (error) {
      console.error(`Error scanning ${appsPath}:`, error)
    }
  }
  
  scanAppsDir(systemAppsPath)
  scanAppsDir(userAppsPath)

  return { success: true, apps: allApps }
})

// Remove an app from the badge
ipcMain.handle('badge:removeApp', async (_event, appName: string) => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  // Prevent removing system apps
  const protectedApps = ['menu', 'startup', 'badge']
  if (protectedApps.includes(appName)) {
    return { success: false, error: `Cannot remove system app: ${appName}` }
  }

  const appPath = path.join(badgeInfo.path, 'apps', appName)
  
  if (!fs.existsSync(appPath)) {
    return { success: false, error: `App not found: ${appName}` }
  }

  try {
    // Recursively delete the app folder
    await fs.promises.rm(appPath, { recursive: true, force: true })
    return { success: true, message: `Removed ${appName}` }
  } catch (error) {
    return { success: false, error: `Failed to remove app: ${error}` }
  }
})

// Install an app from GitHub repo
ipcMain.handle('badge:installApp', async (_event, appName: string) => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  // Check if app already exists in either location
  const systemPath = path.join(badgeInfo.path, 'system', 'apps', appName)
  const userPath = path.join(badgeInfo.path, 'apps', appName)
  
  if (fs.existsSync(systemPath) || fs.existsSync(userPath)) {
    return { success: false, error: `App already exists: ${appName}` }
  }

  // Install to user apps directory
  const targetPath = userPath

  // Check if simulator repo is cloned (source of apps)
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  const simulatorPath = path.join(homeDir, '.github-badge-customizer', 'badger-home')
  const sourceAppPath = path.join(simulatorPath, 'badge', 'apps', appName)
  
  if (!fs.existsSync(sourceAppPath)) {
    return { success: false, error: `App not found in repository. Please set up the simulator first to download apps.` }
  }

  try {
    // Copy app folder to badge
    await copyFolder(sourceAppPath, targetPath)
    return { success: true, message: `Installed ${appName}` }
  } catch (error) {
    return { success: false, error: `Failed to install app: ${error}` }
  }
})

// Helper function to recursively copy a folder
async function copyFolder(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyFolder(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

// Get available apps from simulator repo
ipcMain.handle('badge:getAvailableApps', async () => {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  const simulatorPath = path.join(homeDir, '.github-badge-customizer', 'badger-home')
  const appsPath = path.join(simulatorPath, 'badge', 'apps')
  
  if (!fs.existsSync(appsPath)) {
    return { success: false, error: 'Simulator not set up. Please set up the simulator first to browse available apps.' }
  }

  try {
    const entries = await fs.promises.readdir(appsPath, { withFileTypes: true })
    const apps = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => {
        const initPath = path.join(appsPath, entry.name, '__init__.py')
        return fs.existsSync(initPath)
      })
      .map(entry => ({
        name: entry.name,
        hasIcon: fs.existsSync(path.join(appsPath, entry.name, 'icon.png'))
      }))

    return { success: true, apps }
  } catch (error) {
    return { success: false, error: `Failed to list available apps: ${error}` }
  }
})

// Read badge.txt for eInk badges (if applicable)
ipcMain.handle('badge:readBadgeInfo', async () => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  const badgeTxtPath = path.join(badgeInfo.path, 'badges', 'badge.txt')
  
  if (!fs.existsSync(badgeTxtPath)) {
    return {
      success: true,
      info: {
        event: 'Universe 2025',
        firstName: '',
        lastName: '',
        company: '',
        title: '',
        pronouns: '',
        handle: ''
      }
    }
  }

  try {
    const content = fs.readFileSync(badgeTxtPath, 'utf-8')
    const lines = content.split('\n').map(l => l.trim())
    
    return {
      success: true,
      info: {
        event: lines[0] || 'Universe 2025',
        firstName: lines[1] || '',
        lastName: lines[2] || '',
        company: lines[3] || '',
        title: lines[4] || '',
        pronouns: lines[5] || '',
        handle: lines[6] || ''
      }
    }
  } catch (error) {
    return { success: false, error: `Failed to read badge info: ${error}` }
  }
})

// Write badge.txt for eInk badges
ipcMain.handle('badge:writeBadgeInfo', async (_, info: {
  event: string
  firstName: string
  lastName: string
  company: string
  title: string
  pronouns: string
  handle: string
}) => {
  const badgeInfo = findBadgePath()
  
  if (!badgeInfo.connected || badgeInfo.mode !== 'disk' || !badgeInfo.path) {
    return { success: false, error: 'Badge not connected in disk mode' }
  }

  const badgesDir = path.join(badgeInfo.path, 'badges')
  const badgeTxtPath = path.join(badgesDir, 'badge.txt')
  
  // Ensure badges directory exists
  if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir, { recursive: true })
  }

  const content = [
    info.event,
    info.firstName,
    info.lastName,
    info.company,
    info.title,
    info.pronouns,
    info.handle
  ].join('\n')

  try {
    fs.writeFileSync(badgeTxtPath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: `Failed to write badge info: ${error}` }
  }
})

// ==================== SIMULATOR FUNCTIONALITY ====================

// Get simulator directory path (in user's home directory)
function getSimulatorPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(homeDir, '.github-badge-customizer', 'badger-home')
}

// Check if simulator is installed
ipcMain.handle('simulator:checkInstalled', async () => {
  const simPath = getSimulatorPath()
  const simulatorScript = path.join(simPath, 'simulator', 'badge_simulator.py')
  
  const isInstalled = fs.existsSync(simulatorScript)
  
  return { 
    installed: isInstalled, 
    path: simPath,
    simulatorScript 
  }
})

// Setup simulator (clone repo, install pygame)
ipcMain.handle('simulator:setup', async () => {
  const simPath = getSimulatorPath()
  const parentDir = path.dirname(simPath)
  
  // Create parent directory if it doesn't exist
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true })
  }
  
  try {
    // Check if already cloned
    if (fs.existsSync(simPath)) {
      // Pull latest changes
      await execAsync('git pull', { cwd: simPath })
      return { success: true, message: 'Simulator updated!' }
    }
    
    // Clone the repository
    await execAsync(
      `git clone https://github.com/badger/home.git "${simPath}"`,
      { cwd: parentDir }
    )
    
    return { success: true, message: 'Simulator installed!' }
  } catch (error) {
    return { success: false, error: `Failed to setup simulator: ${error}` }
  }
})

// Check Python version
ipcMain.handle('simulator:checkPython', async () => {
  try {
    // On macOS, prefer Homebrew Python 3.12+
    let pythonCmd = 'python3'
    if (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/python3.12')) {
      pythonCmd = '/opt/homebrew/bin/python3.12'
    }
    
    const { stdout } = await execAsync(`${pythonCmd} --version`)
    const versionMatch = stdout.match(/Python (\d+)\.(\d+)\.(\d+)/)
    if (versionMatch) {
      const major = parseInt(versionMatch[1])
      const minor = parseInt(versionMatch[2])
      const version = `${major}.${minor}.${versionMatch[3]}`
      const compatible = major >= 3 && minor >= 10
      return { installed: true, version, compatible }
    }
    return { installed: true, version: stdout.trim(), compatible: false }
  } catch {
    return { installed: false, version: null, compatible: false }
  }
})

// Check if pygame is installed
ipcMain.handle('simulator:checkPygame', async () => {
  try {
    // On macOS, prefer Homebrew Python 3.12+
    let pythonCmd = 'python3'
    if (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/python3.12')) {
      pythonCmd = '/opt/homebrew/bin/python3.12'
    }
    
    await execAsync(`${pythonCmd} -c "import pygame"`)
    return { installed: true }
  } catch {
    return { installed: false }
  }
})

// Install pygame
ipcMain.handle('simulator:installPygame', async () => {
  try {
    // On macOS, prefer Homebrew Python 3.12+
    let pipCmd = 'pip3'
    if (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/pip3.12')) {
      pipCmd = '/opt/homebrew/bin/pip3.12 --break-system-packages'
    }
    
    await execAsync(`${pipCmd} install pygame`)
    return { success: true }
  } catch (error) {
    return { success: false, error: `Failed to install pygame: ${error}` }
  }
})

// Launch simulator with config
ipcMain.handle('simulator:launch', async (_, config: BadgeConfig, appPath?: string) => {
  const simPath = getSimulatorPath()
  const simulatorScript = path.join(simPath, 'simulator', 'badge_simulator.py')
  const badgePath = path.join(simPath, 'badge')
  const secretsPath = path.join(badgePath, 'secrets.py')
  
  if (!fs.existsSync(simulatorScript)) {
    return { success: false, error: 'Simulator not installed. Please install first.' }
  }
  
  // Write secrets.py to simulator's badge directory
  const secretsContent = `# Badge Configuration for Simulator
# Generated by GitHub Badge Customizer

WIFI_SSID = "${escapePythonString(config.WIFI_SSID || '')}"
WIFI_PASSWORD = "${escapePythonString(config.WIFI_PASSWORD || '')}"
GITHUB_USERNAME = "${escapePythonString(config.GITHUB_USERNAME || '')}"
GITHUB_TOKEN = "${escapePythonString(config.GITHUB_TOKEN || '')}"
${config.WEATHER_LOCATION ? `WEATHER_LOCATION = "${escapePythonString(config.WEATHER_LOCATION)}"` : 'WEATHER_LOCATION = None'}
${config.WLED_IP ? `WLED_IP = "${escapePythonString(config.WLED_IP)}"` : 'WLED_IP = None'}
`
  
  try {
    fs.writeFileSync(secretsPath, secretsContent, 'utf-8')
  } catch (error) {
    return { success: false, error: `Failed to write simulator config: ${error}` }
  }
  
  // Determine which app to launch
  const targetApp = appPath || path.join(badgePath, 'apps', 'menu')
  
  // Launch the simulator with Python 3.12 (required for simulator compatibility)
  let pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  
  // On macOS, prefer Homebrew Python 3.12+ which has pygame installed
  if (process.platform === 'darwin') {
    const brewPython = '/opt/homebrew/bin/python3.12'
    if (fs.existsSync(brewPython)) {
      pythonCmd = brewPython
    }
  }
  
  const args = [simulatorScript, '--scale', '4', targetApp]
  
  try {
    const child = spawn(pythonCmd, args, {
      cwd: simPath,
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref() // Allow the app to continue running independently
    
    return { 
      success: true, 
      message: 'Simulator launched! A new window should appear.',
      pid: child.pid 
    }
  } catch (error) {
    return { success: false, error: `Failed to launch simulator: ${error}` }
  }
})

// List available apps in simulator
ipcMain.handle('simulator:listApps', async () => {
  const simPath = getSimulatorPath()
  const appsPath = path.join(simPath, 'badge', 'apps')
  
  if (!fs.existsSync(appsPath)) {
    return { success: false, error: 'Simulator apps directory not found' }
  }
  
  try {
    const entries = fs.readdirSync(appsPath, { withFileTypes: true })
    const apps = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => {
        const initPath = path.join(appsPath, entry.name, '__init__.py')
        return fs.existsSync(initPath)
      })
      .map(entry => ({
        name: entry.name,
        path: path.join(appsPath, entry.name),
        hasIcon: fs.existsSync(path.join(appsPath, entry.name, 'icon.png'))
      }))

    return { success: true, apps }
  } catch (error) {
    return { success: false, error: `Failed to list simulator apps: ${error}` }
  }
})

// Open simulator folder in file explorer
ipcMain.handle('simulator:openFolder', async () => {
  const simPath = getSimulatorPath()
  
  if (fs.existsSync(simPath)) {
    shell.openPath(simPath)
    return { success: true }
  }
  
  return { success: false, error: 'Simulator not installed' }
})
