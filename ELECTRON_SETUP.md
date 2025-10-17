# 🖥️ Setup Electron - Langkah Manual yang Diperlukan

Setup Electron sudah hampir selesai! Dependencies sudah terinstall dan file-file Electron sudah dibuat.

## ⚠️ Langkah Manual yang Harus Dilakukan:

### 1. Update `package.json`

Karena package.json adalah file read-only di Lovable, Anda perlu menambahkan konfigurasi ini secara manual setelah export ke GitHub:

**Tambahkan di bagian atas (setelah "private": true):**

```json
{
  "name": "batch-plant-hmi",
  "version": "1.0.0",
  "description": "Batch Plant Control System - Industrial HMI",
  "author": "Industrial Automation",
  "license": "MIT",
  "main": "electron/main.js",
  "private": true,
```

**Tambahkan scripts Electron:**

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  
  "electron": "electron .",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:win": "npm run build && electron-builder --win --x64",
  "electron:build:mac": "npm run build && electron-builder --mac",
  "electron:build:linux": "npm run build && electron-builder --linux"
},
```

**Tambahkan konfigurasi electron-builder di akhir file:**

```json
"build": {
  "appId": "com.batchplant.hmi",
  "productName": "Batch Plant HMI",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "extraMetadata": {
    "main": "electron/main.js"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico",
    "artifactName": "${productName}-Setup-${version}.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Batch Plant HMI"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "category": "public.app-category.productivity",
    "artifactName": "${productName}-${version}.${ext}"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Utility",
    "artifactName": "${productName}-${version}.${ext}"
  }
}
```

### 2. Install satu dependency tambahan

Setelah export ke GitHub dan clone ke lokal, install:

```bash
npm install cross-env --save-dev
```

### 3. Update `.gitignore` (Manual)

Tambahkan di file `.gitignore`:

```
# Electron
release/
dist-electron/
*.exe
*.dmg
*.AppImage
*.deb
```

### 4. Buat Icon Aplikasi

Folder `build/` sudah dibuat. Anda perlu menambahkan icon files:

- **build/icon.ico** - Windows icon (256x256 atau lebih)
- **build/icon.icns** - macOS icon
- **build/icon.png** - Linux icon (512x512)

**Tool untuk membuat icons:**
- https://www.icoconverter.com/
- https://cloudconvert.com/png-to-icns

Atau gunakan favicon.ico yang sudah ada sebagai starting point.

---

## 🚀 Cara Menjalankan (Setelah Setup Manual)

### Development Mode:

```bash
# Export project ke GitHub
# Clone ke komputer lokal
git clone [URL_REPO_ANDA]
cd batching-plant-hmi-replica

# Install dependencies
npm install

# Install cross-env
npm install cross-env --save-dev

# Jalankan development mode
npm run electron:dev
```

Aplikasi Electron akan terbuka dengan hot reload aktif.

---

### Build Production (Windows):

```bash
# Build installer
npm run electron:build:win

# Output ada di folder release/
# File: Batch Plant HMI-Setup-1.0.0.exe
```

Double-click installer untuk install aplikasi.

---

## ✅ File yang Sudah Dibuat:

- ✅ `electron/main.js` - Main process Electron
- ✅ `electron/preload.js` - Preload script untuk keamanan
- ✅ `electron/autostart.js` - Utility untuk auto-start (opsional)
- ✅ `build/` folder - Untuk icon aplikasi
- ✅ `vite.config.ts` - Updated dengan `base: './'`
- ✅ Dependencies terinstall (electron, electron-builder, concurrently, wait-on)

---

## 📦 File yang Perlu Action Manual:

- ⚠️ `package.json` - Tambahkan "main", "scripts", dan "build" config
- ⚠️ `.gitignore` - Tambahkan Electron paths
- ⚠️ `build/icon.*` - Buat icon files untuk installer
- ⚠️ Install `cross-env` setelah export ke GitHub

---

## 🔧 Troubleshooting:

### Error: "Cannot find module 'electron'"
```bash
npm install
```

### Error: "Port 8080 already in use"
Matikan proses yang menggunakan port 8080 atau ubah port di `vite.config.ts`

### White screen saat buka app
```bash
npm run build
npm run electron:dev
```

### Installer tidak terbuat
Pastikan icon files ada di folder `build/`

---

## 📱 Koneksi ke Raspberry Pi:

Aplikasi Electron tetap bisa connect ke Raspberry Pi via WebSocket:

**Di komputer yang sama dengan Raspberry Pi:**
```
ws://localhost:8765
```

**Di network yang sama:**
```
ws://192.168.1.XXX:8765
```

Update IP address di `src/hooks/useRaspberryPi.ts` jika diperlukan.

---

## 🎯 Next Steps:

1. Export project ke GitHub
2. Clone ke komputer lokal
3. Edit `package.json` sesuai panduan di atas
4. Edit `.gitignore` 
5. Install `cross-env`
6. Buat icon files
7. Run `npm run electron:dev` untuk test
8. Run `npm run electron:build:win` untuk buat installer

---

Selamat! Setup Electron sudah 90% selesai. Tinggal langkah manual di atas dan aplikasi desktop Anda siap digunakan! 🎉
