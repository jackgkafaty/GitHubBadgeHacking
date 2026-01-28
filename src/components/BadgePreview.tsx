import { useState, useEffect } from 'react'

interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

interface AppInfo {
  name: string
  hasIcon: boolean
}

interface BadgePreviewProps {
  config: BadgeConfig
  isConnected: boolean
}

export default function BadgePreview({ config, isConnected }: BadgePreviewProps) {
  const [apps, setApps] = useState<AppInfo[]>([])
  const [currentApp, setCurrentApp] = useState<string>('badge')
  const [isLoading, setIsLoading] = useState(false)

  // Load apps when connected
  useEffect(() => {
    const loadApps = async () => {
      if (!window.electronAPI || !isConnected) {
        setApps([])
        return
      }

      setIsLoading(true)
      try {
        const result = await window.electronAPI.listApps()
        if (result.success && result.apps) {
          setApps(result.apps)
        }
      } catch (error) {
        console.error('Failed to load apps for preview:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApps()
  }, [isConnected])

  // Render different app previews
  const renderAppPreview = () => {
    switch (currentApp) {
      case 'badge':
        return (
          <div className="h-full flex flex-col p-3">
            {/* GitHub Badge App Preview */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/40 to-primary/20 flex items-center justify-center">
                <span className="icon-[tabler--brand-github] size-4 text-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">
                  {config.GITHUB_USERNAME || 'username'}
                </p>
                <p className="text-[8px] text-primary">GitHub</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold text-white">123</p>
                  <p className="text-[7px] text-base-content/50">Repos</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">1.2K</p>
                  <p className="text-[7px] text-base-content/50">Followers</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">456</p>
                  <p className="text-[7px] text-base-content/50">Following</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[7px] text-base-content/40">
                {config.WIFI_SSID ? `📶 ${config.WIFI_SSID}` : '📵 No WiFi'}
              </p>
            </div>
          </div>
        )

      case 'menu':
        return (
          <div className="h-full flex flex-col p-2">
            <p className="text-[8px] text-center text-base-content/50 mb-2">Select App</p>
            <div className="grid grid-cols-3 gap-1 flex-1">
              {apps.slice(0, 6).map((app, i) => (
                <div
                  key={app.name}
                  className={`rounded-lg flex flex-col items-center justify-center p-1 ${
                    i === 0 ? 'bg-primary/30 ring-1 ring-primary' : 'bg-base-content/5'
                  }`}
                >
                  <div className="w-5 h-5 rounded bg-base-content/10 mb-0.5"></div>
                  <p className="text-[6px] text-white truncate w-full text-center">{app.name}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'flappy':
        return (
          <div className="h-full relative overflow-hidden bg-linear-to-b from-sky-900/50 to-sky-700/30">
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-green-800/50"></div>
            {/* Pipes */}
            <div className="absolute left-[60%] top-0 w-4 h-8 bg-green-600/60 rounded-b"></div>
            <div className="absolute left-[60%] bottom-4 w-4 h-10 bg-green-600/60 rounded-t"></div>
            {/* Bird/Mona */}
            <div className="absolute left-[30%] top-[40%] w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[8px]">🐙</span>
            </div>
            {/* Score */}
            <p className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">5</p>
          </div>
        )

      case 'gallery':
        return (
          <div className="h-full p-2">
            <div className="h-full rounded-lg bg-base-content/10 flex items-center justify-center">
              <span className="icon-[tabler--photo] size-8 text-base-content/30"></span>
            </div>
          </div>
        )

      case 'monapet':
        return (
          <div className="h-full flex flex-col p-2">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl">🐙</span>
                <p className="text-[7px] text-primary mt-1">Mona is happy!</p>
              </div>
            </div>
            <div className="flex justify-around text-center">
              <div><span className="text-[8px]">❤️</span><p className="text-[6px] text-base-content/50">85%</p></div>
              <div><span className="text-[8px]">🍔</span><p className="text-[6px] text-base-content/50">70%</p></div>
              <div><span className="text-[8px]">🧼</span><p className="text-[6px] text-base-content/50">90%</p></div>
            </div>
          </div>
        )

      case 'sketch':
        return (
          <div className="h-full p-2">
            <div className="h-full rounded bg-white/90 relative">
              {/* Sketch lines */}
              <div className="absolute top-3 left-3 w-8 h-0.5 bg-gray-800 rotate-12"></div>
              <div className="absolute top-5 left-6 w-6 h-0.5 bg-gray-800 -rotate-6"></div>
              <div className="absolute top-8 left-4 w-10 h-0.5 bg-gray-800 rotate-3"></div>
              <div className="absolute bottom-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </div>
        )

      case 'quest':
        return (
          <div className="h-full flex flex-col p-2">
            <p className="text-[8px] text-center text-primary mb-1">IR Quest</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-1">
                {[1,2,3,4,5,6,7,8,9].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i <= 3 ? 'bg-success' : 'bg-base-content/20'} flex items-center justify-center`}>
                    <span className="text-[6px] text-white">{i <= 3 ? '✓' : i}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[7px] text-center text-base-content/50">3/9 Found</p>
          </div>
        )

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <span className="icon-[tabler--app-window] size-8 text-base-content/20"></span>
              <p className="text-[8px] text-base-content/40 mt-1 capitalize">{currentApp}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="card sticky top-6">
      <div className="card-body p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
            <span className="icon-[tabler--device-mobile] size-5 text-secondary"></span>
          </div>
          <div>
            <h2 className="font-bold text-base-content">Badge Preview</h2>
            <p className="text-xs text-base-content/50">160×120 display simulation</p>
          </div>
        </div>

        {/* Badge Display Mock - 160x120 aspect ratio (4:3) */}
        <div className="relative">
          {/* Badge Frame */}
          <div className="bg-gray-900 rounded-2xl p-3 shadow-2xl">
            {/* Screen bezel */}
            <div className="bg-gray-800 rounded-xl p-1">
              {/* Screen */}
              <div className="badge-preview rounded-lg overflow-hidden relative aspect-4/3">
                {/* Screen glow effect */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none z-10"></div>
                
                {/* Content */}
                <div className="relative z-0 h-full bg-base-100/95">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="loading loading-spinner loading-sm text-primary"></span>
                    </div>
                  ) : !isConnected ? (
                    <div className="h-full flex flex-col items-center justify-center p-3">
                      <span className="icon-[tabler--plug-off] size-6 text-base-content/20 mb-2"></span>
                      <p className="text-[8px] text-base-content/40 text-center">Connect badge to see preview</p>
                    </div>
                  ) : (
                    renderAppPreview()
                  )}
                </div>
              </div>
            </div>
            
            {/* Physical buttons mockup */}
            <div className="flex justify-center gap-2 mt-2">
              {['A', 'B', 'C'].map(btn => (
                <div key={btn} className="w-4 h-4 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <span className="text-[6px] text-gray-400">{btn}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* App Switcher */}
        {isConnected && apps.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-base-content/50 mb-2">Preview App</p>
            <div className="flex flex-wrap gap-1.5">
              {apps.map(app => (
                <button
                  key={app.name}
                  onClick={() => setCurrentApp(app.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    currentApp === app.name 
                      ? 'bg-primary text-white' 
                      : 'bg-base-300/50 text-base-content/60 hover:bg-base-300'
                  }`}
                >
                  {app.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-base-300/50">
            <span className="text-sm text-base-content/50">Display</span>
            <span className="font-mono text-sm text-base-content">160 × 120</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-base-300/50">
            <span className="text-sm text-base-content/50">WiFi</span>
            <span className={`badge ${config.WIFI_SSID ? 'badge-success' : 'badge-neutral'}`}>
              {config.WIFI_SSID ? config.WIFI_SSID : 'Not Set'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-base-300/50">
            <span className="text-sm text-base-content/50">GitHub</span>
            <span className={`badge ${config.GITHUB_USERNAME ? 'badge-success' : 'badge-neutral'}`}>
              {config.GITHUB_USERNAME ? `@${config.GITHUB_USERNAME}` : 'Not Set'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-base-content/50">Connection</span>
            <span className={`badge ${isConnected ? 'badge-success' : 'badge-neutral'}`}>
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
