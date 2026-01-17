#!/usr/bin/env python3
"""
Fitts' Law UI Testing Automation Script

This script automates UI testing for the Fitts' Law testing system by:
1. Moving the cursor to the center of the screen
2. Detecting green targets (#3D9970) on screen
3. Moving to each green target at a fixed speed
4. Clicking the target
5. Repeating until the test is complete

Usage:
    python fitts_automation.py --speed <pixels_per_second>

Example:
    python fitts_automation.py --speed 500
"""

import argparse
import time
import math
import sys

try:
    import pyautogui
except ImportError:
    print("Error: pyautogui is required. Install with: pip install pyautogui")
    sys.exit(1)

try:
    import numpy as np
except ImportError:
    print("Error: numpy is required. Install with: pip install numpy")
    sys.exit(1)

try:
    from pynput import keyboard
except ImportError:
    print("Error: pynput is required. Install with: pip install pynput")
    sys.exit(1)


# Global flag for kill switch
kill_switch_activated = False


def on_key_press(key):
    """Callback for keyboard events to handle kill switch."""
    global kill_switch_activated
    if key == keyboard.Key.esc:
        kill_switch_activated = True
        print("\n\n[KILL SWITCH] Escape pressed - stopping automation...")
        return False  # Stop the listener


# Green target color in the Fitts' Law system
TARGET_COLOR_HEX = "#3D9970"
TARGET_COLOR_RGB = (61, 153, 112)  # RGB values for #3D9970

# Color tolerance for detection (accounts for anti-aliasing and rendering differences)
COLOR_TOLERANCE = 15

# Time to wait between checks when no target is found (seconds)
NO_TARGET_WAIT = 0.1

# Maximum consecutive no-target detections before assuming test is over
MAX_NO_TARGET_COUNT = 30  # 3 seconds at 0.1s interval


def rgb_distance(color1, color2):
    """Calculate Euclidean distance between two RGB colors."""
    return math.sqrt(
        (color1[0] - color2[0]) ** 2 +
        (color1[1] - color2[1]) ** 2 +
        (color1[2] - color2[2]) ** 2
    )


def find_green_target():
    """
    Capture the screen and find the center of the green target.

    Returns:
        tuple: (x, y) coordinates of the target center, or None if not found.
    """
    # Take a screenshot
    screenshot = pyautogui.screenshot()
    img_array = np.array(screenshot)

    # Find pixels that match the target color within tolerance
    r, g, b = TARGET_COLOR_RGB

    # Create mask for pixels close to the target color
    r_match = np.abs(img_array[:, :, 0].astype(int) - r) <= COLOR_TOLERANCE
    g_match = np.abs(img_array[:, :, 1].astype(int) - g) <= COLOR_TOLERANCE
    b_match = np.abs(img_array[:, :, 2].astype(int) - b) <= COLOR_TOLERANCE

    mask = r_match & g_match & b_match

    # Find matching pixel coordinates
    matching_pixels = np.where(mask)

    if len(matching_pixels[0]) == 0:
        return None

    # Calculate the center of the matching region (target center)
    y_coords = matching_pixels[0]
    x_coords = matching_pixels[1]

    center_x = int(np.mean(x_coords))
    center_y = int(np.mean(y_coords))

    return (center_x, center_y)


def move_cursor_at_speed(target_x, target_y, speed_pps):
    """
    Move the cursor to the target position at a fixed speed.

    Args:
        target_x: Target X coordinate
        target_y: Target Y coordinate
        speed_pps: Speed in pixels per second
    """
    current_x, current_y = pyautogui.position()

    # Calculate distance to target
    distance = math.sqrt(
        (target_x - current_x) ** 2 +
        (target_y - current_y) ** 2
    )

    if distance == 0:
        return

    # Calculate duration based on speed
    duration = distance / speed_pps

    # Ensure minimum duration for very short distances
    duration = max(duration, 0.01)

    # Move to target with linear interpolation (no easing)
    pyautogui.moveTo(target_x, target_y, duration=duration, tween=pyautogui.linear)


