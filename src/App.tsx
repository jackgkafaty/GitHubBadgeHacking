import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ConnectionStatus from './components/ConnectionStatus'
import ConfigurationPanel from './components/ConfigurationPanel'
import BadgePreview from './components/BadgePreview'
import FirmwarePanel from './components/FirmwarePanel'
import AppsPanel from './components/AppsPanel'
import BadgeInfoPanel from './components/BadgeInfoPanel'
import SimulatorPanel from './components/SimulatorPanel'
import Toast from './components/Toast'

type TabType = 'config' | 'badge-info' | 'firmware' | 'apps' | 'simulator'

interface BadgeStatus {
  connected: boolean
  path: string | null
  mode: 'disk' | 'bootsel' | 'disconnected'
}

interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('config')
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>({
    connected: false,
    path: null,
    mode: 'disconnected'
  })
  const [config, setConfig] = useState<BadgeConfig>({
    WIFI_SSID: '',
    WIFI_PASSWORD: '',
    GITHUB_USERNAME: '',
    GITHUB_TOKEN: '',
    WEATHER_LOCATION: null,
    WLED_IP: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false) // Track if we've loaded config for this connection
  const [lastBadgePath, setLastBadgePath] = useState<string | null>(null) // Track which badge we loaded from

  // Check badge connection status
  const checkBadgeStatus = useCallback(async () => {
    if (!window.electronAPI) return
    
    try {
      const status = await window.electronAPI.getBadgeStatus()
      setBadgeStatus(status)
      
      // If connected in disk mode, read config ONLY if:
      // - We haven't loaded config yet for this badge, OR
      // - This is a different badge than before
      if (status.connected && status.mode === 'disk') {
        const isNewBadge = status.path !== lastBadgePath
        if (!configLoaded || isNewBadge) {
          const result = await window.electronAPI.readConfig()
          if (result.success && result.config) {
            setConfig(result.config)
            setConfigLoaded(true)
            setLastBadgePath(status.path)
          }
        }
      } else if (!status.connected) {
        // Badge disconnected - reset the loaded flag so we reload when reconnected
        setConfigLoaded(false)
        setLastBadgePath(null)
      }
    } catch (error) {
      console.error('Failed to check badge status:', error)
    }
  }, [configLoaded, lastBadgePath])

  // Poll for badge connection
  useEffect(() => {
    checkBadgeStatus()
    const interval = setInterval(checkBadgeStatus, 3000)
    return () => clearInterval(interval)
  }, [checkBadgeStatus])

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    // Toast component handles auto-dismiss
  }

  // Save configuration
  const handleSaveConfig = async () => {
    if (!window.electronAPI) {
      showNotification('error', 'Electron API not available')
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.writeConfig(config)
      if (result.success) {
        showNotification('success', 'Configuration saved successfully!')
      } else {
        showNotification('error', result.error || 'Failed to save configuration')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Reload configuration from badge (manual refresh)
  const handleReloadConfig = async () => {
    if (!window.electronAPI || !badgeStatus.connected) return
    
    setIsLoading(true)
    try {
      const result = await window.electronAPI.readConfig()
      if (result.success && result.config) {
        setConfig(result.config)
        showNotification('info', 'Configuration reloaded from badge')
      } else {
        showNotification('error', result.error || 'Failed to reload configuration')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Draggable Title Bar Region */}
        <div className="h-10 bg-base-200/30 border-b border-base-300/30 drag-region flex items-center justify-end px-4">
          <div className="flex items-center gap-2 text-xs text-base-content/40">
            <span className="icon-[tabler--circle-filled] size-2"></span>
            <span>v1.0.0</span>
          </div>
        </div>
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-base-300/50 bg-base-200/20">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              {activeTab === 'config' && 'Badge Configuration'}
              {activeTab === 'badge-info' && 'Badge Display Info'}
              {activeTab === 'firmware' && 'Firmware Update'}
              {activeTab === 'apps' && 'Installed Apps'}
              {activeTab === 'simulator' && 'Badge Simulator'}
            </h1>
            <p className="text-sm text-base-content/50 mt-1">
              {activeTab === 'config' && 'Configure WiFi, GitHub credentials, and optional settings'}
              {activeTab === 'badge-info' && 'Customize your badge display name and details'}
              {activeTab === 'firmware' && 'Flash new firmware to your badge'}
              {activeTab === 'apps' && 'View and manage installed badge applications'}
              {activeTab === 'simulator' && 'Test badge apps and preview your configuration'}
            </p>
          </div>
          <ConnectionStatus status={badgeStatus} onRefresh={checkBadgeStatus} />
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {/* Toast Notification */}
          {notification && (
            <Toast
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="xl:col-span-2 space-y-6">
              {activeTab === 'config' && (
                <ConfigurationPanel
                  config={config}
                  setConfig={setConfig}
                  onSave={handleSaveConfig}
                  onReload={handleReloadConfig}
                  isLoading={isLoading}
                  isConnected={badgeStatus.connected && badgeStatus.mode === 'disk'}
                />
              )}
              {activeTab === 'badge-info' && (
                <BadgeInfoPanel
                  isConnected={badgeStatus.connected && badgeStatus.mode === 'disk'}
                  showNotification={showNotification}
                />
              )}
              {activeTab === 'firmware' && (
                <FirmwarePanel
                  badgeStatus={badgeStatus}
                  showNotification={showNotification}
                />
              )}
              {activeTab === 'apps' && (
                <AppsPanel
                  isConnected={badgeStatus.connected && badgeStatus.mode === 'disk'}
                  showNotification={showNotification}
                />
              )}
              {activeTab === 'simulator' && (
                <SimulatorPanel
                  config={config}
                  showNotification={showNotification}
                />
              )}
            </div>

            {/* Right Panel - Status */}
            <div className="xl:col-span-1">
              <BadgePreview config={config} isConnected={badgeStatus.connected} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
