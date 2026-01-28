import { useState, useEffect } from 'react'

interface BadgePersonalInfo {
  firstName: string
  lastName: string
  title: string
  pronouns: string
  handle: string
  company: string
}

interface BadgeInfoPanelProps {
  isConnected: boolean
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function BadgeInfoPanel({ isConnected, showNotification }: BadgeInfoPanelProps) {
  const [info, setInfo] = useState<BadgePersonalInfo>({
    firstName: '',
    lastName: '',
    title: '',
    pronouns: '',
    handle: '',
    company: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadInfo = async () => {
    if (!window.electronAPI || !isConnected) return

    setIsLoading(true)
    try {
      const result = await window.electronAPI.readBadgeInfo()
      if (result.success && result.info) {
        setInfo(result.info)
        setHasChanges(false)
      } else if (result.error) {
        showNotification('info', 'No badge.txt found - create one for your eInk badge')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadInfo()
    }
  }, [isConnected])

  const handleChange = (field: keyof BadgePersonalInfo, value: string) => {
    setInfo(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!window.electronAPI) return

    setIsSaving(true)
    try {
      const result = await window.electronAPI.writeBadgeInfo(info)
      if (result.success) {
        showNotification('success', 'Badge info saved successfully!')
        setHasChanges(false)
      } else {
        showNotification('error', result.error || 'Failed to save badge info')
      }
    } catch (error) {
      showNotification('error', `Error: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-base-content">Badge Personal Info</h3>
        <p className="text-sm text-base-content/50">
          Customize the information displayed on your eInk badge attachment
        </p>
      </div>

      {!isConnected ? (
        <div className="card">
          <div className="card-body items-center text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-base-300/50 flex items-center justify-center mb-4">
              <span className="icon-[tabler--plug-off] size-10 text-base-content/20"></span>
            </div>
            <h3 className="text-xl font-bold text-base-content">Badge Not Connected</h3>
            <p className="text-base-content/50 max-w-md mt-2">
              Connect your badge in disk mode to edit personal info for the eInk display.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="card">
          <div className="card-body items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/50 mt-4 font-medium">Loading badge info...</p>
          </div>
        </div>
      ) : (
        <>
          {/* eInk Preview */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="font-bold text-base-content mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-info/20 flex items-center justify-center">
                  <span className="icon-[tabler--id-badge-2] size-5 text-info"></span>
                </div>
                eInk Display Preview
              </h3>

              {/* Badge Preview */}
              <div className="flex justify-center">
                <div className="bg-gray-50 text-gray-900 p-8 rounded-2xl w-96 shadow-2xl border-4 border-gray-200">
                  <div className="border-b-2 border-gray-300 pb-5 mb-5">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {info.firstName || 'First'} {info.lastName || 'Last'}
                    </h2>
                    {info.pronouns && (
                      <p className="text-base text-gray-500 mt-1">{info.pronouns}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {info.title && (
                      <p className="text-xl text-gray-700 font-medium">{info.title}</p>
                    )}
                    {info.company && (
                      <p className="text-lg text-gray-600">{info.company}</p>
                    )}
                    {info.handle && (
                      <p className="text-gray-500 font-mono text-lg">@{info.handle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="font-bold text-base-content mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="icon-[tabler--pencil] size-5 text-accent"></span>
                </div>
                Edit Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="form-control">
                  <label className="label" htmlFor="firstName">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="input"
                    placeholder="Enter first name"
                    value={info.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                  />
                </div>

                {/* Last Name */}
                <div className="form-control">
                  <label className="label" htmlFor="lastName">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="input"
                    placeholder="Enter last name"
                    value={info.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                </div>

                {/* Pronouns */}
                <div className="form-control">
                  <label className="label" htmlFor="pronouns">
                    <span className="label-text">Pronouns</span>
                  </label>
                  <input
                    type="text"
                    id="pronouns"
                    className="input"
                    placeholder="e.g., they/them, she/her"
                    value={info.pronouns}
                    onChange={(e) => handleChange('pronouns', e.target.value)}
                  />
                </div>

                {/* Handle */}
                <div className="form-control">
                  <label className="label" htmlFor="handle">
                    <span className="label-text">GitHub Handle</span>
                  </label>
                  <div className="input-group">
                    <span>@</span>
                    <input
                      type="text"
                      id="handle"
                      className="input"
                      placeholder="username"
                      value={info.handle}
                      onChange={(e) => handleChange('handle', e.target.value)}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="form-control sm:col-span-2">
                  <label className="label" htmlFor="title">
                    <span className="label-text">Title / Role</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="input"
                    placeholder="e.g., Senior Software Engineer"
                    value={info.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </div>

                {/* Company */}
                <div className="form-control sm:col-span-2">
                  <label className="label" htmlFor="company">
                    <span className="label-text">Company / Organization</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="input"
                    placeholder="e.g., Acme Inc."
                    value={info.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-primary h-12 px-8 gap-2"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span className="icon-[tabler--device-floppy] size-5"></span>
                  )}
                  Save to Badge
                </button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card">
            <div className="card-body p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-info/15 border border-info/20 flex items-center justify-center shrink-0">
                  <span className="icon-[tabler--info-circle] size-5 text-info"></span>
                </div>
                <div>
                  <h4 className="font-bold text-base-content mb-2">About the eInk Badge</h4>
                  <p className="text-sm text-base-content/60 leading-relaxed">
                    The eInk display attachment shows your personal information in a low-power, 
                    always-visible format. This info is stored in <code className="px-2 py-0.5 bg-base-100 rounded text-xs font-mono">badge.txt</code> on 
                    your badge. The eInk display updates when you power on the badge with the eInk
                    attachment connected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
