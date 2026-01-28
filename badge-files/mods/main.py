# Modified main.py - Badge starts first, HOME goes to menu
# Tap RESET twice for disk mode

import sys
import os
from badgeware import run, io
import machine
import gc
import powman

running_app = None

# Check if this is a HOME button reset (watchdog wake) vs fresh boot
IS_HOME_RESET = powman.get_wake_reason() == powman.WAKE_WATCHDOG


def quit_to_launcher(pin):
    global running_app
    getattr(running_app, "on_exit", lambda: None)()
    while not pin.value():
        pass
    machine.reset()


# Setup home button handler
machine.Pin.board.BUTTON_HOME.irq(
    trigger=machine.Pin.IRQ_FALLING, handler=quit_to_launcher
)


def launch_app(app_path):
    """Launch an app and return what it wants to launch next"""
    global running_app
    
    sys.path.insert(0, app_path)
    os.chdir(app_path)
    
    running_app = __import__(app_path)
    
    getattr(running_app, "init", lambda: None)()
    result = run(running_app.update)
    
    # Cleanup
    getattr(running_app, "on_exit", lambda: None)()
    if sys.path[0].startswith("/system/apps"):
        sys.path.pop(0)
    
    # Clean up modules
    for mod in ["ui", "icon"]:
        if mod in sys.modules:
            del sys.modules[mod]
    
    gc.collect()
    return result


# Determine what to launch
if IS_HOME_RESET:
    # HOME was pressed - show menu
    current_app = "/system/apps/menu"
else:
    # Fresh boot - show badge app directly
    current_app = "/system/apps/badge"


# Main loop - allows navigation between apps
while True:
    result = launch_app(current_app)
    
    if result and isinstance(result, str):
        # App wants to launch another app
        current_app = result
    else:
        # App exited without specifying next app - go to menu
        current_app = "/system/apps/menu"
