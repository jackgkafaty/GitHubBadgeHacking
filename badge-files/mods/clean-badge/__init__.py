# Cleaner Badge UI Mod
# Optimized for 160x120 display - less cluttered, better spacing
# Replace /system/apps/badge/__init__.py with this file

import sys
import os

sys.path.insert(0, "/system/apps/badge")
os.chdir("/system/apps/badge")

from badgeware import io, brushes, shapes, Image, run, PixelFont, screen, Matrix, file_exists
import random
import math
import network
from urllib.urequest import urlopen
import gc
import json

# ============================================================================
# CLEAN UI COLOR PALETTE - Optimized for small display clarity
# ============================================================================
class Colors:
    # Background layers
    BG_DARK = brushes.color(13, 17, 23)         # #0D1117 - Main background
    BG_CARD = brushes.color(22, 27, 34)         # #161B22 - Card background
    BG_ELEVATED = brushes.color(33, 38, 45)     # #21262D - Elevated surfaces
    
    # Text colors
    TEXT_PRIMARY = brushes.color(230, 237, 243)   # #E6EDF3 - Primary text
    TEXT_SECONDARY = brushes.color(139, 148, 158) # #8B949E - Secondary text
    TEXT_MUTED = brushes.color(110, 118, 129)     # #6E7681 - Muted text
    
    # Accent colors
    ACCENT_GREEN = brushes.color(35, 134, 54)     # #238636 - GitHub green
    ACCENT_LIME = brushes.color(211, 250, 55)     # #D3FA37 - Badge phosphor
    ACCENT_BLUE = brushes.color(31, 111, 235)     # #1F6FEB - Links/interactive
    
    # Contribution graph levels (darker, more subtle)
    CONTRIB_0 = brushes.color(22, 27, 34)         # Empty
    CONTRIB_1 = brushes.color(14, 68, 41)         # Low
    CONTRIB_2 = brushes.color(0, 109, 50)         # Medium-low
    CONTRIB_3 = brushes.color(38, 166, 65)        # Medium-high
    CONTRIB_4 = brushes.color(57, 211, 83)        # High

# ============================================================================
# FONTS
# ============================================================================
small_font = PixelFont.load("/system/assets/fonts/ark.ppf")
large_font = PixelFont.load("/system/assets/fonts/absolute.ppf")

# ============================================================================
# NETWORK CONFIG
# ============================================================================
WIFI_TIMEOUT = 60
CONTRIB_URL = "https://github.com/{user}.contribs"
USER_AVATAR = "https://wsrv.nl/?url=https://github.com/{user}.png&w=75&output=png"
DETAILS_URL = "https://api.github.com/users/{user}"

WIFI_PASSWORD = None
WIFI_SSID = None
GITHUB_TOKEN = None
wlan = None
connected = False
ticks_start = None

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def message(text):
    print(text)

def fake_number():
    return random.randint(100, 9999)

def placeholder_if_none(val, placeholder="..."):
    return val if val is not None else placeholder

def get_connection_details(user):
    global WIFI_PASSWORD, WIFI_SSID, GITHUB_TOKEN, GITHUB_USERNAME

    if WIFI_SSID is not None and user.handle is not None:
        return True

    try:
        sys.path.insert(0, "/")
        try:
            from secrets import WIFI_PASSWORD, WIFI_SSID, GITHUB_USERNAME, GITHUB_TOKEN
        finally:
            try:
                sys.path.pop(0)
            except Exception:
                pass
    except ImportError:
        WIFI_PASSWORD = None
        WIFI_SSID = None
        GITHUB_USERNAME = None
        GITHUB_TOKEN = None
    except Exception:
        WIFI_PASSWORD = None
        WIFI_SSID = None
        GITHUB_USERNAME = None
        GITHUB_TOKEN = None

    if not WIFI_SSID or not GITHUB_USERNAME:
        return False

    user.handle = GITHUB_USERNAME
    return True

