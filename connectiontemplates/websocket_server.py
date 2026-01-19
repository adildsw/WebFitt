#!/usr/bin/env python3
"""
WebFitts WebSocket Server Template

A simple template for receiving real-time study data from WebFitts.

Requirements:
    pip install websockets

Usage:
    python websocket_server.py [--host HOST] [--port PORT]
"""

import asyncio
import argparse
import json

import websockets


async def handle_client(websocket):
    """Handle incoming WebSocket connections."""
    print("[Connected] Client connected")

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type", "unknown")

            if msg_type == "handshake":
                # Handshake: {"client": "WebFitts", "version": "1.0", "timestamp": 1234567890}
                print(f"[Handshake] {data.get('client')} v{data.get('version')}")
                await websocket.send(json.dumps({
                    "type": "handshake_ack",
                    "status": "connected",
                    "server": "WebFitts Python Server"
                }))

            elif msg_type == "study_data":
                # Study data received every frame during active study
                # Sample: {"type": "study_data", "cursor": {"x": 500, "y": 300}, "target": {"x": 700, "y": 400}, ...}
                cursor = data.get("cursor", {})
                target = data.get("target", {})
                movement = data.get("movement", {})
                required = data.get("required", {})
                task = data.get("task", {})
                canvas = data.get("canvas", {})

                print(f"[Data] "
                      f"Cursor: ({cursor.get('x', 0):.0f}, {cursor.get('y', 0):.0f}) | "
                      f"Target: ({target.get('x', 0):.0f}, {target.get('y', 0):.0f}) | "
                      f"A/W: {task.get('amplitude', 0)}/{task.get('width', 0)} | "
                      f"Dist: {required.get('distance', 0):.1f} | "
                      f"Move: ({movement.get('normalized', {}).get('x', 0):.2f}, {movement.get('normalized', {}).get('y', 0):.2f}) | "
                      f"Req: ({required.get('normalized', {}).get('x', 0):.2f}, {required.get('normalized', {}).get('y', 0):.2f}) | "
                      f"Canvas: {canvas.get('width', 0)}x{canvas.get('height', 0)}")

            elif msg_type == "study_event":
                # Study events: study_start, study_end, task_start, task_end, click
                # Sample: {"type": "study_event", "event": "task_start", "data": {...}}
                event = data.get("event", "unknown")
                event_data = data.get("data", {})
                print(f"[Event] {event}: {event_data}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        print("[Disconnected] Client disconnected")


async def main(host, port):
    print("=" * 50)
    print("WebFitts WebSocket Server")
    print("=" * 50)
    print(f"Server: ws://{host}:{port}")
    print(f"Enter in WebFitts: {host}:{port}")
    print("=" * 50)
    print("Waiting for connection...")
    print()

    async with websockets.serve(handle_client, host, port):
        await asyncio.Future()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebFitts WebSocket Server")
    parser.add_argument("--host", default="localhost", help="Host (default: localhost)")
    parser.add_argument("--port", type=int, default=8765, help="Port (default: 8765)")
    args = parser.parse_args()

    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        print("\nServer stopped.")
