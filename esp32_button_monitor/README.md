# ESP32 Physical Button Monitor

Firmware untuk ESP32 yang memonitor 24 tombol fisik pada panel operator dan mengirim status ke backend via WebSocket.

## Hardware Requirements

- ESP32 DevKit module (NodeMCU-32S atau sejenisnya)
- 24x physical buttons (normally open)
- Pull-up resistors sudah built-in di ESP32
- Power supply 5V untuk ESP32
- Kabel jumper untuk wiring

## Wiring Diagram

```
Physical Button → ESP32 GPIO Pin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Konveyor Atas     → GPIO 23
Konveyor Bawah    → GPIO 22
Silo 1            → GPIO 21
Silo 2            → GPIO 19
Silo 3            → GPIO 18
Silo 4            → GPIO 5
Pintu Pasir 1     → GPIO 17
Pintu Pasir 2     → GPIO 16
Pintu Batu 1      → GPIO 4
Pintu Batu 2      → GPIO 2
Pompa Air         → GPIO 15
Semen             → GPIO 13
Mixer             → GPIO 12
Vibrator          → GPIO 14
Pintu Mixer       → GPIO 27
Klakson           → GPIO 26
Waiting Hopper    → GPIO 25
Emergency Stop    → GPIO 33
Start Button      → GPIO 32
Stop Button       → GPIO 35
Pause Button      → GPIO 34
Reset Button      → GPIO 39
Spare 1           → GPIO 36
Spare 2           → GPIO 0

Common Ground     → GND
```

**Wiring untuk setiap button:**
```
Button Terminal 1 → ESP32 GPIO Pin
Button Terminal 2 → GND (Common Ground)
```

ESP32 menggunakan internal pull-up resistor, sehingga:
- Button NOT pressed = HIGH (1)
- Button PRESSED = LOW (0)

## Software Installation

### 1. Install MicroPython di ESP32

Download MicroPython firmware dari: https://micropython.org/download/esp32/

Flash ke ESP32 menggunakan esptool:
```bash
pip install esptool
esptool.py --port COM3 erase_flash
esptool.py --port COM3 --baud 460800 write_flash -z 0x1000 esp32-xxx.bin
```

### 2. Upload Firmware

Gunakan Thonny IDE atau ampy:

**Menggunakan Thonny:**
1. Install Thonny: https://thonny.org/
2. Tools → Options → Interpreter → MicroPython (ESP32)
3. Open `main.py`
4. Save to device as `main.py`

**Menggunakan ampy:**
```bash
pip install adafruit-ampy
ampy --port COM3 put main.py
```

### 3. Configure WiFi

Edit `main.py` dan sesuaikan:
```python
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"
BACKEND_HOST = "192.168.1.100"  # IP PC Backend
BACKEND_PORT = 8765
```

### 4. Test Connection

Reset ESP32, monitor serial output:
```bash
python -m serial.tools.miniterm COM3 115200
```

Expected output:
```
==================================================
ESP32 Physical Button Monitor
PT Farika Batch Plant Control System
==================================================

🔧 Initializing GPIO pins...
  - konveyor_atas: GPIO 23
  - konveyor_bawah: GPIO 22
  ...
✅ GPIO initialized
📡 Connecting to WiFi: YOUR_SSID...
✅ WiFi connected! IP: 192.168.1.150
🔌 Connecting to WebSocket: ws://192.168.1.100:8765
✅ WebSocket connected!
🚀 Starting button polling...
```

## How It Works

1. **GPIO Monitoring**: ESP32 polls all 24 GPIO pins at 20Hz (50ms interval)
2. **State Detection**: Detects button press/release by comparing previous state
3. **WebSocket Transmission**: Sends state change to backend immediately
4. **Message Format**:
   ```json
   {
     "type": "physical_button_state",
     "relay": "semen",
     "state": true,
     "timestamp": 1234567890
   }
   ```

## LED Indicators (on ESP32 board)

- **Blue LED (GPIO 2)**: WiFi connected
- **Red LED**: WebSocket error (reconnecting)

## Troubleshooting

### WiFi tidak connect
- Periksa SSID dan password
- Pastikan ESP32 dalam jangkauan WiFi
- Restart ESP32

### WebSocket error
- Periksa IP backend sudah benar
- Pastikan backend websocket server running di port 8765
- Periksa firewall tidak memblokir port 8765

### Button tidak terdeteksi
- Periksa wiring button ke GPIO pin
- Test dengan multimeter: closed = 0 ohm, open = infinite
- Pastikan common ground terhubung

## Cost Estimation

- ESP32 DevKit: Rp 50.000
- Jumper wires: Rp 10.000
- Power supply 5V: Rp 15.000
- **Total**: ~Rp 75.000

## Alternative Solutions

Jika tidak ingin menggunakan ESP32, alternatif lain:
1. **Modbus Input Module** (lebih mahal, ~Rp 500k)
2. **Arduino + WiFi Shield** (lebih ribet)
3. **Polling relay status dari Autonics ARM** (delay tinggi, tidak real-time)

**Rekomendasi: ESP32 karena murah, real-time, dan mudah.**
