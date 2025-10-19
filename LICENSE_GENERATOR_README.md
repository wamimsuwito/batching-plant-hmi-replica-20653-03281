# LISA License Key Generator - Panduan Penggunaan

## 🔐 **CONFIDENTIAL - INTERNAL USE ONLY**

File ini adalah dokumentasi untuk License Key Generator yang hanya untuk digunakan oleh PT Farika Riau Perkasa Indonesia.

---

## 📋 File yang Sudah Dibuat

### 1. **license-generator.html**
   - **Location:** Root project folder
   - **Purpose:** Tool untuk generate license key
   - **Type:** Standalone HTML file (bisa buka di browser)
   - **⚠️ PENTING:** Jangan share file ini ke siapapun!

### 2. **Licensing System di Aplikasi HMI**
   - Sudah terintegrasi di aplikasi Electron
   - Otomatis cek license saat aplikasi start
   - Dialog aktivasi muncul jika license tidak valid/expired

---

## 🚀 Cara Menggunakan License Generator

### **Step 1: Buka License Generator Tool**

1. Buka file `license-generator.html` di browser (Chrome/Edge/Firefox)
2. Anda akan melihat form generator yang simple dan professional

### **Step 2: Terima Hardware ID dari Customer**

Customer akan kirim Hardware ID dari aplikasi mereka via:
- WhatsApp: 081271963847
- Email: farika@example.com

**Contoh Hardware ID:**
```
A3B2C4D5E6F78901
```

### **Step 3: Generate License Key**

1. **Paste Hardware ID** ke field "Hardware ID"
2. **Set Expiration Date:**
   - Default: 10 tahun dari sekarang
   - Bisa ubah manual dengan date picker
   - Atau klik quick buttons:
     - **+1 Year** = 1 tahun
     - **+5 Years** = 5 tahun
     - **+10 Years** = 10 tahun
3. **Customer Name (Optional):** Isi nama customer untuk referensi
4. Klik **"Generate License Key"**

### **Step 4: Copy & Kirim ke Customer**

1. License key akan muncul dalam format:
   ```
   LISA-XXXXX-XXXXX-XXXXX-XXXXX
   ```
2. Klik **"Copy License Key to Clipboard"**
3. Kirim ke customer via WhatsApp/Email

---

## 📊 Workflow dengan Customer

### **Skenario 1: Instalasi Baru**

```
[Customer] Install aplikasi HMI
     ↓
[App] Tampilkan dialog aktivasi dengan Hardware ID
     ↓
[Customer] Copy Hardware ID → kirim ke Anda (PT Farika)
     ↓
[Anda] Buka license-generator.html → Generate license key
     ↓
[Anda] Kirim license key ke customer
     ↓
[Customer] Input license key di dialog aktivasi
     ↓
[App] Aktif sampai expiry date (10 tahun)
```

### **Skenario 2: License Expired (Renewal)**

```
[App] Deteksi license expired → tampil dialog
     ↓
[Customer] Kirim Hardware ID yang SAMA ke Anda
     ↓
[Anda] Cek di Excel/tracking: ini customer lama
     ↓
[Anda] Generate license baru dengan Hardware ID yang sama
     ↓
[Anda] Kirim license key baru dengan expiry +10 tahun lagi
     ↓
[Customer] Input license key baru
     ↓
[App] Aktif sampai 2045
```

**⚠️ CATATAN:** Hardware ID tetap sama untuk komputer yang sama, jadi Anda tahu ini renewal, bukan customer baru.

---

## 🗂️ Tracking Customer (PENTING!)

Anda **wajib** punya tracking database untuk 500 komputer. Buat Excel dengan format:

