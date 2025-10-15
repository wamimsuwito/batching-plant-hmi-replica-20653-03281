# Batch Plant Controller - Raspberry Pi 5

Python controller untuk sistem Batch Plant HMI yang terintegrasi dengan Raspberry Pi 5.

## 🔧 Hardware Requirements

- **Raspberry Pi 5** (atau Raspberry Pi 4)
- **4x RS232 Weight Indicators** (Pasir, Batu, Semen, Air)
- **4x USB-to-RS232 adapters** (jika indikator RS232 murni)
- **16-channel Relay Module** (Active HIGH)
- **USB Cable** untuk koneksi ke komputer
- **Power supply** untuk Raspberry Pi

## 📦 Software Requirements

- Raspberry Pi OS (64-bit recommended)
- Python 3.9+
- pip3

## 🚀 Installation

### 1. Setup Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-rpi.gpio -y

# Install required Python packages
cd raspberry_pi
pip3 install -r requirements.txt
```

### 2. Configure Serial Ports

```bash
# Check connected USB-to-RS232 adapters
ls -l /dev/ttyUSB*

# Should show: /dev/ttyUSB0, /dev/ttyUSB1, /dev/ttyUSB2, /dev/ttyUSB3

# Give permission to access serial ports
sudo usermod -a -G dialout $USER

# Reboot to apply changes
sudo reboot
```

### 3. Configure config.json

Edit `config.json` dan sesuaikan:

```json
{
  "serial_ports": {
    "pasir": "/dev/ttyUSB0",    // ← Sesuaikan dengan port Anda
    "batu": "/dev/ttyUSB1",
    "semen": "/dev/ttyUSB2",
    "air": "/dev/ttyUSB3"
  },
  "gpio_pins": {
    "mixer": 17,                 // ← Sesuaikan dengan wiring Anda
    "konveyor_atas": 18,
    // ... dst
  }
}
```

### 4. Test Components

```bash
# Test scale reading
python3 scale_reader.py

# Test GPIO relay control
python3 gpio_controller.py
```

### 5. Run Main Controller

```bash
# Run controller
python3 main.py

# Atau run as service (auto-start on boot)
sudo cp batch_plant.service /etc/systemd/system/
sudo systemctl enable batch_plant
sudo systemctl start batch_plant
```

## 🔌 GPIO Pin Mapping (BCM Mode)

| Relay Name | GPIO Pin (BCM) | Physical Pin |
|------------|----------------|--------------|
| Mixer | 17 | Pin 11 |
| Konveyor Atas | 18 | Pin 12 |
| Konveyor Bawah | 27 | Pin 13 |
| Kompressor | 22 | Pin 15 |
| Pintu Pasir 1 | 23 | Pin 16 |
| Pintu Pasir 2 | 24 | Pin 18 |
| Pintu Batu 1 | 25 | Pin 22 |
| Pintu Batu 2 | 8 | Pin 24 |
| ... | ... | ... |

**⚠️ IMPORTANT:** 
- Pastikan relay module adalah **Active HIGH** (GPIO HIGH = Relay ON)
- Gunakan **BCM pin numbering**, bukan physical pin numbers
- Hubungkan GND Raspberry Pi ke GND relay module

## 🌐 Network Setup (USB Serial Bridge)

### Option 1: USB Serial (RNDIS/CDC-NCM)

1. **Di Raspberry Pi:**
```bash
# Enable USB gadget mode
echo "dtoverlay=dwc2" | sudo tee -a /boot/config.txt
echo "modules-load=dwc2,g_ether" | sudo tee -a /boot/modules
sudo reboot
```

2. **Di Komputer Windows:**
- Install RNDIS driver
- Raspberry Pi akan muncul sebagai network adapter
- IP otomatis: `192.168.137.1`

3. **Test koneksi:**
```bash
# Di komputer
ping raspberrypi.local
# atau
ping 192.168.137.1
```

### Option 2: WiFi Direct/Hotspot

```bash
# Di Raspberry Pi, buat WiFi hotspot
sudo apt install hostapd dnsmasq
# ... konfigurasi hostapd
```

### Option 3: Ethernet Cable

Hubungkan Raspberry Pi dan komputer dengan kabel Ethernet langsung.

## 📊 Data Flow

```
[RS232 Indicators] → [USB-Serial] → [Raspberry Pi]
                                          ↓
                                    [Python Script]
                                    ├─ scale_reader.py
                                    ├─ gpio_controller.py
                                    ├─ websocket_server.py
                                    └─ safety.py
                                          ↓
                                    [WebSocket Server]
                                    (ws://0.0.0.0:8765)
                                          ↓
                               [USB/Network Connection]
                                          ↓
                                    [Komputer]
                                    [Web Browser]
                                    [React HMI App]
```

## 🧪 Testing

### Test 1: Scale Reading
```bash
python3 scale_reader.py
# Expected output:
# Pasir: 123.5 kg | Batu: 456.7 kg | Semen: 89.0 kg | Air: 45.2 kg
```

### Test 2: GPIO Relay
```bash
python3 gpio_controller.py
# Will cycle through all 16 relays
```

### Test 3: WebSocket Server
```bash
python3 main.py
# Open browser console and connect:
# ws = new WebSocket('ws://raspberrypi.local:8765');
# ws.send(JSON.stringify({type: 'get_status'}));
```

## 🛡️ Safety Features

1. **Watchdog Timer**: Auto-stop jika web app disconnect > 5 detik
2. **Weight Spike Detection**: Deteksi perubahan berat abnormal
3. **Emergency Stop**: Hardware + software emergency stop
4. **GPIO Protection**: Mencegah command yang bertentangan
5. **Graceful Shutdown**: Matikan semua relay saat shutdown

## 🐛 Troubleshooting

### Problem: "Permission denied: /dev/ttyUSB0"
**Solution:**
```bash
sudo usermod -a -G dialout $USER
sudo reboot
```

### Problem: "No such file or directory: /dev/ttyUSB0"
**Solution:**
```bash
# Check connected devices
lsusb
ls -l /dev/ttyUSB*

# Install USB-serial drivers if needed
sudo apt install setserial
```

### Problem: GPIO pins not working
**Solution:**
```bash
# Check if GPIO is accessible
gpio readall

# Make sure you're using BCM mode, not BOARD mode
```

### Problem: WebSocket connection refused
**Solution:**
```bash
# Check if firewall is blocking
sudo ufw allow 8765

# Check if server is running
netstat -tulpn | grep 8765
```

## 📝 Logs

Logs disimpan di:
- Console output: Real-time
- File: `batch_plant.log`

```bash
# View logs
tail -f batch_plant.log

# View service logs (if running as service)
sudo journalctl -u batch_plant -f
```

## 🔄 Auto-start on Boot

```bash
# Create service file
sudo nano /etc/systemd/system/batch_plant.service
```

```ini
[Unit]
Description=Batch Plant Controller
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/raspberry_pi
ExecStart=/usr/bin/python3 /home/pi/raspberry_pi/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable batch_plant
sudo systemctl start batch_plant

# Check status
sudo systemctl status batch_plant
```

## 📞 Support

Jika ada masalah, cek:
1. Console logs (`python3 main.py`)
2. System logs (`sudo journalctl -u batch_plant`)
3. GPIO status (`gpio readall`)
4. Serial ports (`ls -l /dev/ttyUSB*`)

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-15  
**Python Version:** 3.9+  
**Raspberry Pi OS:** Bullseye or later
