import { useState } from 'react'

interface FirmwarePanelProps {
  badgeStatus: {
    connected: boolean
    path: string | null
    mode: 'disk' | 'bootsel' | 'disconnected'
  }
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function FirmwarePanel({ badgeStatus, showNotification }: FirmwarePanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)

  const handleSelectFirmware = async () => {
    if (!window.electronAPI) return

    const result = await window.electronAPI.selectFirmware()
    if (result.success && result.filePath) {
      setSelectedFile(result.filePath)
    }
  }

  const handleFlash = async () => {
    if (!window.electronAPI || !selectedFile) return

    setIsFlashing(true)
    try {
      const result = await window.electronAPI.flashFirmware(selectedFile)
      if (result.success) {
        showNotification('success', 'Firmware flashed successfully!')
        setSelectedFile(null)
      } else {
        showNotification('error', result.error || 'Failed to flash firmware')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsFlashing(false)
    }
  }

  const isBootselMode = badgeStatus.connected && badgeStatus.mode === 'bootsel'

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="card">
        <div className="card-body p-6">
          <div className="section-header">
            <div className="section-icon icon-warning">
              <span className="icon-[tabler--alert-triangle] size-5 text-warning"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">BOOTSEL Mode Required</h2>
              <p className="text-sm text-base-content/50">Your badge must be in BOOTSEL mode to flash firmware</p>
            </div>
          </div>

          <div className="steps steps-vertical lg:steps-horizontal w-full">
            <div className={`step ${badgeStatus.connected ? 'step-primary' : ''}`}>
              <div className="step-content">
                <span className="font-semibold">Connect Badge</span>
                <span className="text-xs text-base-content/50">Via USB-C cable</span>
              </div>
            </div>
            <div className={`step ${isBootselMode ? 'step-primary' : ''}`}>
              <div className="step-content">
                <span className="font-semibold">Enter BOOTSEL</span>
                <span className="text-xs text-base-content/50">Hold HOME + tap RESET</span>
              </div>
            </div>
            <div className={`step ${selectedFile ? 'step-primary' : ''}`}>
              <div className="step-content">
                <span className="font-semibold">Select Firmware</span>
                <span className="text-xs text-base-content/50">Choose .uf2 file</span>
              </div>
            </div>
            <div className="step">
              <div className="step-content">
                <span className="font-semibold">Flash</span>
                <span className="text-xs text-base-content/50">Upload firmware</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="font-bold text-base-content mb-5">Current Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-base-300/50 flex items-center justify-center">
                  <span className="icon-[tabler--usb] size-5 text-base-content/60"></span>
                </div>
                <div>
                  <p className="font-semibold text-base-content">Connection</p>
                  <p className="text-sm text-base-content/50">USB device status</p>
                </div>
              </div>
              <span className={`badge ${badgeStatus.connected ? 'badge-success' : 'badge-neutral'}`}>
                {badgeStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-base-300/50 flex items-center justify-center">
                  <span className="icon-[tabler--cpu] size-5 text-base-content/60"></span>
                </div>
                <div>
                  <p className="font-semibold text-base-content">Badge Mode</p>
                  <p className="text-sm text-base-content/50">Current operating mode</p>
                </div>
              </div>
              <span className={`badge ${
                isBootselMode ? 'badge-success' : 
                badgeStatus.mode === 'disk' ? 'badge-info' : 'badge-neutral'
              }`}>
                {badgeStatus.mode === 'bootsel' ? 'BOOTSEL (Ready)' :
                 badgeStatus.mode === 'disk' ? 'Disk Mode' : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Firmware Selection */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="font-bold text-base-content mb-5">Select Firmware</h3>

          <div 
            className={`drag-area text-center cursor-pointer ${selectedFile ? 'border-success bg-success/5' : ''}`}
            onClick={handleSelectFirmware}
          >
            {selectedFile ? (
              <>
                <span className="icon-[tabler--file-check] size-14 text-success mb-3"></span>
                <p className="font-semibold text-success text-lg">Firmware Selected</p>
                <p className="text-sm text-base-content/50 mt-2 truncate max-w-md mx-auto font-mono">
                  {selectedFile.split('/').pop()}
                </p>
                <button 
                  className="btn btn-ghost btn-sm mt-4"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <>
                <span className="icon-[tabler--upload] size-14 text-base-content/20 mb-3"></span>
                <p className="font-semibold text-base-content text-lg">Click to select firmware file</p>
                <p className="text-sm text-base-content/50 mt-2">
                  Only .uf2 files are supported
                </p>
              </>
            )}
          </div>

          {/* Flash Button */}
          <div className="flex justify-end mt-6">
            <button
              className="btn btn-primary h-12 px-8 gap-2"
              disabled={!isBootselMode || !selectedFile || isFlashing}
              onClick={handleFlash}
            >
              {isFlashing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="icon-[tabler--bolt] size-5"></span>
              )}
              Flash Firmware
            </button>
          </div>

          {!isBootselMode && (
            <div className="alert alert-info mt-5">
              <span className="icon-[tabler--info-circle] size-5"></span>
              <span>Put your badge in BOOTSEL mode: Hold HOME button, tap RESET, then release HOME</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
