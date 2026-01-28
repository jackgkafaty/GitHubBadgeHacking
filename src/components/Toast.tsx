import { useEffect, useState } from 'react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true))

    // Auto-dismiss
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 300) // Wait for animation
  }

  const config = {
    success: {
      bg: 'bg-success/10 border-success/30',
      icon: 'icon-[tabler--circle-check]',
      iconColor: 'text-success',
      progressColor: 'bg-success'
    },
    error: {
      bg: 'bg-error/10 border-error/30',
      icon: 'icon-[tabler--alert-circle]',
      iconColor: 'text-error',
      progressColor: 'bg-error'
    },
    info: {
      bg: 'bg-info/10 border-info/30',
      icon: 'icon-[tabler--info-circle]',
      iconColor: 'text-info',
      progressColor: 'bg-info'
    }
  }

  const { bg, icon, iconColor, progressColor } = config[type]

  return (
    <div
      className={`
        fixed top-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]
        rounded-xl border shadow-2xl backdrop-blur-sm
        transition-all duration-300 ease-out overflow-hidden
        ${bg}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-success/20' : type === 'error' ? 'bg-error/20' : 'bg-info/20'}`}>
          <span className={`${icon} size-5 ${iconColor}`}></span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-medium text-base-content leading-relaxed">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-base-content/10 transition-colors shrink-0"
          aria-label="Close notification"
        >
          <span className="icon-[tabler--x] size-4 text-base-content/50"></span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-base-content/5">
        <div
          className={`h-full ${progressColor} animate-shrink`}
        />
      </div>
    </div>
  )
}
