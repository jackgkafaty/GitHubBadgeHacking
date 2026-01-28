# Fixed Menu - proper layout for 160x120 display
# Apps in grid, name visible at bottom
# Hold A+C together to power off

import sys
import os
import math

sys.path.insert(0, "/system/apps/menu")
os.chdir("/system/apps/menu")

from badgeware import screen, PixelFont, Image, is_dir, file_exists, shapes, brushes, io, run, get_battery_level, is_charging, display
import machine
import time

# Colors
BLACK = brushes.color(0, 0, 0)
BG = brushes.color(35, 41, 37)
PHOSPHOR = brushes.color(211, 250, 55)
TEXT_DIM = brushes.color(150, 180, 50)
SELECTED_BG = brushes.color(50, 60, 50)

# Font
font = PixelFont.load("/system/assets/fonts/ark.ppf")
screen.font = font

# Discover apps
apps = []
try:
    for entry in os.listdir("/system/apps"):
        app_path = f"/system/apps/{entry}"
        if is_dir(app_path) and file_exists(f"{app_path}/__init__.py"):
            if entry not in ("menu", "startup"):
                apps.append((entry, entry))
except Exception as e:
    print(f"Error: {e}")

apps.sort(key=lambda x: x[0].lower())

# Layout: 3 columns x 2 rows = 6 per page
COLS = 3
ROWS = 2
APPS_PER_PAGE = COLS * ROWS
current_page = 0
total_pages = max(1, math.ceil(len(apps) / APPS_PER_PAGE))

# Grid dimensions - leave room for header (18px) and footer (16px)
HEADER_H = 18
FOOTER_H = 16
GRID_H = 120 - HEADER_H - FOOTER_H  # 86px for grid
CELL_W = 160 // COLS  # ~53px
CELL_H = GRID_H // ROWS  # ~43px
ICON_SIZE = 32

active = 0
alpha = 0

# Load icons for current page
icons = []
icon_sprites = {}

def load_page():
    global icons, icon_sprites
    icons = []
    start = current_page * APPS_PER_PAGE
    end = min(start + APPS_PER_PAGE, len(apps))
    
    for i in range(start, end):
        name = apps[i][0]
        path = apps[i][1]
        local_i = i - start
        col = local_i % COLS
        row = local_i // COLS
        
        # Center icon in cell
        x = col * CELL_W + (CELL_W - ICON_SIZE) // 2
        y = HEADER_H + row * CELL_H + (CELL_H - ICON_SIZE) // 2
        
        # Load sprite if not cached
        if path not in icon_sprites:
            try:
                icon_path = f"/system/apps/{path}/icon.png"
                if file_exists(icon_path):
                    icon_sprites[path] = Image.load(icon_path)
                elif file_exists("/system/apps/menu/default_icon.png"):
                    icon_sprites[path] = Image.load("/system/apps/menu/default_icon.png")
                else:
                    icon_sprites[path] = None
            except:
                icon_sprites[path] = None
        
        icons.append({
            'name': name,
            'path': path,
            'x': x,
            'y': y,
            'sprite': icon_sprites.get(path)
        })

load_page()


def draw_header():
    # Background bar
    screen.brush = brushes.color(25, 30, 27)
    screen.draw(shapes.rectangle(0, 0, 160, HEADER_H))
    
    # Title
    screen.brush = PHOSPHOR
    screen.text("Apps", 5, 3)
    
    # Battery
    batt = get_battery_level() if not is_charging() else int((io.ticks / 20) % 100)
    bx, by = 135, 4
    screen.brush = PHOSPHOR
    screen.draw(shapes.rectangle(bx, by, 18, 10))
    screen.draw(shapes.rectangle(bx + 18, by + 3, 2, 4))
    screen.brush = BG
    screen.draw(shapes.rectangle(bx + 1, by + 1, 16, 8))
    screen.brush = PHOSPHOR
    bw = int(14 * batt / 100)
    screen.draw(shapes.rectangle(bx + 2, by + 2, bw, 6))
    
    # Page indicator
    if total_pages > 1:
        screen.brush = TEXT_DIM
        ptxt = f"{current_page+1}/{total_pages}"
        pw, _ = screen.measure_text(ptxt)
        screen.text(ptxt, 130 - pw, 3)


