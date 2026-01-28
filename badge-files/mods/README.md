# Badge UI Mods

Clean UI modifications for the GitHub Universe 2025 Badge.

## How the Badge Works

1. **On startup**: Badge shows intro animation → then **menu** (app grid)
2. **Select an app**: Use arrows to navigate, ENTER to launch
3. **Return to menu**: Press **HOME button** (this resets the badge and shows menu again)

The HOME button triggers a hardware reset, which restarts the badge and shows the menu.

## What's Different in the Mod?

The clean-badge mod improves text readability:
- Brighter white text (`240, 248, 255` vs `235, 245, 255`)
- Same layout, colors, and functionality as original

## Installation

### Option 1: Via the Desktop App (Recommended)
1. Connect your badge (disk mode - tap RESET twice)
2. Open the app, go to **Apps** tab
3. Click **Install Mod** → Select the mod you want
4. The mod will backup your original and install the clean version

### Option 2: Manual Installation

1. Connect badge in disk mode (tap RESET twice)
2. Navigate to the badge volume (usually `BADGER`)
3. Backup the original file:
   ```
   cp /Volumes/BADGER/system/apps/badge/__init__.py /Volumes/BADGER/system/apps/badge/__init__.py.bak
   ```
4. Copy the mod file:
   ```
   cp badge-files/mods/clean-badge/__init__.py /Volumes/BADGER/system/apps/badge/__init__.py
   ```
5. Tap RESET once to reload

## Available Mods

### `clean-badge`
Improved badge profile display:
- Cleaner, brighter text for better readability
- Same layout and design as original

### `bootlog-startup`
Dev-style boot log instead of animation:
- Terminal-style green text on black
- Typing effect with `[ OK ]` status messages
- Shows fake hardware initialization
- Press any key to continue to menu

Install to: `/system/apps/startup/__init__.py`

### `clean-menu` (Optional)
Cleaner app launcher menu:
Cleaner app launcher menu:
- 3×2 grid layout
- Sorted apps alphabetically
- Selected app name in footer
- Page indicators
- Smooth highlight on selection

## Reverting to Original

### Via the Desktop App
1. Go to **Apps** tab
2. Click **Restore Original** next to the installed mod

### Manual Restore
If you backed up your files, restore them:
```bash
cp /Volumes/BADGER/system/apps/badge/__init__.py.bak /Volumes/BADGER/system/apps/badge/__init__.py
```

Or re-flash the original firmware UF2 to reset everything.

## Navigation

- **Arrows**: Navigate between apps in menu
- **ENTER (B button)**: Launch selected app
- **HOME button**: Return to menu (hardware reset)
- **A+C held**: Force refresh data in badge app

## Technical Notes

- These mods work with the existing firmware (no UF2 changes needed)
- Compatible with the official badge firmware  
- Preserves all functionality (WiFi, GitHub API, etc.)
- Only changes visual presentation