def wlan_start():
    global wlan, ticks_start, connected, WIFI_PASSWORD, WIFI_SSID

    if ticks_start is None:
        ticks_start = io.ticks

    if connected:
        return True

    if wlan is None:
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        
        if wlan.isconnected():
            connected = True
            return True
        
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    connected = wlan.isconnected()
    
    if io.ticks - ticks_start < WIFI_TIMEOUT * 1000:
        if connected:
            return True
    elif not connected:
        return False
    
    return True

def async_fetch_to_disk(url, file, force_update=False, timeout_ms=25000):
    if not force_update and file_exists(file):
        return

    start_ticks = io.ticks
    try:
        headers = {"User-Agent": "GitHub Universe Badge 2025"}
        if GITHUB_TOKEN and url.startswith("https://api.github.com"):
            headers["Authorization"] = f"token {GITHUB_TOKEN}"

        response = urlopen(url, headers=headers)
        data = bytearray(512)
        total = 0
        with open(file, "wb") as f:
            while True:
                if timeout_ms is not None and (io.ticks - start_ticks) > timeout_ms:
                    raise TimeoutError(f"Fetch timed out after {timeout_ms} ms")

                if (length := response.readinto(data)) == 0:
                    break
                total += length
                f.write(data[:length])
                yield
        del data
        del response
    except Exception as e:
        message(f"Fetch error: {e}")
        try:
            os.remove(file)
        except:
            pass

def get_user_data(user, force_update=False):
    url = DETAILS_URL.format(user=user.handle)
    file = "/user_data.json"
    for _ in async_fetch_to_disk(url, file, force_update):
        yield
    try:
        with open(file, "r") as f:
            data = json.load(f)
            user.name = data.get("name") or user.handle
            user.followers = data.get("followers", 0)
            user.repos = data.get("public_repos", 0)
    except Exception as e:
        message(f"User data parse error: {e}")

def get_contrib_data(user, force_update=False):
    url = CONTRIB_URL.format(user=user.handle)
    file = "/contrib_data.json"
    for _ in async_fetch_to_disk(url, file, force_update):
        yield
    try:
        with open(file, "r") as f:
            data = json.load(f)
            user.contribs = data.get("total", 0)
            weeks = data.get("weeks", [])
            if weeks:
                user.contribution_data = [[0] * 53 for _ in range(7)]
                for wi, week in enumerate(weeks[:53]):
                    for di, day in enumerate(week.get("days", [])):
                        if di < 7:
                            user.contribution_data[di][wi] = min(day.get("level", 0), 4)
    except Exception as e:
        message(f"Contrib data parse error: {e}")

def get_avatar(user, force_update=False):
    url = USER_AVATAR.format(user=user.handle)
    file = "/avatar.png"
    for _ in async_fetch_to_disk(url, file, force_update):
        yield
    try:
        user.avatar = Image.load(file)
    except Exception as e:
        message(f"Avatar load error: {e}")
        user.avatar = False

# ============================================================================
# CLEANER UI DRAWING FUNCTIONS
# ============================================================================
def draw_rounded_rect(x, y, w, h, r, brush):
    """Draw a cleaner rounded rectangle"""
    screen.brush = brush
    rect = shapes.rounded_rectangle(x, y, w, h, r)
    screen.draw(rect)

def draw_divider(y, margin=8):
    """Draw a subtle horizontal divider"""
    screen.brush = Colors.BG_ELEVATED
    screen.draw(shapes.rectangle(margin, y, 160 - margin * 2, 1))

