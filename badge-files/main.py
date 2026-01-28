# Modified main.py - Skip animation, go straight to badge app
# Press HOME to return to the app menu
# Original: /system/main.py

import sys
import os
from badgeware import run, io
import machine
import gc
import powman

# CUSTOMIZATION: Always skip cinematic startup animation
SKIP_CINEMATIC = True

# CUSTOMIZATION: Default app when booting fresh (not from HOME button)
DEFAULT_APP = "/system/apps/badge"

# File to track if we should show menu (set when HOME is pressed)
SHOW_MENU_FLAG = "/show_menu"

running_app = None


def quit_to_launcher(pin):
    global running_app
    getattr(running_app, "on_exit", lambda: None)()
    # If we reset while boot is low, bad times
    while not pin.value():
        pass
    # Set flag to show menu on next boot
    try:
        with open(SHOW_MENU_FLAG, "w") as f:
            f.write("1")
    except:
        pass
    machine.reset()


# Skip startup animation
if not SKIP_CINEMATIC:
    startup = __import__("/system/apps/startup")
    run(startup.update)
    if sys.path[0].startswith("/system/apps"):
        sys.path.pop(0)
    del startup
    gc.collect()

# Check if we should show menu (HOME was pressed)
show_menu = False
try:
    with open(SHOW_MENU_FLAG, "r") as f:
        show_menu = True
    # Delete the flag
    os.remove(SHOW_MENU_FLAG)
except:
    pass

# Print boot log
print("=" * 40)
print("GitHub Badge - Custom Boot")
print("=" * 40)
print("Show menu:", show_menu)
print("Default app:", DEFAULT_APP)
print("Press HOME to access menu")
print("=" * 40)

if show_menu:
    # Show the menu and let user pick an app
    menu = __import__("/system/apps/menu")
    app = run(menu.update)
    if sys.path[0].startswith("/system/apps"):
        sys.path.pop(0)
    del menu
    # Clean up menu modules
    try:
        del sys.modules["ui"]
        del sys.modules["icon"]
    except:
        pass
    gc.collect()
    # Wait for button release
    while io.held:
        io.poll()
else:
    # Go directly to default app
    app = DEFAULT_APP

# Setup home button handler
machine.Pin.board.BUTTON_HOME.irq(
    trigger=machine.Pin.IRQ_FALLING, handler=quit_to_launcher
)

sys.path.insert(0, app)
os.chdir(app)

running_app = __import__(app)

getattr(running_app, "init", lambda: None)()

run(running_app.update)

# Unreachable, in theory!
machine.reset()
getattr(running_app, "init", lambda: None)()

run(running_app.update)

# Unreachable, in theory!
machine.reset()
