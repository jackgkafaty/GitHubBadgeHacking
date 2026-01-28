# Badge UI Mods

Clean, modern UI modifications for the GitHub Universe 2025 Badge.

## What's Different?

These mods improve the visual design within the badge's 160×120 pixel hardware limitation:

### Original vs Clean UI

| Aspect | Original | Clean Mod |
|--------|----------|-----------|
| Color palette | Bright, high contrast | GitHub dark theme, subtle |
| Layout | Cluttered, overlapping | Organized sections, proper spacing |
| Text | Multiple font sizes | Consistent hierarchy |
| Stats | Stacked vertically | Clean horizontal row |
| Contribution graph | Full 53 weeks, scrolling | Recent 30 weeks, static |
| Error screens | Text-heavy | Clear instructions with numbers |

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
   cp /Volumes/BADGER/apps/badge/__init__.py /Volumes/BADGER/apps/badge/__init__.py.bak
   ```
4. Copy the mod file:
   ```
   cp badge-files/mods/clean-badge/__init__.py /Volumes/BADGER/apps/badge/__init__.py
   ```
5. Tap RESET once to reload

## Available Mods

### `clean-badge`
Cleaner GitHub profile display:
- Dark GitHub-style color palette
- Horizontal stats row (repos, followers, contribs)
- Compact contribution graph (recent activity only)
- Small avatar in corner
- Clean loading states

### `clean-menu`
Cleaner app launcher:
- 3×2 grid layout
- Sorted apps alphabetically
- Selected app name in footer
- Page indicators
- Smooth highlight on selection

## Reverting to Original

If you backed up your files, simply restore them:
```bash
cp /Volumes/BADGER/apps/badge/__init__.py.bak /Volumes/BADGER/apps/badge/__init__.py
```

Or re-flash the original firmware UF2 to reset everything.

## Technical Notes

- These mods work with the existing firmware (no UF2 changes needed)
- Compatible with the official badge firmware
- Preserves all functionality (WiFi, GitHub API, etc.)
- Only changes visual presentation

## Color Palette Reference

```
Background Dark:    #0D1117 (13, 17, 23)
Background Card:    #161B22 (22, 27, 34)
Background Hover:   #21262D (33, 38, 45)
Text Primary:       #E6EDF3 (230, 237, 243)
Text Secondary:     #8B949E (139, 148, 158)
Accent Green:       #238636 (35, 134, 54)
Accent Lime:        #D3FA37 (211, 250, 55)
```

These colors match GitHub's dark theme for a cohesive look.
