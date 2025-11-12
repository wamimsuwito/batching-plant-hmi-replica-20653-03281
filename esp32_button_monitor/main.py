# ESP32 Physical Button Monitor
# Monitors 24 physical buttons and sends state changes via WebSocket
# Requirements: MicroPython firmware on ESP32

import network
import socket
import machine
import time
import json

# WiFi Configuration
WIFI_SSID = "YOUR_WIFI_SSID"  # Ganti dengan SSID WiFi Anda
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"  # Ganti dengan password WiFi

# Backend WebSocket Server
BACKEND_HOST = "192.168.1.100"  # Ganti dengan IP PC Backend (Raspberry Pi/PC)
BACKEND_PORT = 8765

# GPIO Pin Mapping (24 buttons)
BUTTON_PINS = {
    "konveyor_atas": 23,
    "konveyor_bawah": 22,
    "silo_1": 21,
    "silo_2": 19,
    "silo_3": 18,
    "silo_4": 5,
    "pintu_pasir_1": 17,
    "pintu_pasir_2": 16,
    "pintu_batu_1": 4,
    "pintu_batu_2": 2,
    "pompa_air": 15,
    "semen": 13,
    "mixer": 12,
    "vibrator": 14,
    "pintu_mixer": 27,
    "klakson": 26,
    "waiting_hopper": 25,
    "emergency_stop": 33,
    "start_button": 32,
    "stop_button": 35,
    "pause_button": 34,
    "reset_button": 39,
    "spare_1": 36,
    "spare_2": 0,
}

# Initialize GPIO pins
button_states = {}
gpio_pins = {}

def init_gpio():
    """Initialize all GPIO pins as inputs with pull-up resistors"""
    print("🔧 Initializing GPIO pins...")
    for relay_name, pin_num in BUTTON_PINS.items():
        gpio_pins[relay_name] = machine.Pin(pin_num, machine.Pin.IN, machine.Pin.PULL_UP)
        button_states[relay_name] = False  # Initial state: not pressed
        print(f"  - {relay_name}: GPIO {pin_num}")
    print("✅ GPIO initialized")

def connect_wifi():
    """Connect to WiFi network"""
    print(f"📡 Connecting to WiFi: {WIFI_SSID}...")
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    timeout = 20
    while not wlan.isconnected() and timeout > 0:
        print("  ⏳ Waiting for connection...")
        time.sleep(1)
        timeout -= 1
    
    if wlan.isconnected():
        print(f"✅ WiFi connected! IP: {wlan.ifconfig()[0]}")
        return True
    else:
        print("❌ WiFi connection failed!")
        return False

def create_websocket_handshake():
    """Create WebSocket handshake HTTP request"""
    handshake = (
        f"GET / HTTP/1.1\r\n"
        f"Host: {BACKEND_HOST}:{BACKEND_PORT}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    return handshake.encode()

def connect_websocket():
    """Connect to backend WebSocket server"""
    try:
        print(f"🔌 Connecting to WebSocket: ws://{BACKEND_HOST}:{BACKEND_PORT}")
        s = socket.socket()
        s.connect((BACKEND_HOST, BACKEND_PORT))
        
        # Send WebSocket handshake
        s.send(create_websocket_handshake())
        
        # Receive handshake response
        response = s.recv(1024)
        if b"101 Switching Protocols" in response:
            print("✅ WebSocket connected!")
            return s
        else:
            print("❌ WebSocket handshake failed")
            s.close()
            return None
    except Exception as e:
        print(f"❌ WebSocket connection error: {e}")
        return None

def send_button_state(ws, relay_name, state):
    """Send button state via WebSocket"""
    try:
        message = {
            "type": "physical_button_state",
            "relay": relay_name,
            "state": state,
            "timestamp": time.time()
        }
        
        # WebSocket frame format (simple text frame)
        payload = json.dumps(message).encode()
        frame = bytearray([0x81])  # Text frame, FIN bit set
        
        # Payload length
        length = len(payload)
        if length <= 125:
            frame.append(length | 0x80)  # Mask bit set
        else:
            frame.append(126 | 0x80)
            frame.extend(length.to_bytes(2, 'big'))
        
        # Masking key (simple, not cryptographically secure)
        mask = b'\x00\x00\x00\x00'
        frame.extend(mask)
        
        # Masked payload
        frame.extend(payload)
        
        ws.send(frame)
        print(f"📤 Sent: {relay_name} = {state}")
    except Exception as e:
        print(f"❌ Send error: {e}")
        raise

def poll_buttons(ws):
    """Poll all buttons and detect state changes"""
    while True:
        try:
            for relay_name, pin in gpio_pins.items():
                # Read button state (inverted: 0 = pressed, 1 = not pressed)
                current_state = not pin.value()
                previous_state = button_states[relay_name]
                
                # Detect state change
                if current_state != previous_state:
                    button_states[relay_name] = current_state
                    print(f"🔘 Button change detected: {relay_name} = {'PRESSED' if current_state else 'RELEASED'}")
                    send_button_state(ws, relay_name, current_state)
            
            # Poll at 20Hz (50ms interval)
            time.sleep(0.05)
        except Exception as e:
            print(f"❌ Polling error: {e}")
            raise

def main():
    """Main entry point"""
    print("\n" + "="*50)
    print("ESP32 Physical Button Monitor")
    print("PT Farika Batch Plant Control System")
    print("="*50 + "\n")
    
    # Initialize GPIO
    init_gpio()
    
    # Connect to WiFi
    if not connect_wifi():
        print("❌ Cannot continue without WiFi")
        return
    
    # Main loop with auto-reconnect
    while True:
        ws = connect_websocket()
        if ws:
            try:
                print("🚀 Starting button polling...")
                poll_buttons(ws)
            except Exception as e:
                print(f"❌ Error: {e}")
                ws.close()
        
        print("🔄 Reconnecting in 5 seconds...")
        time.sleep(5)

# Run main program
if __name__ == "__main__":
    main()