def draw_footer(name):
    # Background
    fy = 120 - FOOTER_H
    screen.brush = brushes.color(25, 30, 27)
    screen.draw(shapes.rectangle(0, fy, 160, FOOTER_H))
    
    # Selected app name - centered
    if name:
        screen.brush = PHOSPHOR
        nw, _ = screen.measure_text(name)
        screen.text(name, 80 - nw // 2, fy + 3)
    
    # Hint
    screen.brush = TEXT_DIM
    screen.text("A+C:off", 115, fy + 3)


def draw_icons():
    for i, icon in enumerate(icons):
        is_active = (i == active)
        x, y = icon['x'], icon['y']
        
        # Selection highlight
        if is_active:
            screen.brush = SELECTED_BG
            screen.draw(shapes.rounded_rectangle(x - 4, y - 4, ICON_SIZE + 8, ICON_SIZE + 8, 6))
            screen.brush = PHOSPHOR
            screen.draw(shapes.rounded_rectangle(x - 2, y - 2, ICON_SIZE + 4, ICON_SIZE + 4, 4))
        
        # Icon sprite
        if icon['sprite']:
            icon['sprite'].alpha = 255 if is_active else 120
            try:
                screen.blit(icon['sprite'], x, y)
            except:
                draw_placeholder(x, y, icon['name'], is_active)
        else:
            draw_placeholder(x, y, icon['name'], is_active)


def draw_placeholder(x, y, name, is_active):
    screen.brush = PHOSPHOR if is_active else TEXT_DIM
    screen.draw(shapes.rounded_rectangle(x, y, ICON_SIZE, ICON_SIZE, 4))
    screen.brush = BLACK
    letter = name[0].upper() if name else "?"
    lw, _ = screen.measure_text(letter)
    screen.text(letter, x + (ICON_SIZE - lw) // 2, y + 10)


def update():
    global active, current_page, alpha
    
    # Power off: hold A+C together
    if io.BUTTON_A in io.held and io.BUTTON_C in io.held:
        # Show power off message
        screen.brush = BLACK
        screen.draw(shapes.rectangle(0, 0, 160, 120))
        screen.brush = PHOSPHOR
        screen.text("Powering off...", 35, 50)
        screen.brush = TEXT_DIM
        screen.text("Press RESET to wake", 25, 70)
        display.update()
        time.sleep(1)
        machine.deepsleep()
    
    # Navigation
    if io.BUTTON_C in io.pressed:
        active += 1
    if io.BUTTON_A in io.pressed:
        active -= 1
    if io.BUTTON_UP in io.pressed:
        active -= COLS
    if io.BUTTON_DOWN in io.pressed:
        active += COLS
    
    # Page wrapping
    if active >= len(icons):
        if current_page < total_pages - 1:
            current_page += 1
            load_page()
            active = 0
        else:
            current_page = 0
            load_page()
            active = 0
    elif active < 0:
        if current_page > 0:
            current_page -= 1
            load_page()
            active = len(icons) - 1
        else:
            current_page = total_pages - 1
            load_page()
            active = len(icons) - 1
    
    # Launch app
    if io.BUTTON_B in io.pressed and icons:
        app_idx = current_page * APPS_PER_PAGE + active
        if app_idx < len(apps):
            path = f"/system/apps/{apps[app_idx][1]}"
            if is_dir(path) and file_exists(f"{path}/__init__.py"):
                return path
    
    # Draw
    screen.brush = BG
    screen.draw(shapes.rectangle(0, 0, 160, 120))
    
    draw_header()
    draw_icons()
    
    name = icons[active]['name'] if icons and active < len(icons) else ""
    draw_footer(name)
    
    # Fade in
    if alpha < 255:
        screen.brush = brushes.color(0, 0, 0, 255 - alpha)
        screen.draw(shapes.rectangle(0, 0, 160, 120))
        alpha = min(255, alpha + 40)
    
    return None


if __name__ == "__main__":
    run(update)
