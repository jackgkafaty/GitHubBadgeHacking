import { useState, useEffect } from 'react'

interface AppInfo {
  name: string
  hasIcon: boolean
}

interface ModInfo {
  name: string
  description: string
}

interface AppsPanelProps {
  isConnected: boolean
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
}

// App metadata with descriptions and icons
const appMetadata: Record<string, { description: string; icon: string; isSystem?: boolean }> = {
  badge: { description: 'Your GitHub profile display', icon: 'user-circle', isSystem: true },
  menu: { description: 'App launcher menu', icon: 'grid-dots', isSystem: true },
  startup: { description: 'Boot animation', icon: 'player-play', isSystem: true },
  flappy: { description: 'Flappy Mona - Flappy Bird clone', icon: 'feather' },
  gallery: { description: 'Photo viewer with thumbnails', icon: 'photo' },
  quest: { description: 'IR beacon scavenger hunt', icon: 'map-pin' },
  monapet: { description: 'Virtual pet simulator', icon: 'heart' },
  sketch: { description: 'Etch-A-Sketch drawing app', icon: 'pencil' },
  snake: { description: 'Classic snake game', icon: 'wand' },
  commits: { description: 'Breakout with GitHub greens', icon: 'git-commit' },
}

export default function AppsPanel({ isConnected, showNotification }: AppsPanelProps) {
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([])
  const [availableApps, setAvailableApps] = useState<AppInfo[]>([])
  const [availableMods, setAvailableMods] = useState<ModInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [removingApp, setRemovingApp] = useState<string | null>(null)
  const [installingApp, setInstallingApp] = useState<string | null>(null)
  const [installingMod, setInstallingMod] = useState<string | null>(null)
  const [restoringMod, setRestoringMod] = useState<string | null>(null)
  const [showStore, setShowStore] = useState(false)
  const [showMods, setShowMods] = useState(false)

  const loadApps = async () => {
    if (!window.electronAPI || !isConnected) return

    setIsLoading(true)
    try {
      const result = await window.electronAPI.listApps()
      if (result.success && result.apps) {
        setInstalledApps(result.apps)
      } else {
        showNotification('error', result.error || 'Failed to load apps')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableApps = async () => {
    if (!window.electronAPI) return

    setIsLoadingAvailable(true)
    try {
      const result = await window.electronAPI.getAvailableApps()
      if (result.success && result.apps) {
        // Filter out already installed apps
        const installedNames = installedApps.map(a => a.name)
        const notInstalled = result.apps.filter(a => !installedNames.includes(a.name))
        setAvailableApps(notInstalled)
      } else {
        // Simulator not set up - show message
        setAvailableApps([])
      }
    } catch (error) {
      console.error('Failed to load available apps:', error)
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const loadAvailableMods = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.getAvailableMods()
      if (result.success && result.mods) {
        setAvailableMods(result.mods)
      }
    } catch (error) {
      console.error('Failed to load mods:', error)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadApps()
    }
  }, [isConnected])

  useEffect(() => {
    if (showStore) {
      loadAvailableApps()
    }
  }, [showStore, installedApps])

  useEffect(() => {
    if (showMods) {
      loadAvailableMods()
    }
  }, [showMods])

  const handleInstallMod = async (modName: string) => {
    if (!window.electronAPI) return

    setInstallingMod(modName)
    try {
      const result = await window.electronAPI.installMod(modName)
      if (result.success) {
        showNotification('success', result.message || `Installed ${modName} mod`)
      } else {
        showNotification('error', result.error || 'Failed to install mod')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setInstallingMod(null)
    }
  }

  const handleRestoreMod = async (appName: string) => {
    if (!window.electronAPI) return

    setRestoringMod(appName)
    try {
      const result = await window.electronAPI.restoreMod(appName)
      if (result.success) {
        showNotification('success', result.message || `Restored ${appName}`)
      } else {
        showNotification('error', result.error || 'Failed to restore')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setRestoringMod(null)
    }
  }

  const handleRemoveApp = async (appName: string) => {
    if (!window.electronAPI) return

    const meta = appMetadata[appName]
    if (meta?.isSystem) {
      showNotification('error', `Cannot remove system app: ${appName}`)
      return
    }

    setRemovingApp(appName)
    try {
      const result = await window.electronAPI.removeApp(appName)
      if (result.success) {
        showNotification('success', `Removed ${appName}`)
        await loadApps()
      } else {
        showNotification('error', result.error || 'Failed to remove app')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setRemovingApp(null)
    }
  }

  const handleInstallApp = async (appName: string) => {
    if (!window.electronAPI) return

    setInstallingApp(appName)
    try {
      const result = await window.electronAPI.installApp(appName)
      if (result.success) {
        showNotification('success', `Installed ${appName}`)
        await loadApps()
        // Refresh available apps
        await loadAvailableApps()
      } else {
        showNotification('error', result.error || 'Failed to install app')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setInstallingApp(null)
    }
  }

  const getAppMeta = (name: string) => {
    return appMetadata[name] || { description: 'Custom app', icon: 'app-window' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-base-content">Installed Applications</h3>
          <p className="text-sm text-base-content/50">
            {isConnected ? `${installedApps.length} apps found on badge` : 'Connect badge to view apps'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className={`btn h-11 px-5 gap-2 ${showStore ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowStore(!showStore)}
            disabled={!isConnected}
          >
            <span className="icon-[tabler--building-store] size-4"></span>
            {showStore ? 'Hide Store' : 'App Store'}
          </button>
          <button
            className="btn btn-outline h-11 px-5 gap-2"
            onClick={loadApps}
            disabled={!isConnected || isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="icon-[tabler--refresh] size-4"></span>
            )}
            Refresh
          </button>
        </div>
      </div>

      {!isConnected ? (
        <div className="card">
          <div className="card-body items-center text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-base-300/50 flex items-center justify-center mb-4">
              <span className="icon-[tabler--plug-off] size-10 text-base-content/20"></span>
            </div>
            <h3 className="text-xl font-bold text-base-content">Badge Not Connected</h3>
            <p className="text-base-content/50 max-w-md mt-2">
              Connect your badge in disk mode to view and manage installed applications.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* App Store Section */}
          {showStore && (
            <div className="card border-primary/30">
              <div className="card-body p-6">
                <h3 className="font-bold text-base-content mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="icon-[tabler--building-store] size-5 text-primary"></span>
                  </div>
                  Available Apps
                  <a
                    href="https://badger.github.io/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto btn btn-ghost btn-sm gap-1.5 text-base-content/50"
                  >
                    <span className="icon-[tabler--external-link] size-4"></span>
                    Browse All
                  </a>
                </h3>

                {isLoadingAvailable ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : availableApps.length === 0 ? (
                  <div className="text-center py-10 text-base-content/50">
                    <span className="icon-[tabler--package] size-12 mb-3 block mx-auto opacity-40"></span>
                    <p className="font-semibold">No additional apps available</p>
                    <p className="text-sm mt-2">
                      Set up the Simulator to download community apps, or all apps are already installed.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableApps.map((app) => {
                      const meta = getAppMeta(app.name)
                      const isInstalling = installingApp === app.name
                      return (
                        <div
                          key={app.name}
                          className="rounded-xl bg-base-100 border border-base-300/50 p-4 flex items-center gap-4"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            app.hasIcon ? 'bg-primary/15 border border-primary/20' : 'bg-base-300/50'
                          }`}>
                            <span className={`icon-[tabler--${meta.icon}] size-6 ${
                              app.hasIcon ? 'text-primary' : 'text-base-content/40'
                            }`}></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base-content capitalize">{app.name}</p>
                            <p className="text-xs text-base-content/50 truncate">{meta.description}</p>
                          </div>
                          <button
                            className="btn btn-primary btn-sm h-9 px-4 gap-1.5"
                            onClick={() => handleInstallApp(app.name)}
                            disabled={isInstalling}
                          >
                            {isInstalling ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <span className="icon-[tabler--download] size-4"></span>
                            )}
                            Install
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Installed Apps */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="font-bold text-base-content mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <span className="icon-[tabler--apps] size-5 text-secondary"></span>
                </div>
                Installed on Badge
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              ) : installedApps.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">
                  <span className="icon-[tabler--folder-off] size-14 mb-3 block mx-auto opacity-40"></span>
                  <p className="font-semibold">No apps found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {installedApps.map((app) => {
                    const meta = getAppMeta(app.name)
                    const isRemoving = removingApp === app.name
                    return (
                      <div
                        key={app.name}
                        className="rounded-xl bg-base-100 border border-base-300/50 p-4 flex items-center gap-4 group"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          app.hasIcon ? 'bg-primary/15 border border-primary/20' : 'bg-base-300/50'
                        }`}>
                          <span className={`icon-[tabler--${meta.icon}] size-6 ${
                            app.hasIcon ? 'text-primary' : 'text-base-content/40'
                          }`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-base-content capitalize">{app.name}</p>
                            {meta.isSystem && (
                              <span className="badge badge-sm badge-neutral">System</span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/50 truncate">{meta.description}</p>
                        </div>
                        {!meta.isSystem && (
                          <button
                            className="btn btn-ghost btn-sm h-9 w-9 p-0 text-error/70 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveApp(app.name)}
                            disabled={isRemoving}
                            title={`Remove ${app.name}`}
                          >
                            {isRemoving ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <span className="icon-[tabler--trash] size-4"></span>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* UI Mods Section */}
          <div className="card border-secondary/30">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base-content flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <span className="icon-[tabler--wand] size-5 text-secondary"></span>
                  </div>
                  UI Mods
                </h3>
                <button
                  className={`btn btn-sm h-9 gap-2 ${showMods ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => setShowMods(!showMods)}
                >
                  <span className="icon-[tabler--sparkles] size-4"></span>
                  {showMods ? 'Hide Mods' : 'Show Mods'}
                </button>
              </div>

              <p className="text-sm text-base-content/60 mb-4">
                Install cleaner UI themes for your badge apps. These mods improve visual design within the 160×120 pixel display constraints.
              </p>

              {showMods && (
                <div className="space-y-3 mt-4">
                  {availableMods.length === 0 ? (
                    <p className="text-base-content/50 text-center py-6">Loading mods...</p>
                  ) : (
                    availableMods.map((mod) => {
                      const isInstalling = installingMod === mod.name
                      const appName = mod.name.replace('clean-', '')
                      const isRestoring = restoringMod === appName
                      return (
                        <div
                          key={mod.name}
                          className="rounded-xl bg-base-100 border border-base-300/50 p-4 flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/20 flex items-center justify-center">
                            <span className="icon-[tabler--palette] size-6 text-secondary"></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base-content capitalize">{mod.name}</p>
                            <p className="text-xs text-base-content/50">{mod.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-secondary btn-sm h-9 px-4 gap-1.5"
                              onClick={() => handleInstallMod(mod.name)}
                              disabled={isInstalling}
                            >
                              {isInstalling ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <span className="icon-[tabler--download] size-4"></span>
                              )}
                              Install
                            </button>
                            <button
                              className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-base-content/60"
                              onClick={() => handleRestoreMod(appName)}
                              disabled={isRestoring}
                              title="Restore original"
                            >
                              {isRestoring ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <span className="icon-[tabler--restore] size-4"></span>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* App Development */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="font-bold text-base-content mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="icon-[tabler--code] size-5 text-accent"></span>
                </div>
                Create Custom Apps
              </h3>
              
              <div className="text-base-content/70 space-y-3">
                <p>
                  Create custom apps for your badge! Each app needs:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-center gap-2">
                    <span className="icon-[tabler--file-code] size-4 text-base-content/40"></span>
                    <code className="text-sm bg-base-100 px-2 py-0.5 rounded">__init__.py</code>
                    <span className="text-sm text-base-content/50">- Main app code with update() function</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="icon-[tabler--photo] size-4 text-base-content/40"></span>
                    <code className="text-sm bg-base-100 px-2 py-0.5 rounded">icon.png</code>
                    <span className="text-sm text-base-content/50">- 24×24 pixel icon for the launcher</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href="https://github.com/badger/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline h-11 gap-2"
                >
                  <span className="icon-[tabler--brand-github] size-4"></span>
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
