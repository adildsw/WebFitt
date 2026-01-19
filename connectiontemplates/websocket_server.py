#!/usr/bin/env python3
"""
WebFitts WebSocket Server Template with Cursor Control Demo

A template for receiving study data and controlling the proxy cursor in WebFitts.

Controls (when --keyboard is enabled):
    WASD - Move cursor (relative)
    G    - Click
    +/-  - Increase/decrease speed
    ESC  - Quit

Requirements:
    pip install websockets
    pip install pynput  (only needed if using --keyboard)

Usage:
    python websocket_server.py [--host HOST] [--port PORT]
    python websocket_server.py --keyboard [--speed SPEED]
"""

import asyncio
import argparse
import json

import websockets

# Global state
clients = set()
current_speed = 10  # pixels per keypress
running = True
keyboard_enabled = False


def send_command(command, data=None):
    """Queue a command to send to all connected clients."""
    message = json.dumps({
        "type": "command",
        "command": command,
        "data": data or {}
    })
    for client in clients.copy():
        try:
            asyncio.run_coroutine_threadsafe(client.send(message), loop)
        except Exception:
            pass


def create_key_handler(keyboard_module):
    """Create keyboard handler with reference to keyboard module."""
    def on_key_press(key):
        """Handle keyboard input for cursor control."""
        global current_speed, running

        try:
            # WASD movement
            if hasattr(key, 'char'):
                if key.char == 'w':
                    send_command("set_cursor_relative", {"dx": 0, "dy": -current_speed})
                    print(f"[Control] Move UP ({current_speed}px)")
                elif key.char == 's':
                    send_command("set_cursor_relative", {"dx": 0, "dy": current_speed})
                    print(f"[Control] Move DOWN ({current_speed}px)")
                elif key.char == 'a':
                    send_command("set_cursor_relative", {"dx": -current_speed, "dy": 0})
                    print(f"[Control] Move LEFT ({current_speed}px)")
                elif key.char == 'd':
                    send_command("set_cursor_relative", {"dx": current_speed, "dy": 0})
                    print(f"[Control] Move RIGHT ({current_speed}px)")
                elif key.char == 'g':
                    send_command("trigger_click")
                    print("[Control] CLICK")
                elif key.char == '+' or key.char == '=':
                    current_speed = min(current_speed + 5, 100)
                    print(f"[Control] Speed: {current_speed}px")
                elif key.char == '-':
                    current_speed = max(current_speed - 5, 5)
                    print(f"[Control] Speed: {current_speed}px")

            # ESC to quit
            if key == keyboard_module.Key.esc:
                print("\n[Server] Shutting down...")
                running = False
                return False

        except AttributeError:
            pass

    return on_key_press


async def handle_client(websocket):
    """Handle incoming WebSocket connections."""
    clients.add(websocket)
    print(f"[Connected] Client connected (total: {len(clients)})")

    if keyboard_enabled:
        # Enable external cursor control
        await websocket.send(json.dumps({
            "type": "command",
            "command": "enable_control"
        }))
    else:
        # Disable external cursor control
        await websocket.send(json.dumps({
            "type": "command",
            "command": "disable_control"
        }))

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type", "unknown")

            if msg_type == "handshake":
                print(f"[Handshake] {data.get('client')} v{data.get('version')}")
                await websocket.send(json.dumps({
                    "type": "handshake_ack",
                    "status": "connected",
                    "server": "WebFitts Control Server"
                }))

            elif msg_type == "study_data":
                cursor = data.get("cursor", {})
                target = data.get("target", {})
                required = data.get("required", {})
                task = data.get("task", {})

                print(f"[Data] "
                      f"Cursor: ({cursor.get('x', 0):.0f}, {cursor.get('y', 0):.0f}) | "
                      f"Target: ({target.get('x', 0):.0f}, {target.get('y', 0):.0f}) | "
                      f"Dist: {required.get('distance', 0):.1f}px | "
                      f"A/W: {task.get('amplitude', 0)}/{task.get('width', 0)}")

            elif msg_type == "study_event":
                event = data.get("event", "unknown")
                event_data = data.get("data", {})
                print(f"[Event] {event}: {event_data}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"[Disconnected] Client disconnected (total: {len(clients)})")


async def main(host, port):
    global loop
    loop = asyncio.get_event_loop()
    listener = None

    print("=" * 60)
    print("WebFitts WebSocket Server")
    print("=" * 60)
    print(f"Server: ws://{host}:{port}")

    if keyboard_enabled:
        print(f"Keyboard control: ENABLED (speed: {current_speed}px)")
        print("=" * 60)
        print("Controls:")
        print("  WASD  - Move cursor")
        print("  G     - Click")
        print("  +/-   - Adjust speed")
        print("  ESC   - Quit")
    else:
        print("Keyboard control: DISABLED (use --keyboard to enable)")

    print("=" * 60)
    print("Waiting for connection...")
    print()

    # Start keyboard listener if enabled
    if keyboard_enabled:
        try:
            from pynput import keyboard as kb
            listener = kb.Listener(on_press=create_key_handler(kb))
            listener.start()
        except ImportError:
            print("[Warning] pynput not installed. Keyboard control disabled.")
            print("          Install with: pip install pynput")

    async with websockets.serve(handle_client, host, port):
        while running:
            await asyncio.sleep(0.1)

    if listener:
        listener.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebFitts WebSocket Server")
    parser.add_argument("--host", default="localhost", help="Host (default: localhost)")
    parser.add_argument("--port", type=int, default=8765, help="Port (default: 8765)")
    parser.add_argument("--keyboard", action="store_true", help="Enable keyboard control (WASD + G)")
    parser.add_argument("--speed", type=int, default=10, help="Cursor speed in pixels when using keyboard (default: 10)")
    args = parser.parse_args()

    keyboard_enabled = args.keyboard
    current_speed = args.speed

    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        print("\nServer stopped.")
