/**
 * WebFitts External Connector
 * Handles WebSocket connections for broadcasting study data to external systems
 */

const Connector = (function() {
    // Private variables
    let socket = null;
    let isConnected = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let connectionStatusCallback = null;

    /**
     * Connect to a WebSocket server
     * @param {string} address - The server address (e.g., "localhost:8765")
     * @returns {Promise<boolean>} - True if connection successful
     */
    function connect(address) {
        return new Promise((resolve, reject) => {
            if (isConnected) {
                disconnect();
            }

            try {
                // Ensure proper WebSocket URL format
                let wsUrl = address;
                if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
                    wsUrl = 'ws://' + wsUrl;
                }

                socket = new WebSocket(wsUrl);

                socket.onopen = function() {
                    isConnected = true;
                    console.log('[Connector] Connected to ' + wsUrl);
                    if (connectionStatusCallback) {
                        connectionStatusCallback(true);
                    }
                    // Send initial handshake
                    sendMessage({
                        type: 'handshake',
                        client: 'WebFitts',
                        version: '1.0',
                        timestamp: Date.now()
                    });
                    resolve(true);
                };

                socket.onclose = function() {
                    isConnected = false;
                    console.log('[Connector] Disconnected');
                    if (connectionStatusCallback) {
                        connectionStatusCallback(false);
                    }
                };

                socket.onerror = function(error) {
                    console.error('[Connector] Error:', error);
                    isConnected = false;
                    if (connectionStatusCallback) {
                        connectionStatusCallback(false);
                    }
                    reject(error);
                };

                socket.onmessage = function(event) {
                    handleIncomingMessage(event.data);
                };

                // Timeout for connection
                setTimeout(() => {
                    if (!isConnected) {
                        socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 5000);

            } catch (error) {
                console.error('[Connector] Connection failed:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    function disconnect() {
        if (socket) {
            socket.close();
            socket = null;
        }
        isConnected = false;
    }

    /**
     * Send a message through the WebSocket
     * @param {Object} data - The data to send
     */
    function sendMessage(data) {
        if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
        }
    }

    /**
     * Handle incoming messages from the WebSocket server
     * @param {string} data - Raw message data
     */
    function handleIncomingMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('[Connector] Received:', message);

            // Handle different message types
            switch (message.type) {
                case 'command':
                    handleCommand(message);
                    break;
                case 'ping':
                    sendMessage({ type: 'pong', timestamp: Date.now() });
                    break;
                default:
                    console.log('[Connector] Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('[Connector] Failed to parse message:', error);
        }
    }

    /**
     * Handle commands from the external system
     * @param {Object} message - The command message
     *
     * Supported commands:
     * - set_cursor_absolute: {x, y} or {nx, ny} (normalized 0-1)
     * - set_cursor_relative: {dx, dy} or {ndx, ndy} (normalized)
     * - trigger_click: triggers a click at current proxy cursor position
     * - enable_control: enables external cursor control
     * - disable_control: disables external control (returns to mouse)
     */
    function handleCommand(message) {
        const cmd = message.command;
        const data = message.data || {};

        switch (cmd) {
            case 'set_cursor_absolute':
                // Absolute position in pixels or normalized (0-1)
                if (data.nx !== undefined && data.ny !== undefined) {
                    // Normalized coordinates
                    const x = data.nx * window.innerWidth;
                    const y = data.ny * window.innerHeight;
                    setProxyCursorPosition(x, y);
                } else if (data.x !== undefined && data.y !== undefined) {
                    // Pixel coordinates
                    setProxyCursorPosition(data.x, data.y);
                }
                break;

            case 'set_cursor_relative':
                // Relative movement in pixels or normalized
                if (data.ndx !== undefined && data.ndy !== undefined) {
                    // Normalized delta
                    const dx = data.ndx * window.innerWidth;
                    const dy = data.ndy * window.innerHeight;
                    moveProxyCursorRelative(dx, dy);
                } else if (data.dx !== undefined && data.dy !== undefined) {
                    // Pixel delta
                    moveProxyCursorRelative(data.dx, data.dy);
                }
                break;

            case 'trigger_click':
                // Trigger a click at current proxy cursor position
                triggerProxyClick();
                break;

            case 'enable_control':
                // Enable external cursor control
                enableExternalControl();
                break;

            case 'disable_control':
                // Disable external control (return to mouse)
                disableExternalControl();
                break;

            default:
                console.log('[Connector] Unknown command:', cmd);
        }
    }

    /**
     * Move proxy cursor by relative amount
     */
    function moveProxyCursorRelative(dx, dy) {
        if (typeof moveProxyCursor === 'function') {
            moveProxyCursor(dx, dy);
        }
    }

    /**
     * Trigger a click at proxy cursor position
     */
    function triggerProxyClick() {
        if (typeof onCanvasClick === 'function' && typeof isTaskRunning !== 'undefined' && isTaskRunning) {
            onCanvasClick();
        }
    }

    /**
     * Enable external cursor control mode
     */
    function enableExternalControl() {
        if (typeof enableExternalCursorControl === 'function') {
            enableExternalCursorControl();
        }
    }

    /**
     * Disable external cursor control mode (return to mouse)
     */
    function disableExternalControl() {
        if (typeof disableExternalCursorControl === 'function') {
            disableExternalCursorControl();
        }
    }

    /**
     * Broadcast study data during active test
     * @param {Object} data - Study data containing cursor, target, and movement info
     */
    function broadcastStudyData(data) {
        if (!isConnected) return;

        // Calculate movement vector
        const movementVector = {
            x: data.cursorX - lastMouseX,
            y: data.cursorY - lastMouseY
        };

        // Calculate movement speed (pixels per frame)
        const speed = Math.sqrt(
            movementVector.x * movementVector.x +
            movementVector.y * movementVector.y
        );

        // Normalize movement vector
        const normalizedVector = speed > 0 ? {
            x: movementVector.x / speed,
            y: movementVector.y / speed
        } : { x: 0, y: 0 };

        // Calculate required vector (from cursor to target)
        const requiredVector = {
            x: data.targetX - data.cursorX,
            y: data.targetY - data.cursorY
        };

        const distanceToTarget = Math.sqrt(
            requiredVector.x * requiredVector.x +
            requiredVector.y * requiredVector.y
        );

        const normalizedRequired = distanceToTarget > 0 ? {
            x: requiredVector.x / distanceToTarget,
            y: requiredVector.y / distanceToTarget
        } : { x: 0, y: 0 };

        const payload = {
            type: 'study_data',
            timestamp: Date.now(),
            cursor: {
                x: data.cursorX,
                y: data.cursorY
            },
            target: {
                x: data.targetX,
                y: data.targetY
            },
            movement: {
                vector: movementVector,
                normalized: normalizedVector,
                speed: speed
            },
            required: {
                vector: requiredVector,
                normalized: normalizedRequired,
                distance: distanceToTarget
            },
            task: {
                index: data.taskIndex,
                clickNumber: data.clickNumber,
                amplitude: data.amplitude,
                width: data.width,
                numTargets: data.numTargets
            },
            canvas: {
                width: data.canvasWidth,
                height: data.canvasHeight
            }
        };

        sendMessage(payload);

        // Update last position
        lastMouseX = data.cursorX;
        lastMouseY = data.cursorY;
    }

    /**
     * Broadcast study events (start, end, click, etc.)
     * @param {string} eventType - Type of event
     * @param {Object} eventData - Additional event data
     */
    function broadcastEvent(eventType, eventData = {}) {
        if (!isConnected) return;

        sendMessage({
            type: 'study_event',
            event: eventType,
            timestamp: Date.now(),
            data: eventData
        });
    }

    /**
     * Set callback for connection status changes
     * @param {Function} callback - Callback function(isConnected)
     */
    function onConnectionStatusChange(callback) {
        connectionStatusCallback = callback;
    }

    /**
     * Check if currently connected
     * @returns {boolean}
     */
    function getConnectionStatus() {
        return isConnected;
    }

    /**
     * Reset last mouse position (call when starting new task)
     */
    function resetLastPosition() {
        lastMouseX = 0;
        lastMouseY = 0;
    }

    // Public API
    return {
        connect: connect,
        disconnect: disconnect,
        broadcastStudyData: broadcastStudyData,
        broadcastEvent: broadcastEvent,
        onConnectionStatusChange: onConnectionStatusChange,
        isConnected: getConnectionStatus,
        resetLastPosition: resetLastPosition
    };
})();