| No | Install Date | Customer Name | Location | Hardware ID | License Key | Issue Date | Expiry Date | Status | Notes |
|----|--------------|---------------|----------|-------------|-------------|------------|-------------|--------|-------|
| 1 | 2025-10-19 | PT ABC | Jakarta | A3B2C4... | LISA-A3B2C-... | 2025-10-19 | 2035-10-19 | Active | Plant A |
| 2 | 2025-11-15 | CV XYZ | Surabaya | B4C5D6... | LISA-B4C5D-... | 2025-11-15 | 2035-11-15 | Active | Plant B |
| 3 | 2025-12-03 | PT DEF | Bandung | C6E7F8... | LISA-C6E7F-... | 2025-12-03 | 2035-12-03 | Active | Plant C |

### **Manfaat Tracking:**
✅ Tahu mana customer yang sudah aktivasi  
✅ Reminder renewal 30 hari sebelum expired  
✅ Prevent duplicate license untuk Hardware ID yang sama  
✅ History renewal dan payment  
✅ Support customer lebih cepat  

---

## 🔐 Keamanan License System

### **Enkripsi:**
- AES-256 encryption (standar militer)
- Secret key tertanam di code (di-obfuscate)
- Hardware ID + Expiry Date di-encrypt jadi license key

### **Hardware Binding:**
- License key **hanya valid** untuk Hardware ID tertentu
- Jika copy license file ke komputer lain → **TIDAK BISA JALAN**
- Jika customer ganti motherboard/HDD → Hardware ID berubah → perlu license baru

### **Expiration Date:**
- Expiry date di-encrypt dalam license key
- Customer tidak bisa ubah tanggal komputer untuk bypass
- App cek expiry date setiap kali start

### **File Protection:**
- License disimpan encrypted di `%APPDATA%/batch-plant-hmi/license.dat`
- Jika file dihapus → dialog aktivasi muncul lagi
- Jika file diubah manual → validasi gagal

---

## ⚠️ Troubleshooting

### **Customer: "Hardware ID tidak muncul"**
**Solusi:** Pastikan aplikasi berjalan di Electron (bukan browser). Jika di browser, fitur licensing tidak aktif.

### **Customer: "License key invalid"**
**Penyebab:**
- Hardware ID salah → cek lagi Hardware ID yang digunakan
- Typo saat input license key → minta customer copy-paste dengan hati-hati
- License key untuk komputer lain → generate ulang dengan Hardware ID yang benar

### **Customer: "License expired tapi baru 1 bulan install"**
**Penyebab:** Anda set expiry date terlalu pendek saat generate.
**Solusi:** Generate license baru dengan expiry date yang benar (10 tahun).

### **Customer: "Ganti komputer, license tidak bisa dipakai"**
**Penjelasan:** Ini memang by design. License hardware-locked.
**Solusi:** 
- Minta Hardware ID komputer baru
- Generate license baru untuk Hardware ID baru
- Charge customer untuk license komputer tambahan (atau gratis tergantung kebijakan Anda)

### **Customer: "Upgrade RAM/HDD, masih bisa pakai license lama?"**
**Jawaban:** 
- Upgrade RAM: **Bisa** (Hardware ID tetap sama)
- Ganti HDD/SSD: **Mungkin berubah** (tergantung komponen lain)
- Ganti Motherboard: **Pasti berubah** (perlu license baru)

---

## 💰 Strategi Pricing (Rekomendasi)

### **Option 1: License 10 Tahun (One-Time Payment)**
```
Rp XX.XXX.XXX per unit
- License valid 10 tahun
- Free support 1 tahun pertama
- Renewal tahun ke-11: Rp XX.XXX.XXX (bisa lebih murah)
```

### **Option 2: Annual Subscription**
```
Rp X.XXX.XXX per unit per tahun
- Revenue berulang setiap tahun
- Include support dan update
- Automatic renewal reminder via tracking Excel
```

### **Option 3: Hybrid**
```
Year 1: Rp XX.XXX.XXX (license fee + setup)
Year 2-10: Rp X.XXX.XXX/tahun (maintenance)
Year 11+: Rp XX.XXX.XXX (renewal)
```

---

## 🎯 Tips Operasional

