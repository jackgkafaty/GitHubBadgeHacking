# GitHub Badge Customizer

A desktop app for hacking on the GitHub Universe 2025 badge (Badger 2350). Configure WiFi, manage apps, flash firmware, and skip that startup animation.

![Electron](https://img.shields.io/badge/Electron-40-blue?logo=electron)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)

## What's This?

Got a badge from GitHub Universe 2025? This app lets you:

- **Configure your badge** — Set WiFi credentials, GitHub username/token, and other settings without editing Python files by hand
- **Manage apps** — See what's installed, remove apps you don't want, install new ones from the community
- **Flash firmware** — Drag & drop UF2 files to update your badge
- **Skip the startup animation** — Because after the 50th time, you just want your badge to boot
- **Preview your setup** — See how apps will look before writing to the badge

The badge is based on the [Pimoroni Tufty 2350](https://shop.pimoroni.com/products/tufty-2350) with an RP2350 chip, a 160×120 color display, and WiFi.

## Quick Start

```bash
# Clone this repo
git clone https://github.com/jackgkafaty/GitHubBadgeHacking.git
cd GitHubBadgeHacking

# Install dependencies
npm install

# Run the app
npm run electron:dev
```

Connect your badge in disk mode (hold A while plugging in USB) and start customizing.

## Badge Disk Mode

To edit files on your badge:

1. Hold the **A button** while plugging in USB
2. The badge mounts as a drive called `BADGER`
3. Now you can edit `secrets.py`, install apps, etc.

To flash new firmware:

1. Hold **BOOTSEL** (back of badge) while plugging in USB
2. The badge mounts as `RPI-RP2`
3. Drag a `.uf2` file to flash

## The `secrets.py` File

Your badge reads configuration from `/secrets.py`. The app writes this for you, but here's what it looks like:

```python
WIFI_SSID = "YourNetwork"
WIFI_PASSWORD = "YourPassword"
GITHUB_USERNAME = "octocat"
GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"
WEATHER_LOCATION = None  # or "San Francisco, CA"
WLED_IP = None           # or "192.168.1.100"
```

Get a GitHub token from [github.com/settings/tokens](https://github.com/settings/tokens) — the badge app needs it to fetch your profile data.

## Custom Boot (Skip the Animation)

Want the badge to boot straight to your profile instead of playing the animation every time?

Copy `badge-files/main.py` to your badge's root. This modified boot script:

- Skips the cinematic startup
- Boots directly to the badge app
- Press **HOME** to access the menu
- Select a different app from the menu, or the badge app boots again on next power cycle

```bash
# With badge in disk mode:
cp badge-files/main.py /Volumes/BADGER/main.py
```

To restore default behavior, just delete `/Volumes/BADGER/main.py` — the system will use the original from `/system/main.py`.

## App Management

Apps live in two places on the badge:

- `/system/apps/` — Built-in apps (badge, menu, startup, etc.)
- `/apps/` — User-installed apps

### Installing Apps

The App Store in this tool pulls from the [badger/home](https://github.com/badger/home) repo. Set up the simulator first (it clones the repo), then you can install apps to your badge.

Or manually:

```bash
# Copy an app folder to your badge
cp -r ~/.github-badge-customizer/badger-home/badge/apps/snake /Volumes/BADGER/apps/
```

### Removing Apps

Through the app, hover over any non-system app and click the trash icon. Or just delete the folder:

```bash
rm -rf /Volumes/BADGER/apps/snake
```

## Simulator

There's an official simulator in the [badger/home](https://github.com/badger/home) repo. It's a Pygame app that recreates the badge display.

**Requirements:**
- Python 3.10+ (the simulator uses union types like `A | B`)
- Pygame

If you're on macOS with an older Python:

```bash
brew install python@3.12
# Then use python3.12 instead of python3
```

The app will check your Python version and let you know if it's too old.

## Project Structure

```
├── electron/           # Electron main process
│   ├── main.ts        # IPC handlers, badge detection
│   └── preload.cjs    # Context bridge for renderer
├── src/
│   ├── components/    # React components
│   │   ├── AppsPanel.tsx
│   │   ├── BadgePreview.tsx
│   │   ├── ConfigurationPanel.tsx
│   │   └── SimulatorPanel.tsx
│   └── App.tsx        # Main app layout
├── badge-files/       # Files to copy to badge
│   └── main.py        # Custom boot script
└── package.json
```

## Related Projects

- **[badger/home](https://github.com/badger/home)** — Official badge firmware, apps, and simulator
- **[badger.github.io](https://badger.github.io)** — Community hacks and documentation
- **[Pimoroni Tufty 2350](https://github.com/pimoroni/pimoroni-pico)** — Hardware docs and MicroPython libraries

## Badge Hardware

| Spec | Value |
|------|-------|
| Chip | RP2350 (dual Arm Cortex-M33) |
| Display | 160×120 color LCD |
| WiFi | 2.4GHz (via Pico W) |
| Buttons | A, B, C, HOME, D-pad |
| Storage | Internal flash, mounts as USB drive |

## Controls

**On the badge:**
- **A/B/C** — Context-dependent actions
- **D-pad** — Navigate menus
- **HOME** — Return to launcher

**In the simulator:**
- **A/Z** → Button A
- **B/X** → Button B  
- **C/Space** → Button C
- **Arrow keys** → D-pad
- **H/Esc** → Home
- **F12** → Screenshot

## Troubleshooting

**Badge not detected?**
- Make sure you held A while plugging in (disk mode)
- Try a different USB cable (some are charge-only)
- Check if it mounted: `ls /Volumes/BADGER`

**Simulator won't launch?**
- You need Python 3.10+. Check: `python3 --version`
- Install with `brew install python@3.12` on macOS

**Apps not showing up?**
- Make sure they have an `__init__.py` file
- Check both `/system/apps/` and `/apps/` directories

## License

MIT — do whatever you want with it.

---

Built for hacking on the GitHub Universe 2025 badge. Based on the excellent work at [badger/home](https://github.com/badger/home).

