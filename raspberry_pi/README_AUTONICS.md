# Batch Plant Controller - Autonics System

Python controller untuk Batch Plant HMI menggunakan sistem Autonics industrial control.

## 🔧 Hardware Requirements

### PC/Industrial Computer
- **OS:** Windows 10/11 atau Linux
- **Python:** 3.9 atau lebih tinggi
- **Serial Ports:**
  - PCI Express Serial Card (4 port) untuk weight indicators
  - USB-to-RS485 converter untuk Modbus

### Weight Indicators
- 4x RS232 Weight Indicators (Pasir, Batu, Semen, Air)
- Terhubung ke PCI Express Serial Card (COM1-4)
- Baudrate: 9600, 8N1

### Relay Control System
- **Autonics SCM-US48I:** Modbus RTU Gateway/Converter
- **Autonics ARM-DO08P-4S:** Master relay module (8 outputs)
- **Autonics ARX-DO08P-4S x2:** Expansion modules (2x8 = 16 outputs)
- **Total:** 24 relay outputs

### Cabling
- **RS-485 Cable:** USB-to-RS485 → SCM-US48I
- **Modbus Network:** SCM → ARM module (Slave ID: 2)
- **Expansion:** ARX modules connected to ARM expansion sockets

## 📦 Software Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements_autonics.txt
```

**Required packages:**
- `pyserial>=3.5` - Serial communication for weight indicators
- `pymodbus>=3.6.0` - Modbus RTU protocol for relay control
- `websockets>=12.0` - WebSocket server for web app

### 2. USB-to-RS485 Driver Installation

**Windows:**
- Install driver for your USB-to-RS485 adapter (e.g., FTDI, CH340, Prolific)
- Check Device Manager → Ports (COM & LPT) untuk COM port number

**Linux:**
```bash
# USB-to-RS485 biasanya muncul sebagai /dev/ttyUSB* atau /dev/ttyACM*
ls /dev/ttyUSB*
ls /dev/ttyACM*

# Add user to dialout group untuk akses serial port
sudo usermod -a -G dialout $USER
# Logout dan login lagi
```

### 3. Configure COM Ports

Edit `config_autonics.json`:

```json
{
  "serial_ports": {
    "pasir": "COM1",    // Windows: COMx, Linux: /dev/ttyUSB0
    "batu": "COM2",
    "semen": "COM3",
    "air": "COM4"
  },
  "modbus": {
    "port": "COM5",     // USB-to-RS485 port
    "baudrate": 9600,
    "arm_slave_id": 2   // ARM module Modbus slave ID
  }
}
```

**Tips menemukan COM port (Windows):**
```
Device Manager → Ports (COM & LPT)
```

**Tips menemukan serial port (Linux):**
```bash
dmesg | grep tty
ls -l /dev/ttyUSB*
ls -l /dev/ttyACM*
```

## 🔌 Modbus Coil Mapping

Total: 24 relay outputs (Coil 0-23)

### ARM-DO08P-4S (Coil 0-7)
```
Coil 0:  Mixer
Coil 1:  Konveyor Atas
Coil 2:  Konveyor Bawah
Coil 3:  Kompressor
Coil 4:  Pintu Pasir 1
Coil 5:  Pintu Pasir 2
Coil 6:  Pintu Batu 1
Coil 7:  Pintu Batu 2
```

### ARX-DO08P-4S #1 (Coil 8-15)
```
Coil 8:  Dump Material
Coil 9:  Dump Material 2  ← NEW
Coil 10: Vibrator
Coil 11: Tuang Air
Coil 12: Tuang Additive
Coil 13: Pintu Mixer Buka
Coil 14: Pintu Mixer Tutup
Coil 15: Klakson  ← NEW
```

### ARX-DO08P-4S #2 (Coil 16-23)
```
Coil 16: Silo 1
Coil 17: Silo 2
Coil 18: Silo 3
Coil 19: Silo 4
Coil 20: Silo 5
Coil 21: Silo 6
Coil 22: Spare 1
Coil 23: Spare 2
```

## 🚀 Running the Controller

### Basic Run
```bash
cd raspberry_pi
python main.py
```

### Expected Output
```
============================================================
  BATCH PLANT CONTROLLER - Autonics System
============================================================
✅ Configuration loaded from config_autonics.json
✅ Modbus RTU connected on COM5 @ 9600 baud
✅ Modbus Controller initialized with 24 relays
✅ Scale Reader started (4 indicators)
✅ WebSocket server started on ws://0.0.0.0:8765

============================================================
  SYSTEM READY
============================================================
  Web App URL: ws://0.0.0.0:8765
  Press Ctrl+C to stop
