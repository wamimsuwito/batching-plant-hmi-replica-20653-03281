# Panduan Setup Hardware - Batch Plant HMI

## 📋 Daftar Isi
- [A. Persiapan Hardware](#a-persiapan-hardware)
- [B. Instalasi PCI Express Serial Card](#b-instalasi-pci-express-serial-card)
- [C. Koneksi Load Cell ke Serial Card](#c-koneksi-load-cell-ke-serial-card)
- [D. Koneksi USB-to-RS485 untuk Modbus](#d-koneksi-usb-to-rs485-untuk-modbus)
- [E. Konfigurasi Software](#e-konfigurasi-software)
- [F. Testing Step-by-Step](#f-testing-step-by-step)
- [G. Troubleshooting](#g-troubleshooting)

---

## A. Persiapan Hardware

### Komponen yang Dibutuhkan:

1. **PC Industrial**
   - Minimum: Intel Core i5, 8GB RAM, 256GB SSD
   - Windows 10/11 atau Linux (Ubuntu 20.04+)
   - Slot PCI Express tersedia (x1 minimal)

2. **PCI Express Serial Card (4 Port)**
   - Rekomendasi: StarTech PEX4S553B atau equivalent
   - 4 port RS232 untuk koneksi load cell indicators
   - Driver support untuk Windows/Linux

3. **USB-to-RS485 Converter**
   - Rekomendasi: UGREEN USB to RS485
   - Support Modbus RTU protocol
   - Auto flow control support

4. **Weight Indicators (4 unit) - Autonics**
   - Model: Autonics M1 atau equivalent
   - Interface: RS232
   - Baudrate: 9600, Data: 8N1
   - Output format: ASCII

5. **Autonics Modbus Relay Modules**
   - **SCM-US48I**: Modbus RTU to Digital I/O Gateway
   - **ARM-DO08P-4S**: 8-Channel Relay Output Module (Slave ID 2)
   - Total relay outputs: 24 channel (3x ARM modules)

6. **Kabel & Aksesoris**
   - DB9 Female-Female cable (4 pcs) untuk load cell
   - RS485 twisted pair cable (shielded, 2-core)
   - 120Ω termination resistors untuk RS485 bus
   - Power supply 24VDC untuk relay modules

---

## B. Instalasi PCI Express Serial Card

### Step 1: Instalasi Hardware

1. **Matikan PC dan cabut power supply**
   ```
   ⚠️ PERINGATAN: Pastikan PC benar-benar mati dan tidak ada listrik
   ```

2. **Buka casing PC**
   - Lepas sekrup penutup casing
   - Gunakan gelang anti-statis jika tersedia

3. **Pasang Serial Card ke Slot PCI Express**
   - Pilih slot PCI Express x1 atau lebih besar
   - Tekan card hingga terpasang sempurna
   - Kencangkan bracket card dengan sekrup

4. **Tutup casing dan nyalakan PC**

### Step 2: Instalasi Driver (Windows)

1. **Download driver dari manufacturer**
   - StarTech: https://www.startech.com/support
   - Atau gunakan driver CD yang disertakan

2. **Install driver**
   - Jalankan installer (biasanya .exe)
   - Follow wizard installer
   - Restart PC setelah instalasi selesai

3. **Verifikasi di Device Manager**
   ```
   1. Tekan Win + X → Device Manager
   2. Expand "Ports (COM & LPT)"
   3. Harus muncul 4 COM port baru:
      - COM1 (atau nomor lain, misal COM3-COM6)
      - COM2
      - COM3
      - COM4
   ```

4. **Catat nomor COM port yang muncul**
   ```
   Contoh:
   - PCI Serial Port 1 (COM3) → untuk Load Cell Pasir
   - PCI Serial Port 2 (COM4) → untuk Load Cell Batu
   - PCI Serial Port 3 (COM5) → untuk Load Cell Semen
   - PCI Serial Port 4 (COM6) → untuk Load Cell Air
   ```

### Step 3: Instalasi Driver (Linux)

1. **Driver biasanya sudah built-in (kernel 4.0+)**
   ```bash
   lsusb  # Check if card detected
   dmesg | grep tty  # Check assigned device names
   ```

2. **Verify serial ports**
   ```bash
   ls -l /dev/ttyS*
   # Should show: /dev/ttyS0, /dev/ttyS1, /dev/ttyS2, /dev/ttyS3
   ```

3. **Set permissions**
   ```bash
   sudo usermod -a -G dialout $USER
   sudo chmod 666 /dev/ttyS*
   ```

---

## C. Koneksi Load Cell ke Serial Card

### Wiring Diagram (ASCII):

```
┌──────────────────────┐
│  Weight Indicator    │
│  (Autonics M1)       │
│                      │
│  Pin 2: TXD ─────────┼──────────┐
│  Pin 3: RXD ─────────┼────┐     │
│  Pin 5: GND ─────────┼──┐ │     │
└──────────────────────┘  │ │     │
                          │ │     │
                          │ │     │
┌──────────────────────┐  │ │     │
│  DB9 Female          │  │ │     │
│  (PC Serial Card)    │  │ │     │
│                      │  │ │     │
│  Pin 2: RXD ◄────────┼──┘ │     │
│  Pin 3: TXD ◄────────┼────┘     │
│  Pin 5: GND ◄────────┼──────────┘
└──────────────────────┘
```

### Step-by-Step Connection:

1. **Load Cell Pasir → COM1 (Serial Port 1)**
   ```
   Indicator DB9 Male   ──►   PC DB9 Female (COM1)
   Pin 2 (TXD)          ──►   Pin 2 (RXD)
   Pin 3 (RXD)          ──►   Pin 3 (TXD)
   Pin 5 (GND)          ──►   Pin 5 (GND)
   ```

2. **Load Cell Batu → COM2 (Serial Port 2)**
   - Same wiring as above

3. **Load Cell Semen → COM3 (Serial Port 3)**
   - Same wiring as above

4. **Load Cell Air → COM4 (Serial Port 4)**
   - Same wiring as above

### Konfigurasi Indicator (Autonics M1):

Pastikan parameter berikut di indicator:
- **Baudrate**: 9600
- **Data bits**: 8
- **Parity**: None
- **Stop bits**: 1
- **Output mode**: Continuous (auto send)
- **Output format**: ASCII, weight only

---

## D. Koneksi USB-to-RS485 untuk Modbus

### Wiring Diagram:

```
┌─────────────────┐         ┌──────────────────┐
│  USB-to-RS485   │         │  SCM-US48I       │
│  Converter      │         │  (Modbus Gateway)│
│                 │         │                  │
│  A+ ────────────┼─────────┼──► A+ (RS485)   │
│  B- ────────────┼─────────┼──► B- (RS485)   │
│  GND ───────────┼─────────┼──► GND          │
└─────────────────┘         └──────────────────┘
                                     │
                            ┌────────┴─────────┐
                            │                  │
                    ┌───────▼─────┐    ┌──────▼──────┐
                    │ ARM-DO08P-4S│    │ ARM-DO08P-4S│
                    │ Slave ID: 2 │    │ Slave ID: 3 │
                    │ Relay 0-7   │    │ Relay 8-15  │
                    └─────────────┘    └─────────────┘
```

### Step-by-Step:

1. **Colok USB-to-RS485 ke PC**
   - Windows: Akan muncul COM port baru (misal COM5)
   - Linux: Akan muncul /dev/ttyUSB0

2. **Wiring RS485 Bus**
   ```
   USB Converter A+ ──┬──► SCM A+
   USB Converter B- ──┼──► SCM B-
                      │
   [Termination 120Ω antara A+ dan B- di ujung bus]
   ```

3. **Koneksi SCM-US48I ke ARM Modules**
   - SCM memiliki 4 expansion ports
   - Hubungkan ARM-DO08P-4S modules (up to 3 modules)
   - Set Slave ID masing-masing module: 2, 3, 4

4. **Set DIP Switch di ARM Module**
   ```
   ARM Module 1 (Slave ID 2):
   SW1: ON, SW2: OFF (Binary: 10 = ID 2)
   
   ARM Module 2 (Slave ID 3):
   SW1: ON, SW2: ON (Binary: 11 = ID 3)
   
   ARM Module 3 (Slave ID 4):
   SW1: OFF, SW2: OFF, SW3: ON (Binary: 100 = ID 4)
   ```

5. **Power Supply 24VDC**
   - Hubungkan 24VDC ke semua module
   - Pastikan grounding yang baik

---

## E. Konfigurasi Software

### Step 1: Edit `config_autonics.json`

File terletak di: `raspberry_pi/config_autonics.json`

```json
{
  "serial_ports": {
    "pasir": "COM3",    // Sesuaikan dengan Device Manager
    "batu": "COM4",
    "semen": "COM5",
    "air": "COM6"
  },
  "serial_config": {
    "baudrate": 9600,
    "bytesize": 8,
    "parity": "N",
    "stopbits": 1,
    "timeout": 1
  },
  "modbus": {
    "port": "COM7",       // USB-to-RS485 port
    "baudrate": 9600,
    "bytesize": 8,
    "parity": "N",
    "stopbits": 1,
    "timeout": 1,
    "scm_slave_id": 1,
    "arm_slave_id": 2
  },
  "relay_mapping": {
    "mixer": 0,
    "konveyor_atas": 1,
    "konveyor_bawah": 2,
    "kompressor": 3,
    "pintu_pasir_1": 4,
    "pintu_pasir_2": 5,
    "pintu_batu_1": 6,
    "pintu_batu_2": 7,
    "dump_material": 8,
    "dump_material_2": 9,
    "vibrator": 10,
    "tuang_air": 11,
    "tuang_additive": 12,
    "pintu_mixer_buka": 13,
    "pintu_mixer_tutup": 14,
    "klakson": 15
  }
}
```

### Step 2: Install Python Dependencies

```bash
cd raspberry_pi
pip install -r requirements_autonics.txt
```

### Step 3: Jalankan Backend Server

```bash
python main.py
```

Expected output:
```
✅ Serial ports opened:
   - Pasir: COM3
   - Batu: COM4
   - Semen: COM5
   - Air: COM6
✅ Modbus connected: COM7 (Slave ID: 2)
✅ WebSocket server started on ws://0.0.0.0:8765
```

### Step 4: Konfigurasi HMI Application

1. **Buka aplikasi HMI**
2. **Login sebagai Admin**
3. **Navigate ke: Admin → Com dan Port**
4. **Set WebSocket URL**:
   ```
   ws://localhost:8765
   ```
   (Atau IP address PC jika diakses dari remote)
5. **Klik "Save WebSocket URL"**
6. **Klik "Reconnect"**
7. **Verify "Status: Connected" berwarna hijau**

---

## F. Testing Step-by-Step

### Test 1: Load Cell Connection

1. **Buka serial monitor tool** (PuTTY, CoolTerm, etc.)
2. **Connect ke COM3 (Load Cell Pasir)**
   - Baudrate: 9600
   - Data: 8N1
3. **Verify data stream**:
   ```
   +00123.4
   +00123.5
   +00123.4
   ```
4. **Repeat untuk COM4, COM5, COM6**

### Test 2: WebSocket Connection

1. **Di HMI, buka: Admin → Com dan Port**
2. **Check "Status Koneksi"**:
   - Harus: `Connected` (hijau)
3. **Check "Weight Indicators Status"**:
   ```
   Pasir: 123.4 kg (updating)
   Batu: 456.7 kg (updating)
   Semen: 78.9 kg (updating)
   Air: 23.4 kg (updating)
   ```
4. **Last Update**: harus < 1 detik yang lalu

### Test 3: Relay Control (Klakson)

1. **Di HMI: Admin → Com dan Port**
2. **Klik "Test Klakson (1 detik)"**
3. **Expected**: Klakson relay ON selama 1 detik
4. **Verify di field**: Klakson berbunyi

### Test 4: Produksi Simulasi Mode

1. **Di HMI: Admin → Com dan Port**
2. **Pilih "Mode Operasi: Simulasi"**
3. **Start batch production**
4. **Expected**: Produksi jalan dengan auto-increment weights (simulator)

### Test 5: Produksi Real Hardware Mode

1. **Pastikan semua hardware terhubung**
2. **Di HMI: Admin → Com dan Port**
3. **Switch ke "Mode Operasi: Produksi"**
4. **Klik "Save Mode Operasi"**
5. **Start batch production**
6. **Expected**: Produksi jalan dengan real load cell readings
7. **Monitor actual weights updating real-time**

---

## G. Troubleshooting

### Problem 1: COM Port Tidak Muncul (Windows)

**Symptoms**: Device Manager tidak show serial ports

**Solutions**:
1. Reinstall driver serial card
2. Cek apakah card terpasang dengan benar (coba slot lain)
3. Update Windows
4. Disable "Secure Boot" di BIOS

### Problem 2: WebSocket Tidak Connect

**Symptoms**: Status "Disconnected" di HMI

**Solutions**:
1. Verify `python main.py` running tanpa error
2. Check firewall: Allow port 8765
   ```bash
   # Windows Firewall
   netsh advfirewall firewall add rule name="Autonics WS" dir=in action=allow protocol=TCP localport=8765
   ```
3. Ping localhost: `ping 127.0.0.1`
4. Check URL di HMI: harus `ws://localhost:8765` (bukan `wss://`)

### Problem 3: Load Cell Data Tidak Muncul

**Symptoms**: Weight stuck at 0.0 kg

**Solutions**:
1. **Test serial port manual** (PuTTY):
   - Open COM port
   - Baudrate: 9600, 8N1
   - Should see data stream
2. **Check wiring**: TXD-RXD harus cross
3. **Check indicator power**: LED indicator harus nyala
4. **Check indicator settings**: Output mode = Continuous

### Problem 4: Relay Tidak Bekerja

**Symptoms**: Klik "Test Klakson" tapi tidak berbunyi

**Solutions**:
1. **Check Modbus connection**:
   ```bash
   # Use Modbus test tool (Modbus Poll)
   # Read coils: Slave 2, Address 0-23
   ```
2. **Check RS485 wiring**: A+/B- tidak terbalik
3. **Check termination resistor**: 120Ω di ujung bus
4. **Check ARM module power**: LED harus nyala
5. **Verify DIP switch**: Slave ID benar (2, 3, 4)

### Problem 5: Data Weight Spike/Unstable

**Symptoms**: Weight nilai loncat-loncat tidak stabil

**Solutions**:
1. **Check load cell calibration**: Kalibrasi ulang indicator
2. **Check grounding**: Pastikan grounding load cell baik
3. **Check cable shielding**: Gunakan shielded cable
4. **Check EMI interference**: Jauhkan kabel dari motor/relay
5. **Adjust weight spike threshold** di `config_autonics.json`:
   ```json
   "safety": {
     "weight_spike_threshold_kg": 50
   }
   ```

### Problem 6: Mode Produksi Auto-Pause

**Symptoms**: Produksi berhenti tiba-tiba dengan alert

**Solutions**:
1. **Check WebSocket connection**: Harus tetap connected
2. **Check Python backend**: `python main.py` masih running
3. **Check network stability**: Ping localhost harus stabil
4. **Check COM port tidak dipakai program lain**

---

## 📞 Technical Support

Jika masih ada masalah setelah mengikuti panduan ini, hubungi:

**PT Farika Raya Teknik**
- Email: support@farika.com
- WhatsApp: +62-xxx-xxxx-xxxx
- Website: https://farika.com

**Lampirkan informasi berikut saat lapor issue**:
1. Screenshot error message
2. Log file dari `python main.py`
3. Screenshot Device Manager (Windows)
4. Photo wiring installation

---

## 📚 Referensi

- [Autonics M1 Manual](https://www.autonics.com)
- [Modbus RTU Protocol Specification](https://modbus.org)
- [RS485 Wiring Best Practices](https://www.ti.com/lit/an/slla070d/slla070d.pdf)
- [Python Serial Communication](https://pyserial.readthedocs.io)

---

**Last Updated**: 2025-01-20  
**Version**: 1.0  
**Author**: PT Farika Raya Teknik
