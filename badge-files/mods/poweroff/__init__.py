# Power Off App
# Puts the badge into deep sleep / power saving mode

import sys
import os

sys.path.insert(0, "/system/apps/poweroff")
os.chdir("/system/apps/poweroff")

from badgeware import io, screen, run, brushes, shapes, PixelFont, display
import machine
import time

# Colors
BLACK = brushes.color(0, 0, 0)
WHITE = brushes.color(235, 245, 255)
GRAY = brushes.color(100, 100, 100)
GREEN = brushes.color(211, 250, 55)
RED = brushes.color(255, 80, 80)

# Font
try:
    font = PixelFont.load("/system/assets/fonts/ark.ppf")
    large_font = PixelFont.load("/system/assets/fonts/absolute.ppf")
except:
    font = None
    large_font = None

selected = 0  # 0 = Cancel, 1 = Power Off
confirm_timer = 0


def center_text(text, y, brush=WHITE, use_large=False):
    if use_large and large_font:
        screen.font = large_font
    elif font:
        screen.font = font
    screen.brush = brush
    w, _ = screen.measure_text(text)
    screen.text(text, 80 - w // 2, y)


def update():
    global selected, confirm_timer
    
    # Navigation
    if io.BUTTON_A in io.pressed or io.BUTTON_LEFT in io.pressed:
        selected = 0
    if io.BUTTON_C in io.pressed or io.BUTTON_RIGHT in io.pressed:
        selected = 1
    
    # Cancel - return to menu
    if io.BUTTON_B in io.pressed and selected == 0:
        return "/system/apps/menu"
    
    # Confirm power off
    if io.BUTTON_B in io.pressed and selected == 1:
        # Show shutting down message
        screen.brush = BLACK
        screen.draw(shapes.rectangle(0, 0, 160, 120))
        center_text("Shutting down...", 50, GREEN, True)
        center_text("Press RESET to wake", 75, GRAY)
        display.update()
        time.sleep(1)
        
        # Enter deep sleep (dormant mode)
        # Badge will wake on any button press or RESET
        machine.deepsleep()
    
    # Draw UI
    screen.brush = BLACK
    screen.draw(shapes.rectangle(0, 0, 160, 120))
    
    # Title
    center_text("Power Off?", 15, WHITE, True)
    
    # Icon (simple power symbol)
    screen.brush = RED
    screen.draw(shapes.circle(80, 55, 20))
    screen.brush = BLACK
    screen.draw(shapes.circle(80, 55, 15))
    screen.brush = RED
    screen.draw(shapes.rectangle(77, 35, 6, 22))
    
    # Buttons
    btn_y = 95
    btn_w = 60
    btn_h = 18
    
    # Cancel button
    if selected == 0:
        screen.brush = GREEN
    else:
        screen.brush = GRAY
    screen.draw(shapes.rounded_rectangle(15, btn_y, btn_w, btn_h, 4))
    screen.brush = BLACK
    if font:
        screen.font = font
    screen.text("Cancel", 25, btn_y + 4)
    
    # Power Off button  
    if selected == 1:
        screen.brush = RED
    else:
        screen.brush = GRAY
    screen.draw(shapes.rounded_rectangle(85, btn_y, btn_w, btn_h, 4))
    screen.brush = BLACK if selected == 1 else WHITE
    screen.text("Power Off", 90, btn_y + 4)
    
    return None


if __name__ == "__main__":
    run(update)
