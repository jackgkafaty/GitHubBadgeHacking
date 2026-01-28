interface BadgeConfig {
  WIFI_SSID: string
  WIFI_PASSWORD: string
  GITHUB_USERNAME: string
  GITHUB_TOKEN: string
  WEATHER_LOCATION?: string | null
  WLED_IP?: string
}

interface ConfigurationPanelProps {
  config: BadgeConfig
  setConfig: (config: BadgeConfig) => void
  onSave: () => void
  onReload: () => void
  isLoading: boolean
  isConnected: boolean
}

export default function ConfigurationPanel({
  config,
  setConfig,
  onSave,
  onReload,
  isLoading,
  isConnected
}: ConfigurationPanelProps) {
  const updateConfig = <K extends keyof BadgeConfig>(key: K, value: BadgeConfig[K]) => {
    setConfig({ ...config, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* WiFi Settings */}
      <div className="card">
        <div className="card-body p-6">
          <div className="section-header">
            <div className="section-icon icon-info">
              <span className="icon-[tabler--wifi] size-5 text-info"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">WiFi Settings</h2>
              <p className="text-sm text-base-content/50">Configure your 2.4GHz WiFi network</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Network Name (SSID)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Your WiFi network name"
                value={config.WIFI_SSID}
                onChange={(e) => updateConfig('WIFI_SSID', e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt">Must be 2.4GHz network</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input"
                placeholder="WiFi password"
                value={config.WIFI_PASSWORD}
                onChange={(e) => updateConfig('WIFI_PASSWORD', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Settings */}
      <div className="card">
        <div className="card-body p-6">
          <div className="section-header">
            <div className="section-icon icon-primary">
              <span className="icon-[tabler--brand-github] size-5 text-primary"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">GitHub Settings</h2>
              <p className="text-sm text-base-content/50">Your GitHub profile information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text">GitHub Username</span>
                <span className="badge badge-success badge-sm">Required</span>
              </label>
              <div className="input flex items-center gap-2">
                <span className="text-base-content/50 font-medium">@</span>
                <input
                  type="text"
                  className="grow bg-transparent border-none outline-none text-base-content placeholder:text-base-content/40"
                  placeholder="octocat"
                  value={config.GITHUB_USERNAME}
                  onChange={(e) => updateConfig('GITHUB_USERNAME', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Personal Access Token</span>
                <span className="badge badge-neutral badge-sm">Optional</span>
              </label>
              <input
                type="password"
                className="input"
                placeholder="ghp_xxxxxxxxxxxx"
                value={config.GITHUB_TOKEN}
                onChange={(e) => updateConfig('GITHUB_TOKEN', e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt">For higher API rate limits (5000/hr vs 60/hr)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Settings */}
      <div className="card">
        <div className="card-body p-6">
          <div className="section-header">
            <div className="section-icon icon-accent">
              <span className="icon-[tabler--adjustments] size-5 text-accent"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">Optional Settings</h2>
              <p className="text-sm text-base-content/50">Additional configuration options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Weather Location</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Auto-detect from IP"
                value={config.WEATHER_LOCATION || ''}
                onChange={(e) => updateConfig('WEATHER_LOCATION', e.target.value || null)}
              />
              <label className="label">
                <span className="label-text-alt">e.g., "Tokyo" or "London, GB"</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">WLED IP Address</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="192.168.1.100"
                value={config.WLED_IP || ''}
                onChange={(e) => updateConfig('WLED_IP', e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt">For WLED controller app</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {!isConnected && (
          <div className="alert alert-warning flex-1">
            <span className="icon-[tabler--alert-triangle] size-5"></span>
            <span>Connect your badge in disk mode to save configuration</span>
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            className="btn btn-outline h-12 px-6 gap-2"
            onClick={onReload}
            disabled={!isConnected || isLoading}
            title="Reload configuration from badge"
          >
            <span className="icon-[tabler--refresh] size-5"></span>
            Reload
          </button>
          <button
            className="btn btn-primary h-12 px-8 gap-2"
            onClick={onSave}
            disabled={!isConnected || isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="icon-[tabler--device-floppy] size-5"></span>
            )}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
