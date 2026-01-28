# Cleaner Menu UI Mod
# Optimized for 160x120 display - cleaner icons, better layout
# Replace /system/apps/menu/__init__.py with this file

import sys
import os

sys.path.insert(0, "/system/apps/menu")
os.chdir("/system/apps/menu")

import math
from badgeware import screen, PixelFont, Image, SpriteSheet, is_dir, file_exists, shapes, brushes, io, run

# ============================================================================
# CLEAN UI COLOR PALETTE
# ============================================================================
class Colors:
    BG_DARK = brushes.color(13, 17, 23)
    BG_CARD = brushes.color(22, 27, 34)
    BG_HOVER = brushes.color(33, 38, 45)
    BG_SELECTED = brushes.color(35, 134, 54)
    TEXT_PRIMARY = brushes.color(230, 237, 243)
    TEXT_SECONDARY = brushes.color(139, 148, 158)
    TEXT_MUTED = brushes.color(110, 118, 129)
    ACCENT_LIME = brushes.color(211, 250, 55)
    ACCENT_GREEN = brushes.color(35, 134, 54)
    BORDER = brushes.color(48, 54, 61)

# ============================================================================
# FONTS
# ============================================================================
small_font = PixelFont.load("/system/assets/fonts/ark.ppf")
large_font = PixelFont.load("/system/assets/fonts/absolute.ppf")

# ============================================================================
# APP DISCOVERY
# ============================================================================
apps = []
try:
    for entry in os.listdir("/system/apps"):
        app_path = f"/system/apps/{entry}"
        if is_dir(app_path):
            has_init = file_exists(f"{app_path}/__init__.py")
            if has_init and entry not in ("menu", "startup"):
                apps.append((entry, entry))
except Exception as e:
    print(f"Error discovering apps: {e}")

# Sort apps alphabetically for cleaner organization
apps.sort(key=lambda x: x[0].lower())

# ============================================================================
# LAYOUT CONFIGURATION - Cleaner grid
# ============================================================================
# Use a 3x2 grid with larger, cleaner icons
COLS = 3
ROWS = 2
APPS_PER_PAGE = COLS * ROWS
current_page = 0
total_pages = max(1, math.ceil(len(apps) / APPS_PER_PAGE))

# Grid positioning
GRID_START_X = 8
GRID_START_Y = 24
CELL_WIDTH = 50
CELL_HEIGHT = 44
ICON_SIZE = 32

active = 0
alpha = 0