### **1. Backup License Generator**
- Simpan `license-generator.html` di:
  - ✅ Laptop pribadi Anda
  - ✅ USB drive khusus
  - ✅ Cloud storage pribadi (Google Drive/Dropbox)
- **❌ JANGAN upload ke GitHub public repo**
- **❌ JANGAN kirim ke customer**

### **2. Template WA untuk Customer**
```
Terima kasih sudah menggunakan Batching Plant HMI PT Farika! 🚀

Berikut license key Anda:
━━━━━━━━━━━━━━━━━
License Key:
LISA-XXXXX-XXXXX-XXXXX-XXXXX

Valid Until: 19 Oktober 2035
━━━━━━━━━━━━━━━━━

Cara Aktivasi:
1. Paste license key di dialog aktivasi
2. Klik "Activate"
3. Aplikasi siap digunakan!

Jika ada masalah, hubungi:
📱 WA: 081271963847

Terima kasih! 🙏
```

### **3. Renewal Reminder (30 Hari Sebelum Expired)**
```
Dear Customer,

License HMI Anda akan expired dalam 30 hari:
━━━━━━━━━━━━━━━━━
Customer: PT ABC Jakarta
Expiry Date: 19 Oktober 2035
━━━━━━━━━━━━━━━━━

Untuk renewal, silakan hubungi:
📱 WA: 081271963847
📧 Email: farika@example.com

Renewal process cepat, cukup kirim Hardware ID Anda.

Terima kasih!
PT Farika Riau Perkasa Indonesia
```

---

## 🔄 Update License Generator (Jika Perlu)

Jika Anda ingin update algorithm atau expiry default:

1. Buka `license-generator.html`
2. Edit di bagian:
   - `SECRET_KEY` → untuk ganti encryption key (HATI-HATI! semua license lama jadi invalid)
   - `setExpiryYears(10)` → untuk ganti default expiry (line ~206)
   - Styling CSS → untuk ubah tampilan

**⚠️ WARNING:** Jangan ganti `SECRET_KEY` kecuali sangat terpaksa! Ini akan invalidate semua license yang sudah diissue.

---

## 📞 Support

Jika ada masalah dengan license system:

1. Cek console log di browser (F12) saat generate license
2. Cek console log di app Electron saat aktivasi
3. Verify Hardware ID sama persis (case-sensitive)
4. Test dengan komputer lain untuk confirm issue

---

## ✅ Checklist Sebelum Deploy ke Customer

- [ ] Test generate license key di `license-generator.html`
- [ ] Test aktivasi di aplikasi HMI
- [ ] Test license expired scenario (set expiry 1 hari, tunggu 1 hari)
- [ ] Test copy license file ke komputer lain (harus gagal)
- [ ] Test renewal dengan Hardware ID yang sama
- [ ] Siapkan Excel tracking
- [ ] Siapkan template WA/Email untuk customer
- [ ] Backup `license-generator.html` di tempat aman

---

## 🎓 FAQ

**Q: Berapa lama generate 1 license key?**  
A: ~5-10 detik (instant di browser modern)

**Q: Bisa generate 500 license sekaligus?**  
A: Tidak perlu, karena instalasi bertahap. Generate saat ada order saja.

**Q: Bagaimana jika lupa Hardware ID customer?**  
A: Minta customer buka app → dialog aktivasi → copy Hardware ID lagi. Atau cek di Excel tracking Anda.

**Q: Bisa refund license jika customer tidak jadi pakai?**  
A: Kebijakan Anda sendiri. Tapi secara teknis, license sudah generated dan tidak bisa di-"un-generate".

**Q: Customer bisa pakai 1 license untuk 2 komputer?**  
A: **TIDAK BISA**. License hardware-locked. Butuh 2 license key berbeda untuk 2 komputer.

---

**END OF DOCUMENTATION**

---

© 2025 PT Farika Riau Perkasa Indonesia  
Licensed by: Ambo Dalle  
WhatsApp: 081271963847