def move_to_screen_center():
    """Move the cursor to the center of the screen."""
    screen_width, screen_height = pyautogui.size()
    center_x = screen_width // 2
    center_y = screen_height // 2

    pyautogui.moveTo(center_x, center_y, duration=0.5)
    print(f"Moved cursor to screen center: ({center_x}, {center_y})")
    return center_x, center_y


def run_automation(speed_pps, initial_delay=3.0):
    """
    Run the Fitts' Law automation.

    Args:
        speed_pps: Cursor movement speed in pixels per second
        initial_delay: Delay before starting (seconds) to allow user to focus the browser
    """
    global kill_switch_activated
    kill_switch_activated = False

    print(f"\nFitts' Law UI Automation")
    print(f"========================")
    print(f"Speed: {speed_pps} pixels/second")
    print(f"\nStarting in {initial_delay} seconds...")
    print("Make sure the Fitts' Law test is visible on screen!")
    print("\n*** Press ESCAPE at any time to stop automation ***")

    # Start keyboard listener for kill switch
    listener = keyboard.Listener(on_press=on_key_press)
    listener.start()

    time.sleep(initial_delay)

    # Check if kill switch was activated during delay
    if kill_switch_activated:
        listener.stop()
        print("Automation cancelled before starting.")
        return

    # Move to screen center first
    move_to_screen_center()
    time.sleep(0.5)

    click_count = 0
    no_target_count = 0

    print("\nAutomation running... Press ESCAPE or Ctrl+C to stop.")
    print("-" * 40)

    try:
        while not kill_switch_activated:
            # Find the green target
            target = find_green_target()

            if target is None:
                no_target_count += 1
                if no_target_count >= MAX_NO_TARGET_COUNT:
                    print(f"\nNo target found for {MAX_NO_TARGET_COUNT * NO_TARGET_WAIT:.1f} seconds.")
                    print("Test appears to be complete or not running.")
                    break
                time.sleep(NO_TARGET_WAIT)
                continue

            # Reset no-target counter
            no_target_count = 0

            target_x, target_y = target

            # Move to target at specified speed
            move_cursor_at_speed(target_x, target_y, speed_pps)

            # Check kill switch before clicking
            if kill_switch_activated:
                break

            # Click the target
            pyautogui.click()
            click_count += 1

            print(f"Click {click_count}: Target at ({target_x}, {target_y})")

            # Small delay to allow the UI to update
            time.sleep(0.05)

    except KeyboardInterrupt:
        print("\n\nAutomation stopped by user (Ctrl+C).")

    # Stop the keyboard listener
    listener.stop()

    print(f"\n{'=' * 40}")
    print(f"Total clicks: {click_count}")
    print("Automation complete.")


def main():
    parser = argparse.ArgumentParser(
        description="Automate UI testing for the Fitts' Law testing system.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python fitts_automation.py --speed 500
    python fitts_automation.py --speed 1000 --delay 5

The speed parameter controls how fast the cursor moves in pixels per second.
Typical values:
    300  - Slow, deliberate movement
    500  - Moderate speed
    1000 - Fast movement
    2000 - Very fast movement
        """
    )

    parser.add_argument(
        "--speed", "-s",
        type=float,
        required=True,
        help="Cursor movement speed in pixels per second"
    )

    parser.add_argument(
        "--delay", "-d",
        type=float,
        default=3.0,
        help="Initial delay before starting automation (default: 3.0 seconds)"
    )

    args = parser.parse_args()

    if args.speed <= 0:
        print("Error: Speed must be a positive number.")
        sys.exit(1)

    # Disable pyautogui fail-safe for smoother automation
    # (User can still use Ctrl+C to stop)
    pyautogui.FAILSAFE = True  # Keep fail-safe enabled for safety

    run_automation(args.speed, args.delay)


if __name__ == "__main__":
    main()