def draw_stat_clean(label, value, x, y, width=45):
    """Draw a stat with clean layout - value on top, label below"""
    # Value (large, bright)
    screen.font = large_font
    screen.brush = Colors.TEXT_PRIMARY if value is not None else Colors.TEXT_MUTED
    val_str = str(value) if value is not None else "—"
    vw, _ = screen.measure_text(val_str)
    screen.text(val_str, x + (width - vw) // 2, y)
    
    # Label (small, subtle)
    screen.font = small_font
    screen.brush = Colors.TEXT_SECONDARY
    lw, _ = screen.measure_text(label)
    screen.text(label, x + (width - lw) // 2, y + 12)

def draw_header(username, name, y=0):
    """Draw clean header with username and name"""
    # Background strip
    screen.brush = Colors.BG_CARD
    screen.draw(shapes.rectangle(0, y, 160, 28))
    
    # Username (primary)
    screen.font = large_font
    screen.brush = Colors.TEXT_PRIMARY
    handle = f"@{username}" if username else "..."
    hw, _ = screen.measure_text(handle)
    screen.text(handle, 80 - hw // 2, y + 3)
    
    # Name (secondary, below)
    screen.font = small_font
    screen.brush = Colors.ACCENT_LIME
    disp_name = name if name else ""
    nw, _ = screen.measure_text(disp_name)
    screen.text(disp_name, 80 - nw // 2, y + 16)

def draw_contribution_graph_clean(data, y, height=35):
    """Draw a cleaner, more compact contribution graph"""
    levels = [Colors.CONTRIB_0, Colors.CONTRIB_1, Colors.CONTRIB_2, Colors.CONTRIB_3, Colors.CONTRIB_4]
    
    # Calculate visible columns (fit nicely in 160px with margins)
    margin = 4
    cell_size = 4
    gap = 1
    visible_cols = (160 - margin * 2) // (cell_size + gap)  # ~30 columns
    
    # Start from recent data (right side of contribution graph)
    start_col = max(0, 53 - visible_cols)
    
    for row in range(7):
        for col in range(visible_cols):
            src_col = start_col + col
            if data and src_col < 53:
                level = data[row][src_col]
            else:
                level = 0
            
            screen.brush = levels[level]
            px = margin + col * (cell_size + gap)
            py = y + row * (cell_size + gap)
            screen.draw(shapes.rectangle(px, py, cell_size, cell_size))

def draw_avatar_clean(avatar, x, y, size=40):
    """Draw avatar with clean border"""
    if avatar and avatar is not False:
        try:
            # Simple border
            screen.brush = Colors.BG_ELEVATED
            screen.draw(shapes.rounded_rectangle(x - 2, y - 2, size + 4, size + 4, 4))
            screen.blit(avatar, x, y)
            return
        except:
            pass
    
    # Fallback: Clean placeholder
    screen.brush = Colors.BG_ELEVATED
    screen.draw(shapes.rounded_rectangle(x, y, size, size, 4))
    screen.brush = Colors.ACCENT_LIME
    # Simple loading indicator
    t = io.ticks / 500
    cx, cy = x + size // 2, y + size // 2
    for i in range(4):
        angle = t + i * 1.57
        dx = int(math.cos(angle) * 8)
        dy = int(math.sin(angle) * 8)
        screen.draw(shapes.circle(cx + dx, cy + dy, 2))

# ============================================================================
# USER CLASS - Cleaner version
# ============================================================================
class User:
    def __init__(self):
        self.handle = None
        self.update()

    def update(self, force_update=False):
        self.name = None
        self.followers = None
        self.contribs = None
        self.contribution_data = None
        self.repos = None
        self.avatar = None
        self._task = None
        self._force_update = force_update

    def draw(self, is_connected):
        # === CLEAN LAYOUT ===
        # Header: 0-28px (username + name)
        # Stats row: 30-55px 
        # Contrib graph: 58-93px
        # Footer: 95-120px (loading status)
        
        # Clear background
        screen.brush = Colors.BG_DARK
        screen.draw(shapes.rectangle(0, 0, 160, 120))
        
        # Header section
        draw_header(self.handle, self.name, y=0)
        
        # Stats section (horizontal row)
        stats_y = 32
        draw_stat_clean("repos", self.repos, 4, stats_y, 48)
        draw_stat_clean("followers", self.followers, 56, stats_y, 48)
        draw_stat_clean("contribs", self.contribs, 108, stats_y, 48)
        
        # Contribution graph
        draw_divider(55, margin=4)
        draw_contribution_graph_clean(self.contribution_data, y=58, height=35)
        
        # Footer / Status area
        draw_divider(95, margin=4)
        
        # Show loading status or branding
        screen.font = small_font
        if not is_connected:
            screen.brush = Colors.TEXT_MUTED
            screen.text("Connecting...", 4, 100)
        elif self._task:
            # Still loading
            screen.brush = Colors.TEXT_SECONDARY
            if self.name is None:
                status = "Loading profile..."
            elif self.contribs is None:
                status = "Loading contributions..."
            elif self.avatar is None:
                status = "Loading avatar..."
            else:
                status = "Loading..."
            screen.text(status, 4, 100)
        else:
            # Loaded - show branding
            screen.brush = Colors.TEXT_MUTED
            screen.text("GitHub Universe 2025", 4, 100)
        
        # Avatar (small, bottom right)
        draw_avatar_clean(self.avatar, 118, 98, 38)
        
        # Handle async loading
        if is_connected and (self.name is None or self.contribs is None or self.avatar is None):
            if not self._task:
                if self.name is None:
                    self._task = get_user_data(self, self._force_update)
                elif self.contribs is None:
                    self._task = get_contrib_data(self, self._force_update)
                elif self.avatar is None:
                    self._task = get_avatar(self, self._force_update)
            
            if self._task:
                try:
                    next(self._task)
                except StopIteration:
                    self._task = None
                except:
                    self._task = None

# ============================================================================
# ERROR SCREENS - Cleaner versions
# ============================================================================
def no_secrets_error():
    screen.brush = Colors.BG_DARK
    screen.draw(shapes.rectangle(0, 0, 160, 120))
    
    # Header
    screen.brush = Colors.BG_CARD
    screen.draw(shapes.rectangle(0, 0, 160, 24))
    screen.font = large_font
    screen.brush = Colors.TEXT_PRIMARY
    screen.text("Setup Required", 8, 5)
    
    # Instructions
    screen.font = small_font
    screen.brush = Colors.ACCENT_LIME
    screen.text("1.", 8, 30)
    screen.text("2.", 8, 58)
    screen.text("3.", 8, 86)
    
    screen.brush = Colors.TEXT_SECONDARY
    screen.text("Tap RESET twice for", 24, 30)
    screen.text("disk mode", 24, 40)
    
    screen.text("Edit secrets.py with", 24, 58)
    screen.text("WiFi & GitHub info", 24, 68)
    
    screen.text("Reload to see your", 24, 86)
    screen.text("GitHub stats!", 24, 96)

def connection_error():
    screen.brush = Colors.BG_DARK
    screen.draw(shapes.rectangle(0, 0, 160, 120))
    
    # Header
    screen.brush = Colors.BG_CARD
    screen.draw(shapes.rectangle(0, 0, 160, 24))
    screen.font = large_font
    screen.brush = Colors.TEXT_PRIMARY
    screen.text("WiFi Error", 8, 5)
    
    # Error icon (simple X)
    screen.brush = brushes.color(248, 81, 73)  # Red
    screen.draw(shapes.circle(140, 12, 8))
    
    # Message
    screen.font = small_font
    screen.brush = Colors.TEXT_SECONDARY
    screen.text("Could not connect to", 8, 32)
    screen.text("the WiFi network.", 8, 44)
    
    screen.brush = Colors.TEXT_MUTED
    screen.text("Check secrets.py for", 8, 64)
    screen.text("correct WiFi credentials", 8, 76)
    
    screen.brush = Colors.ACCENT_LIME
    screen.text("Then reload the badge", 8, 100)

# ============================================================================
# MAIN
# ============================================================================
user = User()
connected = file_exists("/contrib_data.json") and file_exists("/user_data.json") and file_exists("/avatar.png")
force_update = False

def update():
    global connected, force_update

    # Force refresh with A+C held
    if io.BUTTON_A in io.held and io.BUTTON_C in io.held:
        connected = False
        user.update(True)

    if get_connection_details(user):
        if wlan_start():
            user.draw(connected)
        else:
            connection_error()
    else:
        no_secrets_error()

if __name__ == "__main__":
    run(update)
