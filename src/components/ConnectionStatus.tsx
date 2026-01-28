interface ConnectionStatusProps {
  status: {
    connected: boolean
    path: string | null
    mode: 'disk' | 'bootsel' | 'disconnected'
  }
  onRefresh: () => void
}

export default function ConnectionStatus({ status, onRefresh }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    if (!status.connected) {
      return {
        bg: 'bg-base-300/80',
        text: 'text-base-content/60',
        dot: 'bg-base-content/30',
        label: 'Disconnected',
        icon: 'plug-off'
      }
    }
    if (status.mode === 'disk') {
      return {
        bg: 'bg-success/15 border border-success/30',
        text: 'text-success',
        dot: 'bg-success animate-pulse-green',
        label: 'Connected (Disk Mode)',
        icon: 'plug-connected'
      }
    }
    return {
      bg: 'bg-warning/15 border border-warning/30',
      text: 'text-warning',
      dot: 'bg-warning animate-pulse',
      label: 'Connected (BOOTSEL)',
      icon: 'plug-connected'
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${config.bg}`}>
        <span className={`icon-[tabler--${config.icon}] size-4 ${config.text}`}></span>
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${config.dot}`}></span>
          <span className={`text-sm font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>
      
      <button
        onClick={onRefresh}
        className="btn btn-ghost btn-square h-10 w-10 rounded-xl"
        title="Refresh connection status"
        aria-label="Refresh connection status"
      >
        <span className="icon-[tabler--refresh] size-5"></span>
      </button>
    </div>
  )
}
