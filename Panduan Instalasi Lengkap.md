# 📘 PANDUAN INSTALASI LENGKAP
## Sistem Batch Plant HMI - PT Farika Raya Beton

> **Versi:** 2.0  
> **Terakhir Diperbarui:** November 2025  
> **Status:** Production Ready

---

## 📑 DAFTAR ISI

1. [PENGENALAN SISTEM](#1-pengenalan-sistem)
2. [PERSIAPAN AWAL](#2-persiapan-awal)
3. [INSTALASI HARDWARE - PC INDUSTRIAL](#3-instalasi-hardware---pc-industrial)
4. [INSTALASI HARDWARE - ESP32 (OPSIONAL)](#4-instalasi-hardware---esp32-opsional)
5. [INSTALASI SOFTWARE - FRONTEND (HMI APP)](#5-instalasi-software---frontend-hmi-app)
6. [INSTALASI SOFTWARE - BACKEND (PYTHON CONTROLLER)](#6-instalasi-software---backend-python-controller)
7. [INSTALASI ESP32 BUTTON MONITOR (OPSIONAL)](#7-instalasi-esp32-button-monitor-opsional)
8. [TESTING & VERIFIKASI SISTEM](#8-testing--verifikasi-sistem)
9. [KONFIGURASI LANJUTAN](#9-konfigurasi-lanjutan)
10. [TROUBLESHOOTING LENGKAP](#10-troubleshooting-lengkap)
11. [MAINTENANCE & MONITORING](#11-maintenance--monitoring)
12. [DIAGRAM & REFERENSI](#12-diagram--referensi)

---

## 1. PENGENALAN SISTEM

### 1.1 Overview Arsitektur Sistem

Sistem Batch Plant HMI ini merupakan solusi kontrol otomatis untuk pabrik batching beton yang terintegrasi penuh dengan komponen hardware dan software modern.

```
┌─────────────────────────────────────────────────────────────────┐
│                      BATCH PLANT HMI SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐            ┌─────▼──────┐         ┌──────▼───────┐
   │   HMI   │            │  PYTHON    │         │   HARDWARE   │
   │Frontend │◄──────────►│  BACKEND   │◄────────┤   CONTROL    │
   │(Electron│  WebSocket │(Controller)│  Serial │   SYSTEM     │
   │  /Web)  │            │            │  Modbus │              │
   └─────────┘            └────────────┘         └──────────────┘
        │                        │                        │
        │                        │                        │
    ┌───▼────┐           ┌───────▼───────┐       ┌───────▼──────┐
    │Browser │           │ 4x Load Cells │       │ 24 Relays    │
    │        │           │ (Weight Ind.) │       │ (Modbus RTU) │
    └────────┘           └───────────────┘       └──────────────┘
                                                          │
                                           ┌──────────────┼──────────────┐
                                           │              │              │
                                      ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
                                      │Mixer   │    │Conveyor│    │ Valves │
                                      │Motors  │    │ Belts  │    │Solenoid│
                                      └────────┘    └────────┘    └────────┘
```

### 1.2 Komponen Sistem

#### **A. Hardware Utama**

| Komponen | Spesifikasi | Fungsi | Qty |
|----------|-------------|--------|-----|
| PC Industrial / Laptop | Windows 10/11 atau Linux | Menjalankan HMI & Backend | 1 |
| PCI Express Serial Card | 4 Port RS-232 | Komunikasi Load Cells | 1 |
| USB-to-RS485 Converter | FTDI/CH340 chipset | Komunikasi Modbus Relay | 1 |
| Autonics Weight Indicator M1 | RS-232, 9600 baud | Load Cell Pasir | 1 |
| Autonics Weight Indicator M1 | RS-232, 9600 baud | Load Cell Batu | 1 |
| Autonics Weight Indicator M1 | RS-232, 9600 baud | Load Cell Semen | 1 |
| Autonics Weight Indicator M1 | RS-232, 9600 baud | Load Cell Air | 1 |
| DB9 Female-Female Cable | Null modem, 2m | Koneksi Load Cells ke PC | 4 |
| Autonics SCM-US48I | Modbus RTU Gateway | USB to Modbus Converter | 1 |
| Autonics ARM-DO08P-4S | 8 Digital Output | Master Relay Module | 1 |
| Autonics ARX-DO08P-4S | 8 Digital Output | Expansion Module #1 | 1 |
| Autonics ARX-DO08P-4S | 8 Digital Output | Expansion Module #2 | 1 |
| Power Supply 24VDC | 5A min | Power untuk Relay Modules | 1 |
| RS-485 Termination Resistor | 120Ω, 1/4W | Terminasi Bus RS-485 | 2 |

#### **B. Hardware Opsional (Sistem 2 dengan ESP32)**

| Komponen | Spesifikasi | Fungsi | Qty |
|----------|-------------|--------|-----|
| ESP32 DevKit | 38 pin, WiFi | Physical Button Monitor | 1 |
| Physical Buttons | 24VDC, NO (Normally Open) | Control Manual | 24 |
| Power Supply 5V | 2A untuk ESP32 | Power ESP32 | 1 |
| Kabel Jumper | Male-Female, 30cm | Wiring Buttons | 24+ |

#### **C. Software**

| Software | Versi | Fungsi |
|----------|-------|--------|
| Node.js | v18 LTS atau lebih baru | Runtime untuk HMI App |
| Python | v3.9+ | Backend Controller |
| Git | Latest | Version control |
| Electron | v28.x | Desktop App Framework |
| Chrome/Edge Browser | Latest | HMI Web Interface |

#### **D. Dependencies Python**

Lihat file `raspberry_pi/requirements_autonics.txt`:
- `pyserial` - Komunikasi serial load cells
- `pymodbus` - Komunikasi Modbus RTU
- `websockets` - WebSocket server untuk HMI
- `asyncio` - Asynchronous operations

#### **E. Dependencies Node.js**

Lihat file `package.json`:
- React, Vite, TypeScript
- TailwindCSS untuk styling
- Radix UI components
- React Router untuk navigasi
- Dan lainnya...

### 1.3 Diagram Alur Komunikasi

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                            │
└──────────────────────────────────────────────────────────────────────┘

WEIGHT DATA FLOW:
─────────────────
Load Cell Pasir ──[RS-232]──► COM1 ──┐
Load Cell Batu  ──[RS-232]──► COM2 ──┤
Load Cell Semen ──[RS-232]──► COM3 ──┼──► ScaleReader.py ──┐
Load Cell Air   ──[RS-232]──► COM4 ──┘                      │
                                                             │
                                                             ▼
                                             ┌───────────────────────────┐
                                             │  main.py (Controller)     │
                                             │  - Process weight data    │
                                             │  - Control relays         │
                                             │  - Manage production      │
                                             └───────────────────────────┘
                                                             │
                                                             │
                              ┌──────────────────────────────┼──────────────────────────────┐
                              │                              │                              │
                              ▼ [WebSocket ws://IP:8765]     ▼ [Modbus RTU]                │
                    ┌──────────────────┐            ┌────────────────────┐                 │
                    │   HMI Frontend   │            │  SCM-US48I Gateway │                 │
                    │   (React App)    │            │    (USB-to-RS485)  │                 │
                    │                  │            └────────────────────┘                 │
                    │  - Display data  │                        │                          │
                    │  - User controls │                        │ [RS-485 Bus]             │
                    │  - Production UI │                        ▼                          │
                    └──────────────────┘         ┌──────────────────────────┐              │
                                                 │  ARM-DO08P-4S (Slave 2)  │              │
                                                 │  Coil 0-7  : Relays 1-8  │              │
                                                 └──────────────────────────┘              │
                                                               │                           │
                                     ┌─────────────────────────┴───────────────┐           │
                                     │                                         │           │
                          ┌──────────▼────────────┐              ┌────────────▼──────────┐│
                          │ ARX-DO08P-4S (Exp #1) │              │ ARX-DO08P-4S (Exp #2) ││
                          │ Coil 8-15: Relays 9-16│              │Coil 16-23: Relays 17-24│
                          └───────────────────────┘              └───────────────────────┘│
                                     │                                         │           │
                          ┌──────────▼─────────────────────────────────────────▼──────────▼┐
                          │              PHYSICAL EQUIPMENT CONTROL                        │
                          │  Mixers, Conveyors, Valves, Doors, Vibrators, Horn, etc.      │
                          └────────────────────────────────────────────────────────────────┘

OPTIONAL - PHYSICAL BUTTONS (ESP32):
────────────────────────────────────
24 Buttons ──[GPIO]──► ESP32 ──[WiFi WebSocket]──► Backend ──[Relay Commands]──► Modbus
```

[🔝 Kembali ke Daftar Isi](#-daftar-isi)

---

## 2. PERSIAPAN AWAL

### 2.1 Tools yang Dibutuhkan

#### **A. Software Tools**

✅ **Wajib:**
- [ ] **Node.js v18 LTS** - Download dari https://nodejs.org/
- [ ] **Python 3.9+** - Download dari https://python.org/
- [ ] **Git** - Download dari https://git-scm.com/
- [ ] **Text Editor/IDE** - Visual Studio Code (recommended) atau Notepad++
- [ ] **Serial Terminal** - RealTerm, PuTTY, atau Tera Term
- [ ] **Driver USB-to-Serial** - FTDI, CH340, atau Prolific (sesuai chipset converter Anda)

✅ **Opsional (untuk testing):**
- [ ] **Modbus Poll** - Software testing Modbus (trial version OK)
- [ ] **Device Monitoring Studio** - Monitor komunikasi serial
- [ ] **Wireshark** - Network packet analyzer untuk debugging WebSocket

#### **B. Hardware Tools**

✅ **Wajib:**
- [ ] Obeng Phillips (+) dan Flathead (-)
- [ ] Tang kombinasi
- [ ] Tang crimping (untuk terminal kabel)
- [ ] Multimeter digital (untuk cek kontinuitas, voltage, dll)
- [ ] Kabel tester RJ45/DB9
- [ ] Label marker untuk penandaan kabel
- [ ] Cable ties (pengikat kabel)

✅ **Opsional:**
- [ ] Anti-static wrist strap (untuk instalasi PCI card)
- [ ] Kabel stripper
- [ ] Heat shrink tube & heat gun
- [ ] Continuity tester

### 2.2 Inventory Hardware Checklist

Sebelum memulai instalasi, pastikan semua komponen berikut tersedia:

#### **Checklist PC Industrial / Control Computer**

```
┌─────────────────────────────────────────────────────────────┐
│  PC INDUSTRIAL SPECIFICATION CHECKLIST                      │
├─────────────────────────────────────────────────────────────┤
│  [ ] Processor: Intel Core i5 gen 8+ / AMD Ryzen 5 atau    │
│      lebih tinggi                                           │
│  [ ] RAM: Minimum 8GB DDR4 (16GB recommended)               │
│  [ ] Storage: SSD 256GB+ (untuk fast boot & responsiveness) │
│  [ ] OS: Windows 10/11 Pro 64-bit atau Ubuntu 20.04+        │
│  [ ] Display: 1920x1080 minimum (touchscreen optional)      │
│  [ ] PCI Express slot tersedia: Min 1x PCIe x1 slot         │
│  [ ] USB ports: Min 3 ports (untuk converter & peripherals) │
│  [ ] Network: Ethernet atau WiFi untuk remote access        │
│  [ ] Power: UPS backup recommended (min 1000VA)             │
└─────────────────────────────────────────────────────────────┘
```

#### **Checklist Komponen Serial Communication**

- [ ] **PCI Express Serial Card 4-Port**
  - Brand: Moschip, Sunix, atau compatible
  - Chipset: MosChip 9901/9904 atau compatible
  - Connector: 4x DB9 Male
  - Bracket: Low-profile & Full-height included
  - Driver CD/Download link available

- [ ] **USB-to-RS485 Converter**
  - Chipset: FTDI FT232, CH340, atau CP2102
  - Connector: USB Type-A, Terminal block (A+, B-, GND)
  - LED indicators: TX, RX, Power
  - Isolation: Optional tapi recommended (opto-isolated)

- [ ] **DB9 Female-Female Cables** (Qty: 4)
  - Length: 2 meter
  - Type: Null modem (straight-through)
  - Shielded: Recommended untuk mengurangi noise

#### **Checklist Weight Indicators**

```
┌─────────────────────────────────────────────────────────────┐
│  AUTONICS M1 WEIGHT INDICATOR x 4 UNITS                     │
├─────────────────────────────────────────────────────────────┤
│  [ ] Unit #1 - PASIR (Load Cell Pasir)                      │
│      - Model: Autonics M1 atau equivalent                   │
│      - Output: RS-232                                       │
│      - Baudrate: 9600 bps (akan dikonfigurasi)              │
│                                                             │
│  [ ] Unit #2 - BATU (Load Cell Batu)                        │
│      - Model: Autonics M1 atau equivalent                   │
│      - Output: RS-232                                       │
│      - Baudrate: 9600 bps                                   │
│                                                             │
│  [ ] Unit #3 - SEMEN (Load Cell Semen)                      │
│      - Model: Autonics M1 atau equivalent                   │
│      - Output: RS-232                                       │
│      - Baudrate: 9600 bps                                   │
│                                                             │
│  [ ] Unit #4 - AIR (Load Cell Air)                          │
│      - Model: Autonics M1 atau equivalent                   │
│      - Output: RS-232                                       │
│      - Baudrate: 9600 bps                                   │
│                                                             │
│  ACCESSORIES:                                               │
│  [ ] Load cells terpasang & terkalibrasi                    │
│  [ ] Power supply 220VAC untuk setiap indicator             │
│  [ ] Mounting brackets & hardware                           │
└─────────────────────────────────────────────────────────────┘
```

#### **Checklist Modbus Relay System**

```
┌─────────────────────────────────────────────────────────────┐
│  AUTONICS MODBUS RTU RELAY SYSTEM (24 OUTPUTS)              │
├─────────────────────────────────────────────────────────────┤
│  [ ] SCM-US48I - USB to Modbus RTU Gateway                  │
│      - Model: Autonics SCM-US48I                            │
│      - Interface: USB Type-B, RS-485 (A+, B-)               │
│      - USB cable included                                   │
│                                                             │
│  [ ] ARM-DO08P-4S - Master Digital Output Module            │
│      - Model: Autonics ARM-DO08P-4S                         │
│      - Outputs: 8 channels (Coil 0-7)                       │
│      - Slave ID: 2 (akan dikonfigurasi via DIP switch)      │
│      - Expansion socket: For ARX modules                    │
│      - Supplied expansion cable included                    │
│                                                             │
│  [ ] ARX-DO08P-4S - Expansion Module #1                     │
│      - Model: Autonics ARX-DO08P-4S                         │
│      - Outputs: 8 channels (Coil 8-15)                      │
│      - Daisy-chain ready                                    │
│                                                             │
│  [ ] ARX-DO08P-4S - Expansion Module #2                     │
│      - Model: Autonics ARX-DO08P-4S                         │
│      - Outputs: 8 channels (Coil 16-23)                     │
│      - Daisy-chain ready                                    │
│                                                             │
│  POWER SUPPLY:                                              │
│  [ ] 24VDC Power Supply (min 5A)                            │
│      - Input: 220VAC                                        │
│      - Output: 24VDC, 5A atau lebih                         │
│      - Mounting: DIN rail atau wall mount                   │
│                                                             │
│  WIRING ACCESSORIES:                                        │
│  [ ] Terminal blocks (untuk 24VDC distribution)             │
│  [ ] RS-485 termination resistors 120Ω (Qty: 2)             │
│  [ ] Ferrule terminals (untuk kabel ke terminal block)      │
│  [ ] AWG 18-22 wire untuk RS-485 bus (twisted pair)         │
│  [ ] AWG 16-18 wire untuk 24VDC power                       │
└─────────────────────────────────────────────────────────────┘
```

#### **Checklist ESP32 System (Opsional - Sistem 2)**

```
┌─────────────────────────────────────────────────────────────┐
│  ESP32 PHYSICAL BUTTON MONITOR (OPTIONAL)                   │
├─────────────────────────────────────────────────────────────┤
│  [ ] ESP32 DevKit Board                                     │
│      - Model: ESP32-WROOM-32 (38-pin recommended)           │
│      - WiFi: 2.4GHz (bukan 5GHz)                            │
│      - GPIO: Min 24 pins available                          │
│      - USB: Micro USB atau USB-C                            │
│                                                             │
│  [ ] 24x Physical Buttons                                   │
│      - Type: Momentary push button, NO (Normally Open)      │
│      - Voltage rating: 24VDC (untuk sistem industri)        │
│      - Contact material: Gold atau Silver                   │
│                                                             │
│  [ ] Power Supply 5V 2A                                     │
│      - Input: 220VAC                                        │
│      - Output: 5V DC, 2A min                                │
│      - Connector: Micro USB / USB-C sesuai ESP32            │
│                                                             │
│  [ ] Kabel Jumper                                           │
│      - Type: Male-Female, 20-30cm                           │
│      - Quantity: 30+ pcs                                    │
│                                                             │
│  [ ] Breadboard atau PCB                                    │
│      - Untuk mounting ESP32 & wiring buttons                │
│                                                             │
│  [ ] Enclosure Box                                          │
│      - IP54 atau lebih tinggi (dust & water protection)     │
│      - Size: Sesuai ESP32 + wiring space                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Safety & Precautions

⚠️ **PERHATIAN KESELAMATAN:**

```
╔═══════════════════════════════════════════════════════════╗
║  ⚡ ELECTRICAL SAFETY - KESELAMATAN LISTRIK               ║
╠═══════════════════════════════════════════════════════════╣
║  1. SELALU matikan power sebelum instalasi atau          ║
║     maintenance hardware                                 ║
║                                                           ║
║  2. GUNAKAN grounding yang benar untuk semua peralatan   ║
║     listrik 220VAC                                       ║
║                                                           ║
║  3. PASTIKAN kabel power tidak terjepit atau tertekuk    ║
║     berlebihan                                           ║
║                                                           ║
║  4. CEK polaritas (+/-) saat menyambung power supply     ║
║     24VDC ke relay modules                               ║
║                                                           ║
║  5. GUNAKAN UPS untuk PC controller agar tidak mati      ║
║     mendadak saat production                             ║
║                                                           ║
║  6. JANGAN sentuh terminal yang bertegangan tinggi       ║
║     (220VAC) saat power ON                               ║
╚═══════════════════════════════════════════════════════════╝
```

```
╔═══════════════════════════════════════════════════════════╗
║  🔧 HARDWARE INSTALLATION TIPS                            ║
╠═══════════════════════════════════════════════════════════╣
║  1. Gunakan anti-static wrist strap saat instalasi       ║
║     PCI Express card                                     ║
║                                                           ║
║  2. Jangan force-fit komponen. Jika tidak pas, cek       ║
║     orientasi atau slot yang tepat                       ║
║                                                           ║
║  3. Kencangkan semua screw & bracket dengan pas (tidak   ║
║     terlalu kencang atau terlalu longgar)                ║
║                                                           ║
║  4. Label semua kabel dengan jelas (gunakan label maker  ║
║     atau masking tape + marker)                          ║
║                                                           ║
║  5. Rapikan kabel dengan cable ties untuk menghindari    ║
║     kabel kusut yang menyulitkan troubleshooting         ║
║                                                           ║
║  6. Dokumentasikan dengan foto setiap step untuk         ║
║     referensi maintenance di kemudian hari               ║
╚═══════════════════════════════════════════════════════════╝
```

[🔝 Kembali ke Daftar Isi](#-daftar-isi)

---

## 3. INSTALASI HARDWARE - PC INDUSTRIAL

### 3.1 Instalasi PCI Express Serial Card (4 Port)

#### **Step 1: Persiapan Keamanan Listrik**

1. **Matikan PC sepenuhnya** (Shutdown, bukan Sleep/Hibernate)
2. **Cabut kabel power** dari stop kontak
3. **Tekan tombol power** selama 5 detik (untuk discharge kapasitor internal)
4. **Pasang anti-static wrist strap** ke pergelangan tangan Anda, ujung satunya ke metal chassis PC

> 💡 **TIP:** Jika tidak ada anti-static wrist strap, sentuh metal chassis PC sesekali untuk menghilangkan static electricity.

#### **Step 2: Membuka Casing PC**

```
 Tampak Samping PC Desktop:
 ┌─────────────────────────────┐
 │                             │
 │    ┌──────────────────┐     │
 │    │   Motherboard    │     │◄─ Buka panel samping kiri
 │    │                  │     │   (dari depan PC)
 │    │  [ PCI-E Slots ] │     │
 │    │  [ ][ ][ ][ ]    │     │
 │    └──────────────────┘     │
 │                             │
 └─────────────────────────────┘
      ▲
      └── Screw panel (2-4 buah)
```

1. **Lepas screw** pada panel samping (biasanya 2-4 buah di bagian belakang)
2. **Geser panel** ke arah belakang lalu angkat
3. **Letakkan panel** di tempat yang aman

#### **Step 3: Identifikasi Slot PCI Express**

```
 Motherboard (tampak atas):
 ┌──────────────────────────────────────────┐
 │  CPU                                     │
 │  ┌───┐                                   │
 │  │   │     RAM Slots                     │
 │  └───┘     [===][===][===][===]          │
 │                                          │
 │  PCI Express Slots:                      │
 │  ┌────────────────────────┐  PCIe x16   │◄─ Untuk VGA card
 │  └────────────────────────┘              │   (jangan pakai ini)
 │  ┌──────────┐  PCIe x1 ────────────────►│◄─ PAKAI SLOT INI
 │  └──────────┘                            │   untuk Serial Card
 │  ┌──────────┐  PCIe x1                  │
 │  └──────────┘                            │
 └──────────────────────────────────────────┘
```

Cari slot **PCI Express x1** yang kosong (biasanya slot hitam, lebih pendek dari PCIe x16).

#### **Step 4: Pemasangan Serial Card**

```
 Serial Card (4-Port):
 
 ┌───────────────────────────┐
 │ ┌─┐ ┌─┐ ┌─┐ ┌─┐           │◄─ 4x DB9 Male Connectors
 │ └─┘ └─┘ └─┘ └─┘           │   (untuk kabel ke Load Cells)
 │                           │
 │   [ Chip ]  [ Chip ]      │
 │                           │
 └───┬───────────────────────┘
     └── PCIe x1 Connector (golden fingers)
```

1. **Lepas bracket slot** yang akan digunakan (screw di bagian belakang PC case)
   
2. **Pegang serial card** di bagian tepi (jangan sentuh chip atau golden fingers)

3. **Align card** dengan slot PCIe x1:
   - Golden fingers harus sejajar dengan slot
   - Bracket card harus sejajar dengan lubang screw di case

4. **Tekan card** dengan lembut tapi firm sampai masuk sepenuhnya ke slot
   - Anda akan dengar/rasa "klik" saat card masuk dengan benar
   - Card harus masuk rata, tidak miring

5. **Kencangkan bracket screw** di bagian belakang case untuk mengamankan card

#### **Step 5: Penutupan Casing**

1. **Cek sekali lagi** semua koneksi card sudah benar
2. **Pasang kembali panel samping** PC
3. **Kencangkan screw panel**
4. **Pasang kembali kabel power**

#### **Step 6: Instalasi Driver (Windows)**

1. **Nyalakan PC**

2. **Windows akan auto-detect** hardware baru dan mencoba instalasi driver otomatis

3. **Jika auto-install gagal**, install driver manual:
   - Masukkan CD driver (jika ada) atau download dari website manufacturer
   - Jalankan `setup.exe`
   - Ikuti wizard instalasi
   - **Restart PC** setelah instalasi selesai

4. **Verifikasi di Device Manager:**
   ```
   Windows Key + X → Device Manager → Ports (COM & LPT)
   
   Expected output:
   
   ▼ Ports (COM & LPT)
     ├─ Communications Port (COM1)
     ├─ Communications Port (COM2)
     ├─ Communications Port (COM3)
     ├─ Communications Port (COM4)  ◄─ 4 COM ports baru muncul
     ├─ MCS9901 Multi-I/O Controller (COM5)
     ├─ MCS9901 Multi-I/O Controller (COM6)
     ├─ MCS9901 Multi-I/O Controller (COM7)
     └─ MCS9901 Multi-I/O Controller (COM8)
   ```

5. **Catat nomor COM port** untuk setiap port (misal: COM5, COM6, COM7, COM8)
   - Anda akan butuh ini untuk konfigurasi `config_autonics.json` nanti

#### **Step 7: Instalasi Driver (Linux)**

Untuk Ubuntu/Debian:

```bash
# 1. Cek apakah card terdeteksi
lsmod | grep serial

# Expected output:
# 8250_pci                16384  0
# serial_core             28672  1 8250

# 2. Install serial tools
sudo apt-get update
sudo apt-get install setserial -y

# 3. Cek device serial yang tersedia
ls -l /dev/ttyS*

# Expected output:
# /dev/ttyS0  ◄─ Built-in port
# /dev/ttyS1  ◄─ Built-in port
# /dev/ttyS4  ◄─ PCI Serial Card port 1
# /dev/ttyS5  ◄─ PCI Serial Card port 2
# /dev/ttyS6  ◄─ PCI Serial Card port 3
# /dev/ttyS7  ◄─ PCI Serial Card port 4

# 4. Set permissions (agar bisa akses tanpa sudo)
sudo usermod -a -G dialout $USER
sudo chmod 666 /dev/ttyS*

# 5. Logout dan login lagi agar permission berlaku
```

6. **Catat device name** untuk setiap port (misal: `/dev/ttyS4`, `/dev/ttyS5`, dst.)

#### **Step 8: Testing Serial Port**

**Windows (menggunakan RealTerm):**

1. Download & install RealTerm dari https://realterm.sourceforge.io/
2. Buka RealTerm
3. Tab "Port":
   - Baud: 9600
   - Port: COM5 (ganti dengan port Anda)
   - Parity: None
   - Data Bits: 8
   - Stop Bits: 1
   - Hardware Flow Control: None
4. Klik "Change" untuk open port
5. Jika tidak ada error, port siap digunakan ✅

**Linux (menggunakan minicom):**

```bash
# Install minicom
sudo apt-get install minicom -y

# Test port (misal /dev/ttyS4)
minicom -D /dev/ttyS4 -b 9600

# Jika berhasil, Anda akan lihat console minicom
# Press Ctrl+A lalu Q untuk quit
```

✅ **Instalasi PCI Express Serial Card selesai!**

---

### 3.2 Instalasi USB-to-RS485 Converter

USB-to-RS485 converter digunakan untuk komunikasi Modbus RTU dengan relay system.

#### **Step 1: Koneksi USB ke PC**

```
 USB-to-RS485 Converter:
 
 ┌─────────────────┐
 │  USB-to-RS485   │
 │  Converter      │◄─ LED: PWR, TX, RX
 ├─────────────────┤
 │ [USB]           │◄─ Plug ke USB port PC
 └─────────────────┘
 │ A+ │ B- │ GND  │◄─ RS-485 Terminal (belum disambung dulu)
 └─────────────────┘
```

1. **Colok converter** ke USB port PC
2. **LED Power** akan menyala (biasanya merah)

#### **Step 2: Instalasi Driver**

**Windows:**

Biasanya Windows 10/11 akan auto-install driver untuk chipset umum (FTDI, CH340, CP2102).

Jika tidak terdeteksi:

1. **Cek chipset converter** Anda (lihat di sticker converter atau dokumentasi)

2. **Download driver:**
   - **FTDI FT232:** https://ftdichip.com/drivers/vcp-drivers/
   - **CH340:** http://www.wch.cn/downloads/CH341SER_EXE.html
   - **CP2102:** https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

3. **Install driver** sesuai chipset Anda

4. **Restart PC** (jika diminta)

5. **Verifikasi di Device Manager:**
   ```
   Device Manager → Ports (COM & LPT)
   
   ▼ Ports (COM & LPT)
     ├─ ... (ports lain)
     └─ USB-SERIAL CH340 (COM9)  ◄─ Converter terdeteksi di COM9
   ```

6. **Catat nomor COM port** (misal: COM9) untuk konfigurasi Modbus nanti

**Linux:**

```bash
# 1. Colok converter ke USB

# 2. Cek apakah terdeteksi
dmesg | tail -20

# Expected output (contoh untuk CH340):
# [ 1234.567890] usb 1-1.2: new full-speed USB device number 5 using xhci_hcd
# [ 1234.678901] usb 1-1.2: New USB device found, idVendor=1a86, idProduct=7523
# [ 1234.789012] ch341 1-1.2:1.0: ch341-uart converter detected
# [ 1234.890123] usb 1-1.2: ch341-uart converter now attached to ttyUSB0

# 3. Converter akan muncul sebagai /dev/ttyUSB0 (atau ttyUSB1, dst.)
ls -l /dev/ttyUSB*

# 4. Set permission
sudo chmod 666 /dev/ttyUSB0

# Atau tambahkan user ke group dialout (permanent):
sudo usermod -a -G dialout $USER
# Logout & login lagi
```

Catat device name: `/dev/ttyUSB0`

#### **Step 3: Testing Koneksi (Optional)**

**Test Loopback (A+ ke B-):**

1. **Hubungkan terminal A+** dan **B-** converter dengan jumper wire (short circuit)
   ```
   A+ ──┬──► Jumper wire
        │
   B- ──┘
   ```

2. **Buka serial terminal** (RealTerm / minicom)
   - Port: COM9 (atau /dev/ttyUSB0)
   - Baud: 9600
   - Data: 8N1

3. **Ketik sesuatu** di terminal
4. Jika loopback bekerja, karakter yang Anda ketik akan **muncul kembali** (echo)

5. **Lepas jumper** setelah testing

✅ **USB-to-RS485 Converter siap!** (Jangan sambungkan ke Modbus dulu, tunggu instruksi di section 3.4)

---

### 3.3 Koneksi Weight Indicators (Load Cells)

Load cells terhubung ke Autonics M1 Weight Indicators, lalu dikirim ke PC via RS-232.

#### **Step 1: Konfigurasi Autonics M1 Indicators**

Setiap Autonics M1 perlu dikonfigurasi untuk output RS-232 dengan setting yang sama.

**Menu Setting (detail bisa berbeda sedikit per versi M1):**

```
╔══════════════════════════════════════════════════════════╗
║       AUTONICS M1 CONFIGURATION MENU                     ║
╠══════════════════════════════════════════════════════════╣
║  1. Tekan tombol MENU/ENTER di panel M1                  ║
║  2. Navigasi dengan tombol UP/DOWN                       ║
║  3. Masuk ke submenu dengan ENTER                        ║
║  4. Ubah value dengan UP/DOWN, konfirmasi dengan ENTER   ║
╚══════════════════════════════════════════════════════════╝

SERIAL OUTPUT SETTINGS:
┌──────────────────────────────────────────────────────────┐
│  Parameter         │  Value      │  Keterangan          │
├────────────────────┼─────────────┼──────────────────────┤
│  Communication     │  RS-232     │  Pilih RS-232, bukan │
│  Interface         │             │  RS-485 atau lainnya │
│                    │             │                      │
│  Baud Rate         │  9600       │  Harus sama untuk    │
│                    │             │  semua 4 indicators  │
│                    │             │                      │
│  Data Bits         │  8          │  Standard            │
│                    │             │                      │
│  Parity            │  None       │  No parity check     │
│                    │             │                      │
│  Stop Bits         │  1          │  1 stop bit          │
│                    │             │                      │
│  Output Mode       │  Continuous │  Kirim data terus    │
│                    │  ASCII      │  menerus dalam ASCII │
│                    │             │                      │
│  Output Format     │  +00000.00  │  Format angka dengan │
│                    │             │  tanda + atau -      │
│                    │             │  2 digit desimal     │
│                    │             │                      │
│  Update Rate       │  10 Hz      │  10 kali per detik   │
│                    │  (100ms)    │  (bisa diubah jika   │
│                    │             │  perlu, 5-20 Hz OK)  │
└────────────────────┴─────────────┴──────────────────────┘
```

> 💡 **PENTING:** Lakukan konfigurasi yang SAMA PERSIS untuk keempat indicators (Pasir, Batu, Semen, Air).

#### **Step 2: Wiring Diagram RS-232**

**Pinout DB9 Female (pada Autonics M1):**

```
 DB9 Female Connector (looking at connector face):
 
 ┌─────────────┐
 │ 5  4  3  2  1│
 │  9  8  7  6  │
 └─────────────┘
 
 Pin Assignment:
 Pin 2: TX (Transmit data dari M1)
 Pin 3: RX (Receive data ke M1) - tidak dipakai untuk output saja
 Pin 5: GND (Ground)
 Pin 1,4,6,7,8,9: Tidak dipakai untuk RS-232 sederhana
```

**Kabel DB9 Female-Female (Null Modem):**

Gunakan kabel **straight-through** (bukan crossed):

```
 Load Cell Indicator          Kabel DB9           PC Serial Port
 (DB9 Female)            (Female-Female)         (DB9 Male dari
                                                  PCI Serial Card)
 ┌───────────┐             ┌──────┐              ┌───────────┐
 │  M1 TX ├─2─────────2──┤      ├──2─────────2──┤ PC RX     │
 │         │             │      │              │           │
 │  M1 GND├─5─────────5──┤      ├──5─────────5──┤ PC GND    │
 └───────────┘             └──────┘              └───────────┘
 
 (Pin 3 RX tidak perlu disambung karena M1 hanya TX data ke PC)
```

#### **Step 3: Koneksi Physical**

```
  LOAD CELL WIRING DIAGRAM:
  
  ┌─────────────┐   DB9      ┌──────────────┐   DB9      ┌────────────┐
  │ Load Cell   │  F-F       │  Autonics M1 │  F-F       │ PC Serial  │
  │ PASIR       ├──Cable────►│  Indicator   ├──Cable────►│ Card       │
  │             │            │  #1 PASIR    │            │ Port 1     │
  └─────────────┘            └──────────────┘            │ (COM5)     │
                                                         └────────────┘
  
  ┌─────────────┐            ┌──────────────┐            ┌────────────┐
  │ Load Cell   │            │  Autonics M1 │            │ PC Serial  │
  │ BATU        ├──Cable────►│  Indicator   ├──Cable────►│ Card       │
  │             │            │  #2 BATU     │            │ Port 2     │
  └─────────────┘            └──────────────┘            │ (COM6)     │
                                                         └────────────┘
  
  ┌─────────────┐            ┌──────────────┐            ┌────────────┐
  │ Load Cell   │            │  Autonics M1 │            │ PC Serial  │
  │ SEMEN       ├──Cable────►│  Indicator   ├──Cable────►│ Card       │
  │             │            │  #3 SEMEN    │            │ Port 3     │
  └─────────────┘            └──────────────┘            │ (COM7)     │
                                                         └────────────┘
  
  ┌─────────────┐            ┌──────────────┐            ┌────────────┐
  │ Load Cell   │            │  Autonics M1 │            │ PC Serial  │
  │ AIR         ├──Cable────►│  Indicator   ├──Cable────►│ Card       │
  │             │            │  #4 AIR      │            │ Port 4     │
  └─────────────┘            └──────────────┘            │ (COM8)     │
                                                         └────────────┘
```

**Langkah Pemasangan:**

1. **Pastikan semua power OFF** (PC dan M1 indicators)

2. **Sambungkan Load Cell** ke M1 Indicator (ini biasanya sudah terpasang di lapangan)

3. **Sambungkan DB9 cable** dari **M1 Indicator** ke **PC Serial Port**:
   - M1 Indicator #1 (PASIR) → PC Serial Port 1 (misal COM5)
   - M1 Indicator #2 (BATU) → PC Serial Port 2 (misal COM6)
   - M1 Indicator #3 (SEMEN) → PC Serial Port 3 (misal COM7)
   - M1 Indicator #4 (AIR) → PC Serial Port 4 (misal COM8)

4. **Label setiap kabel** dengan jelas (gunakan label maker atau masking tape):
   ```
   "PASIR - COM5"
   "BATU - COM6"
   "SEMEN - COM7"
   "AIR - COM8"
   ```

5. **Rapikan kabel** dengan cable ties

#### **Step 4: Testing Koneksi dengan Serial Monitor**

**Windows (menggunakan RealTerm):**

1. **Nyalakan M1 Indicator #1 (PASIR)**

2. **Buka RealTerm**

3. **Tab "Port":**
   - Baud: 9600
   - Port: COM5 (sesuai port PASIR Anda)
   - Parity: None
   - Data Bits: 8
   - Stop Bits: 1
   - Hardware Flow Control: None

4. **Klik "Change"** untuk buka port

5. **Tab "Display":**
   - Display As: Ansi (untuk ASCII readable)

6. **Amati output:**
   ```
   Expected output (terus menerus setiap 100ms):
   
   +00123.45
   +00123.46
   +00123.45
   +00123.47
   ...
   
   (angka akan berubah sesuai berat yang terdeteksi load cell)
   ```

7. **Tekan berat di load cell** → angka harus berubah

8. **Ulangi testing** untuk COM6 (BATU), COM7 (SEMEN), COM8 (AIR)

**Linux (menggunakan minicom atau cat):**

```bash
# Test dengan cat (simple, hanya baca output)
cat /dev/ttyS4  # (sesuai port PASIR Anda)

# Expected output (terus menerus):
# +00123.45
# +00123.46
# +00123.45
# ...

# Press Ctrl+C untuk stop

# Atau gunakan minicom untuk monitoring lebih interaktif:
minicom -D /dev/ttyS4 -b 9600

# Press Ctrl+A lalu Q untuk quit
```

> ⚠️ **TROUBLESHOOTING:**
> - Jika tidak ada output, cek:
>   1. Power M1 sudah ON?
>   2. Kabel DB9 terpasang dengan benar?
>   3. Setting M1 (baudrate, output mode) sudah benar?
>   4. COM port number sudah sesuai?
> - Jika output berisi karakter acak (garbage):
>   1. Baudrate salah → pastikan 9600 di M1 dan serial terminal
>   2. Data bits / parity salah → harus 8N1
> - Jika angka tidak berubah saat ditekan berat:
>   1. Load cell belum terkalibrasi dengan benar
>   2. Koneksi load cell ke M1 bermasalah

✅ **Koneksi Weight Indicators selesai!**

#### **Step 5: Mapping COM Port untuk Konfigurasi**

**Catat mapping COM port Anda:**

| Material | Autonics M1 | PC Serial Port | COM Port (Windows) | Device (Linux) |
|----------|-------------|----------------|-------------------|----------------|
| PASIR    | Indicator #1| PCI Port 1     | COM5              | /dev/ttyS4     |
| BATU     | Indicator #2| PCI Port 2     | COM6              | /dev/ttyS5     |
| SEMEN    | Indicator #3| PCI Port 3     | COM7              | /dev/ttyS6     |
| AIR      | Indicator #4| PCI Port 4     | COM8              | /dev/ttyS7     |

> 💡 **Simpan mapping ini!** Anda akan butuh untuk konfigurasi `config_autonics.json` di [Section 6.2](#62-setup-untuk-sistem-autonics-pc-windowslinux)

---

### 3.4 Koneksi Modbus Relay System

Sistem relay menggunakan Autonics Modbus RTU dengan arsitektur:
- **SCM-US48I:** USB-to-RS485 Gateway
- **ARM-DO08P-4S:** Master Digital Output Module (Coil 0-7, Slave ID 2)
- **ARX-DO08P-4S #1:** Expansion Module (Coil 8-15)
- **ARX-DO08P-4S #2:** Expansion Module (Coil 16-23)

Total: **24 Digital Outputs** untuk kontrol relay.

#### **Step 1: Wiring RS-485 Bus (USB Converter ke SCM-US48I)**

**Diagram Koneksi:**

```
 ┌───────────────────┐          RS-485 Bus           ┌──────────────────┐
 │ USB-to-RS485      │         (Twisted Pair)        │   SCM-US48I      │
 │ Converter         │                               │   Gateway        │
 ├───────────────────┤                               ├──────────────────┤
 │ A+  ├─────────────┼───────────────────────────────┤ A+               │
 │     │             │       (Wire 1 - Hijau)        │                  │
 │ B-  ├─────────────┼───────────────────────────────┤ B-               │
 │     │             │       (Wire 2 - Putih-Hijau)  │                  │
 │ GND ├─────────────┼───────────────────────────────┤ GND              │
 │     │             │       (Wire 3 - Coklat)       │                  │
 └─────┴─────────────┘                               └──────────────────┘
        ▲                                                     ▲
        │                                                     │
    [USB Port PC]                                     [RS-485 Terminals]
```

**Wiring Detail:**

1. **Gunakan twisted pair cable** (AWG 18-22) untuk RS-485 bus:
   - **Hijau** → A+ (Data+)
   - **Putih-Hijau** → B- (Data-)
   - **Coklat** → GND (Ground)

2. **Sambungkan ke terminal block:**
   - **USB Converter:**
     - A+ → Terminal A+
     - B- → Terminal B-
     - GND → Terminal GND
   
   - **SCM-US48I:**
     - A+ → Terminal A+
     - B- → Terminal B-
     - GND → Terminal GND (atau SG/Shield Ground)

3. **Kencangkan terminal screw** dengan pas (jangan terlalu kencang sampai putus kabel)

4. **Pasang termination resistor 120Ω** di ujung USB Converter:
   - Hubungkan resistor 120Ω antara A+ dan B-
   - Biasanya ada jumper switch di converter, set ke "ON" atau "120Ω"

#### **Step 2: Koneksi SCM-US48I ke ARM-DO08P-4S**

SCM-US48I dan ARM modul biasanya sudah datang dengan **expansion cable** (kabel flat 10-pin atau 14-pin).

```
 ┌──────────────────┐      Expansion Cable       ┌──────────────────┐
 │   SCM-US48I      │      (Supplied)            │  ARM-DO08P-4S    │
 │   Gateway        │                            │  Master Module   │
 ├──────────────────┤                            ├──────────────────┤
 │                  │                            │                  │
 │  [Expansion]├────┼────────────────────────────┤[Expansion In]    │
 │  Socket          │       (10-14 pin)          │                  │
 └──────────────────┘                            └──────────────────┘
```

**Langkah:**

1. **Cari expansion socket** di SCM-US48I (biasanya di samping atau bawah)
2. **Align cable** dengan socket (ada notch/guide untuk orientasi yang benar)
3. **Tekan cable** ke socket sampai masuk sempurna (klik)
4. **Sambungkan ujung lain** ke ARM module di **Expansion In** socket
5. **Pastikan cable tidak tertekuk atau terjepit**

#### **Step 3: Koneksi ARX Expansion Modules (Daisy-Chain)**

ARM module punya **Expansion Out** socket untuk sambung ke ARX modules.

```
 Daisy-Chain Topology:
 
 ┌────────────────┐       Cable 1        ┌────────────────┐
 │  ARM-DO08P-4S  │                      │ ARX-DO08P-4S   │
 │  (Master)      │                      │ (Expansion #1) │
 │  Slave ID: 2   │                      │ Coil 8-15      │
 │  Coil 0-7      ├──[Expansion Out]────►├[Expansion In]  │
 └────────────────┘                      └────────────────┘
                                                  │
                                         [Expansion Out]
                                                  │
                                         Cable 2  │
                                                  ▼
                                         ┌────────────────┐
                                         │ ARX-DO08P-4S   │
                                         │ (Expansion #2) │
                                         │ Coil 16-23     │
                                         └[Expansion In]  │
                                         └────────────────┘
```

**Langkah:**

1. **Gunakan expansion cable** kedua (biasanya supplied dengan ARX modules)

2. **Sambungkan:**
   - **ARM Expansion Out** → **ARX #1 Expansion In** (Cable 1)
   - **ARX #1 Expansion Out** → **ARX #2 Expansion In** (Cable 2)

3. **Pastikan semua cable masuk sempurna** ke socket

#### **Step 4: Setting DIP Switch untuk Slave ID**

**ARM-DO08P-4S** perlu diset **Slave ID = 2** via DIP switch.

```
 DIP Switch Location (biasanya di bagian samping atau atas module):
 
 ┌──────────────────────────────────────────┐
 │  ARM-DO08P-4S Digital Output Module      │
 ├──────────────────────────────────────────┤
 │  ┌────────┐  ┌────────┐  ┌────────┐      │
 │  │ OUT 1  │  │ OUT 2  │  │ OUT 3  │ ...  │
 │  └────────┘  └────────┘  └────────┘      │
 │                                          │
 │  DIP SWITCH (8-bit untuk Slave ID):      │
 │  ┌─┬─┬─┬─┬─┬─┬─┬─┐                       │
 │  │1│2│3│4│5│6│7│8│  ◄─ Switch posisi    │
 │  └─┴─┴─┴─┴─┴─┴─┴─┘      (ON/OFF slider) │
 └──────────────────────────────────────────┘
 
 DIP Switch Setting untuk Slave ID = 2:
 
 Slave ID 2 dalam binary: 0000 0010
 
 Switch Position (dari kiri ke kanan, switch 1-8):
 ┌───┬───┬───┬───┬───┬───┬───┬───┐
 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │
 ├───┼───┼───┼───┼───┼───┼───┼───┤
 │OFF│ ON│OFF│OFF│OFF│OFF│OFF│OFF│  ◄─ Hanya switch #2 di-ON
 └───┴───┴───┴───┴───┴───┴───┴───┘
     ▲
     └─ Switch #2 ON = Bit 1 (value 2 dalam decimal)
```

**Cara Setting:**

1. **Matikan power** ARM module (jangan set DIP switch saat power ON!)
2. **Gunakan pen/obeng kecil** untuk geser switch
3. **Set hanya switch #2 ke ON**, sisanya OFF
4. **Cek visual** sekali lagi sebelum power ON

> 💡 **Slave ID Reference Table:**
> 
> | Slave ID | Switch 1 | Switch 2 | Switch 3 | Switch 4 | Switch 5-8 |
> |----------|----------|----------|----------|----------|------------|
> | 1        | ON       | OFF      | OFF      | OFF      | OFF        |
> | **2**    | **OFF**  | **ON**   | **OFF**  | **OFF**  | **OFF**    |
> | 3        | ON       | ON       | OFF      | OFF      | OFF        |
> | 4        | OFF      | OFF      | ON       | OFF      | OFF        |
> | ...      | ...      | ...      | ...      | ...      | ...        |

ARX modules **tidak perlu setting Slave ID** karena mereka auto-detected sebagai expansion dari ARM.

#### **Step 5: Power Supply Wiring (24VDC)**

Semua Modbus modules (ARM + ARX) butuh **24VDC power**.

```
 Power Supply Wiring Diagram:
 
 ┌─────────────────┐
 │ 24VDC Power     │
 │ Supply (5A)     │
 ├─────────────────┤
 │ AC IN (220VAC)  │◄─ Dari stop kontak
 ├─────────────────┤
 │ + 24V  │  - GND │◄─ DC Output
 └───┬────┴────┬───┘
     │         │
     │         └────────────────┬────────────────┬─────────────────┐
     │                          │                │                 │
     └─┬────────────────────────┼────────────────┼─────────────────┤
       │                        │                │                 │
   ┌───▼────┐             ┌─────▼────┐    ┌─────▼────┐     ┌─────▼────┐
   │  ARM   │             │  ARX #1  │    │  ARX #2  │     │ Terminal │
   │ +24V   │             │  +24V    │    │  +24V    │     │  Block   │
   │  GND   │             │   GND    │    │   GND    │     │  (Common)│
   └────────┘             └──────────┘    └──────────┘     └──────────┘
                                                                  │
                                                    ┌─────────────┴──────┐
                                                    │ Common 24V & GND   │
                                                    │ untuk Field Devices│
                                                    │ (Relays, Valves)   │
                                                    └────────────────────┘
```

**Wiring Steps:**

1. **⚠️ MATIKAN power supply** sebelum wiring!

2. **Wire Power Supply ke ARM Module:**
   - Power Supply **+24V** → ARM Terminal **+24V** (atau V+)
   - Power Supply **GND** → ARM Terminal **GND** (atau V-)

3. **Wire ARX Modules (parallel dari power supply):**
   - Power Supply **+24V** → ARX #1 Terminal **+24V**
   - Power Supply **GND** → ARX #1 Terminal **GND**
   - Power Supply **+24V** → ARX #2 Terminal **+24V**
   - Power Supply **GND** → ARX #2 Terminal **GND**

   > 💡 **TIP:** Gunakan **terminal block** untuk distribute 24VDC ke multiple modules agar wiring lebih rapi.

4. **Cek polaritas** sekali lagi (+24V dan GND jangan tertukar!)

5. **Kencangkan semua terminal screw**

6. **Grounding:**
   - Sambungkan **GND terminal** power supply ke **earth ground** (kabel hijau-kuning ke ground rod atau chassis ground)
   - Ini penting untuk safety & mengurangi electrical noise

#### **Step 6: RS-485 Termination Resistor**

RS-485 bus memerlukan **termination resistor 120Ω** di **kedua ujung** bus.

```
 Termination Resistor Placement:
 
 Ujung 1:                   Ujung 2:
 USB-to-RS485               ARM Module (atau ARX terakhir)
 
 ┌─────────────┐            ┌─────────────┐
 │ A+  ┌───┐   │            │   ┌───┐  A+ │
 │     │120│   │  RS-485    │   │120│     │
 │     │ Ω │   ├────────────┤   │ Ω │     │
 │ B-  └───┘   │   Bus      │   └───┘  B- │
 └─────────────┘            └─────────────┘
      ▲                             ▲
      └─ Resistor 120Ω              └─ Resistor 120Ω
         (biasanya jumper ON)          (cek jumper di module)
```

**Cara Setting:**

1. **USB Converter:**
   - Cari **jumper switch** atau **DIP switch** untuk termination
   - Set ke **ON** atau **120Ω** position

2. **ARM/ARX Module:**
   - Cari **termination jumper** di module (biasanya labeled "TERM" atau "120Ω")
   - Set jumper ke **ON** position (jika ada)
   - Jika tidak ada jumper, solder resistor 120Ω 1/4W antara A+ dan B- terminal di module terakhir (ARX #2)

> ⚠️ **PENTING:** Tanpa termination resistor, komunikasi Modbus bisa tidak stabil atau error!

#### **Step 7: Final Wiring Check**

Sebelum power ON, **cek sekali lagi:**

| Check Item | Status |
|------------|--------|
| [ ] RS-485 A+ ke A+, B- ke B- (tidak tertukar) | ☐ |
| [ ] Termination resistor 120Ω di kedua ujung bus | ☐ |
| [ ] Power 24VDC +/- polaritas benar (tidak tertukar) | ☐ |
| [ ] Expansion cables ARM ↔ ARX semua terpasang | ☐ |
| [ ] DIP switch Slave ID = 2 di ARM module | ☐ |
| [ ] Semua terminal screw dikencangkan | ☐ |
| [ ] Grounding earth terhubung dengan baik | ☐ |
| [ ] Kabel rapi dan tidak terjepit | ☐ |

#### **Step 8: Power ON & LED Indicators**

1. **Power ON 24VDC supply** untuk ARM/ARX modules

2. **Cek LED indicators:**
   ```
   ARM-DO08P-4S:
   ┌────────────────┐
   │  PWR  ► 🟢 ON  │  ◄─ Power indicator (harus hijau/merah menyala)
   │  RUN  ► 🟢 ON  │  ◄─ Module running (hijau menyala)
   │  ERR  ► ⚫ OFF │  ◄─ Error indicator (harus MATI)
   │  COMM ► 🟡 ⚠️  │  ◄─ Modbus communication (kedip saat ada data)
   └────────────────┘
   ```

3. **Jika ERR LED menyala merah:**
   - Cek power supply voltage (harus 24VDC ±10%)
   - Cek wiring expansion cable
   - Cek Slave ID DIP switch

4. **Colok USB converter** ke PC
   - LED PWR di converter harus menyala

✅ **Hardware Modbus Relay System terpasang!**

Testing komunikasi Modbus akan dilakukan di [Section 6.2](#62-setup-untuk-sistem-autonics-pc-windowslinux) setelah instalasi software backend.

[🔝 Kembali ke Daftar Isi](#-daftar-isi)

---

## 4. INSTALASI HARDWARE - ESP32 (OPSIONAL)

> **💡 Catatan:** Section ini **OPSIONAL** dan hanya untuk **Sistem 2** yang menggunakan physical buttons berbasis ESP32 untuk kontrol manual. Jika Anda hanya menggunakan kontrol via HMI touchscreen/mouse, skip section ini.

### 4.1 Persiapan ESP32 DevKit

#### **ESP32 DevKit Pinout Reference**

```
 ESP32 DevKit 38-Pin (WROOM-32):
 
         ┌───────────────────────────────────────┐
         │                                       │
         │  ┌─────────────────────────────────┐  │
         │  │        ESP32-WROOM-32           │  │
         │  └─────────────────────────────────┘  │
         │                                       │
  3V3 ──┤ 1                                  38 ├── GND
  EN  ──┤ 2                                  37 ├── GPIO23
  VP  ──┤ 3  (SVP, ADC1_CH0)                 36 ├── GPIO22 (SCL)
  VN  ──┤ 4  (SVN, ADC1_CH3)                 35 ├── GPIO1  (TX0)
 GPIO34─┤ 5  (ADC1_CH6, Input Only)          34 ├── GPIO3  (RX0)
 GPIO35─┤ 6  (ADC1_CH7, Input Only)          33 ├── GPIO21 (SDA)
 GPIO32─┤ 7  (ADC1_CH4, Touch9)              32 ├── GND
 GPIO33─┤ 8  (ADC1_CH5, Touch8)              31 ├── GPIO19
 GPIO25─┤ 9  (DAC1, ADC2_CH8)                30 ├── GPIO18
 GPIO26─┤10  (DAC2, ADC2_CH9)                29 ├── GPIO5
 GPIO27─┤11  (ADC2_CH7, Touch7)              28 ├── GPIO17
 GPIO14─┤12  (ADC2_CH6, Touch6)              27 ├── GPIO16
 GPIO12─┤13  (ADC2_CH5, Touch5)              26 ├── GPIO4
  GND ──┤14                                  25 ├── GPIO0  (Boot)
 GPIO13─┤15  (ADC2_CH4, Touch4)              24 ├── GPIO2
  SD2 ──┤16  (GPIO9)                         23 ├── GPIO15 (ADC2_CH3)
  SD3 ──┤17  (GPIO10)                        22 ├── GPIO8  (SD1)
  CMD ──┤18  (GPIO11)                        21 ├── GPIO7  (SD0)
  5V  ──┤19                                  20 ├── GPIO6  (CLK)
         └───────────────────────────────────────┘
                        ▲
                   USB Port (Micro USB / USB-C)
```

> 📝 **Pilih GPIO untuk Buttons:**
> 
> Gunakan GPIO yang support **internal pull-up** dan bukan **input-only**:
> - ✅ **Recommended:** GPIO 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
> - ❌ **Hindari:** GPIO 34, 35 (input-only, no pull-up)
> - ❌ **Hindari:** GPIO 0, 2 (dipakai saat boot)
> - ❌ **Hindari:** GPIO 6-11 (connected to SPI flash)

### 4.2 Wiring 24 Physical Buttons

#### **GPIO Pin Assignment untuk 24 Buttons**

Mapping default (bisa disesuaikan di `esp32_button_monitor/main.py`):

| Button Name | Function | GPIO Pin |
|-------------|----------|----------|
| mixer | Mixer Motor ON/OFF | GPIO 13 |
| konveyor_atas | Conveyor Atas (Cement) | GPIO 12 |
| konveyor_bawah | Conveyor Bawah (Aggregate) | GPIO 14 |
| vibrator | Vibrator ON/OFF | GPIO 27 |
| klakson | Horn/Klakson | GPIO 26 |
| pintu_mixer | Mixer Door Open/Close | GPIO 25 |
| silo_1 | Cement Silo 1 Valve | GPIO 33 |
| silo_2 | Cement Silo 2 Valve | GPIO 32 |
| silo_3 | Cement Silo 3 Valve | GPIO 35 |
| silo_4 | Cement Silo 4 Valve | GPIO 34 |
| silo_5 | Cement Silo 5 Valve | GPIO 39 |
| silo_6 | Cement Silo 6 Valve | GPIO 36 |
| bin_pasir_1 | Sand Bin 1 Valve | GPIO 4 |
| bin_pasir_2 | Sand Bin 2 Valve | GPIO 16 |
| bin_batu_1 | Stone Bin 1 Valve | GPIO 17 |
| bin_batu_2 | Stone Bin 2 Valve | GPIO 5 |
| hopper_pasir | Sand Hopper Discharge | GPIO 18 |
| hopper_batu | Stone Hopper Discharge | GPIO 19 |
| tangki_air | Water Tank Valve | GPIO 21 |
| hopper_air | Water Hopper Discharge | GPIO 22 |
| semen_discharge | Cement Discharge Valve | GPIO 23 |
| additive | Additive Valve | GPIO 15 |
| emergency_stop | Emergency Stop | GPIO 2 |
| mode_auto | Auto Mode Toggle | GPIO 0 |

> 💡 **Custom Mapping:** Jika Anda perlu custom GPIO assignment, edit array `BUTTON_PINS` di file `esp32_button_monitor/main.py`.

#### **Wiring Diagram per Button**

**Single Button Wiring:**

```
 Physical Button (Momentary Push Button, NO):
 
   Terminal 1                Terminal 2
       │                         │
       │                         │
       ▼                         ▼
    ┌─────────────────────────────┐
    │  ●                        ● │  ◄─ Button terminals
    │    ╱                        │
    │   ╱  (Normally Open)        │
    │  ●                          │
    └─────────────────────────────┘
       │                         │
       │                         │
       └────► GPIO XX (ESP32)    └────► GND (ESP32)
       
 ESP32 Internal Configuration:
 GPIO XX ──┬──[10kΩ Pull-up]──► 3.3V  (internal pull-up resistor)
           │
           └──[Button]──► GND
           
 Logic:
 - Button NOT pressed: GPIO reads HIGH (3.3V)
 - Button pressed:     GPIO reads LOW  (0V, shorted to GND)
```

**Mengapa Normally Open (NO)?**
- ESP32 menggunakan **internal pull-up resistor** (10kΩ)
- GPIO default **HIGH** (3.3V)
- Saat button **ditekan**, GPIO **SHORT ke GND** → reads **LOW**
- Ini lebih reliable dan tidak butuh external resistor

#### **Complete Wiring Diagram (24 Buttons)**

```
 ESP32 DevKit ────────► 24 Buttons ────────► Common Ground
 
 ┌──────────────┐      ┌────────────────┐
 │   ESP32      │      │  Button Panel  │
 │   DevKit     │      │  (24 Buttons)  │
 ├──────────────┤      ├────────────────┤
 │ GPIO 13 ├───────────┤ Mixer          │
 │ GPIO 12 ├───────────┤ Konveyor Atas  │
 │ GPIO 14 ├───────────┤ Konveyor Bawah │
 │ GPIO 27 ├───────────┤ Vibrator       │
 │ GPIO 26 ├───────────┤ Klakson        │
 │ GPIO 25 ├───────────┤ Pintu Mixer    │
 │ GPIO 33 ├───────────┤ Silo 1         │
 │ GPIO 32 ├───────────┤ Silo 2         │
 │ GPIO 35 ├───────────┤ Silo 3         │
 │ GPIO 34 ├───────────┤ Silo 4         │
 │ GPIO 39 ├───────────┤ Silo 5         │
 │ GPIO 36 ├───────────┤ Silo 6         │
 │ GPIO 4  ├───────────┤ Bin Pasir 1    │
 │ GPIO 16 ├───────────┤ Bin Pasir 2    │
 │ GPIO 17 ├───────────┤ Bin Batu 1     │
 │ GPIO 5  ├───────────┤ Bin Batu 2     │
 │ GPIO 18 ├───────────┤ Hopper Pasir   │
 │ GPIO 19 ├───────────┤ Hopper Batu    │
 │ GPIO 21 ├───────────┤ Tangki Air     │
 │ GPIO 22 ├───────────┤ Hopper Air     │
 │ GPIO 23 ├───────────┤ Semen Disch.   │
 │ GPIO 15 ├───────────┤ Additive       │
 │ GPIO 2  ├───────────┤ Emergency Stop │
 │ GPIO 0  ├───────────┤ Mode Auto      │
 │         │      │                     │
 │ GND  ├───┬────┴─────────────────────┼─► Common GND Terminal
 │      │   │            All button     │   (semua button terminal 2
 │      │   │            terminal 2     │    ke sini)
 └──────┴───┴──────────────────────────┴───
```

**Praktis: Terminal Block Wiring**

Untuk mempermudah wiring, gunakan **terminal block** atau **breadboard**:

```
 ┌────────────────────────────────────────────────────┐
 │  TERMINAL BLOCK (26 positions)                     │
 ├────────────────────────────────────────────────────┤
 │  [ GPIO13 ][ GPIO12 ][ GPIO14 ]...[ GPIO0 ][ GND ] │
 │     │         │         │             │       │    │
 └─────┼─────────┼─────────┼─────────────┼───────┼────┘
       │         │         │             │       │
       ▼         ▼         ▼             ▼       ▼
    Button1   Button2   Button3  ...  Button24  Common GND
    Term1     Term1     Term1          Term1     (All Button Term2)
```

**Langkah Wiring:**

1. **Siapkan breadboard** atau terminal block (26 positions min)

2. **Sambungkan ESP32 ke terminal block:**
   - Gunakan male-female jumper wires
   - 1 wire per GPIO (total 24 wires)
   - 1-2 wires untuk GND (common ground)

3. **Sambungkan Button Terminal 1** ke corresponding GPIO terminal di block

4. **Sambungkan semua Button Terminal 2** ke **common GND terminal**

5. **Label setiap terminal/wire** dengan jelas (sangat penting untuk troubleshooting!)

#### **Testing Continuity (Multimeter)**

Sebelum power ON ESP32, test setiap button dengan multimeter:

1. **Set multimeter** ke **Continuity mode** (🔊 icon)

2. **Test button:**
   - Probe 1 → Button Terminal 1
   - Probe 2 → Button Terminal 2
   - **Button NOT pressed:** Multimeter **SILENT** (open circuit) ✅
   - **Button PRESSED:** Multimeter **BEEP** (short circuit) ✅

3. **Test semua 24 buttons** satu per satu

4. **Jika ada button yang beep terus (saat tidak ditekan):**
   - Button stuck atau rusak → ganti button

### 4.3 Power Supply ESP32

ESP32 DevKit butuh **5V DC, 500mA - 1A** untuk operasi stabil.

```
 Power Supply Options:
 
 OPTION 1: USB Power dari PC (Development/Testing)
 ┌─────────┐      USB Cable       ┌───────────┐
 │  PC     ├──────────────────────┤  ESP32    │
 │  USB    │   (Micro USB / C)    │  DevKit   │
 └─────────┘                      └───────────┘
 
 OPTION 2: Wall Adapter 5V (Production)
 ┌─────────┐      USB Cable       ┌───────────┐
 │ 5V 2A   ├──────────────────────┤  ESP32    │
 │ Adapter │   (Micro USB / C)    │  DevKit   │
 └─────────┘                      └───────────┘
 
 OPTION 3: External 5V dari Power Supply Industrial
 ┌──────────────┐   Jumper Wire   ┌───────────┐
 │ 5V PSU       ├─────────────────┤  ESP32    │
 │ +5V  →  VIN  │                 │  VIN pin  │
 │ GND  →  GND  │                 │  GND pin  │
 └──────────────┘                 └───────────┘
 ⚠️ JANGAN sambungkan 5V ke 3V3 pin! (max 3.3V saja)
```

**Recommended untuk Production:**
- Gunakan **USB wall adapter 5V 2A** berkualitas baik (bukan adapter murahan)
- Atau **industrial grade 5V DC power supply** dengan short-circuit protection

⚠️ **PERHATIAN POWER:**
- **JANGAN** sambungkan 5V ke pin 3V3 (hanya boleh 3.3V max!)
- **JANGAN** gunakan power lebih dari 5.5V ke VIN pin (bisa rusak regulator)
- **PASTIKAN** grounding 24VDC system (untuk buttons) **terpisah** dari GND ESP32 (untuk keamanan)

✅ **ESP32 Hardware Installation Complete!**

Lanjut ke [Section 7](#7-instalasi-esp32-button-monitor-opsional) untuk instalasi firmware.

[🔝 Kembali ke Daftar Isi](#-daftar-isi)

---

## 5. INSTALASI SOFTWARE - FRONTEND (HMI APP)

### 5.1 Instalasi Node.js & npm

#### **Windows**

1. **Download Node.js LTS:**
   - Kunjungi: https://nodejs.org/
   - Download **LTS version** (misal: v18.20.0 atau lebih baru)
   - Pilih **Windows Installer (.msi)** - 64-bit

2. **Jalankan Installer:**
   ```
   node-v18.20.0-x64.msi  ◄─ Double-click
   
   Installation Wizard:
   
   [Welcome Screen]
   ├─► Next
   │
   [License Agreement]
   ├─► Accept → Next
   │
   [Destination Folder]
   ├─► Default: C:\Program Files\nodejs\
   ├─► Next
   │
   [Custom Setup]
   ├─► ✅ Node.js runtime
   ├─► ✅ npm package manager
   ├─► ✅ Add to PATH  ◄─ PENTING! Harus di-check
   ├─► Next
   │
   [Tools for Native Modules]
   ├─► (Optional) Check if needed
   ├─► Next
   │
   [Install]
   └─► Install → Wait... → Finish
   ```

3. **Verifikasi Instalasi:**
   - Buka **Command Prompt** (Windows Key + R → ketik `cmd` → Enter)
   ```cmd
   node --version
   ```
   Expected output:
   ```
   v18.20.0
   ```

   ```cmd
   npm --version
   ```
   Expected output:
   ```
   10.8.0
   ```

   ✅ Jika kedua command menampilkan versi, instalasi berhasil!

#### **Linux (Ubuntu/Debian)**

**Method 1: Via NodeSource Repository (Recommended)**

```bash
# Update system
sudo apt update

# Install curl (jika belum ada)
sudo apt install curl -y

# Download dan setup NodeSource repo untuk Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js (includes npm)
sudo apt install nodejs -y

# Verifikasi
node --version
npm --version
```

**Method 2: Via NVM (Node Version Manager) - Lebih Fleksibel**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc
# Atau untuk zsh:
# source ~/.zshrc

# Install Node.js LTS
nvm install --lts

# Set default
nvm use --lts
nvm alias default lts/*

# Verifikasi
node --version
npm --version
```

### 5.2 Clone Project dari Repository

```bash
# Navigate ke folder yang Anda inginkan (misal: Documents)
cd ~/Documents  # Linux/Mac
# atau
cd C:\Users\YourName\Documents  # Windows

# Clone repository (ganti URL dengan repo Anda)
git clone https://github.com/your-username/batching-plant-hmi-replica.git

# Masuk ke folder project
cd batching-plant-hmi-replica

# Cek struktur folder
ls -la  # Linux/Mac
# atau
dir  # Windows
```

Expected output:
```
drwxr-xr-x  10 user  staff    320 Nov 14 10:00 .
drwxr-xr-x  20 user  staff    640 Nov 14 09:59 ..
-rw-r--r--   1 user  staff    123 Nov 14 10:00 .gitignore
-rw-r--r--   1 user  staff   2345 Nov 14 10:00 README.md
drwxr-xr-x   5 user  staff    160 Nov 14 10:00 build
drwxr-xr-x   3 user  staff     96 Nov 14 10:00 electron
-rw-r--r--   1 user  staff    567 Nov 14 10:00 index.html
-rw-r--r--   1 user  staff  12345 Nov 14 10:00 package.json
drwxr-xr-x   8 user  staff    256 Nov 14 10:00 raspberry_pi
drwxr-xr-x  12 user  staff    384 Nov 14 10:00 src
-rw-r--r--   1 user  staff    890 Nov 14 10:00 vite.config.ts
...
```

### 5.3 Install Dependencies

```bash
# Pastikan Anda di folder project root
pwd  # Harus menampilkan: .../batching-plant-hmi-replica

# Install semua dependencies dari package.json
npm install

# Output (akan install ratusan packages):
# npm WARN deprecated ...
# npm WARN deprecated ...
# 
# added 1234 packages, and audited 1235 packages in 45s
# 
# 123 packages are looking for funding
#   run `npm fund` for details
# 
# found 0 vulnerabilities
```

> ⏳ **Note:** Proses install bisa memakan waktu 1-5 menit tergantung koneksi internet dan spek PC.

Jika ada error saat `npm install`:

**Error: EACCES permission denied**
```bash
# Linux/Mac - Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

**Error: gyp ERR! (Windows)**
```cmd
# Install Visual Studio Build Tools
# Download dari: https://visualstudio.microsoft.com/downloads/
# Pilih: Build Tools for Visual Studio 2022
# Install dengan: "Desktop development with C++"
```

### 5.4 Konfigurasi Environment

#### **WebSocket Backend URL Configuration**

Edit file `src/hooks/useRaspberryPi.ts` untuk set WebSocket URL backend:

```typescript
// File: src/hooks/useRaspberryPi.ts
// Line ~40-50

const WEBSOCKET_URL = 'ws://localhost:8765';  // ◄─ Default (development)

// PRODUCTION: Ganti dengan IP PC/Server yang menjalankan backend
// const WEBSOCKET_URL = 'ws://192.168.1.100:8765';
```

**Skenario:**

1. **Development (PC yang sama untuk frontend & backend):**
   - Use: `ws://localhost:8765` ✅

2. **Production (HMI di PC lain, backend di Server):**
   - Use: `ws://192.168.1.100:8765` (ganti IP dengan IP server backend)

3. **Electron App (Production):**
   - Use: `ws://localhost:8765` (jika backend di PC yang sama)
   - Atau IP server jika backend remote

> 💡 **TIP:** Untuk production, bisa gunakan environment variable:
> ```typescript
> const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8765';
> ```
> Lalu set di `.env.local`:
> ```
> VITE_WEBSOCKET_URL=ws://192.168.1.100:8765
> ```

### 5.5 Menjalankan Aplikasi

#### **A. Development Mode (Browser-Based)**

Development mode cocok untuk:
- Testing & debugging
- Development & coding
- Hot-reload saat edit code

```bash
# Jalankan dev server
npm run dev

# Output:
#   VITE v4.5.0  ready in 1234 ms
# 
#   ➜  Local:   http://localhost:8080/
#   ➜  Network: http://192.168.1.50:8080/
#   ➜  press h to show help
```

**Akses HMI:**
1. Buka browser (Chrome/Edge recommended)
2. Navigate to: http://localhost:8080/
3. HMI app akan load

**Hot Reload:**
- Saat Anda edit file di `src/`, browser akan **auto-refresh**
- Sangat membantu untuk development

**Stop Dev Server:**
- Press `Ctrl + C` di terminal

---

#### **B. Production Build (Static Files)**

Build static files untuk production deployment:

```bash
# Build untuk production
npm run build

# Output:
# vite v4.5.0 building for production...
# ✓ 1234 modules transformed.
# dist/index.html                  0.45 kB │ gzip:  0.30 kB
# dist/assets/index-abc123.css    45.67 kB │ gzip: 12.34 kB
# dist/assets/index-def456.js    234.56 kB │ gzip: 78.90 kB
# ✓ built in 12.34s
```

Files akan di-generate di folder `dist/`:

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.css
│   ├── index-def456.js
│   └── ... (images, fonts, dll)
└── ...
```

**Deploy Production Build:**

1. **Option 1: Local Web Server (serve)**
   ```bash
   # Install serve globally
   npm install -g serve

   # Serve dist folder
   serve -s dist -l 8080

   # Access: http://localhost:8080/
   ```

2. **Option 2: Copy ke Web Server (Apache/Nginx)**
   ```bash
   # Copy semua isi dist/ ke webroot
   sudo cp -r dist/* /var/www/html/batch-plant-hmi/
   
   # Set permissions
   sudo chown -R www-data:www-data /var/www/html/batch-plant-hmi/
   
   # Access via: http://server-ip/batch-plant-hmi/
   ```

---

#### **C. Electron Desktop App (Recommended untuk Production)**

Electron app cocok untuk:
- Production deployment di PC Industrial
- Full-screen kiosk mode
- Offline operation
- Integrated dengan OS (auto-start, system tray, dll)

**Step 1: Verify Electron Dependencies**

```bash
# Check package.json - ensure electron dependencies exist
cat package.json | grep electron

# Expected output:
# "electron": "^28.3.3",
# "electron-builder": "^24.13.3",
```

Jika tidak ada:
```bash
npm install electron electron-builder concurrently wait-on --save-dev
```

**Step 2: Verify Electron Config**

File `electron/main.js` sudah ada di project. Cek konfigurasinya:

```javascript
// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,  // ◄─ Full-screen mode
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
```

**Step 3: Build Icon (Optional tapi Recommended)**

Icon files sudah ada di `build/icon.png` dan `build/icon.ico`. Jika ingin custom:

```bash
# Windows: Use icon.ico (256x256 px)
# Linux: Use icon.png (512x512 px)

# Replace files:
# build/icon.ico  (Windows)
# build/icon.png  (Linux)
```

**Step 4: Run Electron in Development**

```bash
# Development mode with hot-reload
npm run electron:dev

# Output:
# > concurrently "npm run dev" "wait-on http://localhost:8080 && electron ."
# 
# [0] VITE v4.5.0  ready in 1234 ms
# [0]   ➜  Local:   http://localhost:8080/
# [1] Waiting for http://localhost:8080...
# [1] Electron app started
```

Electron window akan terbuka dengan HMI app.

**Step 5: Build Electron App untuk Production**

**Windows:**

```bash
# Build executable untuk Windows
npm run electron:build:win

# Output:
# • electron-builder  version=24.13.3
# • loaded configuration  file=package.json
# • building        target=nsis arch=x64
# • packaging       platform=win32 arch=x64 electron=28.3.3
# • building block map  blockMapFile=dist_electron\batch-plant-hmi-setup.exe.blockmap
# • building        target=nsis file=dist_electron\batch-plant-hmi-setup.exe

# Installer akan di-generate di folder: dist_electron/
```

Files yang di-generate:
```
dist_electron/
├── batch-plant-hmi-setup.exe        ◄─ Installer (NSIS)
├── batch-plant-hmi-setup.exe.blockmap
└── win-unpacked/                    ◄─ Portable version (tanpa install)
    ├── batch-plant-hmi.exe
    ├── resources/
    └── ...
```

**Linux:**

```bash
# Build AppImage untuk Linux
npm run electron:build:linux

# Output:
# • electron-builder  version=24.13.3
# • loaded configuration  file=package.json
# • building        target=AppImage arch=x64
# • building        file=dist_electron/batch-plant-hmi-1.0.0.AppImage

# AppImage akan di-generate di: dist_electron/
```

Files yang di-generate:
```
dist_electron/
├── batch-plant-hmi-1.0.0.AppImage   ◄─ Executable AppImage
└── linux-unpacked/                  ◄─ Unpacked version
    ├── batch-plant-hmi
    └── resources/
```

**Step 6: Install & Run Production App**

**Windows:**

1. **Run Installer:**
   ```cmd
   dist_electron\batch-plant-hmi-setup.exe
   ```

2. **Follow Installation Wizard:**
   - Pilih folder instalasi (default: `C:\Program Files\Batch Plant HMI\`)
   - Pilih "Create desktop shortcut" ✅
   - Install

3. **Run App:**
   - Double-click desktop shortcut
   - Atau: Start Menu → Batch Plant HMI

**Linux:**

1. **Make AppImage executable:**
   ```bash
   chmod +x dist_electron/batch-plant-hmi-1.0.0.AppImage
   ```

2. **Run AppImage:**
   ```bash
   ./dist_electron/batch-plant-hmi-1.0.0.AppImage
   ```

   Atau double-click di file manager.

3. **Optional - Create Desktop Entry:**
   ```bash
   # Copy to applications folder
   cp dist_electron/batch-plant-hmi-1.0.0.AppImage ~/Applications/
   
   # Create .desktop file
   nano ~/.local/share/applications/batch-plant-hmi.desktop
   ```

   Isi file:
   ```ini
   [Desktop Entry]
   Name=Batch Plant HMI
   Exec=/home/user/Applications/batch-plant-hmi-1.0.0.AppImage
   Icon=/path/to/icon.png
   Type=Application
   Categories=Utility;
   ```

✅ **Frontend HMI Installation Complete!**

**Next Steps:**
- Pastikan backend Python controller sudah running (Section 6)
- Test koneksi WebSocket antara HMI dan backend
- Login dengan user: `admin` / password: `admin`

[🔝 Kembali ke Daftar Isi](#-daftar-isi)

---

_[Catatan: Ini adalah bagian pertama dari panduan. Bagian selanjutnya (Section 6-12) akan dibuat di file yang sama atau file terpisah jika terlalu panjang. Silakan konfirmasi jika Anda ingin saya lanjutkan dengan section berikutnya.]_

---

## CHANGELOG

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 2.0 | 2025-11-14 | Initial comprehensive installation guide |
| 2.1 | TBD | Section 6-12 (Backend, ESP32, Testing, Config, Troubleshooting, Maintenance) |

---

## KONTAK SUPPORT

📧 **Email:** support@farikaraya.com  
📞 **Hotline:** +62-xxx-xxxx-xxxx  
💬 **WhatsApp:** +62-xxx-xxxx-xxxx  
🌐 **Website:** https://www.farikaraya.com

---

**© 2025 PT Farika Raya Beton. All Rights Reserved.**