============================================================
```

## 🧪 Testing Procedures

### 1. Test Modbus Communication

```bash
python modbus_controller.py
```

**Expected:**
- Connection to ARM module successful
- Test relays 1-5 toggle ON/OFF
- No Modbus errors

### 2. Test Weight Reading

```bash
python scale_reader.py
```

**Expected:**
- All 4 weight indicators detected
- Real-time weight updates every 100ms
- No serial port errors

### 3. Test Full System

```bash
python main.py
```

Then open HMI app and check:
- WebSocket connection established
- Real-time weight updates
- Relay control works from UI

## 🔧 Modbus RTU Wiring

### Pin Connections (RS-485)

**USB-to-RS485 → SCM-US48I:**
```
RS-485 A (+) → SCM Terminal A
RS-485 B (-) → SCM Terminal B
GND          → SCM GND (optional, for stability)
```

**SCM-US48I → ARM-DO08P-4S:**
```
SCM Modbus OUT → ARM Modbus IN
(Check SCM and ARM manuals for specific terminals)
```

**Important:**
- Use twisted-pair cable for RS-485 (Cat5e/Cat6 works)
- Maximum cable length: 1200m @ 9600 baud
- Add 120Ω termination resistor at both ends for long cables

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────┐
│  Weight Indicators (RS232) → PCI Express Serial     │
│  ↓                                                   │
│  Python: scale_reader.py (COM1-4, 9600 baud)       │
│  ↓                                                   │
│  Python: websocket_server.py (Port 8765)           │
│  ↓                                                   │
│  WebSocket Protocol (JSON messages)                 │
│  ↓                                                   │
│  React HMI (Electron App)                           │
│                                                      │
│  [Relay Commands]                                   │
│  ↓                                                   │
│  Python: modbus_controller.py                       │
│  ↓                                                   │
│  USB-to-RS485 (COM5, 9600 baud)                    │
│  ↓                                                   │
│  Modbus RTU Protocol                                │
│  ↓                                                   │
│  Autonics ARM/ARX Modules (24 relays)              │
└─────────────────────────────────────────────────────┘
```

## ⚠️ Troubleshooting

### Modbus Connection Failed
```
⚠️  Warning: Could not connect to Modbus on COM5
```

**Solutions:**
1. Check USB-to-RS485 driver installed
2. Verify COM port in Device Manager (Windows)
3. Test with different COM port numbers
4. Check RS-485 wiring (A/B polarity)
5. Verify ARM module power supply

### Serial Port Permission Denied (Linux)
```
PermissionError: [Errno 13] Permission denied: '/dev/ttyUSB0'
```

**Solution:**
```bash
sudo usermod -a -G dialout $USER
# Logout and login again
```

### Modbus Timeout Error
```
❌ Modbus exception: Timeout
```

**Solutions:**
1. Check RS-485 cable connection
2. Verify ARM Slave ID (default: 2)
3. Check baudrate (9600)
4. Add termination resistor for long cables
5. Reduce cable length if possible

### Weight Indicator Not Responding
```
⚠️  No data from scale: pasir (COM1)
```

**Solutions:**
1. Check serial cable connection
2. Verify baudrate (9600, 8N1)
3. Test with serial terminal (PuTTY, minicom)
4. Check indicator power supply

## 📝 Logs

### Console Logs
All activity is logged to console with timestamps

### Log Levels
- `✅` Success / OK
- `🔌` Relay control
- `⚖️` Weight reading
- `⚠️` Warning
- `❌` Error
- `🚨` Emergency stop

## 🔄 Auto-start on Boot

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At system startup
4. Action: Start program
5. Program: `python`
6. Arguments: `C:\path\to\raspberry_pi\main.py`
7. Start in: `C:\path\to\raspberry_pi`

### Linux (systemd)

Create `/etc/systemd/system/batch_plant.service`:

```ini
[Unit]
Description=Batch Plant Controller (Autonics)
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/batch-plant-hmi/raspberry_pi
ExecStart=/usr/bin/python3 /home/youruser/batch-plant-hmi/raspberry_pi/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable batch_plant.service
sudo systemctl start batch_plant.service

# Check status
sudo systemctl status batch_plant.service

# View logs
journalctl -u batch_plant.service -f
```

## 📞 Support

### Check Logs
```bash
# Console output
python main.py

# System logs (Linux)
journalctl -u batch_plant.service -f
```

### Test Individual Components
```bash
# Test Modbus only
python modbus_controller.py

# Test scales only
python scale_reader.py

# Test WebSocket only
python websocket_server.py
```

### Configuration Check
```bash
# Verify config file syntax
python -c "import json; print(json.load(open('config_autonics.json')))"

# Check Modbus config
python -c "import json; print(json.load(open('config_autonics.json'))['modbus'])"
```

## 🔐 Safety Features

1. **Emergency Stop:** `set_all_off()` turns all 24 relays OFF instantly
2. **Watchdog Timer:** Auto-stop if no heartbeat from web app
3. **Connection Monitoring:** Auto-reconnect on Modbus timeout
4. **Graceful Shutdown:** Ctrl+C safely stops all operations
5. **State Tracking:** Relay states monitored and logged

## 📚 References

- **Autonics ARM-DO08P-4S Manual:** Module specifications and wiring
- **Autonics ARX-DO08P-4S Manual:** Expansion module connection
- **Autonics SCM-US48I Manual:** Modbus gateway setup
- **Modbus RTU Protocol:** Function codes FC01, FC05, FC15
- **PyModbus Documentation:** https://pymodbus.readthedocs.io/
