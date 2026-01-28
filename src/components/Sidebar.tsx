interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: 'config' | 'badge-info' | 'firmware' | 'apps' | 'simulator') => void
}

const navItems = [
  { id: 'config', label: 'Configuration', icon: 'settings', description: 'WiFi & GitHub' },
  { id: 'badge-info', label: 'Badge Info', icon: 'id-badge-2', description: 'eInk display' },
  { id: 'firmware', label: 'Firmware', icon: 'cpu', description: 'Update badge' },
  { id: 'apps', label: 'Apps', icon: 'apps', description: 'Installed apps' },
  { id: 'simulator', label: 'Simulator', icon: 'device-gamepad-2', description: 'Test without badge' },
] as const

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-72 bg-linear-to-b from-base-200 to-base-100 border-r border-base-300/50 flex flex-col">
      {/* Draggable Logo Area */}
      <div className="p-6 pt-12 drag-region">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
            <span className="icon-[tabler--badge] size-7 text-primary"></span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-base-content">Badge Customizer</h1>
            <p className="text-xs text-base-content/50 font-medium">GitHub Universe 2025</p>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Navigation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 no-drag">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === item.id 
                ? 'bg-primary/20' 
                : 'bg-base-300/50'
            }`}>
              <span className={`icon-[tabler--${item.icon}] size-5 ${
                activeTab === item.id ? 'text-primary' : 'text-base-content/50'
              }`}></span>
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold text-sm">{item.label}</span>
              <span className="block text-xs opacity-60">{item.description}</span>
            </div>
            {activeTab === item.id && (
              <span className="icon-[tabler--chevron-right] size-4 text-primary/60"></span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-base-300/50">
        <div className="rounded-xl bg-linear-to-br from-info/10 to-info/5 border border-info/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center shrink-0">
              <span className="icon-[tabler--bulb] size-4 text-info"></span>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-info mb-1">Quick Tip</p>
              <p className="text-base-content/60 leading-relaxed">Connect via USB and tap RESET twice to enter disk mode.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
