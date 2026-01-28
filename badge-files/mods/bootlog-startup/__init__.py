# Bootlog Startup Mod
# Replace /system/apps/startup/__init__.py with this file
# Shows a dev-style boot log instead of the animation

import sys
import os
import random

sys.path.insert(0, "/system/apps/startup")
os.chdir("/system/apps/startup")

from badgeware import io, screen, run, brushes, shapes, display, PixelFont

# Colors
GREEN = brushes.color(0, 255, 0)
WHITE = brushes.color(200, 200, 200)
GRAY = brushes.color(100, 100, 100)
YELLOW = brushes.color(255, 255, 0)
CYAN = brushes.color(0, 255, 255)
BLACK = brushes.color(0, 0, 0)

# Font
try:
    font = PixelFont.load("/system/assets/fonts/ark.ppf")
except:
    font = None

# Boot messages
BOOT_MESSAGES = [
    ("[ OK ]", GREEN, "Initializing RP2350..."),
    ("[ OK ]", GREEN, "Loading badgeware v2.0"),
    ("[ OK ]", GREEN, "Display: 160x120 RGB"),
    ("[ OK ]", GREEN, "Memory: 520KB SRAM"),
    ("[ OK ]", GREEN, "Flash: 16MB QSPI"),
    ("[ OK ]", GREEN, "WiFi module ready"),
    ("[ OK ]", GREEN, "Buttons initialized"),
    ("[ OK ]", GREEN, "Loading fonts..."),
    ("[ OK ]", GREEN, "Loading assets..."),
    ("[ ** ]", YELLOW, "Checking secrets.py"),
    ("[ OK ]", GREEN, "GitHub API ready"),
    ("[ OK ]", GREEN, "Starting badge..."),
    ("", CYAN, ""),
    ("", CYAN, "GitHub Universe 2025"),
    ("", WHITE, "Press any key..."),
]

# State
current_line = 0
line_timer = 0
LINE_DELAY = 150  # ms between lines
char_index = 0
CHAR_DELAY = 8  # ms between characters (typing effect)
boot_complete = False
ticks_start = None
button_pressed_at = None

CLEAR = shapes.rectangle(0, 0, screen.width, screen.height)


def draw_line(y, status_color, status_text, message, chars=-1):
    """Draw a single boot log line"""
    if font:
        screen.font = font
    
    x = 2
    
    # Draw status bracket
    if status_text:
        screen.brush = status_color
        if chars == -1 or chars >= len(status_text):
            screen.text(status_text, x, y)
        else:
            screen.text(status_text[:chars], x, y)
        x = 48
    
    # Draw message
    screen.brush = WHITE
    msg_chars = chars - len(status_text) if chars != -1 and status_text else chars
    if msg_chars == -1 or msg_chars >= len(message):
        screen.text(message, x, y)
    elif msg_chars > 0:
        screen.text(message[:msg_chars], x, y)


def update():
    global current_line, line_timer, char_index, boot_complete, ticks_start, button_pressed_at

    if ticks_start is None:
        ticks_start = io.ticks

    now = io.ticks

    # Clear screen
    screen.brush = BLACK
    screen.draw(CLEAR)

    # Draw header
    if font:
        screen.font = font
    screen.brush = CYAN
    screen.text("BADGE BOOT v2.0", 2, 2)
    screen.brush = GRAY
    screen.text("----------------", 2, 12)

    # Calculate which lines to show (scroll if needed)
    line_height = 10
    max_visible_lines = 9
    start_y = 24
    
    # Draw completed lines
    visible_start = max(0, current_line - max_visible_lines + 1)
    
    for i in range(visible_start, min(current_line, len(BOOT_MESSAGES))):
        msg = BOOT_MESSAGES[i]
        y = start_y + (i - visible_start) * line_height
        if y < 120:
            draw_line(y, msg[0] and GREEN or CYAN, msg[0], msg[2], -1)
    
    # Draw current line with typing effect
    if current_line < len(BOOT_MESSAGES):
        msg = BOOT_MESSAGES[current_line]
        full_text = msg[0] + msg[2]
        y = start_y + (current_line - visible_start) * line_height
        
        if y < 120:
            draw_line(y, msg[0] and GREEN or CYAN, msg[0], msg[2], char_index)
        
        # Advance typing
        if now - line_timer > CHAR_DELAY:
            line_timer = now
            char_index += 1
            
            # Line complete
            if char_index > len(full_text):
                char_index = 0
                current_line += 1
                
                # Random delay variation for realism
                line_timer = now + random.randint(0, 100)
    else:
        boot_complete = True

    # Draw blinking cursor on last line
    if boot_complete and ((now // 500) % 2 == 0):
        y = start_y + min(current_line - visible_start, max_visible_lines - 1) * line_height
        screen.brush = GREEN
        screen.text("_", 2, y)

    # Check for button press after boot complete
    if boot_complete:
        if io.pressed:
            button_pressed_at = now
    
    # Fade out and exit
    if button_pressed_at:
        fade_time = now - button_pressed_at
        if fade_time < 500:
            # Fade to black
            alpha = int((fade_time / 500) * 255)
            screen.brush = brushes.color(0, 0, 0, alpha)
            screen.draw(CLEAR)
        else:
            # Exit to menu
            screen.brush = BLACK
            screen.draw(CLEAR)
            display.update()
            return False

    return None


if __name__ == "__main__":
    run(update)
