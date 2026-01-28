import { useState, useEffect } from 'react'

interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

interface SimulatorApp {
  name: string
  path: string
  hasIcon: boolean
}

interface PythonStatus {
  installed: boolean
  version: string | null
  compatible: boolean
}

interface SimulatorPanelProps {
  config: BadgeConfig
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function SimulatorPanel({ config, showNotification }: SimulatorPanelProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isPygameInstalled, setIsPygameInstalled] = useState(false)
  const [pythonStatus, setPythonStatus] = useState<PythonStatus>({ installed: false, version: null, compatible: false })
  const [isChecking, setIsChecking] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [apps, setApps] = useState<SimulatorApp[]>([])
  const [selectedApp, setSelectedApp] = useState<string>('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    if (!window.electronAPI) return
    
    setIsChecking(true)
    try {
      // Check Python version
      const pythonResult = await window.electronAPI.simulatorCheckPython()
      setPythonStatus(pythonResult)
      
      // Check if simulator is installed
      const simStatus = await window.electronAPI.simulatorCheckInstalled()
      setIsInstalled(simStatus.installed)
      
      // Check if pygame is installed
      const pygameStatus = await window.electronAPI.simulatorCheckPygame()
      setIsPygameInstalled(pygameStatus.installed)
      
      // If simulator is installed, load apps
      if (simStatus.installed) {
        const appsResult = await window.electronAPI.simulatorListApps()
        if (appsResult.success && appsResult.apps) {
          setApps(appsResult.apps)
          const menuApp = appsResult.apps.find(a => a.name === 'menu')
          if (menuApp) {
            setSelectedApp(menuApp.path)
          }
        }
      }
    } catch (error) {
      console.error('Failed to check simulator status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleInstallSimulator = async () => {
    if (!window.electronAPI) return
    
    setIsInstalling(true)
    showNotification('info', 'Cloning simulator repository... This may take a minute.')
    
    try {
      const result = await window.electronAPI.simulatorSetup()
      if (result.success) {
        showNotification('success', result.message || 'Simulator installed!')
        await checkStatus()
      } else {
        showNotification('error', result.error || 'Failed to install simulator')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleInstallPygame = async () => {
    if (!window.electronAPI) return
    
    setIsInstalling(true)
    showNotification('info', 'Installing pygame...')
    
    try {
      const result = await window.electronAPI.simulatorInstallPygame()
      if (result.success) {
        showNotification('success', 'Pygame installed!')
        setIsPygameInstalled(true)
      } else {
        showNotification('error', result.error || 'Failed to install pygame')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleLaunchSimulator = async () => {
    if (!window.electronAPI) return
    
    if (!pythonStatus.compatible) {
      showNotification('error', 'Python 3.10+ is required. Please upgrade your Python installation.')
      return
    }
    
    setIsLaunching(true)
    
    try {
      const result = await window.electronAPI.simulatorLaunch(config, selectedApp || undefined)
      if (result.success) {
        showNotification('success', 'Simulator launched! A pygame window should appear.')
      } else {
        showNotification('error', result.error || 'Failed to launch simulator')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsLaunching(false)
    }
  }

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return
    await window.electronAPI.simulatorOpenFolder()
  }

  const allPrerequisitesMet = pythonStatus.compatible && isPygameInstalled && isInstalled

  if (isChecking) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body p-6 flex items-center justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="ml-4 text-base-content/70">Checking simulator status...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="card">
        <div className="card-body p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <span className="icon-[tabler--device-gamepad-2] size-6 text-secondary"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">Badge Simulator</h2>
              <p className="text-sm text-base-content/50">
                Test apps and preview your configuration without hardware
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-base-100 border border-base-300/50">
            <p className="text-sm text-base-content/70">
              The simulator uses the official <a href="https://github.com/badger/home" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">badger/home</a> repository. 
              It recreates the badge's 160×120 display using Pygame, letting you test apps and see your GitHub stats before writing to the badge.
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="font-bold text-base-content mb-5">Prerequisites</h3>
          
          <div className="space-y-3">
            {/* Python Check */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pythonStatus.compatible ? 'bg-success/20' : 'bg-error/20'}`}>
                  <span className={`icon-[tabler--brand-python] size-5 ${pythonStatus.compatible ? 'text-success' : 'text-error'}`}></span>
                </div>
                <div>
                  <p className="font-semibold text-base-content">Python 3.10+</p>
                  <p className="text-sm text-base-content/50">
                    {pythonStatus.installed 
                      ? `Current version: ${pythonStatus.version}` 
                      : 'Not found'}
                  </p>
                </div>
              </div>
              {pythonStatus.compatible ? (
                <span className="badge badge-success">
                  <span className="icon-[tabler--check] size-4 mr-1"></span>
                  Compatible
                </span>
              ) : (
                <a 
                  href="https://www.python.org/downloads/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-error"
                >
                  <span className="icon-[tabler--download] size-4 mr-1"></span>
                  Upgrade
                </a>
              )}
            </div>

            {/* Python Version Warning */}
            {!pythonStatus.compatible && (
              <div className="alert alert-error">
                <span className="icon-[tabler--alert-circle] size-5"></span>
                <div>
                  <p className="font-semibold">Python 3.10 or newer is required</p>
                  <p className="text-sm opacity-80">
                    The simulator uses type union syntax (e.g., <code className="px-1 bg-error/20 rounded">A | B</code>) 
                    which was added in Python 3.10. Your current version ({pythonStatus.version || 'unknown'}) doesn't support this.
                  </p>
                  <p className="text-sm mt-2">
                    Install Python 3.10+ via <code className="px-1 bg-error/20 rounded">brew install python@3.12</code> or download from python.org.
                  </p>
                </div>
              </div>
            )}

            {/* Pygame Check */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPygameInstalled ? 'bg-success/20' : 'bg-base-300/50'}`}>
                  <span className={`icon-[tabler--device-gamepad] size-5 ${isPygameInstalled ? 'text-success' : 'text-base-content/60'}`}></span>
                </div>
                <div>
                  <p className="font-semibold text-base-content">Pygame</p>
                  <p className="text-sm text-base-content/50">Graphics library for display emulation</p>
                </div>
              </div>
              {isPygameInstalled ? (
                <span className="badge badge-success">
                  <span className="icon-[tabler--check] size-4 mr-1"></span>
                  Installed
                </span>
              ) : (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleInstallPygame}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    'Install'
                  )}
                </button>
              )}
            </div>

            {/* Simulator Repo Check */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isInstalled ? 'bg-success/20' : 'bg-base-300/50'}`}>
                  <span className={`icon-[tabler--brand-github] size-5 ${isInstalled ? 'text-success' : 'text-base-content/60'}`}></span>
                </div>
                <div>
                  <p className="font-semibold text-base-content">Simulator Repository</p>
                  <p className="text-sm text-base-content/50">badger/home from GitHub</p>
                </div>
              </div>
              {isInstalled ? (
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">
                    <span className="icon-[tabler--check] size-4 mr-1"></span>
                    Installed
                  </span>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={handleOpenFolder}
                    title="Open simulator folder"
                  >
                    <span className="icon-[tabler--folder] size-4"></span>
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleInstallSimulator}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Cloning...
                    </>
                  ) : (
                    <>
                      <span className="icon-[tabler--download] size-4 mr-1"></span>
                      Install
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Launch Simulator */}
      {allPrerequisitesMet && (
        <div className="card">
          <div className="card-body p-6">
            <h3 className="font-bold text-base-content mb-5">Launch Simulator</h3>
            
            <div className="space-y-4">
              {/* App Selection */}
              <div className="form-control">
                <label className="label" htmlFor="app-select">
                  <span className="label-text">Select App to Run</span>
                </label>
                <select 
                  id="app-select"
                  className="select"
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                >
                  <option value="">Menu (default)</option>
                  {apps.map(app => (
                    <option key={app.path} value={app.path}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Config Preview */}
              <div className="p-4 rounded-xl bg-base-100 border border-base-300/50">
                <p className="text-sm font-semibold text-base-content mb-2">Your Configuration:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-base-content/50">WiFi:</span>
                    <span className="ml-2 text-base-content">{config.WIFI_SSID || '(not set)'}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50">GitHub:</span>
                    <span className="ml-2 text-base-content">@{config.GITHUB_USERNAME || '(not set)'}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                <p className="text-sm font-semibold text-info mb-2">
                  <span className="icon-[tabler--keyboard] size-4 mr-1 inline-block align-text-bottom"></span>
                  Keyboard Controls
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-base-content/70">
                  <div><kbd className="kbd kbd-xs">A</kbd> / <kbd className="kbd kbd-xs">Z</kbd> → Button A</div>
                  <div><kbd className="kbd kbd-xs">B</kbd> / <kbd className="kbd kbd-xs">X</kbd> → Button B</div>
                  <div><kbd className="kbd kbd-xs">C</kbd> / <kbd className="kbd kbd-xs">Space</kbd> → Button C</div>
                  <div><kbd className="kbd kbd-xs">↑↓←→</kbd> → D-pad</div>
                  <div><kbd className="kbd kbd-xs">H</kbd> / <kbd className="kbd kbd-xs">Esc</kbd> → Home</div>
                  <div><kbd className="kbd kbd-xs">F12</kbd> → Screenshot</div>
                </div>
              </div>

              {/* Launch Button */}
              <button
                className="btn btn-primary btn-lg w-full gap-2"
                onClick={handleLaunchSimulator}
                disabled={isLaunching}
              >
                {isLaunching ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Launching...
                  </>
                ) : (
                  <>
                    <span className="icon-[tabler--player-play] size-5"></span>
                    Launch Simulator
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not Ready */}
      {!allPrerequisitesMet && (
        <div className="card border-warning/30">
          <div className="card-body p-6 text-center">
            <span className="icon-[tabler--alert-triangle] size-12 text-warning/50 mx-auto mb-3"></span>
            <h4 className="font-bold text-base-content">Setup Incomplete</h4>
            <p className="text-sm text-base-content/60 mt-2">
              Please install the missing prerequisites above to use the simulator.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