# ============================================================================
# ICON CLASS - Cleaner version
# ============================================================================
class CleanIcon:
    def __init__(self, name, path, grid_x, grid_y):
        self.name = name
        self.path = path
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.sprite = None
        self.is_selected = False
        
        # Calculate pixel position
        self.x = GRID_START_X + grid_x * CELL_WIDTH + (CELL_WIDTH - ICON_SIZE) // 2
        self.y = GRID_START_Y + grid_y * CELL_HEIGHT
        
        # Try to load icon
        try:
            icon_path = f"/system/apps/{path}/icon.png"
            if file_exists(icon_path):
                self.sprite = Image.load(icon_path)
            else:
                # Try default icon
                if file_exists("/system/apps/menu/default_icon.png"):
                    self.sprite = Image.load("/system/apps/menu/default_icon.png")
        except Exception as e:
            print(f"Icon load error for {name}: {e}")
    
    def draw(self, is_active):
        # Background highlight for active item
        bg_x = GRID_START_X + self.grid_x * CELL_WIDTH
        bg_y = GRID_START_Y + self.grid_y * CELL_HEIGHT - 2
        
        if is_active:
            # Selected state - green highlight
            screen.brush = Colors.BG_SELECTED
            screen.draw(shapes.rounded_rectangle(bg_x, bg_y, CELL_WIDTH - 4, CELL_HEIGHT, 4))
        
        # Draw icon
        if self.sprite:
            try:
                screen.blit(self.sprite, self.x, self.y)
            except:
                self._draw_placeholder()
        else:
            self._draw_placeholder()
    
    def _draw_placeholder(self):
        """Draw a clean placeholder icon"""
        screen.brush = Colors.BG_HOVER
        screen.draw(shapes.rounded_rectangle(self.x, self.y, ICON_SIZE, ICON_SIZE, 4))
        # Draw first letter of app name
        screen.font = large_font
        screen.brush = Colors.TEXT_SECONDARY
        letter = self.name[0].upper() if self.name else "?"
        lw, _ = screen.measure_text(letter)
        screen.text(letter, self.x + (ICON_SIZE - lw) // 2, self.y + 8)

# ============================================================================
# PAGE LOADING
# ============================================================================
icons = []

def load_page_icons(page):
    global icons
    icons = []
    start_idx = page * APPS_PER_PAGE
    end_idx = min(start_idx + APPS_PER_PAGE, len(apps))
    
    for i in range(start_idx, end_idx):
        app = apps[i]
        name, path = app[0], app[1]
        local_idx = i - start_idx
        grid_x = local_idx % COLS
        grid_y = local_idx // COLS
        icons.append(CleanIcon(name, path, grid_x, grid_y))
    
    return icons

icons = load_page_icons(current_page)

# ============================================================================
# DRAWING FUNCTIONS
# ============================================================================
def draw_header():
    """Draw clean header bar"""
    screen.brush = Colors.BG_CARD
    screen.draw(shapes.rectangle(0, 0, 160, 20))
    
    # Title
    screen.font = large_font
    screen.brush = Colors.ACCENT_LIME
    screen.text("Apps", 6, 3)
    
    # Page indicator (if multiple pages)
    if total_pages > 1:
        screen.font = small_font
        screen.brush = Colors.TEXT_MUTED
        page_text = f"{current_page + 1}/{total_pages}"
        pw, _ = screen.measure_text(page_text)
        screen.text(page_text, 154 - pw, 6)

def draw_footer(active_name):
    """Draw footer with selected app name"""
    footer_y = 112
    
    # Background
    screen.brush = Colors.BG_CARD
    screen.draw(shapes.rectangle(0, footer_y, 160, 8))
    
    # App name centered
    screen.font = small_font
    screen.brush = Colors.TEXT_PRIMARY
    if active_name:
        nw, _ = screen.measure_text(active_name)
        screen.text(active_name, 80 - nw // 2, footer_y)

def draw_nav_hints():
    """Draw subtle navigation hints"""
    screen.font = small_font
    screen.brush = Colors.TEXT_MUTED
    
    # Left/Right arrows for paging (if multiple pages)
    if total_pages > 1:
        if current_page > 0:
            screen.text("<", 2, 55)
        if current_page < total_pages - 1:
            screen.text(">", 152, 55)

# ============================================================================
# MAIN UPDATE LOOP
# ============================================================================
def update():
    global active, icons, alpha, current_page, total_pages

    # Navigation input
    if io.BUTTON_C in io.pressed:  # Right
        active += 1
    if io.BUTTON_A in io.pressed:  # Left
        active -= 1
    if io.BUTTON_UP in io.pressed:
        active -= COLS
    if io.BUTTON_DOWN in io.pressed:
        active += COLS
    
    # Handle page wrapping
    if active >= len(icons):
        if current_page < total_pages - 1:
            current_page += 1
            icons = load_page_icons(current_page)
            active = 0
        else:
            current_page = 0
            icons = load_page_icons(current_page)
            active = 0
    elif active < 0:
        if current_page > 0:
            current_page -= 1
            icons = load_page_icons(current_page)
            active = len(icons) - 1
        else:
            current_page = total_pages - 1
            icons = load_page_icons(current_page)
            active = len(icons) - 1
    
    # Launch app on B press
    if io.BUTTON_B in io.pressed:
        app_idx = current_page * APPS_PER_PAGE + active
        if app_idx < len(apps):
            app_path = f"/system/apps/{apps[app_idx][1]}"
            if is_dir(app_path) and file_exists(f"{app_path}/__init__.py"):
                return app_path
    
    # === DRAW UI ===
    
    # Background
    screen.brush = Colors.BG_DARK
    screen.draw(shapes.rectangle(0, 0, 160, 120))
    
    # Header
    draw_header()
    
    # Draw icons
    for i, icon in enumerate(icons):
        icon.draw(i == active)
    
    # Footer with active app name
    active_name = icons[active].name if icons and active < len(icons) else ""
    draw_footer(active_name)
    
    # Navigation hints
    draw_nav_hints()
    
    # Fade in effect
    if alpha < 255:
        screen.brush = brushes.color(0, 0, 0, 255 - alpha)
        screen.draw(shapes.rectangle(0, 0, 160, 120))
        alpha = min(255, alpha + 30)
    
    return None

if __name__ == "__main__":
    run(update)
